"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const path_1 = __importDefault(require("path"));
const storage_factory_1 = require("./storage/storage-factory");
const storage_service_1 = require("./storage/storage.service");
const recipe_service_1 = require("./services/recipe.service");
const grocery_list_service_1 = require("./services/grocery-list.service");
const auth_service_1 = require("./services/auth.service");
const migration_service_1 = require("./services/migration.service");
const auth_middleware_1 = require("./middleware/auth.middleware");
const recipe_routes_1 = require("./routes/recipe.routes");
const grocery_list_routes_1 = require("./routes/grocery-list.routes");
const auth_routes_1 = require("./routes/auth.routes");
const app = (0, express_1.default)();
const PORT = process.env.PORT || 3000;
// Middleware
app.use((0, cors_1.default)({
    origin: process.env.FRONTEND_URL || '*',
    credentials: true,
}));
app.use(express_1.default.json());
// Run migration and start server
async function startServer() {
    try {
        // Initialize storage (Firestore or file-based)
        const storageService = (0, storage_factory_1.createStorageService)();
        // Run migration only for file-based storage
        if (storageService instanceof storage_service_1.StorageService) {
            const migrationService = new migration_service_1.MigrationService(storageService);
            if (migrationService.needsMigration()) {
                console.log('Migration needed. Running migration...');
                await migrationService.migrate();
                console.log('Migration completed successfully.');
            }
            else {
                console.log('No migration needed. Storage structure is up to date.');
            }
        }
        // Initialize services
        const authService = new auth_service_1.AuthService(storageService);
        const recipeService = new recipe_service_1.RecipeService(storageService);
        const groceryListService = new grocery_list_service_1.GroceryListService(recipeService, storageService);
        // Initialize auth middleware
        const authMiddleware = (0, auth_middleware_1.createAuthMiddleware)(authService);
        // API Routes
        app.use('/api/auth', (0, auth_routes_1.createAuthRouter)(authService, authMiddleware));
        app.use('/api/recipes', authMiddleware, (0, recipe_routes_1.createRecipeRouter)(recipeService));
        app.use('/api/grocery-list', authMiddleware, (0, grocery_list_routes_1.createGroceryListRouter)(groceryListService));
        // Health check endpoint
        app.get('/health', (req, res) => {
            res.json({ status: 'ok' });
        });
        // Serve static files from frontend build (for production)
        const frontendPath = path_1.default.join(__dirname, '../../frontend/dist');
        app.use(express_1.default.static(frontendPath));
        // Serve index.html for all other routes (SPA support)
        app.get('*', (req, res) => {
            res.sendFile(path_1.default.join(frontendPath, 'index.html'));
        });
        // Start server
        app.listen(PORT, () => {
            console.log(`Server is running on http://localhost:${PORT}`);
        });
    }
    catch (error) {
        console.error('Failed to start server:', error instanceof Error ? error.message : 'Unknown error');
        process.exit(1);
    }
}
startServer();
