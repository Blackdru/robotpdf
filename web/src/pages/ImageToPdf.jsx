import { useState, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { useSubscription } from '../contexts/SubscriptionContext'
import { api } from '../lib/api'
import { downloadBlob } from '../lib/utils'
import { trackPageViewOnce, trackToolUsage } from '../lib/visitorTracking'
import { Button } from '../components/ui/button'
import { Badge } from '../components/ui/badge'
import toast from 'react-hot-toast'
import { ImagePlus, Upload, Download, CheckCircle, FileText, Zap, Shield, Building2, GraduationCap, Briefcase, Star, RefreshCw, Sparkles, FileUp, Table2, Combine, Image, Minimize2 } from 'lucide-react'

const ImageToPdf = () => {
  const { user, session } = useAuth()
  const { subscription, usage } = useSubscription()
  const [isDragging, setIsDragging] = useState(false)
  const [uploadedFiles, setUploadedFiles] = useState([])
  const [isProcessing, setIsProcessing] = useState(false)
  const [processingProgress, setProcessingProgress] = useState(0)
  const [processingStage, setProcessingStage] = useState('')
  const [isVisible, setIsVisible] = useState(false)
  const [conversionComplete, setConversionComplete] = useState(false)

  useEffect(() => {
    setIsVisible(true)
    trackPageViewOnce(window.location.href, 'Image to PDF Converter Online Free - RobotPDF').catch(err => console.error('Failed to track:', err))
    const script = document.createElement('script')
    script.type = 'application/ld+json'
    script.text = JSON.stringify({
      "@context": "https://schema.org",
      "@type": "SoftwareApplication",
      "name": "Image to PDF Converter",
      "applicationCategory": "BusinessApplication",
      "operatingSystem": "Web Browser",
      "offers": { "@type": "Offer", "price": "0", "priceCurrency": "USD" },
      "aggregateRating": { "@type": "AggregateRating", "ratingValue": "4.9", "ratingCount": "18420" }
    })
    document.head.appendChild(script)

    const faqScript = document.createElement('script')
    faqScript.type = 'application/ld+json'
    faqScript.text = JSON.stringify({
      "@context": "https://schema.org",
      "@type": "FAQPage",
      "mainEntity": [
        { "@type": "Question", "name": "How do I convert images to PDF for free?", "acceptedAnswer": { "@type": "Answer", "text": "Upload your images (JPG, PNG, GIF, WebP) to our converter, arrange them in order, and click convert. Your PDF will be ready instantly." }},
        { "@type": "Question", "name": "Can I combine multiple images into one PDF?", "acceptedAnswer": { "@type": "Answer", "text": "Yes! Upload as many images as you want and we'll combine them all into a single PDF document in the order you specify." }},
        { "@type": "Question", "name": "What image formats are supported?", "acceptedAnswer": { "@type": "Answer", "text": "We support JPG, JPEG, PNG, GIF, WebP, and BMP image formats. All images are converted with high quality preservation." }}
      ]
    })
    document.head.appendChild(faqScript)

    return () => {
      document.head.removeChild(script)
      document.head.removeChild(faqScript)
    }
  }, [])

  const handleDragOver = useCallback((e) => { e.preventDefault(); setIsDragging(true) }, [])
  const handleDragLeave = useCallback((e) => { e.preventDefault(); setIsDragging(false) }, [])
  const handleDrop = useCallback((e) => {
    e.preventDefault(); setIsDragging(false)
    const files = Array.from(e.dataTransfer.files).filter(f => f.type.startsWith('image/'))
    if (files.length > 0) { setUploadedFiles(prev => [...prev, ...files]) }
    else { toast.error('Please upload image files (JPG, PNG, etc.)') }
  }, [])

  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files).filter(f => f.type.startsWith('image/'))
    if (files.length > 0) { setUploadedFiles(prev => [...prev, ...files]) }
  }

  const removeFile = (index) => setUploadedFiles(prev => prev.filter((_, i) => i !== index))
  const resetConverter = () => { setUploadedFiles([]); setIsProcessing(false); setProcessingProgress(0); setProcessingStage(''); setConversionComplete(false) }

  const handleConvert = async () => {
    if (uploadedFiles.length === 0) { toast.error('Please upload at least one image'); return }
    if (user && session && usage && usage.current >= usage.limit && subscription?.plan === 'free') { toast.error('Monthly limit reached.'); return }
    setIsProcessing(true); setConversionComplete(false); setProcessingProgress(5); setProcessingStage('Preparing images...')
    try {
      const uploadedFileIds = []
      for (let i = 0; i < uploadedFiles.length; i++) {
        setProcessingProgress(10 + (i / uploadedFiles.length) * 40)
        setProcessingStage(`Uploading image ${i + 1}/${uploadedFiles.length}...`)
        const response = await api.uploadFile(uploadedFiles[i])
        uploadedFileIds.push(response.file.id)
      }
      setProcessingProgress(60); setProcessingStage('Converting to PDF...')
      const result = await api.convertImagesToPDF(uploadedFileIds, `images-${Date.now()}.pdf`)
      setProcessingProgress(90); setProcessingStage('Preparing download...')
      if (result?.file?.id) {
        const blob = await api.downloadFile(result.file.id)
        setProcessingProgress(100); setProcessingStage('Download ready!'); setConversionComplete(true)
        downloadBlob(blob, result.file.filename || 'images.pdf')
        toast.success('Images converted to PDF successfully!')
        trackToolUsage('image-to-pdf', 'Image to PDF').catch(err => console.error('Failed to track:', err))
      }
      setTimeout(() => resetConverter(), 3000)
    } catch (error) { console.error('Conversion error:', error); toast.error(error.message || 'Conversion failed.'); resetConverter() }
  }

  const features = [
    { icon: ImagePlus, title: 'Multiple Images', desc: 'Combine many images' },
    { icon: Zap, title: 'Lightning Fast', desc: 'Convert in seconds' },
    { icon: Shield, title: '100% Secure', desc: 'Files auto-deleted' },
    { icon: CheckCircle, title: 'High Quality', desc: 'Preserves resolution' }
  ]

  const useCases = [
    { icon: Building2, title: 'Photo Albums', desc: 'Create PDF albums' },
    { icon: Briefcase, title: 'Portfolios', desc: 'Share work samples' },
    { icon: GraduationCap, title: 'Presentations', desc: 'Image slideshows' },
    { icon: FileText, title: 'Documents', desc: 'Scan to PDF' }
  ]

  return (
    <div className="min-h-screen bg-gradient-to-b from-white via-cyan-50/30 to-white overflow-hidden">
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -left-40 w-[600px] h-[600px] bg-gradient-to-br from-cyan-100/40 to-blue-100/40 rounded-full blur-3xl"></div>
        <div className="absolute top-40 -right-40 w-[500px] h-[500px] bg-gradient-to-br from-cyan-100/30 to-teal-100/30 rounded-full blur-3xl"></div>
      </div>

      {/* Hero Section */}
      <section className="relative pt-6 sm:pt-8 md:pt-12 lg:pt-16 pb-6 sm:pb-8 md:pb-12 px-3 sm:px-4 md:px-6">
        <div className="container mx-auto max-w-6xl">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8 lg:gap-12 items-center">
            <div className={`text-center lg:text-left transition-all duration-700 ${isVisible ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-10'}`}>
              <Badge className="mb-4 sm:mb-6 px-3 sm:px-4 py-1.5 bg-gradient-to-r from-cyan-500 to-blue-500 text-white text-xs sm:text-sm font-semibold inline-flex items-center">
                <Sparkles className="h-3 w-3 sm:h-4 sm:w-4 mr-1.5" />
                MULTIPLE IMAGES • FREE
              </Badge>
              <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-5xl font-bold mb-4 sm:mb-6 leading-tight">
                <span className="bg-gradient-to-r from-slate-900 via-cyan-900 to-slate-900 bg-clip-text text-transparent">Image to PDF</span>
                <br />
                <span className="bg-gradient-to-r from-cyan-600 to-blue-600 bg-clip-text text-transparent">Converter Online</span>
              </h1>
              <p className="text-base sm:text-lg text-slate-600 mb-6 sm:mb-8 leading-relaxed max-w-lg mx-auto lg:mx-0">
                Convert JPG, PNG, GIF, WebP images to PDF instantly. Combine multiple images into one professional PDF document. Free, fast & secure.
              </p>
              <div className="flex flex-wrap items-center justify-center lg:justify-start gap-4 sm:gap-6 text-xs sm:text-sm text-slate-500 mb-6">
                <div className="flex items-center gap-2"><CheckCircle className="h-4 w-4 sm:h-5 sm:w-5 text-cyan-500" /><span>No registration</span></div>
                <div className="flex items-center gap-2"><Shield className="h-4 w-4 sm:h-5 sm:w-5 text-cyan-500" /><span>Secure & Private</span></div>
                <div className="flex items-center gap-2"><Zap className="h-4 w-4 sm:h-5 sm:w-5 text-cyan-500" /><span>Instant download</span></div>
              </div>
            </div>

            {/* Upload Area */}
            <div className={`transition-all duration-700 delay-200 ${isVisible ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-10'}`}>
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => !isProcessing && uploadedFiles.length === 0 && document.getElementById('image-upload').click()}
                className={`relative bg-white rounded-2xl sm:rounded-3xl p-6 sm:p-8 lg:p-10 border-2 border-dashed transition-all duration-300 cursor-pointer shadow-xl hover:shadow-2xl ${
                  isDragging ? 'border-cyan-500 bg-cyan-50/50 scale-[1.02]' :
                  conversionComplete ? 'border-cyan-400 bg-cyan-50/30' :
                  'border-cyan-200 hover:border-cyan-400'
                } ${isProcessing ? 'pointer-events-none' : ''}`}
              >
                <input id="image-upload" type="file" accept="image/*" multiple onChange={handleFileSelect} className="hidden" disabled={isProcessing} />

                {isProcessing ? (
                  <div className="text-center py-4">
                    <div className="relative w-20 h-20 sm:w-24 sm:h-24 mx-auto mb-4 sm:mb-6">
                      <svg className="w-full h-full transform -rotate-90">
                        <circle cx="50%" cy="50%" r="45%" stroke="#e5e7eb" strokeWidth="8" fill="none" />
                        <circle cx="50%" cy="50%" r="45%" stroke="url(#gradientImg)" strokeWidth="8" fill="none" strokeLinecap="round" strokeDasharray={`${processingProgress * 2.83} 283`} className="transition-all duration-500" />
                        <defs><linearGradient id="gradientImg" x1="0%" y1="0%" x2="100%" y2="0%"><stop offset="0%" stopColor="#06b6d4" /><stop offset="100%" stopColor="#3b82f6" /></linearGradient></defs>
                      </svg>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className="text-lg sm:text-xl font-bold text-cyan-600">{processingProgress}%</span>
                      </div>
                    </div>
                    <p className="text-base sm:text-lg font-semibold text-slate-800 mb-2">{processingStage}</p>
                    <div className="flex justify-center gap-1 mt-4">
                      {[1, 2, 3, 4, 5].map((step) => (
                        <div key={step} className={`w-2 h-2 rounded-full transition-all duration-300 ${processingProgress >= step * 20 ? 'bg-cyan-500' : processingProgress >= (step - 1) * 20 ? 'bg-cyan-300 animate-pulse' : 'bg-gray-200'}`} />
                      ))}
                    </div>
                    <p className="text-xs text-slate-400 mt-2">{processingProgress < 25 ? 'Uploading...' : processingProgress < 50 ? 'Processing...' : processingProgress < 75 ? 'Converting...' : processingProgress < 90 ? 'Finalizing...' : 'Complete!'}</p>
                  </div>
                ) : conversionComplete ? (
                  <div className="text-center py-4">
                    <div className="w-16 h-16 sm:w-20 sm:h-20 mx-auto mb-4 bg-cyan-100 rounded-full flex items-center justify-center">
                      <CheckCircle className="h-8 w-8 sm:h-10 sm:w-10 text-cyan-600" />
                    </div>
                    <p className="text-lg sm:text-xl font-semibold text-cyan-700 mb-2">Conversion Complete!</p>
                    <p className="text-sm text-slate-500 mb-4">Your PDF has been downloaded</p>
                    <Button onClick={(e) => { e.stopPropagation(); resetConverter(); }} variant="outline" className="border-cyan-300 text-cyan-700 hover:bg-cyan-50">
                      <RefreshCw className="h-4 w-4 mr-2" /> Convert More
                    </Button>
                  </div>
                ) : uploadedFiles.length > 0 ? (
                  <div className="text-center" onClick={(e) => e.stopPropagation()}>
                    <div className="mb-4 max-h-40 overflow-y-auto">
                      {uploadedFiles.map((file, index) => (
                        <div key={index} className="flex items-center justify-between bg-cyan-50 rounded-lg p-2 mb-2">
                          <span className="text-sm text-slate-700 truncate flex-1">{file.name}</span>
                          <button onClick={() => removeFile(index)} className="ml-2 text-red-500 hover:text-red-700 text-lg font-bold">×</button>
                        </div>
                      ))}
                    </div>
                    <div className="flex gap-2 justify-center flex-wrap">
                      <Button onClick={() => document.getElementById('image-upload').click()} variant="outline" className="border-cyan-300">
                        <Upload className="h-4 w-4 mr-2" /> Add More
                      </Button>
                      <Button onClick={handleConvert} className="bg-gradient-to-r from-cyan-600 to-blue-600 text-white">
                        <ImagePlus className="h-4 w-4 mr-2" /> Convert {uploadedFiles.length} Images
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="text-center">
                    <div className="w-16 h-16 sm:w-20 sm:h-20 mx-auto mb-4 sm:mb-6 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-2xl flex items-center justify-center shadow-lg">
                      <FileUp className="h-8 w-8 sm:h-10 sm:w-10 text-white" />
                    </div>
                    <h3 className="text-lg sm:text-xl font-semibold text-slate-800 mb-2">Drop your images here</h3>
                    <p className="text-sm sm:text-base text-slate-500 mb-4 sm:mb-6">or click to browse files</p>
                    <Button size="lg" className="w-full sm:w-auto px-6 sm:px-8 py-3 sm:py-4 text-base font-semibold bg-gradient-to-r from-cyan-600 to-blue-600 text-white hover:shadow-lg transition-all rounded-xl">
                      <Upload className="mr-2 h-4 w-4 sm:h-5 sm:w-5" /> Select Images
                    </Button>
                    <p className="text-xs sm:text-sm text-slate-400 mt-4">JPG, PNG, GIF, WebP, BMP supported</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-8 sm:py-10 md:py-16 px-3 sm:px-4 md:px-6 bg-gradient-to-r from-cyan-50 via-blue-50 to-indigo-50">
        <div className="container mx-auto max-w-6xl">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 md:gap-6">
            {features.map((feature, index) => (
              <div key={index} className="text-center">
                <div className="inline-flex items-center justify-center w-12 h-12 sm:w-14 sm:h-14 bg-white rounded-xl sm:rounded-2xl shadow-md mb-3 sm:mb-4">
                  <feature.icon className="h-5 w-5 sm:h-6 sm:w-6 text-cyan-600" />
                </div>
                <div className="text-sm sm:text-base font-semibold text-slate-900">{feature.title}</div>
                <div className="text-xs sm:text-sm text-slate-500">{feature.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>


      {/* How It Works */}
      <section className="py-10 sm:py-12 md:py-20 px-3 sm:px-4 md:px-6">
        <div className="container mx-auto max-w-5xl">
          <div className="text-center mb-6 sm:mb-8 md:mb-12">
            <Badge className="mb-2 sm:mb-3 md:mb-4 px-3 sm:px-4 py-1.5 bg-gradient-to-r from-cyan-100 to-blue-100 text-cyan-700 text-xs sm:text-sm font-semibold">SIMPLE PROCESS</Badge>
            <h2 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold text-slate-900">How to Convert Images to PDF</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6 md:gap-8">
            {[
              { step: '1', title: 'Upload Images', desc: 'Drag & drop or select multiple images', icon: Upload },
              { step: '2', title: 'Arrange Order', desc: 'Reorder images as needed', icon: Image },
              { step: '3', title: 'Download PDF', desc: 'Get your combined PDF instantly', icon: Download }
            ].map((item, index) => (
              <div key={index} className="relative bg-white rounded-xl sm:rounded-2xl p-5 sm:p-6 border-2 border-cyan-100 hover:border-cyan-300 hover:shadow-xl transition-all group">
                <div className="absolute -top-3 -left-3 w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-full flex items-center justify-center text-white font-bold shadow-lg">{item.step}</div>
                <div className="w-12 h-12 sm:w-14 sm:h-14 bg-cyan-50 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <item.icon className="h-5 w-5 sm:h-6 sm:w-6 text-cyan-600" />
                </div>
                <h3 className="text-base sm:text-lg font-semibold text-slate-900 mb-2">{item.title}</h3>
                <p className="text-sm text-slate-600">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Use Cases */}
      <section className="py-10 sm:py-12 md:py-20 px-3 sm:px-4 md:px-6 bg-gradient-to-b from-slate-50 to-white">
        <div className="container mx-auto max-w-5xl">
          <div className="text-center mb-6 sm:mb-8 md:mb-12">
            <h2 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold text-slate-900">Perfect for Every Use Case</h2>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-6">
            {useCases.map((item, index) => (
              <div key={index} className="bg-white rounded-xl sm:rounded-2xl p-4 sm:p-6 border-2 border-gray-100 hover:border-cyan-200 hover:shadow-lg transition-all text-center group">
                <div className="w-12 h-12 sm:w-14 sm:h-14 bg-cyan-50 rounded-xl flex items-center justify-center mx-auto mb-3 sm:mb-4 group-hover:scale-110 transition-transform">
                  <item.icon className="h-5 w-5 sm:h-6 sm:w-6 text-cyan-600" />
                </div>
                <h3 className="text-sm sm:text-base font-semibold text-slate-900 mb-1">{item.title}</h3>
                <p className="text-xs sm:text-sm text-slate-500">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-10 sm:py-12 md:py-20 px-3 sm:px-4 md:px-6">
        <div className="container mx-auto max-w-4xl">
          <div className="text-center mb-6 sm:mb-8 md:mb-12">
            <Badge className="mb-2 sm:mb-3 md:mb-4 px-3 sm:px-4 py-1.5 bg-gradient-to-r from-cyan-100 to-blue-100 text-cyan-700 text-xs sm:text-sm font-semibold">FAQ</Badge>
            <h2 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold text-slate-900 mb-2 sm:mb-3">Frequently Asked Questions</h2>
          </div>
          <div className="space-y-2 sm:space-y-3 md:space-y-4">
            {[
              { q: 'How do I convert images to PDF for free?', a: 'Upload your images (JPG, PNG, GIF, WebP) above, arrange them in order, and click convert. Your PDF will be ready instantly for download.' },
              { q: 'Can I combine multiple images into one PDF?', a: 'Yes! Upload as many images as you want and we\'ll combine them all into a single PDF document in the order you specify.' },
              { q: 'What image formats are supported?', a: 'We support JPG, JPEG, PNG, GIF, WebP, and BMP image formats. All images are converted with high quality preservation.' },
              { q: 'Is there a limit on the number of images?', a: 'Free users can convert multiple images at once. The combined file size should be under 100MB for optimal performance.' },
              { q: 'Will my images lose quality?', a: 'No! We preserve the original resolution and quality of your images when converting to PDF.' },
              { q: 'Is my data secure?', a: 'Absolutely. All files are processed securely and automatically deleted after conversion. We never store or share your data.' }
            ].map((item, index) => (
              <div key={index} className="bg-white rounded-xl sm:rounded-2xl p-4 sm:p-6 border border-gray-200 hover:border-cyan-200 hover:shadow-md transition-all">
                <h3 className="text-sm sm:text-base font-semibold text-slate-900 mb-2 flex items-start gap-2">
                  <span className="w-5 h-5 sm:w-6 sm:h-6 bg-cyan-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-cyan-600 text-xs font-bold">?</span>
                  </span>
                  {item.q}
                </h3>
                <p className="text-xs sm:text-sm text-slate-600 pl-7 sm:pl-8">{item.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-8 sm:py-10 md:py-16 px-3 sm:px-4 md:px-6 bg-gradient-to-r from-cyan-50 via-blue-50 to-indigo-50">
        <div className="container mx-auto max-w-5xl">
          <div className="text-center mb-6 sm:mb-8 md:mb-10">
            <h2 className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold text-slate-900 mb-2">Trusted by 50,000+ Users</h2>
            <div className="flex items-center justify-center gap-1 mb-3 sm:mb-4">
              {[...Array(5)].map((_, i) => (<Star key={i} className="h-3 w-3 sm:h-4 sm:w-4 md:h-5 md:w-5 fill-yellow-400 text-yellow-400" />))}
              <span className="ml-2 text-xs sm:text-sm text-slate-600">4.9/5 rating</span>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 md:gap-6">
            {[
              { text: "Perfect for creating photo albums and portfolios. Love it!", author: "Sarah K.", role: "Photographer" },
              { text: "Great for combining scanned documents into one PDF.", author: "Mike J.", role: "Office Manager" },
              { text: "Fast, easy, and the quality is excellent. Use it all the time.", author: "Lisa T.", role: "Designer" }
            ].map((item, index) => (
              <div key={index} className="bg-white rounded-xl sm:rounded-2xl p-4 sm:p-6 border border-gray-200 shadow-sm">
                <div className="flex gap-1 mb-3">
                  {[...Array(5)].map((_, i) => (<Star key={i} className="h-3 w-3 sm:h-4 sm:w-4 fill-yellow-400 text-yellow-400" />))}
                </div>
                <p className="text-xs sm:text-sm text-slate-600 mb-3">"{item.text}"</p>
                <p className="text-xs sm:text-sm font-semibold text-slate-900">— {item.author}, <span className="font-normal text-slate-500">{item.role}</span></p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Related Tools */}
      <section className="py-10 sm:py-12 md:py-20 px-3 sm:px-4 md:px-6">
        <div className="container mx-auto max-w-5xl">
          <div className="text-center mb-6 sm:mb-8 md:mb-10">
            <h2 className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold text-slate-900 mb-2">Related PDF Tools</h2>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 sm:gap-3 md:gap-4">
            {[
              { to: '/merge-pdf', icon: Combine, title: 'Merge PDF', color: 'text-blue-600', bg: 'bg-blue-50' },
              { to: '/compress-pdf', icon: Minimize2, title: 'Compress PDF', color: 'text-orange-600', bg: 'bg-orange-50' },
              { to: '/pdf-to-word', icon: FileText, title: 'PDF to Word', color: 'text-indigo-600', bg: 'bg-indigo-50' },
              { to: '/pdf-to-excel', icon: Table2, title: 'PDF to Excel', color: 'text-emerald-600', bg: 'bg-emerald-50' }
            ].map((item, index) => (
              <Link key={index} to={item.to} className="bg-white rounded-xl p-4 sm:p-5 border-2 border-gray-100 hover:border-cyan-200 hover:shadow-lg transition-all text-center group">
                <div className={`w-10 h-10 sm:w-12 sm:h-12 ${item.bg} rounded-xl flex items-center justify-center mx-auto mb-2 sm:mb-3 group-hover:scale-110 transition-transform`}>
                  <item.icon className={`h-5 w-5 sm:h-6 sm:w-6 ${item.color}`} />
                </div>
                <span className="text-sm font-medium text-slate-700">{item.title}</span>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </div>
  )
}

export default ImageToPdf
