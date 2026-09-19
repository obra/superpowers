# 零依赖头脑风暴服务器实现计划

> **针对智能体工作者：** 必需：使用 superpowers:子智能体驱动开发（如果子智能体可用）或 superpowers:执行计划 来实现此计划。步骤使用复选框（`- [ ]`）语法进行跟踪。

**目标：** 将头脑风暴服务器的第三方 node\_modules 替换为单个零依赖的 `server.js`，仅使用 Node 内置模块。

**架构：** 单个文件，包含 WebSocket 协议（RFC 6455 文本帧）、HTTP 服务器（`http` 模块）和文件监视（`fs.watch`）。当作为模块被需要时，导出协议函数以供单元测试。

**技术栈：** 仅使用 Node.js 内置模块：`http`, `crypto`, `fs`, `path`

**规范：** `docs/superpowers/specs/2026-03-11-zero-dep-brainstorm-server-design.md`

**现有测试：** `tests/brainstorm-server/ws-protocol.test.js`（单元测试），`tests/brainstorm-server/server.test.js`（集成测试）

***

## 文件映射

* **创建：** `skills/brainstorming/scripts/server.js` — 零依赖替代文件
* **修改：** `skills/brainstorming/scripts/start-server.sh:94,100` — 将 `index.js` 改为 `server.js`
* **修改：** `.gitignore:6` — 移除 `!skills/brainstorming/scripts/node_modules/` 例外
* **删除：** `skills/brainstorming/scripts/index.js`
* **删除：** `skills/brainstorming/scripts/package.json`
* **删除：** `skills/brainstorming/scripts/package-lock.json`
* **删除：** `skills/brainstorming/scripts/node_modules/`（714 个文件）
* **无更改：** `skills/brainstorming/scripts/helper.js`, `skills/brainstorming/scripts/frame-template.html`, `skills/brainstorming/scripts/stop-server.sh`

***

## 区块 1：WebSocket 协议层

### 任务 1：实现 WebSocket 协议导出

**文件：**

* 创建：`skills/brainstorming/scripts/server.js`

* 测试：`tests/brainstorm-server/ws-protocol.test.js`（已存在）

* \[ ] **步骤 1：创建 server.js，包含 OPCODES 常量和 computeAcceptKey 函数**

```js
const crypto = require('crypto');

const OPCODES = { TEXT: 0x01, CLOSE: 0x08, PING: 0x09, PONG: 0x0A };
const WS_MAGIC = '258EAFA5-E914-47DA-95CA-C5AB0DC85B11';

function computeAcceptKey(clientKey) {
  return crypto.createHash('sha1').update(clientKey + WS_MAGIC).digest('base64');
}
```

* \[ ] **步骤 2：实现 encodeFrame 函数**

服务器帧从不掩码。三种长度编码：

* 载荷 < 126：2 字节头部（FIN+操作码，长度）
* 126-65535：4 字节头部（FIN+操作码，126，16 位长度）
* \> 65535：10 字节头部（FIN+操作码，127，64 位长度）

```js
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
```

* \[ ] **步骤 3：实现 decodeFrame 函数**

客户端帧始终被掩码。返回 `{ opcode, payload, bytesConsumed }` 或 `null` 表示不完整。对未掩码的帧抛出错误。

```js
function decodeFrame(buffer) {
  if (buffer.length < 2) return null;

  const firstByte = buffer[0];
  const secondByte = buffer[1];
  const opcode = firstByte & 0x0F;
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
```

* \[ ] **步骤 4：在文件底部添加模块导出**

```js
module.exports = { computeAcceptKey, encodeFrame, decodeFrame, OPCODES };
```

* \[ ] **步骤 5：运行单元测试**

运行：`cd tests/brainstorm-server && node ws-protocol.test.js`
预期：所有测试通过（握手、编码、解码、边界情况、边缘情况）

* \[ ] **步骤 6：提交**

```bash
git add skills/brainstorming/scripts/server.js
git commit -m "Add WebSocket protocol layer for zero-dep brainstorm server"
```

***

## 区块 2：HTTP 服务器和应用逻辑

### 任务 2：添加 HTTP 服务器、文件监视和 WebSocket 连接处理

**文件：**

* 修改：`skills/brainstorming/scripts/server.js`

* 测试：`tests/brainstorm-server/server.test.js`（已存在）

* \[ ] **步骤 1：在 server.js 顶部（require 之后）添加配置和常量**

```js
const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = process.env.BRAINSTORM_PORT || (49152 + Math.floor(Math.random() * 16383));
const HOST = process.env.BRAINSTORM_HOST || '127.0.0.1';
const URL_HOST = process.env.BRAINSTORM_URL_HOST || (HOST === '127.0.0.1' ? 'localhost' : HOST);
const SCREEN_DIR = process.env.BRAINSTORM_DIR || '/tmp/brainstorm';

const MIME_TYPES = {
  '.html': 'text/html', '.css': 'text/css', '.js': 'application/javascript',
  '.json': 'application/json', '.png': 'image/png', '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg', '.gif': 'image/gif', '.svg': 'image/svg+xml'
};
```

* \[ ] **步骤 2：添加 WAITING\_PAGE、模板加载（模块作用域）和辅助函数**

在模块作用域加载 `frameTemplate` 和 `helperInjection`，以便 `wrapInFrame` 和 `handleRequest` 可以访问。它们只从 `__dirname`（脚本目录）读取文件，无论模块是被 require 还是直接运行，这都是有效的。

```js
const WAITING_PAGE = `<!DOCTYPE html>
<html>
<head><title>Brainstorm Companion</title>
<style>body { font-family: system-ui, sans-serif; padding: 2rem; max-width: 800px; margin: 0 auto; }
h1 { color: #333; } p { color: #666; }</style>
</head>
<body><h1>Brainstorm Companion</h1>
<p>Waiting for Claude to push a screen...</p></body></html>`;

const frameTemplate = fs.readFileSync(path.join(__dirname, 'frame-template.html'), 'utf-8');
const helperScript = fs.readFileSync(path.join(__dirname, 'helper.js'), 'utf-8');
const helperInjection = '<script>\n' + helperScript + '\n</script>';

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
```

* \[ ] **步骤 3：添加 HTTP 请求处理器**

```js
function handleRequest(req, res) {
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

    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.end(html);
  } else if (req.method === 'GET' && req.url.startsWith('/files/')) {
    const fileName = req.url.slice(7); // strip '/files/'
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
```

* \[ ] **步骤 4：添加 WebSocket 连接处理**

```js
const clients = new Set();

function handleUpgrade(req, socket) {
  const key = req.headers['sec-websocket-key'];
  if (!key) { socket.destroy(); return; }

  const accept = computeAcceptKey(key);
  socket.write(
    'HTTP/1.1 101 Switching Protocols\r\n' +
    'Upgrade: websocket\r\n' +
    'Connection: Upgrade\r\n' +
    'Sec-WebSocket-Accept: ' + accept + '\r\n\r\n'
  );

  let buffer = Buffer.alloc(0);
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
        default:
          // Unsupported opcode — close with 1003
          const closeBuf = Buffer.alloc(2);
          closeBuf.writeUInt16BE(1003);
          socket.end(encodeFrame(OPCODES.CLOSE, closeBuf));
          clients.delete(socket);
          return;
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
  console.log(JSON.stringify({ source: 'user-event', ...event }));
  if (event.choice) {
    const eventsFile = path.join(SCREEN_DIR, '.events');
    fs.appendFileSync(eventsFile, JSON.stringify(event) + '\n');
  }
}

function broadcast(msg) {
  const frame = encodeFrame(OPCODES.TEXT, Buffer.from(JSON.stringify(msg)));
  for (const socket of clients) {
    try { socket.write(frame); } catch (e) { clients.delete(socket); }
  }
}
```

* \[ ] **步骤 5：添加防抖计时器映射**

```js
const debounceTimers = new Map();
```

文件监视逻辑内联在 `startServer`（步骤 6）中，以便将监视器生命周期与服务器生命周期保持在一起，并根据规范包含一个 `error` 处理器。

* \[ ] **步骤 6：添加 startServer 函数和条件主逻辑**

`frameTemplate` 和 `helperInjection` 已在模块作用域（步骤 2）。`startServer` 只是创建屏幕目录、启动 HTTP 服务器、监视器并记录启动信息。

```js
function startServer() {
  if (!fs.existsSync(SCREEN_DIR)) fs.mkdirSync(SCREEN_DIR, { recursive: true });

  const server = http.createServer(handleRequest);
  server.on('upgrade', handleUpgrade);

  const watcher = fs.watch(SCREEN_DIR, (eventType, filename) => {
    if (!filename || !filename.endsWith('.html')) return;
    if (debounceTimers.has(filename)) clearTimeout(debounceTimers.get(filename));
    debounceTimers.set(filename, setTimeout(() => {
      debounceTimers.delete(filename);
      const filePath = path.join(SCREEN_DIR, filename);
      if (eventType === 'rename' && fs.existsSync(filePath)) {
        const eventsFile = path.join(SCREEN_DIR, '.events');
        if (fs.existsSync(eventsFile)) fs.unlinkSync(eventsFile);
        console.log(JSON.stringify({ type: 'screen-added', file: filePath }));
      } else if (eventType === 'change') {
        console.log(JSON.stringify({ type: 'screen-updated', file: filePath }));
      }
      broadcast({ type: 'reload' });
    }, 100));
  });
  watcher.on('error', (err) => console.error('fs.watch error:', err.message));

  server.listen(PORT, HOST, () => {
    const info = JSON.stringify({
      type: 'server-started', port: Number(PORT), host: HOST,
      url_host: URL_HOST, url: 'http://' + URL_HOST + ':' + PORT,
      screen_dir: SCREEN_DIR
    });
    console.log(info);
    fs.writeFileSync(path.join(SCREEN_DIR, '.server-info'), info + '\n');
  });
}

if (require.main === module) {
  startServer();
}
```

* \[ ] **步骤 7：运行集成测试**

测试目录已有一个 `package.json`，依赖 `ws`。如果需要，请安装它，然后运行测试。

运行：`cd tests/brainstorm-server && npm install && node server.test.js`
预期：所有测试通过

* \[ ] **步骤 8：提交**

```bash
git add skills/brainstorming/scripts/server.js
git commit -m "Add HTTP server, WebSocket handling, and file watching to server.js"
```

***

## 区块 3：替换和清理

### 任务 3：更新 start-server.sh 并删除旧文件

**文件：**

* 修改：`skills/brainstorming/scripts/start-server.sh:94,100`

* 修改：`.gitignore:6`

* 删除：`skills/brainstorming/scripts/index.js`

* 删除：`skills/brainstorming/scripts/package.json`

* 删除：`skills/brainstorming/scripts/package-lock.json`

* 删除：`skills/brainstorming/scripts/node_modules/`（整个目录）

* \[ ] **步骤 1：更新 start-server.sh — 将 `index.js` 改为 `server.js`**

需要更改两行：

第 94 行：`env BRAINSTORM_DIR="$SCREEN_DIR" BRAINSTORM_HOST="$BIND_HOST" BRAINSTORM_URL_HOST="$URL_HOST" node server.js`

第 100 行：`nohup env BRAINSTORM_DIR="$SCREEN_DIR" BRAINSTORM_HOST="$BIND_HOST" BRAINSTORM_URL_HOST="$URL_HOST" node server.js > "$LOG_FILE" 2>&1 &`

* \[ ] **步骤 2：移除对 node\_modules 的 gitignore 例外**

在 `.gitignore` 中，删除第 6 行：`!skills/brainstorming/scripts/node_modules/`

* \[ ] **步骤 3：删除旧文件**

```bash
git rm skills/brainstorming/scripts/index.js
git rm skills/brainstorming/scripts/package.json
git rm skills/brainstorming/scripts/package-lock.json
git rm -r skills/brainstorming/scripts/node_modules/
```

* \[ ] **步骤 4：运行两个测试套件**

运行：`cd tests/brainstorm-server && node ws-protocol.test.js && node server.test.js`
预期：所有测试通过

* \[ ] **步骤 5：提交**

```bash
git add skills/brainstorming/scripts/ .gitignore
git commit -m "Remove vendored node_modules, swap to zero-dep server.js"
```

### 任务 4：手动冒烟测试

* \[ ] **步骤 1：手动启动服务器**

```bash
cd skills/brainstorming/scripts
BRAINSTORM_DIR=/tmp/brainstorm-smoke BRAINSTORM_PORT=9876 node server.js
```

预期：打印 `server-started` JSON，端口为 9876

* \[ ] **步骤 2：在浏览器中打开 http://localhost:9876**

预期：显示等待页面，内容为"Waiting for Claude to push a screen..."

* \[ ] **步骤 3：向屏幕目录写入一个 HTML 文件**

```bash
echo '<h2>Hello from smoke test</h2>' > /tmp/brainstorm-smoke/test.html
```

预期：浏览器刷新并显示"Hello from smoke test"，包裹在框架模板中

* \[ ] **步骤 4：验证 WebSocket 是否正常工作 — 检查浏览器控制台**

打开浏览器开发者工具。WebSocket 连接应显示为已连接（控制台无错误）。框架模板的状态指示器应显示"Connected"。

* \[ ] **步骤 5：使用 Ctrl-C 停止服务器，清理**

```bash
rm -rf /tmp/brainstorm-smoke
```
