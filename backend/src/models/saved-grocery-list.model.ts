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
  userId: string;
  name: string;
  items: SavedGroceryListItem[];
  recipeIds: string[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateSavedGroceryListDto {
  name: string;
  items: Array<{
    name: string;
    quantity: number;
    unit: string;
    category: string;
  }>;
  recipeIds: string[];
}

export interface UpdateSavedGroceryListDto {
  name?: string;
}

export interface AddItemDto {
  name: string;
  quantity: number;
  unit: string;
  category: string;
}
