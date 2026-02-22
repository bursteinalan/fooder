import { useState, useEffect } from 'react';
import { apiService } from '../services/api.service';
import type { Ingredient, CreateRecipeDto, Recipe } from '../types/recipe.types';
import './RecipeForm.css';

interface RecipeFormProps {
  recipe?: Recipe;
  onSuccess?: () => void;
  onCancel?: () => void;
}

// Standard units for consistency
const STANDARD_UNITS = [
  'tsp',
  'tbsp',
  'cup',
  'pint',
  'oz',
  'lb',
  'g',
  'kg',
  'ml',
  'l',
  'clove',
  'piece',
  'whole',
  'can',
  'bunch',
  'pinch',
  'dash',
  'to taste'
];

export function RecipeForm({ recipe, onSuccess, onCancel }: RecipeFormProps) {
  const [title, setTitle] = useState('');
  const [instructions, setInstructions] = useState('');
  const [sourceUrl, setSourceUrl] = useState('');
  const [ingredients, setIngredients] = useState<Ingredient[]>([
    { name: '', quantity: 0, unit: '' }
  ]);
  const [ingredientNames, setIngredientNames] = useState<string[]>([]);
  const [ingredientCategories, setIngredientCategories] = useState<{ [key: string]: string }>({});
  const [availableCategories, setAvailableCategories] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingFromUrl, setIsLoadingFromUrl] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const isEditMode = !!recipe;

  // Load ingredient names and categories for autocomplete
  useEffect(() => {
    const loadData = async () => {
      try {
        const [names, categoriesData] = await Promise.all([
          apiService.getIngredientNames(),
          apiService.getAvailableCategories()
        ]);
        setIngredientNames(names);
        setAvailableCategories(categoriesData.categories);
      } catch (error) {
        console.error('Failed to load data:', error);
      }
    };
    loadData();
  }, []);

  // Load recipe data when in edit mode
  useEffect(() => {
    if (recipe) {
      setTitle(recipe.title);
      setInstructions(recipe.instructions);
      setSourceUrl(recipe.sourceUrl || '');
      const recipeIngredients = recipe.ingredients.length > 0 ? recipe.ingredients : [{ name: '', quantity: 0, unit: '' }];
      setIngredients(recipeIngredients);
      
      // Load categories for all existing ingredients
      recipeIngredients.forEach((ingredient, index) => {
        if (ingredient.name.trim()) {
          loadIngredientCategory(ingredient.name.trim(), index);
        }
      });
    }
  }, [recipe]);

  const addIngredient = () => {
    setIngredients([...ingredients, { name: '', quantity: 0, unit: '' }]);
  };

  const removeIngredient = (index: number) => {
    if (ingredients.length > 1) {
      setIngredients(ingredients.filter((_, i) => i !== index));
    }
  };

  const updateIngredient = (index: number, field: keyof Ingredient, value: string | number) => {
    const updated = [...ingredients];
    updated[index] = { ...updated[index], [field]: value };
    setIngredients(updated);

    // Load category when ingredient name changes
    if (field === 'name' && typeof value === 'string' && value.trim()) {
      loadIngredientCategory(value.trim(), index);
    }
  };

  const loadIngredientCategory = async (ingredientName: string, index: number) => {
    try {
      const result = await apiService.getIngredientCategory(ingredientName);
      setIngredientCategories(prev => ({
        ...prev,
        [index]: result.category
      }));
    } catch (error) {
      console.error('Failed to load category:', error);
    }
  };

  const updateIngredientCategory = async (index: number, category: string) => {
    const ingredientName = ingredients[index].name.trim();
    if (!ingredientName) return;

    try {
      await apiService.updateIngredientCategory(ingredientName, category);
      setIngredientCategories(prev => ({
        ...prev,
        [index]: category
      }));
    } catch (error) {
      console.error('Failed to update category:', error);
    }
  };

  const validateForm = (): string | null => {
    if (!title.trim()) {
      return 'Recipe title is required';
    }

    const validIngredients = ingredients.filter(
      ing => ing.name.trim() && ing.quantity > 0 && ing.unit.trim()
    );

    if (validIngredients.length === 0) {
      return 'At least one complete ingredient is required';
    }

    return null;
  };

  const handleLoadFromUrl = async () => {
    if (!sourceUrl.trim()) {
      setMessage({ type: 'error', text: 'Please enter a source URL first' });
      return;
    }

    setIsLoadingFromUrl(true);
    setMessage(null);

    try {
      const scrapedRecipe = await apiService.scrapeRecipe(sourceUrl.trim());
      
      // Clean up ingredient names (remove price info and extra text)
      const cleanedIngredients = scrapedRecipe.ingredients.map(ing => ({
        ...ing,
        name: ing.name.replace(/\s*\([^)]*\)\s*/g, '').trim() // Remove text in parentheses
      }));

      setTitle(scrapedRecipe.title);
      setInstructions(scrapedRecipe.instructions);
      setIngredients(cleanedIngredients.length > 0 ? cleanedIngredients : [{ name: '', quantity: 0, unit: '' }]);
      setMessage({ type: 'success', text: 'Recipe loaded! Review and adjust as needed.' });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to load recipe from URL';
      setMessage({ type: 'error', text: errorMessage });
    } finally {
      setIsLoadingFromUrl(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);

    const validationError = validateForm();
    if (validationError) {
      setMessage({ type: 'error', text: validationError });
      return;
    }

    const validIngredients = ingredients.filter(
      ing => ing.name.trim() && ing.quantity > 0 && ing.unit.trim()
    );

    const recipeData: CreateRecipeDto = {
      title: title.trim(),
      ingredients: validIngredients,
      instructions: instructions.trim(),
      sourceUrl: sourceUrl.trim() || undefined
    };

    setIsSubmitting(true);

    try {
      if (isEditMode && recipe) {
        await apiService.updateRecipe(recipe.id, recipeData);
        setMessage({ type: 'success', text: 'Recipe updated successfully!' });
      } else {
        await apiService.createRecipe(recipeData);
        setMessage({ type: 'success', text: 'Recipe created successfully!' });
      }
      
      if (onSuccess) {
        setTimeout(() => onSuccess(), 1500);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : `Failed to ${isEditMode ? 'update' : 'create'} recipe`;
      setMessage({ type: 'error', text: errorMessage });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="recipe-form-container">
      <h2>{isEditMode ? 'Edit Recipe' : 'Add New Recipe'}</h2>
      
      {message && (
        <div className={`message message-${message.type}`}>
          {message.text}
        </div>
      )}

      <form onSubmit={handleSubmit} className="recipe-form">
        <div className="form-group">
          <label htmlFor="title">Recipe Title *</label>
          <input
            id="title"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Enter recipe title"
            disabled={isSubmitting}
          />
        </div>

        <div className="form-group">
          <label>Ingredients *</label>
          <div className="ingredients-list">
            {ingredients.map((ingredient, index) => (
              <div key={index} className="ingredient-row-container">
                <div className="ingredient-row">
                  <input
                    type="text"
                    placeholder="Name"
                    value={ingredient.name}
                    onChange={(e) => updateIngredient(index, 'name', e.target.value)}
                    disabled={isSubmitting}
                    list={`ingredient-names-${index}`}
                    autoComplete="off"
                  />
                  <datalist id={`ingredient-names-${index}`}>
                    {ingredientNames.map((name) => (
                      <option key={name} value={name} />
                    ))}
                  </datalist>
                  <input
                    type="number"
                    placeholder="Quantity"
                    value={ingredient.quantity || ''}
                    onChange={(e) => updateIngredient(index, 'quantity', parseFloat(e.target.value) || 0)}
                    min="0"
                    step="0.001"
                    disabled={isSubmitting}
                  />
                  <select
                    value={ingredient.unit}
                    onChange={(e) => updateIngredient(index, 'unit', e.target.value)}
                    disabled={isSubmitting}
                    className="unit-select"
                  >
                    <option value="">Select unit</option>
                    {STANDARD_UNITS.map((unit) => (
                      <option key={unit} value={unit}>
                        {unit}
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={() => removeIngredient(index)}
                    disabled={ingredients.length === 1 || isSubmitting}
                    className="btn-remove"
                    aria-label="Remove ingredient"
                  >
                    ×
                  </button>
                </div>
                {ingredient.name.trim() && ingredientCategories[index] && (
                  <div className="ingredient-category">
                    <label>Category:</label>
                    <select
                      value={ingredientCategories[index] || ''}
                      onChange={(e) => updateIngredientCategory(index, e.target.value)}
                      disabled={isSubmitting}
                      className="category-select-small"
                    >
                      {availableCategories.map((cat) => (
                        <option key={cat} value={cat}>
                          {cat}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>
            ))}
          </div>
          <button
            type="button"
            onClick={addIngredient}
            disabled={isSubmitting}
            className="btn-add"
          >
            + Add Ingredient
          </button>
        </div>

        <div className="form-group">
          <label htmlFor="instructions">Instructions</label>
          <textarea
            id="instructions"
            value={instructions}
            onChange={(e) => setInstructions(e.target.value)}
            placeholder="Enter cooking instructions"
            rows={6}
            disabled={isSubmitting}
          />
        </div>

        <div className="form-group">
          <label htmlFor="sourceUrl">Source URL (optional)</label>
          <div className="url-input-group">
            <input
              id="sourceUrl"
              type="url"
              value={sourceUrl}
              onChange={(e) => setSourceUrl(e.target.value)}
              placeholder="https://example.com/recipe"
              disabled={isSubmitting || isLoadingFromUrl}
            />
            <button
              type="button"
              onClick={handleLoadFromUrl}
              disabled={isSubmitting || isLoadingFromUrl || !sourceUrl.trim()}
              className="btn-load-url"
            >
              {isLoadingFromUrl ? 'Loading...' : 'Load from URL'}
            </button>
          </div>
          <small className="form-hint">
            Paste a recipe URL and click "Load from URL" to auto-fill the form
          </small>
        </div>

        <div className="form-actions">
          <button
            type="submit"
            disabled={isSubmitting}
            className="btn-primary"
          >
            {isSubmitting ? (isEditMode ? 'Updating...' : 'Creating...') : (isEditMode ? 'Update Recipe' : 'Create Recipe')}
          </button>
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              disabled={isSubmitting}
              className="btn-secondary"
            >
              Cancel
            </button>
          )}
        </div>
      </form>
    </div>
  );
}
