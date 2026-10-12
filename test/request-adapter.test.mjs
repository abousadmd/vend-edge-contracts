import test from 'node:test';
import assert from 'node:assert/strict';
import { validateDeviceRequest } from '../examples/request-adapter.mjs';

const heartbeat = {
  protocolVersion: 1,
  deviceId: 'vend-001',
  sentAt: '2026-10-12T10:00:00Z',
  uptimeSeconds: 1200,
  firmwareVersion: '1.2.0',
  rssiDbm: -58,
};

test('adapter returns a validated heartbeat payload', () => {
  const response = validateDeviceRequest({
    method: 'POST',
    path: '/v1/device/heartbeat',
    body: heartbeat,
  });
  assert.equal(response.status, 200);
  assert.equal(response.body.ok, true);
  assert.equal(response.body.validatedMessage.deviceId, 'vend-001');
});

test('adapter returns field errors for malformed payloads', () => {
  const response = validateDeviceRequest({
    method: 'POST',
    path: '/v1/device/heartbeat',
    body: { ...heartbeat, uptimeSeconds: -10 },
  });
  assert.equal(response.status, 400);
  assert.equal(response.body.error, 'invalid_message');
  assert.ok(response.body.issues.some((issue) => issue.path === 'uptimeSeconds'));
});

test('adapter rejects unsupported methods', () => {
  const response = validateDeviceRequest({
    method: 'GET',
    path: '/v1/device/heartbeat',
    body: heartbeat,
  });
  assert.equal(response.status, 405);
});

test('adapter returns not found for unknown paths', () => {
  const response = validateDeviceRequest({
    method: 'POST',
    path: '/v1/device/purchase',
    body: heartbeat,
  });
  assert.equal(response.status, 404);
});

test('adapter validates stock capacity before returning a message', () => {
  const response = validateDeviceRequest({
    method: 'POST',
    path: '/v1/device/stock',
    body: {
      protocolVersion: 1,
      deviceId: 'vend-001',
      observedAt: '2026-10-12T10:00:00Z',
      slots: [{ slot: 1, sku: 'water', quantity: 11, capacity: 10 }],
    },
  });
  assert.equal(response.status, 400);
  assert.ok(response.body.issues.some((issue) => issue.path === 'slots[0].quantity'));
});
