import { useState, useEffect, useCallback } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { useSubscription } from '../contexts/SubscriptionContext'
import { api } from '../lib/api'
import { downloadBlob } from '../lib/utils'
import { trackPageViewOnce, trackToolUsage } from '../lib/visitorTracking'
import { Button } from '../components/ui/button'
import { Badge } from '../components/ui/badge'
import toast from 'react-hot-toast'
import {
  Table2, Upload, Download, CheckCircle, FileSpreadsheet,
  Zap, Shield, FileText, BarChart3, Building2, GraduationCap,
  Briefcase, Star, RefreshCw, Sparkles, ChevronRight, FileUp, Layers
} from 'lucide-react'

const PdfToExcel = () => {
  const { user, session } = useAuth()
  const { subscription, usage } = useSubscription()
  const navigate = useNavigate()
  const [isDragging, setIsDragging] = useState(false)
  const [uploadedFile, setUploadedFile] = useState(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [processingProgress, setProcessingProgress] = useState(0)
  const [processingStage, setProcessingStage] = useState('')
  const [isVisible, setIsVisible] = useState(false)
  const [conversionComplete, setConversionComplete] = useState(false)

  useEffect(() => {
    setIsVisible(true)
    trackPageViewOnce(window.location.href, 'PDF to Excel Converter - RobotPDF')
      .catch(err => console.error('Failed to track visitor:', err))

    // Structured data for SEO
    const script = document.createElement('script')
    script.type = 'application/ld+json'
    script.text = JSON.stringify({
      "@context": "https://schema.org",
      "@type": "SoftwareApplication",
      "name": "PDF to Excel Converter",
      "applicationCategory": "BusinessApplication",
      "operatingSystem": "Web Browser",
      "offers": { "@type": "Offer", "price": "0", "priceCurrency": "USD" },
      "aggregateRating": { "@type": "AggregateRating", "ratingValue": "4.9", "ratingCount": "15420" }
    })
    document.head.appendChild(script)

    const faqScript = document.createElement('script')
    faqScript.type = 'application/ld+json'
    faqScript.text = JSON.stringify({
      "@context": "https://schema.org",
      "@type": "FAQPage",
      "mainEntity": [
        { "@type": "Question", "name": "How do I convert PDF to Excel for free?", "acceptedAnswer": { "@type": "Answer", "text": "Upload your PDF file to our converter, and we'll automatically extract tables and data into an Excel spreadsheet with 99% accuracy." }},
        { "@type": "Question", "name": "Can I convert bank statements from PDF to Excel?", "acceptedAnswer": { "@type": "Answer", "text": "Yes! Our converter is optimized for bank statements, accurately extracting transaction dates, descriptions, amounts, and balances." }},
        { "@type": "Question", "name": "Is the PDF to Excel conversion accurate?", "acceptedAnswer": { "@type": "Answer", "text": "Our converter achieves 99% accuracy using advanced AI and multiple extraction methods for complex tables and various PDF formats." }}
      ]
    })
    document.head.appendChild(faqScript)

    return () => {
      document.head.removeChild(script)
      document.head.removeChild(faqScript)
    }
  }, [])

  const handleDragOver = useCallback((e) => {
    e.preventDefault()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback((e) => {
    e.preventDefault()
    setIsDragging(false)
  }, [])

  const handleDrop = useCallback((e) => {
    e.preventDefault()
    setIsDragging(false)
    const files = Array.from(e.dataTransfer.files)
    if (files.length > 0 && files[0].type === 'application/pdf') {
      setUploadedFile(files[0])
      handleConvert(files[0])
    } else {
      toast.error('Please upload a PDF file')
    }
  }, [])

  const handleFileSelect = (e) => {
    const file = e.target.files?.[0]
    if (file && file.type === 'application/pdf') {
      setUploadedFile(file)
      handleConvert(file)
    } else {
      toast.error('Please select a PDF file')
    }
  }

  const resetConverter = () => {
    setUploadedFile(null)
    setIsProcessing(false)
    setProcessingProgress(0)
    setProcessingStage('')
    setConversionComplete(false)
  }

  const handleConvert = async (file) => {
    if (!file) return
    if (user && session && usage && usage.current >= usage.limit && subscription?.plan === 'free') {
      toast.error('Monthly limit reached. Please upgrade to continue.')
      return
    }

    setIsProcessing(true)
    setConversionComplete(false)
    setProcessingProgress(5)
    setProcessingStage('Preparing upload...')

    try {
      // Stage 1: Upload
      setProcessingProgress(10)
      setProcessingStage('Uploading PDF file...')
      
      const uploadResponse = await api.uploadFile(file)
      const fileId = uploadResponse.file.id

      // Stage 2: Analysis
      setProcessingProgress(25)
      setProcessingStage('Analyzing PDF structure...')
      await new Promise(resolve => setTimeout(resolve, 400))

      setProcessingProgress(35)
      setProcessingStage('Detecting tables & layouts...')
      await new Promise(resolve => setTimeout(resolve, 400))

      // Stage 3: Extraction
      setProcessingProgress(45)
      setProcessingStage('Extracting header information...')
      await new Promise(resolve => setTimeout(resolve, 300))

      setProcessingProgress(55)
      setProcessingStage('Processing table data...')
      await new Promise(resolve => setTimeout(resolve, 300))

      setProcessingProgress(65)
      setProcessingStage('Extracting account details...')
      
      // Stage 4: Conversion (actual API call) with language support
      setProcessingProgress(75)
      setProcessingStage('Converting to Excel format...')
      
      // Pass language option for multi-language support
      const conversionOptions = {
        language: 'auto',  // Auto-detect language, or can be set to specific language
        use_ocr: true      // Enable OCR for better multi-language support
      }
      
      const result = await api.convertPDFToExcel(fileId, `${file.name.replace('.pdf', '')}.xlsx`, conversionOptions)

      // Stage 5: Download
      setProcessingProgress(90)
      setProcessingStage('Preparing download...')

      if (result?.file?.id) {
        try {
          const blob = await api.downloadFile(result.file.id)
          setProcessingProgress(100)
          setProcessingStage('Download ready!')
          setConversionComplete(true)
          
          downloadBlob(blob, result.file.filename || `${file.name.replace('.pdf', '')}.xlsx`)
          toast.success('PDF converted to Excel successfully!')
          trackToolUsage('pdf-to-excel', 'PDF to Excel').catch(err => console.error('Failed to track:', err))
        } catch (downloadError) {
          console.error('Download error:', downloadError)
          // Try alternative download method
          setProcessingStage('Retrying download...')
          await new Promise(resolve => setTimeout(resolve, 1000))
          
          try {
            const blob = await api.downloadFile(result.file.id)
            downloadBlob(blob, result.file.filename || `${file.name.replace('.pdf', '')}.xlsx`)
            setProcessingProgress(100)
            setConversionComplete(true)
            toast.success('PDF converted to Excel successfully!')
          } catch (retryError) {
            throw new Error('File converted but download failed. Please try again.')
          }
        }
      }

      setTimeout(() => resetConverter(), 3000)
    } catch (error) {
      console.error('Conversion error:', error)
      toast.error(error.message || 'Conversion failed. Please try again.')
      resetConverter()
    }
  }

  const features = [
    { icon: BarChart3, title: '99% Accuracy', desc: 'AI-powered extraction' },
    { icon: Table2, title: 'Preserves Format', desc: 'Tables & styling intact' },
    { icon: Zap, title: 'Lightning Fast', desc: 'Convert in seconds' },
    { icon: Shield, title: '100% Secure', desc: 'Files auto-deleted' },
  ]

  const useCases = [
    { icon: Building2, title: 'Bank Statements', desc: 'Extract transactions accurately' },
    { icon: Briefcase, title: 'Invoices', desc: 'Convert billing data to Excel' },
    { icon: BarChart3, title: 'Financial Reports', desc: 'Analyze data in spreadsheets' },
    { icon: GraduationCap, title: 'Research Data', desc: 'Export tables for analysis' },
  ]


  return (
    <div className="min-h-screen bg-gradient-to-b from-white via-emerald-50/30 to-white overflow-hidden">
      {/* Background Effects */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -left-40 w-[600px] h-[600px] bg-gradient-to-br from-emerald-100/40 to-teal-100/40 rounded-full blur-3xl"></div>
        <div className="absolute top-40 -right-40 w-[500px] h-[500px] bg-gradient-to-br from-green-100/30 to-cyan-100/30 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-40 left-1/4 w-[700px] h-[700px] bg-gradient-to-br from-teal-100/20 to-emerald-100/20 rounded-full blur-3xl"></div>
      </div>

      {/* Hero Section */}
      <section className="relative pt-6 sm:pt-8 md:pt-12 lg:pt-16 pb-6 sm:pb-8 md:pb-12 px-3 sm:px-4 md:px-6">
        <div className="container mx-auto max-w-6xl">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8 lg:gap-12 items-center">
            {/* Left Column - Content */}
            <div className={`text-center lg:text-left transition-all duration-700 ${isVisible ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-10'}`}>
              <Badge className="mb-4 sm:mb-6 px-3 sm:px-4 py-1.5 bg-gradient-to-r from-emerald-500 to-teal-500 text-white text-xs sm:text-sm font-semibold inline-flex items-center">
                <Sparkles className="h-3 w-3 sm:h-4 sm:w-4 mr-1.5" />
                99% ACCURACY • FREE
              </Badge>
              
              <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-5xl font-bold mb-4 sm:mb-6 leading-tight">
                <span className="bg-gradient-to-r from-slate-900 via-emerald-900 to-slate-900 bg-clip-text text-transparent">
                  PDF to Excel
                </span>
                <br />
                <span className="bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
                  Converter Online
                </span>
              </h1>
              
              <p className="text-base sm:text-lg text-slate-600 mb-6 sm:mb-8 leading-relaxed max-w-lg mx-auto lg:mx-0">
                Convert PDF to Excel spreadsheets instantly. Extract tables from bank statements, 
                invoices & reports with AI-powered accuracy. Free, fast & secure.
              </p>
            </div>

            {/* Right Column - Upload Area */}
            <div className={`transition-all duration-700 delay-200 ${isVisible ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-10'}`}>
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => !isProcessing && document.getElementById('pdf-upload').click()}
                className={`relative bg-white rounded-2xl sm:rounded-3xl p-6 sm:p-8 lg:p-10 border-2 border-dashed transition-all duration-300 cursor-pointer shadow-xl hover:shadow-2xl ${
                  isDragging ? 'border-emerald-500 bg-emerald-50/50 scale-[1.02]' : 
                  conversionComplete ? 'border-emerald-400 bg-emerald-50/30' :
                  'border-emerald-200 hover:border-emerald-400'
                } ${isProcessing ? 'pointer-events-none' : ''}`}
              >
                <input
                  id="pdf-upload"
                  type="file"
                  accept=".pdf"
                  onChange={handleFileSelect}
                  className="hidden"
                  disabled={isProcessing}
                />
                
                {isProcessing ? (
                  <div className="text-center py-4">
                    <div className="relative w-20 h-20 sm:w-24 sm:h-24 mx-auto mb-4 sm:mb-6">
                      <svg className="w-full h-full transform -rotate-90">
                        <circle cx="50%" cy="50%" r="45%" stroke="#e5e7eb" strokeWidth="8" fill="none" />
                        <circle cx="50%" cy="50%" r="45%" stroke="url(#gradient)" strokeWidth="8" fill="none"
                          strokeLinecap="round" strokeDasharray={`${processingProgress * 2.83} 283`}
                          className="transition-all duration-500" />
                        <defs>
                          <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                            <stop offset="0%" stopColor="#10b981" />
                            <stop offset="100%" stopColor="#14b8a6" />
                          </linearGradient>
                        </defs>
                      </svg>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className="text-lg sm:text-xl font-bold text-emerald-600">{processingProgress}%</span>
                      </div>
                    </div>
                    <p className="text-base sm:text-lg font-semibold text-slate-800 mb-2">{processingStage}</p>
                    <p className="text-sm text-slate-500 mb-3">{uploadedFile?.name}</p>
                    
                    {/* Processing steps indicator */}
                    <div className="flex justify-center gap-1 mt-4">
                      {[1, 2, 3, 4, 5].map((step) => (
                        <div
                          key={step}
                          className={`w-2 h-2 rounded-full transition-all duration-300 ${
                            processingProgress >= step * 20
                              ? 'bg-emerald-500'
                              : processingProgress >= (step - 1) * 20
                              ? 'bg-emerald-300 animate-pulse'
                              : 'bg-gray-200'
                          }`}
                        />
                      ))}
                    </div>
                    <p className="text-xs text-slate-400 mt-2">
                      {processingProgress < 25 ? 'Uploading...' : 
                       processingProgress < 50 ? 'Analyzing...' : 
                       processingProgress < 75 ? 'Extracting...' : 
                       processingProgress < 90 ? 'Converting...' : 'Finalizing...'}
                    </p>
                  </div>
                ) : conversionComplete ? (
                  <div className="text-center py-4">
                    <div className="w-16 h-16 sm:w-20 sm:h-20 mx-auto mb-4 bg-emerald-100 rounded-full flex items-center justify-center">
                      <CheckCircle className="h-8 w-8 sm:h-10 sm:w-10 text-emerald-600" />
                    </div>
                    <p className="text-lg sm:text-xl font-semibold text-emerald-700 mb-2">Conversion Complete!</p>
                    <p className="text-sm text-slate-500 mb-4">Your Excel file has been downloaded</p>
                    <Button onClick={(e) => { e.stopPropagation(); resetConverter(); }} variant="outline" className="border-emerald-300 text-emerald-700 hover:bg-emerald-50">
                      <RefreshCw className="h-4 w-4 mr-2" /> Convert Another
                    </Button>
                  </div>
                ) : (
                  <div className="text-center">
                    <div className="w-16 h-16 sm:w-20 sm:h-20 mx-auto mb-4 sm:mb-6 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl flex items-center justify-center shadow-lg transform group-hover:scale-110 transition-transform">
                      <FileUp className="h-8 w-8 sm:h-10 sm:w-10 text-white" />
                    </div>
                    <h3 className="text-lg sm:text-xl font-semibold text-slate-800 mb-2">Drop your PDF here</h3>
                    <p className="text-sm sm:text-base text-slate-500 mb-4 sm:mb-6">or click to browse files</p>
                    <Button size="lg" className="w-full sm:w-auto px-6 sm:px-8 py-3 sm:py-4 text-base font-semibold bg-gradient-to-r from-emerald-600 to-teal-600 text-white hover:shadow-lg transition-all rounded-xl">
                      <Upload className="mr-2 h-4 w-4 sm:h-5 sm:w-5" /> Select PDF File
                    </Button>
                    <p className="text-xs sm:text-sm text-slate-400 mt-4">
                      Max 100MB • Secure & Private • Auto-deleted
                    </p>
                  </div>
                )}
              </div>
            </div>


            {/* Trust Indicators */}
              <div className="flex flex-wrap items-center justify-center lg:justify-start gap-4 sm:gap-6 text-xs sm:text-sm text-slate-500 mb-6">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5 text-emerald-500" />
                  <span>No registration</span>
                </div>
                <div className="flex items-center gap-2">
                  <Shield className="h-4 w-4 sm:h-5 sm:w-5 text-emerald-500" />
                  <span>Secure & Private</span>
                </div>
                <div className="flex items-center gap-2">
                  <Zap className="h-4 w-4 sm:h-5 sm:w-5 text-emerald-500" />
                  <span>Instant download</span>
                </div>
              </div>

              {/* Stats - Mobile */}
              <div className="grid grid-cols-3 gap-3 lg:hidden mb-6">
                <div className="bg-white/80 backdrop-blur rounded-xl p-3 text-center border border-emerald-100">
                  <div className="text-xl font-bold text-emerald-600">99%</div>
                  <div className="text-xs text-slate-500">Accuracy</div>
                </div>
                <div className="bg-white/80 backdrop-blur rounded-xl p-3 text-center border border-emerald-100">
                  <div className="text-xl font-bold text-emerald-600">50K+</div>
                  <div className="text-xs text-slate-500">Users</div>
                </div>
                <div className="bg-white/80 backdrop-blur rounded-xl p-3 text-center border border-emerald-100">
                  <div className="text-xl font-bold text-emerald-600">Free</div>
                  <div className="text-xs text-slate-500">Forever</div>
                </div>
              </div>
              
          </div>
        </div>
      </section>


      {/* Features Grid */}
      <section className="py-10 sm:py-16 px-4 sm:px-6 bg-gradient-to-r from-emerald-50 via-teal-50 to-cyan-50">
        <div className="container mx-auto max-w-6xl">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
            {features.map((feature, index) => (
              <div key={index} className="text-center">
                <div className="inline-flex items-center justify-center w-12 h-12 sm:w-14 sm:h-14 bg-white rounded-xl sm:rounded-2xl shadow-md mb-3 sm:mb-4">
                  <feature.icon className="h-5 w-5 sm:h-6 sm:w-6 text-emerald-600" />
                </div>
                <div className="text-sm sm:text-base font-semibold text-slate-900">{feature.title}</div>
                <div className="text-xs sm:text-sm text-slate-500">{feature.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pro Pack Promotion */}
      <section className="py-6 sm:py-8 px-3 sm:px-4 md:px-6">
        <div className="container mx-auto max-w-4xl">
          <div className="bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 rounded-2xl p-6 sm:p-8 text-center shadow-xl">
            <p className="text-white text-base sm:text-lg font-medium">
              Want more control of the output? Try our <Link to="/pricing" className="font-bold underline hover:text-indigo-100 transition-colors">Pro Pack with advanced settings</Link>
            </p>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-12 sm:py-20 px-4 sm:px-6">
        <div className="container mx-auto max-w-5xl">
          <div className="text-center mb-8 sm:mb-12">
            <Badge className="mb-3 sm:mb-4 px-3 sm:px-4 py-1.5 bg-gradient-to-r from-emerald-100 to-teal-100 text-emerald-700 text-xs sm:text-sm font-semibold">
              SIMPLE PROCESS
            </Badge>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-slate-900 mb-3 sm:mb-4">
              How to Convert PDF to Excel
            </h2>
            <p className="text-sm sm:text-base text-slate-600 max-w-2xl mx-auto">
              Convert any PDF to Excel in three simple steps. No software installation required.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
            {[
              { step: '1', title: 'Upload PDF', desc: 'Drag & drop or click to upload your PDF file', icon: Upload },
              { step: '2', title: 'AI Extraction', desc: 'Our AI analyzes and extracts tables with 99% accuracy', icon: Sparkles },
              { step: '3', title: 'Download Excel', desc: 'Get your perfectly formatted Excel file instantly', icon: Download },
            ].map((item, index) => (
              <div key={index} className="relative bg-white rounded-xl sm:rounded-2xl p-5 sm:p-6 border-2 border-emerald-100 hover:border-emerald-300 hover:shadow-xl transition-all group">
                <div className="absolute -top-3 -left-3 w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-full flex items-center justify-center text-white font-bold text-sm sm:text-base shadow-lg">
                  {item.step}
                </div>
                <div className="w-12 h-12 sm:w-14 sm:h-14 bg-emerald-50 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <item.icon className="h-5 w-5 sm:h-6 sm:w-6 text-emerald-600" />
                </div>
                <h3 className="text-base sm:text-lg font-semibold text-slate-900 mb-2">{item.title}</h3>
                <p className="text-sm text-slate-600">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Use Cases */}
      <section className="py-12 sm:py-20 px-4 sm:px-6 bg-gradient-to-b from-slate-50 to-white">
        <div className="container mx-auto max-w-5xl">
          <div className="text-center mb-8 sm:mb-12">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-slate-900 mb-3 sm:mb-4">
              Perfect for Every Use Case
            </h2>
            <p className="text-sm sm:text-base text-slate-600 max-w-2xl mx-auto">
              Our PDF to Excel converter handles all types of documents with precision
            </p>
          </div>
          
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            {useCases.map((item, index) => (
              <div key={index} className="bg-white rounded-xl sm:rounded-2xl p-4 sm:p-6 border-2 border-gray-100 hover:border-emerald-200 hover:shadow-lg transition-all text-center group cursor-pointer">
                <div className="w-12 h-12 sm:w-14 sm:h-14 bg-emerald-50 rounded-xl flex items-center justify-center mx-auto mb-3 sm:mb-4 group-hover:scale-110 transition-transform">
                  <item.icon className="h-5 w-5 sm:h-6 sm:w-6 text-emerald-600" />
                </div>
                <h3 className="text-sm sm:text-base font-semibold text-slate-900 mb-1">{item.title}</h3>
                <p className="text-xs sm:text-sm text-slate-500">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>


      {/* FAQ Section */}
      <section className="py-12 sm:py-20 px-4 sm:px-6">
        <div className="container mx-auto max-w-4xl">
          <div className="text-center mb-8 sm:mb-12">
            <Badge className="mb-3 sm:mb-4 px-3 sm:px-4 py-1.5 bg-gradient-to-r from-emerald-100 to-teal-100 text-emerald-700 text-xs sm:text-sm font-semibold">
              FAQ
            </Badge>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-slate-900 mb-3">
              Frequently Asked Questions
            </h2>
          </div>
          
          <div className="space-y-3 sm:space-y-4">
            {[
              { q: 'How do I convert PDF to Excel for free?', a: 'Simply upload your PDF file above, and our AI will automatically extract tables and data into an Excel spreadsheet with 99% accuracy. No registration required.' },
              { q: 'Can I convert bank statements from PDF to Excel?', a: 'Yes! Our converter is specifically optimized for bank statements. It accurately extracts transaction dates, descriptions, amounts, and balances while preserving the table structure.' },
              { q: 'Is the PDF to Excel conversion accurate?', a: 'Our converter achieves 99% accuracy using advanced AI and multiple extraction methods (pdfplumber + camelot). It handles complex tables, merged cells, and various PDF formats.' },
              { q: 'Is my PDF data secure during conversion?', a: 'Absolutely. We use bank-level SSL encryption for all file transfers. Your files are processed securely and automatically deleted after conversion. We never store or share your data.' },
              { q: 'Does the converter preserve table formatting?', a: 'Yes, our AI preserves table structure, cell borders, header styling, number formatting (currency, percentages), and column alignment. The Excel output looks nearly identical to the original PDF.' },
              { q: 'How long does PDF to Excel conversion take?', a: 'Most PDF files are converted to Excel in under 30 seconds. Larger files with multiple pages may take up to a minute. Our optimized AI ensures fast conversion without compromising accuracy.' },
            ].map((item, index) => (
              <div key={index} className="bg-white rounded-xl sm:rounded-2xl p-4 sm:p-6 border border-gray-200 hover:border-emerald-200 hover:shadow-md transition-all">
                <h3 className="text-sm sm:text-base font-semibold text-slate-900 mb-2 flex items-start gap-2">
                  <span className="w-5 h-5 sm:w-6 sm:h-6 bg-emerald-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-emerald-600 text-xs font-bold">?</span>
                  </span>
                  {item.q}
                </h3>
                <p className="text-xs sm:text-sm text-slate-600 pl-7 sm:pl-8">{item.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Social Proof */}
      <section className="py-10 sm:py-16 px-4 sm:px-6 bg-gradient-to-r from-emerald-50 via-teal-50 to-cyan-50">
        <div className="container mx-auto max-w-5xl">
          <div className="text-center mb-8 sm:mb-10">
            <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-slate-900 mb-2">
              Trusted by 50,000+ Users
            </h2>
            <div className="flex items-center justify-center gap-1 mb-4">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="h-4 w-4 sm:h-5 sm:w-5 fill-yellow-400 text-yellow-400" />
              ))}
              <span className="ml-2 text-sm text-slate-600">4.9/5 rating</span>
            </div>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
            {[
              { text: "Finally a PDF to Excel converter that actually works! Converted my bank statements perfectly.", author: "Sarah M.", role: "Accountant" },
              { text: "The table formatting is preserved perfectly, saving me hours of manual work.", author: "James K.", role: "Financial Analyst" },
              { text: "Super fast and accurate. I convert invoices daily, and this tool handles everything.", author: "Maria L.", role: "Business Owner" },
            ].map((item, index) => (
              <div key={index} className="bg-white rounded-xl sm:rounded-2xl p-4 sm:p-6 border border-gray-200 shadow-sm">
                <div className="flex gap-1 mb-3">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="h-3 w-3 sm:h-4 sm:w-4 fill-yellow-400 text-yellow-400" />
                  ))}
                </div>
                <p className="text-xs sm:text-sm text-slate-600 mb-3 leading-relaxed">"{item.text}"</p>
                <p className="text-xs sm:text-sm font-semibold text-slate-900">— {item.author}, <span className="font-normal text-slate-500">{item.role}</span></p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Related Tools */}
      <section className="py-12 sm:py-20 px-4 sm:px-6">
        <div className="container mx-auto max-w-5xl">
          <div className="text-center mb-8 sm:mb-10">
            <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-slate-900 mb-2">
              Related PDF Tools
            </h2>
            <p className="text-sm text-slate-600">Explore more powerful PDF tools</p>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
            {[
              { to: '/tools#excel-to-pdf', icon: FileSpreadsheet, title: 'Excel to PDF', color: 'text-green-600', bg: 'bg-green-50' },
              { to: '/tools#pdf-to-word', icon: FileText, title: 'PDF to Word', color: 'text-blue-600', bg: 'bg-blue-50' },
              { to: '/ai-enhanced-ocr-pdf', icon: Sparkles, title: 'AI OCR', color: 'text-purple-600', bg: 'bg-purple-50' },
              { to: '/tools#merge', icon: Layers, title: 'Merge PDFs', color: 'text-orange-600', bg: 'bg-orange-50' },
            ].map((item, index) => (
              <Link key={index} to={item.to} className="bg-white rounded-xl p-4 sm:p-5 border-2 border-gray-100 hover:border-emerald-200 hover:shadow-lg transition-all text-center group">
                <div className={`w-10 h-10 sm:w-12 sm:h-12 ${item.bg} rounded-xl flex items-center justify-center mx-auto mb-2 sm:mb-3 group-hover:scale-110 transition-transform`}>
                  <item.icon className={`h-5 w-5 sm:h-6 sm:w-6 ${item.color}`} />
                </div>
                <h3 className="text-xs sm:text-sm font-semibold text-slate-900">{item.title}</h3>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-12 sm:py-16 px-4 sm:px-6 bg-gradient-to-r from-emerald-600 to-teal-600">
        <div className="container mx-auto max-w-4xl text-center">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white mb-4">
            Ready to Convert Your PDF?
          </h2>
          <p className="text-base sm:text-lg text-emerald-100 mb-6 sm:mb-8 max-w-2xl mx-auto">
            Join 50,000+ users who trust RobotPDF for accurate PDF to Excel conversion
          </p>
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center">
            <Button 
              size="lg" 
              onClick={() => document.getElementById('pdf-upload').click()}
              className="w-full sm:w-auto px-6 sm:px-8 py-4 sm:py-6 text-base sm:text-lg font-semibold bg-white text-emerald-700 hover:bg-emerald-50 rounded-xl"
            >
              <Upload className="mr-2 h-4 w-4 sm:h-5 sm:w-5" /> Convert PDF Now
            </Button>
            <Button 
              size="lg" 
              variant="outline"
              onClick={() => navigate('/pricing')}
              className="w-full sm:w-auto px-6 sm:px-8 py-4 sm:py-6 text-base sm:text-lg font-semibold border-2 border-white/30 text-white hover:bg-white/10 rounded-xl"
            >
              View Pro Features <ChevronRight className="ml-1 h-4 w-4 sm:h-5 sm:w-5" />
            </Button>
          </div>
        </div>
      </section>
    </div>
  )
}

export default PdfToExcel
