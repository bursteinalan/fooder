import { Router, Request, Response, NextFunction } from 'express';
import { SavedGroceryListService } from '../services/saved-grocery-list.service';
import { AuthRequest } from '../middleware/auth.middleware';
import {
  CreateSavedGroceryListDto,
  UpdateSavedGroceryListDto,
  AddItemDto,
} from '../models/saved-grocery-list.model';

/**
 * Create saved grocery list router
 * Requirements: 1.2, 2.1
 */
export function createSavedGroceryListRouter(
  savedGroceryListService: SavedGroceryListService,
  authMiddleware: any
): Router {
  const router = Router();

  // Apply authentication middleware to all routes
  router.use(authMiddleware);

  /**
   * Validation middleware for create saved list request
   */
  function validateCreateSavedList(req: Request, res: Response, next: NextFunction): void {
    const { name, items, recipeIds } = req.body;

    // Validate name
    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      res.status(400).json({
        error: 'Validation Error',
        message: 'Name is required and must be a non-empty string',
      });
      return;
    }

    if (name.length > 100) {
      res.status(400).json({
        error: 'Validation Error',
        message: 'Name must not exceed 100 characters',
      });
      return;
    }

    // Validate items
    if (!Array.isArray(items)) {
      res.status(400).json({
        error: 'Validation Error',
        message: 'Items must be an array',
      });
      return;
    }

    // Validate each item
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      if (!item || typeof item !== 'object') {
        res.status(400).json({
          error: 'Validation Error',
          message: `Item at index ${i} must be an object`,
        });
        return;
      }

      if (!item.name || typeof item.name !== 'string' || item.name.trim().length === 0) {
        res.status(400).json({
          error: 'Validation Error',
          message: `Item at index ${i}: name is required and must be a non-empty string`,
        });
        return;
      }

      if (item.name.length > 200) {
        res.status(400).json({
          error: 'Validation Error',
          message: `Item at index ${i}: name must not exceed 200 characters`,
        });
        return;
      }

      if (typeof item.quantity !== 'number' || item.quantity <= 0) {
        res.status(400).json({
          error: 'Validation Error',
          message: `Item at index ${i}: quantity must be a positive number`,
        });
        return;
      }

      if (!item.unit || typeof item.unit !== 'string' || item.unit.trim().length === 0) {
        res.status(400).json({
          error: 'Validation Error',
          message: `Item at index ${i}: unit is required and must be a non-empty string`,
        });
        return;
      }

      if (item.unit.length > 50) {
        res.status(400).json({
          error: 'Validation Error',
          message: `Item at index ${i}: unit must not exceed 50 characters`,
        });
        return;
      }

      if (!item.category || typeof item.category !== 'string' || item.category.trim().length === 0) {
        res.status(400).json({
          error: 'Validation Error',
          message: `Item at index ${i}: category is required and must be a non-empty string`,
        });
        return;
      }
    }

    // Validate recipeIds
    if (!Array.isArray(recipeIds)) {
      res.status(400).json({
        error: 'Validation Error',
        message: 'RecipeIds must be an array',
      });
      return;
    }

    for (let i = 0; i < recipeIds.length; i++) {
      if (typeof recipeIds[i] !== 'string') {
        res.status(400).json({
          error: 'Validation Error',
          message: `RecipeId at index ${i} must be a string`,
        });
        return;
      }
    }

    next();
  }

  /**
   * POST /api/saved-lists - Create a new saved grocery list
   * Requirements: 1.2, 1.3
   */
  router.post('/', validateCreateSavedList, async (req: AuthRequest, res: Response) => {
    try {
      const userId = req.userId;

      if (!userId) {
        res.status(401).json({
          error: 'Unauthorized',
          message: 'User ID not found in request',
        });
        return;
      }

      const dto: CreateSavedGroceryListDto = req.body;

      const savedList = await savedGroceryListService.create(userId, dto);

      res.status(201).json(savedList);
    } catch (error) {
      console.error('Create saved list error:', error);
      res.status(500).json({
        error: 'Internal Server Error',
        message: error instanceof Error ? error.message : 'Failed to create saved list',
      });
    }
  });

  /**
   * GET /api/saved-lists - Get all saved grocery lists for the user
   * Requirements: 2.1, 2.2, 2.3
   */
  router.get('/', async (req: AuthRequest, res: Response) => {
    try {
      const userId = req.userId;

      if (!userId) {
        res.status(401).json({
          error: 'Unauthorized',
          message: 'User ID not found in request',
        });
        return;
      }

      const lists = await savedGroceryListService.list(userId);

      res.json(lists);
    } catch (error) {
      console.error('List saved lists error:', error);
      res.status(500).json({
        error: 'Internal Server Error',
        message: error instanceof Error ? error.message : 'Failed to retrieve saved lists',
      });
    }
  });

  /**
   * GET /api/saved-lists/:id - Get a specific saved grocery list
   * Requirements: 2.4, 3.1
   */
  router.get('/:id', async (req: AuthRequest, res: Response) => {
    try {
      const userId = req.userId;
      const listId = String(req.params.id);

      if (!userId) {
        res.status(401).json({
          error: 'Unauthorized',
          message: 'User ID not found in request',
        });
        return;
      }

      const list = await savedGroceryListService.getById(userId, listId);

      if (!list) {
        res.status(404).json({
          error: 'Not Found',
          message: 'Saved list not found',
        });
        return;
      }

      res.json(list);
    } catch (error) {
      console.error('Get saved list error:', error);
      res.status(500).json({
        error: 'Internal Server Error',
        message: error instanceof Error ? error.message : 'Failed to retrieve saved list',
      });
    }
  });

  /**
   * Validation middleware for update saved list request
   */
  function validateUpdateSavedList(req: Request, res: Response, next: NextFunction): void {
    const { name } = req.body;

    // At least name must be provided
    if (name === undefined) {
      res.status(400).json({
        error: 'Validation Error',
        message: 'Name field must be provided',
      });
      return;
    }

    // Validate name if provided
    if (typeof name !== 'string' || name.trim().length === 0) {
      res.status(400).json({
        error: 'Validation Error',
        message: 'Name must be a non-empty string',
      });
      return;
    }

    if (name.length > 100) {
      res.status(400).json({
        error: 'Validation Error',
        message: 'Name must not exceed 100 characters',
      });
      return;
    }

    next();
  }

  /**
   * PUT /api/saved-lists/:id - Update a saved grocery list (rename)
   * Requirements: 7.2, 7.3
   */
  router.put('/:id', validateUpdateSavedList, async (req: AuthRequest, res: Response) => {
    try {
      const userId = req.userId;
      const listId = String(req.params.id);

      if (!userId) {
        res.status(401).json({
          error: 'Unauthorized',
          message: 'User ID not found in request',
        });
        return;
      }

      const dto: UpdateSavedGroceryListDto = req.body;

      const updatedList = await savedGroceryListService.update(userId, listId, dto);

      if (!updatedList) {
        res.status(404).json({
          error: 'Not Found',
          message: 'Saved list not found',
        });
        return;
      }

      res.json(updatedList);
    } catch (error) {
      console.error('Update saved list error:', error);
      res.status(500).json({
        error: 'Internal Server Error',
        message: error instanceof Error ? error.message : 'Failed to update saved list',
      });
    }
  });

  /**
   * DELETE /api/saved-lists/:id - Delete a saved grocery list
   * Requirements: 5.2, 5.3
   */
  router.delete('/:id', async (req: AuthRequest, res: Response) => {
    try {
      const userId = req.userId;
      const listId = String(req.params.id);

      if (!userId) {
        res.status(401).json({
          error: 'Unauthorized',
          message: 'User ID not found in request',
        });
        return;
      }

      const deleted = await savedGroceryListService.delete(userId, listId);

      if (!deleted) {
        res.status(404).json({
          error: 'Not Found',
          message: 'Saved list not found',
        });
        return;
      }

      res.status(204).send();
    } catch (error) {
      console.error('Delete saved list error:', error);
      res.status(500).json({
        error: 'Internal Server Error',
        message: error instanceof Error ? error.message : 'Failed to delete saved list',
      });
    }
  });

  /**
   * PATCH /api/saved-lists/:id/items/:itemId/check - Toggle item checked state
   * Requirements: 3.2, 3.3, 8.1
   */
  router.patch('/:id/items/:itemId/check', async (req: AuthRequest, res: Response) => {
    try {
      const userId = req.userId;
      const listId = String(req.params.id);
      const itemId = String(req.params.itemId);

      if (!userId) {
        res.status(401).json({
          error: 'Unauthorized',
          message: 'User ID not found in request',
        });
        return;
      }

      const updatedList = await savedGroceryListService.toggleItemChecked(userId, listId, itemId);

      if (!updatedList) {
        res.status(404).json({
          error: 'Not Found',
          message: 'Saved list or item not found',
        });
        return;
      }

      res.json(updatedList);
    } catch (error) {
      console.error('Toggle item checked error:', error);
      res.status(500).json({
        error: 'Internal Server Error',
        message: error instanceof Error ? error.message : 'Failed to toggle item checked state',
      });
    }
  });

  /**
   * Validation middleware for add item request
   */
  function validateAddItem(req: Request, res: Response, next: NextFunction): void {
    const { name, quantity, unit, category } = req.body;

    // Validate name
    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      res.status(400).json({
        error: 'Validation Error',
        message: 'Name is required and must be a non-empty string',
      });
      return;
    }

    if (name.length > 200) {
      res.status(400).json({
        error: 'Validation Error',
        message: 'Name must not exceed 200 characters',
      });
      return;
    }

    // Validate quantity
    if (typeof quantity !== 'number' || quantity <= 0) {
      res.status(400).json({
        error: 'Validation Error',
        message: 'Quantity must be a positive number',
      });
      return;
    }

    // Validate unit
    if (!unit || typeof unit !== 'string' || unit.trim().length === 0) {
      res.status(400).json({
        error: 'Validation Error',
        message: 'Unit is required and must be a non-empty string',
      });
      return;
    }

    if (unit.length > 50) {
      res.status(400).json({
        error: 'Validation Error',
        message: 'Unit must not exceed 50 characters',
      });
      return;
    }

    // Validate category
    if (!category || typeof category !== 'string' || category.trim().length === 0) {
      res.status(400).json({
        error: 'Validation Error',
        message: 'Category is required and must be a non-empty string',
      });
      return;
    }

    next();
  }

  /**
   * POST /api/saved-lists/:id/items - Add a new item to a saved list
   * Requirements: 4.1, 4.2
   */
  router.post('/:id/items', validateAddItem, async (req: AuthRequest, res: Response) => {
    try {
      const userId = req.userId;
      const listId = String(req.params.id);

      if (!userId) {
        res.status(401).json({
          error: 'Unauthorized',
          message: 'User ID not found in request',
        });
        return;
      }

      const dto: AddItemDto = req.body;

      const updatedList = await savedGroceryListService.addItem(userId, listId, dto);

      if (!updatedList) {
        res.status(404).json({
          error: 'Not Found',
          message: 'Saved list not found',
        });
        return;
      }

      res.json(updatedList);
    } catch (error) {
      console.error('Add item error:', error);
      res.status(500).json({
        error: 'Internal Server Error',
        message: error instanceof Error ? error.message : 'Failed to add item',
      });
    }
  });

  /**
   * DELETE /api/saved-lists/:id/items/:itemId - Remove an item from a saved list
   * Requirements: 4.3, 4.4
   */
  router.delete('/:id/items/:itemId', async (req: AuthRequest, res: Response) => {
    try {
      const userId = req.userId;
      const listId = String(req.params.id);
      const itemId = String(req.params.itemId);

      if (!userId) {
        res.status(401).json({
          error: 'Unauthorized',
          message: 'User ID not found in request',
        });
        return;
      }

      const updatedList = await savedGroceryListService.removeItem(userId, listId, itemId);

      if (!updatedList) {
        res.status(404).json({
          error: 'Not Found',
          message: 'Saved list or item not found',
        });
        return;
      }

      res.json(updatedList);
    } catch (error) {
      console.error('Remove item error:', error);
      res.status(500).json({
        error: 'Internal Server Error',
        message: error instanceof Error ? error.message : 'Failed to remove item',
      });
    }
  });

  return router;
}
