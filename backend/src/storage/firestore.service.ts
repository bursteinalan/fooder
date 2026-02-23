import { Firestore } from '@google-cloud/firestore';
import { User } from '../models/user.model';
import { Session } from '../models/session.model';
import { Recipe } from '../models/recipe.model';
import { RecipeWithUser, StorageData } from './storage.service';

export class FirestoreService {
  private db: Firestore;

  constructor() {
    this.db = new Firestore({
      // In Cloud Run, projectId and credentials are automatic
      // Specify the database ID since it's not the default "(default)"
      databaseId: process.env.FIRESTORE_DATABASE_ID || 'fooder-db',
      // For local dev, set GCP_PROJECT_ID and GOOGLE_APPLICATION_CREDENTIALS
      ...(process.env.GCP_PROJECT_ID && { projectId: process.env.GCP_PROJECT_ID }),
    });
  }

  // Recipe operations
  get(id: string): RecipeWithUser | null {
    // Synchronous wrapper - fetches from cache or throws
    throw new Error('Use async getAsync() instead');
  }

  async getAsync(id: string): Promise<RecipeWithUser | null> {
    const doc = await this.db.collection('recipes').doc(id).get();
    if (!doc.exists) return null;
    return { id: doc.id, ...doc.data() } as RecipeWithUser;
  }

  set(id: string, recipe: RecipeWithUser): void {
    // Fire and forget for sync compatibility
    this.db.collection('recipes').doc(id).set(recipe).catch(err =>
      console.error('Error setting recipe:', err)
    );
  }

  async setAsync(id: string, recipe: RecipeWithUser): Promise<void> {
    await this.db.collection('recipes').doc(id).set(recipe);
  }

  delete(id: string): boolean {
    this.db.collection('recipes').doc(id).delete().catch(err =>
      console.error('Error deleting recipe:', err)
    );
    return true;
  }

  async deleteAsync(id: string): Promise<boolean> {
    await this.db.collection('recipes').doc(id).delete();
    return true;
  }

  getAll(): Record<string, RecipeWithUser> {
    throw new Error('Use async getAllAsync() instead');
  }

  async getAllAsync(): Promise<Record<string, RecipeWithUser>> {
    const snapshot = await this.db.collection('recipes').get();
    const recipes: Record<string, RecipeWithUser> = {};
    snapshot.forEach(doc => {
      recipes[doc.id] = { id: doc.id, ...doc.data() } as RecipeWithUser;
    });
    return recipes;
  }

  has(id: string): boolean {
    throw new Error('Use async hasAsync() instead');
  }

  async hasAsync(id: string): Promise<boolean> {
    const doc = await this.db.collection('recipes').doc(id).get();
    return doc.exists;
  }

  // User operations
  getUser(userId: string): User | null {
    throw new Error('Use async getUserAsync() instead');
  }

  async getUserAsync(userId: string): Promise<User | null> {
    const doc = await this.db.collection('users').doc(userId).get();
    if (!doc.exists) return null;
    return { id: doc.id, ...doc.data() } as User;
  }

  getUserByUsername(username: string): User | null {
    throw new Error('Use async getUserByUsernameAsync() instead');
  }

  async getUserByUsernameAsync(username: string): Promise<User | null> {
    const snapshot = await this.db.collection('users')
      .where('username', '==', username)
      .limit(1)
      .get();

    if (snapshot.empty) return null;
    const doc = snapshot.docs[0];
    return { id: doc.id, ...doc.data() } as User;
  }

  setUser(userId: string, user: User): void {
    this.db.collection('users').doc(userId).set(user).catch(err =>
      console.error('Error setting user:', err)
    );
  }

  async setUserAsync(userId: string, user: User): Promise<void> {
    await this.db.collection('users').doc(userId).set(user);
  }

  deleteUser(userId: string): boolean {
    this.db.collection('users').doc(userId).delete().catch(err =>
      console.error('Error deleting user:', err)
    );
    return true;
  }

  async deleteUserAsync(userId: string): Promise<boolean> {
    await this.db.collection('users').doc(userId).delete();
    return true;
  }

  getAllUsers(): Record<string, User> {
    throw new Error('Use async getAllUsersAsync() instead');
  }

  async getAllUsersAsync(): Promise<Record<string, User>> {
    const snapshot = await this.db.collection('users').get();
    const users: Record<string, User> = {};
    snapshot.forEach(doc => {
      users[doc.id] = { id: doc.id, ...doc.data() } as User;
    });
    return users;
  }

  // Session operations
  getSession(token: string): Session | null {
    throw new Error('Use async getSessionAsync() instead');
  }

  async getSessionAsync(token: string): Promise<Session | null> {
    const doc = await this.db.collection('sessions').doc(token).get();
    if (!doc.exists) return null;
    return { token: doc.id, ...doc.data() } as Session;
  }

  setSession(token: string, session: Session): void {
    this.db.collection('sessions').doc(token).set(session).catch(err =>
      console.error('Error setting session:', err)
    );
  }

  async setSessionAsync(token: string, session: Session): Promise<void> {
    await this.db.collection('sessions').doc(token).set(session);
  }

  deleteSession(token: string): boolean {
    this.db.collection('sessions').doc(token).delete().catch(err =>
      console.error('Error deleting session:', err)
    );
    return true;
  }

  async deleteSessionAsync(token: string): Promise<boolean> {
    await this.db.collection('sessions').doc(token).delete();
    return true;
  }

  getUserSessions(userId: string): Session[] {
    throw new Error('Use async getUserSessionsAsync() instead');
  }

  async getUserSessionsAsync(userId: string): Promise<Session[]> {
    const snapshot = await this.db.collection('sessions')
      .where('userId', '==', userId)
      .get();

    const sessions: Session[] = [];
    snapshot.forEach(doc => {
      sessions.push({ token: doc.id, ...doc.data() } as Session);
    });
    return sessions;
  }

  deleteUserSessions(userId: string): number {
    throw new Error('Use async deleteUserSessionsAsync() instead');
  }

  async deleteUserSessionsAsync(userId: string): Promise<number> {
    const snapshot = await this.db.collection('sessions')
      .where('userId', '==', userId)
      .get();

    const batch = this.db.batch();
    snapshot.docs.forEach(doc => {
      batch.delete(doc.ref);
    });

    await batch.commit();
    return snapshot.size;
  }

  // Common categories operations
  getCommonCategories(): Record<string, string> {
    throw new Error('Use async getCommonCategoriesAsync() instead');
  }

  async getCommonCategoriesAsync(): Promise<Record<string, string>> {
    const doc = await this.db.collection('settings').doc('commonCategories').get();
    if (!doc.exists) return {};
    return doc.data() as Record<string, string>;
  }

  setCommonCategories(categories: Record<string, string>): void {
    this.db.collection('settings').doc('commonCategories').set(categories).catch(err =>
      console.error('Error setting common categories:', err)
    );
  }

  async setCommonCategoriesAsync(categories: Record<string, string>): Promise<void> {
    await this.db.collection('settings').doc('commonCategories').set(categories);
  }

  setCommonCategory(ingredient: string, category: string): void {
    this.db.collection('settings').doc('commonCategories').set(
      { [ingredient]: category },
      { merge: true }
    ).catch(err => console.error('Error setting common category:', err));
  }

  async setCommonCategoryAsync(ingredient: string, category: string): Promise<void> {
    await this.db.collection('settings').doc('commonCategories').set(
      { [ingredient]: category },
      { merge: true }
    );
  }

  // Storage compatibility methods (not supported)
  read(): StorageData {
    throw new Error('read() is not supported in Firestore mode. Use async methods instead.');
  }

  write(data: StorageData): void {
    throw new Error('write() is not supported in Firestore mode. Use async methods instead.');
  }
}
