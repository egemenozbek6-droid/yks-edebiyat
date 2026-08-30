import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "com.edebikart.app",
  appName: "Edebikart",
  webDir: "out",
  android: {
    backgroundColor: "#0B0F17",
    allowMixedContent: false,
    webContentsDebuggingEnabled: false,
    captureInput: true,
    captureFocus: true,
    captureKeyboard: true,
  },
  server: {
    androidScheme: "https",
  },
};

export default config;
