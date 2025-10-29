import React from 'react';

interface SubscriptionPromptProps {
  message: string;
  link: string;
  onSubscribe: () => void;
}

const SubscriptionPrompt: React.FC<SubscriptionPromptProps> = ({ message, link, onSubscribe }) => {
  return (
    <div className="bg-slate-800 border-2 border-red-500 p-6 rounded-2xl text-center shadow-lg animate-fade-in">
      <h3 className="text-xl font-bold text-white mb-3">مرحباً بك في مطبخ سام!</h3>
      <p className="text-slate-300 mb-5">{message}</p>
      <a
        href={link}
        target="_blank"
        rel="noopener noreferrer"
        onClick={onSubscribe}
        className="inline-block bg-red-600 hover:bg-red-700 text-white font-bold py-3 px-8 rounded-lg text-lg transition-colors"
      >
        الاشتراك الآن
      </a>
    </div>
  );
};

export default SubscriptionPrompt;
