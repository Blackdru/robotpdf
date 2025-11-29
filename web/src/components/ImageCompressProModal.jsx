import { useState } from 'react'
import { X, Image, Zap, Target, Info, Settings } from 'lucide-react'
import { Button } from './ui/button'

const ImageCompressProModal = ({ isOpen, onClose, onConfirm, fileCount }) => {
  const [compressionMode, setCompressionMode] = useState('quality')
  const [imageQuality, setImageQuality] = useState(50)
  const [targetSizeKB, setTargetSizeKB] = useState(500)
  const [minQuality, setMinQuality] = useState(30)
  const [outputFormat, setOutputFormat] = useState('original')
  const [preserveMetadata, setPreserveMetadata] = useState(false)
  const [resizeImage, setResizeImage] = useState(false)
  const [maxDimension, setMaxDimension] = useState(1920)

  if (!isOpen) return null

  const handleConfirm = () => {
    onConfirm({
      compressionMode,
      imageQuality,
      targetSizeKB: compressionMode === 'size' ? targetSizeKB : null,
      minQuality,
      outputFormat,
      preserveMetadata,
      resizeImage,
      maxDimension: resizeImage ? maxDimension : null
    })
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-2 sm:p-4">
      <div className="bg-white rounded-xl sm:rounded-2xl shadow-2xl max-w-2xl w-full max-h-[95vh] sm:max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-6 border-b border-gray-200 bg-gradient-to-r from-pink-50 to-rose-50">
          <div className="flex items-center space-x-2 sm:space-x-3">
            <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-pink-600 to-rose-600 rounded-lg sm:rounded-xl flex items-center justify-center">
              <Image className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
            </div>
            <div>
              <h2 className="text-base sm:text-xl font-bold text-gray-900">Pro Image Compression</h2>
              <p className="text-xs sm:text-sm text-gray-500">{fileCount} image(s) selected</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors flex-shrink-0"
          >
            <X className="h-5 w-5 sm:h-6 sm:w-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
          {/* Compression Mode */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-3">
              Compression Mode
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                onClick={() => setCompressionMode('quality')}
                className={`p-3 sm:p-4 rounded-lg sm:rounded-xl border-2 transition-all ${
                  compressionMode === 'quality'
                    ? 'border-pink-500 bg-pink-50'
                    : 'border-gray-200 hover:border-pink-300'
                }`}
              >
                <Zap className={`h-5 w-5 sm:h-6 sm:w-6 mx-auto mb-2 ${
                  compressionMode === 'quality' ? 'text-pink-600' : 'text-gray-400'
                }`} />
                <div className="text-sm font-semibold text-gray-900">Quality Based</div>
                <div className="text-xs text-gray-500 mt-1">Set compression quality</div>
              </button>
              <button
                onClick={() => setCompressionMode('size')}
                className={`p-3 sm:p-4 rounded-lg sm:rounded-xl border-2 transition-all ${
                  compressionMode === 'size'
                    ? 'border-pink-500 bg-pink-50'
                    : 'border-gray-200 hover:border-pink-300'
                }`}
              >
                <Target className={`h-5 w-5 sm:h-6 sm:w-6 mx-auto mb-2 ${
                  compressionMode === 'size' ? 'text-pink-600' : 'text-gray-400'
                }`} />
                <div className="text-sm font-semibold text-gray-900">Target Size</div>
                <div className="text-xs text-gray-500 mt-1">Set target file size</div>
              </button>
            </div>
          </div>

          {/* Quality Slider (for quality mode) */}
          {compressionMode === 'quality' && (
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Compression Quality: {imageQuality}%
              </label>
              <input
                type="range"
                min="30"
                max="100"
                value={imageQuality}
                onChange={(e) => setImageQuality(parseInt(e.target.value))}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-pink-600"
              />
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span className="hidden sm:inline">Lower quality (smaller file)</span>
                <span className="sm:hidden">Lower</span>
                <span className="hidden sm:inline">Higher quality (larger file)</span>
                <span className="sm:hidden">Higher</span>
              </div>
            </div>
          )}

          {/* Target Size Input (for size mode) */}
          {compressionMode === 'size' && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Target File Size (KB)
                </label>
                <input
                  type="number"
                  min="50"
                  max="5000"
                  value={targetSizeKB}
                  onChange={(e) => setTargetSizeKB(parseInt(e.target.value) || 500)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                  placeholder="e.g., 500"
                />
                <p className="text-xs text-gray-500 mt-1">
                  The tool will compress the image to approximately this size
                </p>
              </div>
              
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Minimum Quality: {minQuality}%
                </label>
                <input
                  type="range"
                  min="10"
                  max="80"
                  value={minQuality}
                  onChange={(e) => setMinQuality(parseInt(e.target.value))}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-pink-600"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Minimum quality threshold to maintain visual integrity
                </p>
              </div>
            </div>
          )}

          {/* Output Format */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Output Format
            </label>
            <select
              value={outputFormat}
              onChange={(e) => setOutputFormat(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
            >
              <option value="original">Keep Original Format</option>
              <option value="jpeg">JPEG (Best for photos)</option>
              <option value="png">PNG (Best for graphics)</option>
              <option value="webp">WebP (Modern format, best compression)</option>
            </select>
          </div>

          {/* Advanced Options */}
          <div className="border-t border-gray-200 pt-4">
            <div className="flex items-center space-x-2 mb-4">
              <Settings className="h-5 w-5 text-gray-600" />
              <h3 className="text-sm font-semibold text-gray-700">Advanced Options</h3>
            </div>
            
            <div className="space-y-3">
              {/* Preserve Metadata */}
              <label className="flex items-center space-x-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={preserveMetadata}
                  onChange={(e) => setPreserveMetadata(e.target.checked)}
                  className="w-4 h-4 text-pink-600 border-gray-300 rounded focus:ring-pink-500"
                />
                <div>
                  <div className="text-sm font-medium text-gray-900">Preserve Metadata</div>
                  <div className="text-xs text-gray-500">Keep EXIF data, camera info, etc.</div>
                </div>
              </label>

              {/* Resize Image */}
              <label className="flex items-center space-x-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={resizeImage}
                  onChange={(e) => setResizeImage(e.target.checked)}
                  className="w-4 h-4 text-pink-600 border-gray-300 rounded focus:ring-pink-500"
                />
                <div>
                  <div className="text-sm font-medium text-gray-900">Resize Image</div>
                  <div className="text-xs text-gray-500">Reduce dimensions for smaller file size</div>
                </div>
              </label>

              {/* Max Dimension (only if resize is enabled) */}
              {resizeImage && (
                <div className="ml-7">
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Max Dimension (px)
                  </label>
                  <input
                    type="number"
                    min="480"
                    max="4096"
                    step="100"
                    value={maxDimension}
                    onChange={(e) => setMaxDimension(parseInt(e.target.value) || 1920)}
                    className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Maximum width or height (maintains aspect ratio)
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Info Box */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 sm:p-4 flex items-start space-x-2 sm:space-x-3">
            <Info className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div className="text-xs sm:text-sm text-blue-800">
              <p className="font-semibold mb-1">Pro Compression Tips:</p>
              <ul className="list-disc list-inside space-y-1 text-xs">
                <li>Target size mode finds optimal quality automatically</li>
                <li className="hidden sm:list-item">WebP format provides 25-35% better compression than JPEG</li>
                <li>Resizing large images reduces file size</li>
                <li className="hidden sm:list-item">Minimum quality prevents over-compression artifacts</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end space-x-2 sm:space-x-3 p-4 sm:p-6 border-t border-gray-200 bg-gray-50 rounded-b-xl sm:rounded-b-2xl">
          <Button
            onClick={onClose}
            variant="outline"
            className="px-4 sm:px-6 text-sm"
          >
            Cancel
          </Button>
          <Button
            onClick={handleConfirm}
            className="bg-gradient-to-r from-pink-600 to-rose-600 text-white px-4 sm:px-6 text-sm"
          >
            Compress
          </Button>
        </div>
      </div>
    </div>
  )
}

export default ImageCompressProModal
