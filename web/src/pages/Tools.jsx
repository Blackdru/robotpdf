import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useSubscription } from '../contexts/SubscriptionContext'
import { useSubscriptionAccess } from '../hooks/useSubscriptionAccess'
import { api } from '../lib/api'
import { downloadBlob } from '../lib/utils'
import { trackPageViewOnce } from '../lib/visitorTracking'
import { Button } from '../components/ui/button'
import FileUploadModal from '../components/FileUploadModal'
import ProcessingModal from '../components/ProcessingModal'
import AIAssistant from '../components/AIAssistant'
import UpgradeModal from '../components/UpgradeModal'
import FileOrderPreview from '../components/FileOrderPreview'
import PasswordRemoveModal from '../components/PasswordRemoveModal'
import toast from 'react-hot-toast'
import {
  GitMerge,
  Scissors,
  Archive,
  Image,
  FileText,
  Upload,
  Download,
  Zap,
  Star,
  ArrowRight,
  CheckCircle,
  AlertCircle,
  Info,
  Layers,
  Rocket,
  Eye,
  MessageSquare,
  Play,
  Clock,
  Shield,
  Lock,
  Sparkles,
  TrendingUp,
  Users,
  Award,
  Copy,
  FileSpreadsheet,
  FileType
} from 'lucide-react'

const Tools = () => {
  const { user, session } = useAuth()
  const { subscription, usage } = useSubscription()
  const {
    checkAccess,
    showUpgradeModal,
    upgradeModalData,
    closeUpgradeModal,
    filterToolsByAccess
  } = useSubscriptionAccess()

  const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'
  const [selectedTool, setSelectedTool] = useState(null)
  const [uploadedFiles, setUploadedFiles] = useState([])
  const [isProcessing, setIsProcessing] = useState(false)
  const [processedFiles, setProcessedFiles] = useState([])
  const [showUploadModal, setShowUploadModal] = useState(false)
  const [ocrResults, setOcrResults] = useState(null)
  const [toolResults, setToolResults] = useState(null)
  const [clearFileUpload, setClearFileUpload] = useState(false)
  const [showAIAssistant, setShowAIAssistant] = useState(false)
  const [aiAssistantMinimized, setAiAssistantMinimized] = useState(false)
  const [currentFileForAI, setCurrentFileForAI] = useState(null)
  const [processingProgress, setProcessingProgress] = useState(0)
  const [processingStage, setProcessingStage] = useState('Initializing...')
  const [processingSteps, setProcessingSteps] = useState([])
  const [currentStep, setCurrentStep] = useState(0)
  const [showFileOrderPreview, setShowFileOrderPreview] = useState(false)
  const [pendingFiles, setPendingFiles] = useState([])
  const [toolSettings, setToolSettings] = useState({})
  const [showPasswordRemoveModal, setShowPasswordRemoveModal] = useState(false)
  const [pendingPasswordFiles, setPendingPasswordFiles] = useState([])

  const tools = [
    {
      id: 'merge',
      icon: GitMerge,
      title: 'Merge PDFs',
      description: 'Combine multiple PDF files into one document',
      solidColor: 'bg-blue-600',
      color: 'from-blue-500 to-blue-700',
      acceptedFiles: '.pdf',
      multipleFiles: true,
      minFiles: 2,
      category: 'Basic',
      isFree: true,
      popularity: 95,
      processingTime: '< 30s'
    },
    {
      id: 'split',
      icon: Scissors,
      title: 'Split PDF',
      description: 'Extract specific pages or split into multiple files',
      solidColor: 'bg-emerald-600',
      color: 'from-emerald-500 to-emerald-700',
      acceptedFiles: '.pdf',
      multipleFiles: false,
      minFiles: 1,
      category: 'Basic',
      isFree: true,
      popularity: 88,
      processingTime: '< 45s'
    },
    {
      id: 'compress',
      icon: Archive,
      title: 'Compress PDF',
      description: 'Reduce file size while maintaining quality',
      solidColor: 'bg-orange-600',
      color: 'from-orange-500 to-orange-700',
      acceptedFiles: '.pdf',
      multipleFiles: true,
      minFiles: 1,
      category: 'Optimization',
      isFree: true,
      popularity: 92,
      processingTime: '< 60s'
    },
    {
      id: 'convert',
      icon: Image,
      title: 'Images to PDF',
      description: 'Convert images (JPG, PNG) to PDF format',
      solidColor: 'bg-orange-500',
      color: 'from-orange-400 to-orange-600',
      acceptedFiles: '.jpg,.jpeg,.png,.gif,.bmp,.webp',
      multipleFiles: true,
      minFiles: 1,
      category: 'Conversion',
      isFree: true,
      popularity: 85,
      processingTime: '< 90s'
    },
    {
      id: 'html-to-pdf',
      icon: FileText,
      title: 'HTML to PDF',
      description: 'Convert webpage URL to PDF',
      solidColor: 'bg-teal-600',
      color: 'from-teal-500 to-teal-700',
      acceptedFiles: '.html,.htm',
      multipleFiles: false,
      minFiles: 0,
      category: 'Conversion',
      isFree: true,
      popularity: 78,
      processingTime: '< 60s',
      requiresUrlOrFile: true
    },
    {
      id: 'pdf-to-word',
      icon: FileText,
      title: 'PDF to Word',
      description: 'Convert PDF files to editable Word documents',
      solidColor: 'bg-blue-700',
      color: 'from-blue-600 to-indigo-700',
      acceptedFiles: '.pdf',
      multipleFiles: false,
      minFiles: 1,
      category: 'Conversion',
      isFree: true,
      popularity: 94,
      processingTime: '< 60s'
    },
    {
      id: 'word-to-pdf',
      icon: FileType,
      title: 'Word to PDF',
      description: 'Convert Word documents to PDF format',
      solidColor: 'bg-gradient-to-br from-purple-600 to-pink-600',
      color: 'from-purple-600 to-pink-700',
      acceptedFiles: '.doc,.docx',
      multipleFiles: false,
      minFiles: 1,
      category: 'Conversion',
      popularity: 93,
      processingTime: '< 60s',
      requiresPro: true
    },
    {
      id: 'pdf-to-excel',
      icon: FileSpreadsheet,
      title: 'PDF to Excel',
      description: 'Convert PDF files to Excel spreadsheets',
      solidColor: 'bg-emerald-700',
      color: 'from-emerald-600 to-emerald-800',
      acceptedFiles: '.pdf',
      multipleFiles: false,
      minFiles: 1,
      category: 'Conversion',
      isFree: true,
      popularity: 90,
      processingTime: '< 60s'
    },
    {
      id: 'excel-to-pdf',
      icon: FileSpreadsheet,
      title: 'Excel to PDF',
      description: 'Convert Excel spreadsheets to PDF format',
      solidColor: 'bg-gradient-to-br from-orange-600 to-red-600',
      color: 'from-orange-600 to-red-700',
      acceptedFiles: '.xls,.xlsx',
      multipleFiles: false,
      minFiles: 1,
      category: 'Conversion',
      popularity: 89,
      processingTime: '< 60s',
      requiresPro: true
    },
    {
      id: 'password-remove',
      icon: Shield,
      title: 'Password Remover',
      description: 'Remove password protection from your PDFs',
      solidColor: 'bg-amber-600',
      color: 'from-amber-500 to-orange-700',
      acceptedFiles: '.pdf',
      multipleFiles: true,
      minFiles: 1,
      category: 'Security',
      isFree: true,
      popularity: 82,
      processingTime: '< 45s'
    },
  ]

  const categories = ['All', 'Basic', 'Optimization', 'Conversion', 'Security']
  const [selectedCategory, setSelectedCategory] = useState('All')

  // Track visitor when component mounts
  useEffect(() => {
    // Track visitor to tools page (once per session)
    trackPageViewOnce(window.location.href, 'PDF Tools - RobotPDF')
      .then(result => {
        if (result) {
          console.log('Visitor tracked:', result.isNewVisitor ? 'New visitor' : 'Returning visitor');
        }
      })
      .catch(err => {
        console.error('Failed to track visitor:', err);
      });
  }, []); // Empty dependency array means this runs once on mount

  // Filter tools based on category (show all tools regardless of plan)
  const getAvailableTools = () => {
    // Apply category filter only
    if (selectedCategory === 'All') {
      return tools
    } else {
      return tools.filter(tool => tool.category === selectedCategory)
    }
  }

  const filteredTools = getAvailableTools()

  // Progress tracking helper functions
  const updateProgress = (progress, stage, step = null) => {
    setProcessingProgress(progress)
    setProcessingStage(stage)
    if (step !== null) {
      setCurrentStep(step)
    }
  }

  const initializeProcessingSteps = (toolId) => {
    const stepsByTool = {
      'merge': [
        { name: 'Uploading Files', icon: Upload },
        { name: 'Processing PDFs', icon: FileText },
        { name: 'Merging Documents', icon: GitMerge },
        { name: 'Complete', icon: CheckCircle }
      ],
      'split': [
        { name: 'Uploading File', icon: Upload },
        { name: 'Analyzing Structure', icon: Eye },
        { name: 'Splitting Pages', icon: Scissors },
        { name: 'Complete', icon: CheckCircle }
      ],
      'compress': [
        { name: 'Uploading Files', icon: Upload },
        { name: 'Analyzing Content', icon: Eye },
        { name: 'Compressing PDFs', icon: Archive },
        { name: 'Complete', icon: CheckCircle }
      ],
      'convert': [
        { name: 'Uploading Images', icon: Upload },
        { name: 'Processing Images', icon: Image },
        { name: 'Creating PDF', icon: FileText },
        { name: 'Complete', icon: CheckCircle }
      ],
      'ocr': [
        { name: 'Uploading File', icon: Upload },
        { name: 'Image Enhancement', icon: Sparkles },
        { name: 'Text Extraction', icon: Eye },
        { name: 'Complete', icon: CheckCircle }
      ],
      'ai-chat': [
        { name: 'Uploading File', icon: Upload },
        { name: 'Text Processing', icon: FileText },
        { name: 'AI Initialization', icon: MessageSquare },
        { name: 'Complete', icon: CheckCircle }
      ],
      'html-to-pdf': [
        { name: 'Fetching URL', icon: Upload },
        { name: 'Rendering Page', icon: Eye },
        { name: 'Creating PDF', icon: FileText },
        { name: 'Complete', icon: CheckCircle }
      ],
      'password-remove': [
        { name: 'Uploading Files', icon: Upload },
        { name: 'Verifying Password', icon: Shield },
        { name: 'Removing Protection', icon: Lock },
        { name: 'Complete', icon: CheckCircle }
      ]
    }

    const steps = stepsByTool[toolId] || [
      { name: 'Uploading', icon: Upload },
      { name: 'Processing', icon: FileText },
      { name: 'Complete', icon: CheckCircle }
    ]

    setProcessingSteps(steps)
    setCurrentStep(0)
    setProcessingProgress(0)
    setProcessingStage('Initializing...')
  }

  const handleToolSelect = (tool) => {

    // Check if user has access to this tool
    const hasToolAccess = checkAccess(tool.id, tool.title, tool.description)

    if (!hasToolAccess) {

      return // Access denied, upgrade modal will be shown
    }

    setSelectedTool(tool)
    setUploadedFiles([])
    setProcessedFiles([])
    setOcrResults(null)
    setToolResults(null)
    setIsProcessing(false)
    setClearFileUpload(true)
    setTimeout(() => setClearFileUpload(false), 100)

    // Scroll to upload section after tool selection
    setTimeout(() => {
      const uploadSection = document.getElementById('upload-section')
      if (uploadSection) {
        uploadSection.scrollIntoView({ behavior: 'smooth', block: 'center' })
      }
    }, 200)
  }

  const handleFilesUploaded = async (files) => {
    // Clear previous results when new files are uploaded
    setOcrResults(null)
    setToolResults(null)
    setProcessedFiles([])

    // Validate files for selected tool
    const validFiles = validateFilesForTool(files, selectedTool)
    if (validFiles.length === 0) {
      return
    }

    // Check if tool needs password input
    if (selectedTool?.id === 'password-remove') {
      setPendingPasswordFiles(validFiles)
      setShowPasswordRemoveModal(true)
      setShowUploadModal(false)
      return
    }

    // Check if tool needs file ordering (any tool with multiple files support)
    const needsOrdering = selectedTool?.multipleFiles && validFiles.length > 1

    if (needsOrdering) {
      // Show file order preview
      setPendingFiles(validFiles)
      setShowFileOrderPreview(true)
      setShowUploadModal(false)
    } else {
      // Process directly
      setUploadedFiles(validFiles)
      setShowUploadModal(false)

      // Auto-process if we have enough files
      const minRequired = selectedTool?.minFiles === 0 ? 1 : (selectedTool?.minFiles || 1)
      if (validFiles.length >= minRequired) {
        await handleAutoProcess(validFiles)
      }
    }
  }

  const handlePasswordRemoveConfirm = async (settings) => {
    setShowPasswordRemoveModal(false)
    setUploadedFiles(pendingPasswordFiles)
    setToolSettings(settings)
    setPendingPasswordFiles([])

    // Auto-process with password settings
    await handleAutoProcess(pendingPasswordFiles, settings)
  }

  const handleFileOrderConfirm = async (orderedFiles) => {
    setShowFileOrderPreview(false)
    setUploadedFiles(orderedFiles)
    setPendingFiles([])

    // Auto-process with ordered files
    await handleAutoProcess(orderedFiles)
  }

  const handleFileOrderCancel = () => {
    setShowFileOrderPreview(false)
    setPendingFiles([])
  }

  const validateFilesForTool = (files, tool) => {
    if (!tool) return files

    const validFiles = []
    const invalidFiles = []

    files.forEach(file => {
      const isValid = tool.acceptedFiles.split(',').some(type => {
        const cleanType = type.trim().replace('.', '')
        return file.type.includes(cleanType) || file.name.toLowerCase().endsWith(type.trim())
      })

      if (isValid) {
        validFiles.push(file)
      } else {
        invalidFiles.push(file)
      }
    })

    if (invalidFiles.length > 0) {
      toast.error(`Invalid files for ${tool.title}: ${invalidFiles.map(f => f.name).join(', ')}`)
    }

    return validFiles
  }

  const handleAutoProcess = async (files, settings = {}) => {
    // Merge settings with toolSettings
    const finalSettings = { ...toolSettings, ...settings }

    // For HTML to PDF, allow processing with no files if URL is provided
    if (!selectedTool) return
    if (selectedTool.id !== 'html-to-pdf' && files.length === 0) return

    // Free tools don't require authentication
    // Only check usage limits if user is authenticated
    if (user && session && usage && usage.current >= usage.limit && subscription?.plan === 'free') {
      toast.error('You have reached your monthly processing limit. Please upgrade to continue.')
      return
    }

    setIsProcessing(true)

    // Initialize progress tracking
    initializeProcessingSteps(selectedTool.id)
    updateProgress(5, 'Preparing files for processing...', 0)
    await new Promise(resolve => setTimeout(resolve, 300))

    try {
      let uploadedFileIds = []

      // Upload files with detailed progress (skip if no files for HTML to PDF with URL)
      if (files.length > 0) {
        for (let i = 0; i < files.length; i++) {
          const file = files[i]
          const fileNum = i + 1
          const totalFiles = files.length

          try {
            // Calculate progress: 5% to 30% for uploads
            const uploadProgress = 5 + ((fileNum - 1) / totalFiles) * 25
            updateProgress(uploadProgress, `Uploading file ${fileNum}/${totalFiles}: ${file.name}...`, 0)

            const response = await api.uploadFile(file)

            uploadedFileIds.push(response.file.id)

            // Show completion for this file
            const completedProgress = 5 + (fileNum / totalFiles) * 25
            updateProgress(completedProgress, `Uploaded ${fileNum}/${totalFiles} files`, 0)
            await new Promise(resolve => setTimeout(resolve, 200))
          } catch (error) {
            console.error('Upload error for', file.name, ':', error)
            toast.error(`Failed to upload ${file.name}: ${error.message}`)
          }
        }

        if (uploadedFileIds.length === 0 && selectedTool.id !== 'html-to-pdf') {
          toast.error('No files were uploaded successfully. Please check your connection and try again.')
          return
        }

        updateProgress(35, `All ${uploadedFileIds.length} file(s) uploaded successfully`, 1)
        await new Promise(resolve => setTimeout(resolve, 500))
      } else {
        // For HTML to PDF with URL only, skip file upload
        updateProgress(30, 'Preparing to convert URL...', 0)
        await new Promise(resolve => setTimeout(resolve, 300))
      }

      // Process based on tool type with detailed progress
      let result
      const outputName = `${selectedTool.id}-${Date.now()}`

      updateProgress(40, 'Initializing processing...', 1)
      await new Promise(resolve => setTimeout(resolve, 300))

      switch (selectedTool.id) {
        case 'merge':
          if (uploadedFileIds.length < 2) {
            toast.error('Need at least 2 PDF files to merge')
            return
          }
          updateProgress(50, 'Analyzing PDF structures...', 2)
          await new Promise(resolve => setTimeout(resolve, 500))
          updateProgress(65, 'Merging PDFs...', 2)
          result = await api.mergePDFs(uploadedFileIds, `${outputName}.pdf`)
          updateProgress(85, 'Merge complete!', 2)
          break

        case 'split':
          updateProgress(50, 'Analyzing PDF structure...', 2)
          await new Promise(resolve => setTimeout(resolve, 500))
          updateProgress(65, 'Splitting pages...', 2)

          // Split returns a ZIP stream directly
          const splitResponse = await fetch(`${API_BASE_URL}/pdf/split`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${session?.access_token}`
            },
            body: JSON.stringify({
              fileId: uploadedFileIds[0],
              outputName: `${outputName}.pdf`
            })
          })

          if (!splitResponse.ok) {
            const errorData = await splitResponse.json()
            throw new Error(errorData.error || 'Split failed')
          }

          updateProgress(85, 'Preparing download...', 3)
          const splitBlob = await splitResponse.blob()
          updateProgress(100, 'Complete!', 3)
          downloadBlob(splitBlob, `${outputName}_split.zip`)
          toast.success('PDF split successfully! Files downloaded as ZIP.')

          setUploadedFiles([])
          setIsProcessing(false)
          return

        case 'compress':
          updateProgress(50, 'Analyzing file content...', 2)
          await new Promise(resolve => setTimeout(resolve, 500))

          // For multiple files, compress each one
          const compressedFiles = []
          const totalToCompress = uploadedFileIds.length

          for (let i = 0; i < uploadedFileIds.length; i++) {
            const fileId = uploadedFileIds[i]
            try {
              const compressProgress = 50 + ((i + 1) / totalToCompress) * 35
              updateProgress(compressProgress, `Compressing file ${i + 1}/${totalToCompress}...`, 2)

              const compressed = await api.compressPDF(fileId, 0.5, `compressed-${fileId}.pdf`)
              compressedFiles.push(compressed.file)
            } catch (error) {
              console.error('Compression error:', error)
              if (error.message.includes('already optimized')) {
                toast.error(`File ${i + 1} is already optimized`)
              } else {
                toast.error(`Compression failed for file ${i + 1}: ${error.message}`)
              }
            }
          }

          if (compressedFiles.length === 0) {
            toast.error('No files could be compressed - all files are already optimized')
            setUploadedFiles([])
            setIsProcessing(false)
            return
          }

          updateProgress(85, 'Compression complete!', 2)
          result = { files: compressedFiles }
          break

        case 'convert':
          // Validate that all files are images
          const imageTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']
          const hasNonImages = files.some(file => !imageTypes.includes(file.type))

          if (hasNonImages) {
            const nonImageFiles = files.filter(file => !imageTypes.includes(file.type))
            toast.error(`Only image files allowed. Remove: ${nonImageFiles.map(f => f.name).join(', ')}`)
            return
          }

          updateProgress(50, 'Processing images...', 2)
          await new Promise(resolve => setTimeout(resolve, 500))
          updateProgress(70, 'Creating PDF...', 2)
          result = await api.convertImagesToPDF(uploadedFileIds, `${outputName}.pdf`)
          updateProgress(85, 'Conversion complete!', 2)
          break

        case 'password-remove':
          // Remove password protection from PDF
          console.log('Password remove - Settings:', finalSettings)

          if (!finalSettings.password) {
            toast.error('Password is required to unlock the PDF')
            setIsProcessing(false)
            return
          }

          console.log('Password remove - Starting with password:', finalSettings.password.substring(0, 2) + '***')
          updateProgress(50, 'Verifying password...', 2)
          await new Promise(resolve => setTimeout(resolve, 500))

          const unlockedFiles = []
          let passwordError = false

          for (const fileId of uploadedFileIds) {
            if (passwordError) break // Stop if we already had an error

            try {
              updateProgress(60, 'Removing password protection...', 2)
              console.log('Attempting to unlock file:', fileId)

              const unlocked = await api.post('/pdf/advanced/password-remove', {
                fileId: fileId,
                password: finalSettings.password,
                outputName: `unlocked_${Date.now()}.pdf`
              })

              console.log('File unlocked successfully:', unlocked)

              // Verify we got a valid response
              if (!unlocked || !unlocked.file) {
                throw new Error('Invalid response from server')
              }

              unlockedFiles.push(unlocked.file)
            } catch (error) {
              console.error('Password removal error:', error)
              console.error('Error type:', typeof error)
              console.error('Error object:', JSON.stringify(error, null, 2))

              passwordError = true
              const errorMsg = error?.message || String(error)

              // Check if it's a password error
              if (errorMsg.includes('Incorrect password') ||
                errorMsg.includes('password') ||
                errorMsg.includes('decrypt') ||
                errorMsg.includes('encrypted')) {
                toast.error('❌ Incorrect password. Please check your password and try again.', { duration: 6000 })
              } else {
                toast.error(`Failed to remove password: ${errorMsg}`, { duration: 5000 })
              }

              // Stop processing immediately
              console.log('Stopping processing due to error')
              setUploadedFiles([])
              setIsProcessing(false)
              setProcessingProgress(0)
              setProcessingStage('')
              setCurrentStep(0)

              // Force return to prevent any further processing
              throw error
            }
          }

          // Only continue if no errors occurred
          if (passwordError || unlockedFiles.length === 0) {
            console.log('No files were unlocked, stopping')
            setIsProcessing(false)
            return
          }

          console.log('All files unlocked successfully:', unlockedFiles.length)
          updateProgress(85, 'Password removed successfully!', 2)
          result = { files: unlockedFiles }
          break

        case 'ocr':
          // Perform OCR on the uploaded file

          toast.loading('Processing OCR with multi-language support...', { id: 'ocr-processing' })

          try {
            result = await api.post('/ai/ocr', {
              fileId: uploadedFileIds[0],
              language: 'eng+tel', // Default to English + Telugu for better ID card recognition
              enhanceImage: true
            })

            toast.dismiss('ocr-processing')
            toast.success('OCR processing completed! Text extracted successfully.')

            // Store OCR results for display
            setOcrResults({
              text: result.result.text,
              confidence: result.result.confidence,
              filename: result.fileInfo.filename,
              pageCount: result.result.pageCount,
              detectedLanguage: result.result.detectedLanguage
            })
          } catch (ocrError) {
            console.error('OCR specific error:', ocrError)
            toast.dismiss('ocr-processing')
            throw ocrError
          }

          setUploadedFiles([])
          setIsProcessing(false)
          return

        case 'html-to-pdf':
          // Convert HTML/URL to PDF
          updateProgress(50, 'Processing...', 1)
          await new Promise(resolve => setTimeout(resolve, 500))

          // Check if URL or file was provided
          const urlInput = document.getElementById('html-url-input')
          const url = urlInput?.value?.trim()

          if (url) {
            // URL conversion
            // Validate URL format
            try {
              new URL(url)
            } catch (e) {
              toast.error('Please enter a valid URL (e.g., https://example.com)')
              setIsProcessing(false)
              return
            }

            updateProgress(65, 'Fetching and rendering webpage...', 2)

            try {
              result = await api.convertHTMLToPDF(url, `${outputName}.pdf`)

              updateProgress(85, 'PDF created successfully!', 2)
              toast.success('Webpage converted to PDF!')
            } catch (error) {
              console.error('HTML to PDF error:', error)
              throw error
            }
          } else if (uploadedFileIds.length > 0) {
            // HTML file conversion
            updateProgress(65, 'Converting HTML file to PDF...', 2)

            try {
              result = await api.convertHTMLFileToPDF(uploadedFileIds[0], `${outputName}.pdf`)

              updateProgress(85, 'PDF created successfully!', 2)
              toast.success('HTML file converted to PDF!')
            } catch (error) {
              console.error('HTML file to PDF error:', error)
              throw error
            }
          } else {
            toast.error('Please enter a URL or upload an HTML file')
            setIsProcessing(false)
            return
          }
          break

        case 'ai-chat':
          // Initialize AI chat for the uploaded PDF

          toast.loading('Preparing document for AI chat...', { id: 'ai-chat-init' })

          try {
            // First, try to create embeddings directly
            result = await api.post('/ai/create-embeddings', {
              fileId: uploadedFileIds[0]
            })

            toast.dismiss('ai-chat-init')
            toast.success('AI Chat initialized! You can now chat with your document.')
          } catch (embeddingError) {

            // If embeddings fail due to no text content, run OCR first
            if (embeddingError.message.includes('No text content found') ||
              embeddingError.message.includes('Please run OCR')) {

              toast.dismiss('ai-chat-init')
              toast.loading('Extracting text from document...', { id: 'ai-chat-ocr' })

              try {
                // Run OCR first
                const ocrResult = await api.post('/ai/ocr', {
                  fileId: uploadedFileIds[0],
                  language: 'eng+tel',
                  enhanceImage: true
                })

                toast.dismiss('ai-chat-ocr')
                toast.loading('Creating AI embeddings...', { id: 'ai-chat-embeddings' })

                // Now try to create embeddings again
                result = await api.post('/ai/create-embeddings', {
                  fileId: uploadedFileIds[0]
                })

                toast.dismiss('ai-chat-embeddings')
                toast.success('AI Chat initialized! Text extracted and processed successfully.')

              } catch (ocrError) {
                console.error('OCR failed for AI chat:', ocrError)
                toast.dismiss('ai-chat-ocr')
                toast.dismiss('ai-chat-embeddings')
                throw new Error(`Failed to extract text from document: ${ocrError.message}`)
              }
            } else {
              // Different error, re-throw
              toast.dismiss('ai-chat-init')
              throw embeddingError
            }
          }

          // Set up AI Assistant
          setCurrentFileForAI({
            id: uploadedFileIds[0],
            name: files[0].name
          })
          setShowAIAssistant(true)
          setAiAssistantMinimized(false)

          setUploadedFiles([])
          setIsProcessing(false)
          return

        case 'pdf-to-word':
          // Convert PDF to Word (DOCX)
          updateProgress(50, 'Analyzing PDF structure...', 1)
          await new Promise(resolve => setTimeout(resolve, 500))
          updateProgress(70, 'Converting to Word...', 2)

          result = await api.convertPDFToWord(uploadedFileIds[0], `${outputName}.docx`)

          updateProgress(85, 'Conversion complete!', 2)
          toast.success('PDF converted to Word successfully!')
          break

        case 'word-to-pdf':
          // Convert Word to PDF
          updateProgress(50, 'Processing Word document...', 1)
          await new Promise(resolve => setTimeout(resolve, 500))
          updateProgress(70, 'Converting to PDF...', 2)

          result = await api.convertWordToPDF(uploadedFileIds[0], `${outputName}.pdf`)

          updateProgress(85, 'Conversion complete!', 2)
          toast.success('Word converted to PDF successfully!')
          break

        case 'pdf-to-excel':
          // Convert PDF to Excel (XLSX)
          updateProgress(50, 'Analyzing PDF structure...', 1)
          await new Promise(resolve => setTimeout(resolve, 500))
          updateProgress(70, 'Converting to Excel...', 2)

          result = await api.convertPDFToExcel(uploadedFileIds[0], `${outputName}.xlsx`)

          updateProgress(85, 'Conversion complete!', 2)
          toast.success('PDF converted to Excel successfully!')
          break

        case 'excel-to-pdf':
          // Convert Excel to PDF
          updateProgress(50, 'Processing Excel spreadsheet...', 1)
          await new Promise(resolve => setTimeout(resolve, 500))
          updateProgress(70, 'Converting to PDF...', 2)

          result = await api.convertExcelToPDF(uploadedFileIds[0], `${outputName}.pdf`)

          updateProgress(85, 'Conversion complete!', 2)
          toast.success('Excel converted to PDF successfully!')
          break

        default:
          throw new Error('Unknown tool type')
      }

      // Store results for display
      setToolResults({
        type: selectedTool.id,
        result: result,
        timestamp: new Date().toISOString(),
        toolName: selectedTool.title
      })

      // Handle download with progress
      updateProgress(90, 'Preparing download...', processingSteps.length - 1)
      await new Promise(resolve => setTimeout(resolve, 300))

      if (result.file) {
        // Single file result
        try {
          updateProgress(95, 'Downloading result...', processingSteps.length - 1)
          const blob = await api.downloadFile(result.file.id)
          downloadBlob(blob, result.file.filename)
          updateProgress(100, 'Complete!', processingSteps.length - 1)
          toast.success('Processing completed! File downloaded.')
        } catch (downloadError) {
          console.error('Download error:', downloadError)
          toast.error('File processed but download failed. Please try again.')
        }
      } else if (result.files && result.files.length > 0) {
        // Multiple files result
        let downloadCount = 0
        const totalFiles = result.files.length

        for (let i = 0; i < result.files.length; i++) {
          const file = result.files[i]
          try {
            const downloadProgress = 90 + ((i + 1) / totalFiles) * 10
            updateProgress(downloadProgress, `Downloading file ${i + 1}/${totalFiles}...`, processingSteps.length - 1)

            const blob = await api.downloadFile(file.id)
            downloadBlob(blob, file.filename)
            downloadCount++
            await new Promise(resolve => setTimeout(resolve, 200))
          } catch (downloadError) {
            console.error('Download error for file:', file.filename, downloadError)
          }
        }

        updateProgress(100, 'Complete!', processingSteps.length - 1)

        if (downloadCount > 0) {
          toast.success(`Processing completed! ${downloadCount} file(s) downloaded.`)
        } else {
          toast.error('Files processed but downloads failed. Please try again.')
        }
      } else if (result instanceof Blob) {
        // Handle blob response (like split which returns a zip)
        updateProgress(95, 'Downloading result...', processingSteps.length - 1)
        const filename = `${selectedTool.id}-result-${Date.now()}.zip`
        downloadBlob(result, filename)
        updateProgress(100, 'Complete!', processingSteps.length - 1)
        toast.success('Processing completed! Files downloaded.')
      } else if (result && typeof result === 'object' && result.downloadUrl) {
        // Handle direct download URL
        updateProgress(95, 'Downloading result...', processingSteps.length - 1)
        const link = document.createElement('a')
        link.href = result.downloadUrl
        link.download = result.filename || `${selectedTool.id}-result.zip`
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        updateProgress(100, 'Complete!', processingSteps.length - 1)
        toast.success('Processing completed! Files downloaded.')
      } else {
        // No downloadable result
        updateProgress(100, 'Complete!', processingSteps.length - 1)
        toast.success('Processing completed successfully!')
      }

      // Clear uploaded files after successful processing
      setUploadedFiles([])

    } catch (error) {
      console.error('Processing error:', error)

      // Enhanced error messages
      const errorMsg = error?.message || String(error)

      if (errorMsg.includes('File too large') || errorMsg.includes('File size exceeds')) {
        toast.error(errorMsg, { duration: 6000 })
      } else if (errorMsg.includes('No token provided') || errorMsg.includes('Unauthorized')) {
        toast.error('Authentication required. Please sign in to use this feature.')
      } else if (errorMsg.includes('File not found')) {
        toast.error('File upload failed. Please check your connection and try again.')
      } else if (errorMsg.includes('Invalid file type')) {
        toast.error('Invalid file type. Please upload supported file formats only.')
      } else if (errorMsg.includes('Network error') || errorMsg.includes('timeout') || errorMsg.includes('Upload timeout')) {
        toast.error('Upload timeout. The file may be too large or your connection is slow. Please try with a smaller file or check your internet connection.', { duration: 6000 })
      } else if (errorMsg.includes('404')) {
        toast.error('Service temporarily unavailable. Please try again later.')
      } else if (errorMsg.includes('Too many requests')) {
        toast.error('Rate limit exceeded. Please wait a moment and try again.')
      } else if (errorMsg.includes('requires advanced processing') || errorMsg.includes('Upgrade to Pro')) {
        toast.error(errorMsg, { duration: 8000 })
      } else {
        toast.error(`Processing failed: ${errorMsg}`, { duration: 5000 })
      }
    } finally {
      setTimeout(() => setIsProcessing(false), 1500)
    }
  }

  const handleProcess = async () => {
    await handleAutoProcess(uploadedFiles)
  }

  const canProcess = uploadedFiles.length >= (selectedTool?.minFiles || 1)
  const usageExceeded = usage && usage.current >= usage.limit && subscription?.plan === 'free'

  return (
    <div className="min-h-screen bg-gradient-to-b from-white via-slate-50 to-white relative overflow-hidden pb-safe">
      {/* Subtle Background Effects */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -left-40 w-[600px] h-[600px] bg-gradient-to-br from-indigo-100/30 to-purple-100/30 rounded-full blur-3xl"></div>
        <div className="absolute top-40 -right-40 w-[500px] h-[500px] bg-gradient-to-br from-blue-100/30 to-cyan-100/30 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-40 left-1/4 w-[700px] h-[700px] bg-gradient-to-br from-purple-100/20 to-pink-100/20 rounded-full blur-3xl"></div>
      </div>

      <div className="relative z-10">

        {/* Usage Warning */}
        {usageExceeded && (
          <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6 py-3 sm:py-4">
            <div className="bg-red-900 border border-red-800 rounded-2xl p-4 sm:p-6 flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4">
              <AlertCircle className="h-5 w-5 sm:h-6 sm:w-6 text-red-400 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-red-300 mb-1 text-sm sm:text-base">Usage Limit Reached</h3>
                <p className="text-red-400 text-xs sm:text-sm">You've reached your monthly processing limit. Upgrade to continue processing files.</p>
              </div>
              <Button className="w-full sm:w-auto bg-red-700 hover:bg-red-600 text-white text-sm sm:text-base">
                Upgrade Now
              </Button>
            </div>
          </div>
        )}

        {/* Header Section */}
        <div className="max-w-7xl mx-auto mobile-container pt-12 sm:pt-16 pb-8 sm:pb-12">


          {/* Category Filter - Modern */}
          <div className="mobile-overflow-x pb-4">
            <div className="flex justify-center gap-3 sm:gap-4 min-w-max px-2">
              {categories.map((category) => (
                <button
                  key={category}
                  onClick={() => setSelectedCategory(category)}
                  className={`px-6 sm:px-8 py-3 sm:py-4 rounded-xl font-bold transition-all duration-300 whitespace-nowrap text-sm sm:text-base mobile-touch-target ${
                    selectedCategory === category
                      ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg scale-105'
                      : 'bg-white text-gray-700 border border-gray-200 hover:border-indigo-300 hover:text-indigo-600 hover:shadow-md hover:scale-105'
                  }`}
                >
                  {category}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Tools Container */}
        <div className="max-w-7xl mx-auto mobile-container pb-20 sm:pb-12">
          {/* Tools Grid - Modern Design */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5 sm:gap-6 mb-12 sm:mb-16">
            {filteredTools.map((tool, index) => (
              <div
                key={tool.id}
                onClick={() => handleToolSelect(tool)}
                className={`group relative bg-white rounded-2xl transition-all duration-300 cursor-pointer hover:-translate-y-2 overflow-hidden border ${
                  selectedTool?.id === tool.id
                    ? 'shadow-xl scale-105 ring-2 ring-indigo-500 border-indigo-300'
                    : 'shadow-md hover:shadow-xl border-gray-200 hover:border-indigo-200'
                }`}
                style={{
                  animation: `fadeInUp 0.5s ease-out ${index * 0.05}s both`
                }}
              >
                {/* Gradient Background Pattern */}
                <div className="absolute inset-0 bg-gradient-to-br from-indigo-50/50 via-purple-50/50 to-pink-50/50 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>

                {/* Content */}
                <div className="relative p-6">
                  {/* Header */}
                  <div className="flex items-start justify-between mb-4">
                    {/* Icon */}
                    <div className="inline-flex items-center justify-center w-14 h-14 rounded-xl bg-gradient-to-br from-indigo-100 to-purple-100 group-hover:scale-110 transition-transform duration-300">
                      <tool.icon className="h-7 w-7 text-indigo-600" />
                    </div>
                    
                    {/* Free Badge */}
                    <div className="px-3 py-1 rounded-full text-xs font-bold bg-gradient-to-r from-emerald-100 to-green-100 text-emerald-700 border border-emerald-200">
                      FREE
                    </div>
                  </div>

                  {/* Title */}
                  <h3 className="text-lg font-bold text-gray-900 mb-2 group-hover:text-indigo-600 transition-colors">
                    {tool.title}
                  </h3>

                  {/* Description */}
                  <p className="text-sm text-gray-600 leading-relaxed mb-4">
                    {tool.description}
                  </p>

                  {/* Meta Info */}
                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <div className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      <span>{tool.processingTime}</span>
                    </div>
                    {tool.popularity && (
                      <div className="flex items-center gap-1">
                        <TrendingUp className="h-3 w-3" />
                        <span>{tool.popularity}%</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Selection Indicator */}
                {selectedTool?.id === tool.id && (
                  <div className="absolute top-3 left-3">
                    <div className="w-6 h-6 rounded-full bg-indigo-600 flex items-center justify-center">
                      <CheckCircle className="h-4 w-4 text-white" />
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>



          {/* Selected Tool Processing Area */}
          {selectedTool && (
            <div className="bg-surface rounded-2xl sm:rounded-3xl border border-border p-4 sm:p-6 lg:p-8 mb-6 sm:mb-8">
              <div className="flex flex-col sm:flex-row items-start sm:items-center mb-6 sm:mb-8 gap-3 sm:gap-4">
                <div className={`w-10 h-10 sm:w-12 sm:h-12 ${selectedTool.iconBg} rounded-lg sm:rounded-xl flex items-center justify-center flex-shrink-0`}>
                  <selectedTool.icon className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <h2 className="text-lg sm:text-xl lg:text-2xl font-bold text-foreground truncate">{selectedTool.title}</h2>
                  <p className="text-xs sm:text-sm text-muted-foreground line-clamp-2">{selectedTool.description}</p>
                </div>
              </div>

              {/* File Upload Button or URL Input */}
              <div id="upload-section" className="bg-elevated rounded-xl sm:rounded-2xl p-4 sm:p-6 mb-4 sm:mb-6 text-center">
                {selectedTool.requiresUrlOrFile ? (
                  <>
                    <h3 className="text-base sm:text-lg font-semibold text-card-foreground mb-3 sm:mb-4">
                      Enter Webpage URL
                    </h3>

                    <div className="max-w-2xl mx-auto mb-4">
                      <input
                        id="html-url-input"
                        type="url"
                        placeholder="https://example.com"
                        className="w-full px-4 py-3 bg-accent border border-border rounded-lg text-card-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm sm:text-base"
                      />
                    </div>


                    <Button
                      onClick={async () => {
                        const urlInput = document.getElementById('html-url-input')
                        const url = urlInput?.value?.trim()
                        if (url || uploadedFiles.length > 0) {
                          // Pass empty array if only URL is provided
                          await handleAutoProcess(url && uploadedFiles.length === 0 ? [] : uploadedFiles)
                        } else {
                          toast.error('Please enter a URL or upload an HTML file')
                        }
                      }}
                      disabled={isProcessing}
                      className={`bg-gradient-to-r ${selectedTool.color} text-white px-6 sm:px-8 py-3 sm:py-4 text-sm sm:text-base lg:text-lg font-semibold hover:shadow-lg transition-all duration-300 mobile-touch-target w-full sm:w-auto`}
                    >
                      <Download className="h-4 w-4 sm:h-5 sm:w-5 mr-2" />
                      Convert to PDF
                    </Button>
                  </>
                ) : (
                  <>
                    <h3 className="text-base sm:text-lg font-semibold text-card-foreground mb-3 sm:mb-4">
                      {selectedTool.multipleFiles ? 'Upload Files' : 'Upload File'}
                    </h3>

                    <Button
                      onClick={() => setShowUploadModal(true)}
                      className={`bg-gradient-to-r ${selectedTool.color} text-white px-6 sm:px-8 py-3 sm:py-4 text-sm sm:text-base lg:text-lg font-semibold hover:shadow-lg transition-all duration-300 mobile-touch-target w-full sm:w-auto`}
                    >
                      <Upload className="h-4 w-4 sm:h-5 sm:w-5 mr-2" />
                      {selectedTool.multipleFiles ? 'Select Files' : 'Select File'}
                    </Button>

                    <p className="text-xs sm:text-sm text-muted-foreground mt-3">
                      Supports: {selectedTool.acceptedFiles.replace(/\./g, '').toUpperCase()}
                      {selectedTool.multipleFiles && ` • Up to 10 files`}
                    </p>
                  </>
                )}

                {/* Uploaded Files Display */}
                {uploadedFiles.length > 0 && (
                  <div className="mt-4 sm:mt-6 space-y-2 sm:space-y-3">
                    <h4 className="text-xs sm:text-sm font-medium text-card-foreground">
                      Selected Files ({uploadedFiles.length})
                    </h4>
                    <div className="space-y-2">
                      {uploadedFiles.map((file, index) => (
                        <div key={index} className="flex items-center justify-between p-2 sm:p-3 bg-accent rounded-lg mobile-touch-target">
                          <div className="flex items-center space-x-2 sm:space-x-3 flex-1 min-w-0">
                            <FileText className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground flex-shrink-0" />
                            <span className="text-xs sm:text-sm text-card-foreground truncate">{file.name}</span>
                          </div>
                          <span className="text-xs text-muted-foreground whitespace-nowrap ml-2">
                            {(file.size / 1024 / 1024).toFixed(2)} MB
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Tool-specific info */}
                {selectedTool.minFiles > 1 && uploadedFiles.length > 0 && uploadedFiles.length < selectedTool.minFiles && (
                  <div className="mt-4 p-3 sm:p-4 bg-blue-900 border border-blue-800 rounded-xl flex items-start sm:items-center">
                    <Info className="h-4 w-4 sm:h-5 sm:w-5 text-blue-400 mr-2 sm:mr-3 flex-shrink-0 mt-0.5 sm:mt-0" />
                    <p className="text-xs sm:text-sm text-blue-300">
                      You need at least {selectedTool.minFiles} files to use this tool.
                      Upload {selectedTool.minFiles - uploadedFiles.length} more file(s).
                    </p>
                  </div>
                )}
              </div>

              {/* Process Button */}
              {uploadedFiles.length > 0 && (
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 sm:p-6 bg-elevated rounded-xl sm:rounded-2xl gap-4">
                  <div className="flex-1">
                    <h3 className="text-base sm:text-lg font-semibold text-card-foreground mb-1">Ready to Process</h3>
                    <p className="text-xs sm:text-sm text-muted-foreground">
                      {uploadedFiles.length} file(s) ready for {selectedTool.title.toLowerCase()}
                    </p>
                  </div>
                  <Button
                    onClick={handleProcess}
                    disabled={!canProcess || usageExceeded || isProcessing}
                    className={`bg-gradient-to-r ${selectedTool.color} text-white px-6 sm:px-8 py-2.5 sm:py-3 hover:shadow-lg transition-all duration-300 w-full sm:w-auto mobile-touch-target text-sm sm:text-base`}
                  >
                    {isProcessing ? (
                      <>
                        <div className="animate-spin rounded-full h-3 w-3 sm:h-4 sm:w-4 border-2 border-white border-t-transparent mr-2" />
                        Processing...
                      </>
                    ) : (
                      <>
                        <Rocket className="h-3 w-3 sm:h-4 sm:w-4 mr-2" />
                        Process Files
                      </>
                    )}
                  </Button>
                </div>
              )}
            </div>
          )}

          {/* OCR Results Display - Fully Responsive */}
          {ocrResults && (
            <div className="bg-surface rounded-xl sm:rounded-2xl lg:rounded-3xl border border-border p-3 sm:p-5 md:p-6 lg:p-8 mb-4 sm:mb-6 lg:mb-8 shadow-lg">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-3 sm:mb-5 md:mb-6 gap-2 sm:gap-3">
                <div className="flex items-center min-w-0">
                  <div className="flex-shrink-0 p-1.5 sm:p-2 bg-cyan-500/10 rounded-lg sm:rounded-xl mr-2 sm:mr-3">
                    <Eye className="h-4 w-4 sm:h-5 sm:w-5 md:h-6 md:w-6 text-cyan-400" />
                  </div>
                  <h3 className="text-base sm:text-lg md:text-xl font-bold text-card-foreground truncate">OCR Results</h3>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  <div className="bg-green-600 text-white text-xs sm:text-sm font-bold px-2 sm:px-3 py-1 sm:py-1.5 rounded-full whitespace-nowrap">
                    {Math.round((ocrResults.confidence || 0) * 100)}% Accurate
                  </div>
                  <span className="text-xs sm:text-sm bg-elevated text-muted-foreground px-2 sm:px-3 py-1 sm:py-1.5 rounded-full truncate max-w-[120px] sm:max-w-none">
                    {ocrResults.detectedLanguage || 'Unknown'}
                  </span>
                </div>
              </div>

              <div className="space-y-3 sm:space-y-4 md:space-y-5">
                {/* File Info - Fully Responsive */}
                <div className="bg-elevated rounded-lg sm:rounded-xl p-3 sm:p-4 md:p-5">
                  <h4 className="font-semibold text-card-foreground mb-2 sm:mb-3 flex items-center text-xs sm:text-sm md:text-base">
                    <FileText className="h-3 w-3 sm:h-4 sm:w-4 mr-2 flex-shrink-0 text-blue-400" />
                    <span className="truncate" title={ocrResults.filename}>{ocrResults.filename}</span>
                  </h4>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-3 md:gap-4">
                    <div className="bg-accent rounded-lg p-2 sm:p-3">
                      <div className="text-xs text-secondary mb-0.5">Pages</div>
                      <div className="text-sm sm:text-base font-semibold text-card-foreground">{ocrResults.pageCount || 1}</div>
                    </div>
                    <div className="bg-accent rounded-lg p-2 sm:p-3">
                      <div className="text-xs text-secondary mb-0.5">Language</div>
                      <div className="text-sm sm:text-base font-semibold text-card-foreground truncate">{ocrResults.detectedLanguage || 'Auto'}</div>
                    </div>
                    <div className="bg-accent rounded-lg p-2 sm:p-3 col-span-2 sm:col-span-1">
                      <div className="text-xs text-secondary mb-0.5">Confidence</div>
                      <div className="text-sm sm:text-base font-semibold text-green-400">{Math.round((ocrResults.confidence || 0) * 100)}%</div>
                    </div>
                  </div>
                </div>

                {/* Extracted Text - Fully Responsive */}
                <div className="bg-elevated rounded-lg sm:rounded-xl p-3 sm:p-4 md:p-5">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-3 sm:mb-4 gap-2">
                    <h4 className="font-semibold text-card-foreground text-sm sm:text-base md:text-lg flex items-center">
                      <FileText className="h-4 w-4 sm:h-5 sm:w-5 mr-2 text-purple-400 flex-shrink-0" />
                      Extracted Text
                    </h4>
                    <Button
                      onClick={() => {
                        navigator.clipboard.writeText(ocrResults.text)
                        toast.success('Text copied to clipboard!')
                      }}
                      size="sm"
                      variant="outline"
                      className="border-border text-card-foreground hover:bg-accent w-full sm:w-auto min-h-[44px] touch-manipulation text-xs sm:text-sm"
                    >
                      <Copy className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                      Copy Text
                    </Button>
                  </div>
                  <div className="bg-accent rounded-lg p-3 sm:p-4 md:p-5 max-h-[300px] sm:max-h-[400px] md:max-h-[500px] lg:max-h-[600px] overflow-y-auto modern-scrollbar border border-border">
                    <pre className="text-card-foreground text-xs sm:text-sm md:text-base whitespace-pre-wrap font-mono leading-relaxed break-words">
                      {ocrResults.text || 'No text extracted'}
                    </pre>
                  </div>
                  <div className="mt-2 sm:mt-3 flex items-center justify-between text-xs sm:text-sm text-secondary">
                    <span>
                      {ocrResults.text ? `${ocrResults.text.length.toLocaleString()} characters` : 'No text found'}
                    </span>
                    {ocrResults.text && (
                      <span>
                        {ocrResults.text.split(/\s+/).filter(w => w.length > 0).length.toLocaleString()} words
                      </span>
                    )}
                  </div>
                </div>

                {/* Actions - Mobile First */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-3 sm:p-4 bg-elevated rounded-xl gap-3 sm:gap-4">
                  <div className="flex-1">
                    <h4 className="font-medium text-card-foreground mb-1 text-sm sm:text-base">Text Extracted Successfully!</h4>
                    <p className="text-muted-foreground text-xs sm:text-sm">
                      You can now copy the text or use it for further processing.
                    </p>
                  </div>
                  <div className="flex flex-col sm:flex-row gap-2 sm:space-x-3 sm:gap-0">
                    <Button
                      onClick={() => {
                        const blob = new Blob([ocrResults.text], { type: 'text/plain' });
                        const url = URL.createObjectURL(blob);
                        const a = document.createElement('a');
                        a.href = url;
                        a.download = `${ocrResults.filename.replace(/\.[^/.]+$/, '')}_extracted_text.txt`;
                        document.body.appendChild(a);
                        a.click();
                        document.body.removeChild(a);
                        URL.revokeObjectURL(url);
                        toast.success('Text file downloaded!');
                      }}
                      className="bg-cyan-600 hover:bg-cyan-700 text-white w-full sm:w-auto mobile-touch-target text-sm"
                    >
                      <Download className="h-3 w-3 sm:h-4 sm:w-4 mr-2" />
                      Download
                    </Button>
                    <Button
                      onClick={() => setOcrResults(null)}
                      variant="outline"
                      className="border-border text-card-foreground hover:bg-accent w-full sm:w-auto mobile-touch-target text-sm"
                    >
                      Clear
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* AI Chat Results Display - Mobile First */}
          {toolResults && toolResults.type === 'ai-chat' && (
            <div className="bg-surface rounded-2xl sm:rounded-3xl border border-border p-4 sm:p-6 lg:p-8 mb-6 sm:mb-8">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 sm:mb-6 gap-3">
                <div className="flex items-center">
                  <MessageSquare className="h-5 w-5 sm:h-6 sm:w-6 text-pink-400 mr-2 sm:mr-3" />
                  <h3 className="text-lg sm:text-xl font-semibold text-card-foreground">AI Chat Initialized</h3>
                </div>
                <div className="bg-green-600 text-white text-xs font-bold px-3 py-1 rounded-full self-start sm:self-auto">
                  Ready
                </div>
              </div>

              <div className="bg-elevated rounded-xl p-4 sm:p-6 text-center">
                <MessageSquare className="h-10 w-10 sm:h-12 sm:w-12 text-pink-400 mx-auto mb-3 sm:mb-4" />
                <h4 className="text-base sm:text-lg font-semibold text-card-foreground mb-2">
                  AI Chat is Ready!
                </h4>
                <p className="text-xs sm:text-sm text-muted-foreground mb-4 px-2">
                  Your document has been processed and is ready for AI-powered conversations.
                  You can now ask questions about the content.
                </p>
                <Button className="bg-pink-600 hover:bg-pink-700 text-white w-full sm:w-auto mobile-touch-target">
                  <MessageSquare className="h-3 w-3 sm:h-4 sm:w-4 mr-2" />
                  Start Chatting
                </Button>
              </div>
            </div>
          )}

          {/* Tool Results Display - Mobile First */}
          {toolResults && !['ocr', 'ai-chat'].includes(toolResults.type) && (
            <div className="bg-surface rounded-2xl sm:rounded-3xl border border-border p-4 sm:p-6 lg:p-8 mb-6 sm:mb-8">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 sm:mb-6 gap-3">
                <div className="flex items-center">
                  <CheckCircle className="h-5 w-5 sm:h-6 sm:w-6 text-green-400 mr-2 sm:mr-3" />
                  <h3 className="text-lg sm:text-xl font-semibold text-card-foreground">Processing Complete</h3>
                </div>
                <div className="bg-green-600 text-white text-xs font-bold px-3 py-1 rounded-full self-start sm:self-auto">
                  Success
                </div>
              </div>

              <div className="bg-elevated rounded-xl p-4 sm:p-6">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div className="flex-1">
                    <h4 className="text-base sm:text-lg font-semibold text-card-foreground mb-1">
                      {toolResults.toolName} Completed
                    </h4>
                    <p className="text-xs sm:text-sm text-muted-foreground">
                      Your files have been processed successfully and downloaded.
                    </p>
                  </div>
                  <div className="text-left sm:text-right">
                    <div className="text-xs sm:text-sm text-muted-foreground">
                      {new Date(toolResults.timestamp).toLocaleString()}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

        </div>
      </div>

      {/* File Upload Modal */}
      <FileUploadModal
        isOpen={showUploadModal}
        onClose={() => setShowUploadModal(false)}
        onFilesUploaded={handleFilesUploaded}
        acceptedFiles={selectedTool?.acceptedFiles || '.pdf'}
        multiple={selectedTool?.multipleFiles || false}
        maxFiles={selectedTool?.multipleFiles ? 10 : 1}
        title={`Upload Files for ${selectedTool?.title || 'Processing'}`}
        description={selectedTool?.description || 'Select files to upload and process'}
        toolName={selectedTool?.title || ''}
        toolIcon={selectedTool?.icon || Upload}
      />

      {/* Processing Modal */}
      <ProcessingModal
        isOpen={isProcessing}
        title={selectedTool ? `${selectedTool.title}` : 'Processing'}
        fileName={uploadedFiles.map(f => f.name).join(', ')}
        progress={processingProgress}
        stage={processingStage}
        icon={selectedTool ? selectedTool.icon : FileText}
        description={selectedTool ? selectedTool.description : 'Processing your files with advanced options'}
        steps={processingSteps}
        currentStep={currentStep}
        estimatedTime={selectedTool ? parseInt(selectedTool.processingTime.replace(/[^\d]/g, '')) : 60}
      />

      {/* AI Assistant */}
      {showAIAssistant && currentFileForAI && (
        <div className="fixed bottom-4 right-4 z-50">
          <AIAssistant
            fileId={currentFileForAI.id}
            fileName={currentFileForAI.name}
            onClose={() => setShowAIAssistant(false)}
            isMinimized={aiAssistantMinimized}
            onToggleMinimize={() => setAiAssistantMinimized(!aiAssistantMinimized)}
          />
        </div>
      )}

      {/* Upgrade Modal */}
      <UpgradeModal
        isOpen={showUpgradeModal}
        onClose={closeUpgradeModal}
        requiredPlan={upgradeModalData.requiredPlan}
        toolName={upgradeModalData.toolName}
        toolDescription={upgradeModalData.toolDescription}
      />

      {/* File Order Preview Modal */}
      {showFileOrderPreview && (
        <FileOrderPreview
          files={pendingFiles}
          onConfirm={handleFileOrderConfirm}
          onCancel={handleFileOrderCancel}
        />
      )}

      {/* Password Remove Modal */}
      <PasswordRemoveModal
        isOpen={showPasswordRemoveModal}
        onClose={() => {
          setShowPasswordRemoveModal(false)
          setPendingPasswordFiles([])
        }}
        onConfirm={handlePasswordRemoveConfirm}
        fileCount={pendingPasswordFiles.length}
      />

    </div>
  )
}

export default Tools