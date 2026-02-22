import express from 'express';
import cors from 'cors';
import path from 'path';
import { createStorageService } from './storage/storage-factory';
import { StorageService } from './storage/storage.service';
import { RecipeService } from './services/recipe.service';
import { GroceryListService } from './services/grocery-list.service';
import { AuthService } from './services/auth.service';
import { MigrationService } from './services/migration.service';
import { createAuthMiddleware } from './middleware/auth.middleware';
import { createRecipeRouter } from './routes/recipe.routes';
import { createGroceryListRouter } from './routes/grocery-list.routes';
import { createAuthRouter } from './routes/auth.routes';

const app = express();
const PORT = parseInt(process.env.PORT || '3000', 10);

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || '*',
  credentials: true,
}));
app.use(express.json());

// Run migration and start server
async function startServer() {
  try {
    // Initialize storage (Firestore or file-based)
    const storageService = createStorageService();
    
    // Run migration only for file-based storage
    if (storageService instanceof StorageService) {
      const migrationService = new MigrationService(storageService);
      
      if (migrationService.needsMigration()) {
        console.log('Migration needed. Running migration...');
        await migrationService.migrate();
        console.log('Migration completed successfully.');
      } else {
        console.log('No migration needed. Storage structure is up to date.');
      }
    }

    // Initialize services
    const authService = new AuthService(storageService);
    const recipeService = new RecipeService(storageService);
    const groceryListService = new GroceryListService(recipeService, storageService);

    // Initialize auth middleware
    const authMiddleware = createAuthMiddleware(authService);

    // API Routes
    app.use('/api/auth', createAuthRouter(authService, authMiddleware));
    app.use('/api/recipes', authMiddleware, createRecipeRouter(recipeService));
    app.use('/api/grocery-list', authMiddleware, createGroceryListRouter(groceryListService));

    // Health check endpoint
    app.get('/health', (req, res) => {
      res.json({ status: 'ok' });
    });

    // Serve static files from frontend build (for production)
    const frontendPath = path.join(__dirname, '../../frontend/dist');
    console.log('Frontend path:', frontendPath);
    console.log('Frontend path exists:', require('fs').existsSync(frontendPath));
    
    app.use(express.static(frontendPath));

    // Serve index.html for all other routes (SPA support)
    // Use a wildcard that works with Express 5
    app.get('/*', (req, res) => {
      const indexPath = path.join(frontendPath, 'index.html');
      if (require('fs').existsSync(indexPath)) {
        res.sendFile(indexPath);
      } else {
        res.status(404).send('Frontend not found');
      }
    });

    // Start server
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`Server is running on port ${PORT}`);
      console.log(`Environment: ${process.env.NODE_ENV}`);
      console.log(`Using Firestore: ${process.env.USE_FIRESTORE}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error instanceof Error ? error.message : 'Unknown error');
    process.exit(1);
  }
}

startServer();
