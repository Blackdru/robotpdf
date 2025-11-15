import { useState } from 'react'
import { useSubscription } from '../contexts/SubscriptionContext'

// Define which tools require which subscription levels
const TOOL_REQUIREMENTS = {
  // Basic tools - available to all users
  'merge': 'free',
  'split': 'free', 
  'compress': 'free',
  'convert': 'free',
  
  // Pro tools - require pro or premium
  'ocr': 'pro',
  'ai-chat': 'pro',
  'advanced-ocr': 'pro',
  'smart-summary': 'pro',
  'pro-merge': 'pro',
  'precision-split': 'pro',
  'smart-compress': 'pro',
  'images-to-pdf': 'pro',
  'pdf-to-office': 'pro',
  'office-to-pdf': 'pro',
  'advanced-html-to-pdf': 'pro',
  'password-protect': 'pro',
  
  // Premium tools - require premium
  'encrypt-pro': 'pro',
  'digital-sign': 'pro',
  'batch-advanced': 'premium',
  'api-access': 'premium'
}

// Plan hierarchy for comparison
const PLAN_HIERARCHY = {
  'free': 0,
  'pro': 1, 
  'premium': 2
}

export const useSubscriptionAccess = () => {
  const { subscription } = useSubscription()
  const [showUpgradeModal, setShowUpgradeModal] = useState(false)
  const [upgradeModalData, setUpgradeModalData] = useState({})

  const getCurrentPlan = () => {
    return subscription?.plan || 'free'
  }

  const getCurrentPlanLevel = () => {
    return PLAN_HIERARCHY[getCurrentPlan()] || 0
  }

  const getRequiredPlanLevel = (toolId) => {
    const requiredPlan = TOOL_REQUIREMENTS[toolId] || 'free'
    return PLAN_HIERARCHY[requiredPlan] || 0
  }

  const hasAccess = (toolId) => {
    const currentLevel = getCurrentPlanLevel()
    const requiredLevel = getRequiredPlanLevel(toolId)
    return currentLevel >= requiredLevel
  }

  const checkAccess = (toolId, toolName = '', toolDescription = '') => {
    if (hasAccess(toolId)) {
      return true
    }

    // Show upgrade modal if access is denied
    const requiredPlan = TOOL_REQUIREMENTS[toolId] || 'pro'
    setUpgradeModalData({
      requiredPlan,
      feature: toolName,
      description: toolDescription,
      toolId
    })
    setShowUpgradeModal(true)
    return false
  }

  const closeUpgradeModal = () => {
    setShowUpgradeModal(false)
    setUpgradeModalData({})
  }

  const getAccessLevel = (toolId) => {
    const requiredPlan = TOOL_REQUIREMENTS[toolId] || 'free'
    return {
      required: requiredPlan,
      current: getCurrentPlan(),
      hasAccess: hasAccess(toolId),
      needsUpgrade: !hasAccess(toolId)
    }
  }

  const filterToolsByAccess = (tools) => {
    return tools.map(tool => ({
      ...tool,
      hasAccess: hasAccess(tool.id),
      requiredPlan: TOOL_REQUIREMENTS[tool.id] || 'free'
    }))
  }

  const getUpgradeMessage = (toolId) => {
    const requiredPlan = TOOL_REQUIREMENTS[toolId] || 'pro'
    const currentPlan = getCurrentPlan()
    
    if (currentPlan === 'free') {
      if (requiredPlan === 'pro') {
        return 'Upgrade to Pro ($1/month) to access this feature'
      } else if (requiredPlan === 'premium') {
        return 'Upgrade to Premium ($10/month) to access this feature'
      }
    } else if (currentPlan === 'pro' && requiredPlan === 'premium') {
      return 'Upgrade to Premium ($10/month) to access this feature'
    }
    
    return 'Upgrade your plan to access this feature'
  }

  return {
    // Access control
    hasAccess,
    checkAccess,
    getAccessLevel,
    filterToolsByAccess,
    
    // Plan info
    getCurrentPlan,
    getCurrentPlanLevel,
    getRequiredPlanLevel,
    getUpgradeMessage,
    
    // Modal control
    showUpgradeModal,
    upgradeModalData,
    closeUpgradeModal,
    
    // Utility
    TOOL_REQUIREMENTS,
    PLAN_HIERARCHY
  }
}