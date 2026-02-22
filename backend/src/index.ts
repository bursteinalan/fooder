import express from 'express';
import cors from 'cors';
import { StorageService } from './storage/storage.service';
import { RecipeService } from './services/recipe.service';
import { GroceryListService } from './services/grocery-list.service';
import { AuthService } from './services/auth.service';
import { createAuthMiddleware } from './middleware/auth.middleware';
import { createRecipeRouter } from './routes/recipe.routes';
import { createGroceryListRouter } from './routes/grocery-list.routes';
import { createAuthRouter } from './routes/auth.routes';

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
}));
app.use(express.json());

// Initialize services
const storageService = new StorageService();
const authService = new AuthService(storageService);
const recipeService = new RecipeService(storageService);
const groceryListService = new GroceryListService(recipeService, storageService);

// Initialize auth middleware
const authMiddleware = createAuthMiddleware(authService);

// Routes
app.use('/api/auth', createAuthRouter(authService, authMiddleware));
app.use('/api/recipes', authMiddleware, createRecipeRouter(recipeService));
app.use('/api/grocery-list', authMiddleware, createGroceryListRouter(groceryListService));

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Start server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
