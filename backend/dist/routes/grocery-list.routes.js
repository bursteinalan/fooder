"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createGroceryListRouter = createGroceryListRouter;
const express_1 = require("express");
function createGroceryListRouter(groceryListService) {
    const router = (0, express_1.Router)();
    /**
     * POST /api/grocery-list - Generate consolidated grocery list from recipe IDs
     */
    router.post('/', async (req, res) => {
        try {
            const userId = req.userId;
            const { recipeIds } = req.body;
            // Validate request body
            if (!recipeIds || !Array.isArray(recipeIds)) {
                res.status(400).json({
                    error: 'Invalid request',
                    message: 'recipeIds must be an array'
                });
                return;
            }
            if (recipeIds.length === 0) {
                res.status(400).json({
                    error: 'Invalid request',
                    message: 'recipeIds array cannot be empty'
                });
                return;
            }
            // Generate consolidated grocery list
            const items = await groceryListService.generateGroceryList(userId, recipeIds);
            res.json({ items });
        }
        catch (error) {
            res.status(500).json({
                error: 'Failed to generate grocery list',
                message: error instanceof Error ? error.message : 'Unknown error'
            });
        }
    });
    /**
     * GET /api/grocery-list/uncategorized - Get all uncategorized ingredients
     */
    router.get('/uncategorized', async (req, res) => {
        try {
            const userId = req.userId;
            const uncategorized = await groceryListService.getUncategorizedIngredients(userId);
            res.json({ ingredients: uncategorized, count: uncategorized.length });
        }
        catch (error) {
            res.status(500).json({
                error: 'Failed to get uncategorized ingredients',
                message: error instanceof Error ? error.message : 'Unknown error'
            });
        }
    });
    /**
     * GET /api/grocery-list/categories - Get all available categories
     */
    router.get('/categories', (req, res) => {
        try {
            const categories = groceryListService.getAvailableCategories();
            res.json({ categories });
        }
        catch (error) {
            res.status(500).json({
                error: 'Failed to get categories',
                message: error instanceof Error ? error.message : 'Unknown error'
            });
        }
    });
    /**
     * PUT /api/grocery-list/categorize - Update ingredient category
     */
    router.put('/categorize', async (req, res) => {
        try {
            const userId = req.userId;
            const { ingredientName, category } = req.body;
            if (!ingredientName || typeof ingredientName !== 'string') {
                res.status(400).json({ error: 'ingredientName is required and must be a string' });
                return;
            }
            if (!category || typeof category !== 'string') {
                res.status(400).json({ error: 'category is required and must be a string' });
                return;
            }
            await groceryListService.updateIngredientCategory(userId, ingredientName, category);
            res.json({ success: true, message: 'Category updated successfully' });
        }
        catch (error) {
            res.status(400).json({
                error: 'Failed to update category',
                message: error instanceof Error ? error.message : 'Unknown error'
            });
        }
    });
    /**
     * GET /api/grocery-list/category/:ingredientName - Get category for ingredient
     */
    router.get('/category/:ingredientName', async (req, res) => {
        try {
            const userId = req.userId;
            const ingredientName = req.params.ingredientName;
            const category = await groceryListService.getIngredientCategory(userId, ingredientName);
            res.json({ ingredientName, category });
        }
        catch (error) {
            res.status(500).json({
                error: 'Failed to get ingredient category',
                message: error instanceof Error ? error.message : 'Unknown error'
            });
        }
    });
    return router;
}
