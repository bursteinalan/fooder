import * as crypto from 'crypto';
import { v4 as uuidv4 } from 'uuid';
import { StorageService } from '../storage/storage.service';
import { User, CreateUserDto, LoginDto, AuthResponse } from '../models/user.model';
import { Session } from '../models/session.model';

export class AuthService {
  private storage: StorageService;

  constructor(storage: StorageService) {
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
    const data = this.storage.read();
    if (!data.sessions) {
      data.sessions = {};
    }
    data.sessions[token] = session;
    this.storage.write(data);

    return session;
  }

  /**
   * Sign up a new user
   * Requirements: 1.1, 1.3, 1.4
   */
  async signup(dto: CreateUserDto): Promise<AuthResponse> {
    const data = this.storage.read();

    // Initialize users object if it doesn't exist
    if (!data.users) {
      data.users = {};
    }

    // Check if username already exists (Requirement 1.3)
    const existingUser = Object.values(data.users).find(
      (user: any) => user.username === dto.username
    );

    if (existingUser) {
      throw new Error('Username already exists');
    }

    // Create new user (Requirement 1.1, 1.4)
    const userId = uuidv4();
    const passwordHash = this.hashPassword(dto.password); // Accepts any password length including empty
    const createdAt = new Date().toISOString();

    // Initialize with common categories (Requirement 1.2)
    const commonCategories = data.commonCategories || {};
    
    const user: User = {
      id: userId,
      username: dto.username,
      passwordHash,
      createdAt,
      customCategories: {}, // Start with empty custom categories
    };

    // Save user
    data.users[userId] = user;
    this.storage.write(data);

    // Create session
    const session = this.createSession(userId);

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
    const data = this.storage.read();

    if (!data.users) {
      throw new Error('Invalid credentials');
    }

    // Find user by username
    const user = Object.values(data.users).find(
      (u: any) => u.username === dto.username
    ) as User | undefined;

    if (!user) {
      throw new Error('Invalid credentials'); // Requirement 2.2
    }

    // Compare password (Requirement 2.4)
    const isPasswordValid = this.comparePassword(dto.password, user.passwordHash);

    if (!isPasswordValid) {
      throw new Error('Invalid credentials'); // Requirement 2.2
    }

    // Create session (Requirement 2.1)
    const session = this.createSession(user.id);

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
    const data = this.storage.read();

    if (!data.sessions) {
      return null;
    }

    const session = data.sessions[token];

    if (!session) {
      return null;
    }

    // Check if session has expired
    const now = new Date();
    const expiresAt = new Date(session.expiresAt);

    if (now > expiresAt) {
      // Session expired, remove it
      delete data.sessions[token];
      this.storage.write(data);
      return null;
    }

    return session.userId;
  }

  /**
   * Get user by ID
   */
  async getUserById(userId: string): Promise<User | null> {
    const data = this.storage.read();

    if (!data.users) {
      return null;
    }

    return data.users[userId] || null;
  }
}
