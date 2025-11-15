import { useState, useEffect } from 'react'
import { X, GripVertical, FileText, Image as ImageIcon, ChevronUp, ChevronDown, Eye } from 'lucide-react'
import { Button } from './ui/button'
import toast from 'react-hot-toast'

const FileOrderPreview = ({ files, onReorder, onRemove, onConfirm, onCancel }) => {
  const [orderedFiles, setOrderedFiles] = useState(files)
  const [draggedIndex, setDraggedIndex] = useState(null)
  const [thumbnails, setThumbnails] = useState({})
  const [loadingThumbnails, setLoadingThumbnails] = useState(new Set())

  const handleDragStart = (index) => {
    setDraggedIndex(index)
  }

  const handleDragOver = (e, index) => {
    e.preventDefault()
    
    if (draggedIndex === null || draggedIndex === index) return

    const newFiles = [...orderedFiles]
    const draggedFile = newFiles[draggedIndex]
    
    // Remove from old position
    newFiles.splice(draggedIndex, 1)
    
    // Insert at new position
    newFiles.splice(index, 0, draggedFile)
    
    setOrderedFiles(newFiles)
    setDraggedIndex(index)
  }

  const handleDragEnd = () => {
    setDraggedIndex(null)
  }

  const moveUp = (index) => {
    if (index === 0) return
    
    const newFiles = [...orderedFiles]
    const temp = newFiles[index]
    newFiles[index] = newFiles[index - 1]
    newFiles[index - 1] = temp
    
    setOrderedFiles(newFiles)
  }

  const moveDown = (index) => {
    if (index === orderedFiles.length - 1) return
    
    const newFiles = [...orderedFiles]
    const temp = newFiles[index]
    newFiles[index] = newFiles[index + 1]
    newFiles[index + 1] = temp
    
    setOrderedFiles(newFiles)
  }

  const removeFile = (index) => {
    const newFiles = orderedFiles.filter((_, i) => i !== index)
    setOrderedFiles(newFiles)
    if (onRemove) {
      onRemove(index)
    }
  }

  const handleConfirm = () => {
    toast.success(`✅ File order confirmed! Processing ${orderedFiles.length} files...`, {
      duration: 2000
    })
    
    if (onReorder) {
      onReorder(orderedFiles)
    }
    if (onConfirm) {
      onConfirm(orderedFiles)
    }
  }

  // Show helpful toast when component mounts
  useEffect(() => {
    if (orderedFiles.length > 1) {
      toast.success(`📋 Arrange ${orderedFiles.length} files in your preferred order`, {
        duration: 3000,
        position: 'top-center'
      })
    }
  }, []) // Only run once when component mounts

  // Generate thumbnails for image files
  useEffect(() => {
    const generateThumbnails = async () => {
      for (const file of orderedFiles) {
        if (file.type.startsWith('image/') && !thumbnails[file.name] && !loadingThumbnails.has(file.name)) {
          setLoadingThumbnails(prev => new Set([...prev, file.name]))
          
          try {
            const reader = new FileReader()
            reader.onload = (e) => {
              setThumbnails(prev => ({
                ...prev,
                [file.name]: e.target.result
              }))
              setLoadingThumbnails(prev => {
                const newSet = new Set(prev)
                newSet.delete(file.name)
                return newSet
              })
            }
            reader.readAsDataURL(file)
          } catch (error) {
            console.error('Error generating thumbnail:', error)
            setLoadingThumbnails(prev => {
              const newSet = new Set(prev)
              newSet.delete(file.name)
              return newSet
            })
          }
        }
      }
    }
    
    generateThumbnails()
  }, [orderedFiles, thumbnails, loadingThumbnails])

  const getFilePreview = (file) => {
    const mobileSize = "w-8 h-8"
    const desktopSize = "sm:w-16 sm:h-16"
    const iconSize = "w-4 h-4 sm:w-8 sm:h-8"
    
    if (file.type.startsWith('image/')) {
      if (thumbnails[file.name]) {
        return (
          <div className={`${mobileSize} ${desktopSize} rounded-md sm:rounded-lg overflow-hidden bg-accent border border-border`}>
            <img 
              src={thumbnails[file.name]} 
              alt={file.name}
              className="w-full h-full object-cover"
            />
          </div>
        )
      } else if (loadingThumbnails.has(file.name)) {
        return (
          <div className={`${mobileSize} ${desktopSize} rounded-md sm:rounded-lg bg-accent border border-border flex items-center justify-center`}>
            <div className="w-2 h-2 sm:w-4 sm:h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
        )
      } else {
        return (
          <div className={`${mobileSize} ${desktopSize} rounded-md sm:rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 flex items-center justify-center`}>
            <ImageIcon className={iconSize + " text-blue-500"} />
          </div>
        )
      }
    }
    return (
      <div className={`${mobileSize} ${desktopSize} rounded-md sm:rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 flex items-center justify-center`}>
        <FileText className={iconSize + " text-red-500"} />
      </div>
    )
  }

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i]
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-1 sm:p-4">
      <div className="bg-surface rounded-xl sm:rounded-2xl shadow-2xl w-full max-w-sm sm:max-w-4xl max-h-[98vh] sm:max-h-[90vh] flex flex-col overflow-hidden mx-2 sm:mx-0">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-500 to-purple-700 text-white p-3 sm:p-6 rounded-t-xl sm:rounded-t-2xl">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <div className="p-1 sm:p-2 bg-white/20 rounded-lg flex-shrink-0">
                <Eye className="w-4 h-4 sm:w-6 sm:h-6" />
              </div>
              <div className="min-w-0">
                <h2 className="text-base sm:text-2xl font-bold truncate">Arrange Files</h2>
                <p className="text-white/90 text-xs sm:text-sm mt-0.5 hidden sm:block">
                  Drag and drop files to reorder them for processing
                </p>
              </div>
            </div>
            <button
              onClick={onCancel}
              className="p-1 sm:p-2 hover:bg-white/20 rounded-lg transition-colors flex-shrink-0"
            >
              <X className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
          </div>
        </div>

        {/* File List */}
        <div className="flex-1 overflow-y-auto p-2 sm:p-6 space-y-2 sm:space-y-3">
          {orderedFiles.length === 0 ? (
            <div className="text-center py-8 sm:py-12 text-muted-foreground">
              <FileText className="w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-3 sm:mb-4 opacity-50" />
              <p className="text-sm sm:text-base">No files to display</p>
            </div>
          ) : (
            orderedFiles.map((file, index) => (
              <div
                key={`${file.name}-${index}`}
                draggable
                onDragStart={() => handleDragStart(index)}
                onDragOver={(e) => handleDragOver(e, index)}
                onDragEnd={handleDragEnd}
                className={`
                  flex items-center gap-1 sm:gap-4 p-2 sm:p-4 rounded-lg sm:rounded-xl border-2 
                  ${draggedIndex === index 
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 shadow-lg scale-105' 
                    : 'border-border bg-elevated'
                  }
                  hover:border-blue-300 hover:shadow-md
                  transition-all duration-200 cursor-move
                `}
              >
                {/* Drag Handle */}
                <div className="flex-shrink-0 hidden sm:block">
                  <GripVertical className="w-4 h-4 sm:w-5 sm:h-5 text-muted-foreground" />
                </div>

                {/* Order Number */}
                <div className="flex-shrink-0 w-5 h-5 sm:w-8 sm:h-8 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 text-white flex items-center justify-center font-bold text-xs sm:text-sm shadow-sm">
                  {index + 1}
                </div>

                {/* File Preview/Thumbnail */}
                <div className="flex-shrink-0 hidden sm:block">
                  {getFilePreview(file)}
                </div>

                {/* File Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1 mb-1">
                    <p className="font-medium text-card-foreground text-xs sm:text-base truncate flex-1" title={file.name}>
                      {file.name.length > 20 ? `${file.name.substring(0, 20)}...` : file.name}
                    </p>
                    <div className="sm:hidden w-8 h-8">
                      {getFilePreview(file)}
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-1 text-[10px] sm:text-sm text-muted-foreground">
                    <span>{formatFileSize(file.size)}</span>
                    {file.type.startsWith('image/') && (
                      <span className="px-1 py-0.5 sm:px-2 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded text-[9px] sm:text-xs font-medium">
                        IMG
                      </span>
                    )}
                    {file.type === 'application/pdf' && (
                      <span className="px-1 py-0.5 sm:px-2 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded text-[9px] sm:text-xs font-medium">
                        PDF
                      </span>
                    )}
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
                  {/* Move Up */}
                  <button
                    onClick={() => moveUp(index)}
                    disabled={index === 0}
                    className={`
                      p-1.5 sm:p-2 rounded-lg transition-colors
                      ${index === 0
                        ? 'text-muted-foreground/50 cursor-not-allowed'
                        : 'text-muted-foreground hover:bg-accent'
                      }
                    `}
                    title="Move up"
                  >
                    <ChevronUp className="w-4 h-4 sm:w-5 sm:h-5" />
                  </button>

                  {/* Move Down */}
                  <button
                    onClick={() => moveDown(index)}
                    disabled={index === orderedFiles.length - 1}
                    className={`
                      p-1.5 sm:p-2 rounded-lg transition-colors
                      ${index === orderedFiles.length - 1
                        ? 'text-muted-foreground/50 cursor-not-allowed'
                        : 'text-muted-foreground hover:bg-accent'
                      }
                    `}
                    title="Move down"
                  >
                    <ChevronDown className="w-4 h-4 sm:w-5 sm:h-5" />
                  </button>

                  {/* Remove */}
                  <button
                    onClick={() => removeFile(index)}
                    className="p-1.5 sm:p-2 rounded-lg text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                    title="Remove file"
                  >
                    <X className="w-4 h-4 sm:w-5 sm:h-5" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="bg-elevated px-2 sm:px-6 py-2 sm:py-4 rounded-b-xl sm:rounded-b-2xl border-t border-border">
          <div className="flex items-center justify-between gap-2 mb-2 sm:mb-4">
            <div className="text-xs text-muted-foreground">
              {orderedFiles.length} file{orderedFiles.length !== 1 ? 's' : ''}
            </div>
            <div className="text-xs text-muted-foreground">
              {formatFileSize(orderedFiles.reduce((total, file) => total + file.size, 0))}
            </div>
          </div>
          
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={onCancel}
              className="flex-1 text-xs sm:text-base py-2 h-8 sm:h-auto"
            >
              Cancel
            </Button>
            <Button
              onClick={handleConfirm}
              disabled={orderedFiles.length === 0}
              className="flex-1 bg-gradient-to-r from-blue-500 to-purple-700 hover:from-blue-600 hover:to-purple-800 text-xs sm:text-base py-2 h-8 sm:h-auto"
            >
              <Eye className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
              Confirm
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default FileOrderPreview
