import {
  validateHeartbeat,
  validateTelemetry,
  validateStockReport,
  validateDispenseResult,
} from '../dist/index.js';

const examples = [
  ['heartbeat', validateHeartbeat({
    protocolVersion: 1,
    deviceId: 'vend-001',
    sentAt: '2026-10-12T10:00:00Z',
    uptimeSeconds: 1200,
    firmwareVersion: '1.2.0',
    rssiDbm: -58,
  })],
  ['telemetry', validateTelemetry({
    protocolVersion: 1,
    deviceId: 'vend-001',
    observedAt: '2026-10-12T10:00:00Z',
    voltageV: 12.1,
    temperatureC: 38.5,
  })],
  ['stock', validateStockReport({
    protocolVersion: 1,
    deviceId: 'vend-001',
    observedAt: '2026-10-12T10:00:00Z',
    slots: [{ slot: 1, sku: 'water', quantity: 4, capacity: 10 }],
  })],
  ['dispense-result', validateDispenseResult({
    protocolVersion: 1,
    deviceId: 'vend-001',
    requestId: 'req-0001',
    reportedAt: '2026-10-12T10:00:00Z',
    sku: 'water',
    slot: 1,
    outcome: 'failed',
    failureCode: 'PRODUCT_NOT_DETECTED',
  })],
];

for (const [name, result] of examples) {
  console.log(JSON.stringify({ name, ...result }, null, 2));
}
