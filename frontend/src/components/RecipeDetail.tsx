import { useState } from 'react';
import type { Recipe } from '../types/recipe.types';
import './RecipeDetail.css';

interface RecipeDetailProps {
  recipe: Recipe;
  onClose: () => void;
  onEdit: (recipe: Recipe) => void;
  onDelete: (recipeId: string) => void;
}

export function RecipeDetail({ recipe, onClose, onEdit, onDelete }: RecipeDetailProps) {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose();
    }
  };

  const handleDeleteClick = () => {
    setShowDeleteConfirm(true);
  };

  const handleConfirmDelete = () => {
    onDelete(recipe.id);
    onClose();
  };

  const handleCancelDelete = () => {
    setShowDeleteConfirm(false);
  };

  return (
    <div
      className="recipe-detail-backdrop"
      onClick={handleBackdropClick}
      onKeyDown={handleKeyDown}
      role="dialog"
      aria-modal="true"
      aria-labelledby="recipe-detail-title"
    >
      <div className="recipe-detail-modal">
        <div className="recipe-detail-header">
          <h2 id="recipe-detail-title">{recipe.title}</h2>
          <button
            onClick={onClose}
            className="btn-close"
            aria-label="Close recipe details"
          >
            ×
          </button>
        </div>

        <div className="recipe-detail-content">
          {recipe.sourceUrl && (
            <section className="recipe-section">
              <h3>Source</h3>
              <a 
                href={recipe.sourceUrl} 
                target="_blank" 
                rel="noopener noreferrer"
                className="source-link"
              >
                {recipe.sourceUrl}
              </a>
            </section>
          )}

          <section className="recipe-section">
            <h3>Ingredients</h3>
            <ul className="ingredients-list">
              {recipe.ingredients.map((ingredient, index) => (
                <li key={index} className="ingredient-item">
                  <span className="ingredient-quantity">{ingredient.quantity}</span>
                  <span className="ingredient-unit">{ingredient.unit}</span>
                  <span className="ingredient-name">{ingredient.name}</span>
                </li>
              ))}
            </ul>
          </section>

          <section className="recipe-section">
            <h3>Instructions</h3>
            <div className="instructions-text">
              {recipe.instructions}
            </div>
          </section>
        </div>

        <div className="recipe-detail-footer">
          {showDeleteConfirm ? (
            <div className="delete-confirmation">
              <p>Are you sure you want to delete "{recipe.title}"?</p>
              <div className="delete-actions">
                <button onClick={handleConfirmDelete} className="btn-delete-confirm">
                  Yes, Delete
                </button>
                <button onClick={handleCancelDelete} className="btn-cancel">
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <>
              <button onClick={handleDeleteClick} className="btn-delete">
                Delete Recipe
              </button>
              <button onClick={() => onEdit(recipe)} className="btn-edit">
                Edit Recipe
              </button>
              <button onClick={onClose} className="btn-back">
                Back to Recipes
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
