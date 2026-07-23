# JagX OS on Android (real launcher app)

JagX OS now runs full-screen as a genuine Android app instead of a webpage
mockup, and can be set as your **Home app** (long-press Home / Settings →
Apps → Default apps → Home app → JagX OS).

## How it's wired up

- **`src/routes/index.tsx`** — the marketing landing page and phone-bezel
  mockup are gone. `JagXOS` now renders edge-to-edge (`fixed inset-0`,
  `100dvh`, safe-area insets) — this component *is* the screen.
- **Real-time status bar** — the clock ticks every second from the device
  clock, battery % / charging state comes from the real Battery Status API
  when available, and the signal/wifi glyphs dim when the device goes
  offline.
- **Hardware/gesture back button** — handled via `@capacitor/app` so Back
  closes an open app or the lock screen instead of exiting (there's nothing
  to exit to once this is the launcher).
- **`capacitor.config.ts`** — wraps the static `dist/` build into a native
  Android WebView shell, `appId: com.jagx.os`.
- **`android-overrides/`** — a small override of the generated Capacitor
  Android project:
  - `AndroidManifest.xml` adds a second intent-filter
    (`HOME` + `DEFAULT`) alongside the normal `LAUNCHER` one, which is what
    makes Android offer JagX OS as a Home-app replacement.
  - `MainActivity.java` makes the WebView draw fully behind the system bars
    (transparent status/nav bars), since JagX OS draws its own status bar
    and home indicator.
- **`.github/workflows/android-apk.yml`** — builds everything in CI (web
  build → generate Android project → apply the overrides above → assemble
  APK) and uploads it as a downloadable workflow artifact. No Android Studio
  needed.

## Getting the APK

1. Push this repo to GitHub.
2. Open the **Actions** tab → **Build Android APK** → it runs automatically
   on push to `main`, or click **Run workflow** to trigger it manually.
3. When it finishes, open the run and download the **jagx-os-debug-apk**
   artifact — it's a zip containing `app-debug.apk`.
4. Transfer that APK to your Android phone (email it to yourself, Drive,
   ADB, whatever's easiest) and tap it to install. You'll need to allow
   "Install unknown apps" for whichever app you used to open it — Android
   will prompt you for this the first time.
5. Open JagX OS once from the app drawer, then press the Home button — your
   phone will offer to set it as the default Home app (or find it under
   **Settings → Apps → Default apps → Home app**).

This produces a **debug-signed APK**, which is fine for installing on your
own device but not for the Play Store. If you eventually want a Play
Store release, you'd generate a real signing key and add a release-signing
step to the workflow — ask and I can wire that up too.

## Building locally instead (optional)

If you'd rather build on your own machine with Android Studio installed:

```sh
bun install
bun run build
bunx cap add android      # first time only
cp -a android-overrides/app/. android/app/
bunx cap sync android
cd android && ./gradlew assembleDebug
```

The APK will be at `android/app/build/outputs/apk/debug/app-debug.apk`.

## Honest caveats

- **This is a debug build.** It installs and runs fine, but isn't signed
  for distribution — that's normal for testing on your own phone.
- **No custom app icon yet** — it currently ships with Capacitor's default
  Android icon. Swap `android/app/src/main/res/mipmap-*` after the first
  `cap add android`, or ask me to generate one from `public/favicon.png` /
  the JagX mark and wire it into the override folder.
- **The "OS" is still a simulated shell** — JagX Message, JagMail, JagCloud,
  and JagStore are UI demos with local/mock data, not connected to real
  accounts or a backend. That part is unchanged from the Lovable preview
  and was already called out as "Lovable Cloud not enabled yet."
- **Setting it as your actual daily Home app** replaces your real launcher.
  All your existing app icons/widgets live in "Everything else" only if you
  add them — right now JagX OS doesn't enumerate your installed apps, so
  you'll lose quick access to your other apps until it does. I'd recommend
  testing it as a secondary launcher first (you can switch back anytime via
  Settings → Apps → Default apps → Home app) rather than committing to it
  as your daily driver yet. Happy to build out an actual installed-apps
  grid next if you want the real launcher experience.
