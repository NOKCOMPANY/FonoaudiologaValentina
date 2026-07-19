export const config = {
  googleClientId:   import.meta.env.VITE_GOOGLE_CLIENT_ID,
  googleApiKey:     import.meta.env.VITE_GOOGLE_API_KEY,
  calendarId:       import.meta.env.VITE_GOOGLE_CALENDAR_ID,
  firebase: {
    apiKey:            import.meta.env.VITE_FIREBASE_API_KEY,
    authDomain:        import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId:         import.meta.env.VITE_FIREBASE_PROJECT_ID,
    storageBucket:     import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId:             import.meta.env.VITE_FIREBASE_APP_ID,
  },
  valentinEmail: 'Valentinapauroca0@gmail.com',
}
