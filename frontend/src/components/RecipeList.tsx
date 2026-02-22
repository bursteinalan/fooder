import { useState, useEffect } from 'react';
import { apiService } from '../services/api.service';
import type { Recipe } from '../types/recipe.types';
import './RecipeList.css';

interface RecipeListProps {
  selectedRecipes: string[];
  onRecipeSelect: (recipeId: string) => void;
  onRecipeClick: (recipe: Recipe) => void;
}

export function RecipeList({ selectedRecipes, onRecipeSelect, onRecipeClick }: RecipeListProps) {
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [filteredRecipes, setFilteredRecipes] = useState<Recipe[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadRecipes();
  }, []);

  useEffect(() => {
    filterRecipes();
  }, [searchQuery, recipes]);

  const loadRecipes = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await apiService.getAllRecipes();
      setRecipes(data);
      setFilteredRecipes(data);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load recipes';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const filterRecipes = () => {
    if (!searchQuery.trim()) {
      setFilteredRecipes(recipes);
      return;
    }

    const query = searchQuery.toLowerCase();
    const filtered = recipes.filter(recipe => {
      // Search in title
      if (recipe.title.toLowerCase().includes(query)) {
        return true;
      }
      
      // Search in ingredients
      return recipe.ingredients.some(ingredient =>
        ingredient.name.toLowerCase().includes(query)
      );
    });
    setFilteredRecipes(filtered);
  };

  const handleCheckboxChange = (recipeId: string) => {
    onRecipeSelect(recipeId);
  };

  const isRecipeSelected = (recipeId: string): boolean => {
    return selectedRecipes.includes(recipeId);
  };

  if (isLoading) {
    return (
      <div className="recipe-list-container">
        <div className="loading">Loading recipes...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="recipe-list-container">
        <div className="error-message">{error}</div>
        <button onClick={loadRecipes} className="btn-retry">
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="recipe-list-container">
      <div className="recipe-list-header">
        <h2>My Recipes</h2>
        <div className="search-bar">
          <input
            type="text"
            placeholder="Search recipes by title or ingredient..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="search-input"
            aria-label="Search recipes"
          />
        </div>
      </div>

      {filteredRecipes.length === 0 ? (
        <div className="empty-state">
          {searchQuery ? (
            <p>No recipes found matching "{searchQuery}"</p>
          ) : (
            <p>No recipes yet. Add your first recipe to get started!</p>
          )}
        </div>
      ) : (
        <div className="recipes-grid">
          {filteredRecipes.map((recipe) => (
            <div
              key={recipe.id}
              className={`recipe-card ${isRecipeSelected(recipe.id) ? 'selected' : ''}`}
            >
              <div className="recipe-card-header">
                <input
                  type="checkbox"
                  checked={isRecipeSelected(recipe.id)}
                  onChange={() => handleCheckboxChange(recipe.id)}
                  className="recipe-checkbox"
                  aria-label={`Select ${recipe.title}`}
                />
                <h3
                  onClick={() => onRecipeClick(recipe)}
                  className="recipe-title"
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      onRecipeClick(recipe);
                    }
                  }}
                >
                  {recipe.title}
                </h3>
              </div>
              <div className="recipe-card-body">
                <p className="recipe-ingredients-count">
                  {recipe.ingredients.length} ingredient{recipe.ingredients.length !== 1 ? 's' : ''}
                </p>
                <button
                  onClick={() => onRecipeClick(recipe)}
                  className="btn-view-details"
                >
                  View Details
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {selectedRecipes.length > 0 && (
        <div className="selection-summary">
          {selectedRecipes.length} recipe{selectedRecipes.length !== 1 ? 's' : ''} selected
        </div>
      )}
    </div>
  );
}
