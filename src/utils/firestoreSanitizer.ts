/**
 * Firestore Data Sanitizer Utility
 *
 * Firestore's setDoc(), updateDoc(), and addDoc() throw:
 * "FirebaseError: Function setDoc() called with invalid data. Unsupported field value: undefined"
 * whenever an object, nested object, or array contains an `undefined` value.
 *
 * This utility deep-cleans all objects, sub-collections, and document payloads before they reach Firestore.
 */

export function sanitizeFirestoreData<T>(data: T): T {
  if (data === null || data === undefined) {
    return null as unknown as T;
  }

  if (Array.isArray(data)) {
    return data
      .filter((item) => item !== undefined)
      .map((item) => sanitizeFirestoreData(item)) as unknown as T;
  }

  if (typeof data === 'object') {
    // If it's a Date instance, convert to standard ISO string
    if (data instanceof Date) {
      return data.toISOString() as unknown as T;
    }

    const cleaned: Record<string, any> = {};
    for (const [key, value] of Object.entries(data)) {
      if (value !== undefined) {
        cleaned[key] = sanitizeFirestoreData(value);
      }
    }
    return cleaned as T;
  }

  return data;
}
