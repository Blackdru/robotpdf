import React from 'react';
import { X, CheckCircle, Sparkles, Calendar, CreditCard } from 'lucide-react';

const SubscriptionSuccessModal = ({ isOpen, onClose, plan, details }) => {
  if (!isOpen) return null;

  const planName = plan?.charAt(0).toUpperCase() + plan?.slice(1);
  const price = plan === 'basic' ? '₹99' : '₹499';
  
  const features = plan === 'basic' ? [
    '50 files per month',
    '50MB max file size',
    '500MB storage',
    '25 Advanced OCR pages',
    '25 AI chat messages',
    '25 AI summaries',
    'Advanced tools access',
    'Ad-free experience'
  ] : [
    'Unlimited files',
    '200MB max file size',
    'Unlimited storage',
    'Unlimited OCR',
    'Unlimited AI chat',
    'Unlimited AI summaries',
    'All advanced tools',
    'Priority support',
    'API access'
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 rounded-3xl shadow-2xl border border-blue-500/20 animate-in zoom-in-95 duration-300">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full hover:bg-white/10 transition-colors"
        >
          <X className="w-5 h-5 text-slate-400" />
        </button>

        {/* Success Icon with Animation */}
        <div className="flex justify-center pt-8 pb-4">
          <div className="relative">
            <div className="absolute inset-0 bg-green-500/20 rounded-full blur-xl animate-pulse"></div>
            <div className="relative bg-gradient-to-br from-green-400 to-emerald-500 rounded-full p-4">
              <CheckCircle className="w-12 h-12 text-white" />
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="px-8 pb-8 text-center">
          {/* Title */}
          <div className="flex items-center justify-center gap-2 mb-2">
            <Sparkles className="w-5 h-5 text-yellow-400" />
            <h2 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
              Welcome to {planName}!
            </h2>
            <Sparkles className="w-5 h-5 text-yellow-400" />
          </div>
          
          <p className="text-slate-300 mb-6">
            Your subscription is now active. Enjoy all premium features!
          </p>

          {/* Plan Details Card */}
          <div className="bg-gradient-to-br from-blue-500/10 to-purple-500/10 border border-blue-500/30 rounded-2xl p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-blue-400" />
                <span className="text-slate-300 font-medium">Plan Details</span>
              </div>
              <span className="text-2xl font-bold text-blue-400">{price}/mo</span>
            </div>
            
            {details && (
              <div className="flex items-center gap-2 text-sm text-slate-400">
                <Calendar className="w-4 h-4" />
                <span>
                  Valid until {new Date(details.expires_at).toLocaleDateString('en-IN', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric'
                  })}
                </span>
              </div>
            )}
          </div>

          {/* Features List */}
          <div className="text-left mb-6">
            <h3 className="text-lg font-semibold text-slate-200 mb-3">Your {planName} Features:</h3>
            <div className="grid grid-cols-1 gap-2">
              {features.map((feature, index) => (
                <div
                  key={index}
                  className="flex items-center gap-2 text-slate-300 animate-in slide-in-from-left duration-300"
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  <div className="w-1.5 h-1.5 rounded-full bg-gradient-to-r from-blue-400 to-purple-400"></div>
                  <span className="text-sm">{feature}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white font-semibold rounded-xl transition-all duration-300 transform hover:scale-105 hover:shadow-lg hover:shadow-blue-500/50"
            >
              Start Using Features
            </button>
          </div>

          {/* Footer Note */}
          <p className="text-xs text-slate-500 mt-4">
            A confirmation email has been sent to your inbox
          </p>
        </div>
      </div>
    </div>
  );
};

export default SubscriptionSuccessModal;
