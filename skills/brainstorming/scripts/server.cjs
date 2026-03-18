const crypto = require('crypto');
const http = require('http');
const fs = require('fs');
const path = require('path');
const os = require('os');

// ========== WebSocket Protocol (RFC 6455) ==========

const OPCODES = { TEXT: 0x01, CLOSE: 0x08, PING: 0x09, PONG: 0x0A };
const WS_MAGIC = '258EAFA5-E914-47DA-95CA-C5AB0DC85B11';

function computeAcceptKey(clientKey) {
  return crypto.createHash('sha1').update(clientKey + WS_MAGIC).digest('base64');
}

function encodeFrame(opcode, payload) {
  const fin = 0x80;
  const len = payload.length;
  let header;

  if (len < 126) {
    header = Buffer.alloc(2);
    header[0] = fin | opcode;
    header[1] = len;
  } else if (len < 65536) {
    header = Buffer.alloc(4);
    header[0] = fin | opcode;
    header[1] = 126;
    header.writeUInt16BE(len, 2);
  } else {
    header = Buffer.alloc(10);
    header[0] = fin | opcode;
    header[1] = 127;
    header.writeBigUInt64BE(BigInt(len), 2);
  }

  return Buffer.concat([header, payload]);
}

function decodeFrame(buffer) {
  if (buffer.length < 2) return null;

  const secondByte = buffer[1];
  const opcode = buffer[0] & 0x0F;
  const masked = (secondByte & 0x80) !== 0;
  let payloadLen = secondByte & 0x7F;
  let offset = 2;

  if (!masked) throw new Error('Client frames must be masked');

  if (payloadLen === 126) {
    if (buffer.length < 4) return null;
    payloadLen = buffer.readUInt16BE(2);
    offset = 4;
  } else if (payloadLen === 127) {
    if (buffer.length < 10) return null;
    payloadLen = Number(buffer.readBigUInt64BE(2));
    offset = 10;
  }

  const maskOffset = offset;
  const dataOffset = offset + 4;
  const totalLen = dataOffset + payloadLen;
  if (buffer.length < totalLen) return null;

  const mask = buffer.slice(maskOffset, dataOffset);
  const data = Buffer.alloc(payloadLen);
  for (let i = 0; i < payloadLen; i++) {
    data[i] = buffer[dataOffset + i] ^ mask[i % 4];
  }

  return { opcode, payload: data, bytesConsumed: totalLen };
}

// ========== Configuration ==========

const PORT = process.env.BRAINSTORM_PORT || (49152 + Math.floor(Math.random() * 16383));
const HOST = process.env.BRAINSTORM_HOST || '127.0.0.1';
const URL_HOST = process.env.BRAINSTORM_URL_HOST || (HOST === '127.0.0.1' ? 'localhost' : HOST);
// SECURITY: Use user's home directory instead of /tmp for file storage
const os = require('os');
const SCREEN_DIR = process.env.BRAINSTORM_DIR || path.join(os.homedir(), '.cache', 'superpowers', 'brainstorm');
const OWNER_PID = process.env.BRAINSTORM_OWNER_PID ? Number(process.env.BRAINSTORM_OWNER_PID) : null;

// ========== Security Configuration ==========

// Generate a random auth token for this session
const AUTH_TOKEN = crypto.randomBytes(32).toString('hex');
const MAX_MESSAGE_SIZE = 1024 * 1024; // 1MB max message size
const RATE_LIMIT_WINDOW_MS = 1000; // 1 second
const RATE_LIMIT_MAX_MESSAGES = 100; // 100 messages per second per client

// Rate limiting tracker
const clientMessageCounts = new Map();

// ========== Security Helpers ==========

/**
 * Sanitize string for safe logging (prevent log injection)
 */
function sanitizeForLog(str) {
  if (typeof str !== 'string') {
    str = JSON.stringify(str);
  }
  // Remove/escape control characters and potential log injection patterns
  return str
    .replace(/[\x00-\x1F\x7F]/g, '') // Remove control characters
    .replace(/\n/g, '\\n')           // Escape newlines
    .replace(/\r/g, '\\r')           // Escape carriage returns
    .replace(/\t/g, '\\t')           // Escape tabs
    .replace(/\.\.\//g, '')          // Remove path traversal patterns
    .slice(0, 1000);                 // Limit length
}

/**
 * Validate WebSocket message structure
 */
function validateMessage(event) {
  if (!event || typeof event !== 'object') return false;
  if (Array.isArray(event)) return false;

  // Only allow specific fields
  const allowedFields = ['choice', 'type', 'data'];
  const keys = Object.keys(event);

  // Check for prototype pollution attempts
  if (keys.includes('__proto__') || keys.includes('constructor') || keys.includes('prototype')) {
    return false;
  }

  // Check field count (prevent DoS with huge objects)
  if (keys.length > 10) return false;

  // Validate field values
  for (const key of keys) {
    if (!allowedFields.includes(key)) continue;
    const value = event[key];
    if (typeof value === 'string' && value.length > 10000) return false;
  }

  return true;
}

/**
 * Check rate limit for a client
 */
function checkRateLimit(socketId) {
  const now = Date.now();
  const clientData = clientMessageCounts.get(socketId) || { count: 0, windowStart: now };

  if (now - clientData.windowStart > RATE_LIMIT_WINDOW_MS) {
    clientData.count = 1;
    clientData.windowStart = now;
  } else {
    clientData.count++;
  }

  clientMessageCounts.set(socketId, clientData);
  return clientData.count <= RATE_LIMIT_MAX_MESSAGES;
}

const MIME_TYPES = {
  '.html': 'text/html', '.css': 'text/css', '.js': 'application/javascript',
  '.json': 'application/json', '.png': 'image/png', '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg', '.gif': 'image/gif', '.svg': 'image/svg+xml'
};

// ========== Templates and Constants ==========

const WAITING_PAGE = `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><title>Brainstorm Companion</title>
<style>body { font-family: system-ui, sans-serif; padding: 2rem; max-width: 800px; margin: 0 auto; }
h1 { color: #333; } p { color: #666; }</style>
</head>
<body><h1>Brainstorm Companion</h1>
<p>Waiting for the agent to push a screen...</p></body></html>`;

const frameTemplate = fs.readFileSync(path.join(__dirname, 'frame-template.html'), 'utf-8');
const helperScript = fs.readFileSync(path.join(__dirname, 'helper.js'), 'utf-8');
const helperInjection = '<script>\n' + helperScript + '\n</script>';

// ========== Helper Functions ==========

function isFullDocument(html) {
  const trimmed = html.trimStart().toLowerCase();
  return trimmed.startsWith('<!doctype') || trimmed.startsWith('<html');
}

function wrapInFrame(content) {
  return frameTemplate.replace('<!-- CONTENT -->', content);
}

function getNewestScreen() {
  const files = fs.readdirSync(SCREEN_DIR)
    .filter(f => f.endsWith('.html'))
    .map(f => {
      const fp = path.join(SCREEN_DIR, f);
      return { path: fp, mtime: fs.statSync(fp).mtime.getTime() };
    })
    .sort((a, b) => b.mtime - a.mtime);
  return files.length > 0 ? files[0].path : null;
}

// ========== HTTP Request Handler ==========

function handleRequest(req, res) {
  touchActivity();
  if (req.method === 'GET' && req.url === '/') {
    const screenFile = getNewestScreen();
    let html = screenFile
      ? (raw => isFullDocument(raw) ? raw : wrapInFrame(raw))(fs.readFileSync(screenFile, 'utf-8'))
      : WAITING_PAGE;

    if (html.includes('</body>')) {
      html = html.replace('</body>', helperInjection + '\n</body>');
    } else {
      html += helperInjection;
    }

    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(html);
  } else if (req.method === 'GET' && req.url.startsWith('/files/')) {
    const fileName = req.url.slice(7);
    const filePath = path.join(SCREEN_DIR, path.basename(fileName));
    if (!fs.existsSync(filePath)) {
      res.writeHead(404);
      res.end('Not found');
      return;
    }
    const ext = path.extname(filePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';
    res.writeHead(200, { 'Content-Type': contentType });
    res.end(fs.readFileSync(filePath));
  } else {
    res.writeHead(404);
    res.end('Not found');
  }
}

// ========== WebSocket Connection Handling ==========

const clients = new Map(); // Changed to Map to store socket with auth info
let socketCounter = 0;

function handleUpgrade(req, socket) {
  const key = req.headers['sec-websocket-key'];
  if (!key) { socket.destroy(); return; }

  // SECURITY: Check for auth token in query string or headers
  const urlParts = (req.url || '').split('?');
  const queryString = urlParts[1] || '';
  const params = new URLSearchParams(queryString);
  const providedToken = params.get('token') || req.headers['x-auth-token'];

  // Generate unique socket ID for rate limiting
  const socketId = `socket_${++socketCounter}`;

  // Validate auth token (allow if no token required for localhost)
  const clientIp = req.socket.remoteAddress;
  const isLocalhost = clientIp === '127.0.0.1' || clientIp === '::1' || clientIp === '::ffff:127.0.0.1';

  if (!isLocalhost && providedToken !== AUTH_TOKEN) {
    console.log(JSON.stringify({
      type: 'auth-rejected',
      client_ip: sanitizeForLog(clientIp),
      reason: 'invalid_token'
    }));
    socket.destroy();
    return;
  }

  const accept = computeAcceptKey(key);
  socket.write(
    'HTTP/1.1 101 Switching Protocols\r\n' +
    'Upgrade: websocket\r\n' +
    'Connection: Upgrade\r\n' +
    'Sec-WebSocket-Accept: ' + accept + '\r\n\r\n'
  );

  let buffer = Buffer.alloc(0);
  clients.set(socket, { id: socketId, authenticated: true, ip: clientIp });

  socket.on('data', (chunk) => {
    buffer = Buffer.concat([buffer, chunk]);

    // SECURITY: Limit buffer size to prevent memory exhaustion
    if (buffer.length > MAX_MESSAGE_SIZE) {
      console.log(JSON.stringify({
        type: 'message-rejected',
        socket_id: socketId,
        reason: 'message_too_large'
      }));
      socket.end(encodeFrame(OPCODES.CLOSE, Buffer.alloc(0)));
      clients.delete(socket);
      clientMessageCounts.delete(socketId);
      return;
    }

    while (buffer.length > 0) {
      let result;
      try {
        result = decodeFrame(buffer);
      } catch (e) {
        socket.end(encodeFrame(OPCODES.CLOSE, Buffer.alloc(0)));
        clients.delete(socket);
        clientMessageCounts.delete(socketId);
        return;
      }
      if (!result) break;
      buffer = buffer.slice(result.bytesConsumed);

      switch (result.opcode) {
        case OPCODES.TEXT:
          // SECURITY: Rate limiting
          if (!checkRateLimit(socketId)) {
            console.log(JSON.stringify({
              type: 'rate-limited',
              socket_id: socketId
            }));
            socket.end(encodeFrame(OPCODES.CLOSE, Buffer.alloc(0)));
            clients.delete(socket);
            clientMessageCounts.delete(socketId);
            return;
          }
          handleMessage(result.payload.toString(), socketId);
          break;
        case OPCODES.CLOSE:
          socket.end(encodeFrame(OPCODES.CLOSE, Buffer.alloc(0)));
          clients.delete(socket);
          clientMessageCounts.delete(socketId);
          return;
        case OPCODES.PING:
          socket.write(encodeFrame(OPCODES.PONG, result.payload));
          break;
        case OPCODES.PONG:
          break;
        default: {
          const closeBuf = Buffer.alloc(2);
          closeBuf.writeUInt16BE(1003);
          socket.end(encodeFrame(OPCODES.CLOSE, closeBuf));
          clients.delete(socket);
          clientMessageCounts.delete(socketId);
          return;
        }
      }
    }
  });

  socket.on('close', () => {
    const info = clients.get(socket);
    clients.delete(socket);
    if (info) clientMessageCounts.delete(info.id);
  });
  socket.on('error', () => {
    const info = clients.get(socket);
    clients.delete(socket);
    if (info) clientMessageCounts.delete(info.id);
  });
}

function handleMessage(text, socketId) {
  let event;
  try {
    event = JSON.parse(text);
  } catch (e) {
    // SECURITY: Sanitize error message before logging
    console.error('Failed to parse WebSocket message:', sanitizeForLog(e.message));
    return;
  }

  // SECURITY: Validate message structure
  if (!validateMessage(event)) {
    console.log(JSON.stringify({
      type: 'message-rejected',
      socket_id: socketId,
      reason: 'invalid_structure'
    }));
    return;
  }

  touchActivity();

  // SECURITY: Sanitize event data before logging (prevent log injection)
  const sanitizedEvent = {};
  for (const [key, value] of Object.entries(event)) {
    if (typeof value === 'string') {
      sanitizedEvent[key] = sanitizeForLog(value);
    } else {
      sanitizedEvent[key] = value;
    }
  }

  console.log(JSON.stringify({ source: 'user-event', socket_id: socketId, ...sanitizedEvent }));

  if (event.choice) {
    const eventsFile = path.join(SCREEN_DIR, '.events');
    // SECURITY: Validate and sanitize before writing to file
    try {
      const safeEvent = {
        choice: typeof event.choice === 'string' ? sanitizeForLog(event.choice) : event.choice,
        timestamp: Date.now(),
        socket_id: socketId
      };
      fs.appendFileSync(eventsFile, JSON.stringify(safeEvent) + '\n');
    } catch (e) {
      console.error('Failed to write event:', sanitizeForLog(e.message));
    }
  }
}

function broadcast(msg) {
  const frame = encodeFrame(OPCODES.TEXT, Buffer.from(JSON.stringify(msg)));
  for (const [socket, info] of clients) {
    try { socket.write(frame); } catch (e) { clients.delete(socket); }
  }
}

// ========== Auth Token Export ==========

/**
 * Get the auth token for this session (for client connections)
 */
function getAuthToken() {
  return AUTH_TOKEN;
}

// ========== Activity Tracking ==========

const IDLE_TIMEOUT_MS = 30 * 60 * 1000; // 30 minutes
let lastActivity = Date.now();

function touchActivity() {
  lastActivity = Date.now();
}

// ========== File Watching ==========

const debounceTimers = new Map();

// ========== Server Startup ==========

function startServer() {
  if (!fs.existsSync(SCREEN_DIR)) fs.mkdirSync(SCREEN_DIR, { recursive: true });

  // Track known files to distinguish new screens from updates.
  // macOS fs.watch reports 'rename' for both new files and overwrites,
  // so we can't rely on eventType alone.
  const knownFiles = new Set(
    fs.readdirSync(SCREEN_DIR).filter(f => f.endsWith('.html'))
  );

  const server = http.createServer(handleRequest);
  server.on('upgrade', handleUpgrade);

  const watcher = fs.watch(SCREEN_DIR, (eventType, filename) => {
    if (!filename || !filename.endsWith('.html')) return;

    // SECURITY: Validate filename to prevent path traversal
    if (filename.includes('..') || filename.includes('/') || filename.includes('\\')) {
      console.log(JSON.stringify({ type: 'file-rejected', reason: 'invalid_filename' }));
      return;
    }

    if (debounceTimers.has(filename)) clearTimeout(debounceTimers.get(filename));
    debounceTimers.set(filename, setTimeout(() => {
      debounceTimers.delete(filename);
      const filePath = path.join(SCREEN_DIR, filename);

      if (!fs.existsSync(filePath)) return; // file was deleted
      touchActivity();

      if (!knownFiles.has(filename)) {
        knownFiles.add(filename);
        const eventsFile = path.join(SCREEN_DIR, '.events');
        if (fs.existsSync(eventsFile)) fs.unlinkSync(eventsFile);
        // SECURITY: Sanitize file path before logging
        console.log(JSON.stringify({ type: 'screen-added', file: sanitizeForLog(filePath) }));
      } else {
        console.log(JSON.stringify({ type: 'screen-updated', file: sanitizeForLog(filePath) }));
      }

      broadcast({ type: 'reload' });
    }, 100));
  });
  watcher.on('error', (err) => console.error('fs.watch error:', sanitizeForLog(err.message)));

  function shutdown(reason) {
    // SECURITY: Sanitize reason before logging
    const safeReason = sanitizeForLog(reason);
    console.log(JSON.stringify({ type: 'server-stopped', reason: safeReason }));
    const infoFile = path.join(SCREEN_DIR, '.server-info');
    if (fs.existsSync(infoFile)) fs.unlinkSync(infoFile);
    fs.writeFileSync(
      path.join(SCREEN_DIR, '.server-stopped'),
      JSON.stringify({ reason: safeReason, timestamp: Date.now() }) + '\n'
    );
    watcher.close();
    clearInterval(lifecycleCheck);
    server.close(() => process.exit(0));
    // Cleanup rate limiting data
    clientMessageCounts.clear();
  }

  function ownerAlive() {
    if (!OWNER_PID) return true;
    try { process.kill(OWNER_PID, 0); return true; } catch (e) { return false; }
  }

  // Check every 60s: exit if owner process died or idle for 30 minutes
  const lifecycleCheck = setInterval(() => {
    if (!ownerAlive()) shutdown('owner process exited');
    else if (Date.now() - lastActivity > IDLE_TIMEOUT_MS) shutdown('idle timeout');
  }, 60 * 1000);
  lifecycleCheck.unref();

  server.listen(PORT, HOST, () => {
    const info = JSON.stringify({
      type: 'server-started', port: Number(PORT), host: HOST,
      url_host: URL_HOST, url: 'http://' + URL_HOST + ':' + PORT,
      screen_dir: SCREEN_DIR,
      // SECURITY: Include auth token for local clients
      auth_token: AUTH_TOKEN,
      security_version: '5.0.5-security'
    });
    console.log(info);
    fs.writeFileSync(path.join(SCREEN_DIR, '.server-info'), info + '\n');
  });
}

if (require.main === module) {
  startServer();
}

module.exports = {
  computeAcceptKey, encodeFrame, decodeFrame, OPCODES,
  // Export security functions for testing
  sanitizeForLog, validateMessage, checkRateLimit, getAuthToken
};
