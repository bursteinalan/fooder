export interface User {
  id: string;
  username: string;
  passwordHash: string;
  createdAt: string;
  customCategories: Record<string, string>; // ingredient name -> category
}

export interface CreateUserDto {
  username: string;
  password: string;
}

export interface LoginDto {
  username: string;
  password: string;
}

export interface AuthResponse {
  token: string;
  userId: string;
  username: string;
}
