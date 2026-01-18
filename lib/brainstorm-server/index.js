const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const chokidar = require('chokidar');
const fs = require('fs');
const path = require('path');

// Use provided port or pick a random high port (49152-65535)
const PORT = process.env.BRAINSTORM_PORT || (49152 + Math.floor(Math.random() * 16383));
const SCREEN_FILE = process.env.BRAINSTORM_SCREEN || '/tmp/brainstorm/screen.html';
const SCREEN_DIR = path.dirname(SCREEN_FILE);

// Ensure screen directory exists
if (!fs.existsSync(SCREEN_DIR)) {
  fs.mkdirSync(SCREEN_DIR, { recursive: true });
}

// Create default screen if none exists
if (!fs.existsSync(SCREEN_FILE)) {
  fs.writeFileSync(SCREEN_FILE, `<!DOCTYPE html>
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
</html>`);
}

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

// Serve current screen with helper.js injected
app.get('/', (req, res) => {
  let html = fs.readFileSync(SCREEN_FILE, 'utf-8');

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

// Watch for screen file changes
chokidar.watch(SCREEN_FILE).on('change', () => {
  console.log(JSON.stringify({ type: 'screen-updated', file: SCREEN_FILE }));
  // Notify all browsers to reload
  clients.forEach(ws => {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({ type: 'reload' }));
    }
  });
});

server.listen(PORT, '127.0.0.1', () => {
  console.log(JSON.stringify({
    type: 'server-started',
    port: PORT,
    url: `http://localhost:${PORT}`,
    screen_dir: SCREEN_DIR,
    screen_file: SCREEN_FILE
  }));
});
