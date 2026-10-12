# VendEdge Contracts

**Typed message contracts and runtime validators for connected vending and edge-device systems.**

VendEdge Contracts helps firmware and backend teams agree on predictable payloads for device heartbeats, telemetry, stock reports, and dispensing outcomes. It is a standalone TypeScript library designed to work independently of any particular vending platform.

## Scope

This library validates message shape and value ranges only. It does **not** authenticate devices, authorize purchases, secure network transport, manage inventory, or guarantee that a physical dispense occurred.

## Features

- Versioned TypeScript message types (protocol version 1)
- Runtime validators for heartbeat, telemetry, stock, and dispense-result messages
- Field-specific validation issues
- Timezone-qualified timestamp, identifier, numeric range, duplicate slot, and stock capacity checks
- Zero runtime dependencies
- Automated tests using Node's built-in test runner

## Quick start

Requires Node.js 20 or newer.

~~~sh
npm install
npm test
~~~

Build the package with `npm run build`. See `examples/validate-messages.mjs` for example messages.

## Security notes

Validating a payload is not proof of sender identity. Integrating applications must authenticate devices, authorize operations server-side, protect network traffic with TLS, and implement replay protection and idempotency where needed. Device telemetry and timestamps remain untrusted input. See [SECURITY.md](SECURITY.md).

## Development status

This is an initial 0.1.0 release for feedback. Before a stable 1.0 release, maintainers should gather interoperability feedback, validate ranges against real hardware classes, and establish a compatibility policy. Do not represent this as a widely adopted project without evidence.

## License

MIT. See [LICENSE](LICENSE).
