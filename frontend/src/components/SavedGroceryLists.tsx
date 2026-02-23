import { useState, useEffect } from 'react';
import { apiService } from '../services/api.service';
import type { SavedGroceryList } from '../types/saved-grocery-list.types';
import './SavedGroceryLists.css';

interface SavedGroceryListsProps {
  onNavigateToShopping: (listId: string) => void;
}

export function SavedGroceryLists({ onNavigateToShopping }: SavedGroceryListsProps) {
  const [lists, setLists] = useState<SavedGroceryList[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  useEffect(() => {
    loadLists();
  }, []);

  const loadLists = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await apiService.getSavedLists();
      setLists(data);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load saved lists';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (listId: string) => {
    try {
      await apiService.deleteSavedList(listId);
      setDeleteConfirmId(null);
      await loadLists();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete list';
      setError(errorMessage);
    }
  };

  const handleCardClick = (listId: string) => {
    onNavigateToShopping(listId);
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const getItemCounts = (list: SavedGroceryList) => {
    const total = list.items.length;
    const checked = list.items.filter(item => item.checked).length;
    return { total, checked };
  };

  if (isLoading) {
    return (
      <div className="saved-lists-container">
        <div className="loading">Loading saved lists...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="saved-lists-container">
        <div className="error-message">{error}</div>
        <button onClick={loadLists} className="btn-retry">
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="saved-lists-container">
      <div className="saved-lists-header">
        <h2>Saved Grocery Lists</h2>
      </div>

      {lists.length === 0 ? (
        <div className="empty-state">
          <p>No saved lists yet. Create a grocery list and save it to get started!</p>
        </div>
      ) : (
        <div className="lists-grid">
          {lists.map((list) => {
            const { total, checked } = getItemCounts(list);
            return (
              <div key={list.id} className="list-card">
                <div
                  className="list-card-content"
                  onClick={() => handleCardClick(list.id)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      handleCardClick(list.id);
                    }
                  }}
                >
                  <h3 className="list-name">{list.name}</h3>
                  <div className="list-meta">
                    <span className="list-date">{formatDate(list.createdAt)}</span>
                    <span className="list-item-count">
                      {checked > 0 ? `${checked}/${total}` : `${total}`} item{total !== 1 ? 's' : ''}
                    </span>
                  </div>
                </div>
                <div className="list-card-actions">
                  {deleteConfirmId === list.id ? (
                    <div className="delete-confirm">
                      <span className="delete-confirm-text">Delete this list?</span>
                      <button
                        onClick={() => handleDelete(list.id)}
                        className="btn-confirm-delete"
                      >
                        Yes
                      </button>
                      <button
                        onClick={() => setDeleteConfirmId(null)}
                        className="btn-cancel-delete"
                      >
                        No
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setDeleteConfirmId(list.id);
                      }}
                      className="btn-delete"
                      aria-label={`Delete ${list.name}`}
                    >
                      Delete
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
