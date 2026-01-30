const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const chokidar = require('chokidar');
const fs = require('fs');
const path = require('path');

// Use provided port or pick a random high port (49152-65535)
const PORT = process.env.BRAINSTORM_PORT || (49152 + Math.floor(Math.random() * 16383));
const SCREEN_DIR = process.env.BRAINSTORM_DIR || '/tmp/brainstorm';

// Ensure screen directory exists
if (!fs.existsSync(SCREEN_DIR)) {
  fs.mkdirSync(SCREEN_DIR, { recursive: true });
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

// Default waiting page (served when no screens exist yet)
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

// Track connected browsers for reload notifications
const clients = new Set();

wss.on('connection', (ws) => {
  clients.add(ws);
  ws.on('close', () => clients.delete(ws));

  ws.on('message', (data) => {
    // User interaction event - write to stdout for Claude
    const event = JSON.parse(data.toString());
    console.log(JSON.stringify({ source: 'user-event', ...event }));
  });
});

// Serve newest screen with helper.js injected
app.get('/', (req, res) => {
  const screenFile = getNewestScreen();
  let html = screenFile ? fs.readFileSync(screenFile, 'utf-8') : WAITING_PAGE;

  // Inject helper script before </body>
  const helperScript = fs.readFileSync(path.join(__dirname, 'helper.js'), 'utf-8');
  const injection = `<script>\n${helperScript}\n</script>`;

  if (html.includes('</body>')) {
    html = html.replace('</body>', `${injection}\n</body>`);
  } else {
    html += injection;
  }

  res.type('html').send(html);
});

// Watch for new or changed .html files in the directory
chokidar.watch(SCREEN_DIR, { ignoreInitial: true })
  .on('add', (filePath) => {
    if (filePath.endsWith('.html')) {
      console.log(JSON.stringify({ type: 'screen-added', file: filePath }));
      // Notify all browsers to reload
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

server.listen(PORT, '127.0.0.1', () => {
  console.log(JSON.stringify({
    type: 'server-started',
    port: PORT,
    url: `http://localhost:${PORT}`,
    screen_dir: SCREEN_DIR
  }));
});
