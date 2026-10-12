# Security Policy

VendEdge Contracts checks message shape and value ranges. It is not an authentication, authorization, encryption, anti-replay, payment, or machine-safety system.

## Report a vulnerability

Please use GitHub's private vulnerability reporting for this repository if enabled. Otherwise, contact the maintainer privately before sharing exploitable details. Do not publish secrets, real device credentials, member identifiers, or production payloads in public issues.

## Scope

Security reports are relevant if the library unexpectedly accepts malformed input in a way that could cause unsafe downstream assumptions, throws on ordinary untrusted JSON input, mishandles boundary values, or documents a guarantee it does not actually provide.

## Important limitations

- A valid payload is not proof of sender identity.
- Application code must still authorize a device and operation.
- Purchase endpoints need application-level idempotency and transaction consistency.
- Device-supplied telemetry and timestamps are untrusted input.
- Physical dispensing must be confirmed according to the hardware's actual sensors and safety design.
