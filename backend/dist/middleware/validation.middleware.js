"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateCreateRecipe = validateCreateRecipe;
exports.validateUpdateRecipe = validateUpdateRecipe;
/**
 * Validate URL format (optional)
 */
function isValidUrl(url) {
    try {
        new URL(url);
        return true;
    }
    catch {
        return false;
    }
}
/**
 * Validate ingredient structure
 */
function isValidIngredient(ingredient) {
    return (ingredient &&
        typeof ingredient === 'object' &&
        typeof ingredient.name === 'string' &&
        ingredient.name.trim().length > 0 &&
        typeof ingredient.quantity === 'number' &&
        ingredient.quantity > 0 &&
        typeof ingredient.unit === 'string' &&
        ingredient.unit.trim().length > 0);
}
/**
 * Validate create recipe request
 */
function validateCreateRecipe(req, res, next) {
    const { title, ingredients, instructions, sourceUrl } = req.body;
    // Validate title
    if (!title || typeof title !== 'string' || title.trim().length === 0) {
        res.status(400).json({ error: 'Title is required and must be a non-empty string' });
        return;
    }
    // Validate ingredients
    if (!Array.isArray(ingredients) || ingredients.length === 0) {
        res.status(400).json({ error: 'At least one ingredient is required' });
        return;
    }
    // Validate each ingredient
    for (let i = 0; i < ingredients.length; i++) {
        if (!isValidIngredient(ingredients[i])) {
            res.status(400).json({
                error: `Invalid ingredient at index ${i}: must have name (string), quantity (positive number), and unit (string)`
            });
            return;
        }
    }
    // Validate instructions
    if (!instructions || typeof instructions !== 'string' || instructions.trim().length === 0) {
        res.status(400).json({ error: 'Instructions are required and must be a non-empty string' });
        return;
    }
    // Validate sourceUrl if provided
    if (sourceUrl !== undefined && sourceUrl !== null && sourceUrl !== '') {
        if (typeof sourceUrl !== 'string' || !isValidUrl(sourceUrl)) {
            res.status(400).json({ error: 'Source URL must be a valid URL' });
            return;
        }
    }
    next();
}
/**
 * Validate update recipe request
 */
function validateUpdateRecipe(req, res, next) {
    const { title, ingredients, instructions, sourceUrl } = req.body;
    // At least one field must be provided
    if (title === undefined && ingredients === undefined && instructions === undefined && sourceUrl === undefined) {
        res.status(400).json({ error: 'At least one field (title, ingredients, instructions, or sourceUrl) must be provided' });
        return;
    }
    // Validate title if provided
    if (title !== undefined && (typeof title !== 'string' || title.trim().length === 0)) {
        res.status(400).json({ error: 'Title must be a non-empty string' });
        return;
    }
    // Validate ingredients if provided
    if (ingredients !== undefined) {
        if (!Array.isArray(ingredients) || ingredients.length === 0) {
            res.status(400).json({ error: 'Ingredients must be a non-empty array' });
            return;
        }
        for (let i = 0; i < ingredients.length; i++) {
            if (!isValidIngredient(ingredients[i])) {
                res.status(400).json({
                    error: `Invalid ingredient at index ${i}: must have name (string), quantity (positive number), and unit (string)`
                });
                return;
            }
        }
    }
    // Validate instructions if provided
    if (instructions !== undefined && (typeof instructions !== 'string' || instructions.trim().length === 0)) {
        res.status(400).json({ error: 'Instructions must be a non-empty string' });
        return;
    }
    // Validate sourceUrl if provided
    if (sourceUrl !== undefined && sourceUrl !== null && sourceUrl !== '') {
        if (typeof sourceUrl !== 'string' || !isValidUrl(sourceUrl)) {
            res.status(400).json({ error: 'Source URL must be a valid URL' });
            return;
        }
    }
    next();
}
