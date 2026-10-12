/**
 * VendEdge Contracts
 *
 * Runtime validation for small, versioned messages exchanged by edge devices
 * and vending-system backends. This package validates shape and ranges only;
 * it does not authenticate devices, authorize purchases, or provide transport
 * security.
 */

export const PROTOCOL_VERSION = 1 as const;

export type ValidationIssue = {
  path: string;
  message: string;
};

export type ValidationResult<T> =
  | { ok: true; value: T }
  | { ok: false; issues: ValidationIssue[] };

export interface HeartbeatMessage {
  protocolVersion: typeof PROTOCOL_VERSION;
  deviceId: string;
  sentAt: string;
  uptimeSeconds: number;
  firmwareVersion: string;
  rssiDbm?: number;
}

export interface TelemetryMessage {
  protocolVersion: typeof PROTOCOL_VERSION;
  deviceId: string;
  observedAt: string;
  voltageV?: number;
  temperatureC?: number;
  rssiDbm?: number;
}

export interface StockSlot {
  slot: number;
  sku: string;
  quantity: number;
  capacity: number;
}

export interface StockReport {
  protocolVersion: typeof PROTOCOL_VERSION;
  deviceId: string;
  observedAt: string;
  slots: StockSlot[];
}

export type DispenseOutcome = "confirmed" | "failed" | "unknown";

export interface DispenseResultMessage {
  protocolVersion: typeof PROTOCOL_VERSION;
  deviceId: string;
  requestId: string;
  reportedAt: string;
  sku: string;
  slot: number;
  outcome: DispenseOutcome;
  failureCode?: string;
}

const DEVICE_ID_PATTERN = /^[A-Za-z0-9][A-Za-z0-9._:-]{0,63}$/;
const SKU_PATTERN = /^[A-Za-z0-9][A-Za-z0-9._:-]{0,127}$/;
const REQUEST_ID_PATTERN = /^[A-Za-z0-9][A-Za-z0-9._:-]{0,127}$/;
const VERSION_PATTERN = /^[A-Za-z0-9][A-Za-z0-9.+_-]{0,63}$/;
const FAILURE_CODE_PATTERN = /^[A-Z][A-Z0-9_]{0,63}$/;
const TIMEZONE_SUFFIX = /(?:Z|[+-]\d{2}:\d{2})$/i;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function addIssue(issues: ValidationIssue[], path: string, message: string): void {
  issues.push({ path, message });
}

function requireProtocolVersion(
  input: Record<string, unknown>,
  issues: ValidationIssue[],
): void {
  if (input.protocolVersion !== PROTOCOL_VERSION) {
    addIssue(issues, "protocolVersion", `Must equal supported protocol version ${PROTOCOL_VERSION}.`);
  }
}

function requirePattern(
  input: Record<string, unknown>,
  key: string,
  pattern: RegExp,
  maxLength: number,
  issues: ValidationIssue[],
): void {
  const value = input[key];
  if (typeof value !== "string" || value.length === 0 || value.length > maxLength || !pattern.test(value)) {
    addIssue(issues, key, `Must be a non-empty string of at most ${maxLength} characters using the documented identifier characters.`);
  }
}

function requireTimestamp(
  input: Record<string, unknown>,
  key: string,
  issues: ValidationIssue[],
): void {
  const value = input[key];
  if (
    typeof value !== "string" ||
    value.length > 40 ||
    !TIMEZONE_SUFFIX.test(value) ||
    !Number.isFinite(Date.parse(value))
  ) {
    addIssue(issues, key, "Must be a valid timestamp with an explicit timezone, such as an ISO 8601 UTC timestamp.");
  }
}

function requireFiniteRange(
  input: Record<string, unknown>,
  key: string,
  min: number,
  max: number,
  issues: ValidationIssue[],
  integer = false,
): void {
  const value = input[key];
  if (
    typeof value !== "number" ||
    !Number.isFinite(value) ||
    value < min ||
    value > max ||
    (integer && !Number.isInteger(value))
  ) {
    addIssue(issues, key, `Must be a finite ${integer ? "integer" : "number"} between ${min} and ${max}.`);
  }
}

function validateObject<T>(
  input: unknown,
  validate: (record: Record<string, unknown>, issues: ValidationIssue[]) => void,
  construct: (record: Record<string, unknown>) => T,
): ValidationResult<T> {
  if (!isRecord(input)) {
    return { ok: false, issues: [{ path: "$", message: "Must be a JSON object." }] };
  }
  const issues: ValidationIssue[] = [];
  validate(input, issues);
  if (issues.length > 0) return { ok: false, issues };
  // Validators check every field used by their constructors before this point.
  return { ok: true, value: construct(input) };
}

function optionalRssi(input: Record<string, unknown>, issues: ValidationIssue[]): void {
  if (input.rssiDbm !== undefined) {
    requireFiniteRange(input, "rssiDbm", -127, 0, issues, true);
  }
}

export function validateHeartbeat(input: unknown): ValidationResult<HeartbeatMessage> {
  return validateObject(input, (record, issues) => {
    requireProtocolVersion(record, issues);
    requirePattern(record, "deviceId", DEVICE_ID_PATTERN, 64, issues);
    requireTimestamp(record, "sentAt", issues);
    requireFiniteRange(record, "uptimeSeconds", 0, Number.MAX_SAFE_INTEGER, issues, true);
    requirePattern(record, "firmwareVersion", VERSION_PATTERN, 64, issues);
    optionalRssi(record, issues);
  }, (record) => ({
    protocolVersion: PROTOCOL_VERSION,
    deviceId: record.deviceId as string,
    sentAt: record.sentAt as string,
    uptimeSeconds: record.uptimeSeconds as number,
    firmwareVersion: record.firmwareVersion as string,
    ...(record.rssiDbm === undefined ? {} : { rssiDbm: record.rssiDbm as number }),
  }));
}

export function validateTelemetry(input: unknown): ValidationResult<TelemetryMessage> {
  return validateObject(input, (record, issues) => {
    requireProtocolVersion(record, issues);
    requirePattern(record, "deviceId", DEVICE_ID_PATTERN, 64, issues);
    requireTimestamp(record, "observedAt", issues);
    const hasMeasurement = ["voltageV", "temperatureC", "rssiDbm"].some((key) => record[key] !== undefined);
    if (!hasMeasurement) addIssue(issues, "$", "Provide at least one telemetry measurement.");
    if (record.voltageV !== undefined) requireFiniteRange(record, "voltageV", 0, 1000, issues);
    if (record.temperatureC !== undefined) requireFiniteRange(record, "temperatureC", -100, 250, issues);
    optionalRssi(record, issues);
  }, (record) => ({
    protocolVersion: PROTOCOL_VERSION,
    deviceId: record.deviceId as string,
    observedAt: record.observedAt as string,
    ...(record.voltageV === undefined ? {} : { voltageV: record.voltageV as number }),
    ...(record.temperatureC === undefined ? {} : { temperatureC: record.temperatureC as number }),
    ...(record.rssiDbm === undefined ? {} : { rssiDbm: record.rssiDbm as number }),
  }));
}

export function validateStockReport(input: unknown): ValidationResult<StockReport> {
  return validateObject(input, (record, issues) => {
    requireProtocolVersion(record, issues);
    requirePattern(record, "deviceId", DEVICE_ID_PATTERN, 64, issues);
    requireTimestamp(record, "observedAt", issues);
    if (!Array.isArray(record.slots) || record.slots.length < 1 || record.slots.length > 512) {
      addIssue(issues, "slots", "Must be an array containing between 1 and 512 stock slots.");
      return;
    }
    const seenSlots = new Set<number>();
    record.slots.forEach((rawSlot, index) => {
      const path = `slots[${index}]`;
      if (!isRecord(rawSlot)) {
        addIssue(issues, path, "Must be an object.");
        return;
      }
      requireFiniteRange(rawSlot, "slot", 1, 512, issues, true);
      requirePattern(rawSlot, "sku", SKU_PATTERN, 128, issues);
      requireFiniteRange(rawSlot, "quantity", 0, 100_000, issues, true);
      requireFiniteRange(rawSlot, "capacity", 1, 100_000, issues, true);
      if (typeof rawSlot.slot === "number" && Number.isInteger(rawSlot.slot)) {
        if (seenSlots.has(rawSlot.slot)) addIssue(issues, `${path}.slot`, "Slot numbers must be unique in a report.");
        seenSlots.add(rawSlot.slot);
      }
      if (
        typeof rawSlot.quantity === "number" &&
        typeof rawSlot.capacity === "number" &&
        Number.isFinite(rawSlot.quantity) &&
        Number.isFinite(rawSlot.capacity) &&
        rawSlot.quantity > rawSlot.capacity
      ) {
        addIssue(issues, `${path}.quantity`, "Cannot exceed slot capacity.");
      }
    });
  }, (record) => ({
    protocolVersion: PROTOCOL_VERSION,
    deviceId: record.deviceId as string,
    observedAt: record.observedAt as string,
    slots: (record.slots as Record<string, unknown>[]).map((slot) => ({
      slot: slot.slot as number,
      sku: slot.sku as string,
      quantity: slot.quantity as number,
      capacity: slot.capacity as number,
    })),
  }));
}

export function validateDispenseResult(input: unknown): ValidationResult<DispenseResultMessage> {
  return validateObject(input, (record, issues) => {
    requireProtocolVersion(record, issues);
    requirePattern(record, "deviceId", DEVICE_ID_PATTERN, 64, issues);
    requirePattern(record, "requestId", REQUEST_ID_PATTERN, 128, issues);
    requireTimestamp(record, "reportedAt", issues);
    requirePattern(record, "sku", SKU_PATTERN, 128, issues);
    requireFiniteRange(record, "slot", 1, 512, issues, true);
    if (!(record.outcome === "confirmed" || record.outcome === "failed" || record.outcome === "unknown")) {
      addIssue(issues, "outcome", 'Must be "confirmed", "failed", or "unknown".');
    }
    if (record.failureCode !== undefined) {
      requirePattern(record, "failureCode", FAILURE_CODE_PATTERN, 64, issues);
    }
    if (record.outcome === "failed" && typeof record.failureCode !== "string") {
      addIssue(issues, "failureCode", "Is required when outcome is failed.");
    }
    if (record.outcome === "confirmed" && record.failureCode !== undefined) {
      addIssue(issues, "failureCode", "Must be omitted when outcome is confirmed.");
    }
  }, (record) => ({
    protocolVersion: PROTOCOL_VERSION,
    deviceId: record.deviceId as string,
    requestId: record.requestId as string,
    reportedAt: record.reportedAt as string,
    sku: record.sku as string,
    slot: record.slot as number,
    outcome: record.outcome as DispenseOutcome,
    ...(record.failureCode === undefined ? {} : { failureCode: record.failureCode as string }),
  }));
}

/** Throw a readable error when a validation result is unsuccessful. */
export function unwrapValidation<T>(result: ValidationResult<T>): T {
  if (result.ok) return result.value;
  const detail = result.issues.map((issue) => `${issue.path}: ${issue.message}`).join("; ");
  throw new TypeError(`Invalid device message: ${detail}`);
}
