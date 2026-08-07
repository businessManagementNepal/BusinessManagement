# eLekha Android CI/CD Setup

## Overview

eLekha uses GitHub Actions for validation and release orchestration, Expo EAS
Build for signed Android App Bundles, EAS Submit for store delivery, and Google
Play Internal Testing as the first release track.

The CI workflow runs on pull requests and pushes to `dev` and `main`, and can
also be started manually. The Android release workflow is manual and can build
without submitting when `submit_to_play` is disabled.

## GitHub configuration

### Required repository secret

Create this GitHub Actions repository secret:

```text
EXPO_TOKEN
```

Create it under:

```text
GitHub repository
→ Settings
→ Secrets and variables
→ Actions
→ New repository secret
```

Generate the token from the Expo account that owns
`@parasdhami2/elekha` (project ID
`2ca25565-588e-4fdb-85c9-88d3f8a9bd87`).

### Required GitHub environment

Create this environment:

```text
google-play-internal
```

Create it under:

```text
GitHub repository
→ Settings
→ Environments
→ New environment
```

Recommended protection:

- Require a reviewer.
- Restrict deployment branches to `dev` and `main`.
- Prevent administrator bypass when appropriate.

## Expo configuration

Confirm that the logged-in Expo account owns the linked project:

```bash
npx eas-cli login
npx eas-cli whoami
npx eas-cli project:info
```

The repository uses the EAS `production` environment and remote Android
version-code management. Production builds are App Bundles and increment the
remote version code automatically.

If Android credentials need to be initialized or replaced, run one production
build interactively:

```bash
npx eas-cli build --platform android --profile production
```

EAS should securely manage the Android upload keystore unless the project
already uses an approved existing keystore.

## Production API URL

The application expects:

```text
EXPO_PUBLIC_API_BASE_URL
```

Create it in the EAS production environment with the real HTTPS origin:

```bash
npx eas-cli env:create \
  --name EXPO_PUBLIC_API_BASE_URL \
  --value https://YOUR-PRODUCTION-API-DOMAIN \
  --environment production \
  --visibility plaintext
```

Use an HTTPS origin without an API path. Never put passwords, private API keys,
database credentials, or server secrets in variables beginning with
`EXPO_PUBLIC_`.

## Android package decision

The current Android package is:

```text
com.anonymous.elekha
```

This value is intentionally preserved because the linked EAS project already
has production Android App Bundles. Before creating or selecting the Google
Play application, confirm whether this exact package has already been
registered.

Only if no Play application or distributed build has ever used the current
package may the team deliberately migrate to:

```text
com.businessmanagementnepal.elekha
```

Changing the package after Play registration creates a different application
and cannot update the existing listing.

## Google Play setup

Create or confirm the Google Play application using the exact, manually
confirmed Android package. Complete these Play Console requirements:

- Store listing
- App access
- Ads declaration
- Content rating
- Target audience
- Data Safety form
- Privacy policy
- Account deletion details
- Internal testing configuration

## Google Play service account

Create a Google Cloud service account for EAS Submit and grant only the Google
Play permissions needed to upload and manage internal-testing releases.
Configure its JSON key through Expo/EAS Android credentials.

Do not:

- Commit the JSON file.
- Store it in the application source directory.
- Add it to `app.json`.
- Print it in GitHub Actions logs.
- Send it through pull-request comments.

## Running the release

Open:

```text
GitHub
→ Actions
→ CD - Android Internal Testing
→ Run workflow
```

Choose whether to submit the build. With `submit_to_play` enabled, the workflow:

1. Runs Expo Doctor, lint, TypeScript, theme, test, config, and export checks.
2. Builds a signed production Android App Bundle.
3. Waits for EAS Build to finish.
4. Submits the latest production build to Google Play Internal Testing.

## Manual responsibilities

The developer must:

- Confirm the final Android package and Expo project ownership.
- Confirm or initialize the EAS Android upload keystore.
- Configure the production API URL as HTTPS.
- Create or confirm the matching Google Play application.
- Complete all Play Console declarations.
- Create and permission the Google Play service account.
- Configure the service-account key through EAS credentials.
- Create an Expo personal access token and add `EXPO_TOKEN` to GitHub.
- Create and protect the `google-play-internal` GitHub environment.
- Run and review the first internal-testing release.

## Credentials that must never be committed

- Expo access tokens
- Google service-account JSON files
- Android keystores
- Keystore or signing passwords
- Production API secrets
- Database credentials
