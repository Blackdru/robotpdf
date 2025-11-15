import { Progress } from '../ui/progress'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card'
import { Badge } from '../ui/badge'
import { useSubscription } from '../../contexts/SubscriptionContext'
import { 
  FileText, 
  HardDrive, 
  Brain, 
  Zap,
  AlertTriangle,
  CheckCircle 
} from 'lucide-react'

const UsageIndicator = ({ showTitle = true, compact = false }) => {
  const { 
    subscription, 
    usage, 
    getUsagePercentage, 
    getRemainingLimit, 
    formatFileSize, 
    formatNumber 
  } = useSubscription()

  if (!subscription || !usage) {
    return (
      <Card className={compact ? 'p-4' : ''}>
        <CardContent className={compact ? 'p-0' : ''}>
          <div className="text-center text-muted-foreground">
            Loading usage data...
          </div>
        </CardContent>
      </Card>
    )
  }

  const usageItems = [
    {
      key: 'filesPerMonth',
      label: 'Files Processed',
      icon: FileText,
      current: usage.usage.files_processed,
      limit: subscription.planLimits.filesPerMonth,
      unit: 'files',
      color: 'blue'
    },
    {
      key: 'storageLimit',
      label: 'Storage Used',
      icon: HardDrive,
      current: usage.usage.storage_used,
      limit: subscription.planLimits.storageLimit,
      unit: 'bytes',
      color: 'green'
    },
    {
      key: 'aiOperations',
      label: 'AI Operations',
      icon: Brain,
      current: usage.usage.ai_operations,
      limit: subscription.planLimits.aiOperations,
      unit: 'operations',
      color: 'purple'
    }
  ]

  // Add API calls for pro/premium plans
  if (subscription.planLimits.apiCalls > 0) {
    usageItems.push({
      key: 'apiCalls',
      label: 'API Calls',
      icon: Zap,
      current: usage.usage.api_calls,
      limit: subscription.planLimits.apiCalls,
      unit: 'calls',
      color: 'pink'
    })
  }

  const getStatusColor = (percentage) => {
    if (percentage >= 90) return 'text-red-500'
    if (percentage >= 75) return 'text-pink-500'
    return 'text-green-500'
  }

  const getProgressColor = (percentage) => {
    if (percentage >= 90) return 'bg-red-500'
    if (percentage >= 75) return 'bg-pink-500'
    return 'bg-blue-500'
  }

  const formatValue = (value, unit) => {
    if (unit === 'bytes') return formatFileSize(value)
    return formatNumber(value)
  }

  const formatLimit = (limit, unit) => {
    if (limit === -1) return 'Unlimited'
    if (unit === 'bytes') return formatFileSize(limit)
    return formatNumber(limit)
  }

  if (compact) {
    return (
      <div className="space-y-3">
        {usageItems.map((item) => {
          const percentage = getUsagePercentage(item.key)
          const Icon = item.icon
          
          return (
            <div key={item.key} className="flex items-center gap-3">
              <Icon className={`h-4 w-4 text-${item.color}-500`} />
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between text-sm mb-1">
                  <span className="font-medium">{item.label}</span>
                  <span className={getStatusColor(percentage)}>
                    {formatValue(item.current, item.unit)} / {formatLimit(item.limit, item.unit)}
                  </span>
                </div>
                {item.limit !== -1 && (
                  <Progress 
                    value={percentage} 
                    className="h-2"
                    indicatorClassName={getProgressColor(percentage)}
                  />
                )}
              </div>
            </div>
          )
        })}
      </div>
    )
  }

  return (
    <Card>
      {showTitle && (
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-green-500" />
            Usage Overview
            <Badge variant="outline" className="ml-auto">
              {subscription.plan.charAt(0).toUpperCase() + subscription.plan.slice(1)} Plan
            </Badge>
          </CardTitle>
        </CardHeader>
      )}
      
      <CardContent className="space-y-6">
        {usageItems.map((item) => {
          const percentage = getUsagePercentage(item.key)
          const remaining = getRemainingLimit(item.key)
          const Icon = item.icon
          const isNearLimit = percentage >= 75
          const isOverLimit = percentage >= 90
          
          return (
            <div key={item.key} className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Icon className={`h-4 w-4 text-${item.color}-500`} />
                  <span className="font-medium">{item.label}</span>
                  {isOverLimit && (
                    <AlertTriangle className="h-4 w-4 text-red-500" />
                  )}
                </div>
                <div className="text-right">
                  <div className={`text-sm font-medium ${getStatusColor(percentage)}`}>
                    {formatValue(item.current, item.unit)} / {formatLimit(item.limit, item.unit)}
                  </div>
                  {item.limit !== -1 && remaining >= 0 && (
                    <div className="text-xs text-muted-foreground">
                      {formatValue(remaining, item.unit)} remaining
                    </div>
                  )}
                </div>
              </div>
              
              {item.limit !== -1 && (
                <div className="space-y-1">
                  <Progress 
                    value={percentage} 
                    className="h-2"
                    indicatorClassName={getProgressColor(percentage)}
                  />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>0</span>
                    <span>{percentage.toFixed(1)}% used</span>
                    <span>{formatLimit(item.limit, item.unit)}</span>
                  </div>
                </div>
              )}
              
              {isNearLimit && item.limit !== -1 && (
                <div className={`text-xs p-2 rounded-md ${
                  isOverLimit 
                    ? 'bg-red-50 text-red-700 border border-red-200' 
                    : 'bg-pink-50 text-pink-700 border border-pink-200'
                }`}>
                  {isOverLimit 
                    ? `You've reached your ${item.label.toLowerCase()} limit. Consider upgrading your plan.`
                    : `You're approaching your ${item.label.toLowerCase()} limit.`
                  }
                </div>
              )}
            </div>
          )
        })}
        
        <div className="pt-4 border-t">
          <div className="text-xs text-muted-foreground text-center">
            Usage resets monthly on your billing cycle
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export default UsageIndicator