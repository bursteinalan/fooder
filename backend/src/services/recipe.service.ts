import { v4 as uuidv4 } from 'uuid';
import { StorageService } from '../storage/storage.service';
import { Recipe, CreateRecipeDto, UpdateRecipeDto } from '../models/recipe.model';

export class RecipeService {
  private storage: StorageService;

  constructor(storage: StorageService) {
    this.storage = storage;
  }

  /**
   * Create a new recipe
   */
  create(userId: string, dto: CreateRecipeDto): Recipe {
    const now = new Date().toISOString();
    const recipe: Recipe = {
      id: uuidv4(),
      userId,
      title: dto.title,
      ingredients: dto.ingredients,
      instructions: dto.instructions,
      sourceUrl: dto.sourceUrl,
      createdAt: now,
      updatedAt: now,
    };

    this.storage.set(recipe.id, recipe);
    return recipe;
  }

  /**
   * Get a recipe by ID
   */
  read(userId: string, id: string): Recipe | null {
    const recipe = this.storage.get(id);
    if (!recipe || recipe.userId !== userId) {
      return null;
    }
    return recipe;
  }

  /**
   * Update a recipe
   */
  update(userId: string, id: string, dto: UpdateRecipeDto): Recipe | null {
    const existing = this.storage.get(id);
    if (!existing || existing.userId !== userId) {
      return null;
    }

    const updated: Recipe = {
      ...existing,
      ...dto,
      id: existing.id,
      userId: existing.userId,
      createdAt: existing.createdAt,
      updatedAt: new Date().toISOString(),
    };

    this.storage.set(id, updated);
    return updated;
  }

  /**
   * Delete a recipe
   */
  delete(userId: string, id: string): boolean {
    const recipe = this.storage.get(id);
    if (!recipe || recipe.userId !== userId) {
      return false;
    }
    return this.storage.delete(id);
  }

  /**
   * List all recipes
   */
  list(userId: string): Recipe[] {
    const allRecipes = this.storage.getAll();
    return Object.values(allRecipes).filter(recipe => recipe.userId === userId);
  }

  /**
   * Get all unique ingredient names from all recipes
   */
  getUniqueIngredientNames(userId: string): string[] {
    const recipes = this.list(userId);
    const ingredientNames = new Set<string>();

    recipes.forEach(recipe => {
      recipe.ingredients.forEach(ingredient => {
        if (ingredient.name.trim()) {
          ingredientNames.add(ingredient.name.toLowerCase().trim());
        }
      });
    });

    return Array.from(ingredientNames).sort();
  }
}
