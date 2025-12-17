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
import { Sheet, Upload, Download, CheckCircle, FileText, Zap, Shield, Building2, GraduationCap, Briefcase, Star, RefreshCw, Sparkles, FileUp, Table2, Combine } from 'lucide-react'

const ExcelToPdf = () => {
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
    trackPageViewOnce(window.location.href, 'Excel to PDF Converter Online Free - RobotPDF').catch(err => console.error('Failed to track:', err))
    const script = document.createElement('script')
    script.type = 'application/ld+json'
    script.text = JSON.stringify({ "@context": "https://schema.org", "@type": "SoftwareApplication", "name": "Excel to PDF Converter", "applicationCategory": "BusinessApplication", "operatingSystem": "Web Browser", "offers": { "@type": "Offer", "price": "0", "priceCurrency": "USD" }, "aggregateRating": { "@type": "AggregateRating", "ratingValue": "4.8", "ratingCount": "16320" } })
    document.head.appendChild(script)
    return () => { document.head.removeChild(script) }
  }, [])

  const handleDragOver = useCallback((e) => { e.preventDefault(); setIsDragging(true) }, [])
  const handleDragLeave = useCallback((e) => { e.preventDefault(); setIsDragging(false) }, [])
  const handleDrop = useCallback((e) => {
    e.preventDefault(); setIsDragging(false)
    const file = Array.from(e.dataTransfer.files)[0]
    if (file && (file.name.endsWith('.xls') || file.name.endsWith('.xlsx'))) { setUploadedFile(file); handleConvert(file) }
    else { toast.error('Please upload an Excel file (.xls or .xlsx)') }
  }, [])
  const handleFileSelect = (e) => {
    const file = e.target.files?.[0]
    if (file && (file.name.endsWith('.xls') || file.name.endsWith('.xlsx'))) { setUploadedFile(file); handleConvert(file) }
    else { toast.error('Please select an Excel file') }
  }
  const resetConverter = () => { setUploadedFile(null); setIsProcessing(false); setProcessingProgress(0); setProcessingStage(''); setConversionComplete(false) }

  const handleConvert = async (file) => {
    if (!file) return
    if (user && session && usage && usage.current >= usage.limit && subscription?.plan === 'free') { toast.error('Monthly limit reached.'); return }
    setIsProcessing(true); setConversionComplete(false); setProcessingProgress(10); setProcessingStage('Uploading Excel file...')
    try {
      const uploadResponse = await api.uploadFile(file)
      const fileId = uploadResponse.file.id
      setProcessingProgress(40); setProcessingStage('Processing spreadsheet...')
      await new Promise(resolve => setTimeout(resolve, 400))
      setProcessingProgress(70); setProcessingStage('Converting to PDF...')
      const result = await api.convertExcelToPDF(fileId, `${file.name.replace(/\.(xls|xlsx)$/i, '')}.pdf`)
      setProcessingProgress(90); setProcessingStage('Preparing download...')
      if (result?.file?.id) {
        const blob = await api.downloadFile(result.file.id)
        setProcessingProgress(100); setProcessingStage('Download ready!'); setConversionComplete(true)
        downloadBlob(blob, result.file.filename || `${file.name.replace(/\.(xls|xlsx)$/i, '')}.pdf`)
        toast.success('Excel converted to PDF successfully!')
        trackToolUsage('excel-to-pdf', 'Excel to PDF').catch(err => console.error('Failed to track:', err))
      }
      setTimeout(() => resetConverter(), 3000)
    } catch (error) { console.error('Conversion error:', error); toast.error(error.message || 'Conversion failed.'); resetConverter() }
  }

  const features = [{ icon: Sheet, title: 'Tables Preserved', desc: 'Perfect table formatting' }, { icon: Zap, title: 'Lightning Fast', desc: 'Convert in seconds' }, { icon: Shield, title: '100% Secure', desc: 'Files auto-deleted' }, { icon: CheckCircle, title: 'All Sheets', desc: 'Convert all worksheets' }]
  const useCases = [{ icon: Building2, title: 'Financial Reports', desc: 'Share spreadsheets as PDF' }, { icon: Briefcase, title: 'Invoices', desc: 'Professional billing docs' }, { icon: GraduationCap, title: 'Data Analysis', desc: 'Share research data' }, { icon: FileText, title: 'Budgets', desc: 'Distribute budget plans' }]


  return (
    <div className="min-h-screen bg-gradient-to-b from-white via-green-50/30 to-white overflow-hidden">
      <div className="fixed inset-0 overflow-hidden pointer-events-none"><div className="absolute -top-40 -left-40 w-[600px] h-[600px] bg-gradient-to-br from-green-100/40 to-emerald-100/40 rounded-full blur-3xl"></div><div className="absolute top-40 -right-40 w-[500px] h-[500px] bg-gradient-to-br from-green-100/30 to-teal-100/30 rounded-full blur-3xl"></div></div>
      <section className="relative pt-6 sm:pt-8 md:pt-12 lg:pt-16 pb-6 sm:pb-8 md:pb-12 px-3 sm:px-4 md:px-6">
        <div className="container mx-auto max-w-6xl">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8 lg:gap-12 items-center">
            <div className={`text-center lg:text-left transition-all duration-700 ${isVisible ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-10'}`}>
              <Badge className="mb-4 sm:mb-6 px-3 sm:px-4 py-1.5 bg-gradient-to-r from-green-500 to-emerald-500 text-white text-xs sm:text-sm font-semibold inline-flex items-center"><Sparkles className="h-3 w-3 sm:h-4 sm:w-4 mr-1.5" />TABLES PRESERVED • FREE</Badge>
              <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-5xl font-bold mb-4 sm:mb-6 leading-tight"><span className="bg-gradient-to-r from-slate-900 via-green-900 to-slate-900 bg-clip-text text-transparent">Excel to PDF</span><br /><span className="bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">Converter Online</span></h1>
              <p className="text-base sm:text-lg text-slate-600 mb-6 sm:mb-8 leading-relaxed max-w-lg mx-auto lg:mx-0">Convert Excel spreadsheets to PDF instantly. Perfect table formatting preserved. Free, fast & secure.</p>
              <div className="flex flex-wrap items-center justify-center lg:justify-start gap-4 sm:gap-6 text-xs sm:text-sm text-slate-500 mb-6"><div className="flex items-center gap-2"><CheckCircle className="h-4 w-4 sm:h-5 sm:w-5 text-green-500" /><span>No registration</span></div><div className="flex items-center gap-2"><Shield className="h-4 w-4 sm:h-5 sm:w-5 text-green-500" /><span>Secure & Private</span></div><div className="flex items-center gap-2"><Zap className="h-4 w-4 sm:h-5 sm:w-5 text-green-500" /><span>Instant download</span></div></div>
            </div>
            <div className={`transition-all duration-700 delay-200 ${isVisible ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-10'}`}>
              <div onDragOver={handleDragOver} onDragLeave={handleDragLeave} onDrop={handleDrop} onClick={() => !isProcessing && document.getElementById('excel-upload').click()} className={`relative bg-white rounded-2xl sm:rounded-3xl p-6 sm:p-8 lg:p-10 border-2 border-dashed transition-all duration-300 cursor-pointer shadow-xl hover:shadow-2xl ${isDragging ? 'border-green-500 bg-green-50/50 scale-[1.02]' : conversionComplete ? 'border-green-400 bg-green-50/30' : 'border-green-200 hover:border-green-400'} ${isProcessing ? 'pointer-events-none' : ''}`}>
                <input id="excel-upload" type="file" accept=".xls,.xlsx" onChange={handleFileSelect} className="hidden" disabled={isProcessing} />
                {isProcessing ? (<div className="text-center py-4"><div className="relative w-20 h-20 sm:w-24 sm:h-24 mx-auto mb-4 sm:mb-6"><svg className="w-full h-full transform -rotate-90"><circle cx="50%" cy="50%" r="45%" stroke="#e5e7eb" strokeWidth="8" fill="none" /><circle cx="50%" cy="50%" r="45%" stroke="url(#gradientExcel)" strokeWidth="8" fill="none" strokeLinecap="round" strokeDasharray={`${processingProgress * 2.83} 283`} className="transition-all duration-500" /><defs><linearGradient id="gradientExcel" x1="0%" y1="0%" x2="100%" y2="0%"><stop offset="0%" stopColor="#22c55e" /><stop offset="100%" stopColor="#10b981" /></linearGradient></defs></svg><div className="absolute inset-0 flex items-center justify-center"><span className="text-lg sm:text-xl font-bold text-green-600">{processingProgress}%</span></div></div><p className="text-base sm:text-lg font-semibold text-slate-800 mb-2">{processingStage}</p><p className="text-sm text-slate-500">{uploadedFile?.name}</p><div className="flex justify-center gap-1 mt-4">{[1, 2, 3, 4, 5].map((step) => (<div key={step} className={`w-2 h-2 rounded-full transition-all duration-300 ${processingProgress >= step * 20 ? 'bg-green-500' : processingProgress >= (step - 1) * 20 ? 'bg-green-300 animate-pulse' : 'bg-gray-200'}`} />))}</div><p className="text-xs text-slate-400 mt-2">{processingProgress < 25 ? 'Uploading...' : processingProgress < 50 ? 'Processing...' : processingProgress < 75 ? 'Converting...' : processingProgress < 90 ? 'Finalizing...' : 'Complete!'}</p></div>
                ) : conversionComplete ? (<div className="text-center py-4"><div className="w-16 h-16 sm:w-20 sm:h-20 mx-auto mb-4 bg-green-100 rounded-full flex items-center justify-center"><CheckCircle className="h-8 w-8 sm:h-10 sm:w-10 text-green-600" /></div><p className="text-lg sm:text-xl font-semibold text-green-700 mb-2">Conversion Complete!</p><p className="text-sm text-slate-500 mb-4">Your PDF has been downloaded</p><Button onClick={(e) => { e.stopPropagation(); resetConverter(); }} variant="outline" className="border-green-300 text-green-700 hover:bg-green-50"><RefreshCw className="h-4 w-4 mr-2" /> Convert Another</Button></div>
                ) : (<div className="text-center"><div className="w-16 h-16 sm:w-20 sm:h-20 mx-auto mb-4 sm:mb-6 bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl flex items-center justify-center shadow-lg"><FileUp className="h-8 w-8 sm:h-10 sm:w-10 text-white" /></div><h3 className="text-lg sm:text-xl font-semibold text-slate-800 mb-2">Drop your Excel file here</h3><p className="text-sm sm:text-base text-slate-500 mb-4 sm:mb-6">or click to browse files</p><Button size="lg" className="w-full sm:w-auto px-6 sm:px-8 py-3 sm:py-4 text-base font-semibold bg-gradient-to-r from-green-600 to-emerald-600 text-white hover:shadow-lg transition-all rounded-xl"><Upload className="mr-2 h-4 w-4 sm:h-5 sm:w-5" /> Select Excel File</Button><p className="text-xs sm:text-sm text-slate-400 mt-4">Supports .xls & .xlsx • Max 100MB</p></div>)}
              </div>
            </div>
          </div>
        </div>
      </section>
      <section className="py-8 sm:py-10 md:py-16 px-3 sm:px-4 md:px-6 bg-gradient-to-r from-green-50 via-emerald-50 to-teal-50"><div className="container mx-auto max-w-6xl"><div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 md:gap-6">{features.map((feature, index) => (<div key={index} className="text-center p-2 sm:p-3"><div className="inline-flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 bg-white rounded-lg sm:rounded-xl md:rounded-2xl shadow-md mb-2 sm:mb-3 md:mb-4"><feature.icon className="h-4 w-4 sm:h-5 sm:w-5 md:h-6 md:w-6 text-green-600" /></div><div className="text-xs sm:text-sm md:text-base font-semibold text-slate-900">{feature.title}</div><div className="text-[10px] sm:text-xs md:text-sm text-slate-500">{feature.desc}</div></div>))}</div></div></section>
      <section className="py-10 sm:py-12 md:py-20 px-3 sm:px-4 md:px-6"><div className="container mx-auto max-w-5xl"><div className="text-center mb-6 sm:mb-8 md:mb-12"><Badge className="mb-2 sm:mb-3 md:mb-4 px-3 sm:px-4 py-1.5 bg-gradient-to-r from-green-100 to-emerald-100 text-green-700 text-xs sm:text-sm font-semibold">SIMPLE PROCESS</Badge><h2 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold text-slate-900">How to Convert Excel to PDF</h2></div><div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6 md:gap-8">{[{ step: '1', title: 'Upload Excel', desc: 'Drag & drop or click to upload your spreadsheet', icon: Upload },{ step: '2', title: 'Auto Convert', desc: 'We convert all sheets preserving formatting', icon: Sparkles },{ step: '3', title: 'Download PDF', desc: 'Get your professional PDF file instantly', icon: Download }].map((item, index) => (<div key={index} className="relative bg-white rounded-lg sm:rounded-xl md:rounded-2xl p-4 sm:p-5 md:p-6 border-2 border-green-100 hover:border-green-300 hover:shadow-xl transition-all group"><div className="absolute -top-2 -left-2 sm:-top-3 sm:-left-3 w-6 h-6 sm:w-8 sm:h-8 md:w-10 md:h-10 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center text-white text-xs sm:text-sm font-bold shadow-lg">{item.step}</div><div className="w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 bg-green-50 rounded-lg sm:rounded-xl flex items-center justify-center mb-3 sm:mb-4 group-hover:scale-110 transition-transform"><item.icon className="h-4 w-4 sm:h-5 sm:w-5 md:h-6 md:w-6 text-green-600" /></div><h3 className="text-sm sm:text-base md:text-lg font-semibold text-slate-900 mb-1 sm:mb-2">{item.title}</h3><p className="text-xs sm:text-sm text-slate-600">{item.desc}</p></div>))}</div></div></section>
      <section className="py-10 sm:py-12 md:py-20 px-3 sm:px-4 md:px-6 bg-gradient-to-b from-slate-50 to-white"><div className="container mx-auto max-w-5xl"><div className="text-center mb-6 sm:mb-8 md:mb-12"><h2 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold text-slate-900">Perfect for Every Use Case</h2></div><div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-6">{useCases.map((item, index) => (<div key={index} className="bg-white rounded-lg sm:rounded-xl md:rounded-2xl p-3 sm:p-4 md:p-6 border-2 border-gray-100 hover:border-green-200 hover:shadow-lg transition-all text-center group"><div className="w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 bg-green-50 rounded-lg sm:rounded-xl flex items-center justify-center mx-auto mb-2 sm:mb-3 md:mb-4 group-hover:scale-110 transition-transform"><item.icon className="h-4 w-4 sm:h-5 sm:w-5 md:h-6 md:w-6 text-green-600" /></div><h3 className="text-xs sm:text-sm md:text-base font-semibold text-slate-900 mb-1">{item.title}</h3><p className="text-[10px] sm:text-xs md:text-sm text-slate-500">{item.desc}</p></div>))}</div></div></section>
      <section className="py-10 sm:py-12 md:py-20 px-3 sm:px-4 md:px-6"><div className="container mx-auto max-w-4xl"><div className="text-center mb-6 sm:mb-8 md:mb-12"><Badge className="mb-2 sm:mb-3 md:mb-4 px-3 sm:px-4 py-1.5 bg-gradient-to-r from-green-100 to-emerald-100 text-green-700 text-xs sm:text-sm font-semibold">FAQ</Badge><h2 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold text-slate-900 mb-2 sm:mb-3">Frequently Asked Questions</h2></div><div className="space-y-2 sm:space-y-3 md:space-y-4">{[{ q: 'How do I convert Excel to PDF for free?', a: 'Upload your Excel file above and we\'ll convert it to PDF instantly. No registration required.' },{ q: 'Will my table formatting be preserved?', a: 'Yes! Cell borders, colors, fonts, and column widths are preserved exactly.' },{ q: 'Can I convert multiple sheets?', a: 'Yes, all worksheets in your Excel file will be converted to the PDF.' }].map((item, index) => (<div key={index} className="bg-white rounded-lg sm:rounded-xl md:rounded-2xl p-3 sm:p-4 md:p-6 border border-gray-200 hover:border-green-200 hover:shadow-md transition-all"><h3 className="text-xs sm:text-sm md:text-base font-semibold text-slate-900 mb-1 sm:mb-2 flex items-start gap-1.5 sm:gap-2"><span className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5"><span className="text-green-600 text-[10px] sm:text-xs font-bold">?</span></span>{item.q}</h3><p className="text-[10px] sm:text-xs md:text-sm text-slate-600 pl-5 sm:pl-7 md:pl-8">{item.a}</p></div>))}</div></div></section>
      <section className="py-8 sm:py-10 md:py-16 px-3 sm:px-4 md:px-6 bg-gradient-to-r from-green-50 via-emerald-50 to-teal-50"><div className="container mx-auto max-w-5xl"><div className="text-center mb-6 sm:mb-8 md:mb-10"><h2 className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold text-slate-900 mb-2">Trusted by 50,000+ Users</h2><div className="flex items-center justify-center gap-1 mb-3 sm:mb-4">{[...Array(5)].map((_, i) => (<Star key={i} className="h-3 w-3 sm:h-4 sm:w-4 md:h-5 md:w-5 fill-yellow-400 text-yellow-400" />))}<span className="ml-2 text-xs sm:text-sm text-slate-600">4.8/5 rating</span></div></div><div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 md:gap-6">{[{ text: "Perfect for sharing financial reports. Tables look great!", author: "Kevin M.", role: "CFO" },{ text: "Converts complex spreadsheets flawlessly.", author: "Linda P.", role: "Analyst" },{ text: "Fast and reliable. Use it every day.", author: "Tom H.", role: "Accountant" }].map((item, index) => (<div key={index} className="bg-white rounded-lg sm:rounded-xl md:rounded-2xl p-3 sm:p-4 md:p-6 border border-gray-200 shadow-sm"><div className="flex gap-1 mb-2 sm:mb-3">{[...Array(5)].map((_, i) => (<Star key={i} className="h-3 w-3 sm:h-4 sm:w-4 fill-yellow-400 text-yellow-400" />))}</div><p className="text-[10px] sm:text-xs md:text-sm text-slate-600 mb-2 sm:mb-3">"{item.text}"</p><p className="text-[10px] sm:text-xs md:text-sm font-semibold text-slate-900">— {item.author}, <span className="font-normal text-slate-500">{item.role}</span></p></div>))}</div></div></section>
      <section className="py-10 sm:py-12 md:py-20 px-3 sm:px-4 md:px-6"><div className="container mx-auto max-w-5xl"><div className="text-center mb-6 sm:mb-8 md:mb-10"><h2 className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold text-slate-900 mb-2">Related PDF Tools</h2></div><div className="grid grid-cols-2 md:grid-cols-4 gap-2 sm:gap-3 md:gap-4">{[{ to: '/pdf-to-excel', icon: Table2, title: 'PDF to Excel', color: 'text-emerald-600', bg: 'bg-emerald-50' },{ to: '/word-to-pdf', icon: FileText, title: 'Word to PDF', color: 'text-indigo-600', bg: 'bg-indigo-50' },{ to: '/merge-pdf', icon: Combine, title: 'Merge PDF', color: 'text-blue-600', bg: 'bg-blue-50' },{ to: '/pdf-to-word', icon: FileText, title: 'PDF to Word', color: 'text-blue-600', bg: 'bg-blue-50' }].map((item, index) => (<Link key={index} to={item.to} className="bg-white rounded-lg sm:rounded-xl p-3 sm:p-4 md:p-5 border-2 border-gray-100 hover:border-green-200 hover:shadow-lg transition-all text-center group"><div className={`w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 ${item.bg} rounded-lg sm:rounded-xl flex items-center justify-center mx-auto mb-1.5 sm:mb-2 md:mb-3 group-hover:scale-110 transition-transform`}><item.icon className={`h-4 w-4 sm:h-5 sm:w-5 md:h-6 md:w-6 ${item.color}`} /></div><span className="text-xs sm:text-sm font-medium text-slate-700">{item.title}</span></Link>))}</div></div></section>
    </div>
  )
}

export default ExcelToPdf
