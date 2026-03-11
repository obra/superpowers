const crypto = require('crypto');
const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const chokidar = require('chokidar');
const fs = require('fs');
const path = require('path');

const WAITING_PAGE = `<!DOCTYPE html>
<html>
<head>
  <title>Brainstorm Companion</title>
  <style>
    body { font-family: system-ui, sans-serif; padding: 2rem; max-width: 800px; margin: 0 auto; }
    h1 { color: #333; }
    p { color: #666; }
  </style>
</head>
<body>
  <h1>Brainstorm Companion</h1>
  <p>Waiting for Claude to push a screen...</p>
</body>
</html>`;

const FRAME_TEMPLATE = fs.readFileSync(
  path.join(__dirname, 'frame-template.html'),
  'utf-8'
);
const HELPER_SCRIPT = fs.readFileSync(path.join(__dirname, 'helper.js'), 'utf-8');

const isFullDocument = (html) => {
  const trimmed = html.trimStart().toLowerCase();
  return trimmed.startsWith('<!doctype') || trimmed.startsWith('<html');
};

const wrapInFrame = (content) => FRAME_TEMPLATE.replace('<!-- CONTENT -->', content);

const buildAuthorizedUrl = (protocol, host, port, token) =>
  `${protocol}://${host}:${port}/?token=${encodeURIComponent(token)}`;

const createRuntimeConfig = (env = process.env) => {
  const host = env.BRAINSTORM_HOST || '127.0.0.1';
  const port = env.BRAINSTORM_PORT || String(49152 + Math.floor(Math.random() * 16383));
  const urlHost =
    env.BRAINSTORM_URL_HOST || (host === '127.0.0.1' ? 'localhost' : host);
  const screenDir = env.BRAINSTORM_DIR || '/tmp/brainstorm';
  const token = env.BRAINSTORM_TOKEN || crypto.randomBytes(18).toString('hex');

  return {
    host,
    port,
    screenDir,
    token,
    urlHost,
    url: buildAuthorizedUrl('http', urlHost, port, token),
    wsUrl: buildAuthorizedUrl('ws', urlHost, port, token),
  };
};

const ensureSessionDir = (screenDir, fsModule = fs) => {
  if (!fsModule.existsSync(screenDir)) {
    fsModule.mkdirSync(screenDir, { recursive: true, mode: 0o700 });
  }

  fsModule.chmodSync(screenDir, 0o700);
};

const writeServerInfo = (config, fsModule = fs, pathModule = path) => {
  ensureSessionDir(config.screenDir, fsModule);

  const info = {
    type: 'server-started',
    port: config.port,
    host: config.host,
    url_host: config.urlHost,
    url: config.url,
    ws_url: config.wsUrl,
    screen_dir: config.screenDir,
  };
  const infoPath = pathModule.join(config.screenDir, '.server-info');
  fsModule.writeFileSync(infoPath, `${JSON.stringify(info)}\n`, { mode: 0o600 });
  fsModule.chmodSync(infoPath, 0o600);
  return info;
};

const getNewestScreen = (screenDir, fsModule = fs, pathModule = path) => {
  const files = fsModule
    .readdirSync(screenDir)
    .filter((file) => file.endsWith('.html'))
    .map((file) => {
      const filePath = pathModule.join(screenDir, file);
      return {
        path: filePath,
        mtime: fsModule.statSync(filePath).mtime.getTime(),
      };
    })
    .sort((left, right) => right.mtime - left.mtime);

  return files.length > 0 ? files[0].path : null;
};

const createHelperInjection = (config) => [
  `<script>window.__BRAINSTORM_WS_URL__ = ${JSON.stringify(config.wsUrl)};</script>`,
  `<script>\n${HELPER_SCRIPT}\n</script>`,
].join('\n');

const prepareHtmlResponse = (rawHtml, config) => {
  let html = rawHtml == null ? WAITING_PAGE : rawHtml;
  if (rawHtml != null && !isFullDocument(rawHtml)) {
    html = wrapInFrame(rawHtml);
  }

  const helperInjection = createHelperInjection(config);
  if (html.includes('</body>')) {
    return html.replace('</body>', `${helperInjection}\n</body>`);
  }

  return `${html}${helperInjection}`;
};

const extractToken = (value) => {
  if (typeof value !== 'string' || value.length === 0) {
    return null;
  }

  return value;
};

const authorizeHttpRequest = (req, config) =>
  extractToken(req?.query?.token) === config.token;

const authorizeWebSocketRequest = (req, config) => {
  const requestUrl = req?.url || '/';
  const token = new URL(requestUrl, 'http://brainstorm.local').searchParams.get('token');
  if (token !== config.token) {
    return { ok: false, status: 401, message: 'Missing or invalid brainstorm token' };
  }

  return { ok: true };
};

const normalizeString = (value, maxLength) => {
  if (typeof value !== 'string') {
    return null;
  }

  const trimmed = value.trim();
  if (!trimmed || trimmed.length > maxLength) {
    return null;
  }

  return trimmed;
};

const parseClientEvent = (data) => {
  let parsed;

  try {
    parsed = JSON.parse(data.toString());
  } catch (error) {
    return { accepted: false, reason: 'invalid-json' };
  }

  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
    return { accepted: false, reason: 'invalid-payload' };
  }

  const choice = normalizeString(parsed.choice, 200);
  if (!choice) {
    return { accepted: false, reason: 'invalid-choice' };
  }

  const type = normalizeString(parsed.type, 40) || 'choice';
  const event = {
    type,
    choice,
  };

  const text = normalizeString(parsed.text, 500);
  if (text) {
    event.text = text;
  }

  const id = normalizeString(parsed.id, 200);
  if (id) {
    event.id = id;
  }

  const value = normalizeString(parsed.value, 500);
  if (value) {
    event.value = value;
  }

  if (typeof parsed.timestamp === 'number' && Number.isFinite(parsed.timestamp)) {
    event.timestamp = parsed.timestamp;
  }

  return { accepted: true, event };
};

const persistChoiceEvent = (screenDir, event, fsModule = fs, pathModule = path) => {
  const eventsPath = pathModule.join(screenDir, '.events');
  fsModule.appendFileSync(eventsPath, `${JSON.stringify(event)}\n`, { mode: 0o600 });
  fsModule.chmodSync(eventsPath, 0o600);
};

const broadcastReload = (clients) => {
  clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify({ type: 'reload' }));
    }
  });
};

const createServerRuntime = (config = createRuntimeConfig()) => {
  ensureSessionDir(config.screenDir);

  const app = express();
  const server = http.createServer(app);
  const wss = new WebSocket.Server({ noServer: true });
  const clients = new Set();

  app.get('/', (req, res) => {
    if (!authorizeHttpRequest(req, config)) {
      res.status(401).type('text').send('Unauthorized');
      return;
    }

    const screenFile = getNewestScreen(config.screenDir);
    const rawHtml = screenFile ? fs.readFileSync(screenFile, 'utf-8') : null;
    res.type('html').send(prepareHtmlResponse(rawHtml, config));
  });

  wss.on('connection', (ws) => {
    clients.add(ws);
    ws.on('close', () => clients.delete(ws));
    ws.on('message', (data) => {
      const parsedEvent = parseClientEvent(data);
      if (!parsedEvent.accepted) {
        console.warn(
          JSON.stringify({
            type: 'ignored-user-event',
            reason: parsedEvent.reason,
          })
        );
        return;
      }

      console.log(JSON.stringify({ source: 'user-event', ...parsedEvent.event }));
      persistChoiceEvent(config.screenDir, parsedEvent.event);
    });
  });

  server.on('upgrade', (request, socket, head) => {
    const authorization = authorizeWebSocketRequest(request, config);
    if (!authorization.ok) {
      socket.write('HTTP/1.1 401 Unauthorized\r\nConnection: close\r\n\r\n');
      socket.destroy();
      return;
    }

    wss.handleUpgrade(request, socket, head, (ws) => {
      wss.emit('connection', ws, request);
    });
  });

  const watcher = chokidar.watch(config.screenDir, { ignoreInitial: true });
  watcher.on('add', (filePath) => {
    if (!filePath.endsWith('.html')) {
      return;
    }

    const eventsPath = path.join(config.screenDir, '.events');
    if (fs.existsSync(eventsPath)) {
      fs.unlinkSync(eventsPath);
    }

    console.log(JSON.stringify({ type: 'screen-added', file: filePath }));
    broadcastReload(clients);
  });

  watcher.on('change', (filePath) => {
    if (!filePath.endsWith('.html')) {
      return;
    }

    console.log(JSON.stringify({ type: 'screen-updated', file: filePath }));
    broadcastReload(clients);
  });

  return { app, config, server, watcher, wss };
};

const startServer = (env = process.env) => {
  const config = createRuntimeConfig(env);
  const runtime = createServerRuntime(config);

  runtime.server.on('error', (error) => {
    console.error(error);
    process.exit(1);
  });

  runtime.server.listen(Number(config.port), config.host, () => {
    const info = writeServerInfo(config);
    console.log(JSON.stringify(info));
  });

  return runtime;
};

module.exports = {
  WAITING_PAGE,
  authorizeHttpRequest,
  authorizeWebSocketRequest,
  createRuntimeConfig,
  createServerRuntime,
  ensureSessionDir,
  getNewestScreen,
  isFullDocument,
  parseClientEvent,
  persistChoiceEvent,
  prepareHtmlResponse,
  startServer,
  writeServerInfo,
  wrapInFrame,
};
