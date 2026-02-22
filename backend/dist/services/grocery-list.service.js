"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GroceryListService = exports.AVAILABLE_CATEGORIES = void 0;
// Ingredient categories for grocery list organization
const INGREDIENT_CATEGORIES = {
    // Produce
    'onion': 'Produce',
    'garlic': 'Produce',
    'ginger': 'Produce',
    'carrot': 'Produce',
    'carrots': 'Produce',
    'celery': 'Produce',
    'potato': 'Produce',
    'potatoes': 'Produce',
    'tomato': 'Produce',
    'tomatoes': 'Produce',
    'lettuce': 'Produce',
    'spinach': 'Produce',
    'kale': 'Produce',
    'broccoli': 'Produce',
    'cauliflower': 'Produce',
    'bell pepper': 'Produce',
    'pepper': 'Produce',
    'cucumber': 'Produce',
    'zucchini': 'Produce',
    'mushroom': 'Produce',
    'mushrooms': 'Produce',
    'apple': 'Produce',
    'banana': 'Produce',
    'lemon': 'Produce',
    'lime': 'Produce',
    'orange': 'Produce',
    'avocado': 'Produce',
    'cilantro': 'Produce',
    'parsley': 'Produce',
    'basil': 'Produce',
    'thyme': 'Produce',
    'rosemary': 'Produce',
    // Meat & Seafood
    'chicken': 'Meat & Seafood',
    'beef': 'Meat & Seafood',
    'pork': 'Meat & Seafood',
    'turkey': 'Meat & Seafood',
    'lamb': 'Meat & Seafood',
    'fish': 'Meat & Seafood',
    'salmon': 'Meat & Seafood',
    'tuna': 'Meat & Seafood',
    'shrimp': 'Meat & Seafood',
    'ground beef': 'Meat & Seafood',
    'ground turkey': 'Meat & Seafood',
    'bacon': 'Meat & Seafood',
    'sausage': 'Meat & Seafood',
    // Dairy & Eggs
    'milk': 'Dairy & Eggs',
    'butter': 'Dairy & Eggs',
    'cheese': 'Dairy & Eggs',
    'cream': 'Dairy & Eggs',
    'yogurt': 'Dairy & Eggs',
    'sour cream': 'Dairy & Eggs',
    'egg': 'Dairy & Eggs',
    'eggs': 'Dairy & Eggs',
    'cream cheese': 'Dairy & Eggs',
    'parmesan': 'Dairy & Eggs',
    'mozzarella': 'Dairy & Eggs',
    'cheddar': 'Dairy & Eggs',
    // Pantry & Dry Goods
    'flour': 'Pantry & Dry Goods',
    'sugar': 'Pantry & Dry Goods',
    'salt': 'Pantry & Dry Goods',
    'black pepper': 'Spices & Seasonings',
    'rice': 'Pantry & Dry Goods',
    'pasta': 'Pantry & Dry Goods',
    'bread': 'Pantry & Dry Goods',
    'oil': 'Pantry & Dry Goods',
    'olive oil': 'Pantry & Dry Goods',
    'vegetable oil': 'Pantry & Dry Goods',
    'coconut oil': 'Pantry & Dry Goods',
    'vinegar': 'Pantry & Dry Goods',
    'soy sauce': 'Pantry & Dry Goods',
    'honey': 'Pantry & Dry Goods',
    'maple syrup': 'Pantry & Dry Goods',
    'beans': 'Pantry & Dry Goods',
    'lentils': 'Pantry & Dry Goods',
    'chickpeas': 'Pantry & Dry Goods',
    'oats': 'Pantry & Dry Goods',
    'quinoa': 'Pantry & Dry Goods',
    'cornstarch': 'Pantry & Dry Goods',
    'baking powder': 'Pantry & Dry Goods',
    'baking soda': 'Pantry & Dry Goods',
    'vanilla': 'Pantry & Dry Goods',
    'vanilla extract': 'Pantry & Dry Goods',
    'chocolate chips': 'Pantry & Dry Goods',
    'nuts': 'Pantry & Dry Goods',
    'almonds': 'Pantry & Dry Goods',
    'walnuts': 'Pantry & Dry Goods',
    // Spices & Seasonings
    'cumin': 'Spices & Seasonings',
    'paprika': 'Spices & Seasonings',
    'chili powder': 'Spices & Seasonings',
    'cayenne': 'Spices & Seasonings',
    'turmeric': 'Spices & Seasonings',
    'cinnamon': 'Spices & Seasonings',
    'nutmeg': 'Spices & Seasonings',
    'oregano': 'Spices & Seasonings',
    'bay leaf': 'Spices & Seasonings',
    'bay leaves': 'Spices & Seasonings',
    'red pepper': 'Spices & Seasonings',
    'crushed red pepper': 'Spices & Seasonings',
    'garlic powder': 'Spices & Seasonings',
    'onion powder': 'Spices & Seasonings',
    // Canned & Jarred
    'tomato sauce': 'Canned & Jarred',
    'crushed tomatoes': 'Canned & Jarred',
    'diced tomatoes': 'Canned & Jarred',
    'tomato paste': 'Canned & Jarred',
    'coconut milk': 'Canned & Jarred',
    'chicken broth': 'Canned & Jarred',
    'beef broth': 'Canned & Jarred',
    'vegetable broth': 'Canned & Jarred',
    'stock': 'Canned & Jarred',
    'broth': 'Canned & Jarred',
};
// Custom user-defined categories (persisted)
let CUSTOM_CATEGORIES = {};
// Available category options
exports.AVAILABLE_CATEGORIES = [
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
function categorizeIngredient(ingredientName) {
    const normalized = ingredientName.toLowerCase().trim();
    // Check custom categories first
    if (CUSTOM_CATEGORIES[normalized]) {
        return CUSTOM_CATEGORIES[normalized];
    }
    // Check for exact match in default categories
    if (INGREDIENT_CATEGORIES[normalized]) {
        return INGREDIENT_CATEGORIES[normalized];
    }
    // Check if ingredient name contains any category keyword
    for (const [keyword, category] of Object.entries(INGREDIENT_CATEGORIES)) {
        if (normalized.includes(keyword)) {
            return category;
        }
    }
    // Default category
    return 'Other';
}
class GroceryListService {
    constructor(recipeService) {
        this.recipeService = recipeService;
    }
    /**
     * Generate a consolidated grocery list from multiple recipe IDs
     * Combines ingredients with matching names and units, and categorizes them
     */
    generateGroceryList(recipeIds) {
        const ingredientMap = new Map();
        // Iterate through each recipe
        for (const recipeId of recipeIds) {
            const recipe = this.recipeService.read(recipeId);
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
                    const existing = ingredientMap.get(key);
                    existing.quantity += ingredient.quantity;
                }
                else {
                    // New ingredient - add to map with category
                    ingredientMap.set(key, {
                        name: normalizedName,
                        quantity: ingredient.quantity,
                        unit: normalizedUnit,
                        category: categorizeIngredient(normalizedName),
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
    getUncategorizedIngredients() {
        const recipes = this.recipeService.list();
        const uncategorized = new Set();
        recipes.forEach(recipe => {
            recipe.ingredients.forEach(ingredient => {
                const normalized = ingredient.name.toLowerCase().trim();
                if (categorizeIngredient(normalized) === 'Other') {
                    uncategorized.add(normalized);
                }
            });
        });
        return Array.from(uncategorized).sort();
    }
    /**
     * Update the category for a specific ingredient
     */
    updateIngredientCategory(ingredientName, category) {
        const normalized = ingredientName.toLowerCase().trim();
        if (!exports.AVAILABLE_CATEGORIES.includes(category)) {
            throw new Error(`Invalid category: ${category}`);
        }
        CUSTOM_CATEGORIES[normalized] = category;
    }
    /**
     * Get all available categories
     */
    getAvailableCategories() {
        return exports.AVAILABLE_CATEGORIES;
    }
    /**
     * Get the category for a specific ingredient
     */
    getIngredientCategory(ingredientName) {
        return categorizeIngredient(ingredientName);
    }
}
exports.GroceryListService = GroceryListService;
