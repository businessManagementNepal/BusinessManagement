# Local Database Release Checklist

This checklist is mandatory for any release that changes:
- `shared/database/appDatabase.ts`
- `shared/database/migration.ts`
- feature database schemas
- custom SQL indexes
- startup integrity checks

## Non-negotiable rules

- Never edit an already shipped migration.
- Repair existing installed databases with a new forward migration only.
- Every custom SQL schema object must have:
  - create SQL
  - drop SQL if repair/rebuild is needed
  - cleanup SQL if uniqueness depends on backfill or dedupe
  - startup integrity verification
  - dedicated automated tests
- Startup integrity checks must not be removed to make a release pass.

## Required release gates

- [ ] `npm run typecheck`
- [ ] `npm run test`
- [ ] `npm run test:database`
- [ ] `npm run test:startup`

`test:database` must cover:
- integrity invariant tests
- migration contract tests
- startup orchestration tests

## Required manual verification

### Fresh install
- [ ] Install the current release candidate on a clean emulator/device
- [ ] Launch the app
- [ ] Confirm startup succeeds
- [ ] Confirm no database integrity error is shown

### Upgrade path
- [ ] Install the previous production build
- [ ] Create realistic local business data
- [ ] Upgrade to the current release candidate
- [ ] Launch the app
- [ ] Confirm startup succeeds
- [ ] Confirm no database integrity error is shown

### Schema-object verification
- [ ] Verify every required custom index exists after upgrade
- [ ] Verify duplicate cleanup logic ran successfully before unique index creation
- [ ] Verify startup integrity checks pass after migration
- [ ] Verify app schema version matches the latest migration version
- [ ] Verify any repair migration preserves the required SQL step order
- [ ] Verify startup orchestration still runs database health check -> fetchCount -> integrity checks -> health check

### Startup failure verification
- [ ] Verify startup failures emit structured logs with failed task key and support code
- [ ] Verify database startup failures are classified into setup vs integrity vs unknown
- [ ] Verify startup error UI shows a safe message plus support code
- [ ] Verify retry does not create overlapping startup bootstrap runs
- [ ] Verify the session app shell does not mount before startup bootstrap reaches Ready
- [ ] Verify retry after a startup failure shows a startup loading surface and never falls to a blank screen

## Release evidence to record

- App build SHA:
- Previous build tested:
- New schema version:
- Emulator/device used:
- Fresh install result:
- Upgrade result:
- Notes:
