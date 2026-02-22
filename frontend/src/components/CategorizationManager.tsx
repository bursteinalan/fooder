import { useState, useEffect } from 'react';
import { apiService } from '../services/api.service';
import './CategorizationManager.css';

export function CategorizationManager() {
  const [uncategorizedIngredients, setUncategorizedIngredients] = useState<string[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [uncategorizedData, categoriesData] = await Promise.all([
        apiService.getUncategorizedIngredients(),
        apiService.getAvailableCategories()
      ]);
      
      setUncategorizedIngredients(uncategorizedData.ingredients);
      setCategories(categoriesData.categories);
      setCurrentIndex(0);
      setSelectedCategory('');
    } catch (error) {
      setMessage({ 
        type: 'error', 
        text: error instanceof Error ? error.message : 'Failed to load data' 
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCategorize = async () => {
    if (!selectedCategory) {
      setMessage({ type: 'error', text: 'Please select a category' });
      return;
    }

    const currentIngredient = uncategorizedIngredients[currentIndex];
    setIsSaving(true);
    setMessage(null);

    try {
      await apiService.updateIngredientCategory(currentIngredient, selectedCategory);
      
      // Remove the categorized ingredient from the list
      const newIngredients = uncategorizedIngredients.filter((_, i) => i !== currentIndex);
      setUncategorizedIngredients(newIngredients);
      
      // Reset selection and move to next (or stay at same index if it's now the last)
      setSelectedCategory('');
      if (currentIndex >= newIngredients.length && newIngredients.length > 0) {
        setCurrentIndex(newIngredients.length - 1);
      }
      
      setMessage({ type: 'success', text: `Categorized "${currentIngredient}" as ${selectedCategory}` });
      setTimeout(() => setMessage(null), 2000);
    } catch (error) {
      setMessage({ 
        type: 'error', 
        text: error instanceof Error ? error.message : 'Failed to categorize ingredient' 
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleSkip = () => {
    setSelectedCategory('');
    if (currentIndex < uncategorizedIngredients.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      setCurrentIndex(0);
    }
  };

  const handlePrevious = () => {
    setSelectedCategory('');
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    } else {
      setCurrentIndex(uncategorizedIngredients.length - 1);
    }
  };

  if (isLoading) {
    return (
      <div className="categorization-container">
        <div className="loading">Loading uncategorized ingredients...</div>
      </div>
    );
  }

  if (uncategorizedIngredients.length === 0) {
    return (
      <div className="categorization-container">
        <div className="empty-state">
          <h2>🎉 All ingredients are categorized!</h2>
          <p>You don't have any uncategorized ingredients at the moment.</p>
          <p>As you add new recipes, any new ingredients will appear here for categorization.</p>
        </div>
      </div>
    );
  }

  const currentIngredient = uncategorizedIngredients[currentIndex];

  return (
    <div className="categorization-container">
      <div className="categorization-header">
        <h2>Categorize Ingredients</h2>
        <p className="progress-text">
          {currentIndex + 1} of {uncategorizedIngredients.length} uncategorized ingredients
        </p>
      </div>

      {message && (
        <div className={`message message-${message.type}`}>
          {message.text}
        </div>
      )}

      <div className="categorization-card">
        <div className="ingredient-display">
          <label>Ingredient:</label>
          <h3>{currentIngredient}</h3>
        </div>

        <div className="category-selection">
          <label htmlFor="category-select">Select Category:</label>
          <select
            id="category-select"
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            disabled={isSaving}
            className="category-select"
          >
            <option value="">-- Choose a category --</option>
            {categories.map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>
        </div>

        <div className="categorization-actions">
          <button
            onClick={handlePrevious}
            disabled={isSaving}
            className="btn-secondary"
          >
            ← Previous
          </button>
          <button
            onClick={handleSkip}
            disabled={isSaving}
            className="btn-secondary"
          >
            Skip
          </button>
          <button
            onClick={handleCategorize}
            disabled={isSaving || !selectedCategory}
            className="btn-primary"
          >
            {isSaving ? 'Saving...' : 'Categorize'}
          </button>
        </div>
      </div>

      <div className="remaining-list">
        <h4>Remaining Ingredients:</h4>
        <div className="ingredient-chips">
          {uncategorizedIngredients.map((ingredient, index) => (
            <span
              key={ingredient}
              className={`ingredient-chip ${index === currentIndex ? 'active' : ''}`}
              onClick={() => {
                setCurrentIndex(index);
                setSelectedCategory('');
              }}
            >
              {ingredient}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
