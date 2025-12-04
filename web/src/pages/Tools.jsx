import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useSubscription } from '../contexts/SubscriptionContext'
import { useSubscriptionAccess } from '../hooks/useSubscriptionAccess'
import { api } from '../lib/api'
import { downloadBlob } from '../lib/utils'
import { trackPageViewOnce } from '../lib/visitorTracking'
import { Button } from '../components/ui/button'
import { Badge } from '../components/ui/badge'
import FileUploadModal from '../components/FileUploadModal'
import ProcessingModal from '../components/ProcessingModal'
import AIAssistant from '../components/AIAssistant'
import UpgradeModal from '../components/UpgradeModal'
import FileOrderPreview from '../components/FileOrderPreview'
import PasswordRemoveModal from '../components/PasswordRemoveModal'

import toast from 'react-hot-toast'
import {
  GitMerge, Scissors, Archive, Image, FileText, Upload, Download, Zap, Star,
  ArrowRight, CheckCircle, AlertCircle, Info, Layers, Rocket, Eye, MessageSquare,
  Play, Clock, Shield, Lock, Sparkles, TrendingUp, Users, Award, Copy,
  FileSpreadsheet, FileType, ChevronRight, Search, Filter, Grid3X3, LayoutGrid
} from 'lucide-react'

const Tools = () => {
  const { user, session } = useAuth()
  const { subscription, usage } = useSubscription()
  const {
    checkAccess, showUpgradeModal, upgradeModalData, closeUpgradeModal, filterToolsByAccess
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
      iconBg: 'bg-blue-500',
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
      iconBg: 'bg-emerald-500',
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
      iconBg: 'bg-orange-500',
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
      iconBg: 'bg-orange-400',
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
      iconBg: 'bg-teal-500',
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
      iconBg: 'bg-blue-600',
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
      iconBg: 'bg-purple-600',
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
      iconBg: 'bg-emerald-600',
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
      iconBg: 'bg-orange-600',
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
      iconBg: 'bg-amber-500',
      acceptedFiles: '.pdf',
      multipleFiles: true,
      minFiles: 1,
      category: 'Security',
      isFree: true,
      popularity: 82,
      processingTime: '< 45s'
    },
    {
      id: 'text-to-pdf',
      icon: FileText,
      title: 'Text to PDF',
      description: 'Type or paste text to convert into PDF documents',
      solidColor: 'bg-violet-600',
      color: 'from-violet-500 to-purple-700',
      iconBg: 'bg-violet-500',
      acceptedFiles: '.txt',
      multipleFiles: true,
      minFiles: 0,
      category: 'Conversion',
      isFree: true,
      popularity: 80,
      processingTime: '< 30s',
      requiresTextOrFile: true
    },
    {
      id: 'image-compress',
      icon: Image,
      title: 'Image Compressor',
      description: 'Compress images to 50% size with fixed quality',
      solidColor: 'bg-gradient-to-br from-pink-600 to-rose-600',
      color: 'from-pink-500 to-rose-700',
      iconBg: 'bg-pink-500',
      acceptedFiles: '.jpg,.jpeg,.png,.webp,.gif,.bmp',
      multipleFiles: true,
      minFiles: 1,
      category: 'Optimization',
      isFree: true,
      popularity: 86,
      processingTime: '< 45s'
    }
  ]

  const categories = ['All', 'Basic', 'Optimization', 'Conversion', 'Security']
  const [selectedCategory, setSelectedCategory] = useState('All')


  useEffect(() => {
    trackPageViewOnce(window.location.href, 'PDF Tools - RobotPDF')
      .then(result => {
        if (result) console.log('Visitor tracked:', result.isNewVisitor ? 'New visitor' : 'Returning visitor')
      })
      .catch(err => console.error('Failed to track visitor:', err))
  }, [])

  const getAvailableTools = () => {
    if (selectedCategory === 'All') return tools
    return tools.filter(tool => tool.category === selectedCategory)
  }

  const filteredTools = getAvailableTools()

  const updateProgress = (progress, stage, step = null) => {
    setProcessingProgress(progress)
    setProcessingStage(stage)
    if (step !== null) setCurrentStep(step)
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
      ],
      'text-to-pdf': [
        { name: 'Uploading Text Files', icon: Upload },
        { name: 'Processing Text', icon: FileText },
        { name: 'Creating PDF', icon: FileText },
        { name: 'Complete', icon: CheckCircle }
      ],
      'image-compress': [
        { name: 'Uploading Images', icon: Upload },
        { name: 'Analyzing Images', icon: Eye },
        { name: 'Compressing Images', icon: Image },
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
    const hasToolAccess = checkAccess(tool.id, tool.title, tool.description)
    if (!hasToolAccess) return
    setSelectedTool(tool)
    setUploadedFiles([])
    setProcessedFiles([])
    setOcrResults(null)
    setToolResults(null)
    setIsProcessing(false)
    setClearFileUpload(true)
    setTimeout(() => setClearFileUpload(false), 100)
    setTimeout(() => {
      const uploadSection = document.getElementById('upload-section')
      if (uploadSection) uploadSection.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }, 200)
  }

  const handleFilesUploaded = async (files) => {
    setOcrResults(null)
    setToolResults(null)
    setProcessedFiles([])
    const validFiles = validateFilesForTool(files, selectedTool)
    if (validFiles.length === 0) return
    if (selectedTool?.id === 'password-remove') {
      setPendingPasswordFiles(validFiles)
      setShowPasswordRemoveModal(true)
      setShowUploadModal(false)
      return
    }
    const needsOrdering = selectedTool?.multipleFiles && validFiles.length > 1
    if (needsOrdering) {
      setPendingFiles(validFiles)
      setShowFileOrderPreview(true)
      setShowUploadModal(false)
    } else {
      setUploadedFiles(validFiles)
      setShowUploadModal(false)
      const minRequired = selectedTool?.minFiles === 0 ? 1 : (selectedTool?.minFiles || 1)
      if (validFiles.length >= minRequired) await handleAutoProcess(validFiles)
    }
  }

  const handlePasswordRemoveConfirm = async (settings) => {
    setShowPasswordRemoveModal(false)
    setUploadedFiles(pendingPasswordFiles)
    setToolSettings(settings)
    setPendingPasswordFiles([])
    await handleAutoProcess(pendingPasswordFiles, settings)
  }

  const handleFileOrderConfirm = async (orderedFiles) => {
    setShowFileOrderPreview(false)
    setUploadedFiles(orderedFiles)
    setPendingFiles([])
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
      if (isValid) validFiles.push(file)
      else invalidFiles.push(file)
    })
    if (invalidFiles.length > 0) {
      toast.error(`Invalid files for ${tool.title}: ${invalidFiles.map(f => f.name).join(', ')}`)
    }
    return validFiles
  }


  const handleAutoProcess = async (files, settings = {}) => {
    const finalSettings = { ...toolSettings, ...settings }
    if (!selectedTool) return
    if (selectedTool.id !== 'html-to-pdf' && selectedTool.id !== 'text-to-pdf' && files.length === 0) return
    if (selectedTool.id === 'text-to-pdf' && files.length === 0 && !finalSettings.directText) return
    if (user && session && usage && usage.current >= usage.limit && subscription?.plan === 'free') {
      toast.error('You have reached your monthly processing limit. Please upgrade to continue.')
      return
    }
    setIsProcessing(true)
    initializeProcessingSteps(selectedTool.id)
    updateProgress(5, 'Preparing files for processing...', 0)
    await new Promise(resolve => setTimeout(resolve, 300))

    try {
      let uploadedFileIds = []
      if (files.length > 0) {
        for (let i = 0; i < files.length; i++) {
          const file = files[i]
          const fileNum = i + 1
          const totalFiles = files.length
          try {
            const uploadProgress = 5 + ((fileNum - 1) / totalFiles) * 25
            updateProgress(uploadProgress, `Uploading file ${fileNum}/${totalFiles}: ${file.name}...`, 0)
            const response = await api.uploadFile(file)
            uploadedFileIds.push(response.file.id)
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
        updateProgress(30, 'Preparing to convert URL...', 0)
        await new Promise(resolve => setTimeout(resolve, 300))
      }

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
          const splitResponse = await fetch(`${API_BASE_URL}/pdf/split`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${session?.access_token}` },
            body: JSON.stringify({ fileId: uploadedFileIds[0], outputName: `${outputName}.pdf` })
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
              if (error.message.includes('already optimized')) toast.error(`File ${i + 1} is already optimized`)
              else toast.error(`Compression failed for file ${i + 1}: ${error.message}`)
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
          if (!finalSettings.password) {
            toast.error('Password is required to unlock the PDF')
            setIsProcessing(false)
            return
          }
          updateProgress(50, 'Verifying password...', 2)
          await new Promise(resolve => setTimeout(resolve, 500))
          const unlockedFiles = []
          let passwordError = false
          for (const fileId of uploadedFileIds) {
            if (passwordError) break
            try {
              updateProgress(60, 'Removing password protection...', 2)
              const unlocked = await api.post('/pdf/advanced/password-remove', {
                fileId: fileId,
                password: finalSettings.password,
                outputName: `unlocked_${Date.now()}.pdf`
              })
              if (!unlocked || !unlocked.file) throw new Error('Invalid response from server')
              unlockedFiles.push(unlocked.file)
            } catch (error) {
              passwordError = true
              const errorMsg = error?.message || String(error)
              if (errorMsg.includes('Incorrect password') || errorMsg.includes('password') || errorMsg.includes('decrypt') || errorMsg.includes('encrypted')) {
                toast.error('❌ Incorrect password. Please check your password and try again.', { duration: 6000 })
              } else {
                toast.error(`Failed to remove password: ${errorMsg}`, { duration: 5000 })
              }
              setUploadedFiles([])
              setIsProcessing(false)
              setProcessingProgress(0)
              setProcessingStage('')
              setCurrentStep(0)
              throw error
            }
          }
          if (passwordError || unlockedFiles.length === 0) {
            setIsProcessing(false)
            return
          }
          updateProgress(85, 'Password removed successfully!', 2)
          result = { files: unlockedFiles }
          break


        case 'ocr':
          toast.loading('Processing OCR with AI text cleaning...', { id: 'ocr-processing' })
          try {
            result = await api.post('/ai/ocr', {
              fileId: uploadedFileIds[0],
              language: 'eng+tel',
              enhanceImage: true,
              aiEnhanced: true,
              extractOriginal: false
            })
            toast.dismiss('ocr-processing')
            if (result.result.aiEnhanced) toast.success('OCR completed with AI enhancement! Text cleaned and structured.')
            else if (result.result.localCleaned) toast.success('OCR completed with local text cleaning!')
            else toast.success('OCR processing completed! Text extracted successfully.')
            setOcrResults({
              text: result.result.text,
              originalText: result.result.originalText,
              enhancedText: result.result.enhancedText,
              confidence: result.result.confidence,
              filename: result.fileInfo.filename,
              pageCount: result.result.pageCount,
              detectedLanguage: result.result.detectedLanguage,
              aiEnhanced: result.result.aiEnhanced,
              localCleaned: result.result.localCleaned
            })
          } catch (ocrError) {
            toast.dismiss('ocr-processing')
            throw ocrError
          }
          setUploadedFiles([])
          setIsProcessing(false)
          return

        case 'html-to-pdf':
          updateProgress(50, 'Processing...', 1)
          await new Promise(resolve => setTimeout(resolve, 500))
          const urlInput = document.getElementById('html-url-input')
          const url = urlInput?.value?.trim()
          if (url) {
            try { new URL(url) } catch (e) {
              toast.error('Please enter a valid URL (e.g., https://example.com)')
              setIsProcessing(false)
              return
            }
            updateProgress(65, 'Fetching and rendering webpage...', 2)
            try {
              result = await api.convertHTMLToPDF(url, `${outputName}.pdf`)
              updateProgress(85, 'PDF created successfully!', 2)
              toast.success('Webpage converted to PDF!')
            } catch (error) { throw error }
          } else if (uploadedFileIds.length > 0) {
            updateProgress(65, 'Converting HTML file to PDF...', 2)
            try {
              result = await api.convertHTMLFileToPDF(uploadedFileIds[0], `${outputName}.pdf`)
              updateProgress(85, 'PDF created successfully!', 2)
              toast.success('HTML file converted to PDF!')
            } catch (error) { throw error }
          } else {
            toast.error('Please enter a URL or upload an HTML file')
            setIsProcessing(false)
            return
          }
          break

        case 'ai-chat':
          toast.loading('Preparing document for AI chat...', { id: 'ai-chat-init' })
          try {
            result = await api.post('/ai/create-embeddings', { fileId: uploadedFileIds[0] })
            toast.dismiss('ai-chat-init')
            toast.success('AI Chat initialized! You can now chat with your document.')
          } catch (embeddingError) {
            if (embeddingError.message.includes('No text content found') || embeddingError.message.includes('Please run OCR')) {
              toast.dismiss('ai-chat-init')
              toast.loading('Extracting text from document...', { id: 'ai-chat-ocr' })
              try {
                await api.post('/ai/ocr', { fileId: uploadedFileIds[0], language: 'eng+tel', enhanceImage: true })
                toast.dismiss('ai-chat-ocr')
                toast.loading('Creating AI embeddings...', { id: 'ai-chat-embeddings' })
                result = await api.post('/ai/create-embeddings', { fileId: uploadedFileIds[0] })
                toast.dismiss('ai-chat-embeddings')
                toast.success('AI Chat initialized! Text extracted and processed successfully.')
              } catch (ocrError) {
                toast.dismiss('ai-chat-ocr')
                toast.dismiss('ai-chat-embeddings')
                throw new Error(`Failed to extract text from document: ${ocrError.message}`)
              }
            } else {
              toast.dismiss('ai-chat-init')
              throw embeddingError
            }
          }
          setCurrentFileForAI({ id: uploadedFileIds[0], name: files[0].name })
          setShowAIAssistant(true)
          setAiAssistantMinimized(false)
          setUploadedFiles([])
          setIsProcessing(false)
          return

        case 'pdf-to-word':
          updateProgress(50, 'Analyzing PDF structure...', 1)
          await new Promise(resolve => setTimeout(resolve, 500))
          updateProgress(70, 'Converting to Word...', 2)
          result = await api.convertPDFToWord(uploadedFileIds[0], `${outputName}.docx`)
          updateProgress(85, 'Conversion complete!', 2)
          toast.success('PDF converted to Word successfully!')
          break

        case 'word-to-pdf':
          updateProgress(50, 'Processing Word document...', 1)
          await new Promise(resolve => setTimeout(resolve, 500))
          updateProgress(70, 'Converting to PDF...', 2)
          result = await api.convertWordToPDF(uploadedFileIds[0], `${outputName}.pdf`)
          updateProgress(85, 'Conversion complete!', 2)
          toast.success('Word converted to PDF successfully!')
          break

        case 'pdf-to-excel':
          updateProgress(50, 'Analyzing PDF structure...', 1)
          await new Promise(resolve => setTimeout(resolve, 500))
          updateProgress(70, 'Converting to Excel...', 2)
          result = await api.convertPDFToExcel(uploadedFileIds[0], `${outputName}.xlsx`)
          updateProgress(85, 'Conversion complete!', 2)
          toast.success('PDF converted to Excel successfully!')
          break

        case 'excel-to-pdf':
          updateProgress(50, 'Processing Excel spreadsheet...', 1)
          await new Promise(resolve => setTimeout(resolve, 500))
          updateProgress(70, 'Converting to PDF...', 2)
          result = await api.convertExcelToPDF(uploadedFileIds[0], `${outputName}.pdf`)
          updateProgress(85, 'Conversion complete!', 2)
          toast.success('Excel converted to PDF successfully!')
          break

        case 'text-to-pdf':
          updateProgress(50, 'Processing text...', 1)
          await new Promise(resolve => setTimeout(resolve, 500))
          updateProgress(70, 'Creating PDF...', 2)
          if (finalSettings.directText) result = await api.convertDirectTextToPDF(finalSettings.directText, `${outputName}.pdf`)
          else result = await api.convertTextToPDF(uploadedFileIds, `${outputName}.pdf`)
          updateProgress(85, 'Conversion complete!', 2)
          toast.success('Text converted to PDF successfully!')
          break

        case 'image-compress':
          updateProgress(50, 'Analyzing images...', 1)
          await new Promise(resolve => setTimeout(resolve, 500))
          const compressedImages = []
          const totalImages = uploadedFileIds.length
          for (let i = 0; i < uploadedFileIds.length; i++) {
            const fileId = uploadedFileIds[i]
            try {
              const compressProgress = 50 + ((i + 1) / totalImages) * 35
              updateProgress(compressProgress, `Compressing image ${i + 1}/${totalImages}...`, 2)
              const compressed = await api.post('/pdf/compress-image', {
                fileId: fileId, compressionMode: 'quality', quality: 50, targetSizeKB: null,
                outputFormat: 'original', minQuality: 30, preserveMetadata: false, resizeImage: false,
                outputName: `compressed-${Date.now()}-${i}`
              })
              compressedImages.push(compressed.file)
            } catch (error) {
              toast.error(`Compression failed for image ${i + 1}: ${error.message}`)
            }
          }
          if (compressedImages.length === 0) {
            toast.error('No images could be compressed')
            setUploadedFiles([])
            setIsProcessing(false)
            return
          }
          updateProgress(85, 'Compression complete!', 2)
          result = { files: compressedImages }
          toast.success(`${compressedImages.length} image(s) compressed successfully!`)
          break

        default:
          throw new Error('Unknown tool type')
      }


      setToolResults({ type: selectedTool.id, result: result, timestamp: new Date().toISOString(), toolName: selectedTool.title })
      updateProgress(90, 'Preparing download...', processingSteps.length - 1)
      await new Promise(resolve => setTimeout(resolve, 300))

      if (result.file) {
        try {
          updateProgress(95, 'Downloading result...', processingSteps.length - 1)
          const blob = await api.downloadFile(result.file.id)
          downloadBlob(blob, result.file.filename)
          updateProgress(100, 'Complete!', processingSteps.length - 1)
          toast.success('Processing completed! File downloaded.')
        } catch (downloadError) {
          toast.error('File processed but download failed. Please try again.')
        }
      } else if (result.files && result.files.length > 0) {
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
        if (downloadCount > 0) toast.success(`Processing completed! ${downloadCount} file(s) downloaded.`)
        else toast.error('Files processed but downloads failed. Please try again.')
      } else if (result instanceof Blob) {
        updateProgress(95, 'Downloading result...', processingSteps.length - 1)
        const filename = `${selectedTool.id}-result-${Date.now()}.zip`
        downloadBlob(result, filename)
        updateProgress(100, 'Complete!', processingSteps.length - 1)
        toast.success('Processing completed! Files downloaded.')
      } else if (result && typeof result === 'object' && result.downloadUrl) {
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
        updateProgress(100, 'Complete!', processingSteps.length - 1)
        toast.success('Processing completed successfully!')
      }
      setUploadedFiles([])
    } catch (error) {
      console.error('Processing error:', error)
      const errorMsg = error?.message || String(error)
      if (errorMsg.includes('File too large') || errorMsg.includes('File size exceeds')) toast.error(errorMsg, { duration: 6000 })
      else if (errorMsg.includes('No token provided') || errorMsg.includes('Unauthorized')) toast.error('Authentication required. Please sign in to use this feature.')
      else if (errorMsg.includes('File not found')) toast.error('File upload failed. Please check your connection and try again.')
      else if (errorMsg.includes('Invalid file type')) toast.error('Invalid file type. Please upload supported file formats only.')
      else if (errorMsg.includes('Network error') || errorMsg.includes('timeout') || errorMsg.includes('Upload timeout')) toast.error('Upload timeout. The file may be too large or your connection is slow.', { duration: 6000 })
      else if (errorMsg.includes('404')) toast.error('Service temporarily unavailable. Please try again later.')
      else if (errorMsg.includes('Too many requests')) toast.error('Rate limit exceeded. Please wait a moment and try again.')
      else if (errorMsg.includes('requires advanced processing') || errorMsg.includes('Upgrade to Pro')) toast.error(errorMsg, { duration: 8000 })
      else toast.error(`Processing failed: ${errorMsg}`, { duration: 5000 })
    } finally {
      setTimeout(() => setIsProcessing(false), 1500)
    }
  }

  const handleProcess = async () => { await handleAutoProcess(uploadedFiles) }
  const canProcess = uploadedFiles.length >= (selectedTool?.minFiles || 1)
  const usageExceeded = usage && usage.current >= usage.limit && subscription?.plan === 'free'


  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-indigo-50/30 relative overflow-hidden">
      {/* Animated Background Elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -left-40 w-[500px] h-[500px] bg-gradient-to-br from-indigo-200/40 to-purple-200/40 rounded-full blur-3xl animate-blob"></div>
        <div className="absolute top-1/3 -right-32 w-[400px] h-[400px] bg-gradient-to-br from-blue-200/30 to-cyan-200/30 rounded-full blur-3xl animate-blob" style={{ animationDelay: '2s' }}></div>
        <div className="absolute -bottom-40 left-1/3 w-[600px] h-[600px] bg-gradient-to-br from-purple-200/20 to-pink-200/20 rounded-full blur-3xl animate-blob" style={{ animationDelay: '4s' }}></div>
      </div>

      <div className="relative z-10">
        {/* Usage Warning Banner */}
        {usageExceeded && (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="bg-gradient-to-r from-red-500 to-rose-500 rounded-2xl p-4 sm:p-6 flex flex-col sm:flex-row items-start sm:items-center gap-4 shadow-lg shadow-red-500/20">
              <div className="p-2 bg-white/20 rounded-xl">
                <AlertCircle className="h-6 w-6 text-white" />
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-white mb-1">Usage Limit Reached</h3>
                <p className="text-white/90 text-sm">You've reached your monthly processing limit. Upgrade to continue.</p>
              </div>
              <Button className="w-full sm:w-auto bg-white text-red-600 hover:bg-white/90 font-semibold shadow-lg">
                <Rocket className="h-4 w-4 mr-2" />
                Upgrade Now
              </Button>
            </div>
          </div>
        )}

        {/* Hero Header Section */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 sm:pt-12 pb-6 sm:pb-8">
          <div className="text-center mb-8 sm:mb-12">
            <Badge className="mb-4 px-4 py-1.5 bg-gradient-to-r from-indigo-500 to-purple-500 text-white text-sm font-semibold">
              <Sparkles className="h-3.5 w-3.5 mr-1.5" />
              FREE PDF TOOLS
            </Badge>
          </div>

          {/* Category Filter Pills */}
          <div className="flex justify-center mb-8 sm:mb-12">
            <div className="inline-flex flex-wrap justify-center gap-2 sm:gap-3 p-2 bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg shadow-slate-200/50 border border-slate-200/50">
              {categories.map((category) => (
                <button
                  key={category}
                  onClick={() => setSelectedCategory(category)}
                  className={`px-4 sm:px-6 py-2.5 sm:py-3 rounded-xl font-semibold text-sm sm:text-base transition-all duration-300 ${
                    selectedCategory === category
                      ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg shadow-indigo-500/30 scale-105'
                      : 'text-slate-600 hover:text-indigo-600 hover:bg-indigo-50'
                  }`}
                >
                  {category}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Tools Grid */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-8">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-4">
            {filteredTools.map((tool, index) => (
              <div
                key={tool.id}
                onClick={() => handleToolSelect(tool)}
                className={`group relative bg-white rounded-xl overflow-hidden cursor-pointer transition-all duration-300 hover:-translate-y-1 hover:shadow-lg ${
                  selectedTool?.id === tool.id
                    ? 'ring-2 ring-indigo-500 shadow-lg'
                    : 'shadow-md hover:shadow-indigo-100'
                }`}
                style={{ animation: `fadeInUp 0.4s ease-out ${index * 0.03}s both` }}
              >
                {/* Compact Card Design */}
                <div className={`p-3 sm:p-4 bg-gradient-to-br ${tool.color}`}>
                  <div className="flex items-center gap-2 sm:gap-3">
                    <div className="p-2 bg-white/20 rounded-lg group-hover:scale-105 transition-transform">
                      <tool.icon className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
                    </div>
                    <h3 className="text-sm sm:text-base font-semibold text-white truncate flex-1">{tool.title}</h3>
                  </div>
                </div>
                <div className="p-3 sm:p-4">
                  <p className="text-slate-600 text-xs sm:text-sm leading-snug line-clamp-2 mb-2">{tool.description}</p>
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] sm:text-xs text-emerald-600 font-medium bg-emerald-50 px-1.5 py-0.5 rounded">FREE</span>
                    <span className="text-[10px] sm:text-xs text-slate-400">{tool.processingTime}</span>
                  </div>
                </div>
                {selectedTool?.id === tool.id && (
                  <div className="absolute top-2 right-2 p-1 bg-indigo-600 rounded-full">
                    <CheckCircle className="h-3 w-3 text-white" />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>


        {/* Selected Tool Processing Area */}
        {selectedTool && (
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
            <div id="upload-section" className="bg-white rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-200/50 overflow-hidden">
              {/* Tool Header */}
              <div className={`p-6 sm:p-8 bg-gradient-to-r ${selectedTool.color}`}>
                <div className="flex items-center gap-4">
                  <div className="p-3 sm:p-4 bg-white/20 backdrop-blur-sm rounded-2xl">
                    <selectedTool.icon className="h-7 w-7 sm:h-8 sm:w-8 text-white" />
                  </div>
                  <div>
                    <h2 className="text-xl sm:text-2xl font-bold text-white">{selectedTool.title}</h2>
                    <p className="text-white/80 text-sm sm:text-base">{selectedTool.description}</p>
                  </div>
                </div>
              </div>

              {/* Upload Section */}
              <div className="p-6 sm:p-8">
                {selectedTool.requiresUrlOrFile ? (
                  <div className="space-y-6">
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-2">Enter Webpage URL</label>
                      <input
                        id="html-url-input"
                        type="url"
                        placeholder="https://example.com"
                        className="w-full px-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                      />
                    </div>
                    <Button
                      onClick={async () => {
                        const urlInput = document.getElementById('html-url-input')
                        const url = urlInput?.value?.trim()
                        if (url || uploadedFiles.length > 0) await handleAutoProcess(url && uploadedFiles.length === 0 ? [] : uploadedFiles)
                        else toast.error('Please enter a URL or upload an HTML file')
                      }}
                      disabled={isProcessing}
                      className={`w-full sm:w-auto bg-gradient-to-r ${selectedTool.color} text-white px-8 py-4 text-base font-semibold rounded-xl hover:shadow-lg transition-all`}
                    >
                      <Download className="h-5 w-5 mr-2" />
                      Convert to PDF
                    </Button>
                  </div>
                ) : selectedTool.requiresTextOrFile ? (
                  <div className="space-y-6">
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-2">Enter or Paste Your Text</label>
                      <textarea
                        id="text-to-pdf-input"
                        placeholder="Type or paste your text here..."
                        rows={8}
                        className="w-full px-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all resize-y min-h-[200px]"
                      />
                    </div>
                    <div className="flex flex-col sm:flex-row gap-4">
                      <Button
                        onClick={async () => {
                          const textInput = document.getElementById('text-to-pdf-input')
                          const text = textInput?.value?.trim()
                          if (text) await handleAutoProcess([], { directText: text })
                          else toast.error('Please enter some text to convert')
                        }}
                        disabled={isProcessing}
                        className={`flex-1 sm:flex-none bg-gradient-to-r ${selectedTool.color} text-white px-8 py-4 text-base font-semibold rounded-xl hover:shadow-lg transition-all`}
                      >
                        <Download className="h-5 w-5 mr-2" />
                        Convert to PDF
                      </Button>
                      <div className="flex items-center gap-4">
                        <div className="h-px bg-slate-200 flex-1 sm:w-12"></div>
                        <span className="text-slate-400 text-sm">OR</span>
                        <div className="h-px bg-slate-200 flex-1 sm:w-12"></div>
                      </div>
                      <Button onClick={() => setShowUploadModal(true)} variant="outline" className="flex-1 sm:flex-none border-slate-300 text-slate-700 hover:bg-slate-50 px-6 py-4 rounded-xl">
                        <Upload className="h-5 w-5 mr-2" />
                        Upload Text File
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="text-center">
                    <div className="mb-6">
                      <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-2xl mb-4">
                        <Upload className="h-8 w-8 text-indigo-600" />
                      </div>
                      <h3 className="text-lg font-semibold text-slate-900 mb-2">
                        {selectedTool.multipleFiles ? 'Upload Your Files' : 'Upload Your File'}
                      </h3>
                      <p className="text-slate-500 text-sm">
                        Supports: {selectedTool.acceptedFiles.replace(/\./g, '').toUpperCase()}
                        {selectedTool.multipleFiles && ' • Up to 10 files'}
                      </p>
                    </div>
                    <Button
                      onClick={() => setShowUploadModal(true)}
                      className={`bg-gradient-to-r ${selectedTool.color} text-white px-8 py-4 text-base font-semibold rounded-xl hover:shadow-lg hover:scale-105 transition-all`}
                    >
                      <Upload className="h-5 w-5 mr-2" />
                      {selectedTool.multipleFiles ? 'Select Files' : 'Select File'}
                    </Button>
                  </div>
                )}

                {/* Uploaded Files Display */}
                {uploadedFiles.length > 0 && (
                  <div className="mt-6 p-4 bg-slate-50 rounded-xl border border-slate-200">
                    <h4 className="text-sm font-semibold text-slate-700 mb-3 flex items-center">
                      <FileText className="h-4 w-4 mr-2 text-indigo-600" />
                      Selected Files ({uploadedFiles.length})
                    </h4>
                    <div className="space-y-2">
                      {uploadedFiles.map((file, index) => (
                        <div key={index} className="flex items-center justify-between p-3 bg-white rounded-lg border border-slate-200">
                          <div className="flex items-center gap-3 flex-1 min-w-0">
                            <div className="p-2 bg-indigo-100 rounded-lg">
                              <FileText className="h-4 w-4 text-indigo-600" />
                            </div>
                            <span className="text-sm text-slate-700 truncate">{file.name}</span>
                          </div>
                          <span className="text-xs text-slate-500 ml-2">{(file.size / 1024 / 1024).toFixed(2)} MB</span>
                        </div>
                      ))}
                    </div>
                    {selectedTool.minFiles > 1 && uploadedFiles.length < selectedTool.minFiles && (
                      <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg flex items-start">
                        <Info className="h-5 w-5 text-blue-500 mr-2 flex-shrink-0 mt-0.5" />
                        <p className="text-sm text-blue-700">
                          You need at least {selectedTool.minFiles} files. Upload {selectedTool.minFiles - uploadedFiles.length} more.
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {/* Process Button */}
                {uploadedFiles.length > 0 && (
                  <div className="mt-6 flex flex-col sm:flex-row items-center justify-between p-4 bg-gradient-to-r from-slate-50 to-indigo-50 rounded-xl border border-slate-200 gap-4">
                    <div>
                      <h4 className="font-semibold text-slate-900">Ready to Process</h4>
                      <p className="text-sm text-slate-500">{uploadedFiles.length} file(s) ready for {selectedTool.title.toLowerCase()}</p>
                    </div>
                    <Button
                      onClick={handleProcess}
                      disabled={!canProcess || usageExceeded || isProcessing}
                      className={`w-full sm:w-auto bg-gradient-to-r ${selectedTool.color} text-white px-8 py-3 font-semibold rounded-xl hover:shadow-lg transition-all`}
                    >
                      {isProcessing ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2" />
                          Processing...
                        </>
                      ) : (
                        <>
                          <Rocket className="h-4 w-4 mr-2" />
                          Process Files
                        </>
                      )}
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}


        {/* OCR Results Display */}
        {ocrResults && (
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
            <div className="bg-white rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-200/50 overflow-hidden">
              <div className="p-6 sm:p-8 bg-gradient-to-r from-cyan-500 to-blue-600">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-white/20 backdrop-blur-sm rounded-xl">
                      <Eye className="h-6 w-6 text-white" />
                    </div>
                    <h3 className="text-xl font-bold text-white">OCR Results</h3>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Badge className="bg-white/90 text-emerald-700 font-bold">{Math.round((ocrResults.confidence || 0) * 100)}% Accurate</Badge>
                    {ocrResults.aiEnhanced && <Badge className="bg-purple-100 text-purple-700 font-bold"><Sparkles className="h-3 w-3 mr-1" />AI Enhanced</Badge>}
                  </div>
                </div>
              </div>
              <div className="p-6 sm:p-8 space-y-6">
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                  <div className="p-4 bg-slate-50 rounded-xl text-center">
                    <div className="text-2xl font-bold text-slate-900">{ocrResults.pageCount || 1}</div>
                    <div className="text-xs text-slate-500 mt-1">Pages</div>
                  </div>
                  <div className="p-4 bg-slate-50 rounded-xl text-center">
                    <div className="text-2xl font-bold text-slate-900">{ocrResults.text?.length?.toLocaleString() || 0}</div>
                    <div className="text-xs text-slate-500 mt-1">Characters</div>
                  </div>
                  <div className="p-4 bg-slate-50 rounded-xl text-center col-span-2 sm:col-span-1">
                    <div className="text-2xl font-bold text-emerald-600">{Math.round((ocrResults.confidence || 0) * 100)}%</div>
                    <div className="text-xs text-slate-500 mt-1">Confidence</div>
                  </div>
                </div>
                <div className="bg-slate-50 rounded-xl p-4 sm:p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="font-semibold text-slate-900 flex items-center"><FileText className="h-4 w-4 mr-2 text-indigo-600" />Extracted Text</h4>
                    <Button onClick={() => { navigator.clipboard.writeText(ocrResults.text); toast.success('Copied!') }} size="sm" variant="outline" className="border-slate-300">
                      <Copy className="h-4 w-4 mr-2" />Copy
                    </Button>
                  </div>
                  <div className="bg-white rounded-lg p-4 max-h-[400px] overflow-y-auto border border-slate-200">
                    <pre className="text-slate-700 text-sm whitespace-pre-wrap font-mono leading-relaxed">{ocrResults.text || 'No text extracted'}</pre>
                  </div>
                </div>
                <div className="flex flex-col sm:flex-row gap-3">
                  <Button onClick={() => {
                    const blob = new Blob([ocrResults.text], { type: 'text/plain' })
                    const url = URL.createObjectURL(blob)
                    const a = document.createElement('a')
                    a.href = url
                    a.download = `${ocrResults.filename.replace(/\.[^/.]+$/, '')}_extracted.txt`
                    a.click()
                    URL.revokeObjectURL(url)
                    toast.success('Downloaded!')
                  }} className="flex-1 bg-gradient-to-r from-cyan-500 to-blue-600 text-white rounded-xl">
                    <Download className="h-4 w-4 mr-2" />Download Text
                  </Button>
                  <Button onClick={() => setOcrResults(null)} variant="outline" className="flex-1 border-slate-300 rounded-xl">Clear Results</Button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tool Results Display */}
        {toolResults && !['ocr', 'ai-chat'].includes(toolResults.type) && (
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
            <div className="bg-white rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-200/50 overflow-hidden">
              <div className="p-6 sm:p-8 bg-gradient-to-r from-emerald-500 to-green-600">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-white/20 backdrop-blur-sm rounded-xl">
                    <CheckCircle className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-white">Processing Complete</h3>
                    <p className="text-white/80 text-sm">{toolResults.toolName} completed successfully</p>
                  </div>
                </div>
              </div>
              <div className="p-6 sm:p-8">
                <div className="flex items-center justify-between p-4 bg-emerald-50 rounded-xl border border-emerald-200">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-emerald-100 rounded-lg"><CheckCircle className="h-5 w-5 text-emerald-600" /></div>
                    <div>
                      <div className="font-semibold text-slate-900">Files Downloaded</div>
                      <div className="text-sm text-slate-500">{new Date(toolResults.timestamp).toLocaleString()}</div>
                    </div>
                  </div>
                  <Button onClick={() => setToolResults(null)} variant="outline" size="sm" className="border-slate-300">Dismiss</Button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* AI Chat Results */}
        {toolResults && toolResults.type === 'ai-chat' && (
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
            <div className="bg-white rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-200/50 overflow-hidden">
              <div className="p-6 sm:p-8 bg-gradient-to-r from-pink-500 to-purple-600">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-white/20 backdrop-blur-sm rounded-xl"><MessageSquare className="h-6 w-6 text-white" /></div>
                  <div>
                    <h3 className="text-xl font-bold text-white">AI Chat Ready</h3>
                    <p className="text-white/80 text-sm">Your document is ready for AI-powered conversations</p>
                  </div>
                </div>
              </div>
              <div className="p-6 sm:p-8 text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-pink-100 to-purple-100 rounded-2xl mb-4">
                  <MessageSquare className="h-8 w-8 text-purple-600" />
                </div>
                <h4 className="text-lg font-semibold text-slate-900 mb-2">Start Chatting with Your Document</h4>
                <p className="text-slate-500 text-sm mb-6">Ask questions and get instant AI-powered answers</p>
                <Button className="bg-gradient-to-r from-pink-500 to-purple-600 text-white px-8 py-3 rounded-xl font-semibold">
                  <MessageSquare className="h-4 w-4 mr-2" />Open AI Chat
                </Button>
              </div>
            </div>
          </div>
        )}


        {/* SEO Content Section */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20">
          <div className="bg-gradient-to-br from-slate-50 to-indigo-50 rounded-3xl p-8 sm:p-12 border border-slate-200">
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-8 text-center">
              All-in-One Free PDF Converter & Editor
            </h2>
            <div className="grid md:grid-cols-2 gap-8 mb-8">
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-slate-900 flex items-center">
                  <div className="p-2 bg-indigo-100 rounded-lg mr-3"><FileText className="h-5 w-5 text-indigo-600" /></div>
                  PDF Conversion Tools
                </h3>
                <p className="text-slate-600 text-sm leading-relaxed pl-12">
                  Convert PDF to Word (DOCX), PDF to Excel (XLSX), PDF to JPG images online free. 
                  Our PDF converter supports Word to PDF, Excel to PDF, and JPG to PDF conversion.
                </p>
              </div>
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-slate-900 flex items-center">
                  <div className="p-2 bg-purple-100 rounded-lg mr-3"><Layers className="h-5 w-5 text-purple-600" /></div>
                  PDF Editing Tools
                </h3>
                <p className="text-slate-600 text-sm leading-relaxed pl-12">
                  Merge PDF files (combine PDF), split PDF pages, compress PDF to reduce size. 
                  Our online PDF editor is the best free alternative to Adobe Acrobat and iLovePDF.
                </p>
              </div>
            </div>
            <div className="text-center">
              <p className="text-slate-500 text-sm max-w-3xl mx-auto">
                RobotPDF provides free online PDF tools including merge PDF, split PDF, compress PDF, 
                PDF to Word converter, Word to PDF converter, PDF to Excel, PDF to JPG, JPG to PDF, and more.
              </p>
            </div>
          </div>
        </section>
      </div>

      {/* Modals */}
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

      <ProcessingModal
        isOpen={isProcessing}
        title={selectedTool ? `${selectedTool.title}` : 'Processing'}
        fileName={uploadedFiles.map(f => f.name).join(', ')}
        progress={processingProgress}
        stage={processingStage}
        icon={selectedTool ? selectedTool.icon : FileText}
        description={selectedTool ? selectedTool.description : 'Processing your files'}
        steps={processingSteps}
        currentStep={currentStep}
        estimatedTime={selectedTool ? parseInt(selectedTool.processingTime.replace(/[^\d]/g, '')) : 60}
      />

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

      <UpgradeModal
        isOpen={showUpgradeModal}
        onClose={closeUpgradeModal}
        requiredPlan={upgradeModalData.requiredPlan}
        toolName={upgradeModalData.toolName}
        toolDescription={upgradeModalData.toolDescription}
      />

      {showFileOrderPreview && (
        <FileOrderPreview
          files={pendingFiles}
          onConfirm={handleFileOrderConfirm}
          onCancel={handleFileOrderCancel}
        />
      )}

      <PasswordRemoveModal
        isOpen={showPasswordRemoveModal}
        onClose={() => { setShowPasswordRemoveModal(false); setPendingPasswordFiles([]) }}
        onConfirm={handlePasswordRemoveConfirm}
        fileCount={pendingPasswordFiles.length}
      />
    </div>
  )
}

export default Tools
