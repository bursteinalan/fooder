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
exports.RecipeScraperService = void 0;
const cheerio = __importStar(require("cheerio"));
class RecipeScraperService {
    /**
     * Attempt to scrape recipe data from a URL
     */
    async scrapeRecipe(url) {
        try {
            const response = await fetch(url);
            if (!response.ok) {
                throw new Error(`Failed to fetch URL: ${response.statusText}`);
            }
            const html = await response.text();
            // Try to find JSON-LD schema.org Recipe data (most common)
            const jsonLdRecipe = this.extractFromJsonLd(html);
            if (jsonLdRecipe) {
                return jsonLdRecipe;
            }
            // Fallback: try to extract from common HTML patterns
            const htmlRecipe = this.extractFromHtml(html);
            if (htmlRecipe) {
                return htmlRecipe;
            }
            return null;
        }
        catch (error) {
            console.error('Error scraping recipe:', error);
            return null;
        }
    }
    /**
     * Extract recipe from JSON-LD schema.org markup
     */
    extractFromJsonLd(html) {
        try {
            const $ = cheerio.load(html);
            const scripts = $('script[type="application/ld+json"]');
            for (let i = 0; i < scripts.length; i++) {
                const scriptContent = $(scripts[i]).html();
                if (!scriptContent)
                    continue;
                const data = JSON.parse(scriptContent);
                // Handle both single recipe and array of items
                const recipes = Array.isArray(data) ? data : [data];
                for (const item of recipes) {
                    // Check if this is a Recipe or if it contains a Recipe in @graph
                    let recipe = item;
                    if (item['@graph']) {
                        recipe = item['@graph'].find((g) => g['@type'] === 'Recipe' ||
                            (Array.isArray(g['@type']) && g['@type'].includes('Recipe')));
                    }
                    if (!recipe || (recipe['@type'] !== 'Recipe' &&
                        (!Array.isArray(recipe['@type']) || !recipe['@type'].includes('Recipe')))) {
                        continue;
                    }
                    const title = recipe.name || '';
                    const instructions = this.extractInstructions(recipe);
                    const ingredients = this.extractIngredients(recipe);
                    if (title && ingredients.length > 0) {
                        return { title, ingredients, instructions };
                    }
                }
            }
        }
        catch (error) {
            console.error('Error parsing JSON-LD:', error);
        }
        return null;
    }
    /**
     * Extract instructions from recipe data
     */
    extractInstructions(recipe) {
        if (typeof recipe.recipeInstructions === 'string') {
            return recipe.recipeInstructions;
        }
        if (Array.isArray(recipe.recipeInstructions)) {
            return recipe.recipeInstructions
                .map((instruction, index) => {
                if (typeof instruction === 'string') {
                    return instruction;
                }
                if (instruction.text) {
                    return `${index + 1}. ${instruction.text}`;
                }
                return '';
            })
                .filter(Boolean)
                .join('\n');
        }
        return '';
    }
    /**
     * Extract and parse ingredients from recipe data
     */
    extractIngredients(recipe) {
        const ingredientStrings = [];
        if (Array.isArray(recipe.recipeIngredient)) {
            ingredientStrings.push(...recipe.recipeIngredient);
        }
        else if (typeof recipe.recipeIngredient === 'string') {
            ingredientStrings.push(recipe.recipeIngredient);
        }
        return ingredientStrings
            .map(str => this.parseIngredient(str))
            .filter((ing) => ing !== null);
    }
    /**
     * Parse an ingredient string into structured data
     * This is a best-effort parser for common formats
     */
    parseIngredient(ingredientStr) {
        if (!ingredientStr || typeof ingredientStr !== 'string') {
            return null;
        }
        // Common patterns: "2 cups flour", "1/2 cup sugar", "3 tablespoons butter"
        const pattern = /^(\d+(?:\/\d+)?(?:\.\d+)?)\s*([a-zA-Z]+)?\s+(.+)$/;
        const match = ingredientStr.trim().match(pattern);
        if (match) {
            const [, quantityStr, unit, name] = match;
            // Parse quantity (handle fractions like 1/2)
            let quantity = 0;
            if (quantityStr.includes('/')) {
                const [num, denom] = quantityStr.split('/').map(Number);
                quantity = num / denom;
            }
            else {
                quantity = parseFloat(quantityStr);
            }
            // Normalize unit names
            const normalizedUnit = this.normalizeUnit(unit || '');
            return {
                name: name.trim(),
                quantity,
                unit: normalizedUnit
            };
        }
        // If no quantity found, try to extract just unit and name
        const simplePattern = /^([a-zA-Z]+)\s+(.+)$/;
        const simpleMatch = ingredientStr.trim().match(simplePattern);
        if (simpleMatch) {
            const [, possibleUnit, name] = simpleMatch;
            const normalizedUnit = this.normalizeUnit(possibleUnit);
            // Check if it's actually a unit
            if (normalizedUnit !== possibleUnit.toLowerCase()) {
                return {
                    name: name.trim(),
                    quantity: 1,
                    unit: normalizedUnit
                };
            }
        }
        // Fallback: treat entire string as ingredient name with default values
        return {
            name: ingredientStr.trim(),
            quantity: 1,
            unit: 'piece'
        };
    }
    /**
     * Normalize unit names to standard units (singular forms)
     */
    normalizeUnit(unit) {
        const unitMap = {
            'teaspoon': 'tsp',
            'teaspoons': 'tsp',
            'tablespoon': 'tbsp',
            'tablespoons': 'tbsp',
            'ounce': 'oz',
            'ounces': 'oz',
            'pound': 'lb',
            'pounds': 'lb',
            'lbs': 'lb',
            'gram': 'g',
            'grams': 'g',
            'kilogram': 'kg',
            'kilograms': 'kg',
            'milliliter': 'ml',
            'milliliters': 'ml',
            'liter': 'l',
            'liters': 'l',
            'cup': 'cup',
            'cups': 'cup',
            'clove': 'clove',
            'cloves': 'clove',
            'piece': 'piece',
            'pieces': 'piece',
            'pinch': 'pinch',
            'dash': 'dash',
            'can': 'can',
            'cans': 'can',
            'bunch': 'bunch',
            'bunches': 'bunch',
            'whole': 'whole',
            'package': 'piece',
            'packages': 'piece',
            'pkg': 'piece'
        };
        const normalized = unit.toLowerCase().trim();
        return unitMap[normalized] || normalized || 'piece';
    }
    /**
     * Fallback: Extract recipe from common HTML patterns
     */
    extractFromHtml(html) {
        try {
            const $ = cheerio.load(html);
            // This is a very basic fallback - most modern recipe sites use JSON-LD
            const title = $('h1').first().text().trim() ||
                $('[class*="recipe"][class*="title"]').first().text().trim() ||
                $('title').text().trim();
            if (!title) {
                return null;
            }
            // Try to find ingredients list
            const ingredients = [];
            $('[class*="ingredient"]').each((_, elem) => {
                const text = $(elem).text().trim();
                if (text) {
                    const parsed = this.parseIngredient(text);
                    if (parsed) {
                        ingredients.push(parsed);
                    }
                }
            });
            // Try to find instructions
            const instructions = $('[class*="instruction"]').text().trim() ||
                $('[class*="direction"]').text().trim() ||
                '';
            if (ingredients.length > 0) {
                return { title, ingredients, instructions };
            }
            return null;
        }
        catch (error) {
            console.error('Error parsing HTML:', error);
            return null;
        }
    }
}
exports.RecipeScraperService = RecipeScraperService;
