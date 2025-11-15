import { useState, useCallback, useEffect } from 'react'
import { useDropzone } from 'react-dropzone'
import { Button } from './ui/button'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { X, Upload, File, CheckCircle, AlertCircle, Loader2, Eye, Globe, FileText } from 'lucide-react'
import toast from 'react-hot-toast'

const HtmlToPdfUploadModal = ({ 
  isOpen,
  onClose,
  onFilesUploaded,
  onUrlSubmitted,
  acceptedFiles = '.html,.htm',
  title = 'HTML to PDF - Upload File or Enter URL',
  description = 'Upload an HTML file or enter a webpage URL to convert to PDF',
  toolName = 'Advanced HTML to PDF'
}) => {
  const [files, setFiles] = useState([])
  const [isUploading, setIsUploading] = useState(false)
  const [activeTab, setActiveTab] = useState('file') // 'file' or 'url'
  const [url, setUrl] = useState('')
  const [isValidUrl, setIsValidUrl] = useState(false)
  const [viewportMode, setViewportMode] = useState('desktop') // 'desktop' or 'mobile'
  
  // Clear state when modal closes
  useEffect(() => {
    if (!isOpen) {
      setFiles([])
      setIsUploading(false)
      setUrl('')
      setIsValidUrl(false)
      setActiveTab('file')
      setViewportMode('desktop')
    }
  }, [isOpen])

  // Validate URL
  useEffect(() => {
    if (url.trim()) {
      try {
        const urlObj = new URL(url.trim())
        setIsValidUrl(urlObj.protocol === 'http:' || urlObj.protocol === 'https:')
      } catch {
        setIsValidUrl(false)
      }
    } else {
      setIsValidUrl(false)
    }
  }, [url])

  const allowedTypes = acceptedFiles.split(',').map(type => {
    if (type === '.html' || type === '.htm') return 'text/html'
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
  }, [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'text/html': ['.html', '.htm']
    },
    maxSize: 50 * 1024 * 1024, // 50MB
    multiple: false,
    maxFiles: 1
  })

  const removeFile = (fileId) => {
    setFiles(prev => prev.filter(f => f.id !== fileId))
  }

  const handleUploadImmediate = async (acceptedFiles) => {
    setIsUploading(true)
    
    try {
      // Close modal immediately to show processing modal
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

  const handleFileUpload = async () => {
    if (files.length === 0) {
      toast.error('Please select an HTML file')
      return
    }

    await handleUploadImmediate(files.map(f => f.file))
  }

  const handleUrlSubmit = async () => {
    if (!url.trim()) {
      toast.error('Please enter a URL')
      return
    }

    if (!isValidUrl) {
      toast.error('Please enter a valid URL (must start with http:// or https://)')
      return
    }

    setIsUploading(true)
    
    try {
      // Close modal immediately
      onClose()
      
      // Call the URL handler with viewport mode
      await onUrlSubmitted(url.trim(), viewportMode)
      
    } catch (error) {
      console.error('URL processing error:', error)
      toast.error('URL processing failed: ' + error.message)
    } finally {
      setIsUploading(false)
    }
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
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
      <Card className="bg-surface border-border rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto animate-in fade-in duration-300">
        <CardHeader className="px-3 sm:px-6 md:px-8 py-3 sm:py-5 md:py-6 border-b border-border">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center space-x-2 sm:space-x-3 md:space-x-4 min-w-0 flex-1">
              <div className="p-1.5 sm:p-2 md:p-3 bg-teal-600 rounded-lg sm:rounded-xl flex-shrink-0">
                <FileText className="h-4 w-4 sm:h-5 sm:w-5 md:h-6 md:w-6 text-white" />
              </div>
              <div className="min-w-0 flex-1">
                <CardTitle className="text-sm sm:text-lg md:text-xl font-bold text-foreground truncate">{toolName}</CardTitle>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="text-muted-foreground hover:text-card-foreground hover:bg-elevated p-1.5 sm:p-2 rounded-lg sm:rounded-xl flex-shrink-0"
              disabled={isUploading}
            >
              <X className="h-4 w-4 sm:h-5 sm:w-5" />
            </Button>
          </div>
        </CardHeader>
        
        <CardContent className="px-3 sm:px-6 md:px-8 py-3 sm:py-5 md:py-6 space-y-3 sm:space-y-5 md:space-y-6">
          {/* Tab Navigation */}
          <div className="flex bg-elevated rounded-xl p-1">
            <button
              onClick={() => setActiveTab('file')}
              className={`flex-1 flex items-center justify-center space-x-2 py-2 px-4 rounded-lg text-sm font-medium transition-all duration-200 ${
                activeTab === 'file'
                  ? 'bg-surface text-card-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-card-foreground'
              }`}
            >
              <FileText className="h-4 w-4" />
              <span>Upload HTML File</span>
            </button>
            <button
              onClick={() => setActiveTab('url')}
              className={`flex-1 flex items-center justify-center space-x-2 py-2 px-4 rounded-lg text-sm font-medium transition-all duration-200 ${
                activeTab === 'url'
                  ? 'bg-surface text-card-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-card-foreground'
              }`}
            >
              <Globe className="h-4 w-4" />
              <span>Enter URL</span>
            </button>
          </div>

          {/* File Upload Tab */}
          {activeTab === 'file' && (
            <>
              {/* Dropzone */}
              <div
                {...getRootProps()}
                className={`border-2 border-dashed rounded-xl sm:rounded-2xl p-4 sm:p-6 md:p-8 text-center cursor-pointer transition-all duration-300 touch-manipulation ${
                  isDragActive 
                    ? 'border-teal-400 bg-teal-900/20' 
                    : 'border-grey-700 hover:border-border hover:bg-secondary/50'
                }`}
              >
                <input {...getInputProps()} />
                <Upload className={`mx-auto h-8 w-8 sm:h-10 sm:w-10 md:h-12 md:w-12 mb-2 sm:mb-3 md:mb-4 ${
                  isDragActive ? 'text-teal-400' : 'text-grey-400'
                }`} />
                {isDragActive ? (
                  <div>
                    <p className="text-sm sm:text-base md:text-lg font-semibold text-teal-300 mb-1 sm:mb-2">Drop the HTML file here...</p>
                    <p className="text-xs sm:text-sm md:text-base text-teal-400">Release to upload your file</p>
                  </div>
                ) : (
                  <div>
                    <p className="text-sm sm:text-base md:text-lg font-semibold text-card-foreground mb-1 sm:mb-2">
                      Drag & drop HTML file here, or click to select
                    </p>
                    <p className="text-xs sm:text-sm text-muted-foreground mb-3 sm:mb-4">
                      HTML, HTM files supported (max 50MB)
                    </p>
                    <div className="flex flex-col sm:flex-row items-center justify-center gap-2 text-xs text-secondary">
                      <span>Single file only</span>
                      <span className="hidden sm:inline">•</span>
                      <span className="flex items-center gap-1">
                        <Eye className="w-3 h-3" />
                        Instant processing
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* File List */}
              {files.length > 0 && (
                <div className="space-y-3 sm:space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="text-base sm:text-lg font-semibold text-card-foreground">
                      Selected File
                    </h4>
                    {!isUploading && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setFiles([])}
                        className="text-xs sm:text-sm text-muted-foreground border-border hover:bg-elevated"
                      >
                        Clear
                      </Button>
                    )}
                  </div>
                  
                  <div className="space-y-2 sm:space-y-3">
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

              {/* File Upload Action Buttons */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-4 border-t border-border">
                <div className="text-xs sm:text-sm text-muted-foreground text-center sm:text-left">
                  {files.length > 0 && (
                    <span>
                      {files.length} file selected ({formatFileSize(files.reduce((total, f) => total + f.size, 0))})
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
                    onClick={handleFileUpload}
                    disabled={files.length === 0 || isUploading}
                    className="flex-1 sm:flex-none text-sm bg-teal-600 hover:bg-teal-700 text-white"
                  >
                    {isUploading ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      <>
                        <Upload className="h-4 w-4 mr-2" />
                        Upload & Convert
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </>
          )}

          {/* URL Input Tab */}
          {activeTab === 'url' && (
            <>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-card-foreground mb-2">
                    Webpage URL
                  </label>
                  <div className="relative">
                    <Globe className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <input
                      type="url"
                      placeholder="https://example.com"
                      value={url}
                      onChange={(e) => setUrl(e.target.value)}
                      className={`w-full pl-10 pr-4 py-3 bg-grey-600 border rounded-lg text-card-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all duration-200 ${
                        url && !isValidUrl ? 'border-red-500' : 'border-grey-500'
                      }`}
                    />
                  </div>
                  {url && !isValidUrl && (
                    <p className="text-xs text-red-400 mt-1 flex items-center">
                      <AlertCircle className="h-3 w-3 mr-1" />
                      Please enter a valid URL starting with http:// or https://
                    </p>
                  )}
                  {url && isValidUrl && (
                    <p className="text-xs text-green-400 mt-1 flex items-center">
                      <CheckCircle className="h-3 w-3 mr-1" />
                      Valid URL ready for conversion
                    </p>
                  )}
                </div>

                {/* Viewport Mode Selection */}
                <div>
                  <label className="block text-sm font-medium text-card-foreground mb-2">
                    Viewport Mode: <span className="text-teal-400">{viewportMode}</span>
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setViewportMode('desktop')}
                      className={`p-4 rounded-lg border-2 transition-all ${
                        viewportMode === 'desktop'
                          ? 'border-teal-500 bg-teal-500/10 text-teal-400'
                          : 'border-border hover:border-teal-400/50 text-card-foreground hover:bg-elevated'
                      }`}
                    >
                      <div className="text-center">
                        <div className="text-2xl mb-1">🖥️</div>
                        <div className="text-sm font-medium">Desktop</div>
                        <div className="text-xs text-muted-foreground mt-1">1920x1080</div>
                      </div>
                    </button>
                    <button
                      type="button"
                      onClick={() => setViewportMode('mobile')}
                      className={`p-4 rounded-lg border-2 transition-all ${
                        viewportMode === 'mobile'
                          ? 'border-teal-500 bg-teal-500/10 text-teal-400'
                          : 'border-border hover:border-teal-400/50 text-card-foreground hover:bg-elevated'
                      }`}
                    >
                      <div className="text-center">
                        <div className="text-2xl mb-1">📱</div>
                        <div className="text-sm font-medium">Mobile</div>
                        <div className="text-xs text-muted-foreground mt-1">375x812</div>
                      </div>
                    </button>
                  </div>
                </div>

                <div className="p-4 bg-teal-50 dark:bg-teal-900/20 rounded-lg border border-teal-200 dark:border-teal-800">
                  <p className="text-xs text-teal-700 dark:text-teal-300">
                    💡 <strong>Pro Tip:</strong> Make sure the URL is publicly accessible. 
                    The webpage will be rendered and converted to PDF with your advanced settings.
                  </p>
                </div>
              </div>

              {/* URL Submit Action Buttons */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-4 border-t border-border">
                <div className="text-xs sm:text-sm text-muted-foreground text-center sm:text-left">
                  {url && isValidUrl && (
                    <span className="text-green-400">Ready to convert webpage</span>
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
                    onClick={handleUrlSubmit}
                    disabled={!isValidUrl || isUploading}
                    className="flex-1 sm:flex-none text-sm bg-teal-600 hover:bg-teal-700 text-white disabled:opacity-50"
                  >
                    {isUploading ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      <>
                        <Globe className="h-4 w-4 mr-2" />
                        Convert URL to PDF
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

export default HtmlToPdfUploadModal