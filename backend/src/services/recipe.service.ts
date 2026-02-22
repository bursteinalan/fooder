import { v4 as uuidv4 } from 'uuid';
import { StorageAdapter } from '../storage/storage-factory';
import { Recipe, CreateRecipeDto, UpdateRecipeDto } from '../models/recipe.model';

export class RecipeService {
  private storage: StorageAdapter;

  constructor(storage: StorageAdapter) {
    this.storage = storage;
  }

  /**
   * Create a new recipe
   */
  async create(userId: string, dto: CreateRecipeDto): Promise<Recipe> {
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

    if ('setAsync' in this.storage) {
      await (this.storage as any).setAsync(recipe.id, recipe);
    } else {
      this.storage.set(recipe.id, recipe);
    }
    return recipe;
  }

  /**
   * Get a recipe by ID
   */
  async read(userId: string, id: string): Promise<Recipe | null> {
    const recipe = 'getAsync' in this.storage
      ? await (this.storage as any).getAsync(id)
      : this.storage.get(id);
    
    if (!recipe || recipe.userId !== userId) {
      return null;
    }
    return recipe;
  }

  /**
   * Update a recipe
   */
  async update(userId: string, id: string, dto: UpdateRecipeDto): Promise<Recipe | null> {
    const existing = 'getAsync' in this.storage
      ? await (this.storage as any).getAsync(id)
      : this.storage.get(id);
    
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

    if ('setAsync' in this.storage) {
      await (this.storage as any).setAsync(id, updated);
    } else {
      this.storage.set(id, updated);
    }
    return updated;
  }

  /**
   * Delete a recipe
   */
  async delete(userId: string, id: string): Promise<boolean> {
    const recipe = 'getAsync' in this.storage
      ? await (this.storage as any).getAsync(id)
      : this.storage.get(id);
    
    if (!recipe || recipe.userId !== userId) {
      return false;
    }
    
    if ('deleteAsync' in this.storage) {
      return await (this.storage as any).deleteAsync(id);
    }
    return this.storage.delete(id);
  }

  /**
   * List all recipes
   */
  async list(userId: string): Promise<Recipe[]> {
    const allRecipes = 'getAllAsync' in this.storage
      ? await (this.storage as any).getAllAsync()
      : this.storage.getAll();
    
    return Object.values(allRecipes).filter((recipe: any) => recipe.userId === userId) as Recipe[];
  }

  /**
   * Get all unique ingredient names from all recipes
   */
  async getUniqueIngredientNames(userId: string): Promise<string[]> {
    const recipes = await this.list(userId);
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
