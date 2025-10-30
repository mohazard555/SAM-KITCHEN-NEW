import type { FormData, Recipe } from '../types';

export const generateRecipe = async (formData: FormData): Promise<Recipe> => {
  try {
    // We now call our own secure API endpoint instead of Google's directly.
    const response = await fetch('/api/generate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(formData),
    });

    if (!response.ok) {
      const errorData = await response.json();
      // The error message from our serverless function is now in errorData.details
      throw new Error(errorData.details || `فشل الطلب من الخادم: ${response.status}`);
    }

    const recipe: Recipe = await response.json();
    return recipe;

  } catch (error) {
    console.error("Error calling backend API:", error);
    // Re-throw a user-friendly error message.
    if (error instanceof Error) {
        throw new Error(`فشل إنشاء الوصفة. السبب: ${error.message}`);
    }
    throw new Error("حدث خطأ غير متوقع أثناء الاتصال بالخادم.");
  }
};
