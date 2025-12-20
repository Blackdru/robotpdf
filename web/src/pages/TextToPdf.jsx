import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { useSubscription } from '../contexts/SubscriptionContext'
import { api } from '../lib/api'
import { downloadBlob } from '../lib/utils'
import { trackPageViewOnce, trackToolUsage } from '../lib/visitorTracking'
import { Button } from '../components/ui/button'
import { Badge } from '../components/ui/badge'
import toast from 'react-hot-toast'
import { Type, Upload, Download, CheckCircle, FileText, Zap, Shield, Building2, GraduationCap, Briefcase, Star, RefreshCw, Sparkles, Table2, Combine } from 'lucide-react'

const TextToPdf = () => {
  const { user, session } = useAuth()
  const { subscription, usage } = useSubscription()
  const [text, setText] = useState('')
  const [isProcessing, setIsProcessing] = useState(false)
  const [processingProgress, setProcessingProgress] = useState(0)
  const [processingStage, setProcessingStage] = useState('')
  const [isVisible, setIsVisible] = useState(false)
  const [conversionComplete, setConversionComplete] = useState(false)

  useEffect(() => {
    setIsVisible(true)
    trackPageViewOnce(window.location.href, 'Text to PDF Converter Online Free - RobotPDF').catch(err => console.error('Failed to track:', err))
    const script = document.createElement('script')
    script.type = 'application/ld+json'
    script.text = JSON.stringify({ "@context": "https://schema.org", "@type": "SoftwareApplication", "name": "Text to PDF Converter", "applicationCategory": "BusinessApplication", "operatingSystem": "Web Browser", "offers": { "@type": "Offer", "price": "0", "priceCurrency": "USD" }, "aggregateRating": { "@type": "AggregateRating", "ratingValue": "4.8", "ratingCount": "9420" } })
    document.head.appendChild(script)
    return () => { document.head.removeChild(script) }
  }, [])

  const resetConverter = () => { setText(''); setIsProcessing(false); setProcessingProgress(0); setProcessingStage(''); setConversionComplete(false) }

  const handleConvert = async () => {
    if (!text.trim()) { toast.error('Please enter some text'); return }
    if (user && session && usage && usage.current >= usage.limit && subscription?.plan === 'free') { toast.error('Monthly limit reached.'); return }
    setIsProcessing(true); setConversionComplete(false); setProcessingProgress(20); setProcessingStage('Processing text...')
    try {
      setProcessingProgress(50); setProcessingStage('Creating PDF...')
      const result = await api.convertDirectTextToPDF(text, `text-${Date.now()}.pdf`)
      setProcessingProgress(90); setProcessingStage('Preparing download...')
      if (result?.file?.id) {
        const blob = await api.downloadFile(result.file.id)
        setProcessingProgress(100); setProcessingStage('Download ready!'); setConversionComplete(true)
        downloadBlob(blob, result.file.filename || 'text.pdf')
        toast.success('Text converted to PDF successfully!')
        trackToolUsage('text-to-pdf', 'Text to PDF').catch(err => console.error('Failed to track:', err))
      }
      setTimeout(() => resetConverter(), 3000)
    } catch (error) { console.error('Conversion error:', error); toast.error(error.message || 'Conversion failed.'); resetConverter() }
  }

  const features = [{ icon: Type, title: 'Any Text', desc: 'Convert any text content' }, { icon: Zap, title: 'Lightning Fast', desc: 'Convert in seconds' }, { icon: Shield, title: '100% Secure', desc: 'Files auto-deleted' }, { icon: CheckCircle, title: 'Clean Format', desc: 'Professional output' }]
  const useCases = [{ icon: Building2, title: 'Notes', desc: 'Convert notes to PDF' }, { icon: Briefcase, title: 'Documents', desc: 'Create quick docs' }, { icon: GraduationCap, title: 'Essays', desc: 'Format academic text' }, { icon: FileText, title: 'Letters', desc: 'Create formal letters' }]


  return (
    <div className="min-h-screen bg-gradient-to-b from-white via-violet-50/30 to-white overflow-hidden">
      <div className="fixed inset-0 overflow-hidden pointer-events-none"><div className="absolute -top-40 -left-40 w-[600px] h-[600px] bg-gradient-to-br from-violet-100/40 to-purple-100/40 rounded-full blur-3xl"></div><div className="absolute top-40 -right-40 w-[500px] h-[500px] bg-gradient-to-br from-violet-100/30 to-indigo-100/30 rounded-full blur-3xl"></div></div>
      <section className="relative pt-6 sm:pt-8 md:pt-12 lg:pt-16 pb-6 sm:pb-8 md:pb-12 px-3 sm:px-4 md:px-6">
        <div className="container mx-auto max-w-6xl">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8 lg:gap-12 items-center">
            <div className={`text-center lg:text-left transition-all duration-700 ${isVisible ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-10'}`}>
              <Badge className="mb-4 sm:mb-6 px-3 sm:px-4 py-1.5 bg-gradient-to-r from-violet-500 to-purple-500 text-white text-xs sm:text-sm font-semibold inline-flex items-center"><Sparkles className="h-3 w-3 sm:h-4 sm:w-4 mr-1.5" />TYPE & CONVERT • FREE</Badge>
              <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-5xl font-bold mb-4 sm:mb-6 leading-tight"><span className="bg-gradient-to-r from-slate-900 via-violet-900 to-slate-900 bg-clip-text text-transparent">Text to PDF</span><br /><span className="bg-gradient-to-r from-violet-600 to-purple-600 bg-clip-text text-transparent">Converter Online</span></h1>
              <p className="text-base sm:text-lg text-slate-600 mb-6 sm:mb-8 leading-relaxed max-w-lg mx-auto lg:mx-0">Type or paste text and convert it to a professional PDF document instantly. Free, fast & secure.</p>
              <div className="flex flex-wrap items-center justify-center lg:justify-start gap-4 sm:gap-6 text-xs sm:text-sm text-slate-500 mb-6"><div className="flex items-center gap-2"><CheckCircle className="h-4 w-4 sm:h-5 sm:w-5 text-violet-500" /><span>No registration</span></div><div className="flex items-center gap-2"><Shield className="h-4 w-4 sm:h-5 sm:w-5 text-violet-500" /><span>Secure & Private</span></div><div className="flex items-center gap-2"><Zap className="h-4 w-4 sm:h-5 sm:w-5 text-violet-500" /><span>Instant download</span></div></div>
            </div>
            <div className={`transition-all duration-700 delay-200 ${isVisible ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-10'}`}>
              <div className={`relative bg-white rounded-2xl sm:rounded-3xl p-6 sm:p-8 border-2 transition-all duration-300 shadow-xl ${conversionComplete ? 'border-violet-400 bg-violet-50/30' : 'border-violet-200'} ${isProcessing ? 'pointer-events-none' : ''}`}>
                {isProcessing ? (<div className="text-center py-4"><div className="relative w-20 h-20 sm:w-24 sm:h-24 mx-auto mb-4 sm:mb-6"><svg className="w-full h-full transform -rotate-90"><circle cx="50%" cy="50%" r="45%" stroke="#e5e7eb" strokeWidth="8" fill="none" /><circle cx="50%" cy="50%" r="45%" stroke="url(#gradientText)" strokeWidth="8" fill="none" strokeLinecap="round" strokeDasharray={`${processingProgress * 2.83} 283`} className="transition-all duration-500" /><defs><linearGradient id="gradientText" x1="0%" y1="0%" x2="100%" y2="0%"><stop offset="0%" stopColor="#8b5cf6" /><stop offset="100%" stopColor="#a855f7" /></linearGradient></defs></svg><div className="absolute inset-0 flex items-center justify-center"><span className="text-lg sm:text-xl font-bold text-violet-600">{processingProgress}%</span></div></div><p className="text-base sm:text-lg font-semibold text-slate-800 mb-2">{processingStage}</p><div className="flex justify-center gap-1 mt-4">{[1, 2, 3, 4, 5].map((step) => (<div key={step} className={`w-2 h-2 rounded-full transition-all duration-300 ${processingProgress >= step * 20 ? 'bg-violet-500' : processingProgress >= (step - 1) * 20 ? 'bg-violet-300 animate-pulse' : 'bg-gray-200'}`} />))}</div><p className="text-xs text-slate-400 mt-2">{processingProgress < 25 ? 'Processing...' : processingProgress < 50 ? 'Formatting...' : processingProgress < 75 ? 'Creating PDF...' : processingProgress < 90 ? 'Finalizing...' : 'Complete!'}</p></div>
                ) : conversionComplete ? (<div className="text-center py-4"><div className="w-16 h-16 sm:w-20 sm:h-20 mx-auto mb-4 bg-violet-100 rounded-full flex items-center justify-center"><CheckCircle className="h-8 w-8 sm:h-10 sm:w-10 text-violet-600" /></div><p className="text-lg sm:text-xl font-semibold text-violet-700 mb-2">Conversion Complete!</p><p className="text-sm text-slate-500 mb-4">Your PDF has been downloaded</p><Button onClick={resetConverter} variant="outline" className="border-violet-300 text-violet-700 hover:bg-violet-50"><RefreshCw className="h-4 w-4 mr-2" /> Convert More</Button></div>
                ) : (<div><div className="w-12 h-12 mx-auto mb-4 bg-gradient-to-br from-violet-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg"><Type className="h-6 w-6 text-white" /></div><textarea value={text} onChange={(e) => setText(e.target.value)} placeholder="Type or paste your text here..." className="w-full h-48 px-4 py-3 border-2 border-violet-200 rounded-xl focus:border-violet-500 focus:outline-none text-slate-700 resize-none mb-4" /><Button onClick={handleConvert} size="lg" className="w-full px-6 py-3 text-base font-semibold bg-gradient-to-r from-violet-600 to-purple-600 text-white hover:shadow-lg transition-all rounded-xl"><Download className="mr-2 h-5 w-5" /> Convert to PDF</Button></div>)}
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

      <section className="py-8 sm:py-10 md:py-16 px-3 sm:px-4 md:px-6 bg-gradient-to-r from-violet-50 via-purple-50 to-indigo-50"><div className="container mx-auto max-w-6xl"><div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 md:gap-6">{features.map((feature, index) => (<div key={index} className="text-center p-2 sm:p-3"><div className="inline-flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 bg-white rounded-lg sm:rounded-xl md:rounded-2xl shadow-md mb-2 sm:mb-3 md:mb-4"><feature.icon className="h-4 w-4 sm:h-5 sm:w-5 md:h-6 md:w-6 text-violet-600" /></div><div className="text-xs sm:text-sm md:text-base font-semibold text-slate-900">{feature.title}</div><div className="text-[10px] sm:text-xs md:text-sm text-slate-500">{feature.desc}</div></div>))}</div></div></section>
      <section className="py-10 sm:py-12 md:py-20 px-3 sm:px-4 md:px-6"><div className="container mx-auto max-w-5xl"><div className="text-center mb-6 sm:mb-8 md:mb-12"><Badge className="mb-2 sm:mb-3 md:mb-4 px-3 sm:px-4 py-1.5 bg-gradient-to-r from-violet-100 to-purple-100 text-violet-700 text-xs sm:text-sm font-semibold">SIMPLE PROCESS</Badge><h2 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold text-slate-900">How to Convert Text to PDF</h2></div><div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6 md:gap-8">{[{ step: '1', title: 'Enter Text', desc: 'Type or paste your text content', icon: Type },{ step: '2', title: 'Click Convert', desc: 'We format and create your PDF', icon: Sparkles },{ step: '3', title: 'Download PDF', desc: 'Get your professional PDF instantly', icon: Download }].map((item, index) => (<div key={index} className="relative bg-white rounded-lg sm:rounded-xl md:rounded-2xl p-4 sm:p-5 md:p-6 border-2 border-violet-100 hover:border-violet-300 hover:shadow-xl transition-all group"><div className="absolute -top-2 -left-2 sm:-top-3 sm:-left-3 w-6 h-6 sm:w-8 sm:h-8 md:w-10 md:h-10 bg-gradient-to-br from-violet-500 to-purple-600 rounded-full flex items-center justify-center text-white text-xs sm:text-sm font-bold shadow-lg">{item.step}</div><div className="w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 bg-violet-50 rounded-lg sm:rounded-xl flex items-center justify-center mb-3 sm:mb-4 group-hover:scale-110 transition-transform"><item.icon className="h-4 w-4 sm:h-5 sm:w-5 md:h-6 md:w-6 text-violet-600" /></div><h3 className="text-sm sm:text-base md:text-lg font-semibold text-slate-900 mb-1 sm:mb-2">{item.title}</h3><p className="text-xs sm:text-sm text-slate-600">{item.desc}</p></div>))}</div></div></section>
      <section className="py-10 sm:py-12 md:py-20 px-3 sm:px-4 md:px-6 bg-gradient-to-b from-slate-50 to-white"><div className="container mx-auto max-w-5xl"><div className="text-center mb-6 sm:mb-8 md:mb-12"><h2 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold text-slate-900">Perfect for Every Use Case</h2></div><div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-6">{useCases.map((item, index) => (<div key={index} className="bg-white rounded-lg sm:rounded-xl md:rounded-2xl p-3 sm:p-4 md:p-6 border-2 border-gray-100 hover:border-violet-200 hover:shadow-lg transition-all text-center group"><div className="w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 bg-violet-50 rounded-lg sm:rounded-xl flex items-center justify-center mx-auto mb-2 sm:mb-3 md:mb-4 group-hover:scale-110 transition-transform"><item.icon className="h-4 w-4 sm:h-5 sm:w-5 md:h-6 md:w-6 text-violet-600" /></div><h3 className="text-xs sm:text-sm md:text-base font-semibold text-slate-900 mb-1">{item.title}</h3><p className="text-[10px] sm:text-xs md:text-sm text-slate-500">{item.desc}</p></div>))}</div></div></section>
      <section className="py-10 sm:py-12 md:py-20 px-3 sm:px-4 md:px-6"><div className="container mx-auto max-w-4xl"><div className="text-center mb-6 sm:mb-8 md:mb-12"><Badge className="mb-2 sm:mb-3 md:mb-4 px-3 sm:px-4 py-1.5 bg-gradient-to-r from-violet-100 to-purple-100 text-violet-700 text-xs sm:text-sm font-semibold">FAQ</Badge><h2 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold text-slate-900 mb-2 sm:mb-3">Frequently Asked Questions</h2></div><div className="space-y-2 sm:space-y-3 md:space-y-4">{[{ q: 'How do I convert text to PDF?', a: 'Simply type or paste your text above and click Convert. Your PDF will be ready for download instantly.' },{ q: 'Is there a character limit?', a: 'You can convert large amounts of text. The PDF will automatically paginate for longer content.' },{ q: 'What formatting is supported?', a: 'Basic text formatting is preserved. For complex formatting, consider using Word to PDF converter.' }].map((item, index) => (<div key={index} className="bg-white rounded-lg sm:rounded-xl md:rounded-2xl p-3 sm:p-4 md:p-6 border border-gray-200 hover:border-violet-200 hover:shadow-md transition-all"><h3 className="text-xs sm:text-sm md:text-base font-semibold text-slate-900 mb-1 sm:mb-2 flex items-start gap-1.5 sm:gap-2"><span className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 bg-violet-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5"><span className="text-violet-600 text-[10px] sm:text-xs font-bold">?</span></span>{item.q}</h3><p className="text-[10px] sm:text-xs md:text-sm text-slate-600 pl-5 sm:pl-7 md:pl-8">{item.a}</p></div>))}</div></div></section>
      <section className="py-8 sm:py-10 md:py-16 px-3 sm:px-4 md:px-6 bg-gradient-to-r from-violet-50 via-purple-50 to-indigo-50"><div className="container mx-auto max-w-5xl"><div className="text-center mb-6 sm:mb-8 md:mb-10"><h2 className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold text-slate-900 mb-2">Trusted by 50,000+ Users</h2><div className="flex items-center justify-center gap-1 mb-3 sm:mb-4">{[...Array(5)].map((_, i) => (<Star key={i} className="h-3 w-3 sm:h-4 sm:w-4 md:h-5 md:w-5 fill-yellow-400 text-yellow-400" />))}<span className="ml-2 text-xs sm:text-sm text-slate-600">4.8/5 rating</span></div></div><div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 md:gap-6">{[{ text: "Perfect for quick notes to PDF. Simple and fast!", author: "Amy S.", role: "Student" },{ text: "Great for creating simple documents on the go.", author: "Brian T.", role: "Writer" },{ text: "Use it daily for meeting notes. Love it!", author: "Carol M.", role: "Manager" }].map((item, index) => (<div key={index} className="bg-white rounded-lg sm:rounded-xl md:rounded-2xl p-3 sm:p-4 md:p-6 border border-gray-200 shadow-sm"><div className="flex gap-1 mb-2 sm:mb-3">{[...Array(5)].map((_, i) => (<Star key={i} className="h-3 w-3 sm:h-4 sm:w-4 fill-yellow-400 text-yellow-400" />))}</div><p className="text-[10px] sm:text-xs md:text-sm text-slate-600 mb-2 sm:mb-3">"{item.text}"</p><p className="text-[10px] sm:text-xs md:text-sm font-semibold text-slate-900">— {item.author}, <span className="font-normal text-slate-500">{item.role}</span></p></div>))}</div></div></section>
      <section className="py-10 sm:py-12 md:py-20 px-3 sm:px-4 md:px-6"><div className="container mx-auto max-w-5xl"><div className="text-center mb-6 sm:mb-8 md:mb-10"><h2 className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold text-slate-900 mb-2">Related PDF Tools</h2></div><div className="grid grid-cols-2 md:grid-cols-4 gap-2 sm:gap-3 md:gap-4">{[{ to: '/word-to-pdf', icon: FileText, title: 'Word to PDF', color: 'text-indigo-600', bg: 'bg-indigo-50' },{ to: '/merge-pdf', icon: Combine, title: 'Merge PDF', color: 'text-blue-600', bg: 'bg-blue-50' },{ to: '/pdf-to-word', icon: FileText, title: 'PDF to Word', color: 'text-blue-600', bg: 'bg-blue-50' },{ to: '/pdf-to-excel', icon: Table2, title: 'PDF to Excel', color: 'text-green-600', bg: 'bg-green-50' }].map((item, index) => (<Link key={index} to={item.to} className="bg-white rounded-lg sm:rounded-xl p-3 sm:p-4 md:p-5 border-2 border-gray-100 hover:border-violet-200 hover:shadow-lg transition-all text-center group"><div className={`w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 ${item.bg} rounded-lg sm:rounded-xl flex items-center justify-center mx-auto mb-1.5 sm:mb-2 md:mb-3 group-hover:scale-110 transition-transform`}><item.icon className={`h-4 w-4 sm:h-5 sm:w-5 md:h-6 md:w-6 ${item.color}`} /></div><span className="text-xs sm:text-sm font-medium text-slate-700">{item.title}</span></Link>))}</div></div></section>
    </div>
  )
}

export default TextToPdf
