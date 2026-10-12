/**
 * Framework-neutral adapter example.
 *
 * Call this only after the HTTP layer has authenticated and authorized the
 * sender and parsed the JSON body safely. This adapter validates a message;
 * it does not authenticate devices, authorize transactions, or execute a vend.
 */
import {
  validateHeartbeat,
  validateTelemetry,
  validateStockReport,
  validateDispenseResult,
} from '../dist/index.js';

const validators = new Map([
  ['/v1/device/heartbeat', validateHeartbeat],
  ['/v1/device/telemetry', validateTelemetry],
  ['/v1/device/stock', validateStockReport],
  ['/v1/device/dispense-result', validateDispenseResult],
]);

/**
 * Example request adapter for an API handler.
 *
 * @param {{method: string, path: string, body: unknown}} request
 * @returns {{status: number, body: object}}
 */
export function validateDeviceRequest({ method, path, body }) {
  if (method !== 'POST') {
    return { status: 405, body: { ok: false, error: 'method_not_allowed' } };
  }

  const validator = validators.get(path);
  if (!validator) {
    return { status: 404, body: { ok: false, error: 'unknown_device_route' } };
  }

  const result = validator(body);
  if (!result.ok) {
    return {
      status: 400,
      body: { ok: false, error: 'invalid_message', issues: result.issues },
    };
  }

  return {
    status: 200,
    body: { ok: true, validatedMessage: result.value },
  };
}
