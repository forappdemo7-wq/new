import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import config from '../firebase-applet-config.json';

export const app = getApps().length > 0 ? getApp() : initializeApp(config);
export const db = getFirestore(app);
export const auth = getAuth(app);

export enum OperationType {
  CREATE = 'CREATE',
  UPDATE = 'UPDATE',
  DELETE = 'DELETE',
  LIST = 'LIST',
  GET = 'GET',
}

export function handleFirestoreError(error: any, operationType: OperationType, path: string) {
  console.warn(`Firestore Error [${operationType}] at ${path}:`, error?.message || error);
}
