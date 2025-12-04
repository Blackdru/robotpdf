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
import ToolsGrid from '../components/advanced-tools/ToolsGrid'
import ToolProcessor from '../components/advanced-tools/ToolProcessor'
import ResultsDisplay from '../components/advanced-tools/ResultsDisplay'
import EnhancedOCRModal from '../components/EnhancedOCRModal'
import PasswordProtectModal from '../components/PasswordProtectModal'
import ImageCompressProModal from '../components/ImageCompressProModal'
import { proTools, PROCESSING_STEPS_CONFIG } from '../components/advanced-tools/toolsConfig'
import toast from 'react-hot-toast'
import {
  AlertCircle, FileText, Sparkles, Rocket, Crown, Brain, Eye, MessageSquare,
  CheckCircle, Upload, Download, Zap, Shield, TrendingUp, Clock
} from 'lucide-react'

const AdvancedTools = () => {
  const { user, session } = useAuth()
  const { subscription, usage } = useSubscription()
  const { checkAccess, showUpgradeModal, upgradeModalData, closeUpgradeModal, filterToolsByAccess } = useSubscriptionAccess()
  
  const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'
  const [selectedTool, setSelectedTool] = useState(null)
  const [uploadedFiles, setUploadedFiles] = useState([])
  const [isProcessing, setIsProcessing] = useState(false)
  const [processedFiles, setProcessedFiles] = useState([])
  const [ocrResults, setOcrResults] = useState(null)
  const [toolResults, setToolResults] = useState(null)
  const [clearFileUpload, setClearFileUpload] = useState(false)
  const [showUploadModal, setShowUploadModal] = useState(false)
  const [chatSessions, setChatSessions] = useState({})
  const [currentMessage, setCurrentMessage] = useState('')
  const [showAIAssistant, setShowAIAssistant] = useState(false)
  const [aiAssistantMinimized, setAiAssistantMinimized] = useState(false)
  const [currentFileForAI, setCurrentFileForAI] = useState(null)
  const [initializingAIChat, setInitializingAIChat] = useState(false)
  const [processingProgress, setProcessingProgress] = useState(0)
  const [processingStage, setProcessingStage] = useState('Initializing...')
  const [processingSteps, setProcessingSteps] = useState([])
  const [currentStep, setCurrentStep] = useState(0)
  const [showEnhancedOCRModal, setShowEnhancedOCRModal] = useState(false)
  const [enhancedOCRResult, setEnhancedOCRResult] = useState(null)
  const [currentFileId, setCurrentFileId] = useState(null)
  const [toolSettings, setToolSettings] = useState({})
  const [showFileOrderPreview, setShowFileOrderPreview] = useState(false)
  const [pendingFiles, setPendingFiles] = useState([])
  const [showPasswordProtectModal, setShowPasswordProtectModal] = useState(false)
  const [pendingPasswordFiles, setPendingPasswordFiles] = useState([])
  const [showImageCompressProModal, setShowImageCompressProModal] = useState(false)
  const [pendingImageFiles, setPendingImageFiles] = useState([])


  const categories = ['All', 'AI-Powered', 'Professional', 'Security']
  const [selectedCategory, setSelectedCategory] = useState('All')

  const getAvailableTools = () => {
    if (selectedCategory === 'All') return proTools
    return proTools.filter(tool => tool.category === selectedCategory)
  }

  const filteredTools = getAvailableTools()

  useEffect(() => {
    trackPageViewOnce(window.location.href, 'Advanced Tools - RobotPDF').catch(err => {
      if (import.meta.env.DEV) console.error('Tracking error:', err)
    })
  }, [])

  const updateProgress = (progress, stage, step = null) => {
    setProcessingProgress(progress)
    setProcessingStage(stage)
    if (step !== null) setCurrentStep(step)
  }

  const initializeProcessingSteps = (toolId) => {
    const steps = PROCESSING_STEPS_CONFIG[toolId] || [
      { name: 'Uploading', icon: 'Upload' },
      { name: 'Processing', icon: 'FileText' },
      { name: 'Finalizing', icon: 'CheckCircle' },
      { name: 'Complete', icon: 'Download' }
    ]
    setProcessingSteps(steps)
    setCurrentStep(0)
    setProcessingProgress(0)
    setProcessingStage('Initializing...')
  }

  const handleToolSelect = (tool) => {
    const hasToolAccess = checkAccess(tool.id, tool.title, tool.description)
    if (!hasToolAccess) return
    if (tool.isGenerator) { window.location.href = '/resume-generator'; return }
    setSelectedTool(tool)
    setUploadedFiles([])
    setProcessedFiles([])
    setOcrResults(null)
    setToolResults(null)
    setIsProcessing(false)
    setClearFileUpload(true)
    setChatSessions({})
    setCurrentMessage('')
    setToolSettings({})
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
    if (selectedTool?.id === 'password-protect') {
      setPendingPasswordFiles(validFiles)
      setShowPasswordProtectModal(true)
      setShowUploadModal(false)
      return
    }
    if (selectedTool?.id === 'image-compress-pro') {
      setPendingImageFiles(validFiles)
      setShowImageCompressProModal(true)
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
      if (validFiles.length >= (selectedTool?.minFiles || 1)) await handleAutoProcess(validFiles, toolSettings)
    }
  }

  const handleFileOrderConfirm = async (orderedFiles) => {
    setShowFileOrderPreview(false)
    setUploadedFiles(orderedFiles)
    setPendingFiles([])
    await handleAutoProcess(orderedFiles, toolSettings)
  }

  const handleUrlSubmitted = async (url, viewportMode = 'desktop') => {
    const updatedSettings = { ...toolSettings, url, viewportMode }
    setToolSettings(updatedSettings)
    setUploadedFiles([])
    await handleAutoProcess([], updatedSettings)
  }

  const handleFileOrderCancel = () => { setShowFileOrderPreview(false); setPendingFiles([]) }

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
    if (invalidFiles.length > 0) toast.error(`Invalid files for ${tool.title}: ${invalidFiles.map(f => f.name).join(', ')}`)
    return validFiles
  }


  const handleAutoProcess = async (files, toolSettings = {}) => {
    if (!selectedTool) return
    if (files.length === 0 && !(selectedTool.id === 'advanced-html-to-pdf' && toolSettings.url) && !(selectedTool.id === 'text-to-pdf-pro' && toolSettings.directText)) return
    initializeProcessingSteps(selectedTool.id)
    setIsProcessing(true)
    
    try {
      let uploadedFileIds = []
      const isUrlOnlyMode = selectedTool.id === 'advanced-html-to-pdf' && files.length === 0 && toolSettings.url
      const isDirectTextMode = selectedTool.id === 'text-to-pdf-pro' && files.length === 0 && toolSettings.directText
      
      if (!isUrlOnlyMode && !isDirectTextMode) {
        updateProgress(5, 'Preparing files for upload...', 0)
        await new Promise(resolve => setTimeout(resolve, 300))
        for (let i = 0; i < files.length; i++) {
          const file = files[i]
          const fileNum = i + 1
          const totalFiles = files.length
          try {
            const uploadProgress = 5 + ((fileNum - 1) / totalFiles) * 20
            updateProgress(uploadProgress, `Uploading file ${fileNum}/${totalFiles}: ${file.name}...`, 0)
            const response = await api.uploadFile(file)
            uploadedFileIds.push(response.file.id)
            const completedProgress = 5 + (fileNum / totalFiles) * 20
            updateProgress(completedProgress, `Uploaded ${fileNum}/${totalFiles} files`, 0)
            await new Promise(resolve => setTimeout(resolve, 200))
          } catch (error) {
            console.error(`Upload failed for ${file.name}:`, error)
            toast.error(`Failed to upload ${file.name}: ${error.message}`)
          }
        }
        if (uploadedFileIds.length === 0 && files.length > 0) throw new Error('No files were uploaded successfully')
        updateProgress(30, `All ${uploadedFileIds.length} file(s) uploaded successfully`, 1)
        await new Promise(resolve => setTimeout(resolve, 500))
      } else if (isDirectTextMode) {
        updateProgress(30, 'Processing text input...', 1)
        await new Promise(resolve => setTimeout(resolve, 300))
      } else {
        updateProgress(30, 'Preparing URL conversion...', 1)
        await new Promise(resolve => setTimeout(resolve, 300))
      }

      let result
      const outputName = `${selectedTool.id}-${Date.now()}`
      updateProgress(35, 'Initializing processing...', 1)
      await new Promise(resolve => setTimeout(resolve, 300))
      
      switch (selectedTool.id) {
        case 'advanced-ocr':
          result = await handleAdvancedOCR(uploadedFileIds[0], toolSettings)
          break
        case 'ai-chat':
          result = await handleAIChat(uploadedFileIds[0], files)
          break
        case 'smart-summary':
          result = await handleSmartSummary(uploadedFileIds[0], toolSettings)
          break
        case 'pro-merge':
          updateProgress(40, 'Analyzing PDF structures...', 2)
          await new Promise(resolve => setTimeout(resolve, 500))
          updateProgress(55, 'Merging PDFs...', 2)
          result = await api.mergePDFs(uploadedFileIds, `${outputName}.pdf`)
          updateProgress(85, 'Merge complete!', 2)
          break
        case 'precision-split':
          result = await handlePrecisionSplit(uploadedFileIds[0], toolSettings)
          break
        case 'smart-compress':
          result = await handleSmartCompress(uploadedFileIds, toolSettings)
          break
        case 'password-protect':
          result = await handlePasswordProtect(uploadedFileIds, toolSettings)
          break
        case 'images-to-pdf':
          result = await handleImagesToPDF(uploadedFileIds, toolSettings)
          break
        case 'pdf-to-office':
          result = await handlePDFToOffice(uploadedFileIds[0], toolSettings)
          break
        case 'office-to-pdf':
          result = await handleOfficeToPDF(uploadedFileIds, toolSettings)
          break
        case 'advanced-html-to-pdf':
          result = await handleAdvancedHTMLToPDF(uploadedFileIds, toolSettings)
          break
        case 'text-to-pdf-pro':
          result = await handleTextToPDFPro(uploadedFileIds, toolSettings)
          break
        case 'image-compress-pro':
          result = await handleImageCompressPro(uploadedFileIds, toolSettings)
          break
        default:
          throw new Error('Tool not implemented yet')
      }
      
      updateProgress(90, 'Preparing download...', processingSteps.length - 1)
      await new Promise(resolve => setTimeout(resolve, 300))

      setToolResults({ type: selectedTool.id, result: result, timestamp: new Date().toISOString(), toolName: selectedTool.title })

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
      } else {
        updateProgress(100, 'Complete!', processingSteps.length - 1)
        toast.success('Processing completed successfully!')
      }
      setUploadedFiles([])
    } catch (error) {
      console.error('Processing error:', error)
      updateProgress(0, 'Processing failed', 0)
      const errorMsg = error?.message || String(error)
      if (errorMsg.includes('File too large') || errorMsg.includes('File size exceeds')) toast.error(errorMsg, { duration: 6000 })
      else if (errorMsg.includes('No token provided') || errorMsg.includes('Unauthorized')) toast.error('Authentication required. Please sign in.')
      else if (errorMsg.includes('File not found')) toast.error('File upload failed. Please check your connection.')
      else if (errorMsg.includes('Invalid file type')) toast.error('Invalid file type. Please upload supported formats.')
      else if (errorMsg.includes('Network error') || errorMsg.includes('timeout')) toast.error('Upload timeout. Please try with a smaller file.', { duration: 6000 })
      else if (errorMsg.includes('404')) toast.error('Service temporarily unavailable.')
      else if (errorMsg.includes('Too many requests')) toast.error('Rate limit exceeded. Please wait.')
      else toast.error(`Processing failed: ${errorMsg}`, { duration: 5000 })
    } finally {
      setTimeout(() => setIsProcessing(false), 1500)
    }
  }


  const handleAdvancedOCR = async (fileId, settings = {}) => {
    try {
      updateProgress(40, 'Processing with AI-enhanced OCR...', 2)
      const result = await api.request('/ai/ocr', {
        method: 'POST',
        body: JSON.stringify({
          fileId: fileId, language: settings.ocrLanguage || 'auto', enhanceImage: settings.enhanceImage !== false,
          aiEnhanced: settings.enhanceWithAI !== false, extractOriginal: settings.extractOriginal || false, confidenceThreshold: settings.confidenceThreshold || 0.6
        }),
        timeout: 120000,
        headers: { 'Content-Type': 'application/json' }
      })
      updateProgress(90, 'OCR completed, preparing results...', 3)
      setEnhancedOCRResult(result.result)
      setCurrentFileId(fileId)
      setShowEnhancedOCRModal(true)
      updateProgress(100, 'Complete!', 4)
      toast.success('Advanced OCR processing completed!')
      setUploadedFiles([])
      setTimeout(() => setIsProcessing(false), 500)
      return result
    } catch (ocrError) {
      console.error('Advanced OCR error:', ocrError)
      throw ocrError
    }
  }

  const handleOCRResultUpdate = (updatedResult) => { setEnhancedOCRResult(updatedResult) }

  const handleAIChat = async (fileId, files) => {
    if (initializingAIChat) return { initialized: false, message: 'Already initializing' }
    setInitializingAIChat(true)
    try {
      toast.loading('Preparing document for AI chat...', { id: 'ai-chat-init' })
      try {
        await api.post('/ai/create-embeddings', { fileId: fileId })
        toast.dismiss('ai-chat-init')
        toast.success('AI Chat initialized! You can now chat with your document.')
      } catch (embeddingError) {
        const errorMsg = embeddingError?.message || String(embeddingError)
        if (errorMsg.includes('No text content found') || errorMsg.includes('Please run OCR')) {
          toast.dismiss('ai-chat-init')
          toast.loading('Extracting text from document...', { id: 'ai-chat-ocr' })
          await api.request('/ai/ocr', { method: 'POST', body: JSON.stringify({ fileId: fileId, language: 'eng+tel', enhanceImage: true }), timeout: 180000 })
          toast.dismiss('ai-chat-ocr')
          await new Promise(resolve => setTimeout(resolve, 1000))
          toast.loading('Creating AI embeddings...', { id: 'ai-chat-embeddings' })
          await api.post('/ai/create-embeddings', { fileId: fileId })
          toast.dismiss('ai-chat-embeddings')
          toast.success('AI Chat initialized! Text extracted and processed successfully.')
        } else {
          toast.dismiss('ai-chat-init')
          throw embeddingError
        }
      }
      setCurrentFileForAI({ id: fileId, name: files[0].name })
      setShowAIAssistant(true)
      setAiAssistantMinimized(false)
      setUploadedFiles([])
      setIsProcessing(false)
      return { initialized: true }
    } catch (error) {
      console.error('AI Chat initialization error:', error)
      toast.dismiss('ai-chat-init')
      toast.dismiss('ai-chat-ocr')
      toast.dismiss('ai-chat-embeddings')
      throw error
    } finally {
      setInitializingAIChat(false)
    }
  }

  const handleSmartSummary = async (fileId, settings = {}) => {
    updateProgress(30, 'Analyzing document text...', 1)
    try {
      updateProgress(35, 'Checking document text availability...', 1)
      const result = await api.smartSummary(fileId, {
        includeKeyPoints: settings.includeKeyPoints !== false, includeSentiment: settings.includeSentiment !== false,
        includeEntities: settings.includeEntities !== false, analysisDepth: settings.analysisDepth || 'comprehensive', summaryLength: settings.summaryLength || 'medium'
      })
      updateProgress(70, 'Performing sentiment analysis...', 3)
      updateProgress(85, 'Extracting entities...', 4)
      updateProgress(100, 'Smart summary completed!', 5)
      const summaryData = result.result
      setToolResults({ type: 'smart-summary', result: summaryData, timestamp: new Date().toISOString(), fileId: fileId, filename: result.fileInfo?.filename || 'document' })
      if (result.ocrPerformed) toast.success('Text extracted and smart summary generated with AI insights!')
      else toast.success('Smart summary generated with AI insights!')
      setUploadedFiles([])
      setIsProcessing(false)
      return result
    } catch (error) {
      console.error('Smart summary error:', error)
      updateProgress(0, 'Failed to generate summary', 0)
      const errorMsg = error?.message || String(error)
      if (errorMsg.includes('Failed to extract text') || errorMsg.includes('not contain readable text')) throw new Error('Unable to extract text. Please try using Advanced OCR first.')
      else if (errorMsg.includes('ocrFailed')) throw new Error('Text extraction failed. The document may not contain readable text.')
      else if (errorMsg.includes('needsOCR')) throw new Error('This document needs text extraction. Please run OCR first.')
      else throw new Error(`Smart summary failed: ${errorMsg}`)
    }
  }

  const handlePrecisionSplit = async (fileId, settings = {}) => {
    const splitResponse = await fetch(`${API_BASE_URL}/pdf/split`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${session?.access_token}` },
      body: JSON.stringify({ fileId: fileId, outputName: `split-${Date.now()}.pdf`, splitMethod: settings.splitMethod || 'pages', pageRanges: settings.pageRanges || '', namingPattern: settings.namingPattern || 'document_part_{n}' })
    })
    if (!splitResponse.ok) { const errorData = await splitResponse.json(); throw new Error(errorData.error || 'Split failed') }
    const splitBlob = await splitResponse.blob()
    downloadBlob(splitBlob, `split_${Date.now()}.zip`)
    toast.success('PDF split successfully! Files downloaded as ZIP.')
    setUploadedFiles([])
    setIsProcessing(false)
    return { success: true }
  }

  const handleSmartCompress = async (fileIds, settings = {}) => {
    const compressedFiles = []
    const compressionLevel = settings.compressionLevel || 'balanced'
    const qualityMap = { light: 0.9, balanced: 0.75, aggressive: 0.5, maximum: 0.25 }
    const quality = qualityMap[compressionLevel] || 0.75
    for (const fileId of fileIds) {
      try {
        const compressed = await api.compressPDF(fileId, quality, `compressed-${fileId}.pdf`)
        compressedFiles.push(compressed.file)
      } catch (error) {
        if (error.message.includes('already optimized')) toast.error(`File is already optimized`)
        else toast.error(`Compression failed: ${error.message}`)
      }
    }
    if (compressedFiles.length === 0) { toast.error('No files could be compressed'); setUploadedFiles([]); setIsProcessing(false); return { files: [] } }
    return { files: compressedFiles }
  }


  const handlePasswordProtect = async (fileIds, settings = {}) => {
    const encryptedFiles = []
    for (const fileId of fileIds) {
      const password = settings.passwordType === 'custom' && settings.customPassword ? settings.customPassword : `SecurePDF_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`
      const response = await fetch(`${API_BASE_URL}/pdf/advanced/password-protect`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${session?.access_token}` },
        body: JSON.stringify({
          fileId: fileId, password: password,
          permissions: { printing: settings.allowPrinting !== false, copying: settings.allowCopying || false, editing: settings.allowEditing || false, annotating: settings.allowAnnotations || false, fillingForms: true, extracting: false, assembling: false, printingHighRes: false },
          outputName: `protected_${Date.now()}.pdf`, encryptionLevel: settings.encryptionLevel || '256-bit'
        })
      })
      if (!response.ok) { const errorData = await response.json(); throw new Error(errorData.error || 'Password protection failed') }
      const result = await response.json()
      encryptedFiles.push(result.file)
      if (settings.passwordType !== 'custom') {
        toast.success(`🔒 File protected! Password: ${password}`, { duration: 15000 })
        try { await navigator.clipboard.writeText(password); toast.success('📋 Password copied to clipboard!', { duration: 5000 }) } catch (e) {}
      } else toast.success(`🔒 File protected with your custom password!`, { duration: 5000 })
    }
    if (encryptedFiles.length > 1) toast.success(`✅ ${encryptedFiles.length} files password protected successfully!`)
    return { files: encryptedFiles }
  }

  const handlePasswordProtectConfirm = async (settings) => {
    setUploadedFiles(pendingPasswordFiles)
    setPendingPasswordFiles([])
    await handleAutoProcess(pendingPasswordFiles, settings)
  }

  const handleImagesToPDF = async (fileIds, settings = {}) => {
    updateProgress(30, 'Processing images...', 1)
    const options = {
      pageSize: settings.pageSize || 'A4', orientation: settings.orientation || 'auto', margin: typeof settings.margin === 'number' ? settings.margin : 20,
      imageQuality: typeof settings.imageQuality === 'number' ? settings.imageQuality : 0.9, fitToPage: settings.fitToPage !== false, centerImages: settings.centerImages !== false,
      addPageNumbers: settings.addPageNumbers === true, addTimestamp: settings.addTimestamp === true, backgroundColor: settings.backgroundColor || '#FFFFFF', compression: settings.compression || 'jpeg'
    }
    if (settings.pageSize === 'Custom' && settings.customWidth && settings.customHeight) {
      options.customSize = { width: parseFloat(settings.customWidth), height: parseFloat(settings.customHeight) }
    }
    const response = await fetch(`${API_BASE_URL}/pdf/advanced/advanced-images-to-pdf`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${session?.access_token}` },
      body: JSON.stringify({ fileIds: fileIds, outputName: `images_to_pdf_${Date.now()}.pdf`, options: options })
    })
    updateProgress(70, 'Creating PDF...', 2)
    if (!response.ok) { const errorData = await response.json(); throw new Error(errorData.error || 'Images to PDF conversion failed') }
    updateProgress(90, 'Finalizing...', 3)
    const result = await response.json()
    updateProgress(100, 'Complete!', 4)
    toast.success(`${fileIds.length} image(s) converted to PDF successfully!`)
    return { file: result.file }
  }

  const handleAdvancedHTMLToPDF = async (fileIds, settings = {}) => {
    updateProgress(30, 'Preparing conversion...', 1)
    try {
      const hasFile = fileIds && fileIds.length > 0
      const hasUrl = settings.url && settings.url.trim()
      if (!hasFile && !hasUrl) throw new Error('Please enter a URL or upload an HTML file')
      if (hasUrl) {
        try { const urlObj = new URL(settings.url); if (!urlObj.protocol.match(/^https?:$/)) throw new Error('URL must use http:// or https://') } catch (e) { throw new Error('Please enter a valid URL (e.g., https://example.com)') }
      }
      updateProgress(50, hasFile ? 'Processing HTML file...' : 'Rendering webpage...', 2)
      const viewportMode = settings.viewportMode || 'desktop'
      const options = {
        pageSize: settings.pageSize || 'A4', orientation: viewportMode === 'desktop' ? 'landscape' : 'portrait',
        margin: { top: settings.marginTop || '20px', right: settings.marginRight || '20px', bottom: settings.marginBottom || '20px', left: settings.marginLeft || '20px' },
        printBackground: settings.printBackground !== false, displayHeaderFooter: settings.displayHeaderFooter || false, headerTemplate: settings.headerTemplate || '', footerTemplate: settings.footerTemplate || '',
        scale: settings.scale || 1, preferCSSPageSize: settings.preferCSSPageSize || false, viewportMode: viewportMode
      }
      updateProgress(70, 'Creating PDF...', 3)
      const outputName = `webpage_${Date.now()}.pdf`
      let result
      if (hasFile) result = await api.advancedHTMLFileToPDF(fileIds[0], outputName, options)
      else result = await api.advancedHTMLToPDF(settings.url, outputName, options)
      updateProgress(100, 'Complete!', 5)
      toast.success(hasFile ? 'HTML file converted to PDF successfully!' : 'Webpage converted to PDF successfully!')
      return { file: result.file }
    } catch (error) { console.error('Advanced HTML to PDF error:', error); throw error }
  }

  const handleTextToPDFPro = async (fileIds, settings = {}) => {
    updateProgress(30, 'Processing text...', 1)
    try {
      const options = {
        enableAIEnhancement: true, aiEnhancementMode: settings.aiEnhancementMode || 'improve', writingTone: settings.writingTone || 'neutral',
        fontFamily: settings.fontFamily || 'Helvetica', fontSize: settings.fontSize || '12', pageSize: settings.pageSize || 'A4', lineSpacing: settings.lineSpacing || '1.5',
        margins: settings.margins || 'normal', marginTop: settings.marginTop, marginRight: settings.marginRight, marginBottom: settings.marginBottom, marginLeft: settings.marginLeft,
        addPageNumbers: settings.addPageNumbers || false, addHeader: settings.addHeader || false, addFooter: settings.addFooter || false, addTimestamp: settings.addTimestamp || false,
        headerText: settings.headerText || '', footerText: settings.footerText || ''
      }
      updateProgress(40, 'Enhancing text with AI...', 1)
      await new Promise(resolve => setTimeout(resolve, 500))
      updateProgress(60, 'Applying formatting...', 2)
      let result
      if (settings.directText) {
        result = await api.convertDirectTextToPDF(settings.directText, `text_to_pdf_${Date.now()}.pdf`, options)
        if (result.aiEnhanced) toast.success('Text enhanced with AI and converted to PDF!')
        else toast.success('Text converted to PDF successfully!')
      } else {
        result = await api.convertTextToPDF(fileIds, `text_to_pdf_${Date.now()}.pdf`)
        toast.success(`${fileIds.length} text file(s) converted to PDF successfully!`)
      }
      updateProgress(100, 'Complete!', 4)
      return { file: result.file }
    } catch (error) { console.error('Text to PDF Pro error:', error); throw error }
  }

  const handleImageCompressPro = async (fileIds, settings = {}) => {
    updateProgress(30, 'Analyzing images...', 1)
    try {
      const compressedImages = []
      const totalImages = fileIds.length
      for (let i = 0; i < fileIds.length; i++) {
        const fileId = fileIds[i]
        try {
          const compressProgress = 30 + ((i + 1) / totalImages) * 55
          updateProgress(compressProgress, `Compressing image ${i + 1}/${totalImages}...`, 2)
          const compressed = await api.post('/pdf/compress-image', {
            fileId: fileId, compressionMode: settings.compressionMode || 'quality', quality: settings.imageQuality || 80, targetSizeKB: settings.targetSizeKB || null,
            minQuality: settings.minQuality || 30, outputFormat: settings.outputFormat || 'original', preserveMetadata: settings.preserveMetadata || false,
            resizeImage: settings.resizeImage || false, maxDimension: settings.maxDimension || 1920, outputName: `compressed-${Date.now()}-${i}`
          })
          compressedImages.push(compressed.file)
        } catch (error) { console.error('Image compression error:', error); toast.error(`Compression failed for image ${i + 1}: ${error.message}`) }
      }
      if (compressedImages.length === 0) throw new Error('No images could be compressed')
      updateProgress(90, 'Compression complete!', 3)
      toast.success(`${compressedImages.length} image(s) compressed successfully!`)
      return { files: compressedImages }
    } catch (error) { console.error('Image Compressor Pro error:', error); throw error }
  }


  const handlePDFToOffice = async (fileId, settings = {}) => {
    updateProgress(30, 'Analyzing PDF structure...', 1)
    try {
      const options = {
        outputFormat: settings.outputFormat || 'docx', conversionQuality: settings.conversionQuality || 'high', ocrLanguage: settings.ocrLanguage || 'auto',
        pageRange: settings.pageRange || '', preserveFormatting: settings.preserveFormatting !== false, preserveImages: settings.preserveImages !== false,
        preserveTables: settings.preserveTables !== false, preserveHyperlinks: settings.preserveHyperlinks !== false, preserveHeaders: settings.preserveHeaders !== false,
        preserveBookmarks: settings.preserveBookmarks || false, imageQuality: settings.imageQuality || 90
      }
      if (settings.outputFormat === 'xlsx' || settings.outputFormat === 'xls') {
        options.detectTables = settings.detectTables !== false; options.oneSheetPerPage = settings.oneSheetPerPage || false; options.preserveFormulas = settings.preserveFormulas || false
      } else if (['docx', 'doc', 'rtf', 'odt'].includes(settings.outputFormat)) {
        options.detectColumns = settings.detectColumns !== false; options.preserveFonts = settings.preserveFonts !== false; options.preserveColors = settings.preserveColors !== false; options.createTOC = settings.createTOC || false
      }
      updateProgress(50, `Converting to ${options.outputFormat.toUpperCase()}...`, 2)
      const response = await fetch(`${API_BASE_URL}/pdf/advanced/pdf-to-office`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${session?.access_token}` },
        body: JSON.stringify({ fileIds: [fileId], outputFormat: options.outputFormat, options: options })
      })
      updateProgress(80, 'Finalizing conversion...', 3)
      if (!response.ok) { const errorData = await response.json(); throw new Error(errorData.error || 'PDF to Office conversion failed') }
      const result = await response.json()
      updateProgress(100, 'Conversion complete!', 4)
      toast.success(`PDF converted to ${options.outputFormat.toUpperCase()} successfully!`)
      return { file: result.files && result.files.length > 0 ? result.files[0] : result.file }
    } catch (error) { console.error('PDF to Office conversion error:', error); throw error }
  }

  const handleOfficeToPDF = async (fileIds, settings = {}) => {
    updateProgress(30, 'Analyzing document content...', 1)
    try {
      const options = {
        conversionQuality: settings.conversionQuality || 'high', pdfVersion: settings.pdfVersion || '1.7', pageSize: settings.pageSize || 'auto', orientation: settings.orientation || 'auto',
        preserveFormatting: settings.preserveFormatting !== false, preserveImages: settings.preserveImages !== false, preserveTables: settings.preserveTables !== false,
        preserveHyperlinks: settings.preserveHyperlinks !== false, preserveHeaders: settings.preserveHeaders !== false, preserveBookmarks: settings.preserveBookmarks !== false,
        embedFonts: settings.embedFonts !== false, compressImages: settings.compressImages !== false, linearize: settings.linearize || false, pdfA: settings.pdfA || false,
        addMetadata: settings.addMetadata !== false, createTOC: settings.createTOC || false, imageQuality: settings.imageQuality || 90,
        margins: { top: settings.marginTop || 72, right: settings.marginRight || 72, bottom: settings.marginBottom || 72, left: settings.marginLeft || 72 }
      }
      updateProgress(50, 'Converting to PDF...', 2)
      const response = await fetch(`${API_BASE_URL}/pdf/advanced/office-to-pdf`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${session?.access_token}` },
        body: JSON.stringify({ fileIds: fileIds, options: options })
      })
      updateProgress(80, 'Finalizing conversion...', 3)
      if (!response.ok) { const errorData = await response.json(); throw new Error(errorData.error || 'Office to PDF conversion failed') }
      const result = await response.json()
      updateProgress(100, 'Conversion complete!', 4)
      toast.success(`${fileIds.length} file(s) converted to PDF successfully!`)
      return { files: result.files || [] }
    } catch (error) { console.error('Office to PDF conversion error:', error); throw error }
  }

  const sendChatMessage = async (fileId) => {
    if (!currentMessage.trim()) return
    const message = currentMessage.trim()
    setCurrentMessage('')
    setChatSessions(prev => ({ ...prev, [fileId]: { ...prev[fileId], messages: [...(prev[fileId]?.messages || []), { role: 'user', content: message, timestamp: new Date().toISOString() }] } }))
    try {
      const result = await api.post('/ai/chat', { fileId, message, conversationHistory: chatSessions[fileId]?.messages || [] })
      setChatSessions(prev => ({ ...prev, [fileId]: { ...prev[fileId], messages: [...prev[fileId].messages, { role: 'assistant', content: result.response, timestamp: new Date().toISOString(), confidence: result.confidence }] } }))
    } catch (error) { toast.error('Failed to send message: ' + error.message) }
  }

  const canProcess = uploadedFiles.length >= (selectedTool?.minFiles || 1)
  const usageExceeded = usage && usage.current >= usage.limit && subscription?.plan !== 'premium'


  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-purple-50/30 relative overflow-hidden">
      {/* Animated Background Elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -left-40 w-[500px] h-[500px] bg-gradient-to-br from-purple-200/40 to-pink-200/40 rounded-full blur-3xl animate-blob"></div>
        <div className="absolute top-1/3 -right-32 w-[400px] h-[400px] bg-gradient-to-br from-indigo-200/30 to-blue-200/30 rounded-full blur-3xl animate-blob" style={{ animationDelay: '2s' }}></div>
        <div className="absolute -bottom-40 left-1/3 w-[600px] h-[600px] bg-gradient-to-br from-cyan-200/20 to-teal-200/20 rounded-full blur-3xl animate-blob" style={{ animationDelay: '4s' }}></div>
      </div>

      <div className="relative z-10">
        {/* Usage Warning Banner */}
        {usageExceeded && (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="bg-gradient-to-r from-amber-500 to-orange-500 rounded-2xl p-4 sm:p-6 flex flex-col sm:flex-row items-start sm:items-center gap-4 shadow-lg shadow-amber-500/20">
              <div className="p-2 bg-white/20 rounded-xl">
                <AlertCircle className="h-6 w-6 text-white" />
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-white mb-1">Usage Limit Reached</h3>
                <p className="text-white/90 text-sm">Upgrade to Premium for unlimited access to all AI-powered tools.</p>
              </div>
              <Button className="w-full sm:w-auto bg-white text-amber-600 hover:bg-white/90 font-semibold shadow-lg">
                <Crown className="h-4 w-4 mr-2" />
                Upgrade to Pro
              </Button>
            </div>
          </div>
        )}

        {/* Hero Header Section */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 sm:pt-12 pb-6 sm:pb-8">
          <div className="text-center mb-8 sm:mb-12">
            <Badge className="mb-4 px-4 py-1.5 bg-gradient-to-r from-purple-500 to-pink-500 text-white text-sm font-semibold">
              <Brain className="h-3.5 w-3.5 mr-1.5" />
              AI-POWERED PRO TOOLS
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
                      ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg shadow-purple-500/30 scale-105'
                      : 'text-slate-600 hover:text-purple-600 hover:bg-purple-50'
                  }`}
                >
                  {category}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Tools Grid - Compact Card Design */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-8">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-4">
            {filteredTools.map((tool, index) => (
              <div
                key={tool.id}
                onClick={() => handleToolSelect(tool)}
                className={`group relative bg-white rounded-xl overflow-hidden cursor-pointer transition-all duration-300 hover:-translate-y-1 hover:shadow-lg ${
                  selectedTool?.id === tool.id
                    ? 'ring-2 ring-purple-500 shadow-lg'
                    : 'shadow-md hover:shadow-purple-100'
                }`}
                style={{ animation: `fadeInUp 0.4s ease-out ${index * 0.03}s both` }}
              >
                {/* Compact Card Design */}
                <div className={`p-3 sm:p-4 ${tool.solidColor}`}>
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
                    <span className="text-[10px] sm:text-xs text-purple-600 font-medium bg-purple-50 px-1.5 py-0.5 rounded flex items-center gap-1">
                      <Crown className="h-2.5 w-2.5" />PRO
                    </span>
                    <span className="text-[10px] sm:text-xs text-slate-400">{tool.processingTime}</span>
                  </div>
                </div>
                {selectedTool?.id === tool.id && (
                  <div className="absolute top-2 right-2 p-1 bg-purple-600 rounded-full">
                    <CheckCircle className="h-3 w-3 text-white" />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>


        {/* Tool Processor Section */}
        {selectedTool && (
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
            <ToolProcessor
              selectedTool={selectedTool}
              uploadedFiles={uploadedFiles}
              onFilesUploaded={handleFilesUploaded}
              isProcessing={isProcessing}
              canProcess={canProcess}
              usageExceeded={usageExceeded}
              onProcess={handleAutoProcess}
              showUploadModal={showUploadModal}
              setShowUploadModal={setShowUploadModal}
              toolSettings={toolSettings}
              setToolSettings={setToolSettings}
              onUrlSubmitted={handleUrlSubmitted}
            />
          </div>
        )}

        {/* Results Display */}
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
          <ResultsDisplay
            ocrResults={ocrResults}
            toolResults={toolResults}
            chatSessions={chatSessions}
            currentMessage={currentMessage}
            setCurrentMessage={setCurrentMessage}
            onClearOCR={() => setOcrResults(null)}
            onClearToolResults={() => setToolResults(null)}
            onClearChat={() => setChatSessions({})}
            onSendMessage={sendChatMessage}
          />
        </div>

        {/* SEO Content Section */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20">
          <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-3xl p-8 sm:p-12 border border-purple-200/50">
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-8 text-center">
              AI-Powered PDF Tools - The Future of Document Processing
            </h2>
            <div className="grid md:grid-cols-3 gap-8 mb-8">
              <div className="text-center">
                <div className="inline-flex items-center justify-center w-14 h-14 bg-gradient-to-br from-cyan-100 to-blue-100 rounded-2xl mb-4">
                  <Eye className="h-7 w-7 text-cyan-600" />
                </div>
                <h3 className="text-lg font-semibold text-slate-900 mb-2">AI PDF OCR</h3>
                <p className="text-slate-600 text-sm leading-relaxed">
                  Extract text from scanned PDFs with 99% accuracy using artificial intelligence.
                </p>
              </div>
              <div className="text-center">
                <div className="inline-flex items-center justify-center w-14 h-14 bg-gradient-to-br from-purple-100 to-pink-100 rounded-2xl mb-4">
                  <MessageSquare className="h-7 w-7 text-purple-600" />
                </div>
                <h3 className="text-lg font-semibold text-slate-900 mb-2">Chat with PDF</h3>
                <p className="text-slate-600 text-sm leading-relaxed">
                  Ask questions about your documents and get instant AI-powered answers.
                </p>
              </div>
              <div className="text-center">
                <div className="inline-flex items-center justify-center w-14 h-14 bg-gradient-to-br from-amber-100 to-orange-100 rounded-2xl mb-4">
                  <Sparkles className="h-7 w-7 text-amber-600" />
                </div>
                <h3 className="text-lg font-semibold text-slate-900 mb-2">AI Summarization</h3>
                <p className="text-slate-600 text-sm leading-relaxed">
                  Get intelligent summaries of long documents instantly with key insights.
                </p>
              </div>
            </div>
            <div className="text-center">
              <p className="text-slate-500 text-sm max-w-3xl mx-auto">
                RobotPDF's advanced AI PDF tools bring artificial intelligence to document processing. 
                More powerful than Adobe Acrobat with AI features. Free AI PDF tools online.
              </p>
            </div>
          </div>
        </section>
      </div>

      {/* Modals */}
      {showUploadModal && selectedTool?.id !== 'advanced-html-to-pdf' && (
        <FileUploadModal
          isOpen={showUploadModal}
          onClose={() => setShowUploadModal(false)}
          onFilesUploaded={handleFilesUploaded}
          acceptedFiles={selectedTool?.acceptedFiles}
          multiple={selectedTool?.multipleFiles}
          clearTrigger={clearFileUpload}
        />
      )}

      {isProcessing && (
        <ProcessingModal
          isOpen={isProcessing}
          title={selectedTool ? `Processing ${selectedTool.title}` : 'Processing'}
          fileName={uploadedFiles.length > 0 ? uploadedFiles[0].name : 'Document'}
          progress={processingProgress}
          stage={processingStage}
          steps={processingSteps}
          currentStep={currentStep}
          icon={selectedTool ? selectedTool.icon : FileText}
        />
      )}

      {showAIAssistant && currentFileForAI && (
        <AIAssistant
          isOpen={showAIAssistant}
          onClose={() => setShowAIAssistant(false)}
          fileId={currentFileForAI.id}
          fileName={currentFileForAI.name}
          isMinimized={aiAssistantMinimized}
          onMinimize={() => setAiAssistantMinimized(!aiAssistantMinimized)}
        />
      )}

      {showUpgradeModal && (
        <UpgradeModal
          isOpen={showUpgradeModal}
          onClose={closeUpgradeModal}
          feature={upgradeModalData?.feature}
          description={upgradeModalData?.description}
        />
      )}

      {showEnhancedOCRModal && enhancedOCRResult && (
        <EnhancedOCRModal
          isOpen={showEnhancedOCRModal}
          onClose={() => setShowEnhancedOCRModal(false)}
          result={enhancedOCRResult}
          fileName={enhancedOCRResult?.filename || 'Document'}
          fileId={currentFileId}
          onResultUpdate={handleOCRResultUpdate}
        />
      )}

      {showFileOrderPreview && (
        <FileOrderPreview
          files={pendingFiles}
          onConfirm={handleFileOrderConfirm}
          onCancel={handleFileOrderCancel}
        />
      )}

      <PasswordProtectModal
        isOpen={showPasswordProtectModal}
        onClose={() => { setShowPasswordProtectModal(false); setPendingPasswordFiles([]) }}
        onConfirm={handlePasswordProtectConfirm}
        fileCount={pendingPasswordFiles.length}
      />

      <ImageCompressProModal
        isOpen={showImageCompressProModal}
        onClose={() => { setShowImageCompressProModal(false); setPendingImageFiles([]) }}
        onConfirm={(settings) => {
          setShowImageCompressProModal(false)
          setUploadedFiles(pendingImageFiles)
          setToolSettings(settings)
          setPendingImageFiles([])
          handleAutoProcess(pendingImageFiles, settings)
        }}
        fileCount={pendingImageFiles.length}
      />
    </div>
  )
}

export default AdvancedTools
