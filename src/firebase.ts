import { getApps, initializeApp } from 'firebase/app';
import {
  createUserWithEmailAndPassword,
  getAuth,
  signOut as firebaseSignOut,
  updateProfile,
} from 'firebase/auth';
import { doc, getDocFromServer, getFirestore } from 'firebase/firestore';
import firebaseAppletConfig from '../firebase-applet-config.json';

const resolvedFirebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || firebaseAppletConfig.apiKey,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || firebaseAppletConfig.authDomain,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || firebaseAppletConfig.projectId,
  storageBucket:
    import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || firebaseAppletConfig.storageBucket,
  messagingSenderId:
    import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || firebaseAppletConfig.messagingSenderId,
  appId: import.meta.env.VITE_FIREBASE_APP_ID || firebaseAppletConfig.appId,
};

const resolvedFirestoreDatabaseId =
  import.meta.env.VITE_FIREBASE_DATABASE_ID || firebaseAppletConfig.firestoreDatabaseId;

const app = initializeApp(resolvedFirebaseConfig);

// CRITICAL: Pass firestoreDatabaseId so Firestore connects to the provisioned database
export const db = resolvedFirestoreDatabaseId
  ? getFirestore(app, resolvedFirestoreDatabaseId)
  : getFirestore(app);
export const auth = getAuth(app);

export const AUTH_USERNAME_DOMAIN = (
  import.meta.env.VITE_AUTH_USERNAME_DOMAIN || 'catevia.paroki'
)
  .trim()
  .toLowerCase();

export const ADMIN_LOGIN_EMAIL = `admin@${AUTH_USERNAME_DOMAIN}`;
export const BOOTSTRAPPED_ADMIN_EMAIL = (
  import.meta.env.VITE_ADMIN_EMAIL || 'michael.gani@gmail.com'
)
  .trim()
  .toLowerCase();

export const FIREBASE_AUTH_PROVIDERS_URL = `https://console.firebase.google.com/project/${resolvedFirebaseConfig.projectId}/authentication/providers`;

const RESERVED_SELF_REGISTER_USERNAMES = new Set(['admin', 'administrator', 'root', 'superadmin']);

/**
 * Resolves either a short username (e.g. "admin", "katekis", "pastor")
 * or a full email address into a normalized Firebase Auth email identifier.
 */
export function resolveLoginEmail(identifier: string): string {
  const cleaned = identifier.trim().toLowerCase();
  if (!cleaned) return '';
  if (cleaned.includes('@')) {
    return cleaned;
  }
  const sanitized = cleaned.replace(/\s+/g, '');
  return `${sanitized}@${AUTH_USERNAME_DOMAIN}`;
}

export function isValidLoginIdentifier(identifier: string): boolean {
  const cleaned = identifier.trim().toLowerCase();
  if (!cleaned) return false;
  if (cleaned.includes('@')) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleaned);
  }
  return /^[a-z0-9._-]{3,40}$/.test(cleaned);
}

export function isReservedUsername(identifier: string): boolean {
  const cleaned = identifier.trim().toLowerCase();
  const base = cleaned.includes('@') ? cleaned.split('@')[0] : cleaned;
  if (cleaned === ADMIN_LOGIN_EMAIL) return true;
  return RESERVED_SELF_REGISTER_USERNAMES.has(base);
}

export function formatLoginIdentifier(email: string): string {
  const cleaned = email.trim().toLowerCase();
  const suffix = `@${AUTH_USERNAME_DOMAIN}`;
  if (cleaned.endsWith(suffix)) {
    return cleaned.slice(0, -suffix.length);
  }
  return email;
}

/**
 * Provisions a new Email/Password user via a secondary Firebase App instance
 * so an authenticated Administrator can create staff/user accounts without
 * signing out of their own active session.
 */
export async function createSecondaryAuthAccount(
  email: string,
  password: string,
  displayName: string
): Promise<string> {
  const secondaryAppName = 'catevia-user-provisioning';
  const secondaryApp =
    getApps().find((item) => item.name === secondaryAppName) ||
    initializeApp(resolvedFirebaseConfig, secondaryAppName);
  const secondaryAuth = getAuth(secondaryApp);

  try {
    const credential = await createUserWithEmailAndPassword(secondaryAuth, email, password);
    if (displayName.trim()) {
      await updateProfile(credential.user, {
        displayName: displayName.trim().slice(0, 120),
      }).catch(() => {
        // Non-critical displayName update
      });
    }
    return credential.user.uid;
  } finally {
    await firebaseSignOut(secondaryAuth).catch(() => {
      // Best-effort cleanup of secondary session
    });
  }
}

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
  };
}

export function handleFirestoreError(
  error: unknown,
  operationType: OperationType,
  path: string | null
): never {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo:
        auth.currentUser?.providerData?.map((provider) => ({
          providerId: provider.providerId,
          email: provider.email,
        })) || [],
    },
    operationType,
    path,
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

async function testConnection() {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.error('Please check your Firebase configuration.');
    }
  }
}

void testConnection();
