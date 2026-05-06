# Dog Mode 2.0 Telemetry and Tablet UX

Issue: #63

## UX Contract

Dog Mode is designed for suite tablets and kiosk-style touch:

- `/dog` uses a single oversized boop pad, routine cards, and always-visible calm controls.
- `/dog/calm` defaults to reduced motion and starts audio only after an explicit touch.
- All primary controls are at least 56 px high, with the boop pad at 280 px or larger.
- Reduced motion is enabled by default. Optional animation is user-controlled.
- High contrast is available on both routes without hiding controls.
- Staff signals are visible in the UI as aggregate kiosk state, not identity-bearing records.

## Telemetry Schema

Source of truth: `src/lib/telemetry/dog-mode.ts`.

Every event is validated with `dogTelemetryEventSchema` before it is stored or emitted.

Required fields:

- `event`: one of `dog_mode_view`, `dog_mode_boop`, `dog_mode_schedule_select`, `dog_mode_calm_toggle`, `dog_mode_motion_preference`, `dog_mode_staff_signal_view`
- `schemaVersion`: `dog-mode-2.0`
- `occurredAt`: ISO datetime
- `sessionId`: anonymous kiosk session id matching `dog_[a-z0-9]{10,40}`
- `surface`: `dog` or `dog_calm`
- `mode`: `standard` or `calm`
- `reducedMotion`: boolean
- `highContrast`: boolean

Conditional fields:

- `scheduleSlot` is required for `dog_mode_schedule_select`.
- `calmEnabled` is required for `dog_mode_calm_toggle`.
- `target` can include a short control id and label.
- `staffSignal` can include aggregate counts and the visibility class.

## Privacy Rules

Dog Mode telemetry must not include PII or booking data.

Forbidden key families include owner, pet, booking, suite, contact, email, phone, name, address, breed, user, and ids for pets or bookings.

The validated output is safe for:

- Local kiosk session storage for recent interaction debugging.
- Aggregate staff dashboard rollups by hour or day.
- Operational health checks that count interaction volume.

It is not safe to extend with owner names, pet names, booking numbers, suite assignments, free-text notes, or contact details.

## Staff-Facing Visibility

Staff can see:

- Boop count for the current kiosk session.
- Calm request state.
- Last interaction category: `none`, `boop`, `schedule`, `calm`, or `motion`.
- Reduced-motion state.
- Aggregate dashboard rollups for boops, routine taps, and calm toggles.

Staff must not see through this telemetry stream:

- Owner identity.
- Pet identity.
- Booking or payment identity.
- Suite assignment.
- Free-text notes.

## Validation

Automated coverage:

- `src/lib/telemetry/__tests__/dog-mode.test.ts` validates schema requirements, strict-field rejection, no-PII detection, and the public contract.
- `tests/e2e/dog-mode.spec.ts` validates tablet touch size, calm toggle, telemetry emission, staff signal visibility, and accessibility score `>= 95` on `/dog` and `/dog/calm`.

Suggested verification:

```bash
pnpm vitest run src/lib/telemetry/__tests__/dog-mode.test.ts
pnpm test:e2e -- tests/e2e/dog-mode.spec.ts
```
