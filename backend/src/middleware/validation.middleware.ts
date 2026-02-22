import { Request, Response, NextFunction } from 'express';
import { CreateRecipeDto, UpdateRecipeDto, Ingredient } from '../models/recipe.model';

/**
 * Validate URL format (optional)
 */
function isValidUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

/**
 * Validate ingredient structure
 */
function isValidIngredient(ingredient: any): ingredient is Ingredient {
  return (
    ingredient &&
    typeof ingredient === 'object' &&
    typeof ingredient.name === 'string' &&
    ingredient.name.trim().length > 0 &&
    typeof ingredient.quantity === 'number' &&
    ingredient.quantity > 0 &&
    typeof ingredient.unit === 'string' &&
    ingredient.unit.trim().length > 0
  );
}

/**
 * Validate create recipe request
 */
export function validateCreateRecipe(req: Request, res: Response, next: NextFunction): void {
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
export function validateUpdateRecipe(req: Request, res: Response, next: NextFunction): void {
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
