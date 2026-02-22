export interface Ingredient {
  name: string;
  quantity: number;
  unit: string;
}

export interface Recipe {
  id: string;
  userId: string;
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
