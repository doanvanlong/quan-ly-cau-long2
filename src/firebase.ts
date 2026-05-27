import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import firebaseConfig from './firebase-applet-config.json';

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  }
}

let app: any = null;
let db: any = null;
let auth: any = null;
let firebaseEnabled = false;

// Dual configuration loading: prefer environment variables to allow secure deployment on platforms like Vercel/GitHub
const metaEnv = (import.meta as any).env || {};
const activeConfig = {
  apiKey: metaEnv.VITE_FIREBASE_API_KEY || firebaseConfig?.apiKey,
  projectId: metaEnv.VITE_FIREBASE_PROJECT_ID || firebaseConfig?.projectId,
  appId: metaEnv.VITE_FIREBASE_APP_ID || firebaseConfig?.appId,
  authDomain: metaEnv.VITE_FIREBASE_AUTH_DOMAIN || firebaseConfig?.authDomain,
  firestoreDatabaseId: metaEnv.VITE_FIREBASE_DATABASE_ID || firebaseConfig?.firestoreDatabaseId,
  storageBucket: metaEnv.VITE_FIREBASE_STORAGE_BUCKET || firebaseConfig?.storageBucket,
  messagingSenderId: metaEnv.VITE_FIREBASE_MESSAGING_SENDER_ID || firebaseConfig?.messagingSenderId,
  measurementId: metaEnv.VITE_FIREBASE_MEASUREMENT_ID || firebaseConfig?.measurementId,
};

// Determine if the config has valid initialized parameters
if (
  activeConfig &&
  activeConfig.apiKey &&
  activeConfig.apiKey !== 'PLACEholder_key_not_set' &&
  activeConfig.projectId &&
  activeConfig.projectId !== 'placeholder-project'
) {
  try {
    app = getApps().length === 0 ? initializeApp(activeConfig) : getApp();
    db = getFirestore(app, activeConfig.firestoreDatabaseId || undefined);
    auth = getAuth(app);
    firebaseEnabled = true;
    console.log("Firebase initialized successfully in Live Mode.");
  } catch (err) {
    console.error("Failed to initialize Firebase SDK:", err);
  }
} else {
  console.log("Firebase is currently in Safe Local Storage fallback mode.");
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth?.currentUser?.uid || null,
      email: auth?.currentUser?.email || null,
      emailVerified: auth?.currentUser?.emailVerified || null,
      isAnonymous: auth?.currentUser?.isAnonymous || null,
      tenantId: auth?.currentUser?.tenantId || null,
      providerInfo: auth?.currentUser?.providerData?.map((provider: any) => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  };
  console.error('Firestore Error Detailed Object: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

export { db, auth, firebaseEnabled, firebaseConfig };
