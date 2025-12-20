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
import { Minimize2, Upload, Download, CheckCircle, FileText, Zap, Shield, Building2, GraduationCap, Briefcase, Star, RefreshCw, Sparkles, FileUp, Table2, Combine, Scissors } from 'lucide-react'

const CompressPdf = () => {
  const { user, session } = useAuth()
  const { subscription, usage } = useSubscription()
  const [isDragging, setIsDragging] = useState(false)
  const [uploadedFile, setUploadedFile] = useState(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [processingProgress, setProcessingProgress] = useState(0)
  const [processingStage, setProcessingStage] = useState('')
  const [isVisible, setIsVisible] = useState(false)
  const [conversionComplete, setConversionComplete] = useState(false)
  const [compressionResult, setCompressionResult] = useState(null)

  useEffect(() => {
    setIsVisible(true)
    trackPageViewOnce(window.location.href, 'Compress PDF Online Free - RobotPDF').catch(err => console.error('Failed to track:', err))
    const script = document.createElement('script')
    script.type = 'application/ld+json'
    script.text = JSON.stringify({
      "@context": "https://schema.org", "@type": "SoftwareApplication", "name": "Compress PDF Online Free",
      "applicationCategory": "BusinessApplication", "operatingSystem": "Web Browser",
      "offers": { "@type": "Offer", "price": "0", "priceCurrency": "USD" },
      "aggregateRating": { "@type": "AggregateRating", "ratingValue": "4.9", "ratingCount": "21650" }
    })
    document.head.appendChild(script)
    return () => { document.head.removeChild(script) }
  }, [])

  const handleDragOver = useCallback((e) => { e.preventDefault(); setIsDragging(true) }, [])
  const handleDragLeave = useCallback((e) => { e.preventDefault(); setIsDragging(false) }, [])
  const handleDrop = useCallback((e) => {
    e.preventDefault(); setIsDragging(false)
    const files = Array.from(e.dataTransfer.files)
    if (files.length > 0 && files[0].type === 'application/pdf') { setUploadedFile(files[0]); handleCompress(files[0]) }
    else { toast.error('Please upload a PDF file') }
  }, [])
  const handleFileSelect = (e) => {
    const file = e.target.files?.[0]
    if (file && file.type === 'application/pdf') { setUploadedFile(file); handleCompress(file) } else { toast.error('Please select a PDF file') }
  }
  const resetConverter = () => { setUploadedFile(null); setIsProcessing(false); setProcessingProgress(0); setProcessingStage(''); setConversionComplete(false); setCompressionResult(null) }


  const handleCompress = async (file) => {
    if (!file) return
    if (user && session && usage && usage.current >= usage.limit && subscription?.plan === 'free') { toast.error('Monthly limit reached.'); return }
    setIsProcessing(true); setConversionComplete(false); setProcessingProgress(10); setProcessingStage('Uploading PDF...')
    try {
      const uploadResponse = await api.uploadFile(file)
      const fileId = uploadResponse.file.id
      setProcessingProgress(40); setProcessingStage('Analyzing file content...')
      await new Promise(resolve => setTimeout(resolve, 500))
      setProcessingProgress(60); setProcessingStage('Compressing PDF...')
      const result = await api.compressPDF(fileId, 0.5, `compressed-${Date.now()}.pdf`)
      setProcessingProgress(90); setProcessingStage('Preparing download...')
      if (result?.file?.id) {
        const blob = await api.downloadFile(result.file.id)
        setProcessingProgress(100); setProcessingStage('Download ready!'); setConversionComplete(true)
        setCompressionResult({ originalSize: file.size, compressedSize: blob.size, savings: Math.round((1 - blob.size / file.size) * 100) })
        downloadBlob(blob, result.file.filename || 'compressed.pdf')
        toast.success('PDF compressed successfully!')
        trackToolUsage('compress-pdf', 'Compress PDF').catch(err => console.error('Failed to track:', err))
      }
      setTimeout(() => resetConverter(), 5000)
    } catch (error) {
      console.error('Compression error:', error)
      if (error.message.includes('already optimized')) { toast.error('This PDF is already optimized.') }
      else { toast.error(error.message || 'Compression failed.') }
      resetConverter()
    }
  }

  const features = [
    { icon: Minimize2, title: 'Up to 90% Smaller', desc: 'Massive file reduction' },
    { icon: Zap, title: 'Lightning Fast', desc: 'Compress in seconds' },
    { icon: Shield, title: '100% Secure', desc: 'Files auto-deleted' },
    { icon: CheckCircle, title: 'Quality Preserved', desc: 'Readable text & images' },
  ]
  const useCases = [
    { icon: Building2, title: 'Email Attachments', desc: 'Fit size limits easily' },
    { icon: Briefcase, title: 'Web Upload', desc: 'Faster uploads' },
    { icon: GraduationCap, title: 'Storage Savings', desc: 'Save disk space' },
    { icon: FileText, title: 'Share Faster', desc: 'Quick file sharing' },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-b from-white via-orange-50/30 to-white overflow-hidden">
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -left-40 w-[600px] h-[600px] bg-gradient-to-br from-orange-100/40 to-amber-100/40 rounded-full blur-3xl"></div>
        <div className="absolute top-40 -right-40 w-[500px] h-[500px] bg-gradient-to-br from-orange-100/30 to-yellow-100/30 rounded-full blur-3xl"></div>
      </div>
      <section className="relative pt-6 sm:pt-8 md:pt-12 lg:pt-16 pb-6 sm:pb-8 md:pb-12 px-3 sm:px-4 md:px-6">
        <div className="container mx-auto max-w-6xl">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8 lg:gap-12 items-center">
            <div className={`text-center lg:text-left transition-all duration-700 ${isVisible ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-10'}`}>
              <Badge className="mb-4 sm:mb-6 px-3 sm:px-4 py-1.5 bg-gradient-to-r from-orange-500 to-amber-500 text-white text-xs sm:text-sm font-semibold inline-flex items-center"><Sparkles className="h-3 w-3 sm:h-4 sm:w-4 mr-1.5" />UP TO 90% SMALLER • FREE</Badge>
              <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-5xl font-bold mb-4 sm:mb-6 leading-tight">
                <span className="bg-gradient-to-r from-slate-900 via-orange-900 to-slate-900 bg-clip-text text-transparent">Compress PDF</span><br />
                <span className="bg-gradient-to-r from-orange-600 to-amber-600 bg-clip-text text-transparent">Files Online Free</span>
              </h1>
              <p className="text-base sm:text-lg text-slate-600 mb-6 sm:mb-8 leading-relaxed max-w-lg mx-auto lg:mx-0">Reduce PDF file size by up to 90% while maintaining quality. Perfect for email attachments and web uploads. Free, fast & secure.</p>
              <div className="flex flex-wrap items-center justify-center lg:justify-start gap-4 sm:gap-6 text-xs sm:text-sm text-slate-500 mb-6">
                <div className="flex items-center gap-2"><CheckCircle className="h-4 w-4 sm:h-5 sm:w-5 text-orange-500" /><span>No registration</span></div>
                <div className="flex items-center gap-2"><Shield className="h-4 w-4 sm:h-5 sm:w-5 text-orange-500" /><span>Secure & Private</span></div>
                <div className="flex items-center gap-2"><Zap className="h-4 w-4 sm:h-5 sm:w-5 text-orange-500" /><span>Instant download</span></div>
              </div>
            </div>
            <div className={`transition-all duration-700 delay-200 ${isVisible ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-10'}`}>
              <div onDragOver={handleDragOver} onDragLeave={handleDragLeave} onDrop={handleDrop} onClick={() => !isProcessing && document.getElementById('pdf-upload').click()}
                className={`relative bg-white rounded-2xl sm:rounded-3xl p-6 sm:p-8 lg:p-10 border-2 border-dashed transition-all duration-300 cursor-pointer shadow-xl hover:shadow-2xl ${isDragging ? 'border-orange-500 bg-orange-50/50 scale-[1.02]' : conversionComplete ? 'border-orange-400 bg-orange-50/30' : 'border-orange-200 hover:border-orange-400'} ${isProcessing ? 'pointer-events-none' : ''}`}>
                <input id="pdf-upload" type="file" accept=".pdf" onChange={handleFileSelect} className="hidden" disabled={isProcessing} />
                {isProcessing ? (
                  <div className="text-center py-4">
                    <div className="relative w-20 h-20 sm:w-24 sm:h-24 mx-auto mb-4 sm:mb-6">
                      <svg className="w-full h-full transform -rotate-90"><circle cx="50%" cy="50%" r="45%" stroke="#e5e7eb" strokeWidth="8" fill="none" /><circle cx="50%" cy="50%" r="45%" stroke="url(#gradientCompress)" strokeWidth="8" fill="none" strokeLinecap="round" strokeDasharray={`${processingProgress * 2.83} 283`} className="transition-all duration-500" /><defs><linearGradient id="gradientCompress" x1="0%" y1="0%" x2="100%" y2="0%"><stop offset="0%" stopColor="#f97316" /><stop offset="100%" stopColor="#f59e0b" /></linearGradient></defs></svg>
                      <div className="absolute inset-0 flex items-center justify-center"><span className="text-lg sm:text-xl font-bold text-orange-600">{processingProgress}%</span></div>
                    </div>
                    <p className="text-base sm:text-lg font-semibold text-slate-800 mb-2">{processingStage}</p>
                    <p className="text-sm text-slate-500">{uploadedFile?.name}</p>
                    <div className="flex justify-center gap-1 mt-4">
                      {[1, 2, 3, 4, 5].map((step) => (
                        <div key={step} className={`w-2 h-2 rounded-full transition-all duration-300 ${processingProgress >= step * 20 ? 'bg-orange-500' : processingProgress >= (step - 1) * 20 ? 'bg-orange-300 animate-pulse' : 'bg-gray-200'}`} />
                      ))}
                    </div>
                    <p className="text-xs text-slate-400 mt-2">{processingProgress < 25 ? 'Uploading...' : processingProgress < 50 ? 'Analyzing...' : processingProgress < 75 ? 'Compressing...' : processingProgress < 90 ? 'Finalizing...' : 'Complete!'}</p>
                  </div>
                ) : conversionComplete ? (
                  <div className="text-center py-4">
                    <div className="w-16 h-16 sm:w-20 sm:h-20 mx-auto mb-4 bg-orange-100 rounded-full flex items-center justify-center"><CheckCircle className="h-8 w-8 sm:h-10 sm:w-10 text-orange-600" /></div>
                    <p className="text-lg sm:text-xl font-semibold text-orange-700 mb-2">Compression Complete!</p>
                    {compressionResult && (<div className="bg-orange-50 rounded-lg p-3 mb-4"><p className="text-sm text-slate-600"><span className="font-semibold text-orange-600">{compressionResult.savings}% smaller</span><br />{(compressionResult.originalSize / 1024 / 1024).toFixed(2)}MB → {(compressionResult.compressedSize / 1024 / 1024).toFixed(2)}MB</p></div>)}
                    <Button onClick={(e) => { e.stopPropagation(); resetConverter(); }} variant="outline" className="border-orange-300 text-orange-700 hover:bg-orange-50"><RefreshCw className="h-4 w-4 mr-2" /> Compress Another</Button>
                  </div>
                ) : (
                  <div className="text-center">
                    <div className="w-16 h-16 sm:w-20 sm:h-20 mx-auto mb-4 sm:mb-6 bg-gradient-to-br from-orange-500 to-amber-600 rounded-2xl flex items-center justify-center shadow-lg"><FileUp className="h-8 w-8 sm:h-10 sm:w-10 text-white" /></div>
                    <h3 className="text-lg sm:text-xl font-semibold text-slate-800 mb-2">Drop your PDF here</h3>
                    <p className="text-sm sm:text-base text-slate-500 mb-4 sm:mb-6">or click to browse files</p>
                    <Button size="lg" className="w-full sm:w-auto px-6 sm:px-8 py-3 sm:py-4 text-base font-semibold bg-gradient-to-r from-orange-600 to-amber-600 text-white hover:shadow-lg transition-all rounded-xl"><Upload className="mr-2 h-4 w-4 sm:h-5 sm:w-5" /> Select PDF File</Button>
                    <p className="text-xs sm:text-sm text-slate-400 mt-4">Max 100MB • Secure & Private</p>
                  </div>
                )}
              </div>
            </div>
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

      <section className="py-10 sm:py-16 px-4 sm:px-6 bg-gradient-to-r from-orange-50 via-amber-50 to-yellow-50">
        <div className="container mx-auto max-w-6xl">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
            {features.map((feature, index) => (<div key={index} className="text-center"><div className="inline-flex items-center justify-center w-12 h-12 sm:w-14 sm:h-14 bg-white rounded-xl sm:rounded-2xl shadow-md mb-3 sm:mb-4"><feature.icon className="h-5 w-5 sm:h-6 sm:w-6 text-orange-600" /></div><div className="text-sm sm:text-base font-semibold text-slate-900">{feature.title}</div><div className="text-xs sm:text-sm text-slate-500">{feature.desc}</div></div>))}
          </div>
        </div>
      </section>
      <section className="py-12 sm:py-20 px-4 sm:px-6">
        <div className="container mx-auto max-w-5xl">
          <div className="text-center mb-8 sm:mb-12"><Badge className="mb-3 sm:mb-4 px-3 sm:px-4 py-1.5 bg-gradient-to-r from-orange-100 to-amber-100 text-orange-700 text-xs sm:text-sm font-semibold">SIMPLE PROCESS</Badge><h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-slate-900">How to Compress PDF Files</h2></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
            {[{ step: '1', title: 'Upload PDF', desc: 'Drag & drop or click to upload your PDF file', icon: Upload },{ step: '2', title: 'Auto Compress', desc: 'Our AI optimizes images and removes redundant data', icon: Minimize2 },{ step: '3', title: 'Download', desc: 'Get your compressed PDF with quality preserved', icon: Download }].map((item, index) => (
              <div key={index} className="relative bg-white rounded-xl sm:rounded-2xl p-5 sm:p-6 border-2 border-orange-100 hover:border-orange-300 hover:shadow-xl transition-all group"><div className="absolute -top-3 -left-3 w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-orange-500 to-amber-600 rounded-full flex items-center justify-center text-white font-bold shadow-lg">{item.step}</div><div className="w-12 h-12 sm:w-14 sm:h-14 bg-orange-50 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform"><item.icon className="h-5 w-5 sm:h-6 sm:w-6 text-orange-600" /></div><h3 className="text-base sm:text-lg font-semibold text-slate-900 mb-2">{item.title}</h3><p className="text-sm text-slate-600">{item.desc}</p></div>
            ))}
          </div>
        </div>
      </section>
      <section className="py-10 sm:py-12 md:py-20 px-3 sm:px-4 md:px-6 bg-gradient-to-b from-slate-50 to-white">
        <div className="container mx-auto max-w-5xl"><div className="text-center mb-6 sm:mb-8 md:mb-12"><h2 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold text-slate-900">Perfect for Every Use Case</h2></div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-6">{useCases.map((item, index) => (<div key={index} className="bg-white rounded-lg sm:rounded-xl md:rounded-2xl p-3 sm:p-4 md:p-6 border-2 border-gray-100 hover:border-orange-200 hover:shadow-lg transition-all text-center group"><div className="w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 bg-orange-50 rounded-lg sm:rounded-xl flex items-center justify-center mx-auto mb-2 sm:mb-3 md:mb-4 group-hover:scale-110 transition-transform"><item.icon className="h-4 w-4 sm:h-5 sm:w-5 md:h-6 md:w-6 text-orange-600" /></div><h3 className="text-xs sm:text-sm md:text-base font-semibold text-slate-900 mb-1">{item.title}</h3><p className="text-[10px] sm:text-xs md:text-sm text-slate-500">{item.desc}</p></div>))}</div>
        </div>
      </section>
      <section className="py-10 sm:py-12 md:py-20 px-3 sm:px-4 md:px-6">
        <div className="container mx-auto max-w-4xl"><div className="text-center mb-6 sm:mb-8 md:mb-12"><Badge className="mb-2 sm:mb-3 md:mb-4 px-3 sm:px-4 py-1.5 bg-gradient-to-r from-orange-100 to-amber-100 text-orange-700 text-xs sm:text-sm font-semibold">FAQ</Badge><h2 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold text-slate-900 mb-2 sm:mb-3">Frequently Asked Questions</h2></div>
          <div className="space-y-2 sm:space-y-3 md:space-y-4">
            {[{ q: 'How much can I compress a PDF?', a: 'Our compressor can reduce PDF file size by up to 90%, depending on the content. PDFs with many images see the biggest reductions.' },{ q: 'Will compression affect PDF quality?', a: 'We use smart compression that maintains readable text and clear images. The quality remains suitable for most purposes.' },{ q: 'Is the PDF compressor free?', a: 'Yes! Our PDF compressor is completely free with no registration required.' }].map((item, index) => (
              <div key={index} className="bg-white rounded-xl sm:rounded-2xl p-4 sm:p-6 border border-gray-200 hover:border-orange-200 hover:shadow-md transition-all"><h3 className="text-sm sm:text-base font-semibold text-slate-900 mb-2 flex items-start gap-2"><span className="w-5 h-5 sm:w-6 sm:h-6 bg-orange-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5"><span className="text-orange-600 text-xs font-bold">?</span></span>{item.q}</h3><p className="text-xs sm:text-sm text-slate-600 pl-7 sm:pl-8">{item.a}</p></div>
            ))}
          </div>
        </div>
      </section>
      <section className="py-8 sm:py-10 md:py-16 px-3 sm:px-4 md:px-6 bg-gradient-to-r from-orange-50 via-amber-50 to-yellow-50">
        <div className="container mx-auto max-w-5xl"><div className="text-center mb-6 sm:mb-8 md:mb-10"><h2 className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold text-slate-900 mb-2">Trusted by 50,000+ Users</h2><div className="flex items-center justify-center gap-1 mb-3 sm:mb-4">{[...Array(5)].map((_, i) => (<Star key={i} className="h-3 w-3 sm:h-4 sm:w-4 md:h-5 md:w-5 fill-yellow-400 text-yellow-400" />))}<span className="ml-2 text-xs sm:text-sm text-slate-600">4.9/5 rating</span></div></div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 md:gap-6">{[{ text: "Reduced my 50MB PDF to 5MB! Amazing compression.", author: "John D.", role: "Marketer" },{ text: "Finally can email large PDFs without issues.", author: "Sarah K.", role: "Sales Rep" },{ text: "Quality stays great even after compression.", author: "Mike R.", role: "Designer" }].map((item, index) => (<div key={index} className="bg-white rounded-lg sm:rounded-xl md:rounded-2xl p-3 sm:p-4 md:p-6 border border-gray-200 shadow-sm"><div className="flex gap-1 mb-2 sm:mb-3">{[...Array(5)].map((_, i) => (<Star key={i} className="h-3 w-3 sm:h-4 sm:w-4 fill-yellow-400 text-yellow-400" />))}</div><p className="text-[10px] sm:text-xs md:text-sm text-slate-600 mb-2 sm:mb-3">"{item.text}"</p><p className="text-[10px] sm:text-xs md:text-sm font-semibold text-slate-900">— {item.author}, <span className="font-normal text-slate-500">{item.role}</span></p></div>))}</div>
        </div>
      </section>
      <section className="py-10 sm:py-12 md:py-20 px-3 sm:px-4 md:px-6">
        <div className="container mx-auto max-w-5xl"><div className="text-center mb-6 sm:mb-8 md:mb-10"><h2 className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold text-slate-900 mb-2">Related PDF Tools</h2></div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 sm:gap-3 md:gap-4">{[{ to: '/merge-pdf', icon: Combine, title: 'Merge PDF', color: 'text-blue-600', bg: 'bg-blue-50' },{ to: '/split-pdf', icon: Scissors, title: 'Split PDF', color: 'text-emerald-600', bg: 'bg-emerald-50' },{ to: '/pdf-to-word', icon: FileText, title: 'PDF to Word', color: 'text-indigo-600', bg: 'bg-indigo-50' },{ to: '/pdf-to-excel', icon: Table2, title: 'PDF to Excel', color: 'text-green-600', bg: 'bg-green-50' }].map((item, index) => (<Link key={index} to={item.to} className="bg-white rounded-lg sm:rounded-xl p-3 sm:p-4 md:p-5 border-2 border-gray-100 hover:border-orange-200 hover:shadow-lg transition-all text-center group"><div className={`w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 ${item.bg} rounded-lg sm:rounded-xl flex items-center justify-center mx-auto mb-1.5 sm:mb-2 md:mb-3 group-hover:scale-110 transition-transform`}><item.icon className={`h-4 w-4 sm:h-5 sm:w-5 md:h-6 md:w-6 ${item.color}`} /></div><span className="text-xs sm:text-sm font-medium text-slate-700">{item.title}</span></Link>))}</div>
        </div>
      </section>
    </div>
  )
}

export default CompressPdf
