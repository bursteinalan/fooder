"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.createRecipeRouter = createRecipeRouter;
const express_1 = require("express");
const validation_middleware_1 = require("../middleware/validation.middleware");
function createRecipeRouter(recipeService) {
    const router = (0, express_1.Router)();
    /**
     * GET /api/recipes - Retrieve all recipes
     */
    router.get('/', async (req, res) => {
        try {
            const userId = req.userId;
            const recipes = await recipeService.list(userId);
            res.json(recipes);
        }
        catch (error) {
            res.status(500).json({
                error: 'Failed to retrieve recipes',
                message: error instanceof Error ? error.message : 'Unknown error'
            });
        }
    });
    /**
     * GET /api/recipes/ingredients/names - Get all unique ingredient names
     */
    router.get('/ingredients/names', async (req, res) => {
        try {
            const userId = req.userId;
            const ingredientNames = await recipeService.getUniqueIngredientNames(userId);
            res.json(ingredientNames);
        }
        catch (error) {
            res.status(500).json({
                error: 'Failed to retrieve ingredient names',
                message: error instanceof Error ? error.message : 'Unknown error'
            });
        }
    });
    /**
     * POST /api/recipes/scrape - Scrape recipe from URL
     */
    router.post('/scrape', async (req, res) => {
        try {
            const { url } = req.body;
            if (!url || typeof url !== 'string') {
                res.status(400).json({ error: 'URL is required' });
                return;
            }
            // Validate URL format
            try {
                new URL(url);
            }
            catch {
                res.status(400).json({ error: 'Invalid URL format' });
                return;
            }
            const { RecipeScraperService } = await Promise.resolve().then(() => __importStar(require('../services/recipe-scraper.service')));
            const scraper = new RecipeScraperService();
            const scrapedRecipe = await scraper.scrapeRecipe(url);
            if (!scrapedRecipe) {
                res.status(404).json({
                    error: 'Could not extract recipe data from URL',
                    message: 'The URL may not contain structured recipe data or may not be accessible'
                });
                return;
            }
            res.json(scrapedRecipe);
        }
        catch (error) {
            res.status(500).json({
                error: 'Failed to scrape recipe',
                message: error instanceof Error ? error.message : 'Unknown error'
            });
        }
    });
    /**
     * GET /api/recipes/:id - Retrieve a specific recipe
     */
    router.get('/:id', async (req, res) => {
        try {
            const userId = req.userId;
            const id = req.params.id;
            const recipe = await recipeService.read(userId, id);
            if (!recipe) {
                res.status(404).json({ error: 'Recipe not found' });
                return;
            }
            res.json(recipe);
        }
        catch (error) {
            res.status(500).json({
                error: 'Failed to retrieve recipe',
                message: error instanceof Error ? error.message : 'Unknown error'
            });
        }
    });
    /**
     * POST /api/recipes - Create a new recipe
     */
    router.post('/', validation_middleware_1.validateCreateRecipe, async (req, res) => {
        try {
            const userId = req.userId;
            const recipe = await recipeService.create(userId, req.body);
            res.status(201).json(recipe);
        }
        catch (error) {
            res.status(500).json({
                error: 'Failed to create recipe',
                message: error instanceof Error ? error.message : 'Unknown error'
            });
        }
    });
    /**
     * PUT /api/recipes/:id - Update a recipe
     */
    router.put('/:id', validation_middleware_1.validateUpdateRecipe, async (req, res) => {
        try {
            const userId = req.userId;
            const id = req.params.id;
            const recipe = await recipeService.update(userId, id, req.body);
            if (!recipe) {
                res.status(404).json({ error: 'Recipe not found' });
                return;
            }
            res.json(recipe);
        }
        catch (error) {
            res.status(500).json({
                error: 'Failed to update recipe',
                message: error instanceof Error ? error.message : 'Unknown error'
            });
        }
    });
    /**
     * DELETE /api/recipes/:id - Delete a recipe
     */
    router.delete('/:id', async (req, res) => {
        try {
            const userId = req.userId;
            const id = req.params.id;
            const deleted = await recipeService.delete(userId, id);
            if (!deleted) {
                res.status(404).json({ error: 'Recipe not found' });
                return;
            }
            res.status(204).send();
        }
        catch (error) {
            res.status(500).json({
                error: 'Failed to delete recipe',
                message: error instanceof Error ? error.message : 'Unknown error'
            });
        }
    });
    return router;
}
