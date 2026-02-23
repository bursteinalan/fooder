import { useState, useEffect } from 'react';
import { apiService } from '../services/api.service';
import type { SavedGroceryList, SavedGroceryListItem } from '../types/saved-grocery-list.types';
import './ShoppingView.css';

interface ShoppingViewProps {
  listId: string;
  onBack: () => void;
}

interface GroupedItems {
  [category: string]: SavedGroceryListItem[];
}

// Persistence verification helper
const verifyPersistence = (list: SavedGroceryList, context: string) => {
  const checkedItems = list.items.filter(item => item.checked);
  const uncheckedItems = list.items.filter(item => !item.checked);
  
  console.log(`[Persistence Check - ${context}]`, {
    listId: list.id,
    listName: list.name,
    totalItems: list.items.length,
    checkedCount: checkedItems.length,
    uncheckedCount: uncheckedItems.length,
    checkedItems: checkedItems.map(i => ({ id: i.id, name: i.name, checked: i.checked })),
    timestamp: new Date().toISOString()
  });

  // Store snapshot in sessionStorage for cross-session verification
  const storageKey = `persistence_check_${list.id}`;
  const previousSnapshot = sessionStorage.getItem(storageKey);
  
  if (previousSnapshot) {
    const previous = JSON.parse(previousSnapshot);
    console.log(`[Persistence Verification - ${context}]`, {
      message: 'Comparing with previous session',
      previousCheckedCount: previous.checkedCount,
      currentCheckedCount: checkedItems.length,
      statesMatch: previous.checkedCount === checkedItems.length,
      previousTimestamp: previous.timestamp,
      currentTimestamp: new Date().toISOString()
    });
  }

  // Update snapshot
  sessionStorage.setItem(storageKey, JSON.stringify({
    checkedCount: checkedItems.length,
    checkedItemIds: checkedItems.map(i => i.id),
    timestamp: new Date().toISOString()
  }));
};

export function ShoppingView({ listId, onBack }: ShoppingViewProps) {
  const [list, setList] = useState<SavedGroceryList | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showRenameDialog, setShowRenameDialog] = useState(false);
  const [newName, setNewName] = useState('');
  const [showAddItemForm, setShowAddItemForm] = useState(false);
  const [newItem, setNewItem] = useState({
    name: '',
    quantity: 1,
    unit: '',
    category: 'Other'
  });

  useEffect(() => {
    console.log('[ShoppingView] Component mounted/remounted', { listId });
    loadList();
    
    return () => {
      console.log('[ShoppingView] Component unmounting', { listId });
    };
  }, [listId]);

  const loadList = async () => {
    setIsLoading(true);
    setError(null);
    try {
      console.log('[ShoppingView] Loading list from backend', { listId });
      const data = await apiService.getSavedListById(listId);
      console.log('[ShoppingView] List loaded successfully', { 
        listId: data.id, 
        itemCount: data.items.length,
        checkedCount: data.items.filter(i => i.checked).length 
      });
      setList(data);
      
      // Verify persistence after loading
      verifyPersistence(data, 'Load from Backend');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load list';
      console.error('[ShoppingView] Failed to load list', { listId, error: errorMessage });
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleChecked = async (itemId: string) => {
    if (!list) return;

    const item = list.items.find(i => i.id === itemId);
    const newCheckedState = item ? !item.checked : false;
    
    console.log('[ShoppingView] Toggling item checked state', { 
      itemId, 
      itemName: item?.name,
      previousState: item?.checked,
      newState: newCheckedState 
    });

    // Optimistic update
    const previousList = list;
    const updatedItems = list.items.map(item =>
      item.id === itemId ? { ...item, checked: !item.checked } : item
    );
    setList({ ...list, items: updatedItems });

    try {
      const updatedList = await apiService.toggleItemChecked(listId, itemId);
      console.log('[ShoppingView] Item checked state persisted to backend', { 
        itemId,
        checkedCount: updatedList.items.filter(i => i.checked).length 
      });
      setList(updatedList);
      
      // Verify persistence after toggle
      verifyPersistence(updatedList, 'After Toggle');
    } catch (err) {
      // Rollback on error
      console.error('[ShoppingView] Failed to persist checked state, rolling back', { itemId, error: err });
      setList(previousList);
      const errorMessage = err instanceof Error ? err.message : 'Failed to update item';
      setError(errorMessage);
    }
  };

  const handleAddItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!list || !newItem.name.trim()) return;

    try {
      const updatedList = await apiService.addItemToList(listId, newItem);
      setList(updatedList);
      setNewItem({ name: '', quantity: 1, unit: '', category: 'Other' });
      setShowAddItemForm(false);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to add item';
      setError(errorMessage);
    }
  };

  const handleRemoveItem = async (itemId: string) => {
    if (!list) return;

    try {
      const updatedList = await apiService.removeItemFromList(listId, itemId);
      setList(updatedList);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to remove item';
      setError(errorMessage);
    }
  };

  const handleRename = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!list || !newName.trim()) return;

    try {
      const updatedList = await apiService.updateSavedList(listId, { name: newName });
      setList(updatedList);
      setShowRenameDialog(false);
      setNewName('');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to rename list';
      setError(errorMessage);
    }
  };

  const openRenameDialog = () => {
    if (list) {
      setNewName(list.name);
      setShowRenameDialog(true);
    }
  };

  const groupItemsByCategory = (items: SavedGroceryListItem[]): GroupedItems => {
    const grouped: GroupedItems = {};
    
    items.forEach(item => {
      if (!grouped[item.category]) {
        grouped[item.category] = [];
      }
      grouped[item.category].push(item);
    });

    // Sort items within each category: unchecked first, then checked
    Object.keys(grouped).forEach(category => {
      grouped[category].sort((a, b) => {
        if (a.checked === b.checked) {
          return a.order - b.order;
        }
        return a.checked ? 1 : -1;
      });
    });

    return grouped;
  };

  if (isLoading) {
    return (
      <div className="shopping-view">
        <div className="loading">Loading list...</div>
      </div>
    );
  }

  if (error && !list) {
    return (
      <div className="shopping-view">
        <div className="error-message">{error}</div>
        <button onClick={loadList} className="btn-retry">
          Retry
        </button>
      </div>
    );
  }

  if (!list) {
    return (
      <div className="shopping-view">
        <div className="error-message">List not found</div>
        <button onClick={onBack} className="btn-back">
          Back to Lists
        </button>
      </div>
    );
  }

  const groupedItems = groupItemsByCategory(list.items);
  const categories = Object.keys(groupedItems).sort();

  return (
    <div className="shopping-view">
      <header className="shopping-header">
        <button onClick={onBack} className="btn-back" aria-label="Back to saved lists">
          ← Back
        </button>
        <h1 className="list-title">{list.name}</h1>
        <button onClick={openRenameDialog} className="btn-rename" aria-label="Rename list">
          Rename
        </button>
      </header>

      {error && (
        <div className="error-banner">{error}</div>
      )}

      <div className="shopping-content">
        {categories.map(category => (
          <div key={category} className="category-section">
            <h2 className="category-header">{category}</h2>
            <div className="items-list">
              {groupedItems[category].map(item => (
                <div key={item.id} className={`item-row ${item.checked ? 'checked' : ''}`}>
                  <label className="item-checkbox-label">
                    <input
                      type="checkbox"
                      checked={item.checked}
                      onChange={() => handleToggleChecked(item.id)}
                      className="item-checkbox"
                    />
                    <span className="item-details">
                      <span className="item-name">{item.name}</span>
                      <span className="item-quantity">
                        {item.quantity} {item.unit}
                      </span>
                    </span>
                  </label>
                  <button
                    onClick={() => handleRemoveItem(item.id)}
                    className="btn-remove-item"
                    aria-label={`Remove ${item.name}`}
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          </div>
        ))}

        {categories.length === 0 && (
          <div className="empty-list">
            <p>No items in this list yet.</p>
          </div>
        )}
      </div>

      <div className="shopping-actions">
        {showAddItemForm ? (
          <form onSubmit={handleAddItem} className="add-item-form">
            <h3>Add Item</h3>
            <input
              type="text"
              value={newItem.name}
              onChange={(e) => setNewItem({ ...newItem, name: e.target.value })}
              placeholder="Item name"
              className="input-item-name"
              required
            />
            <div className="form-row">
              <input
                type="number"
                value={newItem.quantity}
                onChange={(e) => setNewItem({ ...newItem, quantity: parseFloat(e.target.value) || 1 })}
                placeholder="Qty"
                className="input-quantity"
                min="0.01"
                step="0.01"
                required
              />
              <input
                type="text"
                value={newItem.unit}
                onChange={(e) => setNewItem({ ...newItem, unit: e.target.value })}
                placeholder="Unit"
                className="input-unit"
              />
              <select
                value={newItem.category}
                onChange={(e) => setNewItem({ ...newItem, category: e.target.value })}
                className="input-category"
              >
                <option value="Produce">Produce</option>
                <option value="Meat">Meat</option>
                <option value="Dairy">Dairy</option>
                <option value="Bakery">Bakery</option>
                <option value="Pantry">Pantry</option>
                <option value="Frozen">Frozen</option>
                <option value="Other">Other</option>
              </select>
            </div>
            <div className="form-actions">
              <button type="submit" className="btn-submit">Add</button>
              <button
                type="button"
                onClick={() => {
                  setShowAddItemForm(false);
                  setNewItem({ name: '', quantity: 1, unit: '', category: 'Other' });
                }}
                className="btn-cancel"
              >
                Cancel
              </button>
            </div>
          </form>
        ) : (
          <button onClick={() => setShowAddItemForm(true)} className="btn-add-item">
            + Add Item
          </button>
        )}
      </div>

      {showRenameDialog && (
        <div className="dialog-overlay" onClick={() => setShowRenameDialog(false)}>
          <div className="dialog" onClick={(e) => e.stopPropagation()}>
            <h3>Rename List</h3>
            <form onSubmit={handleRename}>
              <input
                type="text"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="List name"
                className="input-list-name"
                autoFocus
                required
              />
              <div className="dialog-actions">
                <button type="submit" className="btn-submit">Save</button>
                <button
                  type="button"
                  onClick={() => {
                    setShowRenameDialog(false);
                    setNewName('');
                  }}
                  className="btn-cancel"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
