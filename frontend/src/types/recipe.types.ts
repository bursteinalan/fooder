export interface Ingredient {
  name: string;
  quantity: number;
  unit: string;
}

export interface Recipe {
  id: string;
  title: string;
  ingredients: Ingredient[];
  instructions: string;
  sourceUrl?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateRecipeDto {
  title: string;
  ingredients: Ingredient[];
  instructions: string;
  sourceUrl?: string;
}

export interface UpdateRecipeDto {
  title?: string;
  ingredients?: Ingredient[];
  instructions?: string;
  sourceUrl?: string;
}

export interface GroceryListItem {
  name: string;
  quantity: number;
  unit: string;
  category: string;
}

export interface GroceryListResponse {
  items: GroceryListItem[];
}

export interface ApiError {
  error: string;
  message?: string;
}
