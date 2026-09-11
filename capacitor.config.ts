export interface LocalCapacitorConfig {
  appId: string;
  appName: string;
  webDir: string;
  bundledWebRuntime?: boolean;
  server?: Record<string, unknown>;
  android?: Record<string, unknown>;
  plugins?: Record<string, unknown>;
}

const config: LocalCapacitorConfig = {
  appId: 'org.fetindia.app',
  appName: 'FET India',
  webDir: 'dist',
  bundledWebRuntime: false,
  server: {
    androidScheme: 'https',
    allowNavigation: [
      'fetindia.com',
      '*.fetindia.com',
      '*.firebaseio.com',
      '*.googleapis.com',
      'api.razorpay.com',
      '*.razorpay.com',
      'checkout.razorpay.com'
    ]
  },
  android: {
    allowMixedContent: false,
    captureInput: true,
    webContentsDebuggingEnabled: false
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      launchAutoHide: true,
      backgroundColor: "#0B2545",
      androidSplashResourceName: "splash",
      androidScaleType: "CENTER_CROP"
    },
    PushNotifications: {
      presentationOptions: ["badge", "sound", "alert"]
    }
  }
};

export default config;
