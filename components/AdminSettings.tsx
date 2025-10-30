import React, { useState, useEffect, useRef } from 'react';
import type { Advertisement } from '../types';
import LoadingSpinner from './LoadingSpinner';

interface AdminSettingsProps {
  settings: {
    subscriptionMessage: string;
    subscriptionChannelLink: string;
    advertisements: Advertisement[];
    adminUsername: string;
    adminPassword: string;
    gistUrl: string;
    githubToken: string;
  };
  onSave: (newSettings: { 
    subscriptionMessage: string, 
    subscriptionChannelLink: string,
    advertisements: Advertisement[],
    adminUsername: string,
    adminPassword: string,
    gistUrl: string,
    githubToken: string,
  }) => void;
  onLogout: () => void;
}

const AdminSettings: React.FC<AdminSettingsProps> = ({ settings, onSave, onLogout }) => {
  const [message, setMessage] = useState(settings.subscriptionMessage);
  const [link, setLink] = useState(settings.subscriptionChannelLink);
  const [ads, setAds] = useState<Advertisement[]>(settings.advertisements);
  const [newUsername, setNewUsername] = useState(settings.adminUsername);
  const [newPassword, setNewPassword] = useState('');
  const [gistUrl, setGistUrl] = useState(settings.gistUrl);
  const [githubToken, setGithubToken] = useState(settings.githubToken);
  const [syncStatus, setSyncStatus] = useState<{ loading: boolean; message: string; isError: boolean; }>({ loading: false, message: '', isError: false });
  const importFileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setMessage(settings.subscriptionMessage);
    setLink(settings.subscriptionChannelLink);
    setAds(settings.advertisements || []); 
    setNewUsername(settings.adminUsername);
    setNewPassword(''); // Reset password field for security
    setGistUrl(settings.gistUrl || '');
    setGithubToken(settings.githubToken || '');
  }, [settings]);

  const handleFetchFromGist = async () => {
    if (!gistUrl) {
      setSyncStatus({ loading: false, message: 'الرجاء إدخال رابط Gist أولاً.', isError: true });
      return;
    }
    setSyncStatus({ loading: true, message: 'جاري جلب الإعدادات من Gist...', isError: false });
    try {
        const urlToFetch = `${gistUrl.split('?')[0]}?cache_bust=${new Date().getTime()}`;
        const response = await fetch(urlToFetch);
        if (!response.ok) {
            throw new Error(`فشل الطلب: ${response.statusText}`);
        }
        const data = await response.json();
        
        if (data.subscriptionMessage) setMessage(data.subscriptionMessage);
        if (data.subscriptionChannelLink) setLink(data.subscriptionChannelLink);
        if (Array.isArray(data.advertisements)) setAds(data.advertisements);
        if (data.adminUsername) setNewUsername(data.adminUsername);
        if (data.adminPassword) setNewPassword(data.adminPassword);

        setSyncStatus({ loading: false, message: 'تم جلب الإعدادات بنجاح. راجعها ثم اضغط "حفظ" لتطبيقها.', isError: false });
    } catch (error) {
        console.error("Failed to fetch from Gist:", error);
        const errorMessage = error instanceof Error ? error.message : String(error);
        setSyncStatus({ loading: false, message: `فشل جلب الإعدادات: ${errorMessage}`, isError: true });
    }
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSyncStatus({ loading: true, message: 'جاري حفظ الإعدادات...', isError: false });
    let finalMessage = 'تم حفظ الإعدادات محلياً بنجاح!';

    const passwordToSave = newPassword.trim() === '' ? settings.adminPassword : newPassword;
    const settingsToSave = {
        subscriptionMessage: message,
        subscriptionChannelLink: link,
        advertisements: ads,
        adminUsername: newUsername,
        adminPassword: passwordToSave,
        gistUrl: gistUrl,
        githubToken: githubToken,
    };
    
    if (gistUrl && githubToken) {
        try {
            const url = new URL(gistUrl);
            const pathParts = url.pathname.split('/');
            // Gist ID is always the 3rd part of the pathname, e.g., /<user>/<gistId>/...
            const gistId = pathParts[2];
            if (!gistId) throw new Error('لا يمكن استخراج Gist ID من الرابط.');

            const filename = decodeURIComponent(pathParts[pathParts.length - 1]);
            const apiUrl = `https://api.github.com/gists/${gistId}`;

            const { gistUrl: _g, githubToken: _t, ...settingsForGist } = settingsToSave;
            
            const response = await fetch(apiUrl, {
                method: 'PATCH',
                headers: {
                    'Authorization': `token ${githubToken}`,
                    'Accept': 'application/vnd.github.v3+json'
                },
                body: JSON.stringify({
                    files: {
                        [filename]: {
                            content: JSON.stringify(settingsForGist, null, 2)
                        }
                    }
                })
            });
            
            const responseData = await response.json();

            if (!response.ok) {
                throw new Error(`فشل تحديث Gist: ${responseData.message || response.statusText}`);
            }
            finalMessage = 'تم حفظ الإعدادات ومزامنتها مع Gist بنجاح!';
            
            const newSha = responseData.history?.[0]?.version;
            if (newSha) {
                const owner = pathParts[1];
                const newGistUrl = `https://gist.githubusercontent.com/${owner}/${gistId}/raw/${newSha}/${filename}`;
                settingsToSave.gistUrl = newGistUrl;
                setGistUrl(newGistUrl);
                 finalMessage += ' (تم تحديث الرابط لإصدار جديد لتجاوز التخزين المؤقت)';
            }

        } catch (error) {
            console.error("Failed to update Gist:", error);
            const errorMessage = error instanceof Error ? error.message : String(error);
            setSyncStatus({ loading: false, message: `فشل تحديث Gist: ${errorMessage}. تم الحفظ محلياً فقط.`, isError: true });
            onSave(settingsToSave);
            return;
        }
    }
    
    onSave(settingsToSave);
    setSyncStatus({ loading: false, message: finalMessage, isError: false });
  };
  
  const handleAdTextChange = (index: number, field: 'text' | 'linkUrl', value: string) => {
    const newAds = [...ads];
    newAds[index] = { ...newAds[index], [field]: value };
    setAds(newAds);
  };
  
  const handleAdImageChange = (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const newAds = [...ads];
        newAds[index] = { ...newAds[index], imageUrl: reader.result as string };
        setAds(newAds);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAddAd = () => {
    setAds([...ads, { imageUrl: '', text: '', linkUrl: '' }]);
  };

  const handleDeleteAd = (index: number) => {
    const newAds = ads.filter((_, i) => i !== index);
    setAds(newAds);
  };
  
  const handleExport = () => {
    const passwordToExport = newPassword.trim() === '' ? settings.adminPassword : newPassword;
    const settingsToExport = {
        subscriptionMessage: message,
        subscriptionChannelLink: link,
        advertisements: ads,
        adminUsername: newUsername,
        adminPassword: passwordToExport,
        gistUrl: gistUrl,
        githubToken: githubToken,
    };

    const dataStr = JSON.stringify(settingsToExport, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const exportFileDefaultName = 'sam-kitchen-settings.json';

    const linkElement = document.createElement('a');
    linkElement.href = url;
    linkElement.download = exportFileDefaultName;
    document.body.appendChild(linkElement);
    linkElement.click();
    document.body.removeChild(linkElement);
    URL.revokeObjectURL(url);
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const fileReader = new FileReader();
    const file = e.target.files?.[0];

    if (!file) {
      return;
    }

    fileReader.readAsText(file, "UTF-8");
    fileReader.onload = e => {
      const content = e.target?.result;
      if (typeof content === 'string') {
        try {
          const importedSettings = JSON.parse(content);
          
          if (importedSettings.subscriptionMessage) setMessage(importedSettings.subscriptionMessage);
          if (importedSettings.subscriptionChannelLink) setLink(importedSettings.subscriptionChannelLink);
          if (Array.isArray(importedSettings.advertisements)) setAds(importedSettings.advertisements);
          if (importedSettings.adminUsername) setNewUsername(importedSettings.adminUsername);
          if (importedSettings.adminPassword) setNewPassword(importedSettings.adminPassword);
          if (importedSettings.gistUrl !== undefined) setGistUrl(importedSettings.gistUrl);
          if (importedSettings.githubToken !== undefined) setGithubToken(importedSettings.githubToken);

          alert('تم استيراد الإعدادات بنجاح! الرجاء المراجعة والضغط على "حفظ كل الإعدادات" لتطبيقها.');

        } catch (error) {
          console.error("Error parsing imported JSON:", error);
          alert('فشل في قراءة الملف. يرجى التأكد من أنه ملف JSON صالح.');
        }
      }
    };
    if (importFileRef.current) {
      importFileRef.current.value = '';
    }
  };

  const triggerImport = () => {
    importFileRef.current?.click();
  };

  return (
    <div className="bg-slate-800 p-6 sm:p-8 rounded-2xl shadow-lg space-y-6 mb-8 border-2 border-red-500 animate-fade-in">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-white">لوحة تحكم الأدمن</h2>
        <button onClick={onLogout} className="bg-slate-700 hover:bg-slate-600 text-white font-bold py-2 px-4 rounded-lg transition-colors">
          تسجيل الخروج
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        <fieldset className="space-y-4 border border-slate-700 p-4 rounded-lg">
          <legend className="text-xl font-bold text-slate-200 px-2">إعدادات حساب الأدمن</legend>
          <div>
            <label htmlFor="adminUsername" className="block text-lg font-bold mb-2 text-slate-200">
              اسم مستخدم الأدمن
            </label>
            <input
              type="text"
              id="adminUsername"
              value={newUsername}
              onChange={(e) => setNewUsername(e.target.value)}
              className="w-full bg-slate-700 text-white p-3 rounded-lg border-2 border-slate-600 focus:border-red-500 focus:ring-red-500 transition-colors"
              required
            />
          </div>
          <div>
            <label htmlFor="adminPassword" className="block text-lg font-bold mb-2 text-slate-200">
              كلمة سر جديدة (اتركها فارغة لعدم التغيير)
            </label>
            <input
              type="password"
              id="adminPassword"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full bg-slate-700 text-white p-3 rounded-lg border-2 border-slate-600 focus:border-red-500 focus:ring-red-500 transition-colors"
              placeholder="••••••••"
            />
          </div>
        </fieldset>

        <fieldset className="space-y-4 border border-slate-700 p-4 rounded-lg">
          <legend className="text-xl font-bold text-slate-200 px-2">إعدادات الاشتراك</legend>
          <div>
            <label htmlFor="subscriptionMessage" className="block text-lg font-bold mb-2 text-slate-200">
              رسالة الاشتراك
            </label>
            <textarea
              id="subscriptionMessage"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="w-full bg-slate-700 text-white p-3 rounded-lg border-2 border-slate-600 focus:border-red-500 focus:ring-red-500 transition-colors"
              rows={3}
              required
            />
          </div>
          <div>
            <label htmlFor="subscriptionLink" className="block text-lg font-bold mb-2 text-slate-200">
              رابط قناة الاشتراك
            </label>
            <input
              type="url"
              id="subscriptionLink"
              value={link}
              onChange={(e) => setLink(e.target.value)}
              className="w-full bg-slate-700 text-white p-3 rounded-lg border-2 border-slate-600 focus:border-red-500 focus:ring-red-500 transition-colors"
              placeholder="https://t.me/your_channel"
              required
            />
          </div>
        </fieldset>
        
        <fieldset className="space-y-4 border border-slate-700 p-4 rounded-lg">
          <legend className="text-xl font-bold text-slate-200 px-2">المزامنة عبر الإنترنت</legend>
            <div className="text-slate-300 text-sm space-y-2 leading-relaxed">
              <p className="font-bold">لتمكين المزامنة عبر الإنترنت:</p>
              <ol className="list-decimal list-inside pr-4 space-y-1">
                  <li>الصق Gist Raw URL في الحقل أدناه ليكون مصدر بيانات الموقع.</li>
                  <li>أنشئ Personal Access Token (Classic) من إعدادات GitHub مع صلاحية <code>gist</code> فقط.</li>
                  <li>الصق الـ Token في الحقل الثاني لتمكين الحفظ والمزامنة.</li>
              </ol>
            </div>
            <div>
              <label htmlFor="gistUrl" className="block text-lg font-bold mb-2 text-slate-200">
                رابط Gist Raw للمزامنة
              </label>
              <div className="flex gap-2">
                <input
                  type="url"
                  id="gistUrl"
                  value={gistUrl}
                  onChange={(e) => setGistUrl(e.target.value)}
                  className="w-full bg-slate-700 text-white p-3 rounded-lg border-2 border-slate-600 focus:border-red-500 focus:ring-red-500 transition-colors"
                  placeholder="https://gist.githubusercontent.com/username/..."
                  dir="ltr"
                  style={{textAlign: 'left'}}
                />
                 <button 
                    type="button" 
                    onClick={handleFetchFromGist}
                    disabled={syncStatus.loading}
                    className="bg-slate-600 hover:bg-slate-500 disabled:bg-slate-700 disabled:cursor-wait text-white font-bold py-2 px-4 rounded-lg transition-colors"
                    title="جلب أحدث الإعدادات من Gist"
                 >
                   جلب
                 </button>
              </div>
            </div>
            <div>
              <label htmlFor="githubToken" className="block text-lg font-bold mb-2 text-slate-200">
                GitHub Personal Access Token
              </label>
              <input
                type="password"
                id="githubToken"
                value={githubToken}
                onChange={(e) => setGithubToken(e.target.value)}
                className="w-full bg-slate-700 text-white p-3 rounded-lg border-2 border-slate-600 focus:border-red-500 focus:ring-red-500 transition-colors"
                placeholder="••••••••••••••••••••••••••••••••••••"
                dir="ltr"
                style={{textAlign: 'left'}}
              />
            </div>
        </fieldset>
        
        <fieldset className="space-y-4 border border-slate-700 p-4 rounded-lg">
          <legend className="text-xl font-bold text-slate-200 px-2">إدارة البيانات</legend>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <button
                type="button"
                onClick={triggerImport}
                className="w-full bg-slate-600 hover:bg-slate-500 text-white font-bold py-2 px-4 rounded-lg transition-colors"
            >
                استيراد الإعدادات (JSON)
            </button>
            <input
                type="file"
                ref={importFileRef}
                onChange={handleImport}
                className="hidden"
                accept="application/json"
            />
            <button
                type="button"
                onClick={handleExport}
                className="w-full bg-slate-600 hover:bg-slate-500 text-white font-bold py-2 px-4 rounded-lg transition-colors"
            >
                تصدير الإعدادات (JSON)
            </button>
          </div>
          <p className="text-slate-400 text-sm mt-2">
            يمكنك تصدير إعداداتك الحالية كملف احتياطي، أو استيراد إعدادات من ملف.
            بعد الاستيراد، يجب عليك الضغط على "حفظ كل الإعدادات" لتطبيق التغييرات.
          </p>
        </fieldset>

        <fieldset className="space-y-4 border border-slate-700 p-4 rounded-lg">
          <legend className="text-xl font-bold text-slate-200 px-2">إدارة الإعلانات</legend>
          {ads.map((ad, index) => (
            <div key={index} className="bg-slate-700/50 p-4 rounded-lg space-y-3 border border-slate-600">
              <div className="flex justify-between items-center">
                <h3 className="font-bold text-lg text-slate-300">الإعلان #{index + 1}</h3>
                <button
                  type="button"
                  onClick={() => handleDeleteAd(index)}
                  className="bg-red-800 hover:bg-red-700 text-white font-bold py-1 px-3 rounded-lg text-sm transition-colors"
                >
                  حذف
                </button>
              </div>
              <div>
                <label htmlFor={`ad-image-${index}`} className="block text-sm font-medium mb-1 text-slate-300">صورة الإعلان</label>
                <input
                  type="file"
                  id={`ad-image-${index}`}
                  accept="image/*"
                  onChange={(e) => handleAdImageChange(index, e)}
                  className="w-full bg-slate-600 text-white p-2 rounded-md border border-slate-500 focus:border-red-500 focus:ring-red-500 text-sm file:mr-4 file:py-1 file:px-2 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-red-100 file:text-red-700 hover:file:bg-red-200"
                />
                {ad.imageUrl && <img src={ad.imageUrl} alt="معاينة" className="mt-2 rounded-md max-h-24 w-auto" />}
              </div>
              <div>
                <label htmlFor={`ad-text-${index}`} className="block text-sm font-medium mb-1 text-slate-300">نص الإعلان</label>
                <textarea
                  id={`ad-text-${index}`}
                  value={ad.text}
                  onChange={(e) => handleAdTextChange(index, 'text', e.target.value)}
                  className="w-full bg-slate-600 text-white p-2 rounded-md border border-slate-500 focus:border-red-500 focus:ring-red-500 text-sm"
                  rows={2}
                  required
                />
              </div>
              <div>
                <label htmlFor={`ad-link-${index}`} className="block text-sm font-medium mb-1 text-slate-300">رابط الوجهة</label>
                <input
                  type="url"
                  id={`ad-link-${index}`}
                  value={ad.linkUrl}
                  onChange={(e) => handleAdTextChange(index, 'linkUrl', e.target.value)}
                  className="w-full bg-slate-600 text-white p-2 rounded-md border border-slate-500 focus:border-red-500 focus:ring-red-500 text-sm"
                  placeholder="https://example.com/product"
                  required
                />
              </div>
            </div>
          ))}
          <button
            type="button"
            onClick={handleAddAd}
            className="w-full bg-slate-600 hover:bg-slate-500 text-white font-bold py-2 px-4 rounded-lg transition-colors"
          >
            + إضافة إعلان جديد
          </button>
        </fieldset>
        
        <div>
          <button
            type="submit"
            disabled={syncStatus.loading}
            className="w-full bg-red-600 hover:bg-red-700 disabled:bg-gray-500 disabled:cursor-wait text-white font-bold py-3 px-4 rounded-lg text-xl transition-colors flex items-center justify-center gap-3"
          >
            {syncStatus.loading && <LoadingSpinner />}
            حفظ كل الإعدادات
          </button>
          {syncStatus.message && (
            <p className={`mt-3 text-center text-sm ${syncStatus.isError ? 'text-red-400' : 'text-green-400'}`}>
              {syncStatus.message}
            </p>
          )}
        </div>
      </form>
    </div>
  );
};

export default AdminSettings;