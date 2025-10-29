import React, { useState, useEffect } from 'react';
import type { Advertisement } from '../types';

interface AdminSettingsProps {
  settings: {
    subscriptionMessage: string;
    subscriptionChannelLink: string;
    advertisements: Advertisement[];
  };
  onSave: (newSettings: { 
    subscriptionMessage: string, 
    subscriptionChannelLink: string,
    advertisements: Advertisement[] 
  }) => void;
  onLogout: () => void;
}

const AdminSettings: React.FC<AdminSettingsProps> = ({ settings, onSave, onLogout }) => {
  const [message, setMessage] = useState(settings.subscriptionMessage);
  const [link, setLink] = useState(settings.subscriptionChannelLink);
  const [ads, setAds] = useState<Advertisement[]>(settings.advertisements);

  useEffect(() => {
    setMessage(settings.subscriptionMessage);
    setLink(settings.subscriptionChannelLink);
    setAds(settings.advertisements || []); 
  }, [settings]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({ subscriptionMessage: message, subscriptionChannelLink: link, advertisements: ads });
  };

  const handleAdChange = (index: number, field: keyof Advertisement, value: string) => {
    const newAds = [...ads];
    newAds[index] = { ...newAds[index], [field]: value };
    setAds(newAds);
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
                <label htmlFor={`ad-image-${index}`} className="block text-sm font-medium mb-1 text-slate-300">رابط الصورة</label>
                <input
                  type="url"
                  id={`ad-image-${index}`}
                  value={ad.imageUrl}
                  onChange={(e) => handleAdChange(index, 'imageUrl', e.target.value)}
                  className="w-full bg-slate-600 text-white p-2 rounded-md border border-slate-500 focus:border-red-500 focus:ring-red-500 text-sm"
                  placeholder="https://example.com/image.png"
                  required
                />
              </div>
              <div>
                <label htmlFor={`ad-text-${index}`} className="block text-sm font-medium mb-1 text-slate-300">نص الإعلان</label>
                <textarea
                  id={`ad-text-${index}`}
                  value={ad.text}
                  onChange={(e) => handleAdChange(index, 'text', e.target.value)}
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
                  onChange={(e) => handleAdChange(index, 'linkUrl', e.target.value)}
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