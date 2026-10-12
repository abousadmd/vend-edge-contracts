# VendEdge Contracts

[![CI](https://github.com/abousadmd/vend-edge-contracts/actions/workflows/ci.yml/badge.svg)](https://github.com/abousadmd/vend-edge-contracts/actions/workflows/ci.yml)

**Typed message contracts and runtime validators for connected vending and edge-device systems.**

VendEdge Contracts helps firmware and backend teams agree on predictable payloads for device heartbeats, telemetry, stock reports, and dispensing outcomes. It is a standalone TypeScript library designed to work independently of any particular vending platform.

## Scope

This library validates message shape and value ranges only. It does **not** authenticate devices, authorize purchases, secure network transport, manage inventory, or guarantee that a physical dispense occurred.

## Features

- Versioned TypeScript message types (protocol version 1)
- Runtime validators for heartbeat, telemetry, stock, and dispense-result messages
- Field-specific validation issues
- Timezone-qualified timestamp, identifier, numeric range, duplicate slot, and stock capacity checks
- Zero runtime dependencies at runtime
- Automated tests using Node's built-in test runner
- Framework-neutral example showing how a server handler can validate messages

## Quick start

Requires Node.js 20 or newer.

```sh
npm install
npm test
```

Build the package with `npm run build`. See [examples/validate-messages.mjs](examples/validate-messages.mjs) for validator samples and [examples/request-adapter.mjs](examples/request-adapter.mjs) for a framework-neutral handler adapter.

## API overview

- `validateHeartbeat(input)`
- `validateTelemetry(input)`
- `validateStockReport(input)`
- `validateDispenseResult(input)`
- `unwrapValidation(result)`

Each validator returns a discriminated result: `{ ok: true, value }` or `{ ok: false, issues }`. Validation errors include a field path and human-readable message.

## Security notes

The adapter example assumes that the surrounding HTTP handler has already authenticated and authorized the requester and parsed the request body with an appropriate size limit. Validating a payload is not proof of sender identity. Integrating applications must authenticate devices, authorize operations server-side, protect network traffic with TLS, and implement replay protection and idempotency where needed. Device telemetry and timestamps remain untrusted input. See [SECURITY.md](SECURITY.md).

## Development status

The package version is currently `0.1.0` and should be treated as early-stage software. Before a stable `1.0.0` release, maintainers should gather interoperability feedback, validate ranges against real hardware classes, and establish a compatibility policy. Do not represent this as a widely adopted project without evidence.

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for development and pull request guidance. Report security concerns according to [SECURITY.md](SECURITY.md), not in a public issue.

## License

MIT. See [LICENSE](LICENSE).
