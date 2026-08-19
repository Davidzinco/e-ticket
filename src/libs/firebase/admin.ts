import { cert, getApps, initializeApp } from "firebase-admin/app";
import { getFirestore, type Firestore } from "firebase-admin/firestore";

const hasFirebaseAdminCredentials =
  process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID &&
  process.env.FIREBASE_CLIENT_EMAIL &&
  process.env.FIREBASE_PRIVATE_KEY;

if (!getApps().length) {
  if (hasFirebaseAdminCredentials) {
    initializeApp({
      credential: cert({
        projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
      }),
    });
  } else {
    console.warn("⚠️ Firebase Admin credentials are not set. Firebase Admin features will fail if accessed.");
  }
}

export const db: Firestore = getApps().length
  ? getFirestore()
  : (null as unknown as Firestore);
