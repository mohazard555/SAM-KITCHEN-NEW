// A Vercel Edge Function that acts as a secure proxy to the Gemini API.
// This code runs on the server, not in the user's browser.
import { GoogleGenAI, Type } from "@google/genai";

// --- Type definitions (copied from types.ts to make the function self-contained) ---
interface FormData {
  ingredients: string;
  cuisine: string;
  mealType: string;
  dietaryOptions: string[];
}

interface Recipe {
  recipeName: string;
  description: string;
  servings: string;
  prepTime: string;
  cookTime: string;
  ingredients: string[];
  instructions: string[];
}

// --- Schema and prompt logic (copied from services/geminiService.ts) ---
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
      description: "قائمة بجميع المكونات المطلوبة للصفة، مع الكميات.",
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

// --- Vercel Edge Function Configuration ---
export const config = {
    runtime: 'edge',
};

// --- The main API handler function ---
export default async function handler(request: Request) {
    // Only allow POST requests
    if (request.method !== 'POST') {
        return new Response(JSON.stringify({ message: 'Method Not Allowed' }), {
            status: 405,
            headers: { 'Content-Type': 'application/json' },
        });
    }

    try {
        const formData: FormData = await request.json();

        // Securely get the API key from server-side environment variables
        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) {
            // This error will be visible in Vercel logs, not to the user
            console.error("GEMINI_API_KEY is not set in Vercel environment variables.");
            throw new Error("لم يتم تكوين مفتاح الواجهة البرمجية على الخادم.");
        }

        const ai = new GoogleGenAI({ apiKey });
        const prompt = buildPrompt(formData);

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: {
                responseMimeType: 'application/json',
                responseSchema: RECIPE_SCHEMA,
                temperature: 0.7,
            },
        });

        const rawText = response.text.trim();
        const jsonText = extractJson(rawText);
        const recipe = JSON.parse(jsonText) as Recipe;

        // Send the successful recipe response back to the client
        return new Response(JSON.stringify(recipe), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
        });

    } catch (error) {
        console.error("Error in /api/generate:", error);
        const errorMessage = error instanceof Error ? error.message : "حدث خطأ غير معروف.";
        
        // Send a generic but informative error back to the client
        return new Response(JSON.stringify({ error: "فشل إنشاء الوصفة.", details: errorMessage }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
        });
    }
}
