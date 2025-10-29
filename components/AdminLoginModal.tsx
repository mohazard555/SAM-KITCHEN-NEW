import React, { useState } from 'react';

interface AdminLoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLogin: (username, password) => void;
}

const AdminLoginModal: React.FC<AdminLoginModalProps> = ({ isOpen, onClose, onLogin }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onLogin(username, password);
  };

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50"
      onClick={onClose}
    >
      <div 
        className="bg-slate-800 p-8 rounded-2xl shadow-lg w-full max-w-sm"
        onClick={e => e.stopPropagation()}
      >
        <h2 className="text-2xl font-bold text-center text-white mb-6">دخول الأدمن</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label 
              htmlFor="username" 
              className="block text-sm font-medium text-slate-300 mb-2"
            >
              اسم المستخدم
            </label>
            <input 
              type="text"
              id="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full bg-slate-700 text-white p-3 rounded-lg border-2 border-slate-600 focus:border-red-500 focus:ring-red-500 transition-colors"
              required
            />
          </div>
          <div>
            <label 
              htmlFor="password" 
              className="block text-sm font-medium text-slate-300 mb-2"
            >
              كلمة المرور
            </label>
            <input 
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-slate-700 text-white p-3 rounded-lg border-2 border-slate-600 focus:border-red-500 focus:ring-red-500 transition-colors"
              required
            />
          </div>
          <button
            type="submit"
            className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-3 px-4 rounded-lg text-lg transition-colors mt-4"
          >
            دخول
          </button>
        </form>
      </div>
    </div>
  );
};

export default AdminLoginModal;
