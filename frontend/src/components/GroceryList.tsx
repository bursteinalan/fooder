import { useState, useEffect } from 'react';
import { apiService } from '../services/api.service';
import type { GroceryListItem } from '../types/recipe.types';
import './GroceryList.css';

interface GroceryListProps {
  selectedRecipes: string[];
}

export function GroceryList({ selectedRecipes }: GroceryListProps) {
  const [groceryItems, setGroceryItems] = useState<GroceryListItem[]>([]);
  const [customItems, setCustomItems] = useState<GroceryListItem[]>([
    { name: '', quantity: 1, unit: '', category: 'Other' }
  ]);
  const [ingredientNames, setIngredientNames] = useState<string[]>([]);
  const [recipeNames, setRecipeNames] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copySuccess, setCopySuccess] = useState(false);
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [listName, setListName] = useState('');
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const STANDARD_UNITS = [
    'tsp', 'tbsp', 'cup', 'pint', 'oz', 'lb', 'g', 'kg', 'ml', 'l',
    'clove', 'piece', 'whole', 'can', 'bunch', 'pinch', 'dash', 'to taste'
  ];

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (selectedRecipes.length > 0) {
      fetchGroceryList();
    } else {
      setGroceryItems([]);
      setError(null);
    }
  }, [selectedRecipes]);

  const loadData = async () => {
    try {
      const namesData = await apiService.getIngredientNames();
      setIngredientNames(namesData);
    } catch (err) {
      console.error('Failed to load data:', err);
    }
  };

  const fetchGroceryList = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [groceryResponse, ...recipeResponses] = await Promise.all([
        apiService.generateGroceryList(selectedRecipes),
        ...selectedRecipes.map(id => apiService.getRecipeById(id))
      ]);
      setGroceryItems(groceryResponse.items);
      setRecipeNames(recipeResponses.map(r => r.title));
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to generate grocery list';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const formatGroceryList = (): string => {
    const validCustomItems = customItems.filter(
      item => item.name.trim() && item.quantity > 0 && item.unit.trim()
    );
    const allItems = [...groceryItems, ...validCustomItems];
    const grouped = groupByCategory(allItems);
    let text = '';

    for (const [category, items] of Object.entries(grouped)) {
      text += `\n${category}\n`;
      text += '─'.repeat(category.length) + '\n';
      items.forEach(item => {
        text += `${item.quantity} ${item.unit} ${item.name}\n`;
      });
    }

    return text.trim();
  };

  const groupByCategory = (items: GroceryListItem[]): { [category: string]: GroceryListItem[] } => {
    return items.reduce((acc, item) => {
      if (!acc[item.category]) {
        acc[item.category] = [];
      }
      acc[item.category].push(item);
      return acc;
    }, {} as { [category: string]: GroceryListItem[] });
  };

  const addCustomItem = () => {
    setCustomItems([...customItems, { name: '', quantity: 1, unit: '', category: 'Other' }]);
  };

  const removeCustomItem = (index: number) => {
    setCustomItems(customItems.filter((_, i) => i !== index));
  };

  const updateCustomItem = (index: number, field: keyof GroceryListItem, value: string | number) => {
    const updated = [...customItems];
    updated[index] = { ...updated[index], [field]: value };
    setCustomItems(updated);

    // Check if this row is complete and it's the last row
    const isLastRow = index === customItems.length - 1;
    const currentItem = updated[index];
    const isComplete = currentItem.name.trim() && currentItem.quantity > 0 && currentItem.unit.trim();

    if (isLastRow && isComplete) {
      // Add a new empty row automatically
      setCustomItems([...updated, { name: '', quantity: 1, unit: '', category: 'Other' }]);
    }
  };

  const handleItemNameBlur = async (index: number) => {
    const itemName = customItems[index].name.trim();
    if (itemName) {
      try {
        const result = await apiService.getIngredientCategory(itemName);
        const updated = [...customItems];
        updated[index] = { ...updated[index], category: result.category };
        setCustomItems(updated);
      } catch (error) {
        console.error('Failed to load category:', error);
      }
    }
  };

  const handleCopyToClipboard = async () => {
    try {
      const text = formatGroceryList();
      await navigator.clipboard.writeText(text);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    } catch (err) {
      setError('Failed to copy to clipboard');
    }
  };

  const handleDownloadAsFile = () => {
    const text = formatGroceryList();
    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'grocery-list.txt';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleOpenSaveDialog = () => {
    setShowSaveDialog(true);
    setListName('');
    setSaveError(null);
  };

  const handleCloseSaveDialog = () => {
    setShowSaveDialog(false);
    setListName('');
    setSaveError(null);
  };

  const handleSaveList = async () => {
    const trimmedName = listName.trim();
    
    if (!trimmedName) {
      setSaveError('Please enter a list name');
      return;
    }

    setIsSaving(true);
    setSaveError(null);

    try {
      // Collect all valid custom items
      const validCustomItems = customItems.filter(
        item => item.name.trim() && item.quantity > 0 && item.unit.trim()
      );

      // Combine grocery items and custom items
      const allItems = [...groceryItems, ...validCustomItems].map(item => ({
        name: item.name,
        quantity: item.quantity,
        unit: item.unit,
        category: item.category,
      }));

      // Call API to create saved list
      await apiService.createSavedList({
        name: trimmedName,
        items: allItems,
        recipeIds: selectedRecipes,
      });

      // Show success message
      setSaveSuccess(true);
      setShowSaveDialog(false);
      setListName('');
      
      // Clear success message after 3 seconds
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to save list';
      setSaveError(errorMessage);
    } finally {
      setIsSaving(false);
    }
  };

  if (selectedRecipes.length === 0) {
    return (
      <div className="grocery-list-container">
        <div className="empty-state">
          <p>Select recipes from your collection to generate a grocery list</p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="grocery-list-container">
        <div className="loading">Generating grocery list...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="grocery-list-container">
        <div className="error-message">{error}</div>
        <button onClick={fetchGroceryList} className="btn-retry">
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="grocery-list-container">
      <div className="grocery-list-header">
        <h2>Grocery List</h2>
        <p className="recipe-count">
          From {selectedRecipes.length} recipe{selectedRecipes.length !== 1 ? 's' : ''}
        </p>
        {recipeNames.length > 0 && (
          <div className="recipe-names">
            {recipeNames.map((name, index) => (
              <span key={index} className="recipe-badge">
                {name}
              </span>
            ))}
          </div>
        )}
      </div>

      <div className="grocery-content">
        <div className="main-grocery-section">
          {groceryItems.length === 0 ? (
            <div className="empty-state">
              <p>No ingredients found in selected recipes</p>
            </div>
          ) : (
            <>
              <div className="grocery-items">
                {Object.entries(groupByCategory([
                  ...groceryItems,
                  ...customItems.filter(item => item.name.trim() && item.quantity > 0 && item.unit.trim())
                ])).map(([category, items]) => (
                  <div key={category} className="category-section">
                    <h3 className="category-title">{category}</h3>
                    <div className="category-items">
                      {items.map((item, index) => (
                        <div key={index} className="grocery-item">
                          <span className="item-quantity">{item.quantity}</span>
                          <span className="item-unit">{item.unit}</span>
                          <span className="item-name">{item.name}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              <div className="grocery-list-actions">
                <button
                  onClick={handleCopyToClipboard}
                  className="btn-copy"
                  aria-label="Copy grocery list to clipboard"
                >
                  {copySuccess ? '✓ Copied!' : 'Copy to Clipboard'}
                </button>
                <button
                  onClick={handleDownloadAsFile}
                  className="btn-download"
                  aria-label="Download grocery list as text file"
                >
                  Download as Text
                </button>
                <button
                  onClick={handleOpenSaveDialog}
                  className="btn-save"
                  aria-label="Save grocery list"
                >
                  Save List
                </button>
              </div>

              {copySuccess && (
                <div className="success-message">
                  Grocery list copied to clipboard!
                </div>
              )}

              {saveSuccess && (
                <div className="success-message">
                  List saved successfully!
                </div>
              )}
            </>
          )}
        </div>

        <div className="custom-items-section">
          <h3>Other Items to Get</h3>
          <p className="section-description">Add extra items not from recipes</p>

          <div className="custom-items-list">
            {customItems.map((item, index) => (
              <div key={index} className="custom-item-row">
                <input
                  type="text"
                  placeholder="Item name"
                  value={item.name}
                  onChange={(e) => updateCustomItem(index, 'name', e.target.value)}
                  onBlur={() => handleItemNameBlur(index)}
                  className="item-input"
                  list={`custom-ingredient-names-${index}`}
                  autoComplete="off"
                />
                <datalist id={`custom-ingredient-names-${index}`}>
                  {ingredientNames.map((name) => (
                    <option key={name} value={name} />
                  ))}
                </datalist>
                <input
                  type="number"
                  placeholder="Qty"
                  value={item.quantity || ''}
                  onChange={(e) => updateCustomItem(index, 'quantity', parseFloat(e.target.value) || 1)}
                  min="0"
                  step="0.001"
                  className="item-quantity-input"
                />
                <select
                  value={item.unit}
                  onChange={(e) => updateCustomItem(index, 'unit', e.target.value)}
                  className="item-unit-select"
                >
                  <option value="">Unit</option>
                  {STANDARD_UNITS.map((unit) => (
                    <option key={unit} value={unit}>
                      {unit}
                    </option>
                  ))}
                </select>
                {item.name.trim() && (
                  <span className="item-category-badge">{item.category}</span>
                )}
                {(item.name.trim() || item.unit.trim() || customItems.length > 1) && (
                  <button
                    onClick={() => removeCustomItem(index)}
                    className="btn-remove-custom"
                    aria-label="Remove item"
                  >
                    ×
                  </button>
                )}
              </div>
            ))}
          </div>

          <button
            onClick={addCustomItem}
            className="btn-add-row"
          >
            + Add Another Item
          </button>
        </div>
      </div>

      {showSaveDialog && (
        <div className="save-dialog-overlay" onClick={handleCloseSaveDialog}>
          <div className="save-dialog" onClick={(e) => e.stopPropagation()}>
            <h3>Save Grocery List</h3>
            <p className="dialog-description">Give your list a name to save it for later</p>
            
            {saveError && (
              <div className="dialog-error">{saveError}</div>
            )}
            
            <input
              type="text"
              placeholder="Enter list name (e.g., Weekly Shopping)"
              value={listName}
              onChange={(e) => setListName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && listName.trim() && !isSaving) {
                  handleSaveList();
                }
              }}
              className="dialog-input"
              autoFocus
              maxLength={100}
            />
            
            <div className="dialog-actions">
              <button
                onClick={handleCloseSaveDialog}
                className="btn-dialog-cancel"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveList}
                className="btn-dialog-save"
                disabled={!listName.trim() || isSaving}
              >
                {isSaving ? 'Saving...' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
