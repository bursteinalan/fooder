import { RecipeService } from './recipe.service';
import { Ingredient } from '../models/recipe.model';
import { StorageService } from '../storage/storage.service';

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
  private storageService: StorageService;

  constructor(recipeService: RecipeService, storageService: StorageService) {
    this.recipeService = recipeService;
    this.storageService = storageService;
  }

  /**
   * Categorize an ingredient using user-specific categories
   */
  private categorizeIngredient(userId: string, ingredientName: string): string {
    const normalized = ingredientName.toLowerCase().trim();
    
    // Get user's custom categories
    const user = this.storageService.getUser(userId);
    if (user && user.customCategories && user.customCategories[normalized]) {
      return user.customCategories[normalized];
    }
    
    // Fall back to common categories
    const commonCategories = this.storageService.getCommonCategories();
    if (commonCategories[normalized]) {
      return commonCategories[normalized];
    }
    
    // Check if ingredient name contains any category keyword in common categories
    for (const [keyword, category] of Object.entries(commonCategories)) {
      if (normalized.includes(keyword)) {
        return category;
      }
    }
    
    // Default category
    return 'Other';
  }

  /**
   * Generate a consolidated grocery list from multiple recipe IDs
   * Combines ingredients with matching names and units, and categorizes them
   */
  generateGroceryList(userId: string, recipeIds: string[]): ConsolidatedIngredient[] {
    const ingredientMap = new Map<string, ConsolidatedIngredient>();

    // Iterate through each recipe
    for (const recipeId of recipeIds) {
      const recipe = this.recipeService.read(userId, recipeId);
      
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
            category: this.categorizeIngredient(userId, normalizedName),
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
  getUncategorizedIngredients(userId: string): string[] {
    const recipes = this.recipeService.list(userId);
    const uncategorized = new Set<string>();

    recipes.forEach(recipe => {
      recipe.ingredients.forEach(ingredient => {
        const normalized = ingredient.name.toLowerCase().trim();
        if (this.categorizeIngredient(userId, normalized) === 'Other') {
          uncategorized.add(normalized);
        }
      });
    });

    return Array.from(uncategorized).sort();
  }

  /**
   * Update the category for a specific ingredient
   */
  updateIngredientCategory(userId: string, ingredientName: string, category: string): void {
    const normalized = ingredientName.toLowerCase().trim();
    
    if (!AVAILABLE_CATEGORIES.includes(category)) {
      throw new Error(`Invalid category: ${category}`);
    }
    
    // Get user and update their custom categories
    const user = this.storageService.getUser(userId);
    if (!user) {
      throw new Error(`User not found: ${userId}`);
    }
    
    // Initialize customCategories if it doesn't exist
    if (!user.customCategories) {
      user.customCategories = {};
    }
    
    user.customCategories[normalized] = category;
    this.storageService.setUser(userId, user);
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
  getIngredientCategory(userId: string, ingredientName: string): string {
    return this.categorizeIngredient(userId, ingredientName);
  }
}
