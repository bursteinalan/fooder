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
    create(dto) {
        const now = new Date().toISOString();
        const recipe = {
            id: (0, uuid_1.v4)(),
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
    read(id) {
        return this.storage.get(id);
    }
    /**
     * Update a recipe
     */
    update(id, dto) {
        const existing = this.storage.get(id);
        if (!existing) {
            return null;
        }
        const updated = {
            ...existing,
            ...dto,
            id: existing.id,
            createdAt: existing.createdAt,
            updatedAt: new Date().toISOString(),
        };
        this.storage.set(id, updated);
        return updated;
    }
    /**
     * Delete a recipe
     */
    delete(id) {
        return this.storage.delete(id);
    }
    /**
     * List all recipes
     */
    list() {
        const allRecipes = this.storage.getAll();
        return Object.values(allRecipes);
    }
    /**
     * Get all unique ingredient names from all recipes
     */
    getUniqueIngredientNames() {
        const recipes = this.list();
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
