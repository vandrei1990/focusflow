# FocusFlow

A time management app with Pomodoro timer, task tracking, and productivity analytics.
Runs as a web app, PWA (installable on Android/iOS/Windows), or native Android APK.

---

## Prerequisites

| Tool | Version | Install |
|------|---------|---------|
| Node.js | 20+ | https://nodejs.org |
| npm | 10+ | comes with Node |
| Java JDK | 17+ | for Android builds only |
| Android Studio | latest | for Android builds only |

---

## Run locally (web)

```bash
cd 60_Testing/focusflow
npm install
npm run dev
```

Open http://localhost:5173

---

## Install as PWA (Android / iOS / Windows)

A PWA works on any device without an app store. You just need to serve the built app over HTTPS or localhost.

### Build

```bash
npm run build
npm run preview   # serves on http://localhost:4173
```

### Android (Chrome)
1. Open Chrome and navigate to the app URL
2. Tap the three-dot menu → **Add to Home screen**
3. Tap **Install** — the app appears on your home screen with its own icon

### iOS (Safari)
1. Open Safari and navigate to the app URL
2. Tap the **Share** button (box with arrow)
3. Scroll down and tap **Add to Home Screen**
4. Tap **Add** — the app opens fullscreen like a native app

### Windows (Edge or Chrome)
1. Open Edge/Chrome and navigate to the app URL
2. Click the install icon in the address bar (or menu → **Apps** → **Install this site as an app**)
3. The app installs as a standalone window

> **Note:** For PWA install to work on your other devices, the app needs to be accessible over the network — either deploy it (see below) or run `npm run preview` on a machine and access it via local IP: `http://192.168.x.x:4173`

---

## Build Android APK (native)

This produces an `.apk` you can sideload or submit to the Play Store.

### One-time setup

1. Install [Android Studio](https://developer.android.com/studio)
2. In Android Studio → SDK Manager, install **Android SDK** (API 34+) and **Build Tools**
3. Set environment variables:
   ```bash
   export ANDROID_HOME=$HOME/Library/Android/sdk        # macOS default
   export PATH=$PATH:$ANDROID_HOME/platform-tools
   ```
4. Add the Android platform to the project:
   ```bash
   npx cap add android
   ```
   > This creates the `android/` folder. Only needed once.

### Build the APK

```bash
npm run cap:sync          # builds React app + syncs to android/
npm run cap:android       # opens Android Studio
```

In Android Studio:
- **Build → Build Bundle(s) / APK(s) → Build APK(s)**
- APK output: `android/app/build/outputs/apk/debug/app-debug.apk`

Or build from the terminal without Android Studio:

```bash
npm run build
npx cap sync android
cd android
./gradlew assembleDebug
```

APK will be at `android/app/build/outputs/apk/debug/app-debug.apk`.

### Install on a connected Android device

```bash
adb install android/app/build/outputs/apk/debug/app-debug.apk
```

---

## GitHub Actions — automated APK build

Every push to `main` that touches `src/` triggers a build and uploads the APK as an artifact.

**Workflow:** `.github/workflows/build-android.yml`

To use it:
1. Push this project to a GitHub repository
2. The workflow runs automatically on push
3. Go to **Actions → build-android → Artifacts** to download `screenlens-debug-<sha>.apk`

For a **signed release APK** (required for Play Store), add these repository secrets:
- `KEYSTORE_BASE64` — base64-encoded `.jks` keystore file
- `KEY_ALIAS` — key alias
- `KEY_PASSWORD` — key password
- `STORE_PASSWORD` — keystore password

Then change `assembleDebug` to `assembleRelease` in the workflow.

---

## Deploy to the web (share with others)

Any static hosting works since this is a pure frontend app.

### Vercel (easiest)
```bash
npm install -g vercel
npm run build
vercel deploy dist/
```

### Netlify
```bash
npm run build
npx netlify-cli deploy --prod --dir dist
```

### GitHub Pages
```bash
npm run build
# push dist/ to gh-pages branch, or use the gh-pages npm package
```

After deploying, your PWA install link is the live URL — share it with anyone.

---

## Project structure

```
focusflow/
  src/
    pages/         # Dashboard, Timer, Tasks, Analytics, Settings
    components/    # Layout, NavBar, ActiveSessionBanner, ProjectBadge
    stores/        # Zustand store (persisted to localStorage)
    hooks/         # useLiveTimer
    lib/           # utils, constants
  public/          # Static assets, icons
  android/         # Capacitor Android project (after npx cap add android)
  .github/
    workflows/
      build-android.yml
```

All data is stored locally in the browser's `localStorage` — nothing is sent to any server.

---

## Exporting your data

Go to **Settings → Data → Export** to download a `focusflow-export-YYYY-MM-DD.json` file with all your sessions, tasks, and projects.
