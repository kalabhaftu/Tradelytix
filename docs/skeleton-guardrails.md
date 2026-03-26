# Skeleton Guardrails (Non-Dashboard)

## Goal
Keep loading states visually consistent across non-dashboard routes by using shared primitives from:

- `components/ui/non-dashboard-skeletons.tsx`

## Rule
Do not add new ad-hoc skeleton markup with one-off `animate-pulse` blocks in non-dashboard pages.

## Preferred Pattern
1. Route-level loading: use `loading.tsx` with a shared route skeleton.
2. Section/tab loading: use shared primitives (`TablePanelSkeleton`, `StatsGridSkeleton`, `FormFieldsSkeleton`, etc.).
3. Inline action feedback: use `Spinner` only for control-level operations (button refresh/save states).

## Quick Check Before PR
Run:

```bash
rg --line-number "animate-pulse" app/dashboard components | rg -v "components/ui/skeleton.tsx|components/ui/dashboard-skeleton.tsx|app/dashboard/components/charts|widget-registry-lazy"
```

If new non-dashboard skeleton-like one-offs appear, migrate them to `components/ui/non-dashboard-skeletons.tsx`.
