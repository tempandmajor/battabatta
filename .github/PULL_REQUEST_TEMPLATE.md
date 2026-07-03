## Summary

Describe what changed and why.

## Checks

- [ ] `npm run typecheck`
- [ ] `npm run lint`
- [ ] `npm run test`
- [ ] `npm run test:e2e` if UI or workflow behavior changed

## Boundary Review

- [ ] Preserves free-first barter access
- [ ] Preserves approximate-only public location
- [ ] Does not add user-to-user payments, credits, escrow, settlement, exchange valuation, or completed-exchange accounting
- [ ] Keeps Supabase access RLS-first
- [ ] Handles security-sensitive details according to `SECURITY.md`

## Notes

Add screenshots, migration notes, or follow-up work as needed.
