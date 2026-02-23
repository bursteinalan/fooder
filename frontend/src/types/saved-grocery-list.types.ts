export interface SavedGroceryListItem {
  id: string;
  name: string;
  quantity: number;
  unit: string;
  category: string;
  checked: boolean;
  order: number;
}

export interface SavedGroceryList {
  id: string;
  name: string;
  items: SavedGroceryListItem[];
  recipeIds: string[];
  createdAt: string;
  updatedAt: string;
}

export interface SavedGroceryListSummary {
  id: string;
  name: string;
  itemCount: number;
  checkedCount: number;
  createdAt: string;
}
