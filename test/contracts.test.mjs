import test from 'node:test';
import assert from 'node:assert/strict';
import {
  validateHeartbeat,
  validateTelemetry,
  validateStockReport,
  validateDispenseResult,
  unwrapValidation,
  PROTOCOL_VERSION,
} from '../dist/index.js';

const heartbeat = {
  protocolVersion: PROTOCOL_VERSION,
  deviceId: 'vend-001',
  sentAt: '2026-10-12T10:00:00Z',
  uptimeSeconds: 1200,
  firmwareVersion: '1.2.0',
  rssiDbm: -58,
};

test('accepts a valid heartbeat', () => {
  const result = validateHeartbeat(heartbeat);
  assert.equal(result.ok, true);
  if (result.ok) assert.equal(result.value.deviceId, 'vend-001');
});

test('rejects a non-object heartbeat', () => {
  const result = validateHeartbeat(null);
  assert.equal(result.ok, false);
  if (!result.ok) assert.equal(result.issues[0]?.path, '$');
});

test('rejects unsupported protocol versions', () => {
  const result = validateHeartbeat({ ...heartbeat, protocolVersion: 99 });
  assert.equal(result.ok, false);
  if (!result.ok) assert.ok(result.issues.some((issue) => issue.path === 'protocolVersion'));
});

test('rejects timestamps without explicit timezone', () => {
  const result = validateHeartbeat({ ...heartbeat, sentAt: '2026-10-12T10:00:00' });
  assert.equal(result.ok, false);
});

test('rejects negative uptime', () => {
  assert.equal(validateHeartbeat({ ...heartbeat, uptimeSeconds: -1 }).ok, false);
});

test('rejects out-of-range RSSI', () => {
  assert.equal(validateHeartbeat({ ...heartbeat, rssiDbm: 10 }).ok, false);
});

test('accepts telemetry with one valid measurement', () => {
  const result = validateTelemetry({
    protocolVersion: 1,
    deviceId: 'vend-001',
    observedAt: '2026-10-12T10:00:00+00:00',
    temperatureC: 37.2,
  });
  assert.equal(result.ok, true);
});

test('rejects telemetry without measurements', () => {
  assert.equal(validateTelemetry({
    protocolVersion: 1,
    deviceId: 'vend-001',
    observedAt: '2026-10-12T10:00:00Z',
  }).ok, false);
});

test('rejects non-finite telemetry numbers', () => {
  assert.equal(validateTelemetry({
    protocolVersion: 1,
    deviceId: 'vend-001',
    observedAt: '2026-10-12T10:00:00Z',
    voltageV: Number.NaN,
  }).ok, false);
});

test('accepts a valid stock report', () => {
  const result = validateStockReport({
    protocolVersion: 1,
    deviceId: 'vend-001',
    observedAt: '2026-10-12T10:00:00Z',
    slots: [
      { slot: 1, sku: 'water-500ml', quantity: 3, capacity: 10 },
      { slot: 2, sku: 'chips', quantity: 8, capacity: 10 },
    ],
  });
  assert.equal(result.ok, true);
});

test('rejects duplicate stock slot numbers', () => {
  const result = validateStockReport({
    protocolVersion: 1,
    deviceId: 'vend-001',
    observedAt: '2026-10-12T10:00:00Z',
    slots: [
      { slot: 1, sku: 'water', quantity: 1, capacity: 10 },
      { slot: 1, sku: 'chips', quantity: 1, capacity: 10 },
    ],
  });
  assert.equal(result.ok, false);
  if (!result.ok) assert.ok(result.issues.some((issue) => issue.path.endsWith('.slot')));
});

test('rejects quantity above capacity', () => {
  assert.equal(validateStockReport({
    protocolVersion: 1,
    deviceId: 'vend-001',
    observedAt: '2026-10-12T10:00:00Z',
    slots: [{ slot: 1, sku: 'water', quantity: 11, capacity: 10 }],
  }).ok, false);
});

test('accepts a confirmed dispense result', () => {
  assert.equal(validateDispenseResult({
    protocolVersion: 1,
    deviceId: 'vend-001',
    requestId: 'req-0001',
    reportedAt: '2026-10-12T10:00:00Z',
    sku: 'water',
    slot: 1,
    outcome: 'confirmed',
  }).ok, true);
});

test('requires a failure code for failed dispense results', () => {
  assert.equal(validateDispenseResult({
    protocolVersion: 1,
    deviceId: 'vend-001',
    requestId: 'req-0002',
    reportedAt: '2026-10-12T10:00:00Z',
    sku: 'water',
    slot: 1,
    outcome: 'failed',
  }).ok, false);
});

test('rejects a failure code on a confirmed dispense', () => {
  assert.equal(validateDispenseResult({
    protocolVersion: 1,
    deviceId: 'vend-001',
    requestId: 'req-0003',
    reportedAt: '2026-10-12T10:00:00Z',
    sku: 'water',
    slot: 1,
    outcome: 'confirmed',
    failureCode: 'MOTOR_JAM',
  }).ok, false);
});

test('unwrapValidation returns a value or throws a concise TypeError', () => {
  assert.equal(unwrapValidation(validateHeartbeat(heartbeat)).deviceId, 'vend-001');
  assert.throws(() => unwrapValidation(validateHeartbeat({})), /Invalid device message/);
});
