import React, { useState, useCallback, useEffect } from 'react';
import { generateRecipe } from './services/geminiService';
import type { Recipe, FormData, Advertisement } from './types';
import { CUISINE_TYPES, MEAL_TYPES, DIETARY_OPTIONS } from './constants';
import { settings } from './settings';
import RecipeCard from './components/RecipeCard';
import LoadingSpinner from './components/LoadingSpinner';
import AdminLoginModal from './components/AdminLoginModal';
import SubscriptionPrompt from './components/SubscriptionPrompt';
import AdminSettings from './components/AdminSettings';

const App: React.FC = () => {
  const [formData, setFormData] = useState<FormData>({
    ingredients: '',
    cuisine: 'أي نوع',
    mealType: 'أي نوع',
    dietaryOptions: [],
  });
  const [recipe, setRecipe] = useState<Recipe | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const [appSettings, setAppSettings] = useState(settings);
  const [adminUsername, setAdminUsername] = useState(settings.adminUsername);
  const [adminPassword, setAdminPassword] = useState(settings.adminPassword);
  const [isAdminModalOpen, setIsAdminModalOpen] = useState(false);
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isSubscriptionModalOpen, setIsSubscriptionModalOpen] = useState(false);

  useEffect(() => {
    const subscribed = localStorage.getItem('isSubscribed') === 'true';
    setIsSubscribed(subscribed);

    const loadSettings = async () => {
        let finalSettings = settings; // Start with default settings

        // 1. Try loading from localStorage
        const savedSettingsJSON = localStorage.getItem('appSettings');
        if (savedSettingsJSON) {
            try {
                const savedSettings = JSON.parse(savedSettingsJSON);
                finalSettings = { ...finalSettings, ...savedSettings };
            } catch (e) {
                console.error("Failed to parse settings from localStorage", e);
            }
        }

        // 2. If a Gist URL exists, fetch from it and override local settings
        if (finalSettings.gistUrl) {
            try {
                // Added a cache-busting query parameter to ensure latest settings are always fetched.
                const gistUrlWithCacheBust = `${finalSettings.gistUrl}?cache_bust=${new Date().getTime()}`;
                const response = await fetch(gistUrlWithCacheBust);
                if (response.ok) {
                    const gistSettings = await response.json();
                    console.log("Fetched settings from Gist successfully.");
                    // Gist is source of truth for content, localStorage for sync details
                    finalSettings = { 
                        ...finalSettings, 
                        ...gistSettings 
                    }; 
                } else {
                    console.error("Failed to fetch from Gist, using local/default settings.", response.statusText);
                }
            } catch (e) {
                console.error("Error fetching from Gist, using local/default settings.", e);
            }
        }
        
        // 3. Apply the final settings
        setAppSettings(finalSettings);
        if (finalSettings.adminUsername) {
            setAdminUsername(finalSettings.adminUsername);
        }
        if (finalSettings.adminPassword) {
            setAdminPassword(finalSettings.adminPassword);
        }
        // Update localStorage with the latest merged settings
        localStorage.setItem('appSettings', JSON.stringify(finalSettings));
    };

    loadSettings();
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleDietaryOptionToggle = (option: string) => {
    setFormData(prev => {
      const newOptions = prev.dietaryOptions.includes(option)
        ? prev.dietaryOptions.filter(o => o !== option)
        : [...prev.dietaryOptions, option];
      return { ...prev, dietaryOptions: newOptions };
    });
  };
  
  const handleLogin = (username, password) => {
    if (username === adminUsername && password === adminPassword) {
      setIsAdminLoggedIn(true);
      setIsAdminModalOpen(false);
    } else {
      alert('اسم المستخدم أو كلمة المرور غير صحيحة');
    }
  };

  const handleLogout = () => {
    setIsAdminLoggedIn(false);
  };

  const handleUpdateSettings = (newSettings: { 
    subscriptionMessage: string, 
    subscriptionChannelLink: string,
    advertisements: Advertisement[],
    adminUsername: string,
    adminPassword: string,
    gistUrl: string,
    githubToken: string,
  }) => {
    const { adminUsername: newUsername, adminPassword: newPassword, ...otherSettings } = newSettings;
    const updatedAppSettings = { ...appSettings, ...otherSettings };
    
    setAdminUsername(newUsername);
    setAdminPassword(newPassword);
    setAppSettings(updatedAppSettings);

    const settingsToSave = {
        ...updatedAppSettings,
        adminUsername: newUsername,
        adminPassword: newPassword,
    };

    localStorage.setItem('appSettings', JSON.stringify(settingsToSave));
    // The alert is removed from here to be handled in the AdminSettings component for better UX.
  };

  const handleSubscribe = () => {
    localStorage.setItem('isSubscribed', 'true');
    setIsSubscribed(true);
  };

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLoading || !formData.ingredients) return;

    if (!isAdminLoggedIn && !isSubscribed) {
      setIsSubscriptionModalOpen(true);
      return;
    }

    setIsLoading(true);
    setError(null);
    setRecipe(null);

    try {
      const generatedRecipe = await generateRecipe(formData);
      setRecipe(generatedRecipe);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'حدث خطأ غير متوقع. يرجى المحاولة مرة أخرى.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, [formData, isLoading, isSubscribed, isAdminLoggedIn]);
  
  const MagicWandIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
      <path d="M11.954 1.205a.75.75 0 01.595.148l3 3a.75.75 0 01-.53 1.295H13.5a.75.75 0 00-.75.75v1.5a.75.75 0 00.75.75h1.504a.75.75 0 01.53 1.295l-3 3a.75.75 0 01-1.13 0l-3-3a.75.75 0 01.53-1.295H10.5a.75.75 0 00.75-.75v-1.5a.75.75 0 00-.75-.75H8.996a.75.75 0 01-.53-1.295l3-3a.75.75 0 01.595-.148zM5.36 8.36a.75.75 0 00-1.06-1.06l-2.5 2.5a.75.75 0 000 1.06l2.5 2.5a.75.75 0 101.06-1.06L3.31 11H6.5a.75.75 0 000-1.5H3.31l2.05-2.05zM16.69 11.5l2.05 2.05a.75.75 0 01-1.06 1.06l-2.5-2.5a.75.75 0 010-1.06l2.5-2.5a.75.75 0 111.06 1.06L16.69 11H13.5a.75.75 0 010 1.5h3.19z" />
    </svg>
  );

  return (
    <div className="bg-slate-900 min-h-screen text-white p-4 sm:p-6 lg:p-8">
      <div className="max-w-4xl mx-auto">
        <header className="flex justify-between items-center mb-6">
          <div className="text-3xl font-bold">
            sam <span className="text-red-500">kitchen</span>
          </div>
          {!isAdminLoggedIn && (
            <button 
              onClick={() => setIsAdminModalOpen(true)}
              className="bg-slate-700 hover:bg-slate-600 text-white font-bold py-2 px-4 rounded-lg transition-colors"
            >
              دخول الأدمن
            </button>
          )}
        </header>

        <main>
          {isAdminLoggedIn && (
            <AdminSettings
              settings={{...appSettings, adminUsername, adminPassword}}
              onSave={handleUpdateSettings}
              onLogout={handleLogout}
            />
          )}

          <p className="text-center text-slate-300 mb-8 text-lg">
            حوّل مكوناتك المتبقية إلى وجبة لذيذة. فقط أخبرنا بما لديك!
          </p>
          
          <form onSubmit={handleSubmit} className="bg-slate-800 p-6 sm:p-8 rounded-2xl shadow-lg space-y-6 mt-6">
            <div>
              <label htmlFor="ingredients" className="block text-lg font-bold mb-2 text-slate-200">
                ما هي المكونات المتوفرة لديك؟
              </label>
              <textarea
                id="ingredients"
                name="ingredients"
                value={formData.ingredients}
                onChange={handleInputChange}
                className="w-full bg-slate-700 text-white p-3 rounded-lg border-2 border-slate-600 focus:border-red-500 focus:ring-red-500 transition-colors"
                rows={4}
                placeholder="مثال: صدر دجاج، طماطم، أرز، ثوم"
                required
              ></textarea>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="cuisine" className="block text-lg font-bold mb-2 text-slate-200">نوع المطبخ</label>
                <select 
                  id="cuisine" 
                  name="cuisine"
                  value={formData.cuisine}
                  onChange={handleInputChange}
                  className="w-full bg-slate-700 text-white p-3 rounded-lg border-2 border-slate-600 focus:border-red-500 focus:ring-red-500 transition-colors"
                >
                  {CUISINE_TYPES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label htmlFor="mealType" className="block text-lg font-bold mb-2 text-slate-200">نوع الوجبة</label>
                <select 
                  id="mealType" 
                  name="mealType"
                  value={formData.mealType}
                  onChange={handleInputChange}
                  className="w-full bg-slate-700 text-white p-3 rounded-lg border-2 border-slate-600 focus:border-red-500 focus:ring-red-500 transition-colors"
                >
                  {MEAL_TYPES.map(m => <option key={m} value={m}>{m}</option>)}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-lg font-bold mb-3 text-slate-200">خيارات غذائية</label>
              <div className="flex flex-wrap gap-3">
                {DIETARY_OPTIONS.map(option => (
                  <button
                    key={option}
                    type="button"
                    onClick={() => handleDietaryOptionToggle(option)}
                    className={`px-4 py-2 rounded-full text-sm font-semibold transition-all duration-200 ${
                      formData.dietaryOptions.includes(option)
                        ? 'bg-red-500 text-white ring-2 ring-red-400'
                        : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                    }`}
                  >
                    {option}
                  </button>
                ))}
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading || !formData.ingredients.trim()}
              className="w-full bg-red-600 hover:bg-red-700 disabled:bg-gray-500 disabled:cursor-not-allowed text-white font-bold py-4 px-4 rounded-lg text-xl transition-colors flex items-center justify-center gap-3"
            >
              {isLoading ? <LoadingSpinner /> : <MagicWandIcon />}
              {isLoading ? 'جاري إنشاء الوصفة...' : 'أنشئ الوصفة'}
            </button>
          </form>

          {error && (
            <div className="mt-6 bg-red-900 border border-red-700 text-red-200 px-4 py-3 rounded-lg text-center">
              {error}
            </div>
          )}

          {recipe && !isLoading && (
            <div className="mt-8 recipe-print-area">
              <RecipeCard recipe={recipe} />
            </div>
          )}

          {appSettings.advertisements.map((ad, index) => (
            ad.imageUrl && ad.linkUrl && ad.text && (
              <div key={index} className="mt-12 bg-slate-800 p-6 rounded-2xl shadow-lg">
                <a href={ad.linkUrl} target="_blank" rel="noopener noreferrer" className="block">
                  <div className="relative group">
                    <img src={ad.imageUrl} alt={ad.text} className="w-full h-48 object-cover rounded-lg"/>
                    <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center rounded-lg group-hover:bg-opacity-60 transition-all">
                        <p className="text-white text-xl font-bold text-center px-4">{ad.text}</p>
                    </div>
                  </div>
                </a>
              </div>
            )
          ))}
        </main>
        
        <footer className="text-center text-slate-500 mt-8 text-sm">
          <p>develop mohannad ahmad tel.+963998171954</p>
        </footer>
      </div>
      <SubscriptionPrompt
        isOpen={isSubscriptionModalOpen}
        onClose={() => setIsSubscriptionModalOpen(false)}
        message={appSettings.subscriptionMessage}
        link={appSettings.subscriptionChannelLink}
        onSubscribe={handleSubscribe}
      />
      <AdminLoginModal 
        isOpen={isAdminModalOpen}
        onClose={() => setIsAdminModalOpen(false)}
        onLogin={handleLogin}
      />
    </div>
  );
};

export default App;