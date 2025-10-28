
import React from 'react';
import type { Recipe } from '../types';

interface RecipeCardProps {
  recipe: Recipe;
}

const RecipeCard: React.FC<RecipeCardProps> = ({ recipe }) => {
  const ClockIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1 inline-block" viewBox="0 0 20 20" fill="currentColor">
      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.414-1.414L11 9.586V6z" clipRule="evenodd" />
    </svg>
  );

  const UsersIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1 inline-block" viewBox="0 0 20 20" fill="currentColor">
      <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" />
    </svg>
  );

  return (
    <div className="bg-slate-800 rounded-2xl shadow-lg p-6 sm:p-8 animate-fade-in">
      <h2 className="text-3xl font-bold text-red-500 mb-3">{recipe.recipeName}</h2>
      <p className="text-slate-300 mb-6">{recipe.description}</p>
      
      <div className="flex flex-wrap gap-4 text-slate-400 mb-6 border-b border-t border-slate-700 py-4">
        <div className="flex items-center">
          <UsersIcon />
          <strong>حصص:</strong><span className="mr-2">{recipe.servings}</span>
        </div>
        <div className="flex items-center">
          <ClockIcon />
          <strong>تحضير:</strong><span className="mr-2">{recipe.prepTime}</span>
        </div>
        <div className="flex items-center">
          <ClockIcon />
          <strong>طهي:</strong><span className="mr-2">{recipe.cookTime}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="md:col-span-1">
          <h3 className="text-2xl font-bold text-slate-200 mb-4">المكونات</h3>
          <ul className="list-disc list-inside space-y-2 text-slate-300">
            {recipe.ingredients.map((ingredient, index) => (
              <li key={index}>{ingredient}</li>
            ))}
          </ul>
        </div>
        <div className="md:col-span-2">
          <h3 className="text-2xl font-bold text-slate-200 mb-4">التعليمات</h3>
          <ol className="list-decimal list-inside space-y-3 text-slate-300 leading-relaxed">
            {recipe.instructions.map((instruction, index) => (
              <li key={index}>{instruction}</li>
            ))}
          </ol>
        </div>
      </div>
    </div>
  );
};

export default RecipeCard;
