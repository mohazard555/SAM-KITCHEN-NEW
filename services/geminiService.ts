import { GoogleGenAI, Type } from "@google/genai";
import type { FormData, Recipe } from '../types';

const RECIPE_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    recipeName: { type: Type.STRING, description: "اسم الوصفة." },
    description: { type: Type.STRING, description: "وصف قصير وجذاب للطبق." },
    servings: { type: Type.STRING, description: "عدد الحصص التي تكفيها الوصفة." },
    prepTime: { type: Type.STRING, description: "مدة التحضير، مثال: '15 دقيقة'." },
    cookTime: { type: Type.STRING, description: "مدة الطهي، مثال: '30 دقيقة'." },
    ingredients: {
      type: Type.ARRAY,
      description: "قائمة بجميع المكونات المطلوبة للوصفة، مع الكميات.",
      items: { type: Type.STRING }
    },
    instructions: {
      type: Type.ARRAY,
      description: "تعليمات الطهي خطوة بخطوة.",
      items: { type: Type.STRING }
    }
  },
  required: [
    "recipeName", 
    "description", 
    "ingredients", 
    "instructions", 
    "servings", 
    "prepTime", 
    "cookTime"
  ]
};

const buildPrompt = (formData: FormData): string => {
  let prompt = `قم بإنشاء وصفة طعام مفصلة باللغة العربية بناءً على المعلومات التالية. يرجى تقديم وصفة واحدة فقط.\n\n`;

  prompt += `المكونات المتاحة: "${formData.ingredients}". يمكنك تضمين مكونات أساسية أخرى شائعة إذا لزم الأمر.\n`;

  if (formData.cuisine !== 'أي نوع') {
    prompt += `المطبخ المفضل: "يجب أن تكون الوصفة من المطبخ ${formData.cuisine}."\n`;
  } else {
    prompt += `المطبخ المفضل: "يمكن أن يكون المطبخ من أي نوع."\n`;
  }

  if (formData.mealType !== 'أي نوع') {
    prompt += `نوع الوجبة المطلوب: "يجب أن تكون الوصفة من نوع: ${formData.mealType}."\n`;
  } else {
    prompt += `نوع الوجبة المطلوب: "يمكن أن تكون الوجبة من أي نوع."\n`;
  }

  if (formData.dietaryOptions.length > 0) {
    prompt += `الاحتياجات الغذائية: "يجب أن تكون مناسبة للأنظمة الغذائية التالية: ${formData.dietaryOptions.join(', ')}."\n`;
  } else {
    prompt += `الاحتياجات الغذائية: "لا توجد قيود غذائية."\n`;
  }

  return prompt;
};

const extractJson = (text: string): string => {
  const match = text.match(/```(json)?\s*([\s\S]*?)\s*```/);
  if (match && match[2]) {
    return match[2];
  }
  return text;
};

export const generateRecipe = async (formData: FormData): Promise<Recipe> => {
  if (!process.env.API_KEY) {
    throw new Error("API_KEY environment variable not set");
  }

  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const prompt = buildPrompt(formData);

  // FIX: Declare rawText outside the try block to make it accessible in the catch block.
  // This resolves a scope error where `response.text` was used in the catch block but was not available.
  let rawText = '';

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: RECIPE_SCHEMA,
        temperature: 0.7,
      },
    });

    rawText = response.text.trim();
    const jsonText = extractJson(rawText);
    const recipe = JSON.parse(jsonText) as Recipe;
    return recipe;
  } catch (error) {
    console.error("Error calling Gemini API:", error);
    if (error instanceof SyntaxError) {
       console.error("Failed to parse JSON from API response. Raw text:", rawText);
    }
    throw new Error("Failed to generate recipe from API.");
  }
};
