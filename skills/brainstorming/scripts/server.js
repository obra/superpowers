const crypto = require('crypto');
const http = require('http');
const fs = require('fs');
const path = require('path');

// ========== WebSocket Protocol (RFC 6455) ==========

const OPCODES = { TEXT: 0x01, CLOSE: 0x08, PING: 0x09, PONG: 0x0A };
const WS_MAGIC = '258EAFA5-E914-47DA-95CA-C5AB0DC85B11';
const LOOPBACK_HOSTS = new Set(['127.0.0.1', 'localhost', '::1']);
const AUTH_COOKIE_NAME = 'brainstorm_auth';
const MAX_FRAME_PAYLOAD_BYTES = 256 * 1024;
const MAX_CLIENTS = 20;
const MAX_MESSAGES_PER_WINDOW = 60;
const MESSAGE_WINDOW_MS = 10 * 1000;
const AUTH_TTL_SECONDS = 30 * 60;
const SENSITIVE_KEY_PATTERN = /(token|secret|pass(word)?|api[-_]?key|cookie|auth|credential)/i;
const MAX_LOG_STRING_LENGTH = 4096;

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

  if (payloadLen > MAX_FRAME_PAYLOAD_BYTES) {
    throw new Error('WebSocket frame too large');
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
const SCREEN_DIR = process.env.BRAINSTORM_DIR || '/tmp/brainstorm';
const OWNER_PID = process.env.BRAINSTORM_OWNER_PID ? Number(process.env.BRAINSTORM_OWNER_PID) : null;
const ALLOW_REMOTE = process.env.BRAINSTORM_ALLOW_REMOTE === '1';
const SESSION_TOKEN = process.env.BRAINSTORM_SESSION_TOKEN || crypto.randomBytes(32).toString('hex');
const PORT_NUMBER = Number(PORT);
const SERVER_ORIGIN = 'http://' + URL_HOST + ':' + PORT_NUMBER;

if (!ALLOW_REMOTE && !LOOPBACK_HOSTS.has(HOST)) {
  throw new Error(
    `Refusing to bind brainstorm server to non-loopback host "${HOST}" without BRAINSTORM_ALLOW_REMOTE=1`
  );
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
<p>Waiting for Claude to push a screen...</p></body></html>`;

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

function parseRequestUrl(req) {
  const host = req.headers.host || `${URL_HOST}:${PORT_NUMBER}`;
  return new URL(req.url, `http://${host}`);
}

function parseCookies(cookieHeader) {
  if (!cookieHeader) return {};

  return cookieHeader.split(';').reduce((cookies, cookie) => {
    const separatorIdx = cookie.indexOf('=');
    if (separatorIdx === -1) return cookies;

    const key = cookie.slice(0, separatorIdx).trim();
    const value = cookie.slice(separatorIdx + 1).trim();
    if (key) cookies[key] = value;
    return cookies;
  }, {});
}

function hasValidSessionToken(req, reqUrl) {
  const cookies = parseCookies(req.headers.cookie);
  return (
    reqUrl.searchParams.get('token') === SESSION_TOKEN ||
    cookies[AUTH_COOKIE_NAME] === SESSION_TOKEN
  );
}

function buildAuthCookie() {
  return `${AUTH_COOKIE_NAME}=${SESSION_TOKEN}; HttpOnly; SameSite=Strict; Max-Age=${AUTH_TTL_SECONDS}; Path=/`;
}

function applySecurityHeaders(res, extraHeaders = {}) {
  for (const [key, value] of Object.entries({
    'Cache-Control': 'no-store',
    'Pragma': 'no-cache',
    'Referrer-Policy': 'no-referrer',
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    ...extraHeaders
  })) {
    res.setHeader(key, value);
  }
}

function sendHttpResponse(res, statusCode, body, headers = {}) {
  applySecurityHeaders(res, headers);
  res.writeHead(statusCode);
  res.end(body);
}

function authorizeHttpRequest(req, res, reqUrl) {
  if (!hasValidSessionToken(req, reqUrl)) {
    sendHttpResponse(res, 403, 'Forbidden', { 'Content-Type': 'text/plain; charset=utf-8' });
    return false;
  }

  if (reqUrl.searchParams.get('token') === SESSION_TOKEN) {
    res.setHeader('Set-Cookie', buildAuthCookie());
  }

  return true;
}

function rejectUpgrade(socket, statusCode, reason) {
  socket.write(
    `HTTP/1.1 ${statusCode} ${reason}\r\n` +
    'Connection: close\r\n' +
    'Content-Type: text/plain; charset=utf-8\r\n\r\n' +
    reason
  );
  socket.destroy();
}

function truncateString(value) {
  if (value.length <= MAX_LOG_STRING_LENGTH) return value;
  return value.slice(0, MAX_LOG_STRING_LENGTH) + '...[truncated]';
}

function sanitizeEventValue(value, currentKey = '') {
  if (Array.isArray(value)) {
    return value.map((entry) => sanitizeEventValue(entry));
  }

  if (value && typeof value === 'object') {
    const sanitized = {};
    for (const [key, entry] of Object.entries(value)) {
      if (SENSITIVE_KEY_PATTERN.test(key)) {
        sanitized[key] = '[REDACTED]';
      } else {
        sanitized[key] = sanitizeEventValue(entry, key);
      }
    }
    return sanitized;
  }

  if (typeof value === 'string') {
    if (SENSITIVE_KEY_PATTERN.test(currentKey)) return '[REDACTED]';
    return truncateString(value);
  }

  return value;
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
  const reqUrl = parseRequestUrl(req);
  const pathname = reqUrl.pathname;
  touchActivity();

  if (req.method !== 'GET') {
    sendHttpResponse(res, 405, 'Method not allowed', { 'Content-Type': 'text/plain; charset=utf-8' });
    return;
  }

  if (!authorizeHttpRequest(req, res, reqUrl)) return;

  if (pathname === '/') {
    const screenFile = getNewestScreen();
    let html = screenFile
      ? (raw => isFullDocument(raw) ? raw : wrapInFrame(raw))(fs.readFileSync(screenFile, 'utf-8'))
      : WAITING_PAGE;

    if (html.includes('</body>')) {
      html = html.replace('</body>', helperInjection + '\n</body>');
    } else {
      html += helperInjection;
    }

    sendHttpResponse(res, 200, html, { 'Content-Type': 'text/html; charset=utf-8' });
  } else if (pathname.startsWith('/files/')) {
    const fileName = decodeURIComponent(pathname.slice(7));
    const filePath = path.join(SCREEN_DIR, path.basename(fileName));
    if (!fs.existsSync(filePath)) {
      sendHttpResponse(res, 404, 'Not found', { 'Content-Type': 'text/plain; charset=utf-8' });
      return;
    }
    const ext = path.extname(filePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';
    sendHttpResponse(res, 200, fs.readFileSync(filePath), { 'Content-Type': contentType });
  } else {
    sendHttpResponse(res, 404, 'Not found', { 'Content-Type': 'text/plain; charset=utf-8' });
  }
}

// ========== WebSocket Connection Handling ==========

const clients = new Set();

function handleUpgrade(req, socket) {
  const reqUrl = parseRequestUrl(req);
  const key = req.headers['sec-websocket-key'];
  const origin = req.headers.origin;

  if (reqUrl.pathname !== '/') {
    rejectUpgrade(socket, 404, 'Not Found');
    return;
  }

  if (!key) {
    rejectUpgrade(socket, 400, 'Missing WebSocket key');
    return;
  }

  if (!hasValidSessionToken(req, reqUrl)) {
    rejectUpgrade(socket, 401, 'Unauthorized');
    return;
  }

  if (origin && origin !== SERVER_ORIGIN) {
    rejectUpgrade(socket, 403, 'Forbidden');
    return;
  }

  if (clients.size >= MAX_CLIENTS) {
    rejectUpgrade(socket, 503, 'Too many clients');
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
  let messageWindowStartedAt = Date.now();
  let messageCount = 0;
  clients.add(socket);

  socket.on('data', (chunk) => {
    buffer = Buffer.concat([buffer, chunk]);
    while (buffer.length > 0) {
      let result;
      try {
        result = decodeFrame(buffer);
      } catch (e) {
        socket.end(encodeFrame(OPCODES.CLOSE, Buffer.alloc(0)));
        clients.delete(socket);
        return;
      }
      if (!result) break;
      buffer = buffer.slice(result.bytesConsumed);

      switch (result.opcode) {
        case OPCODES.TEXT:
          if (Date.now() - messageWindowStartedAt >= MESSAGE_WINDOW_MS) {
            messageWindowStartedAt = Date.now();
            messageCount = 0;
          }
          messageCount += 1;
          if (messageCount > MAX_MESSAGES_PER_WINDOW) {
            const closeBuf = Buffer.alloc(2);
            closeBuf.writeUInt16BE(1008);
            socket.end(encodeFrame(OPCODES.CLOSE, closeBuf));
            clients.delete(socket);
            return;
          }
          handleMessage(result.payload.toString());
          break;
        case OPCODES.CLOSE:
          socket.end(encodeFrame(OPCODES.CLOSE, Buffer.alloc(0)));
          clients.delete(socket);
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
          return;
        }
      }
    }
  });

  socket.on('close', () => clients.delete(socket));
  socket.on('error', () => clients.delete(socket));
}

function handleMessage(text) {
  let event;
  try {
    event = JSON.parse(text);
  } catch (e) {
    console.error('Failed to parse WebSocket message:', e.message);
    return;
  }
  touchActivity();
  const sanitizedEvent = sanitizeEventValue(event);
  console.log(JSON.stringify({ source: 'user-event', ...sanitizedEvent }));
  if (event.choice) {
    const eventsFile = path.join(SCREEN_DIR, '.events');
    fs.appendFileSync(eventsFile, JSON.stringify(sanitizedEvent) + '\n', { mode: 0o600 });
  }
}

function broadcast(msg) {
  const frame = encodeFrame(OPCODES.TEXT, Buffer.from(JSON.stringify(msg)));
  for (const socket of clients) {
    try { socket.write(frame); } catch (e) { clients.delete(socket); }
  }
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
        console.log(JSON.stringify({ type: 'screen-added', file: filePath }));
      } else {
        console.log(JSON.stringify({ type: 'screen-updated', file: filePath }));
      }

      broadcast({ type: 'reload' });
    }, 100));
  });
  watcher.on('error', (err) => console.error('fs.watch error:', err.message));

  function shutdown(reason) {
    console.log(JSON.stringify({ type: 'server-stopped', reason }));
    const infoFile = path.join(SCREEN_DIR, '.server-info');
    if (fs.existsSync(infoFile)) fs.unlinkSync(infoFile);
    fs.writeFileSync(
      path.join(SCREEN_DIR, '.server-stopped'),
      JSON.stringify({ reason, timestamp: Date.now() }) + '\n'
    );
    watcher.close();
    clearInterval(lifecycleCheck);
    server.close(() => process.exit(0));
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
    const publicInfo = {
      type: 'server-started', port: Number(PORT), host: HOST,
      url_host: URL_HOST, url: SERVER_ORIGIN,
      screen_dir: SCREEN_DIR
    };
    const privateInfo = {
      ...publicInfo,
      auth_required: true,
      auth_token: SESSION_TOKEN,
      url: `${SERVER_ORIGIN}/?token=${SESSION_TOKEN}`,
      public_url: SERVER_ORIGIN
    };
    console.log(JSON.stringify(publicInfo));
    fs.writeFileSync(
      path.join(SCREEN_DIR, '.server-info'),
      JSON.stringify(privateInfo) + '\n',
      { mode: 0o600 }
    );
  });
}

if (require.main === module) {
  startServer();
}

module.exports = {
  AUTH_COOKIE_NAME,
  MAX_FRAME_PAYLOAD_BYTES,
  computeAcceptKey,
  encodeFrame,
  decodeFrame,
  OPCODES
};
