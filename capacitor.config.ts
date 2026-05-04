import type { CapacitorConfig } from '@capacitor/cli'

const config: CapacitorConfig = {
  appId: 'com.focusflow.app',
  appName: 'FocusFlow',
  webDir: 'dist',
  server: {
    androidScheme: 'https',
  },
}

export default config
