/**
 * Unit tests for the zero-dependency WebSocket protocol implementation.
 */

const assert = require('assert');
const crypto = require('crypto');
const path = require('path');

const SERVER_PATH = path.join(__dirname, '../../skills/brainstorming/scripts/server.cjs');
let ws;

try {
  ws = require(SERVER_PATH);
} catch (e) {
  console.error(`Cannot load ${SERVER_PATH}: ${e.message}`);
  process.exit(1);
}

function runTests() {
  let passed = 0;
  let failed = 0;

  function test(name, fn) {
    try {
      fn();
      console.log(`  PASS: ${name}`);
      passed++;
    } catch (e) {
      console.log(`  FAIL: ${name}`);
      console.log(`    ${e.message}`);
      failed++;
    }
  }

  console.log('\n--- WebSocket Handshake ---');

  test('computeAcceptKey matches RFC 6455 example', () => {
    const clientKey = 'dGhlIHNhbXBsZSBub25jZQ==';
    const expected = 's3pPLMBiTxaQ9kYGzzhZRbK+xOo=';
    assert.strictEqual(ws.computeAcceptKey(clientKey), expected);
  });

  test('computeAcceptKey produces valid base64 output', () => {
    for (let i = 0; i < 10; i++) {
      const randomKey = crypto.randomBytes(16).toString('base64');
      const result = ws.computeAcceptKey(randomKey);
      assert.strictEqual(Buffer.from(result, 'base64').toString('base64'), result);
      assert.strictEqual(result.length, 28);
    }
  });

  console.log('\n--- Frame Encoding ---');

  test('encodes small text frame', () => {
    const frame = ws.encodeFrame(ws.OPCODES.TEXT, Buffer.from('Hello'));
    assert.strictEqual(frame[0], 0x81);
    assert.strictEqual(frame[1], 5);
    assert.strictEqual(frame.slice(2).toString(), 'Hello');
  });

  test('encodes empty text frame', () => {
    const frame = ws.encodeFrame(ws.OPCODES.TEXT, Buffer.alloc(0));
    assert.strictEqual(frame[0], 0x81);
    assert.strictEqual(frame[1], 0);
    assert.strictEqual(frame.length, 2);
  });

  test('encodes medium text frame', () => {
    const payload = Buffer.alloc(200, 0x41);
    const frame = ws.encodeFrame(ws.OPCODES.TEXT, payload);
    assert.strictEqual(frame[0], 0x81);
    assert.strictEqual(frame[1], 126);
    assert.strictEqual(frame.readUInt16BE(2), 200);
    assert.strictEqual(frame.length, 204);
  });

  test('encodes frame at exactly 126 bytes', () => {
    const payload = Buffer.alloc(126, 0x42);
    const frame = ws.encodeFrame(ws.OPCODES.TEXT, payload);
    assert.strictEqual(frame[1], 126);
    assert.strictEqual(frame.readUInt16BE(2), 126);
  });

  test('encodes frame at exactly 125 bytes', () => {
    const payload = Buffer.alloc(125, 0x43);
    const frame = ws.encodeFrame(ws.OPCODES.TEXT, payload);
    assert.strictEqual(frame[1], 125);
  });

  test('encodes large frame', () => {
    const payload = Buffer.alloc(70000, 0x44);
    const frame = ws.encodeFrame(ws.OPCODES.TEXT, payload);
    assert.strictEqual(frame[1], 127);
    assert.strictEqual(Number(frame.readBigUInt64BE(2)), 70000);
  });

  test('encodes close frame', () => {
    const frame = ws.encodeFrame(ws.OPCODES.CLOSE, Buffer.alloc(0));
    assert.strictEqual(frame[0], 0x88);
    assert.strictEqual(frame[1], 0);
  });

  test('encodes pong frame with payload', () => {
    const frame = ws.encodeFrame(ws.OPCODES.PONG, Buffer.from('ping-data'));
    assert.strictEqual(frame[0], 0x8A);
    assert.strictEqual(frame.slice(2).toString(), 'ping-data');
  });

  test('server frames are never masked', () => {
    const frame = ws.encodeFrame(ws.OPCODES.TEXT, Buffer.from('test'));
    assert.strictEqual(frame[1] & 0x80, 0);
  });

  console.log('\n--- Frame Decoding ---');

  function makeClientFrame(opcode, payload, fin = true) {
    const buf = Buffer.from(payload);
    const mask = crypto.randomBytes(4);
    const masked = Buffer.alloc(buf.length);
    for (let i = 0; i < buf.length; i++) {
      masked[i] = buf[i] ^ mask[i % 4];
    }

    let header;
    const finBit = fin ? 0x80 : 0x00;
    if (buf.length < 126) {
      header = Buffer.alloc(6);
      header[0] = finBit | opcode;
      header[1] = 0x80 | buf.length;
      mask.copy(header, 2);
    } else if (buf.length < 65536) {
      header = Buffer.alloc(8);
      header[0] = finBit | opcode;
      header[1] = 0x80 | 126;
      header.writeUInt16BE(buf.length, 2);
      mask.copy(header, 4);
    } else {
      header = Buffer.alloc(14);
      header[0] = finBit | opcode;
      header[1] = 0x80 | 127;
      header.writeBigUInt64BE(BigInt(buf.length), 2);
      mask.copy(header, 10);
    }

    return Buffer.concat([header, masked]);
  }

  test('decodes small masked text frame', () => {
    const frame = makeClientFrame(0x01, 'Hello');
    const result = ws.decodeFrame(frame);
    assert(result);
    assert.strictEqual(result.opcode, ws.OPCODES.TEXT);
    assert.strictEqual(result.payload.toString(), 'Hello');
    assert.strictEqual(result.bytesConsumed, frame.length);
  });

  test('decodes medium masked text frame', () => {
    const payload = 'A'.repeat(200);
    const result = ws.decodeFrame(makeClientFrame(0x01, payload));
    assert.strictEqual(result.payload.toString(), payload);
  });

  test('decodes large masked text frame', () => {
    const payload = 'B'.repeat(70000);
    const result = ws.decodeFrame(makeClientFrame(0x01, payload));
    assert.strictEqual(result.payload.length, 70000);
  });

  test('decodes close frame', () => {
    const result = ws.decodeFrame(makeClientFrame(0x08, ''));
    assert.strictEqual(result.opcode, ws.OPCODES.CLOSE);
  });

  test('decodes ping frame', () => {
    const result = ws.decodeFrame(makeClientFrame(0x09, 'ping!'));
    assert.strictEqual(result.opcode, ws.OPCODES.PING);
    assert.strictEqual(result.payload.toString(), 'ping!');
  });

  test('returns null for incomplete frame', () => {
    assert.strictEqual(ws.decodeFrame(Buffer.from([0x81])), null);
  });

  test('returns null for truncated payload', () => {
    const frame = makeClientFrame(0x01, 'Hello World');
    const truncated = frame.slice(0, frame.length - 3);
    assert.strictEqual(ws.decodeFrame(truncated), null);
  });

  test('returns null for incomplete extended-length header', () => {
    const buf = Buffer.alloc(3);
    buf[0] = 0x81;
    buf[1] = 0x80 | 126;
    assert.strictEqual(ws.decodeFrame(buf), null);
  });

  test('rejects unmasked client frame', () => {
    const buf = Buffer.alloc(7);
    buf[0] = 0x81;
    buf[1] = 5;
    Buffer.from('Hello').copy(buf, 2);
    assert.throws(() => ws.decodeFrame(buf), /mask/i);
  });

  test('handles multiple frames in one buffer', () => {
    const frame1 = makeClientFrame(0x01, 'first');
    const frame2 = makeClientFrame(0x01, 'second');
    const combined = Buffer.concat([frame1, frame2]);

    const result1 = ws.decodeFrame(combined);
    assert.strictEqual(result1.payload.toString(), 'first');
    const result2 = ws.decodeFrame(combined.slice(result1.bytesConsumed));
    assert.strictEqual(result2.payload.toString(), 'second');
  });

  test('correctly unmasks with arbitrary mask bytes', () => {
    const payload = Buffer.from('ABCDEFGH');
    const mask = Buffer.from([0xFF, 0x00, 0xAA, 0x55]);
    const masked = Buffer.alloc(payload.length);
    for (let i = 0; i < payload.length; i++) {
      masked[i] = payload[i] ^ mask[i % 4];
    }

    const header = Buffer.alloc(6);
    header[0] = 0x81;
    header[1] = 0x80 | payload.length;
    mask.copy(header, 2);
    const frame = Buffer.concat([header, masked]);

    const result = ws.decodeFrame(frame);
    assert.strictEqual(result.payload.toString(), 'ABCDEFGH');
  });

  console.log('\n--- Frame Size Boundaries ---');

  test('encodes frame at 65535 bytes', () => {
    const payload = Buffer.alloc(65535, 0x45);
    const frame = ws.encodeFrame(ws.OPCODES.TEXT, payload);
    assert.strictEqual(frame[1], 126);
    assert.strictEqual(frame.readUInt16BE(2), 65535);
  });

  test('encodes frame at 65536 bytes', () => {
    const payload = Buffer.alloc(65536, 0x46);
    const frame = ws.encodeFrame(ws.OPCODES.TEXT, payload);
    assert.strictEqual(frame[1], 127);
    assert.strictEqual(Number(frame.readBigUInt64BE(2)), 65536);
  });

  test('decodes frame at 65535 byte boundary', () => {
    const payload = 'X'.repeat(65535);
    const result = ws.decodeFrame(makeClientFrame(0x01, payload));
    assert(result);
    assert.strictEqual(result.payload.length, 65535);
  });

  console.log(`\n--- Results: ${passed} passed, ${failed} failed ---`);
  if (failed > 0) process.exit(1);
}

runTests();
