import { useState, useEffect } from 'react'
import { X, Lock, Key, Shield, Eye, EyeOff, RefreshCw, ChevronDown, ChevronUp, Settings } from 'lucide-react'
import { Button } from './ui/button'

const PasswordProtectModal = ({ isOpen, onClose, onConfirm, fileCount = 1 }) => {
  const [passwordType, setPasswordType] = useState('auto') // 'auto' or 'custom'
  const [customPassword, setCustomPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [encryptionLevel, setEncryptionLevel] = useState('256-bit')
  const [showAdvanced, setShowAdvanced] = useState(false)
  const [permissions, setPermissions] = useState({
    allowPrinting: true,
    allowCopying: false,
    allowEditing: false,
    allowAnnotations: false,
    printingHighRes: false,
    fillingForms: true,
    extracting: false,
    assembling: false
  })

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setPasswordType('auto')
      setCustomPassword('')
      setShowPassword(false)
      setEncryptionLevel('256-bit')
      setShowAdvanced(false)
      setPermissions({
        allowPrinting: true,
        allowCopying: false,
        allowEditing: false,
        allowAnnotations: false,
        printingHighRes: false,
        fillingForms: true,
        extracting: false,
        assembling: false
      })
    }
  }, [isOpen])

  const handleClose = () => {
    setPasswordType('auto')
    setCustomPassword('')
    setShowPassword(false)
    setShowAdvanced(false)
    onClose()
  }

  const generatePassword = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*'
    let password = ''
    for (let i = 0; i < 16; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    setCustomPassword(password)
    setPasswordType('custom')
  }

  const handleConfirm = () => {
    if (passwordType === 'custom') {
      if (!customPassword) {
        return
      }
      if (customPassword.length < 6) {
        alert('Password must be at least 6 characters long')
        return
      }
    }

    onConfirm({
      passwordType,
      customPassword: passwordType === 'custom' ? customPassword : null,
      encryptionLevel,
      ...permissions
    })
    
    // Clear sensitive data after confirming
    setCustomPassword('')
    setShowPassword(false)
    onClose()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-2 sm:p-4">
      <div className="bg-surface rounded-2xl shadow-2xl max-w-2xl w-full max-h-[95vh] sm:max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-gradient-to-r from-red-500 to-pink-700 text-white p-4 sm:p-6 rounded-t-2xl z-10">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 sm:gap-3 min-w-0">
              <div className="p-1.5 sm:p-2 bg-white/20 rounded-lg flex-shrink-0">
                <Lock className="w-5 h-5 sm:w-6 sm:h-6" />
              </div>
              <div className="min-w-0">
                <h2 className="text-lg sm:text-2xl font-bold truncate">Password Protect PDF</h2>
                <p className="text-white/90 text-xs sm:text-sm mt-0.5 sm:mt-1">
                  Secure {fileCount} {fileCount === 1 ? 'file' : 'files'} with encryption
                </p>
              </div>
            </div>
            <button
              onClick={handleClose}
              className="p-1.5 sm:p-2 hover:bg-white/20 rounded-lg transition-colors flex-shrink-0"
            >
              <X className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
          {/* Password Type Selection */}
          <div className="space-y-2 sm:space-y-3">
            <label className="block text-xs sm:text-sm font-semibold text-card-foreground">
              Password Type
            </label>
            <div className="grid grid-cols-2 gap-2 sm:gap-3">
              <button
                onClick={() => setPasswordType('auto')}
                className={`p-3 sm:p-4 rounded-xl border-2 transition-all ${
                  passwordType === 'auto'
                    ? 'border-red-500 bg-red-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <Key className="w-4 h-4 sm:w-5 sm:h-5 mx-auto mb-1.5 sm:mb-2 text-red-600" />
                <div className="text-xs sm:text-sm font-medium">Auto Generate</div>
                <div className="text-[10px] sm:text-xs text-gray-500 mt-0.5 sm:mt-1">Secure random password</div>
              </button>
              <button
                onClick={() => setPasswordType('custom')}
                className={`p-3 sm:p-4 rounded-xl border-2 transition-all ${
                  passwordType === 'custom'
                    ? 'border-red-500 bg-red-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <Shield className="w-4 h-4 sm:w-5 sm:h-5 mx-auto mb-1.5 sm:mb-2 text-red-600" />
                <div className="text-xs sm:text-sm font-medium">Custom Password</div>
                <div className="text-[10px] sm:text-xs text-gray-500 mt-0.5 sm:mt-1">Choose your own</div>
              </button>
            </div>
          </div>

          {/* Custom Password Input */}
          {passwordType === 'custom' && (
            <div className="space-y-3">
              <label className="block text-sm font-semibold text-gray-700">
                Enter Password <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={customPassword}
                  onChange={(e) => setCustomPassword(e.target.value)}
                  placeholder="Minimum 6 characters"
                  minLength={6}
                  className="w-full px-4 py-3 pr-24 bg-elevated border-2 border-border rounded-xl focus:border-red-500 focus:outline-none text-card-foreground"
                />
                <div className="absolute right-2 top-1/2 -translate-y-1/2 flex gap-1">
                  <button
                    type="button"
                    onClick={generatePassword}
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                    title="Generate password"
                  >
                    <RefreshCw className="w-4 h-4 text-gray-600" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    {showPassword ? (
                      <EyeOff className="w-4 h-4 text-gray-600" />
                    ) : (
                      <Eye className="w-4 h-4 text-gray-600" />
                    )}
                  </button>
                </div>
              </div>
              {customPassword && (
                <div className="text-xs">
                  {customPassword.length < 6 ? (
                    <span className="text-red-600">❌ Too short (minimum 6 characters)</span>
                  ) : customPassword.length < 8 ? (
                    <span className="text-orange-600">⚠️ Weak - Consider longer password</span>
                  ) : customPassword.length < 12 ? (
                    <span className="text-yellow-600">⚠️ Medium - Good but could be stronger</span>
                  ) : (
                    <span className="text-green-600">✅ Strong password</span>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Encryption Level */}
          <div className="space-y-3">
            <label className="block text-sm font-semibold text-gray-700">
              Encryption Level
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => setEncryptionLevel('128-bit')}
                className={`p-3 rounded-xl border-2 transition-all ${
                  encryptionLevel === '128-bit'
                    ? 'border-red-500 bg-red-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="text-sm font-medium">128-bit</div>
                <div className="text-xs text-gray-500">Standard</div>
              </button>
              <button
                onClick={() => setEncryptionLevel('256-bit')}
                className={`p-3 rounded-xl border-2 transition-all ${
                  encryptionLevel === '256-bit'
                    ? 'border-red-500 bg-red-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="text-sm font-medium">256-bit</div>
                <div className="text-xs text-gray-500">Military Grade</div>
              </button>
            </div>
          </div>

          {/* Permissions */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="block text-sm font-semibold text-gray-700">
                Document Permissions
              </label>
              <button
                type="button"
                onClick={() => setShowAdvanced(!showAdvanced)}
                className="flex items-center gap-2 text-sm text-red-600 hover:text-red-700 font-medium"
              >
                <Settings className="w-4 h-4" />
                {showAdvanced ? 'Hide' : 'Show'} Advanced
                {showAdvanced ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </button>
            </div>
            
            {/* Basic Permissions */}
            <div className="space-y-2">
              {[
                { key: 'allowPrinting', label: 'Allow Printing', icon: '🖨️', desc: 'Users can print the document' },
                { key: 'allowCopying', label: 'Allow Copying Text', icon: '📋', desc: 'Users can copy text content' },
                { key: 'allowEditing', label: 'Allow Editing', icon: '✏️', desc: 'Users can modify the document' },
                { key: 'allowAnnotations', label: 'Allow Annotations', icon: '📝', desc: 'Users can add comments' }
              ].map(({ key, label, icon, desc }) => (
                <label
                  key={key}
                  className="flex items-center gap-3 p-3 rounded-xl border-2 border-border hover:border-accent cursor-pointer transition-all bg-elevated"
                >
                  <input
                    type="checkbox"
                    checked={permissions[key]}
                    onChange={(e) =>
                      setPermissions({ ...permissions, [key]: e.target.checked })
                    }
                    className="w-5 h-5 text-red-600 rounded focus:ring-red-500"
                  />
                  <span className="text-2xl">{icon}</span>
                  <div className="flex-1">
                    <div className="text-sm font-medium text-card-foreground">{label}</div>
                    <div className="text-xs text-muted-foreground">{desc}</div>
                  </div>
                </label>
              ))}
            </div>

            {/* Advanced Permissions */}
            {showAdvanced && (
              <div className="space-y-2 pt-2 border-t-2 border-gray-100">
                <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                  Advanced Permissions
                </div>
                {[
                  { key: 'printingHighRes', label: 'High-Resolution Printing', icon: '🖨️', desc: 'Allow high-quality printing' },
                  { key: 'fillingForms', label: 'Form Filling', icon: '📄', desc: 'Users can fill form fields' },
                  { key: 'extracting', label: 'Content Extraction', icon: '📤', desc: 'Allow extracting pages/content' },
                  { key: 'assembling', label: 'Document Assembly', icon: '🔧', desc: 'Allow inserting/rotating pages' }
                ].map(({ key, label, icon, desc }) => (
                  <label
                    key={key}
                    className="flex items-center gap-3 p-3 rounded-xl border-2 border-gray-200 hover:border-gray-300 cursor-pointer transition-all bg-gray-50"
                  >
                    <input
                      type="checkbox"
                      checked={permissions[key]}
                      onChange={(e) =>
                        setPermissions({ ...permissions, [key]: e.target.checked })
                      }
                      className="w-5 h-5 text-red-600 rounded focus:ring-red-500"
                    />
                    <span className="text-2xl">{icon}</span>
                    <div className="flex-1">
                      <div className="text-sm font-medium text-gray-700">{label}</div>
                      <div className="text-xs text-gray-500">{desc}</div>
                    </div>
                  </label>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-elevated px-4 sm:px-6 py-3 sm:py-4 rounded-b-2xl border-t border-border flex gap-2 sm:gap-3 z-10">
          <Button
            onClick={handleClose}
            variant="outline"
            className="flex-1 text-sm sm:text-base py-2 sm:py-2.5"
          >
            Cancel
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={passwordType === 'custom' && (!customPassword || customPassword.length < 6)}
            className="flex-1 bg-gradient-to-r from-red-500 to-pink-700 hover:from-red-600 hover:to-pink-800 text-sm sm:text-base py-2 sm:py-2.5"
          >
            <Lock className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1.5 sm:mr-2" />
            <span className="hidden sm:inline">Protect {fileCount} {fileCount === 1 ? 'File' : 'Files'}</span>
            <span className="sm:hidden">Protect</span>
          </Button>
        </div>
      </div>
    </div>
  )
}

export default PasswordProtectModal
