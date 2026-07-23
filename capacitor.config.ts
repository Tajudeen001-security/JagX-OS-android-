import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "com.jagx.os",
  appName: "JagX OS",
  webDir: "dist",
  server: {
    androidScheme: "https",
  },
  android: {
    // Let our own CSS/safe-area insets handle layout instead of Capacitor
    // resizing the WebView around system bars — this is what makes the
    // status bar / gesture bar overlay the app instead of pushing it down.
    adjustMarginsForEdgeToEdge: "disable",
  },
};

export default config;
