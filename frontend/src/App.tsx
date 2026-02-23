import { useState, Component, type ReactNode } from 'react';
import { RecipeList } from './components/RecipeList';
import { RecipeDetail } from './components/RecipeDetail';
import { RecipeForm } from './components/RecipeForm';
import { GroceryList } from './components/GroceryList';
import { CategorizationManager } from './components/CategorizationManager';
import { SavedGroceryLists } from './components/SavedGroceryLists';
import { ShoppingView } from './components/ShoppingView';
import { useAuth } from './contexts/AuthContext';
import { apiService } from './services/api.service';
import type { Recipe } from './types/recipe.types';
import './App.css';

type View = 'list' | 'add' | 'edit' | 'grocery' | 'categorize' | 'saved-lists' | 'shopping';

// Error Boundary Component
interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="error-boundary">
          <h1>Something went wrong</h1>
          <p>{this.state.error?.message || 'An unexpected error occurred'}</p>
          <button onClick={() => window.location.reload()}>
            Reload Application
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

function App() {
  const { user, logout } = useAuth();
  const [currentView, setCurrentView] = useState<View>('list');
  const [selectedRecipes, setSelectedRecipes] = useState<string[]>([]);
  const [selectedRecipeDetail, setSelectedRecipeDetail] = useState<Recipe | null>(null);
  const [recipeToEdit, setRecipeToEdit] = useState<Recipe | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [shoppingListId, setShoppingListId] = useState<string | null>(null);

  const handleRecipeSelect = (recipeId: string) => {
    setSelectedRecipes(prev => {
      if (prev.includes(recipeId)) {
        return prev.filter(id => id !== recipeId);
      } else {
        return [...prev, recipeId];
      }
    });
  };

  const handleRecipeClick = (recipe: Recipe) => {
    setSelectedRecipeDetail(recipe);
  };

  const handleCloseDetail = () => {
    setSelectedRecipeDetail(null);
  };

  const handleEditRecipe = (recipe: Recipe) => {
    setRecipeToEdit(recipe);
    setSelectedRecipeDetail(null);
    setCurrentView('edit');
  };

  const handleDeleteRecipe = async (recipeId: string) => {
    try {
      await apiService.deleteRecipe(recipeId);
      // Remove from selected recipes if it was selected
      setSelectedRecipes(prev => prev.filter(id => id !== recipeId));
      // Trigger refresh of recipe list
      setRefreshKey(prev => prev + 1);
    } catch (error) {
      console.error('Failed to delete recipe:', error);
      alert('Failed to delete recipe. Please try again.');
    }
  };

  const handleFormSuccess = () => {
    setRecipeToEdit(null);
    setCurrentView('list');
    // Trigger refresh of recipe list
    setRefreshKey(prev => prev + 1);
  };

  const handleFormCancel = () => {
    setRecipeToEdit(null);
    setCurrentView('list');
  };

  const navigateToView = (view: View) => {
    setCurrentView(view);
  };

  const handleNavigateToShopping = (listId: string) => {
    setShoppingListId(listId);
    setCurrentView('shopping');
  };

  const handleBackToSavedLists = () => {
    setShoppingListId(null);
    setCurrentView('saved-lists');
  };

  return (
    <ErrorBoundary>
      <div className="app">
        <header className="app-header">
          <h1>Recipe & Grocery Manager</h1>
          <nav className="app-nav">
            <button
              onClick={() => navigateToView('list')}
              className={`nav-button ${currentView === 'list' ? 'active' : ''}`}
            >
              My Recipes
            </button>
            <button
              onClick={() => navigateToView('add')}
              className={`nav-button ${currentView === 'add' ? 'active' : ''}`}
            >
              Add Recipe
            </button>
            <button
              onClick={() => navigateToView('grocery')}
              className={`nav-button ${currentView === 'grocery' ? 'active' : ''}`}
              disabled={selectedRecipes.length === 0}
            >
              Grocery List {selectedRecipes.length > 0 && `(${selectedRecipes.length})`}
            </button>
            <button
              onClick={() => navigateToView('categorize')}
              className={`nav-button ${currentView === 'categorize' ? 'active' : ''}`}
            >
              Categorize
            </button>
            <button
              onClick={() => navigateToView('saved-lists')}
              className={`nav-button ${currentView === 'saved-lists' || currentView === 'shopping' ? 'active' : ''}`}
            >
              Saved Lists
            </button>
            <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <span style={{ color: '#666', fontSize: '0.9rem' }}>{user?.username}</span>
              <button onClick={logout} className="nav-button" style={{ background: '#dc3545' }}>
                Logout
              </button>
            </div>
          </nav>
        </header>

        <main className="app-main">
          {currentView === 'list' && (
            <RecipeList
              key={refreshKey}
              selectedRecipes={selectedRecipes}
              onRecipeSelect={handleRecipeSelect}
              onRecipeClick={handleRecipeClick}
            />
          )}

          {currentView === 'add' && (
            <RecipeForm
              onSuccess={handleFormSuccess}
              onCancel={handleFormCancel}
            />
          )}

          {currentView === 'edit' && recipeToEdit && (
            <RecipeForm
              recipe={recipeToEdit}
              onSuccess={handleFormSuccess}
              onCancel={handleFormCancel}
            />
          )}

          {currentView === 'grocery' && (
            <GroceryList selectedRecipes={selectedRecipes} />
          )}

          {currentView === 'categorize' && (
            <CategorizationManager />
          )}

          {currentView === 'saved-lists' && (
            <SavedGroceryLists onNavigateToShopping={handleNavigateToShopping} />
          )}

          {currentView === 'shopping' && shoppingListId && (
            <ShoppingView listId={shoppingListId} onBack={handleBackToSavedLists} />
          )}
        </main>

        {selectedRecipeDetail && (
          <RecipeDetail
            recipe={selectedRecipeDetail}
            onClose={handleCloseDetail}
            onEdit={handleEditRecipe}
            onDelete={handleDeleteRecipe}
          />
        )}
      </div>
    </ErrorBoundary>
  );
}

export default App;
