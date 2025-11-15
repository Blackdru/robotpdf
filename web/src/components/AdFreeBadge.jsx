import { Shield, Sparkles } from 'lucide-react';
import { useSubscription } from '../contexts/SubscriptionContext';

/**
 * Ad-Free Badge Component
 * Shows a badge for Basic and Pro users indicating they have an ad-free experience
 */
const AdFreeBadge = ({ variant = 'default', className = '' }) => {
  const { subscription } = useSubscription();

  // Only show for Basic and Pro users
  if (!subscription || subscription.plan === 'free') {
    return null;
  }

  const variants = {
    default: {
      container: 'inline-flex items-center px-3 py-1.5 rounded-full bg-gradient-to-r from-green-500/10 to-emerald-500/10 border border-green-500/20',
      icon: 'h-4 w-4 text-green-500',
      text: 'text-sm font-medium text-green-600 dark:text-green-400'
    },
    compact: {
      container: 'inline-flex items-center px-2 py-1 rounded-full bg-green-500/10 border border-green-500/20',
      icon: 'h-3 w-3 text-green-500',
      text: 'text-xs font-medium text-green-600 dark:text-green-400'
    },
    large: {
      container: 'inline-flex items-center px-4 py-2 rounded-full bg-gradient-to-r from-green-500/10 to-emerald-500/10 border border-green-500/20',
      icon: 'h-5 w-5 text-green-500',
      text: 'text-base font-semibold text-green-600 dark:text-green-400'
    },
    banner: {
      container: 'flex items-center justify-center px-6 py-3 rounded-lg bg-gradient-to-r from-green-500/10 to-emerald-500/10 border border-green-500/20',
      icon: 'h-6 w-6 text-green-500',
      text: 'text-lg font-bold text-green-600 dark:text-green-400'
    }
  };

  const style = variants[variant] || variants.default;

  return (
    <div className={`${style.container} ${className}`}>
      <Shield className={`${style.icon} mr-2`} />
      <span className={style.text}>Ad-Free Experience</span>
      <Sparkles className={`${style.icon} ml-2`} />
    </div>
  );
};

/**
 * Ad-Free Banner Component
 * Shows a prominent banner for Basic and Pro users
 */
export const AdFreeBanner = ({ className = '' }) => {
  const { subscription } = useSubscription();

  // Only show for Basic and Pro users
  if (!subscription || subscription.plan === 'free') {
    return null;
  }

  return (
    <div className={`bg-gradient-to-r from-green-500/10 via-emerald-500/10 to-teal-500/10 border border-green-500/20 rounded-2xl p-6 ${className}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="flex-shrink-0">
            <div className="h-12 w-12 rounded-full bg-green-500/20 flex items-center justify-center">
              <Shield className="h-6 w-6 text-green-500" />
            </div>
          </div>
          <div>
            <h3 className="text-lg font-semibold text-card-foreground flex items-center">
              Ad-Free Experience
              <Sparkles className="h-5 w-5 text-green-500 ml-2" />
            </h3>
            <p className="text-sm text-muted-foreground">
              Enjoy RobotPDF without any advertisements as a {subscription.plan.charAt(0).toUpperCase() + subscription.plan.slice(1)} member
            </p>
          </div>
        </div>
        <div className="hidden md:block">
          <div className="px-4 py-2 rounded-full bg-green-500/20 border border-green-500/30">
            <span className="text-sm font-semibold text-green-600 dark:text-green-400">
              Premium Feature
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

/**
 * Ad-Free Notice Component
 * Small notice that can be placed anywhere
 */
export const AdFreeNotice = ({ className = '' }) => {
  const { subscription } = useSubscription();

  // Only show for Basic and Pro users
  if (!subscription || subscription.plan === 'free') {
    return null;
  }

  return (
    <div className={`flex items-center space-x-2 text-sm text-muted-foreground ${className}`}>
      <Shield className="h-4 w-4 text-green-500" />
      <span>No ads for {subscription.plan} users</span>
    </div>
  );
};

export default AdFreeBadge;
