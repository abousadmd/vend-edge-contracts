# Contributing

Thanks for considering a contribution to VendEdge Contracts.

## Good contributions

- Fix a validator bug with a focused regression test.
- Propose a contract change with examples from multiple device/backend implementations.
- Improve documentation while keeping security limitations explicit.
- Add tests for malformed input, numeric boundaries, duplicate slots, timezones, and unknown dispense outcomes.

## Development

```sh
npm install
npm test
```

The project targets Node.js 20+ and TypeScript strict mode. It intentionally has no runtime dependencies.

## Pull requests

Include the problem statement, expected behaviour, tests run, and any compatibility impact. Do not claim hardware validation unless it was performed on a named setup. Keep changes focused and avoid including credentials, member records, or production logs.

## Protocol changes

Changes to message fields or validation constraints may break consumers. Explain the interoperability impact and prefer an explicit protocol-version transition for incompatible changes. Do not silently weaken validation to make a single integration pass.
