import React from 'react';

interface SubscriptionPromptProps {
  isOpen: boolean;
  onClose: () => void;
  message: string;
  link: string;
  onSubscribe: () => void;
}

const SubscriptionPrompt: React.FC<SubscriptionPromptProps> = ({ isOpen, onClose, message, link, onSubscribe }) => {
  if (!isOpen) return null;

  const handleSubscribeClick = () => {
    onSubscribe();
    onClose();
  };

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50"
      onClick={onClose}
    >
      <div 
        className="bg-slate-800 p-8 rounded-2xl shadow-lg w-full max-w-sm text-center animate-fade-in"
        onClick={e => e.stopPropagation()}
      >
        <h3 className="text-xl font-bold text-white mb-3">مرحباً بك في مطبخ سام!</h3>
        <p className="text-slate-300 mb-5">{message}</p>
        <a
          href={link}
          target="_blank"
          rel="noopener noreferrer"
          onClick={handleSubscribeClick}
          className="inline-block bg-red-600 hover:bg-red-700 text-white font-bold py-3 px-8 rounded-lg text-lg transition-colors"
        >
          الاشتراك الآن
        </a>
      </div>
    </div>
  );
};

export default SubscriptionPrompt;
