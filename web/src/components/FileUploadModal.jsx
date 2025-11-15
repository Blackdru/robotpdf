import { useState, useCallback, useEffect } from 'react'
import { useDropzone } from 'react-dropzone'
import { Button } from './ui/button'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { X, Upload, File, CheckCircle, AlertCircle, Loader2, Eye } from 'lucide-react'
import toast from 'react-hot-toast'

const FileUploadModal = ({ 
  isOpen,
  onClose,
  onFilesUploaded, 
  acceptedFiles = '.pdf,.jpg,.jpeg,.png,.gif,.bmp,.webp,.doc,.docx,.xls,.xlsx',
  multiple = true,
  maxFiles = 10,
  title = 'Upload Files',
  description = 'Select files to upload and process',
  toolName = '',
  toolIcon: ToolIcon = Upload
}) => {
  const [files, setFiles] = useState([])
  const [isUploading, setIsUploading] = useState(false)
  
  // Clear files when modal closes
  useEffect(() => {
    if (!isOpen) {
      setFiles([])
      setIsUploading(false)
    }
  }, [isOpen])

  const allowedTypes = acceptedFiles.split(',').map(type => {
    if (type === '.pdf') return 'application/pdf'
    if (type === '.jpg' || type === '.jpeg') return 'image/jpeg'
    if (type === '.png') return 'image/png'
    if (type === '.gif') return 'image/gif'
    if (type === '.bmp') return 'image/bmp'
    if (type === '.webp') return 'image/webp'
    return type
  })

  const onDrop = useCallback((acceptedFiles, rejectedFiles) => {
    // Handle rejected files
    rejectedFiles.forEach(({ file, errors }) => {
      errors.forEach(error => {
        if (error.code === 'file-too-large') {
          toast.error(`${file.name} is too large. Max size is 50MB.`)
        } else if (error.code === 'file-invalid-type') {
          toast.error(`${file.name} is not a supported file type.`)
        } else if (error.code === 'too-many-files') {
          toast.error(`Too many files. Maximum ${maxFiles} files allowed.`)
        }
      })
    })

    // Process accepted files
    const newFiles = acceptedFiles.map(file => ({
      file,
      id: Math.random().toString(36).substr(2, 9),
      name: file.name,
      size: file.size,
      type: file.type,
      status: 'ready'
    }))

    setFiles(prev => [...prev, ...newFiles])
    
    // Auto-upload immediately after files are selected
    if (acceptedFiles.length > 0) {
      setTimeout(() => {
        handleUploadImmediate(acceptedFiles)
      }, 100)
    }
  }, [maxFiles])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: Object.fromEntries(
      allowedTypes.map(type => [type, acceptedFiles.split(',').filter(ext => {
        if (type === 'application/pdf') return ext === '.pdf'
        if (type === 'image/jpeg') return ['.jpg', '.jpeg'].includes(ext)
        if (type === 'image/png') return ext === '.png'
        if (type === 'image/gif') return ext === '.gif'
        if (type === 'image/bmp') return ext === '.bmp'
        if (type === 'image/webp') return ext === '.webp'
        return false
      })])
    ),
    maxSize: 50 * 1024 * 1024, // 50MB
    multiple,
    maxFiles
  })

  const removeFile = (fileId) => {
    setFiles(prev => prev.filter(f => f.id !== fileId))
  }

  const handleUploadImmediate = async (acceptedFiles) => {
    setIsUploading(true)
    
    try {
      // Close modal immediately to show processing modal or file order preview
      onClose()
      
      // Call the upload handler
      await onFilesUploaded(acceptedFiles)
      
    } catch (error) {
      console.error('Upload error:', error)
      toast.error('Upload failed: ' + error.message)
    } finally {
      setIsUploading(false)
    }
  }

  const handleUpload = async () => {
    if (files.length === 0) {
      toast.error('Please select at least one file')
      return
    }

    await handleUploadImmediate(files.map(f => f.file))
  }

  const getStatusIcon = (status) => {
    switch (status) {
      case 'uploading':
        return <Loader2 className="h-4 w-4 text-blue-400 animate-spin" />
      case 'success':
        return <CheckCircle className="h-4 w-4 text-green-400" />
      case 'error':
        return <AlertCircle className="h-4 w-4 text-red-400" />
      default:
        return <File className="h-4 w-4 text-muted-foreground" />
    }
  }

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 z-50 animate-in fade-in duration-200">
      <Card className="bg-white border border-gray-200 rounded-2xl shadow-2xl w-full max-w-[95vw] sm:max-w-2xl max-h-[90vh] overflow-y-auto animate-in slide-in-from-bottom duration-300 modern-scrollbar">
        <CardHeader className="px-4 sm:px-6 md:px-8 py-4 sm:py-6 border-b border-gray-200 bg-gradient-to-r from-indigo-50 to-purple-50">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center space-x-3 md:space-x-4 min-w-0 flex-1">
              <div className="w-12 h-12 sm:w-14 sm:h-14 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg">
                <ToolIcon className="h-6 w-6 sm:h-7 sm:w-7 text-white" />
              </div>
              <div className="min-w-0 flex-1">
                <CardTitle className="text-lg sm:text-xl md:text-2xl font-black text-gray-900 truncate">{title}</CardTitle>
                {toolName && (
                  <p className="text-xs sm:text-sm text-indigo-600 font-semibold mt-1 truncate">for {toolName}</p>
                )}
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="text-gray-500 hover:text-gray-900 hover:bg-white p-2 rounded-xl flex-shrink-0 transition-colors"
              disabled={isUploading}
            >
              <X className="h-5 w-5" />
            </Button>
          </div>
          {description && (
            <p className="text-sm text-gray-600 mt-3 font-medium">{description}</p>
          )}
        </CardHeader>
        
        <CardContent className="px-4 sm:px-6 md:px-8 py-5 sm:py-6 space-y-5 sm:space-y-6">
          {/* Dropzone */}
          <div
            {...getRootProps()}
            className={`border-2 border-dashed rounded-2xl p-6 sm:p-8 md:p-10 text-center cursor-pointer transition-all duration-300 touch-manipulation ${
              isDragActive 
                ? 'border-indigo-400 bg-indigo-50' 
                : 'border-gray-300 hover:border-indigo-400 hover:bg-gray-50'
            }`}
          >
            <input {...getInputProps()} />
            <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-indigo-100 to-purple-100 flex items-center justify-center">
              <Upload className={`h-8 w-8 ${
                isDragActive ? 'text-indigo-600' : 'text-gray-500'
              }`} />
            </div>
            {isDragActive ? (
              <div>
                <p className="text-base sm:text-lg font-bold text-indigo-600 mb-2">Drop the files here...</p>
                <p className="text-sm text-gray-600">Release to upload your files</p>
              </div>
            ) : (
              <div>
                <p className="text-base sm:text-lg font-bold text-gray-900 mb-2">
                  Drag & drop files here, or click to select
                </p>
                <p className="text-xs sm:text-sm text-muted-foreground mb-3 sm:mb-4">
                  {acceptedFiles.includes('.pdf') && 'PDF, '}
                  {acceptedFiles.includes('.jpg') && 'JPG, '}
                  {acceptedFiles.includes('.png') && 'PNG, '}
                  {acceptedFiles.includes('.gif') && 'GIF '}
                  files supported (max 50MB each)
                </p>
                <div className="flex flex-col sm:flex-row items-center justify-center gap-2 text-xs text-secondary">
                  <span>{multiple ? `Up to ${maxFiles} files` : 'Single file only'}</span>
                  {multiple && (
                    <span className="hidden sm:inline">•</span>
                  )}
                  {multiple && (
                    <span className="flex items-center gap-1">
                      <Eye className="w-3 h-3" />
                      Preview & reorder available
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* File List */}
          {files.length > 0 && (
            <div className="space-y-3 sm:space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-base sm:text-lg font-semibold text-card-foreground">
                  Selected Files ({files.length})
                </h4>
                {!isUploading && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setFiles([])}
                    className="text-xs sm:text-sm text-muted-foreground border-border hover:bg-elevated"
                  >
                    Clear All
                  </Button>
                )}
              </div>
              
              <div className="space-y-2 sm:space-y-3 max-h-48 sm:max-h-60 overflow-y-auto">
                {files.map((fileData) => (
                  <div
                    key={fileData.id}
                    className="flex items-center justify-between p-3 sm:p-4 border border-border rounded-xl bg-elevated/50"
                  >
                    <div className="flex items-center space-x-2 sm:space-x-4 flex-1 min-w-0">
                      {getStatusIcon(fileData.status)}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm sm:text-base font-medium text-card-foreground truncate">{fileData.name}</p>
                        <p className="text-xs sm:text-sm text-muted-foreground">
                          {formatFileSize(fileData.size)}
                        </p>
                      </div>
                    </div>
                    
                    {!isUploading && fileData.status !== 'uploading' && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeFile(fileData.id)}
                        className="text-red-400 hover:text-red-300 hover:bg-red-950 p-2 rounded-xl ml-2 flex-shrink-0"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-4 border-t border-border">
            <div className="text-xs sm:text-sm text-muted-foreground text-center sm:text-left">
              {files.length > 0 && (
                <span>
                  {files.length} file{files.length !== 1 ? 's' : ''} selected
                  {files.length > 0 && ` (${formatFileSize(files.reduce((total, f) => total + f.size, 0))} total)`}
                </span>
              )}
            </div>
            
            <div className="flex space-x-2 sm:space-x-3">
              <Button
                variant="outline"
                onClick={onClose}
                disabled={isUploading}
                className="flex-1 sm:flex-none text-sm border-border text-card-foreground hover:bg-elevated"
              >
                Cancel
              </Button>
              <Button
                onClick={handleUpload}
                disabled={files.length === 0 || isUploading}
                className="flex-1 sm:flex-none text-sm bg-[#FF0099] hover:bg-[#FF33B5] text-white rounded-full font-bold"
              >
                {isUploading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Uploading...
                  </>
                ) : (
                  <>
                    <Upload className="h-4 w-4 mr-2" />
                    Upload & Process
                  </>
                )}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default FileUploadModal