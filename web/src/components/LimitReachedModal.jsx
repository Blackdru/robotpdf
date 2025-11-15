import { useState } from 'react';
import { X, AlertCircle, TrendingUp, Zap, Crown, ArrowRight } from 'lucide-react';
import { Button } from './ui/button';
import { useNavigate } from 'react-router-dom';

const LimitReachedModal = ({ 
  isOpen, 
  onClose, 
  limitType, 
  currentPlan, 
  limit, 
  current, 
  remaining,
  message 
}) => {
  const navigate = useNavigate();

  if (!isOpen) return null;

  const getLimitInfo = () => {
    switch (limitType) {
      case 'filesPerMonth':
        return {
          icon: <TrendingUp className="h-12 w-12 text-orange-500" />,
          title: 'Monthly File Limit Reached',
          description: `You've processed ${current} out of ${limit} files this month.`,
          suggestion: 'Upgrade to Pro for unlimited file processing.',
          features: [
            'Unlimited file uploads',
            'Process as many files as you need',
            'No monthly restrictions',
            'Priority processing'
          ]
        };
      
      case 'storageLimit':
        return {
          icon: <AlertCircle className="h-12 w-12 text-red-500" />,
          title: 'Storage Limit Reached',
          description: `You've used ${formatBytes(current)} out of ${formatBytes(limit)} storage.`,
          suggestion: 'Upgrade to Pro for unlimited storage.',
          features: [
            'Unlimited cloud storage',
            'Store all your documents',
            'Never worry about space',
            'Automatic backups'
          ]
        };
      
      case 'aiOperations':
        return {
          icon: <Zap className="h-12 w-12 text-purple-500" />,
          title: 'AI Operations Limit Reached',
          description: `You've used ${current} out of ${limit} AI operations this month.`,
          suggestion: 'Upgrade to Pro for unlimited AI features.',
          features: [
            'Unlimited OCR processing',
            'Unlimited AI chat with PDFs',
            'Unlimited AI summaries',
            'Advanced AI features'
          ]
        };
      
      case 'batchSize':
        return {
          icon: <AlertCircle className="h-12 w-12 text-blue-500" />,
          title: 'Batch Size Limit Exceeded',
          description: `You selected ${current} files, but your plan allows up to ${limit} files per batch.`,
          suggestion: 'Upgrade to Pro for unlimited batch processing.',
          features: [
            'Process unlimited files at once',
            'Bulk operations',
            'Save time with batch processing',
            'No file count restrictions'
          ]
        };
      
      case 'fileSize':
        return {
          icon: <AlertCircle className="h-12 w-12 text-yellow-500" />,
          title: 'File Size Limit Exceeded',
          description: message || `Your file exceeds the ${formatBytes(limit)} limit for ${currentPlan} plan.`,
          suggestion: 'Upgrade to Pro for larger file support.',
          features: [
            'Upload files up to 200MB',
            'Process large documents',
            'No file size worries',
            'Handle enterprise documents'
          ]
        };
      
      default:
        return {
          icon: <AlertCircle className="h-12 w-12 text-gray-500" />,
          title: 'Plan Limit Reached',
          description: message || 'You have reached your plan limit.',
          suggestion: 'Upgrade to Pro for unlimited access.',
          features: [
            'Unlimited access to all features',
            'No restrictions',
            'Priority support',
            'Advanced capabilities'
          ]
        };
    }
  };

  const formatBytes = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    if (bytes === -1) return 'Unlimited';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const info = getLimitInfo();

  const handleUpgrade = () => {
    onClose();
    navigate('/upgrade');
  };

  const handleViewPricing = () => {
    onClose();
    navigate('/pricing');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-card border border-border rounded-3xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto animate-scale-in">
        {/* Header */}
        <div className="relative p-6 border-b border-border">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-full hover:bg-elevated transition-colors"
          >
            <X className="h-5 w-5 text-muted-foreground" />
          </button>
          
          <div className="flex items-start space-x-4">
            <div className="flex-shrink-0">
              {info.icon}
            </div>
            <div className="flex-1">
              <h2 className="text-2xl font-bold text-card-foreground mb-2">
                {info.title}
              </h2>
              <p className="text-muted-foreground">
                {info.description}
              </p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Current Usage */}
          {limit !== undefined && current !== undefined && limitType !== 'batchSize' && limitType !== 'fileSize' && (
            <div className="bg-elevated/50 rounded-2xl p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-muted-foreground">Current Usage</span>
                <span className="text-sm font-semibold text-card-foreground">
                  {limitType === 'storageLimit' ? formatBytes(current) : current} / {limitType === 'storageLimit' ? formatBytes(limit) : limit}
                </span>
              </div>
              <div className="w-full bg-secondary rounded-full h-2 overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-orange-500 to-red-500 transition-all duration-500"
                  style={{ width: `${Math.min((current / limit) * 100, 100)}%` }}
                />
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                {remaining !== undefined && remaining > 0 
                  ? `${limitType === 'storageLimit' ? formatBytes(remaining) : remaining} remaining`
                  : 'Limit reached'}
              </p>
            </div>
          )}

          {/* Suggestion */}
          <div className="bg-gradient-to-br from-purple-500/10 to-blue-500/10 rounded-2xl p-6 border border-purple-500/20">
            <div className="flex items-start space-x-3 mb-4">
              <Crown className="h-6 w-6 text-purple-400 flex-shrink-0 mt-1" />
              <div>
                <h3 className="text-lg font-semibold text-card-foreground mb-2">
                  {info.suggestion}
                </h3>
                <p className="text-sm text-muted-foreground">
                  Get unlimited access to all features with our Pro plan.
                </p>
              </div>
            </div>

            {/* Features */}
            <div className="space-y-2">
              {info.features.map((feature, index) => (
                <div key={index} className="flex items-center space-x-2">
                  <div className="h-1.5 w-1.5 rounded-full bg-purple-400" />
                  <span className="text-sm text-muted-foreground">{feature}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Current Plan Info */}
          <div className="bg-elevated/30 rounded-2xl p-4 border border-border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Current Plan</p>
                <p className="text-lg font-semibold text-card-foreground capitalize">
                  {currentPlan} Plan
                </p>
              </div>
              <Button
                onClick={handleViewPricing}
                variant="ghost"
                size="sm"
                className="text-blue-400 hover:text-blue-300"
              >
                View All Plans
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Alternative Actions */}
          {limitType === 'filesPerMonth' && (
            <div className="bg-blue-500/10 rounded-2xl p-4 border border-blue-500/20">
              <p className="text-sm text-blue-300 mb-2">
                💡 <strong>Tip:</strong> Your limit will reset at the start of next month.
              </p>
              <p className="text-xs text-muted-foreground">
                Or upgrade now to continue processing files without waiting.
              </p>
            </div>
          )}

          {limitType === 'storageLimit' && (
            <div className="bg-blue-500/10 rounded-2xl p-4 border border-blue-500/20">
              <p className="text-sm text-blue-300 mb-2">
                💡 <strong>Tip:</strong> Delete old files to free up space.
              </p>
              <p className="text-xs text-muted-foreground">
                Or upgrade to Pro for unlimited storage.
              </p>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-6 border-t border-border bg-elevated/30">
          <div className="flex flex-col sm:flex-row gap-3">
            <Button
              onClick={onClose}
              variant="outline"
              className="flex-1 btn-dark-outline"
            >
              Maybe Later
            </Button>
            <Button
              onClick={handleUpgrade}
              className="flex-1 btn-purple"
            >
              <Crown className="mr-2 h-4 w-4" />
              Upgrade to Pro
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LimitReachedModal;
