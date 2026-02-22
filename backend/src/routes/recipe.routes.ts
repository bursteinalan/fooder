import { Router, Response } from 'express';
import { RecipeService } from '../services/recipe.service';
import { validateCreateRecipe, validateUpdateRecipe } from '../middleware/validation.middleware';
import { AuthRequest } from '../middleware/auth.middleware';

export function createRecipeRouter(recipeService: RecipeService): Router {
  const router = Router();

  /**
   * GET /api/recipes - Retrieve all recipes
   */
  router.get('/', async (req: AuthRequest, res: Response) => {
    try {
      const userId = req.userId!;
      const recipes = await recipeService.list(userId);
      res.json(recipes);
    } catch (error) {
      res.status(500).json({ 
        error: 'Failed to retrieve recipes', 
        message: error instanceof Error ? error.message : 'Unknown error' 
      });
    }
  });

  /**
   * GET /api/recipes/ingredients/names - Get all unique ingredient names
   */
  router.get('/ingredients/names', async (req: AuthRequest, res: Response) => {
    try {
      const userId = req.userId!;
      const ingredientNames = await recipeService.getUniqueIngredientNames(userId);
      res.json(ingredientNames);
    } catch (error) {
      res.status(500).json({ 
        error: 'Failed to retrieve ingredient names', 
        message: error instanceof Error ? error.message : 'Unknown error' 
      });
    }
  });

  /**
   * POST /api/recipes/scrape - Scrape recipe from URL
   */
  router.post('/scrape', async (req: AuthRequest, res: Response) => {
    try {
      const { url } = req.body;
      
      if (!url || typeof url !== 'string') {
        res.status(400).json({ error: 'URL is required' });
        return;
      }

      // Validate URL format
      try {
        new URL(url);
      } catch {
        res.status(400).json({ error: 'Invalid URL format' });
        return;
      }

      const { RecipeScraperService } = await import('../services/recipe-scraper.service');
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
    } catch (error) {
      res.status(500).json({ 
        error: 'Failed to scrape recipe', 
        message: error instanceof Error ? error.message : 'Unknown error' 
      });
    }
  });

  /**
   * GET /api/recipes/:id - Retrieve a specific recipe
   */
  router.get('/:id', async (req: AuthRequest, res: Response) => {
    try {
      const userId = req.userId!;
      const id = req.params.id as string;
      const recipe = await recipeService.read(userId, id);
      
      if (!recipe) {
        res.status(404).json({ error: 'Recipe not found' });
        return;
      }
      
      res.json(recipe);
    } catch (error) {
      res.status(500).json({ 
        error: 'Failed to retrieve recipe', 
        message: error instanceof Error ? error.message : 'Unknown error' 
      });
    }
  });

  /**
   * POST /api/recipes - Create a new recipe
   */
  router.post('/', validateCreateRecipe, async (req: AuthRequest, res: Response) => {
    try {
      const userId = req.userId!;
      const recipe = await recipeService.create(userId, req.body);
      res.status(201).json(recipe);
    } catch (error) {
      res.status(500).json({ 
        error: 'Failed to create recipe', 
        message: error instanceof Error ? error.message : 'Unknown error' 
      });
    }
  });

  /**
   * PUT /api/recipes/:id - Update a recipe
   */
  router.put('/:id', validateUpdateRecipe, async (req: AuthRequest, res: Response) => {
    try {
      const userId = req.userId!;
      const id = req.params.id as string;
      const recipe = await recipeService.update(userId, id, req.body);
      
      if (!recipe) {
        res.status(404).json({ error: 'Recipe not found' });
        return;
      }
      
      res.json(recipe);
    } catch (error) {
      res.status(500).json({ 
        error: 'Failed to update recipe', 
        message: error instanceof Error ? error.message : 'Unknown error' 
      });
    }
  });

  /**
   * DELETE /api/recipes/:id - Delete a recipe
   */
  router.delete('/:id', async (req: AuthRequest, res: Response) => {
    try {
      const userId = req.userId!;
      const id = req.params.id as string;
      const deleted = await recipeService.delete(userId, id);
      
      if (!deleted) {
        res.status(404).json({ error: 'Recipe not found' });
        return;
      }
      
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ 
        error: 'Failed to delete recipe', 
        message: error instanceof Error ? error.message : 'Unknown error' 
      });
    }
  });

  return router;
}
