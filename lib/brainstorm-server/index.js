const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const chokidar = require('chokidar');
const fs = require('fs');
const path = require('path');

const PORT = process.env.BRAINSTORM_PORT || (49152 + Math.floor(Math.random() * 16383));
const HOST = process.env.BRAINSTORM_HOST || '127.0.0.1';
const URL_HOST = process.env.BRAINSTORM_URL_HOST || (HOST === '127.0.0.1' ? 'localhost' : HOST);
const SCREEN_DIR = process.env.BRAINSTORM_DIR || '/tmp/brainstorm';

if (!fs.existsSync(SCREEN_DIR)) {
  fs.mkdirSync(SCREEN_DIR, { recursive: true });
}

// Load frame template and helper script once at startup
const frameTemplate = fs.readFileSync(path.join(__dirname, 'frame-template.html'), 'utf-8');
const helperScript = fs.readFileSync(path.join(__dirname, 'helper.js'), 'utf-8');
const helperInjection = `<script>\n${helperScript}\n</script>`;

// Detect whether content is a full HTML document or a bare fragment
function isFullDocument(html) {
  const trimmed = html.trimStart().toLowerCase();
  return trimmed.startsWith('<!doctype') || trimmed.startsWith('<html');
}

// Wrap a content fragment in the frame template
function wrapInFrame(content) {
  return frameTemplate.replace('<!-- CONTENT -->', content);
}

// Find the newest .html file in the directory by mtime
function getNewestScreen() {
  const files = fs.readdirSync(SCREEN_DIR)
    .filter(f => f.endsWith('.html'))
    .map(f => ({
      name: f,
      path: path.join(SCREEN_DIR, f),
      mtime: fs.statSync(path.join(SCREEN_DIR, f)).mtime.getTime()
    }))
    .sort((a, b) => b.mtime - a.mtime);

  return files.length > 0 ? files[0].path : null;
}

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

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

const clients = new Set();

wss.on('connection', (ws) => {
  clients.add(ws);
  ws.on('close', () => clients.delete(ws));

  ws.on('message', (data) => {
    const event = JSON.parse(data.toString());
    console.log(JSON.stringify({ source: 'user-event', ...event }));
    // Write user events to .events file for Claude to read
    if (event.choice) {
      const eventsFile = path.join(SCREEN_DIR, '.events');
      fs.appendFileSync(eventsFile, JSON.stringify(event) + '\n');
    }
  });
});

// Serve newest screen with helper.js injected
app.get('/', (req, res) => {
  const screenFile = getNewestScreen();
  let html;

  if (!screenFile) {
    html = WAITING_PAGE;
  } else {
    const raw = fs.readFileSync(screenFile, 'utf-8');
    html = isFullDocument(raw) ? raw : wrapInFrame(raw);
  }

  // Inject helper script
  if (html.includes('</body>')) {
    html = html.replace('</body>', `${helperInjection}\n</body>`);
  } else {
    html += helperInjection;
  }

  res.type('html').send(html);
});

// Watch for new or changed .html files
chokidar.watch(SCREEN_DIR, { ignoreInitial: true })
  .on('add', (filePath) => {
    if (filePath.endsWith('.html')) {
      // Clear events from previous screen
      const eventsFile = path.join(SCREEN_DIR, '.events');
      if (fs.existsSync(eventsFile)) fs.unlinkSync(eventsFile);
      console.log(JSON.stringify({ type: 'screen-added', file: filePath }));
      clients.forEach(ws => {
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(JSON.stringify({ type: 'reload' }));
        }
      });
    }
  })
  .on('change', (filePath) => {
    if (filePath.endsWith('.html')) {
      console.log(JSON.stringify({ type: 'screen-updated', file: filePath }));
      clients.forEach(ws => {
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(JSON.stringify({ type: 'reload' }));
        }
      });
    }
  });

server.listen(PORT, HOST, () => {
  console.log(JSON.stringify({
    type: 'server-started',
    port: PORT,
    host: HOST,
    url_host: URL_HOST,
    url: `http://${URL_HOST}:${PORT}`,
    screen_dir: SCREEN_DIR
  }));
});
