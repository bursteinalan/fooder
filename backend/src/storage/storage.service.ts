import * as fs from 'fs';
import * as path from 'path';
import { User } from '../models/user.model';
import { Session } from '../models/session.model';
import { Recipe } from '../models/recipe.model';

export interface RecipeWithUser extends Recipe {
  userId: string;
}

export interface StorageData {
  recipes: Record<string, RecipeWithUser>;
  users: Record<string, User>;
  sessions: Record<string, Session>;
  commonCategories: Record<string, string>;
}

export class StorageService {
  private storagePath: string;
  private backupPath: string;

  constructor(storagePath: string = './data/storage.json') {
    this.storagePath = path.resolve(storagePath);
    this.backupPath = `${this.storagePath}.backup`;
    this.initialize();
  }

  /**
   * Initialize storage file if it doesn't exist
   */
  private initialize(): void {
    try {
      const dir = path.dirname(this.storagePath);
      
      // Create directory if it doesn't exist
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }

      // Create storage file with initial structure if it doesn't exist
      if (!fs.existsSync(this.storagePath)) {
        const initialData: StorageData = {
          recipes: {},
          users: {},
          sessions: {},
          commonCategories: {},
        };
        fs.writeFileSync(this.storagePath, JSON.stringify(initialData, null, 2), 'utf-8');
      }
    } catch (error) {
      throw new Error(`Failed to initialize storage: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Read data from storage
   */
  read(): StorageData {
    try {
      const data = fs.readFileSync(this.storagePath, 'utf-8');
      const parsed = JSON.parse(data);
      
      // Validate JSON structure
      if (!parsed || typeof parsed !== 'object') {
        throw new Error('Invalid storage format: root must be an object');
      }
      
      if (!parsed.recipes || typeof parsed.recipes !== 'object') {
        throw new Error('Invalid storage format: recipes must be an object');
      }

      if (!parsed.users || typeof parsed.users !== 'object') {
        throw new Error('Invalid storage format: users must be an object');
      }

      if (!parsed.sessions || typeof parsed.sessions !== 'object') {
        throw new Error('Invalid storage format: sessions must be an object');
      }

      if (!parsed.commonCategories || typeof parsed.commonCategories !== 'object') {
        throw new Error('Invalid storage format: commonCategories must be an object');
      }
      
      return parsed as StorageData;
    } catch (error) {
      if (error instanceof SyntaxError) {
        throw new Error(`Failed to parse storage file: ${error.message}`);
      }
      if (error instanceof Error && 'code' in error && error.code === 'ENOENT') {
        // File doesn't exist, reinitialize
        this.initialize();
        return this.read();
      }
      throw error;
    }
  }

  /**
   * Write data to storage with atomic operation and backup mechanism
   */
  write(data: StorageData): void {
    try {
      // Validate data structure
      if (!data || typeof data !== 'object') {
        throw new Error('Invalid data: must be an object');
      }
      
      if (!data.recipes || typeof data.recipes !== 'object') {
        throw new Error('Invalid data: recipes must be an object');
      }

      if (!data.users || typeof data.users !== 'object') {
        throw new Error('Invalid data: users must be an object');
      }

      if (!data.sessions || typeof data.sessions !== 'object') {
        throw new Error('Invalid data: sessions must be an object');
      }

      if (!data.commonCategories || typeof data.commonCategories !== 'object') {
        throw new Error('Invalid data: commonCategories must be an object');
      }

      // Create backup of current file if it exists
      if (fs.existsSync(this.storagePath)) {
        fs.copyFileSync(this.storagePath, this.backupPath);
      }

      // Write to temporary file first (atomic operation)
      const tempPath = `${this.storagePath}.tmp`;
      const jsonData = JSON.stringify(data, null, 2);
      fs.writeFileSync(tempPath, jsonData, 'utf-8');

      // Rename temp file to actual file (atomic on most systems)
      fs.renameSync(tempPath, this.storagePath);

      // Remove backup after successful write
      if (fs.existsSync(this.backupPath)) {
        fs.unlinkSync(this.backupPath);
      }
    } catch (error) {
      // Restore from backup if write failed
      if (fs.existsSync(this.backupPath)) {
        try {
          fs.copyFileSync(this.backupPath, this.storagePath);
        } catch (restoreError) {
          throw new Error(`Failed to write storage and restore backup: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      }
      throw new Error(`Failed to write storage: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get value by key from recipes
   */
  get(key: string): any | null {
    const data = this.read();
    return data.recipes[key] || null;
  }

  /**
   * Set value by key in recipes
   */
  set(key: string, value: any): void {
    const data = this.read();
    data.recipes[key] = value;
    this.write(data);
  }

  /**
   * Delete value by key from recipes
   */
  delete(key: string): boolean {
    const data = this.read();
    if (key in data.recipes) {
      delete data.recipes[key];
      this.write(data);
      return true;
    }
    return false;
  }

  /**
   * Get all recipes
   */
  getAll(): Record<string, any> {
    const data = this.read();
    return data.recipes;
  }

  /**
   * Check if key exists
   */
  has(key: string): boolean {
    const data = this.read();
    return key in data.recipes;
  }

  // User operations
  
  /**
   * Get user by ID
   */
  getUser(userId: string): User | null {
    const data = this.read();
    return data.users[userId] || null;
  }

  /**
   * Get user by username
   */
  getUserByUsername(username: string): User | null {
    const data = this.read();
    const users = Object.values(data.users);
    return users.find(user => user.username === username) || null;
  }

  /**
   * Create or update user
   */
  setUser(userId: string, user: User): void {
    const data = this.read();
    data.users[userId] = user;
    this.write(data);
  }

  /**
   * Delete user
   */
  deleteUser(userId: string): boolean {
    const data = this.read();
    if (userId in data.users) {
      delete data.users[userId];
      this.write(data);
      return true;
    }
    return false;
  }

  /**
   * Get all users
   */
  getAllUsers(): Record<string, User> {
    const data = this.read();
    return data.users;
  }

  // Session operations

  /**
   * Get session by token
   */
  getSession(token: string): Session | null {
    const data = this.read();
    return data.sessions[token] || null;
  }

  /**
   * Create or update session
   */
  setSession(token: string, session: Session): void {
    const data = this.read();
    data.sessions[token] = session;
    this.write(data);
  }

  /**
   * Delete session
   */
  deleteSession(token: string): boolean {
    const data = this.read();
    if (token in data.sessions) {
      delete data.sessions[token];
      this.write(data);
      return true;
    }
    return false;
  }

  /**
   * Get all sessions for a user
   */
  getUserSessions(userId: string): Session[] {
    const data = this.read();
    return Object.values(data.sessions).filter(session => session.userId === userId);
  }

  /**
   * Delete all sessions for a user
   */
  deleteUserSessions(userId: string): number {
    const data = this.read();
    const sessions = data.sessions;
    let deletedCount = 0;
    
    for (const token in sessions) {
      if (sessions[token].userId === userId) {
        delete sessions[token];
        deletedCount++;
      }
    }
    
    if (deletedCount > 0) {
      this.write(data);
    }
    
    return deletedCount;
  }

  // Common categories operations

  /**
   * Get common categories
   */
  getCommonCategories(): Record<string, string> {
    const data = this.read();
    return data.commonCategories;
  }

  /**
   * Set common categories
   */
  setCommonCategories(categories: Record<string, string>): void {
    const data = this.read();
    data.commonCategories = categories;
    this.write(data);
  }

  /**
   * Update a single common category
   */
  setCommonCategory(ingredient: string, category: string): void {
    const data = this.read();
    data.commonCategories[ingredient] = category;
    this.write(data);
  }
}
