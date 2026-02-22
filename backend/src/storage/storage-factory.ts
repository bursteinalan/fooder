import { StorageService } from './storage.service';
import { FirestoreService } from './firestore.service';

export type StorageAdapter = StorageService | FirestoreService;

export function createStorageService(): StorageAdapter {
  const useFirestore = process.env.USE_FIRESTORE === 'true';
  
  if (useFirestore) {
    console.log('Using Firestore storage');
    return new FirestoreService();
  } else {
    console.log('Using file-based storage');
    return new StorageService();
  }
}

export function isFirestore(storage: StorageAdapter): storage is FirestoreService {
  return storage instanceof FirestoreService;
}
