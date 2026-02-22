import { RecipeService } from './recipe.service';
import { Ingredient } from '../models/recipe.model';
import { StorageAdapter } from '../storage/storage-factory';

export interface ConsolidatedIngredient {
  name: string;
  quantity: number;
  unit: string;
  category: string;
}

// Available category options
export const AVAILABLE_CATEGORIES = [
  'Produce',
  'Meat & Seafood',
  'Dairy & Eggs',
  'Pantry & Dry Goods',
  'Spices & Seasonings',
  'Canned & Jarred',
  'Frozen',
  'Bakery',
  'Beverages',
  'Other'
];

export class GroceryListService {
  private recipeService: RecipeService;
  private storageService: StorageAdapter;

  constructor(recipeService: RecipeService, storageService: StorageAdapter) {
    this.recipeService = recipeService;
    this.storageService = storageService;
  }

  /**
   * Categorize an ingredient using user-specific categories
   */
  private async categorizeIngredient(userId: string, ingredientName: string): Promise<string> {
    const normalized = ingredientName.toLowerCase().trim();
    
    // Get user's custom categories
    const user = 'getUserAsync' in this.storageService
      ? await (this.storageService as any).getUserAsync(userId)
      : this.storageService.getUser(userId);
    
    if (user && user.customCategories && user.customCategories[normalized]) {
      return user.customCategories[normalized];
    }
    
    // Fall back to common categories
    const commonCategories = 'getCommonCategoriesAsync' in this.storageService
      ? await (this.storageService as any).getCommonCategoriesAsync()
      : this.storageService.getCommonCategories();
    
    if (commonCategories[normalized]) {
      return commonCategories[normalized];
    }
    
    // Check if ingredient name contains any category keyword in common categories
    for (const [keyword, category] of Object.entries(commonCategories)) {
      if (normalized.includes(keyword)) {
        return category as string;
      }
    }
    
    // Default category
    return 'Other';
  }

  /**
   * Generate a consolidated grocery list from multiple recipe IDs
   * Combines ingredients with matching names and units, and categorizes them
   */
  async generateGroceryList(userId: string, recipeIds: string[]): Promise<ConsolidatedIngredient[]> {
    const ingredientMap = new Map<string, ConsolidatedIngredient>();

    // Iterate through each recipe
    for (const recipeId of recipeIds) {
      const recipe = await this.recipeService.read(userId, recipeId);
      
      if (!recipe) {
        continue; // Skip invalid recipe IDs
      }

      // Process each ingredient in the recipe
      for (const ingredient of recipe.ingredients) {
        const normalizedName = ingredient.name.toLowerCase().trim();
        const normalizedUnit = ingredient.unit.toLowerCase().trim();
        
        // Create a unique key combining name and unit
        const key = `${normalizedName}|${normalizedUnit}`;

        if (ingredientMap.has(key)) {
          // Ingredient with same name and unit exists - add quantities
          const existing = ingredientMap.get(key)!;
          existing.quantity += ingredient.quantity;
        } else {
          // New ingredient - add to map with category
          ingredientMap.set(key, {
            name: normalizedName,
            quantity: ingredient.quantity,
            unit: normalizedUnit,
            category: await this.categorizeIngredient(userId, normalizedName),
          });
        }
      }
    }

    // Convert map to array and sort by category, then by name
    return Array.from(ingredientMap.values()).sort((a, b) => {
      // First sort by category
      if (a.category !== b.category) {
        return a.category.localeCompare(b.category);
      }
      // Then sort by name within category
      return a.name.localeCompare(b.name);
    });
  }

  /**
   * Get all unique ingredient names that are categorized as "Other"
   */
  async getUncategorizedIngredients(userId: string): Promise<string[]> {
    const recipes = await this.recipeService.list(userId);
    const uncategorized = new Set<string>();

    for (const recipe of recipes) {
      for (const ingredient of recipe.ingredients) {
        const normalized = ingredient.name.toLowerCase().trim();
        const category = await this.categorizeIngredient(userId, normalized);
        if (category === 'Other') {
          uncategorized.add(normalized);
        }
      }
    }

    return Array.from(uncategorized).sort();
  }

  /**
   * Update the category for a specific ingredient
   */
  async updateIngredientCategory(userId: string, ingredientName: string, category: string): Promise<void> {
    const normalized = ingredientName.toLowerCase().trim();
    
    if (!AVAILABLE_CATEGORIES.includes(category)) {
      throw new Error(`Invalid category: ${category}`);
    }
    
    // Get user and update their custom categories
    const user = 'getUserAsync' in this.storageService
      ? await (this.storageService as any).getUserAsync(userId)
      : this.storageService.getUser(userId);
    
    if (!user) {
      throw new Error(`User not found: ${userId}`);
    }
    
    // Initialize customCategories if it doesn't exist
    if (!user.customCategories) {
      user.customCategories = {};
    }
    
    user.customCategories[normalized] = category;
    
    if ('setUserAsync' in this.storageService) {
      await (this.storageService as any).setUserAsync(userId, user);
    } else {
      this.storageService.setUser(userId, user);
    }
  }

  /**
   * Get all available categories
   */
  getAvailableCategories(): string[] {
    return AVAILABLE_CATEGORIES;
  }

  /**
   * Get the category for a specific ingredient
   */
  async getIngredientCategory(userId: string, ingredientName: string): Promise<string> {
    return this.categorizeIngredient(userId, ingredientName);
  }
}
