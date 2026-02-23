import { StorageService } from './storage.service';
import { FirestoreService } from './firestore.service';
import { SavedGroceryList } from '../models/saved-grocery-list.model';

export interface StorageAdapter {
  // Recipe operations
  get(id: string): any | null;
  getAsync?(id: string): Promise<any | null>;
  set(id: string, value: any): void;
  setAsync?(id: string, value: any): Promise<void>;
  delete(id: string): boolean;
  deleteAsync?(id: string): Promise<boolean>;
  getAll(): Record<string, any>;
  getAllAsync?(): Promise<Record<string, any>>;
  has(id: string): boolean;
  hasAsync?(id: string): Promise<boolean>;

  // User operations
  getUser(userId: string): any | null;
  getUserAsync?(userId: string): Promise<any | null>;
  getUserByUsername(username: string): any | null;
  getUserByUsernameAsync?(username: string): Promise<any | null>;
  setUser(userId: string, user: any): void;
  setUserAsync?(userId: string, user: any): Promise<void>;
  deleteUser(userId: string): boolean;
  deleteUserAsync?(userId: string): Promise<boolean>;
  getAllUsers(): Record<string, any>;
  getAllUsersAsync?(): Promise<Record<string, any>>;

  // Session operations
  getSession(token: string): any | null;
  getSessionAsync?(token: string): Promise<any | null>;
  setSession(token: string, session: any): void;
  setSessionAsync?(token: string, session: any): Promise<void>;
  deleteSession(token: string): boolean;
  deleteSessionAsync?(token: string): Promise<boolean>;
  getUserSessions(userId: string): any[];
  getUserSessionsAsync?(userId: string): Promise<any[]>;
  deleteUserSessions(userId: string): number;
  deleteUserSessionsAsync?(userId: string): Promise<number>;

  // Common categories operations
  getCommonCategories(): Record<string, string>;
  getCommonCategoriesAsync?(): Promise<Record<string, string>>;
  setCommonCategories(categories: Record<string, string>): void;
  setCommonCategoriesAsync?(categories: Record<string, string>): Promise<void>;
  setCommonCategory(ingredient: string, category: string): void;
  setCommonCategoryAsync?(ingredient: string, category: string): Promise<void>;

  // Saved grocery list operations
  getSavedGroceryList(userId: string, listId: string): SavedGroceryList | null;
  getSavedGroceryListAsync?(userId: string, listId: string): Promise<SavedGroceryList | null>;
  listSavedGroceryLists(userId: string): SavedGroceryList[];
  listSavedGroceryListsAsync?(userId: string): Promise<SavedGroceryList[]>;
  setSavedGroceryList(userId: string, list: SavedGroceryList): void;
  setSavedGroceryListAsync?(userId: string, list: SavedGroceryList): Promise<void>;
  deleteSavedGroceryList(userId: string, listId: string): void;
  deleteSavedGroceryListAsync?(userId: string, listId: string): Promise<void>;

  // Storage compatibility methods (for in-memory storage)
  read?(): any;
  write?(data: any): void;
}

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
