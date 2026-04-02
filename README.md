# eLekha

React Native + Expo Router app using WatermelonDB for local-first persistence.

## Platform policy

This project is **mobile-only** (Android and iOS).
Web build/export is intentionally unsupported because WatermelonDB relies on native SQLite integration in this app.

## Local setup

1. Install dependencies:

```bash
npm install
```

2. Build native app:

```bash
npx expo prebuild --clean
npx expo run:android
# or
npx expo run:ios
```

3. Start dev server for dev client:

```bash
npm run start:dev-client
```

## Quality gates

```bash
npm run lint
npx tsc --noEmit
npm run test
npx expo export --platform ios,android
```
"# BusinessManagement" 
