# Contributing

Thanks for contributing to BattaBatta.

## Development Expectations

- Keep core barter access free.
- Do not add payments, credits, escrow, user-to-user settlement, completed-exchange accounting, or exchange valuation.
- Preserve approximate public location privacy.
- Treat all Supabase data access as RLS-first.
- Add tests for authorization, location privacy, offer state changes, and payment boundaries.

## Pull Requests

Before opening a PR:

```bash
npm run typecheck
npm run lint
npm run test
```

For UI or workflow changes, also run:

```bash
npm run test:e2e
```

## Security

Do not report vulnerabilities in public issues. Follow `SECURITY.md`.
