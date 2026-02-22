import type {
  Recipe,
  CreateRecipeDto,
  UpdateRecipeDto,
  GroceryListResponse,
  ApiError,
} from '../types/recipe.types';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';

class ApiService {
  private baseUrl: string;

  constructor(baseUrl: string = API_BASE_URL) {
    this.baseUrl = baseUrl;
  }

  /**
   * Generic fetch wrapper with error handling
   */
  private async fetchWithErrorHandling<T>(
    url: string,
    options?: RequestInit
  ): Promise<T> {
    try {
      const response = await fetch(`${this.baseUrl}${url}`, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          ...options?.headers,
        },
      });

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
}

// Export singleton instance
export const apiService = new ApiService();
