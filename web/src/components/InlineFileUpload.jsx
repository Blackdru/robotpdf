import { useState, useCallback, useEffect } from 'react'
import { useDropzone } from 'react-dropzone'
import { Button } from './ui/button'
import { X, Upload, File, CheckCircle, AlertCircle } from 'lucide-react'
import toast from 'react-hot-toast'

const InlineFileUpload = ({ 
  onFilesUploaded, 
  acceptedFiles = '.pdf',
  multiple = true,
  maxFiles = 10,
  compact = false,
  clearFiles = false
}) => {
  const [files, setFiles] = useState([])
  
  // Clear files when clearFiles prop changes
  useEffect(() => {
    if (clearFiles) {
      setFiles([])
    }
  }, [clearFiles])

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

    const updatedFiles = [...files, ...newFiles]
    setFiles(updatedFiles)
    
    // Call the callback with actual File objects
    onFilesUploaded(updatedFiles.map(f => f.file))
  }, [files, onFilesUploaded])

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
    multiple
  })

  const removeFile = (fileId) => {
    const updatedFiles = files.filter(f => f.id !== fileId)
    setFiles(updatedFiles)
    onFilesUploaded(updatedFiles.map(f => f.file))
  }

  const getStatusIcon = (status) => {
    switch (status) {
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

  if (compact && files.length > 0) {
    return (
      <div className="mt-6">
        <Button
          {...getRootProps()}
          variant="outline"
          className="w-full btn-dark-outline border-dashed"
        >
          <input {...getInputProps()} />
          <Upload className="h-4 w-4 mr-2" />
          Add More Files
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Dropzone */}
      <div
        {...getRootProps()}
        className={`file-upload-dark cursor-pointer transition-all duration-300 ${
          isDragActive ? 'dragover' : ''
        }`}
      >
        <input {...getInputProps()} />
        <Upload className="mx-auto h-12 w-12 text-muted-foreground mb-6" />
        {isDragActive ? (
          <div>
            <p className="heading-dark-4 text-blue-300 mb-2">Drop the files here...</p>
            <p className="text-blue-400">Release to upload your files</p>
          </div>
        ) : (
          <div>
            <p className="heading-dark-4 text-card-foreground mb-3">
              Drag & drop files here, or click to select
            </p>
            <p className="body-dark-small text-muted-foreground">
              {acceptedFiles.includes('.pdf') && 'PDF, '}
              {acceptedFiles.includes('.jpg') && 'JPG, '}
              {acceptedFiles.includes('.png') && 'PNG, '}
              {acceptedFiles.includes('.gif') && 'GIF '}
              files supported (max 50MB each)
            </p>
          </div>
        )}
      </div>

      {/* File List */}
      {files.length > 0 && (
        <div className="space-y-4">
          <h4 className="heading-dark-4 text-card-foreground">Selected Files ({files.length})</h4>
          <div className="space-y-3">
            {files.map((fileData) => (
              <div
                key={fileData.id}
                className="flex items-center justify-between p-4 border border-border rounded-2xl bg-elevated"
              >
                <div className="flex items-center space-x-4">
                  {getStatusIcon(fileData.status)}
                  <div>
                    <p className="font-semibold text-card-foreground">{fileData.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {formatFileSize(fileData.size)}
                    </p>
                  </div>
                </div>
                
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => removeFile(fileData.id)}
                  className="text-red-400 hover:text-red-300 hover:bg-red-950 p-2 rounded-xl"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export default InlineFileUpload