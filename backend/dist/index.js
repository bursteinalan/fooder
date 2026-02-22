"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const storage_service_1 = require("./storage/storage.service");
const recipe_service_1 = require("./services/recipe.service");
const grocery_list_service_1 = require("./services/grocery-list.service");
const recipe_routes_1 = require("./routes/recipe.routes");
const grocery_list_routes_1 = require("./routes/grocery-list.routes");
const app = (0, express_1.default)();
const PORT = process.env.PORT || 3000;
// Middleware
app.use((0, cors_1.default)({
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    credentials: true,
}));
app.use(express_1.default.json());
// Initialize services
const storageService = new storage_service_1.StorageService();
const recipeService = new recipe_service_1.RecipeService(storageService);
const groceryListService = new grocery_list_service_1.GroceryListService(recipeService);
// Routes
app.use('/api/recipes', (0, recipe_routes_1.createRecipeRouter)(recipeService));
app.use('/api/grocery-list', (0, grocery_list_routes_1.createGroceryListRouter)(groceryListService));
// Health check endpoint
app.get('/health', (req, res) => {
    res.json({ status: 'ok' });
});
// Start server
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
