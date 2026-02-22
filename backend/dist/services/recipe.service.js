"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RecipeService = void 0;
const uuid_1 = require("uuid");
class RecipeService {
    constructor(storage) {
        this.storage = storage;
    }
    /**
     * Create a new recipe
     */
    async create(userId, dto) {
        const now = new Date().toISOString();
        const recipe = {
            id: (0, uuid_1.v4)(),
            userId,
            title: dto.title,
            ingredients: dto.ingredients,
            instructions: dto.instructions,
            sourceUrl: dto.sourceUrl,
            createdAt: now,
            updatedAt: now,
        };
        if ('setAsync' in this.storage) {
            await this.storage.setAsync(recipe.id, recipe);
        }
        else {
            this.storage.set(recipe.id, recipe);
        }
        return recipe;
    }
    /**
     * Get a recipe by ID
     */
    async read(userId, id) {
        const recipe = 'getAsync' in this.storage
            ? await this.storage.getAsync(id)
            : this.storage.get(id);
        if (!recipe || recipe.userId !== userId) {
            return null;
        }
        return recipe;
    }
    /**
     * Update a recipe
     */
    async update(userId, id, dto) {
        const existing = 'getAsync' in this.storage
            ? await this.storage.getAsync(id)
            : this.storage.get(id);
        if (!existing || existing.userId !== userId) {
            return null;
        }
        const updated = {
            ...existing,
            ...dto,
            id: existing.id,
            userId: existing.userId,
            createdAt: existing.createdAt,
            updatedAt: new Date().toISOString(),
        };
        if ('setAsync' in this.storage) {
            await this.storage.setAsync(id, updated);
        }
        else {
            this.storage.set(id, updated);
        }
        return updated;
    }
    /**
     * Delete a recipe
     */
    async delete(userId, id) {
        const recipe = 'getAsync' in this.storage
            ? await this.storage.getAsync(id)
            : this.storage.get(id);
        if (!recipe || recipe.userId !== userId) {
            return false;
        }
        if ('deleteAsync' in this.storage) {
            return await this.storage.deleteAsync(id);
        }
        return this.storage.delete(id);
    }
    /**
     * List all recipes
     */
    async list(userId) {
        const allRecipes = 'getAllAsync' in this.storage
            ? await this.storage.getAllAsync()
            : this.storage.getAll();
        return Object.values(allRecipes).filter((recipe) => recipe.userId === userId);
    }
    /**
     * Get all unique ingredient names from all recipes
     */
    async getUniqueIngredientNames(userId) {
        const recipes = await this.list(userId);
        const ingredientNames = new Set();
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
exports.RecipeService = RecipeService;
