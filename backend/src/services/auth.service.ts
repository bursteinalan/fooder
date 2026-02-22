import * as crypto from 'crypto';
import { v4 as uuidv4 } from 'uuid';
import { StorageAdapter } from '../storage/storage-factory';
import { User, CreateUserDto, LoginDto, AuthResponse } from '../models/user.model';
import { Session } from '../models/session.model';

export class AuthService {
  private storage: StorageAdapter;

  constructor(storage: StorageAdapter) {
    this.storage = storage;
  }

  /**
   * Hash a password using PBKDF2 with a random salt
   * Format: salt:hash
   */
  private hashPassword(password: string): string {
    const salt = crypto.randomBytes(16).toString('hex');
    const hash = crypto.pbkdf2Sync(password, salt, 100000, 64, 'sha512').toString('hex');
    return `${salt}:${hash}`;
  }

  /**
   * Compare a password with a stored hash
   */
  private comparePassword(password: string, storedHash: string): boolean {
    const [salt, hash] = storedHash.split(':');
    const compareHash = crypto.pbkdf2Sync(password, salt, 100000, 64, 'sha512').toString('hex');
    return hash === compareHash;
  }

  /**
   * Create a new session for a user
   * Sessions expire after 1 year
   */
  private createSession(userId: string): Session {
    const token = uuidv4();
    const createdAt = new Date().toISOString();
    const expiresAt = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(); // 1 year

    const session: Session = {
      token,
      userId,
      createdAt,
      expiresAt,
    };

    // Store session in storage
    this.storage.setSession(token, session);

    return session;
  }

  /**
   * Create a new session for a user (async version)
   * Sessions expire after 1 year
   */
  private async createSessionAsync(userId: string): Promise<Session> {
    const token = uuidv4();
    const createdAt = new Date().toISOString();
    const expiresAt = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(); // 1 year

    const session: Session = {
      token,
      userId,
      createdAt,
      expiresAt,
    };

    // Store session in storage
    if ('setSessionAsync' in this.storage) {
      await (this.storage as any).setSessionAsync(token, session);
    } else {
      this.storage.setSession(token, session);
    }

    return session;
  }

  /**
   * Sign up a new user
   * Requirements: 1.1, 1.3, 1.4
   */
  async signup(dto: CreateUserDto): Promise<AuthResponse> {
    // Check if username already exists (Requirement 1.3)
    const existingUser = 'getUserByUsernameAsync' in this.storage
      ? await (this.storage as any).getUserByUsernameAsync(dto.username)
      : this.storage.getUserByUsername(dto.username);

    if (existingUser) {
      throw new Error('Username already exists');
    }

    // Create new user (Requirement 1.1, 1.4)
    const userId = uuidv4();
    const passwordHash = this.hashPassword(dto.password); // Accepts any password length including empty
    const createdAt = new Date().toISOString();

    // Initialize with common categories (Requirement 1.2)
    // Copy commonCategories to the new user's customCategories
    const commonCategories = 'getCommonCategoriesAsync' in this.storage
      ? await (this.storage as any).getCommonCategoriesAsync()
      : this.storage.getCommonCategories();
    
    const user: User = {
      id: userId,
      username: dto.username,
      passwordHash,
      createdAt,
      customCategories: { ...commonCategories }, // Initialize with copy of common categories
    };

    // Save user
    if ('setUserAsync' in this.storage) {
      await (this.storage as any).setUserAsync(userId, user);
    } else {
      this.storage.setUser(userId, user);
    }

    // Create session
    const session = await this.createSessionAsync(userId);

    return {
      token: session.token,
      userId: user.id,
      username: user.username,
    };
  }

  /**
   * Log in an existing user
   * Requirements: 2.1, 2.2, 2.4
   */
  async login(dto: LoginDto): Promise<AuthResponse> {
    // Find user by username
    const user = 'getUserByUsernameAsync' in this.storage
      ? await (this.storage as any).getUserByUsernameAsync(dto.username)
      : this.storage.getUserByUsername(dto.username);

    if (!user) {
      throw new Error('Invalid credentials'); // Requirement 2.2
    }

    // Compare password (Requirement 2.4)
    const isPasswordValid = this.comparePassword(dto.password, user.passwordHash);

    if (!isPasswordValid) {
      throw new Error('Invalid credentials'); // Requirement 2.2
    }

    // Create session (Requirement 2.1)
    const session = await this.createSessionAsync(user.id);

    return {
      token: session.token,
      userId: user.id,
      username: user.username,
    };
  }

  /**
   * Validate a session token and return the userId
   * Requirements: 2.3
   */
  async validateSession(token: string): Promise<string | null> {
    const session = 'getSessionAsync' in this.storage
      ? await (this.storage as any).getSessionAsync(token)
      : this.storage.getSession(token);

    if (!session) {
      return null;
    }

    // Check if session has expired
    const now = new Date();
    const expiresAt = new Date(session.expiresAt);

    if (now > expiresAt) {
      // Session expired, remove it
      if ('deleteSessionAsync' in this.storage) {
        await (this.storage as any).deleteSessionAsync(token);
      } else {
        this.storage.deleteSession(token);
      }
      return null;
    }

    return session.userId;
  }

  /**
   * Get user by ID
   */
  async getUserById(userId: string): Promise<User | null> {
    if ('getUserAsync' in this.storage) {
      return await (this.storage as any).getUserAsync(userId);
    }
    return this.storage.getUser(userId);
  }
}
