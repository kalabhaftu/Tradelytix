import * as admin from 'firebase-admin'

if (!admin.apps.length) {
  try {
    const privateKey = process.env.FIREBASE_PRIVATE_KEY
      ? process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n')
      : undefined

    if (process.env.FIREBASE_CLIENT_EMAIL && privateKey && process.env.FIREBASE_PROJECT_ID) {
      admin.initializeApp({
        credential: admin.credential.cert({
          projectId: process.env.FIREBASE_PROJECT_ID,
          clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
          privateKey: privateKey,
        })
      })
    } else {
      console.warn('Firebase admin credentials not found in environment variables.')
    }
  } catch (error) {
    console.error('Firebase admin initialization error:', error)
  }
}

export const messaging = admin.apps.length ? admin.messaging() : null
