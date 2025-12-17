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
import { FileInput, Upload, Download, CheckCircle, FileText, Zap, Shield, Building2, GraduationCap, Briefcase, Star, RefreshCw, Sparkles, FileUp, Table2, Combine } from 'lucide-react'

const WordToPdf = () => {
  const { user, session } = useAuth()
  const { subscription, usage } = useSubscription()
  const [isDragging, setIsDragging] = useState(false)
  const [uploadedFile, setUploadedFile] = useState(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [processingProgress, setProcessingProgress] = useState(0)
  const [processingStage, setProcessingStage] = useState('')
  const [isVisible, setIsVisible] = useState(false)
  const [conversionComplete, setConversionComplete] = useState(false)

  useEffect(() => {
    setIsVisible(true)
    trackPageViewOnce(window.location.href, 'Word to PDF Converter Online Free - RobotPDF').catch(err => console.error('Failed to track:', err))
    const script = document.createElement('script')
    script.type = 'application/ld+json'
    script.text = JSON.stringify({ "@context": "https://schema.org", "@type": "SoftwareApplication", "name": "Word to PDF Converter", "applicationCategory": "BusinessApplication", "operatingSystem": "Web Browser", "offers": { "@type": "Offer", "price": "0", "priceCurrency": "USD" }, "aggregateRating": { "@type": "AggregateRating", "ratingValue": "4.9", "ratingCount": "19420" } })
    document.head.appendChild(script)
    return () => { document.head.removeChild(script) }
  }, [])

  const handleDragOver = useCallback((e) => { e.preventDefault(); setIsDragging(true) }, [])
  const handleDragLeave = useCallback((e) => { e.preventDefault(); setIsDragging(false) }, [])
  const handleDrop = useCallback((e) => {
    e.preventDefault(); setIsDragging(false)
    const files = Array.from(e.dataTransfer.files)
    const file = files[0]
    if (file && (file.name.endsWith('.doc') || file.name.endsWith('.docx'))) { setUploadedFile(file); handleConvert(file) }
    else { toast.error('Please upload a Word document (.doc or .docx)') }
  }, [])
  const handleFileSelect = (e) => {
    const file = e.target.files?.[0]
    if (file && (file.name.endsWith('.doc') || file.name.endsWith('.docx'))) { setUploadedFile(file); handleConvert(file) }
    else { toast.error('Please select a Word document') }
  }
  const resetConverter = () => { setUploadedFile(null); setIsProcessing(false); setProcessingProgress(0); setProcessingStage(''); setConversionComplete(false) }

  const handleConvert = async (file) => {
    if (!file) return
    if (user && session && usage && usage.current >= usage.limit && subscription?.plan === 'free') { toast.error('Monthly limit reached.'); return }
    setIsProcessing(true); setConversionComplete(false); setProcessingProgress(10); setProcessingStage('Uploading Word document...')
    try {
      const uploadResponse = await api.uploadFile(file)
      const fileId = uploadResponse.file.id
      setProcessingProgress(40); setProcessingStage('Processing document...')
      await new Promise(resolve => setTimeout(resolve, 400))
      setProcessingProgress(70); setProcessingStage('Converting to PDF...')
      const result = await api.convertWordToPDF(fileId, `${file.name.replace(/\.(doc|docx)$/i, '')}.pdf`)
      setProcessingProgress(90); setProcessingStage('Preparing download...')
      if (result?.file?.id) {
        const blob = await api.downloadFile(result.file.id)
        setProcessingProgress(100); setProcessingStage('Download ready!'); setConversionComplete(true)
        downloadBlob(blob, result.file.filename || `${file.name.replace(/\.(doc|docx)$/i, '')}.pdf`)
        toast.success('Word converted to PDF successfully!')
        trackToolUsage('word-to-pdf', 'Word to PDF').catch(err => console.error('Failed to track:', err))
      }
      setTimeout(() => resetConverter(), 3000)
    } catch (error) { console.error('Conversion error:', error); toast.error(error.message || 'Conversion failed.'); resetConverter() }
  }

  const features = [{ icon: FileInput, title: 'Perfect Conversion', desc: 'Exact formatting preserved' }, { icon: Zap, title: 'Lightning Fast', desc: 'Convert in seconds' }, { icon: Shield, title: '100% Secure', desc: 'Files auto-deleted' }, { icon: CheckCircle, title: 'Universal PDF', desc: 'Works everywhere' }]
  const useCases = [{ icon: Building2, title: 'Business Docs', desc: 'Share professional PDFs' }, { icon: Briefcase, title: 'Contracts', desc: 'Secure document sharing' }, { icon: GraduationCap, title: 'Academic', desc: 'Submit assignments' }, { icon: FileText, title: 'Resumes', desc: 'Professional CVs' }]


  return (
    <div className="min-h-screen bg-gradient-to-b from-white via-indigo-50/30 to-white overflow-hidden">
      <div className="fixed inset-0 overflow-hidden pointer-events-none"><div className="absolute -top-40 -left-40 w-[600px] h-[600px] bg-gradient-to-br from-indigo-100/40 to-purple-100/40 rounded-full blur-3xl"></div><div className="absolute top-40 -right-40 w-[500px] h-[500px] bg-gradient-to-br from-indigo-100/30 to-blue-100/30 rounded-full blur-3xl"></div></div>
      <section className="relative pt-8 sm:pt-12 lg:pt-16 pb-8 sm:pb-12 px-4 sm:px-6">
        <div className="container mx-auto max-w-6xl">
          <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-center">
            <div className={`text-center lg:text-left transition-all duration-700 ${isVisible ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-10'}`}>
              <Badge className="mb-4 sm:mb-6 px-3 sm:px-4 py-1.5 bg-gradient-to-r from-indigo-500 to-purple-500 text-white text-xs sm:text-sm font-semibold inline-flex items-center"><Sparkles className="h-3 w-3 sm:h-4 sm:w-4 mr-1.5" />PERFECT FORMAT • FREE</Badge>
              <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-5xl font-bold mb-4 sm:mb-6 leading-tight"><span className="bg-gradient-to-r from-slate-900 via-indigo-900 to-slate-900 bg-clip-text text-transparent">Word to PDF</span><br /><span className="bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">Converter Online</span></h1>
              <p className="text-base sm:text-lg text-slate-600 mb-6 sm:mb-8 leading-relaxed max-w-lg mx-auto lg:mx-0">Convert Word documents to PDF instantly. Perfect formatting preservation. Free, fast & secure.</p>
              <div className="flex flex-wrap items-center justify-center lg:justify-start gap-4 sm:gap-6 text-xs sm:text-sm text-slate-500 mb-6"><div className="flex items-center gap-2"><CheckCircle className="h-4 w-4 sm:h-5 sm:w-5 text-indigo-500" /><span>No registration</span></div><div className="flex items-center gap-2"><Shield className="h-4 w-4 sm:h-5 sm:w-5 text-indigo-500" /><span>Secure & Private</span></div><div className="flex items-center gap-2"><Zap className="h-4 w-4 sm:h-5 sm:w-5 text-indigo-500" /><span>Instant download</span></div></div>
            </div>
            <div className={`transition-all duration-700 delay-200 ${isVisible ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-10'}`}>
              <div onDragOver={handleDragOver} onDragLeave={handleDragLeave} onDrop={handleDrop} onClick={() => !isProcessing && document.getElementById('word-upload').click()} className={`relative bg-white rounded-2xl sm:rounded-3xl p-6 sm:p-8 lg:p-10 border-2 border-dashed transition-all duration-300 cursor-pointer shadow-xl hover:shadow-2xl ${isDragging ? 'border-indigo-500 bg-indigo-50/50 scale-[1.02]' : conversionComplete ? 'border-indigo-400 bg-indigo-50/30' : 'border-indigo-200 hover:border-indigo-400'} ${isProcessing ? 'pointer-events-none' : ''}`}>
                <input id="word-upload" type="file" accept=".doc,.docx" onChange={handleFileSelect} className="hidden" disabled={isProcessing} />
                {isProcessing ? (<div className="text-center py-4"><div className="relative w-20 h-20 sm:w-24 sm:h-24 mx-auto mb-4 sm:mb-6"><svg className="w-full h-full transform -rotate-90"><circle cx="50%" cy="50%" r="45%" stroke="#e5e7eb" strokeWidth="8" fill="none" /><circle cx="50%" cy="50%" r="45%" stroke="url(#gradientWordPdf)" strokeWidth="8" fill="none" strokeLinecap="round" strokeDasharray={`${processingProgress * 2.83} 283`} className="transition-all duration-500" /><defs><linearGradient id="gradientWordPdf" x1="0%" y1="0%" x2="100%" y2="0%"><stop offset="0%" stopColor="#6366f1" /><stop offset="100%" stopColor="#a855f7" /></linearGradient></defs></svg><div className="absolute inset-0 flex items-center justify-center"><span className="text-lg sm:text-xl font-bold text-indigo-600">{processingProgress}%</span></div></div><p className="text-base sm:text-lg font-semibold text-slate-800 mb-2">{processingStage}</p><p className="text-sm text-slate-500">{uploadedFile?.name}</p><div className="flex justify-center gap-1 mt-4">{[1, 2, 3, 4, 5].map((step) => (<div key={step} className={`w-2 h-2 rounded-full transition-all duration-300 ${processingProgress >= step * 20 ? 'bg-indigo-500' : processingProgress >= (step - 1) * 20 ? 'bg-indigo-300 animate-pulse' : 'bg-gray-200'}`} />))}</div><p className="text-xs text-slate-400 mt-2">{processingProgress < 25 ? 'Uploading...' : processingProgress < 50 ? 'Processing...' : processingProgress < 75 ? 'Converting...' : processingProgress < 90 ? 'Finalizing...' : 'Complete!'}</p></div>
                ) : conversionComplete ? (<div className="text-center py-4"><div className="w-16 h-16 sm:w-20 sm:h-20 mx-auto mb-4 bg-indigo-100 rounded-full flex items-center justify-center"><CheckCircle className="h-8 w-8 sm:h-10 sm:w-10 text-indigo-600" /></div><p className="text-lg sm:text-xl font-semibold text-indigo-700 mb-2">Conversion Complete!</p><p className="text-sm text-slate-500 mb-4">Your PDF has been downloaded</p><Button onClick={(e) => { e.stopPropagation(); resetConverter(); }} variant="outline" className="border-indigo-300 text-indigo-700 hover:bg-indigo-50"><RefreshCw className="h-4 w-4 mr-2" /> Convert Another</Button></div>
                ) : (<div className="text-center"><div className="w-16 h-16 sm:w-20 sm:h-20 mx-auto mb-4 sm:mb-6 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg"><FileUp className="h-8 w-8 sm:h-10 sm:w-10 text-white" /></div><h3 className="text-lg sm:text-xl font-semibold text-slate-800 mb-2">Drop your Word file here</h3><p className="text-sm sm:text-base text-slate-500 mb-4 sm:mb-6">or click to browse files</p><Button size="lg" className="w-full sm:w-auto px-6 sm:px-8 py-3 sm:py-4 text-base font-semibold bg-gradient-to-r from-indigo-600 to-purple-600 text-white hover:shadow-lg transition-all rounded-xl"><Upload className="mr-2 h-4 w-4 sm:h-5 sm:w-5" /> Select Word File</Button><p className="text-xs sm:text-sm text-slate-400 mt-4">Supports .doc & .docx • Max 100MB</p></div>)}
              </div>
            </div>
          </div>
        </div>
      </section>
      <section className="py-10 sm:py-16 px-4 sm:px-6 bg-gradient-to-r from-indigo-50 via-purple-50 to-pink-50"><div className="container mx-auto max-w-6xl"><div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">{features.map((feature, index) => (<div key={index} className="text-center"><div className="inline-flex items-center justify-center w-12 h-12 sm:w-14 sm:h-14 bg-white rounded-xl sm:rounded-2xl shadow-md mb-3 sm:mb-4"><feature.icon className="h-5 w-5 sm:h-6 sm:w-6 text-indigo-600" /></div><div className="text-sm sm:text-base font-semibold text-slate-900">{feature.title}</div><div className="text-xs sm:text-sm text-slate-500">{feature.desc}</div></div>))}</div></div></section>
      <section className="py-12 sm:py-20 px-4 sm:px-6"><div className="container mx-auto max-w-5xl"><div className="text-center mb-8 sm:mb-12"><Badge className="mb-3 sm:mb-4 px-3 sm:px-4 py-1.5 bg-gradient-to-r from-indigo-100 to-purple-100 text-indigo-700 text-xs sm:text-sm font-semibold">SIMPLE PROCESS</Badge><h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-slate-900">How to Convert Word to PDF</h2></div><div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">{[{ step: '1', title: 'Upload Word', desc: 'Drag & drop or click to upload your Word document', icon: Upload },{ step: '2', title: 'Auto Convert', desc: 'We convert your document preserving all formatting', icon: Sparkles },{ step: '3', title: 'Download PDF', desc: 'Get your professional PDF file instantly', icon: Download }].map((item, index) => (<div key={index} className="relative bg-white rounded-xl sm:rounded-2xl p-5 sm:p-6 border-2 border-indigo-100 hover:border-indigo-300 hover:shadow-xl transition-all group"><div className="absolute -top-3 -left-3 w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold shadow-lg">{item.step}</div><div className="w-12 h-12 sm:w-14 sm:h-14 bg-indigo-50 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform"><item.icon className="h-5 w-5 sm:h-6 sm:w-6 text-indigo-600" /></div><h3 className="text-base sm:text-lg font-semibold text-slate-900 mb-2">{item.title}</h3><p className="text-sm text-slate-600">{item.desc}</p></div>))}</div></div></section>
      <section className="py-12 sm:py-20 px-4 sm:px-6 bg-gradient-to-b from-slate-50 to-white"><div className="container mx-auto max-w-5xl"><div className="text-center mb-8 sm:mb-12"><h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-slate-900">Perfect for Every Use Case</h2></div><div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">{useCases.map((item, index) => (<div key={index} className="bg-white rounded-xl sm:rounded-2xl p-4 sm:p-6 border-2 border-gray-100 hover:border-indigo-200 hover:shadow-lg transition-all text-center group"><div className="w-12 h-12 sm:w-14 sm:h-14 bg-indigo-50 rounded-xl flex items-center justify-center mx-auto mb-3 sm:mb-4 group-hover:scale-110 transition-transform"><item.icon className="h-5 w-5 sm:h-6 sm:w-6 text-indigo-600" /></div><h3 className="text-sm sm:text-base font-semibold text-slate-900 mb-1">{item.title}</h3><p className="text-xs sm:text-sm text-slate-500">{item.desc}</p></div>))}</div></div></section>
      <section className="py-12 sm:py-20 px-4 sm:px-6"><div className="container mx-auto max-w-4xl"><div className="text-center mb-8 sm:mb-12"><Badge className="mb-3 sm:mb-4 px-3 sm:px-4 py-1.5 bg-gradient-to-r from-indigo-100 to-purple-100 text-indigo-700 text-xs sm:text-sm font-semibold">FAQ</Badge><h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-slate-900 mb-3">Frequently Asked Questions</h2></div><div className="space-y-3 sm:space-y-4">{[{ q: 'How do I convert Word to PDF for free?', a: 'Upload your Word document above and we\'ll convert it to PDF instantly. No registration required.' },{ q: 'Will my formatting be preserved?', a: 'Yes! Fonts, images, tables, and layout are preserved exactly as in your original document.' },{ q: 'What Word formats are supported?', a: 'We support both .doc and .docx formats from all versions of Microsoft Word.' }].map((item, index) => (<div key={index} className="bg-white rounded-xl sm:rounded-2xl p-4 sm:p-6 border border-gray-200 hover:border-indigo-200 hover:shadow-md transition-all"><h3 className="text-sm sm:text-base font-semibold text-slate-900 mb-2 flex items-start gap-2"><span className="w-5 h-5 sm:w-6 sm:h-6 bg-indigo-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5"><span className="text-indigo-600 text-xs font-bold">?</span></span>{item.q}</h3><p className="text-xs sm:text-sm text-slate-600 pl-7 sm:pl-8">{item.a}</p></div>))}</div></div></section>
      <section className="py-10 sm:py-16 px-4 sm:px-6 bg-gradient-to-r from-indigo-50 via-purple-50 to-pink-50"><div className="container mx-auto max-w-5xl"><div className="text-center mb-8 sm:mb-10"><h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-slate-900 mb-2">Trusted by 50,000+ Users</h2><div className="flex items-center justify-center gap-1 mb-4">{[...Array(5)].map((_, i) => (<Star key={i} className="h-4 w-4 sm:h-5 sm:w-5 fill-yellow-400 text-yellow-400" />))}<span className="ml-2 text-sm text-slate-600">4.9/5 rating</span></div></div><div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">{[{ text: "Perfect conversion every time. My go-to tool!", author: "Rachel T.", role: "HR Manager" },{ text: "Formatting stays intact. Exactly what I needed.", author: "Mark S.", role: "Consultant" },{ text: "Fast and reliable. Use it for all my documents.", author: "Jenny L.", role: "Admin" }].map((item, index) => (<div key={index} className="bg-white rounded-xl sm:rounded-2xl p-4 sm:p-6 border border-gray-200 shadow-sm"><div className="flex gap-1 mb-3">{[...Array(5)].map((_, i) => (<Star key={i} className="h-3 w-3 sm:h-4 sm:w-4 fill-yellow-400 text-yellow-400" />))}</div><p className="text-xs sm:text-sm text-slate-600 mb-3">"{item.text}"</p><p className="text-xs sm:text-sm font-semibold text-slate-900">— {item.author}, <span className="font-normal text-slate-500">{item.role}</span></p></div>))}</div></div></section>
      <section className="py-12 sm:py-20 px-4 sm:px-6"><div className="container mx-auto max-w-5xl"><div className="text-center mb-8 sm:mb-10"><h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-slate-900 mb-2">Related PDF Tools</h2></div><div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">{[{ to: '/pdf-to-word', icon: FileText, title: 'PDF to Word', color: 'text-blue-600', bg: 'bg-blue-50' },{ to: '/excel-to-pdf', icon: Table2, title: 'Excel to PDF', color: 'text-green-600', bg: 'bg-green-50' },{ to: '/merge-pdf', icon: Combine, title: 'Merge PDF', color: 'text-blue-600', bg: 'bg-blue-50' },{ to: '/pdf-to-excel', icon: Table2, title: 'PDF to Excel', color: 'text-emerald-600', bg: 'bg-emerald-50' }].map((item, index) => (<Link key={index} to={item.to} className="bg-white rounded-xl p-4 sm:p-5 border-2 border-gray-100 hover:border-indigo-200 hover:shadow-lg transition-all text-center group"><div className={`w-10 h-10 sm:w-12 sm:h-12 ${item.bg} rounded-xl flex items-center justify-center mx-auto mb-2 sm:mb-3 group-hover:scale-110 transition-transform`}><item.icon className={`h-5 w-5 sm:h-6 sm:w-6 ${item.color}`} /></div><span className="text-sm font-medium text-slate-700">{item.title}</span></Link>))}</div></div></section>
    </div>
  )
}

export default WordToPdf
