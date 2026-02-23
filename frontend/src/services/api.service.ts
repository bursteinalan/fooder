import type {
  Recipe,
  CreateRecipeDto,
  UpdateRecipeDto,
  GroceryListResponse,
  ApiError,
  AuthResponse,
  LoginDto,
  SignupDto,
  CurrentUser,
  Ingredient,
} from '../types/recipe.types';
import type {
  SavedGroceryList,
} from '../types/saved-grocery-list.types';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '';

class ApiService {
  private baseUrl: string;
  private tokenKey = 'auth_token';

  constructor(baseUrl: string = API_BASE_URL) {
    this.baseUrl = baseUrl;
  }

  /**
   * Get the stored authentication token
   */
  private getToken(): string | null {
    return localStorage.getItem(this.tokenKey);
  }

  /**
   * Set the authentication token
   */
  setToken(token: string): void {
    localStorage.setItem(this.tokenKey, token);
  }

  /**
   * Clear the authentication token
   */
  clearToken(): void {
    localStorage.removeItem(this.tokenKey);
  }

  /**
   * Generic fetch wrapper with error handling
   */
  private async fetchWithErrorHandling<T>(
    url: string,
    options?: RequestInit
  ): Promise<T> {
    try {
      const token = this.getToken();
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };

      // Add any additional headers from options
      if (options?.headers) {
        Object.entries(options.headers).forEach(([key, value]) => {
          if (typeof value === 'string') {
            headers[key] = value;
          }
        });
      }

      // Add Authorization header if token exists
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch(`${this.baseUrl}${url}`, {
        ...options,
        headers,
      });

      // Handle 401 Unauthorized - clear session and redirect to login
      if (response.status === 401) {
        this.clearToken();
        // Dispatch custom event to notify auth context
        window.dispatchEvent(new CustomEvent('auth:unauthorized'));
        const error = await response.json().catch(() => ({ error: 'Unauthorized' }));
        throw new Error(error.message || error.error || 'Unauthorized');
      }

      // Handle 204 No Content
      if (response.status === 204) {
        return undefined as T;
      }

      const data = await response.json();

      if (!response.ok) {
        const error = data as ApiError;
        throw new Error(error.message || error.error || 'An error occurred');
      }

      return data as T;
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Network error occurred');
    }
  }

  // ============================================
  // Authentication Methods
  // ============================================

  /**
   * POST /api/auth/signup - Create a new user account
   */
  async signup(dto: SignupDto): Promise<AuthResponse> {
    return this.fetchWithErrorHandling<AuthResponse>('/api/auth/signup', {
      method: 'POST',
      body: JSON.stringify(dto),
    });
  }

  /**
   * POST /api/auth/login - Authenticate user
   */
  async login(dto: LoginDto): Promise<AuthResponse> {
    return this.fetchWithErrorHandling<AuthResponse>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify(dto),
    });
  }

  /**
   * GET /api/auth/me - Get current user info
   */
  async getCurrentUser(): Promise<CurrentUser> {
    return this.fetchWithErrorHandling<CurrentUser>('/api/auth/me');
  }

  // ============================================
  // Recipe Methods
  // ============================================

  /**
   * GET /api/recipes - Retrieve all recipes
   */
  async getAllRecipes(): Promise<Recipe[]> {
    return this.fetchWithErrorHandling<Recipe[]>('/api/recipes');
  }

  /**
   * GET /api/recipes/ingredients/names - Get all unique ingredient names
   */
  async getIngredientNames(): Promise<string[]> {
    return this.fetchWithErrorHandling<string[]>('/api/recipes/ingredients/names');
  }

  /**
   * POST /api/recipes/scrape - Scrape recipe from URL
   */
  async scrapeRecipe(url: string): Promise<{ title: string; ingredients: Ingredient[]; instructions: string }> {
    return this.fetchWithErrorHandling('/api/recipes/scrape', {
      method: 'POST',
      body: JSON.stringify({ url }),
    });
  }

  /**
   * GET /api/recipes/:id - Retrieve a specific recipe
   */
  async getRecipeById(id: string): Promise<Recipe> {
    return this.fetchWithErrorHandling<Recipe>(`/api/recipes/${id}`);
  }

  /**
   * POST /api/recipes - Create a new recipe
   */
  async createRecipe(recipe: CreateRecipeDto): Promise<Recipe> {
    return this.fetchWithErrorHandling<Recipe>('/api/recipes', {
      method: 'POST',
      body: JSON.stringify(recipe),
    });
  }

  /**
   * PUT /api/recipes/:id - Update a recipe
   */
  async updateRecipe(id: string, recipe: UpdateRecipeDto): Promise<Recipe> {
    return this.fetchWithErrorHandling<Recipe>(`/api/recipes/${id}`, {
      method: 'PUT',
      body: JSON.stringify(recipe),
    });
  }

  /**
   * DELETE /api/recipes/:id - Delete a recipe
   */
  async deleteRecipe(id: string): Promise<void> {
    return this.fetchWithErrorHandling<void>(`/api/recipes/${id}`, {
      method: 'DELETE',
    });
  }

  /**
   * POST /api/grocery-list - Generate consolidated grocery list from recipe IDs
   */
  async generateGroceryList(recipeIds: string[]): Promise<GroceryListResponse> {
    return this.fetchWithErrorHandling<GroceryListResponse>('/api/grocery-list', {
      method: 'POST',
      body: JSON.stringify({ recipeIds }),
    });
  }

  /**
   * GET /api/grocery-list/uncategorized - Get uncategorized ingredients
   */
  async getUncategorizedIngredients(): Promise<{ ingredients: string[]; count: number }> {
    return this.fetchWithErrorHandling('/api/grocery-list/uncategorized');
  }

  /**
   * GET /api/grocery-list/categories - Get available categories
   */
  async getAvailableCategories(): Promise<{ categories: string[] }> {
    return this.fetchWithErrorHandling('/api/grocery-list/categories');
  }

  /**
   * PUT /api/grocery-list/categorize - Update ingredient category
   */
  async updateIngredientCategory(ingredientName: string, category: string): Promise<{ success: boolean }> {
    return this.fetchWithErrorHandling('/api/grocery-list/categorize', {
      method: 'PUT',
      body: JSON.stringify({ ingredientName, category }),
    });
  }

  /**
   * GET /api/grocery-list/category/:ingredientName - Get ingredient category
   */
  async getIngredientCategory(ingredientName: string): Promise<{ ingredientName: string; category: string }> {
    return this.fetchWithErrorHandling(`/api/grocery-list/category/${encodeURIComponent(ingredientName)}`);
  }

  // ============================================
  // Saved Grocery List Methods
  // ============================================

  /**
   * POST /api/saved-lists - Create a new saved grocery list
   */
  async createSavedList(data: {
    name: string;
    items: Array<{
      name: string;
      quantity: number;
      unit: string;
      category: string;
    }>;
    recipeIds: string[];
  }): Promise<SavedGroceryList> {
    return this.fetchWithErrorHandling<SavedGroceryList>('/api/saved-lists', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  /**
   * GET /api/saved-lists - Get all saved grocery lists
   */
  async getSavedLists(): Promise<SavedGroceryList[]> {
    return this.fetchWithErrorHandling<SavedGroceryList[]>('/api/saved-lists');
  }

  /**
   * GET /api/saved-lists/:id - Get a specific saved grocery list
   */
  async getSavedListById(id: string): Promise<SavedGroceryList> {
    return this.fetchWithErrorHandling<SavedGroceryList>(`/api/saved-lists/${id}`);
  }

  /**
   * PUT /api/saved-lists/:id - Update a saved grocery list (rename)
   */
  async updateSavedList(id: string, data: { name: string }): Promise<SavedGroceryList> {
    return this.fetchWithErrorHandling<SavedGroceryList>(`/api/saved-lists/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  /**
   * DELETE /api/saved-lists/:id - Delete a saved grocery list
   */
  async deleteSavedList(id: string): Promise<void> {
    return this.fetchWithErrorHandling<void>(`/api/saved-lists/${id}`, {
      method: 'DELETE',
    });
  }

  /**
   * PATCH /api/saved-lists/:id/items/:itemId/check - Toggle item checked state
   */
  async toggleItemChecked(listId: string, itemId: string): Promise<SavedGroceryList> {
    return this.fetchWithErrorHandling<SavedGroceryList>(
      `/api/saved-lists/${listId}/items/${itemId}/check`,
      {
        method: 'PATCH',
      }
    );
  }

  /**
   * POST /api/saved-lists/:id/items - Add item to saved grocery list
   */
  async addItemToList(
    listId: string,
    item: {
      name: string;
      quantity: number;
      unit: string;
      category: string;
    }
  ): Promise<SavedGroceryList> {
    return this.fetchWithErrorHandling<SavedGroceryList>(`/api/saved-lists/${listId}/items`, {
      method: 'POST',
      body: JSON.stringify(item),
    });
  }

  /**
   * DELETE /api/saved-lists/:id/items/:itemId - Remove item from saved grocery list
   */
  async removeItemFromList(listId: string, itemId: string): Promise<SavedGroceryList> {
    return this.fetchWithErrorHandling<SavedGroceryList>(
      `/api/saved-lists/${listId}/items/${itemId}`,
      {
        method: 'DELETE',
      }
    );
  }
}

// Export singleton instance
export const apiService = new ApiService();
