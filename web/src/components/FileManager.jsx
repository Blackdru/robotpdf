import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { api } from '../lib/api'
import { Button } from './ui/button'
import ProcessingModal from './ProcessingModal'
import toast from 'react-hot-toast'
import { 
  FileText, 
  FolderOpen,
  Upload,
  Download,
  Eye,
  Trash2,
  Search,
  Filter,
  Grid,
  List,
  MoreVertical,
  Star,
  Share,
  Copy,
  Calendar,
  FileIcon,
  Image as ImageIcon,
  Archive,
  Layers,
  Rocket
} from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from './ui/dropdown-menu'

const FileManager = () => {
  const { user } = useAuth()
  const [files, setFiles] = useState([])
  const [folders, setFolders] = useState([])
  const [viewMode, setViewMode] = useState('grid') // 'grid' or 'list'
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedFiles, setSelectedFiles] = useState([])
  const [sortBy, setSortBy] = useState('date') // 'name', 'date', 'size', 'type'
  const [filterType, setFilterType] = useState('all') // 'all', 'pdf', 'image', 'document'
  const [isLoading, setIsLoading] = useState(true)
  
  // Deletion progress modal state
  const [isDeletingFiles, setIsDeletingFiles] = useState(false)
  const [deletionProgress, setDeletionProgress] = useState(0)
  const [deletionStage, setDeletionStage] = useState('')
  const [deletionCurrentStep, setDeletionCurrentStep] = useState(0)
  const [filesToDelete, setFilesToDelete] = useState([])

  useEffect(() => {
    loadFiles()
  }, [user])

  const loadFiles = async () => {
    if (!user) {
      setIsLoading(false)
      return
    }

    try {
      setIsLoading(true)
      const response = await api.getFiles(1, 100) // Get first 100 files
      
      // Transform API response to match component structure
      const transformedFiles = response.files.map(file => ({
        id: file.id,
        name: file.filename,
        type: getFileTypeFromMimeType(file.type),
        size: file.size,
        createdAt: file.created_at,
        modifiedAt: file.updated_at,
        thumbnail: null,
        starred: false, // TODO: Add starred field to API
        shared: false, // TODO: Add shared field to API
        has_ocr: file.has_ocr,
        has_summary: file.has_summary,
        has_embeddings: file.has_embeddings
      }))
      
      setFiles(transformedFiles)
      
      // TODO: Load folders from API when folder feature is implemented
      setFolders([])
      
    } catch (error) {
      console.error('Error loading files:', error)
      toast.error('Failed to load files')
      setFiles([])
    } finally {
      setIsLoading(false)
    }
  }

  const getFileTypeFromMimeType = (mimeType) => {
    if (mimeType === 'application/pdf') return 'pdf'
    if (mimeType.startsWith('image/')) return 'image'
    if (mimeType.includes('zip') || mimeType.includes('archive')) return 'archive'
    return 'document'
  }

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const formatDate = (dateString) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffTime = Math.abs(now - date)
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    
    if (diffDays === 1) return 'Today'
    if (diffDays === 2) return 'Yesterday'
    if (diffDays <= 7) return `${diffDays - 1} days ago`
    return date.toLocaleDateString()
  }

  const getFileIcon = (type) => {
    switch (type) {
      case 'pdf':
        return FileText
      case 'image':
        return ImageIcon
      case 'archive':
        return Archive
      default:
        return FileIcon
    }
  }

  const getFileColor = (type) => {
    switch (type) {
      case 'pdf':
        return 'text-red-600 bg-red-100 border-2 border-red-200'
      case 'image':
        return 'text-green-600 bg-green-100 border-2 border-green-200'
      case 'archive':
        return 'text-purple-600 bg-purple-100 border-2 border-purple-200'
      default:
        return 'text-slate-600 bg-slate-100 border-2 border-slate-200'
    }
  }

  const filteredFiles = files.filter(file => {
    const matchesSearch = file.name.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesFilter = filterType === 'all' || file.type === filterType
    return matchesSearch && matchesFilter
  })

  const sortedFiles = [...filteredFiles].sort((a, b) => {
    switch (sortBy) {
      case 'name':
        return a.name.localeCompare(b.name)
      case 'size':
        return b.size - a.size
      case 'type':
        return a.type.localeCompare(b.type)
      case 'date':
      default:
        return new Date(b.createdAt) - new Date(a.createdAt)
    }
  })

  const handleFileSelect = (fileId) => {
    setSelectedFiles(prev => 
      prev.includes(fileId) 
        ? prev.filter(id => id !== fileId)
        : [...prev, fileId]
    )
  }

  const handleSelectAll = () => {
    if (selectedFiles.length === sortedFiles.length) {
      setSelectedFiles([])
    } else {
      setSelectedFiles(sortedFiles.map(file => file.id))
    }
  }

  const handleDeleteSelected = async () => {
    if (selectedFiles.length === 0) return
    
    // Get file names for display
    const filesToDeleteData = selectedFiles.map(fileId => {
      const file = files.find(f => f.id === fileId)
      return { id: fileId, name: file?.name || 'Unknown file' }
    })
    
    setFilesToDelete(filesToDeleteData)
    setIsDeletingFiles(true)
    setDeletionProgress(0)
    setDeletionCurrentStep(0)
    setDeletionStage('Preparing to delete files...')
    
    try {
      const totalFiles = selectedFiles.length
      let deletedCount = 0
      let failedCount = 0
      
      // Step 1: Preparing
      setDeletionStage('Preparing file deletion...')
      setDeletionCurrentStep(0)
      await new Promise(resolve => setTimeout(resolve, 500)) // Brief pause for UX
      
      // Step 2: Deleting files
      setDeletionStage('Deleting files from server...')
      setDeletionCurrentStep(1)
      
      for (let i = 0; i < selectedFiles.length; i++) {
        const fileId = selectedFiles[i]
        const fileName = filesToDeleteData[i].name
        
        try {
          setDeletionStage(`Deleting ${fileName}...`)
          await api.deleteFile(fileId)
          deletedCount++
          
          // Update progress
          const progress = Math.round(((i + 1) / totalFiles) * 80) // 80% for deletion phase
          setDeletionProgress(progress)
          
          // Small delay for better UX on fast connections
          await new Promise(resolve => setTimeout(resolve, 200))
        } catch (error) {
          console.error(`Error deleting file ${fileName}:`, error)
          failedCount++
        }
      }
      
      // Step 3: Updating interface
      setDeletionStage('Updating file list...')
      setDeletionCurrentStep(2)
      setDeletionProgress(90)
      
      // Remove successfully deleted files from local state
      const successfullyDeleted = selectedFiles.filter((_, index) => index < deletedCount)
      setFiles(prev => prev.filter(file => !successfullyDeleted.includes(file.id)))
      setSelectedFiles([])
      
      await new Promise(resolve => setTimeout(resolve, 500))
      
      // Step 4: Complete
      setDeletionStage('Deletion completed!')
      setDeletionCurrentStep(3)
      setDeletionProgress(100)
      
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      // Show results
      if (failedCount === 0) {
        toast.success(`${deletedCount} file(s) deleted successfully`)
      } else if (deletedCount > 0) {
        toast.success(`${deletedCount} file(s) deleted, ${failedCount} failed`)
      } else {
        toast.error('Failed to delete files')
      }
      
    } catch (error) {
      console.error('Error during bulk deletion:', error)
      setDeletionStage('Deletion failed')
      toast.error('Failed to delete files')
    } finally {
      // Close modal after a brief delay
      setTimeout(() => {
        setIsDeletingFiles(false)
        setDeletionProgress(0)
        setDeletionCurrentStep(0)
        setFilesToDelete([])
      }, 1500)
    }
  }

  const handleStarFile = (fileId) => {
    // TODO: Implement star/favorite functionality in API
    setFiles(prev => prev.map(file => 
      file.id === fileId ? { ...file, starred: !file.starred } : file
    ))
    toast.success('File starred status updated')
  }

  const handleDownloadFile = async (fileId, filename) => {
    try {
      const blob = await api.downloadFile(fileId)
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = filename
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
      toast.success('File downloaded successfully')
    } catch (error) {
      console.error('Error downloading file:', error)
      toast.error('Failed to download file')
    }
  }

  const handleDeleteFile = async (fileId) => {
    const file = files.find(f => f.id === fileId)
    if (!file) return
    
    setFilesToDelete([{ id: fileId, name: file.name }])
    setIsDeletingFiles(true)
    setDeletionProgress(0)
    setDeletionCurrentStep(0)
    setDeletionStage('Preparing to delete file...')
    
    try {
      // Step 1: Preparing
      setDeletionStage('Preparing file deletion...')
      setDeletionCurrentStep(0)
      setDeletionProgress(10)
      await new Promise(resolve => setTimeout(resolve, 300))
      
      // Step 2: Deleting
      setDeletionStage(`Deleting ${file.name}...`)
      setDeletionCurrentStep(1)
      setDeletionProgress(50)
      
      await api.deleteFile(fileId)
      
      // Step 3: Updating interface
      setDeletionStage('Updating file list...')
      setDeletionCurrentStep(2)
      setDeletionProgress(90)
      
      setFiles(prev => prev.filter(f => f.id !== fileId))
      await new Promise(resolve => setTimeout(resolve, 300))
      
      // Step 4: Complete
      setDeletionStage('File deleted successfully!')
      setDeletionCurrentStep(3)
      setDeletionProgress(100)
      
      await new Promise(resolve => setTimeout(resolve, 800))
      toast.success('File deleted successfully')
      
    } catch (error) {
      console.error('Error deleting file:', error)
      setDeletionStage('Deletion failed')
      toast.error('Failed to delete file')
    } finally {
      // Close modal after a brief delay
      setTimeout(() => {
        setIsDeletingFiles(false)
        setDeletionProgress(0)
        setDeletionCurrentStep(0)
        setFilesToDelete([])
      }, 1000)
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-8">
        <div className="animate-pulse">
          <div className="h-8 bg-slate-200 rounded w-1/4 mb-4"></div>
          <div className="h-4 bg-slate-200 rounded w-1/2 mb-8"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="bg-white border-2 border-gray-200 rounded-2xl p-6 shadow-md">
                <div className="h-32 bg-slate-200 rounded-2xl mb-4"></div>
                <div className="h-4 bg-slate-200 rounded mb-2"></div>
                <div className="h-3 bg-slate-200 rounded w-1/2"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Header */}
      <div>
        <div className="mobile-flex-col mobile-gap-lg mb-6 sm:mb-8">
          <div className="flex-1">
            <div className="inline-flex items-center mobile-padding bg-gradient-to-r from-indigo-600 to-purple-600 text-white mobile-rounded text-xs sm:text-sm font-semibold mb-3 sm:mb-4 shadow-md">
              <Layers className="mobile-icon mr-2" />
              File Management
            </div>
            <h1 className="mobile-text-2xl font-bold mb-2 sm:mb-3 text-slate-900">File Manager</h1>
            <p className="mobile-text-sm text-slate-600">
              Manage your PDF documents, images, and files with advanced organization tools
              <br className="hidden sm:block"/><span className="text-indigo-600 text-xs sm:text-sm font-semibold">✨ AI Chat available for PDFs and Images</span>
            </p>
          </div>
          <div className="w-full sm:w-auto">
            <Button className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white hover:shadow-lg transition-all w-full sm:w-auto mobile-btn mobile-touch-target">
              <Upload className="mobile-icon mr-2" />
              Upload Files
            </Button>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="flex flex-col gap-4 mb-6 sm:mb-8">
          <div className="relative">
            <Search className="absolute left-3 sm:left-4 top-1/2 transform -translate-y-1/2 h-4 w-4 sm:h-5 sm:w-5 text-slate-400" />
            <input
              type="text"
              placeholder="Search files..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-white border-2 border-gray-200 text-slate-900 rounded-xl pl-10 sm:pl-12 pr-4 py-2 sm:py-3 text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-300 transition-all shadow-sm hover:shadow-md"
            />
          </div>
          
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex gap-2 sm:gap-3 flex-1">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="flex-1 sm:flex-none bg-white border-2 border-gray-200 text-slate-700 hover:bg-indigo-50 hover:text-indigo-600 hover:border-indigo-300 rounded-xl transition-all text-xs sm:text-sm shadow-sm">
                    <Filter className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                    <span className="hidden sm:inline">Filter</span>
                    <span className="sm:hidden">Filter</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="bg-white/98 backdrop-blur-xl border-2 border-gray-200 rounded-xl shadow-lg">
                  <DropdownMenuItem onClick={() => setFilterType('all')} className="text-slate-700 hover:bg-indigo-50 hover:text-indigo-600 rounded-lg">
                    All Files
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setFilterType('pdf')} className="text-slate-700 hover:bg-indigo-50 hover:text-indigo-600 rounded-lg">
                    PDF Files
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setFilterType('image')} className="text-slate-700 hover:bg-indigo-50 hover:text-indigo-600 rounded-lg">
                    Images
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setFilterType('document')} className="text-slate-700 hover:bg-indigo-50 hover:text-indigo-600 rounded-lg">
                    Documents
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="flex-1 sm:flex-none btn-dark-outline text-xs sm:text-sm">
                    <Calendar className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                    <span className="hidden sm:inline">Sort</span>
                    <span className="sm:hidden">Sort</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="dropdown-dark">
                  <DropdownMenuItem onClick={() => setSortBy('date')} className="dropdown-item-dark">
                    Date Modified
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setSortBy('name')} className="dropdown-item-dark">
                    Name
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setSortBy('size')} className="dropdown-item-dark">
                    File Size
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setSortBy('type')} className="dropdown-item-dark">
                    File Type
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            <div className="flex border border-border rounded-xl bg-elevated w-full sm:w-auto">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setViewMode('grid')}
                className={`flex-1 sm:flex-none rounded-r-none text-xs sm:text-sm ${viewMode === 'grid' ? 'bg-blue-600 text-white' : 'text-grey-400 hover:text-foreground'}`}
              >
                <Grid className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-0" />
                <span className="sm:hidden">Grid</span>
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setViewMode('list')}
                className={`flex-1 sm:flex-none rounded-l-none border-l border-grey-700 text-xs sm:text-sm ${viewMode === 'list' ? 'bg-blue-600 text-white' : 'text-grey-400 hover:text-foreground'}`}
              >
                <List className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-0" />
                <span className="sm:hidden">List</span>
              </Button>
            </div>
          </div>
        </div>

        {/* Selection Actions */}
        {selectedFiles.length > 0 && (
          <div className="dark-card p-4 sm:p-6 mb-6 sm:mb-8 bg-blue-950 border-blue-800">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
                <span className="text-blue-300 font-semibold text-sm sm:text-base">
                  {selectedFiles.length} file(s) selected
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleSelectAll}
                  className="text-blue-300 hover:text-blue-200 hover:bg-blue-900 w-full sm:w-auto justify-center text-xs sm:text-sm"
                >
                  {selectedFiles.length === sortedFiles.length ? 'Deselect All' : 'Select All'}
                </Button>
              </div>
              <div className="grid grid-cols-3 sm:flex gap-2 sm:gap-3">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => {
                    selectedFiles.forEach(fileId => {
                      const file = files.find(f => f.id === fileId)
                      if (file) handleDownloadFile(file.id, file.name)
                    })
                  }}
                  className="text-blue-300 hover:text-blue-200 hover:bg-blue-900 text-xs sm:text-sm"
                >
                  <Download className="h-3 w-3 sm:h-4 sm:w-4 sm:mr-2" />
                  <span className="hidden sm:inline">Download</span>
                </Button>
                <Button variant="ghost" size="sm" className="text-blue-300 hover:text-blue-200 hover:bg-blue-900 text-xs sm:text-sm">
                  <Share className="h-3 w-3 sm:h-4 sm:w-4 sm:mr-2" />
                  <span className="hidden sm:inline">Share</span>
                </Button>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={handleDeleteSelected}
                  className="text-red-400 hover:text-red-300 hover:bg-red-950 text-xs sm:text-sm"
                >
                  <Trash2 className="h-3 w-3 sm:h-4 sm:w-4 sm:mr-2" />
                  <span className="hidden sm:inline">Delete</span>
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Folders */}
      {folders.length > 0 && (
        <div>
          <h2 className="heading-dark-4 mb-6">Folders</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {folders.map((folder) => (
              <div key={folder.id} className="dark-card-hover p-6 cursor-pointer">
                <div className="flex items-center space-x-4">
                  <div className="p-4 bg-blue-900 rounded-2xl">
                    <FolderOpen className="h-8 w-8 text-blue-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-card-foreground truncate">{folder.name}</h3>
                    <p className="text-sm text-muted-foreground">
                      {folder.fileCount} files
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Files */}
      <div>
        <h2 className="heading-dark-4 mb-6">
          Files ({sortedFiles.length})
        </h2>

        {sortedFiles.length === 0 ? (
          <div className="bg-white border-2 border-gray-200 rounded-2xl shadow-md p-16 text-center">
            <div className="p-6 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-full w-24 h-24 mx-auto mb-6 flex items-center justify-center">
              <FileText className="h-12 w-12 text-indigo-600" />
            </div>
            <h3 className="text-2xl font-bold text-slate-900 mb-4">No files found</h3>
            <p className="text-slate-600 mb-8">
              {searchQuery || filterType !== 'all' 
                ? 'Try adjusting your search or filter criteria'
                : 'Upload your first file to get started'
              }
            </p>
            <Button className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white hover:shadow-lg transition-all">
              <Upload className="h-4 w-4 mr-2" />
              Upload Files
            </Button>
          </div>
        ) : (
          <div className={
            viewMode === 'grid' 
              ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6'
              : 'space-y-3'
          }>
            {sortedFiles.map((file) => {
              const FileIconComponent = getFileIcon(file.type)
              const isSelected = selectedFiles.includes(file.id)
              
              return viewMode === 'grid' ? (
                <div 
                  key={file.id}
                  className={`bg-white border-2 rounded-2xl shadow-md hover:shadow-xl transition-all p-6 cursor-pointer relative ${
                    isSelected ? 'ring-2 ring-indigo-500 border-indigo-300 bg-indigo-50' : 'border-gray-200 hover:border-indigo-200'
                  }`}
                  onClick={() => handleFileSelect(file.id)}
                >
                  {/* Selection checkbox */}
                  <div className="absolute top-3 left-3">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => handleFileSelect(file.id)}
                      className="rounded border-gray-300 bg-white text-indigo-600 focus:ring-indigo-500"
                    />
                  </div>

                  {/* Star button */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      handleStarFile(file.id)
                    }}
                    className="absolute top-3 right-3 p-2 rounded-xl hover:bg-indigo-50 transition-colors duration-200"
                  >
                    <Star className={`h-4 w-4 ${
                      file.starred ? 'text-indigo-600 fill-current' : 'text-slate-400'
                    }`} />
                  </button>

                  {/* File preview */}
                  <div className="flex items-center justify-center h-32 mb-6 bg-slate-50 rounded-2xl">
                    <div className={`p-4 rounded-2xl ${getFileColor(file.type)}`}>
                      <FileIconComponent className="h-12 w-12" />
                    </div>
                  </div>

                  {/* File info */}
                  <div className="space-y-3">
                    <h3 className="font-semibold text-slate-900 truncate" title={file.name}>
                      {file.name}
                    </h3>
                    <div className="flex items-center justify-between text-sm text-slate-600">
                      <span>{formatFileSize(file.size)}</span>
                      <span>{formatDate(file.createdAt)}</span>
                    </div>
                    {file.shared && (
                      <div className="flex items-center text-xs text-indigo-600 font-semibold">
                        <Share className="h-3 w-3 mr-1" />
                        Shared
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="mt-6 flex space-x-2">
                    <Button variant="ghost" size="sm" className="flex-1 bg-indigo-50 text-indigo-600 hover:bg-indigo-100 border-2 border-indigo-200 rounded-xl transition-all">
                      <Eye className="h-4 w-4 mr-2" />
                      View
                    </Button>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" className="p-3 bg-slate-100 text-slate-700 hover:bg-slate-200 border-2 border-gray-200 rounded-xl transition-all">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent className="bg-white/98 backdrop-blur-xl border-2 border-gray-200 rounded-xl shadow-lg">
                        <DropdownMenuItem 
                          onClick={(e) => {
                            e.stopPropagation()
                            handleDownloadFile(file.id, file.name)
                          }}
                          className="dropdown-item-dark"
                        >
                          <Download className="mr-3 h-4 w-4" />
                          Download
                        </DropdownMenuItem>
                        <DropdownMenuItem className="dropdown-item-dark">
                          <Copy className="mr-3 h-4 w-4" />
                          Copy Link
                        </DropdownMenuItem>
                        <DropdownMenuItem className="dropdown-item-dark">
                          <Share className="mr-3 h-4 w-4" />
                          Share
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem 
                          onClick={(e) => {
                            e.stopPropagation()
                            handleDeleteFile(file.id)
                          }}
                          className="dropdown-item-dark text-red-400 hover:bg-red-950"
                        >
                          <Trash2 className="mr-3 h-4 w-4" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              ) : (
                <div 
                  key={file.id}
                  className={`dark-card p-6 cursor-pointer ${
                    isSelected ? 'ring-2 ring-blue-500 bg-blue-950 shadow-blue' : ''
                  }`}
                  onClick={() => handleFileSelect(file.id)}
                >
                  <div className="flex items-center space-x-4">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => handleFileSelect(file.id)}
                      className="rounded border-border bg-elevated text-blue-500 focus:ring-blue-500"
                    />
                    
                    <div className={`p-3 rounded-xl ${getFileColor(file.type)}`}>
                      <FileIconComponent className="h-6 w-6" />
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2">
                        <h3 className="font-semibold text-card-foreground truncate">{file.name}</h3>
                        {file.starred && (
                          <Star className="h-4 w-4 text-blue-400 fill-current flex-shrink-0" />
                        )}
                        {file.shared && (
                          <Share className="h-4 w-4 text-blue-400 flex-shrink-0" />
                        )}
                      </div>
                      <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                        <span>{formatFileSize(file.size)}</span>
                        <span>{formatDate(file.createdAt)}</span>
                        <span className="capitalize">{file.type}</span>
                        {file.has_ocr && (
                          <span className="text-green-400 text-xs">OCR</span>
                        )}
                        {file.has_summary && (
                          <span className="text-blue-400 text-xs">Summary</span>
                        )}
                        {file.has_embeddings && (
                          <span className="text-purple-400 text-xs">AI Chat Ready</span>
                        )}
                        {(file.type === 'pdf' || file.type === 'image') && !file.has_embeddings && (
                          <span className="text-yellow-400 text-xs">AI Chat Available</span>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <Button variant="ghost" size="sm" className="btn-dark-glass">
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={(e) => {
                          e.stopPropagation()
                          handleDownloadFile(file.id, file.name)
                        }}
                        className="btn-dark-glass"
                      >
                        <Download className="h-4 w-4" />
                      </Button>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm" className="p-3 btn-dark-glass">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent className="dropdown-dark">
                          <DropdownMenuItem className="dropdown-item-dark">
                            <Copy className="mr-3 h-4 w-4" />
                            Copy Link
                          </DropdownMenuItem>
                          <DropdownMenuItem className="dropdown-item-dark">
                            <Share className="mr-3 h-4 w-4" />
                            Share
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem 
                            onClick={(e) => {
                              e.stopPropagation()
                              handleDeleteFile(file.id)
                            }}
                            className="dropdown-item-dark text-red-400 hover:bg-red-950"
                          >
                            <Trash2 className="mr-3 h-4 w-4" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* File Deletion Progress Modal */}
      <ProcessingModal
        isOpen={isDeletingFiles}
        title="Deleting Files"
        fileName={filesToDelete.length === 1 
          ? filesToDelete[0]?.name 
          : `${filesToDelete.length} files`
        }
        progress={deletionProgress}
        stage={deletionStage}
        icon={Trash2}
        description={filesToDelete.length === 1 
          ? "Removing file from your account and freeing up storage space"
          : `Removing ${filesToDelete.length} files from your account and freeing up storage space`
        }
        steps={[
          { name: 'Preparing', icon: Upload },
          { name: 'Deleting', icon: Trash2 },
          { name: 'Updating', icon: Download },
          { name: 'Complete', icon: Eye }
        ]}
        currentStep={deletionCurrentStep}
        estimatedTime={filesToDelete.length * 2} // 2 seconds per file estimate
      />
    </div>
  )
}

export default FileManager