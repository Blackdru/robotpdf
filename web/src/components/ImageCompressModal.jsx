import { useState } from 'react'
import { X, Image, Zap, Target, Info } from 'lucide-react'
import { Button } from './ui/button'

const ImageCompressModal = ({ isOpen, onClose, onConfirm, fileCount }) => {
  const [compressionMode, setCompressionMode] = useState('quality')
  const [quality, setQuality] = useState(50)
  const [targetSizeKB, setTargetSizeKB] = useState(500)
  const [outputFormat, setOutputFormat] = useState('original')

  if (!isOpen) return null

  const handleConfirm = () => {
    onConfirm({
      compressionMode,
      quality,
      targetSizeKB: compressionMode === 'size' ? targetSizeKB : null,
      outputFormat
    })
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-br from-pink-500 to-rose-600 rounded-xl flex items-center justify-center">
              <Image className="h-5 w-5 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">Image Compression Settings</h2>
              <p className="text-sm text-gray-500">{fileCount} image(s) selected</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Compression Mode */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-3">
              Compression Mode
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => setCompressionMode('quality')}
                className={`p-4 rounded-xl border-2 transition-all ${
                  compressionMode === 'quality'
                    ? 'border-pink-500 bg-pink-50'
                    : 'border-gray-200 hover:border-pink-300'
                }`}
              >
                <Zap className={`h-6 w-6 mx-auto mb-2 ${
                  compressionMode === 'quality' ? 'text-pink-600' : 'text-gray-400'
                }`} />
                <div className="text-sm font-semibold text-gray-900">Quality Based</div>
                <div className="text-xs text-gray-500 mt-1">Set compression quality</div>
              </button>
              <button
                onClick={() => setCompressionMode('size')}
                className={`p-4 rounded-xl border-2 transition-all ${
                  compressionMode === 'size'
                    ? 'border-pink-500 bg-pink-50'
                    : 'border-gray-200 hover:border-pink-300'
                }`}
              >
                <Target className={`h-6 w-6 mx-auto mb-2 ${
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
                Compression Quality: {quality}%
              </label>
              <input
                type="range"
                min="30"
                max="95"
                value={quality}
                onChange={(e) => setQuality(parseInt(e.target.value))}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-pink-600"
              />
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>Lower quality (smaller file)</span>
                <span>Higher quality (larger file)</span>
              </div>
            </div>
          )}

          {/* Target Size Input (for size mode) */}
          {compressionMode === 'size' && (
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Target File Size (KB)
              </label>
              <input
                type="number"
                min="50"
                max="5000"
                value={targetSizeKB}
                onChange={(e) => setTargetSizeKB(parseInt(e.target.value))}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                placeholder="e.g., 500"
              />
              <p className="text-xs text-gray-500 mt-1">
                The tool will try to compress the image to approximately this size
              </p>
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
              <option value="webp">WebP (Modern format)</option>
            </select>
          </div>

          {/* Info Box */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-start space-x-3">
            <Info className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-blue-800">
              <p className="font-semibold mb-1">Compression Tips:</p>
              <ul className="list-disc list-inside space-y-1 text-xs">
                <li>Quality 70-80% provides good balance between size and quality</li>
                <li>Target size mode may reduce quality significantly for large images</li>
                <li>WebP format typically provides better compression than JPEG</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end space-x-3 p-6 border-t border-gray-200 bg-gray-50 rounded-b-2xl">
          <Button
            onClick={onClose}
            variant="outline"
            className="px-6"
          >
            Cancel
          </Button>
          <Button
            onClick={handleConfirm}
            className="bg-gradient-to-r from-pink-500 to-rose-600 text-white px-6"
          >
            Compress Images
          </Button>
        </div>
      </div>
    </div>
  )
}

export default ImageCompressModal
