import React, { useRef } from 'react';
import type { Recipe } from '../types';

// Declare html2canvas as a global variable to satisfy TypeScript,
// as the UMD module attaches itself to the window object.
declare const html2canvas: (element: HTMLElement, options?: object) => Promise<HTMLCanvasElement>;

interface RecipeCardProps {
  recipe: Recipe;
}

const RecipeCard: React.FC<RecipeCardProps> = ({ recipe }) => {
  const cardRef = useRef<HTMLDivElement>(null);

  const formatRecipeAsText = () => {
    let text = `${recipe.recipeName}\n`;
    text += `========================================\n\n`;
    text += `${recipe.description}\n\n`;
    text += `حصص: ${recipe.servings}\n`;
    text += `مدة التحضير: ${recipe.prepTime}\n`;
    text += `مدة الطهي: ${recipe.cookTime}\n\n`;
    text += `المكونات:\n`;
    text += `----------------------------------------\n`;
    recipe.ingredients.forEach(ing => text += `- ${ing}\n`);
    text += `\n`;
    text += `التعليمات:\n`;
    text += `----------------------------------------\n`;
    recipe.instructions.forEach((inst, i) => text += `${i + 1}. ${inst}\n`);
    return text;
  };

  const handleSaveAsText = () => {
    const text = formatRecipeAsText();
    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${recipe.recipeName.replace(/ /g, '_')}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handlePrint = () => {
    document.body.classList.add('printing-recipe');
    window.print();
    document.body.classList.remove('printing-recipe');
  };

  const handleSaveAsImage = () => {
    if (cardRef.current) {
      html2canvas(cardRef.current, { 
        backgroundColor: '#1e293b', // bg-slate-800
        useCORS: true 
      }).then(canvas => {
        const link = document.createElement('a');
        link.download = `${recipe.recipeName.replace(/ /g, '_')}.png`;
        link.href = canvas.toDataURL('image/png');
        link.click();
      });
    }
  };


  // Icons
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
  
  const DownloadIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
      <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM6.293 9.707a1 1 0 011.414 0L9 11.086V3a1 1 0 112 0v8.086l1.293-1.379a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
    </svg>
  );

  const PrintIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
      <path fillRule="evenodd" d="M5 4v3H4a2 2 0 00-2 2v6a2 2 0 002 2h12a2 2 0 002-2V9a2 2 0 00-2-2h-1V4a2 2 0 00-2-2H7a2 2 0 00-2 2zm8 0H7v3h6V4zm0 8H7v4h6v-4z" clipRule="evenodd" />
    </svg>
  );

  const ImageIcon = () => (
     <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
      <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
    </svg>
  );


  return (
    <div ref={cardRef} className="bg-slate-800 rounded-2xl shadow-lg p-6 sm:p-8 animate-fade-in">
      <div className="flex justify-between items-start">
        <div>
          <h2 className="text-3xl font-bold text-red-500 mb-3">{recipe.recipeName}</h2>
          <p className="text-slate-300 mb-6">{recipe.description}</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2 no-print">
          <button onClick={handleSaveAsText} title="حفظ كملف نصي" className="p-2 bg-slate-700 hover:bg-slate-600 rounded-full transition-colors"><DownloadIcon /></button>
          <button onClick={handlePrint} title="طباعة" className="p-2 bg-slate-700 hover:bg-slate-600 rounded-full transition-colors"><PrintIcon /></button>
          <button onClick={handleSaveAsImage} title="حفظ كصورة" className="p-2 bg-slate-700 hover:bg-slate-600 rounded-full transition-colors"><ImageIcon /></button>
        </div>
      </div>
      
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