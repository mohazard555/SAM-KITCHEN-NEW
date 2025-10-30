import React, { useState, useEffect } from 'react';
import type { Advertisement } from '../types';

interface AdminSettingsProps {
  settings: {
    subscriptionMessage: string;
    subscriptionChannelLink: string;
    advertisements: Advertisement[];
    adminUsername: string;
    adminPassword: string;
  };
  onSave: (newSettings: { 
    subscriptionMessage: string, 
    subscriptionChannelLink: string,
    advertisements: Advertisement[],
    adminUsername: string,
    adminPassword: string
  }) => void;
  onLogout: () => void;
}

const AdminSettings: React.FC<AdminSettingsProps> = ({ settings, onSave, onLogout }) => {
  const [message, setMessage] = useState(settings.subscriptionMessage);
  const [link, setLink] = useState(settings.subscriptionChannelLink);
  const [ads, setAds] = useState<Advertisement[]>(settings.advertisements);
  const [newUsername, setNewUsername] = useState(settings.adminUsername);
  const [newPassword, setNewPassword] = useState('');

  useEffect(() => {
    setMessage(settings.subscriptionMessage);
    setLink(settings.subscriptionChannelLink);
    setAds(settings.advertisements || []); 
    setNewUsername(settings.adminUsername);
    setNewPassword(''); // Reset password field for security
  }, [settings]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const passwordToSave = newPassword.trim() === '' ? settings.adminPassword : newPassword;
    onSave({ 
        subscriptionMessage: message, 
        subscriptionChannelLink: link, 
        advertisements: ads,
        adminUsername: newUsername,
        adminPassword: passwordToSave
    });
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
        
        <button
          type="submit"
          className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-3 px-4 rounded-lg text-xl transition-colors"
        >
          حفظ كل الإعدادات
        </button>
      </form>
    </div>
  );
};

export default AdminSettings;