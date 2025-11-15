import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Progress } from './ui/progress'
import { Loader2, CheckCircle, AlertCircle, Clock, FileText, Upload, Download } from 'lucide-react'
import { useState, useEffect } from 'react'

const ProcessingModal = ({ 
  isOpen, 
  title, 
  fileName, 
  progress = 0, 
  stage = 'Initializing...', 
  icon: Icon,
  description,
  steps = [],
  currentStep = 0,
  estimatedTime = null,
  onCancel = null
}) => {
  const [elapsedTime, setElapsedTime] = useState(0)
  const [startTime] = useState(Date.now())

  useEffect(() => {
    if (!isOpen) {
      setElapsedTime(0)
      return
    }

    const interval = setInterval(() => {
      setElapsedTime(Math.floor((Date.now() - startTime) / 1000))
    }, 1000)

    return () => clearInterval(interval)
  }, [isOpen, startTime])

  if (!isOpen) return null

  const isCompleted = progress >= 100
  const isError = stage?.toLowerCase().includes('error') || stage?.toLowerCase().includes('failed')
  const isWarning = stage?.toLowerCase().includes('warning')

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const getProgressColor = () => {
    if (isCompleted) return 'from-green-500 to-green-600'
    if (isError) return 'from-red-500 to-red-600'
    if (isWarning) return 'from-yellow-500 to-yellow-600'
    return 'from-blue-500 to-blue-600'
  }

  const getIconColor = () => {
    if (isCompleted) return 'text-green-400'
    if (isError) return 'text-red-400'
    if (isWarning) return 'text-yellow-400'
    return 'text-blue-400'
  }

  const getBgColor = () => {
    if (isCompleted) return 'bg-green-800'
    if (isError) return 'bg-red-800'
    if (isWarning) return 'bg-yellow-800'
    return 'bg-blue-800'
  }

  // Default processing steps if none provided
  const defaultSteps = [
    { name: 'Uploading', icon: Upload },
    { name: 'Processing', icon: FileText },
    { name: 'Finalizing', icon: CheckCircle },
    { name: 'Complete', icon: Download }
  ]

  const processingSteps = steps.length > 0 ? steps : defaultSteps

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 z-50 animate-in fade-in duration-200">
      <Card className="bg-white border border-gray-200 rounded-xl sm:rounded-2xl shadow-2xl w-full max-w-[96vw] sm:max-w-md max-h-[92vh] overflow-y-auto modern-scrollbar animate-in slide-in-from-bottom duration-300">
        <CardHeader className="px-4 py-4 border-b border-gray-200 text-center bg-gradient-to-r from-indigo-50 to-purple-50">
          <div className={`mx-auto mb-3 w-12 h-12 rounded-xl flex items-center justify-center transition-all duration-500 ${
            isCompleted ? 'bg-gradient-to-br from-emerald-500 to-green-600' : 
            isError ? 'bg-gradient-to-br from-red-500 to-red-600' : 
            'bg-gradient-to-br from-indigo-500 to-purple-600'
          }`}>
            {isCompleted ? (
              <CheckCircle className="h-6 w-6 text-white" />
            ) : isError ? (
              <AlertCircle className="h-6 w-6 text-white" />
            ) : (
              <Icon className="h-6 w-6 text-white" />
            )}
          </div>
          <CardTitle className="text-base font-bold text-gray-900 mb-1">{title}</CardTitle>
          <p className="text-xs text-gray-600 break-words line-clamp-1">
            {fileName}
          </p>
          
          {/* Time indicators */}
          <div className="flex justify-center items-center gap-2 mt-2 text-xs font-semibold text-gray-600">
            <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-white border border-gray-200">
              <Clock className="h-3 w-3" />
              <span>{formatTime(elapsedTime)}</span>
            </div>
            {estimatedTime && !isCompleted && (
              <div className="px-2 py-1 rounded-full bg-white border border-gray-200">
                <span>ETA: {formatTime(Math.max(0, estimatedTime - elapsedTime))}</span>
              </div>
            )}
          </div>
        </CardHeader>
        
        <CardContent className="px-4 py-4 space-y-3">
          {/* Progress Section */}
          <div className="space-y-2">
            <div className="flex items-center justify-between gap-2">
              <span className="flex items-center flex-1 min-w-0 gap-1.5">
                {!isCompleted && !isError && (
                  <Loader2 className="h-3.5 w-3.5 animate-spin flex-shrink-0 text-indigo-600" />
                )}
                <span className="text-xs font-semibold text-gray-900 truncate">{stage}</span>
              </span>
              <span className={`font-bold text-sm ${
                isCompleted ? 'text-emerald-600' : isError ? 'text-red-600' : 'text-indigo-600'
              }`}>
                {Math.round(progress)}%
              </span>
            </div>
            
            {/* Enhanced Progress Bar */}
            <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
              <div 
                className={`h-full transition-all duration-500 ease-out ${
                  isCompleted ? 'bg-gradient-to-r from-emerald-500 to-green-600' : 
                  isError ? 'bg-gradient-to-r from-red-500 to-red-600' : 
                  'bg-gradient-to-r from-indigo-500 to-purple-600'
                }`}
                style={{ width: `${Math.min(progress, 100)}%` }}
              >
              </div>
            </div>
          </div>

          {/* Processing Steps */}
          {processingSteps.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-xs font-semibold text-gray-900">Steps</h4>
              <div className="space-y-1.5">
                {processingSteps.map((step, index) => {
                  const StepIcon = step.icon || FileText
                  const isCurrentStep = index === currentStep
                  const isCompletedStep = index < currentStep || isCompleted
                  
                  return (
                    <div 
                      key={index}
                      className={`flex items-center space-x-2 p-2 rounded-lg transition-all duration-300 ${
                        isCurrentStep ? 'bg-indigo-50 border border-indigo-300' :
                        isCompletedStep ? 'bg-emerald-50 border border-emerald-300' :
                        'bg-gray-50 border border-gray-200'
                      }`}
                    >
                      <div className={`w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0 ${
                        isCompletedStep ? 'bg-emerald-500' :
                        isCurrentStep ? 'bg-indigo-500' :
                        'bg-gray-300'
                      }`}>
                        {isCompletedStep ? (
                          <CheckCircle className="h-3 w-3 text-white" />
                        ) : isCurrentStep ? (
                          <Loader2 className="h-3 w-3 text-white animate-spin" />
                        ) : (
                          <StepIcon className="h-3 w-3 text-gray-500" />
                        )}
                      </div>
                      <span className={`text-xs font-semibold truncate ${
                        isCompletedStep ? 'text-emerald-700' :
                        isCurrentStep ? 'text-indigo-700' :
                        'text-gray-500'
                      }`}>
                        {step.name}
                      </span>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Description */}
          {description && (
            <div className="flex items-center justify-center text-xs text-muted-foreground bg-gray-700/50 rounded-lg p-2 sm:p-3">
              <Icon className="h-3 w-3 sm:h-4 sm:w-4 mr-2 flex-shrink-0" />
              <span className="text-center">{description}</span>
            </div>
          )}

          {/* Status Message */}
          <div className="text-center">
            {isCompleted ? (
              <div className="px-3 py-2 rounded-lg bg-emerald-50 border border-emerald-200">
                <div className="text-emerald-700 text-sm font-semibold flex items-center justify-center gap-1.5">
                  <CheckCircle className="h-4 w-4" />
                  <span>Complete!</span>
                </div>
              </div>
            ) : isError ? (
              <div className="px-3 py-2 rounded-lg bg-red-50 border border-red-200">
                <div className="text-red-700 text-sm font-semibold flex items-center justify-center gap-1.5">
                  <AlertCircle className="h-4 w-4" />
                  <span>Failed</span>
                </div>
              </div>
            ) : (
              <div className="px-3 py-2 rounded-lg bg-indigo-50 border border-indigo-200">
                <div className="text-indigo-700 text-sm font-semibold flex items-center justify-center gap-1.5">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Processing...</span>
                </div>
              </div>
            )}
          </div>

          {/* Cancel Button */}
          {onCancel && !isCompleted && !isError && (
            <div className="text-center pt-1">
              <button
                onClick={onCancel}
                className="text-xs text-secondary hover:text-card-foreground transition-colors"
              >
                Cancel
              </button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

export default ProcessingModal