
export interface Advertisement {
  imageUrl: string;
  text: string;
  linkUrl: string;
}

export interface FormData {
  ingredients: string;
  cuisine: string;
  mealType: string;
  dietaryOptions: string[];
}

export interface Recipe {
  recipeName: string;
  description: string;
  servings: string;
  prepTime: string;
  cookTime: string;
  ingredients: string[];
  instructions: string[];
}