# Unit Matching Logic

## Hard Filters

Reject candidates that fail:
- availability
- project/location requirement
- property type
- budget ceiling where explicitly strict

## Soft Ranking

Score remaining candidates by:
- budget proximity
- location preference
- bedrooms
- area
- delivery timing
- payment-plan fit
- preferred features

## Example Formula

```text
Match Score =
  Budget Fit × 0.30
+ Location Fit × 0.20
+ Type Fit × 0.15
+ Bedroom Fit × 0.10
+ Area Fit × 0.10
+ Payment Fit × 0.10
+ Feature Fit × 0.05
```

Never recommend an unavailable unit as available.
