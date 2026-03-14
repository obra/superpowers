/**
 * Unit tests for the zero-dependency WebSocket protocol implementation.
 *
 * Tests the WebSocket frame encoding/decoding, handshake computation,
 * and protocol-level behavior independent of the HTTP server.
 *
 * The module under test exports:
 *   - computeAcceptKey(clientKey) -> string
 *   - encodeFrame(opcode, payload) -> Buffer
 *   - decodeFrame(buffer) -> { opcode, payload, bytesConsumed } | null
 *   - OPCODES: { TEXT, CLOSE, PING, PONG }
 */

const assert = require('assert');
const crypto = require('crypto');
const path = require('path');

// The module under test — will be the new zero-dep server file
const SERVER_PATH = path.join(__dirname, '../../skills/brainstorming/scripts/server.js');
let ws;

try {
  ws = require(SERVER_PATH);
} catch (e) {
  // Module doesn't exist yet (TDD — tests written before implementation)
  console.error(`Cannot load ${SERVER_PATH}: ${e.message}`);
  console.error('This is expected if running tests before implementation.');
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

  // ========== Handshake ==========
  console.log('\n--- WebSocket Handshake ---');

  test('computeAcceptKey produces correct RFC 6455 accept value', () => {
    // RFC 6455 Section 4.2.2 example
    // The magic GUID is "258EAFA5-E914-47DA-95CA-C5AB0DC85B11"
    const clientKey = 'dGhlIHNhbXBsZSBub25jZQ==';
    const expected = 's3pPLMBiTxaQ9kYGzzhZRbK+xOo=';
    assert.strictEqual(ws.computeAcceptKey(clientKey), expected);
  });

  test('computeAcceptKey produces valid base64 for random keys', () => {
    for (let i = 0; i < 10; i++) {
      const randomKey = crypto.randomBytes(16).toString('base64');
      const result = ws.computeAcceptKey(randomKey);
      // Result should be valid base64
      assert.strictEqual(Buffer.from(result, 'base64').toString('base64'), result);
      // SHA-1 output is 20 bytes, base64 encoded = 28 chars
      assert.strictEqual(result.length, 28);
    }
  });

  // ========== Frame Encoding ==========
  console.log('\n--- Frame Encoding (server -> client) ---');

  test('encodes small text frame (< 126 bytes)', () => {
    const payload = 'Hello';
    const frame = ws.encodeFrame(ws.OPCODES.TEXT, Buffer.from(payload));
    // FIN bit + TEXT opcode = 0x81, length = 5
    assert.strictEqual(frame[0], 0x81);
    assert.strictEqual(frame[1], 5);
    assert.strictEqual(frame.slice(2).toString(), 'Hello');
    assert.strictEqual(frame.length, 7);
  });

  test('encodes empty text frame', () => {
    const frame = ws.encodeFrame(ws.OPCODES.TEXT, Buffer.alloc(0));
    assert.strictEqual(frame[0], 0x81);
    assert.strictEqual(frame[1], 0);
    assert.strictEqual(frame.length, 2);
  });

  test('encodes medium text frame (126-65535 bytes)', () => {
    const payload = Buffer.alloc(200, 0x41); // 200 'A's
    const frame = ws.encodeFrame(ws.OPCODES.TEXT, payload);
    assert.strictEqual(frame[0], 0x81);
    assert.strictEqual(frame[1], 126); // extended length marker
    assert.strictEqual(frame.readUInt16BE(2), 200);
    assert.strictEqual(frame.slice(4).toString(), payload.toString());
    assert.strictEqual(frame.length, 204);
  });

  test('encodes frame at exactly 126 bytes (boundary)', () => {
    const payload = Buffer.alloc(126, 0x42);
    const frame = ws.encodeFrame(ws.OPCODES.TEXT, payload);
    assert.strictEqual(frame[1], 126); // extended length marker
    assert.strictEqual(frame.readUInt16BE(2), 126);
    assert.strictEqual(frame.length, 130);
  });

  test('encodes frame at exactly 125 bytes (max small)', () => {
    const payload = Buffer.alloc(125, 0x43);
    const frame = ws.encodeFrame(ws.OPCODES.TEXT, payload);
    assert.strictEqual(frame[1], 125);
    assert.strictEqual(frame.length, 127);
  });

  test('encodes large frame (> 65535 bytes)', () => {
    const payload = Buffer.alloc(70000, 0x44);
    const frame = ws.encodeFrame(ws.OPCODES.TEXT, payload);
    assert.strictEqual(frame[0], 0x81);
    assert.strictEqual(frame[1], 127); // 64-bit length marker
    // 8-byte extended length at offset 2
    const len = Number(frame.readBigUInt64BE(2));
    assert.strictEqual(len, 70000);
    assert.strictEqual(frame.length, 10 + 70000);
  });

  test('encodes close frame', () => {
    const frame = ws.encodeFrame(ws.OPCODES.CLOSE, Buffer.alloc(0));
    assert.strictEqual(frame[0], 0x88); // FIN + CLOSE
    assert.strictEqual(frame[1], 0);
  });

  test('encodes pong frame with payload', () => {
    const payload = Buffer.from('ping-data');
    const frame = ws.encodeFrame(ws.OPCODES.PONG, payload);
    assert.strictEqual(frame[0], 0x8A); // FIN + PONG
    assert.strictEqual(frame[1], payload.length);
    assert.strictEqual(frame.slice(2).toString(), 'ping-data');
  });

  test('server frames are never masked (per RFC 6455)', () => {
    const frame = ws.encodeFrame(ws.OPCODES.TEXT, Buffer.from('test'));
    // Bit 7 of byte 1 is the mask bit — must be 0 for server frames
    assert.strictEqual(frame[1] & 0x80, 0);
  });

  // ========== Frame Decoding ==========
  console.log('\n--- Frame Decoding (client -> server) ---');

  // Helper: create a masked client frame
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
      header[1] = 0x80 | buf.length; // mask bit set
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
    assert(result, 'Should return a result');
    assert.strictEqual(result.opcode, ws.OPCODES.TEXT);
    assert.strictEqual(result.payload.toString(), 'Hello');
    assert.strictEqual(result.bytesConsumed, frame.length);
  });

  test('decodes empty masked text frame', () => {
    const frame = makeClientFrame(0x01, '');
    const result = ws.decodeFrame(frame);
    assert(result, 'Should return a result');
    assert.strictEqual(result.opcode, ws.OPCODES.TEXT);
    assert.strictEqual(result.payload.length, 0);
  });

  test('decodes medium masked text frame (126-65535 bytes)', () => {
    const payload = 'A'.repeat(200);
    const frame = makeClientFrame(0x01, payload);
    const result = ws.decodeFrame(frame);
    assert(result, 'Should return a result');
    assert.strictEqual(result.payload.toString(), payload);
  });

  test('decodes large masked text frame (> 65535 bytes)', () => {
    const payload = 'B'.repeat(70000);
    const frame = makeClientFrame(0x01, payload);
    const result = ws.decodeFrame(frame);
    assert(result, 'Should return a result');
    assert.strictEqual(result.payload.length, 70000);
    assert.strictEqual(result.payload.toString(), payload);
  });

  test('decodes masked close frame', () => {
    const frame = makeClientFrame(0x08, '');
    const result = ws.decodeFrame(frame);
    assert(result, 'Should return a result');
    assert.strictEqual(result.opcode, ws.OPCODES.CLOSE);
  });

  test('decodes masked ping frame', () => {
    const frame = makeClientFrame(0x09, 'ping!');
    const result = ws.decodeFrame(frame);
    assert(result, 'Should return a result');
    assert.strictEqual(result.opcode, ws.OPCODES.PING);
    assert.strictEqual(result.payload.toString(), 'ping!');
  });

  test('returns null for incomplete frame (not enough header bytes)', () => {
    const result = ws.decodeFrame(Buffer.from([0x81]));
    assert.strictEqual(result, null, 'Should return null for 1-byte buffer');
  });

  test('returns null for incomplete frame (header ok, payload truncated)', () => {
    // Create a valid frame then truncate it
    const frame = makeClientFrame(0x01, 'Hello World');
    const truncated = frame.slice(0, frame.length - 3);
    const result = ws.decodeFrame(truncated);
    assert.strictEqual(result, null, 'Should return null for truncated frame');
  });

  test('returns null for incomplete extended-length header', () => {
    // Frame claiming 16-bit length but only 3 bytes total
    const buf = Buffer.alloc(3);
    buf[0] = 0x81;
    buf[1] = 0x80 | 126; // masked, 16-bit extended
    // Missing the 2 length bytes + mask
    const result = ws.decodeFrame(buf);
    assert.strictEqual(result, null);
  });

  test('rejects unmasked client frame', () => {
    // Server MUST reject unmasked client frames per RFC 6455 Section 5.1
    const buf = Buffer.alloc(7);
    buf[0] = 0x81; // FIN + TEXT
    buf[1] = 5;    // length 5, NO mask bit
    Buffer.from('Hello').copy(buf, 2);
    assert.throws(() => ws.decodeFrame(buf), /mask/i, 'Should reject unmasked client frame');
  });

  test('handles multiple frames in a single buffer', () => {
    const frame1 = makeClientFrame(0x01, 'first');
    const frame2 = makeClientFrame(0x01, 'second');
    const combined = Buffer.concat([frame1, frame2]);

    const result1 = ws.decodeFrame(combined);
    assert(result1, 'Should decode first frame');
    assert.strictEqual(result1.payload.toString(), 'first');
    assert.strictEqual(result1.bytesConsumed, frame1.length);

    const result2 = ws.decodeFrame(combined.slice(result1.bytesConsumed));
    assert(result2, 'Should decode second frame');
    assert.strictEqual(result2.payload.toString(), 'second');
  });

  test('correctly unmasks with all mask byte values', () => {
    // Use a known mask to verify unmasking arithmetic
    const payload = Buffer.from('ABCDEFGH');
    const mask = Buffer.from([0xFF, 0x00, 0xAA, 0x55]);
    const masked = Buffer.alloc(payload.length);
    for (let i = 0; i < payload.length; i++) {
      masked[i] = payload[i] ^ mask[i % 4];
    }

    // Build frame manually
    const header = Buffer.alloc(6);
    header[0] = 0x81; // FIN + TEXT
    header[1] = 0x80 | payload.length;
    mask.copy(header, 2);
    const frame = Buffer.concat([header, masked]);

    const result = ws.decodeFrame(frame);
    assert.strictEqual(result.payload.toString(), 'ABCDEFGH');
  });

  // ========== Frame Encoding Boundary at 65535/65536 ==========
  console.log('\n--- Frame Size Boundaries ---');

  test('encodes frame at exactly 65535 bytes (max 16-bit)', () => {
    const payload = Buffer.alloc(65535, 0x45);
    const frame = ws.encodeFrame(ws.OPCODES.TEXT, payload);
    assert.strictEqual(frame[1], 126);
    assert.strictEqual(frame.readUInt16BE(2), 65535);
    assert.strictEqual(frame.length, 4 + 65535);
  });

  test('encodes frame at exactly 65536 bytes (min 64-bit)', () => {
    const payload = Buffer.alloc(65536, 0x46);
    const frame = ws.encodeFrame(ws.OPCODES.TEXT, payload);
    assert.strictEqual(frame[1], 127);
    assert.strictEqual(Number(frame.readBigUInt64BE(2)), 65536);
    assert.strictEqual(frame.length, 10 + 65536);
  });

  test('decodes frame at 65535 bytes boundary', () => {
    const payload = 'X'.repeat(65535);
    const frame = makeClientFrame(0x01, payload);
    const result = ws.decodeFrame(frame);
    assert(result);
    assert.strictEqual(result.payload.length, 65535);
  });

  test('decodes frame at 65536 bytes boundary', () => {
    const payload = 'Y'.repeat(65536);
    const frame = makeClientFrame(0x01, payload);
    const result = ws.decodeFrame(frame);
    assert(result);
    assert.strictEqual(result.payload.length, 65536);
  });

  // ========== Close Frame with Status Code ==========
  console.log('\n--- Close Frame Details ---');

  test('decodes close frame with status code', () => {
    // Close frame payload: 2-byte status code + optional reason
    const statusBuf = Buffer.alloc(2);
    statusBuf.writeUInt16BE(1000); // Normal closure
    const frame = makeClientFrame(0x08, statusBuf);
    const result = ws.decodeFrame(frame);
    assert.strictEqual(result.opcode, ws.OPCODES.CLOSE);
    assert.strictEqual(result.payload.readUInt16BE(0), 1000);
  });

  test('decodes close frame with status code and reason', () => {
    const reason = 'Normal shutdown';
    const payload = Buffer.alloc(2 + reason.length);
    payload.writeUInt16BE(1000);
    payload.write(reason, 2);
    const frame = makeClientFrame(0x08, payload);
    const result = ws.decodeFrame(frame);
    assert.strictEqual(result.opcode, ws.OPCODES.CLOSE);
    assert.strictEqual(result.payload.slice(2).toString(), reason);
  });

  // ========== JSON Roundtrip ==========
  console.log('\n--- JSON Message Roundtrip ---');

  test('roundtrip encode/decode of JSON message', () => {
    const msg = { type: 'reload' };
    const payload = Buffer.from(JSON.stringify(msg));
    const serverFrame = ws.encodeFrame(ws.OPCODES.TEXT, payload);

    // Verify we can read what we encoded (unmasked server frame)
    // Server frames don't go through decodeFrame (that expects masked),
    // so just verify the payload bytes directly
    let offset;
    if (serverFrame[1] < 126) {
      offset = 2;
    } else if (serverFrame[1] === 126) {
      offset = 4;
    } else {
      offset = 10;
    }
    const decoded = JSON.parse(serverFrame.slice(offset).toString());
    assert.deepStrictEqual(decoded, msg);
  });

  test('roundtrip masked client JSON message', () => {
    const msg = { type: 'click', choice: 'a', text: 'Option A', timestamp: 1706000101 };
    const frame = makeClientFrame(0x01, JSON.stringify(msg));
    const result = ws.decodeFrame(frame);
    const decoded = JSON.parse(result.payload.toString());
    assert.deepStrictEqual(decoded, msg);
  });

  // ========== Summary ==========
  console.log(`\n--- Results: ${passed} passed, ${failed} failed ---`);
  if (failed > 0) process.exit(1);
}

runTests();
