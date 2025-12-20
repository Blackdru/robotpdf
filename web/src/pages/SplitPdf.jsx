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
import { Scissors, Upload, Download, CheckCircle, FileText, Zap, Shield, Layers, Building2, GraduationCap, Briefcase, Star, RefreshCw, Sparkles, FileUp, Table2, Combine, Minimize2 } from 'lucide-react'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'

const SplitPdf = () => {
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
    trackPageViewOnce(window.location.href, 'Split PDF Online Free - RobotPDF').catch(err => console.error('Failed to track visitor:', err))
    const script = document.createElement('script')
    script.type = 'application/ld+json'
    script.text = JSON.stringify({
      "@context": "https://schema.org", "@type": "SoftwareApplication", "name": "Split PDF Online Free",
      "applicationCategory": "BusinessApplication", "operatingSystem": "Web Browser",
      "offers": { "@type": "Offer", "price": "0", "priceCurrency": "USD" },
      "aggregateRating": { "@type": "AggregateRating", "ratingValue": "4.8", "ratingCount": "12840" }
    })
    document.head.appendChild(script)
    const faqScript = document.createElement('script')
    faqScript.type = 'application/ld+json'
    faqScript.text = JSON.stringify({
      "@context": "https://schema.org", "@type": "FAQPage",
      "mainEntity": [
        { "@type": "Question", "name": "How do I split a PDF for free?", "acceptedAnswer": { "@type": "Answer", "text": "Upload your PDF and we automatically split each page into separate files. Download all as a ZIP." }},
        { "@type": "Question", "name": "Can I extract specific pages?", "acceptedAnswer": { "@type": "Answer", "text": "Yes! Each page becomes a separate PDF file, so you can keep only the pages you need." }},
      ]
    })
    document.head.appendChild(faqScript)
    return () => { document.head.removeChild(script); document.head.removeChild(faqScript) }
  }, [])


  const handleDragOver = useCallback((e) => { e.preventDefault(); setIsDragging(true) }, [])
  const handleDragLeave = useCallback((e) => { e.preventDefault(); setIsDragging(false) }, [])
  const handleDrop = useCallback((e) => {
    e.preventDefault(); setIsDragging(false)
    const files = Array.from(e.dataTransfer.files)
    if (files.length > 0 && files[0].type === 'application/pdf') { setUploadedFile(files[0]); handleSplit(files[0]) }
    else { toast.error('Please upload a PDF file') }
  }, [])
  const handleFileSelect = (e) => {
    const file = e.target.files?.[0]
    if (file && file.type === 'application/pdf') { setUploadedFile(file); handleSplit(file) }
    else { toast.error('Please select a PDF file') }
  }
  const resetConverter = () => { setUploadedFile(null); setIsProcessing(false); setProcessingProgress(0); setProcessingStage(''); setConversionComplete(false) }

  const handleSplit = async (file) => {
    if (!file) return
    if (user && session && usage && usage.current >= usage.limit && subscription?.plan === 'free') { toast.error('Monthly limit reached. Please upgrade.'); return }
    setIsProcessing(true); setConversionComplete(false); setProcessingProgress(10); setProcessingStage('Uploading PDF...')
    try {
      const uploadResponse = await api.uploadFile(file)
      const fileId = uploadResponse.file.id
      setProcessingProgress(40); setProcessingStage('Analyzing PDF structure...')
      await new Promise(resolve => setTimeout(resolve, 500))
      setProcessingProgress(60); setProcessingStage('Splitting pages...')
      const splitResponse = await fetch(`${API_BASE_URL}/pdf/split`, {
        method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${session?.access_token}` },
        body: JSON.stringify({ fileId, outputName: `split-${Date.now()}.pdf` })
      })
      if (!splitResponse.ok) { const errorData = await splitResponse.json(); throw new Error(errorData.error || 'Split failed') }
      setProcessingProgress(90); setProcessingStage('Preparing download...')
      const splitBlob = await splitResponse.blob()
      setProcessingProgress(100); setProcessingStage('Download ready!'); setConversionComplete(true)
      downloadBlob(splitBlob, `${file.name.replace('.pdf', '')}_split.zip`)
      toast.success('PDF split successfully!')
      trackToolUsage('split-pdf', 'Split PDF').catch(err => console.error('Failed to track:', err))
      setTimeout(() => resetConverter(), 3000)
    } catch (error) { console.error('Split error:', error); toast.error(error.message || 'Split failed.'); resetConverter() }
  }

  const features = [
    { icon: Scissors, title: 'Extract Pages', desc: 'Split any page range' },
    { icon: Zap, title: 'Lightning Fast', desc: 'Split in seconds' },
    { icon: Shield, title: '100% Secure', desc: 'Files auto-deleted' },
    { icon: Layers, title: 'Batch Split', desc: 'All pages at once' },
  ]
  const useCases = [
    { icon: Building2, title: 'Extract Chapters', desc: 'Split books by chapter' },
    { icon: Briefcase, title: 'Separate Pages', desc: 'Extract specific pages' },
    { icon: GraduationCap, title: 'Research Papers', desc: 'Split by sections' },
    { icon: FileText, title: 'Large Documents', desc: 'Break into smaller files' },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-b from-white via-emerald-50/30 to-white overflow-hidden">
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -left-40 w-[600px] h-[600px] bg-gradient-to-br from-emerald-100/40 to-teal-100/40 rounded-full blur-3xl"></div>
        <div className="absolute top-40 -right-40 w-[500px] h-[500px] bg-gradient-to-br from-emerald-100/30 to-cyan-100/30 rounded-full blur-3xl"></div>
      </div>
      <section className="relative pt-6 sm:pt-8 md:pt-12 lg:pt-16 pb-6 sm:pb-8 md:pb-12 px-3 sm:px-4 md:px-6">
        <div className="container mx-auto max-w-6xl">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8 lg:gap-12 items-center">
            <div className={`text-center lg:text-left transition-all duration-700 ${isVisible ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-10'}`}>
              <Badge className="mb-4 sm:mb-6 px-3 sm:px-4 py-1.5 bg-gradient-to-r from-emerald-500 to-teal-500 text-white text-xs sm:text-sm font-semibold inline-flex items-center"><Sparkles className="h-3 w-3 sm:h-4 sm:w-4 mr-1.5" />EXTRACT PAGES • FREE</Badge>
              <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-5xl font-bold mb-4 sm:mb-6 leading-tight">
                <span className="bg-gradient-to-r from-slate-900 via-emerald-900 to-slate-900 bg-clip-text text-transparent">Split PDF</span><br />
                <span className="bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">Files Online Free</span>
              </h1>
              <p className="text-base sm:text-lg text-slate-600 mb-6 sm:mb-8 leading-relaxed max-w-lg mx-auto lg:mx-0">Extract pages or split PDF into multiple files instantly. Separate specific pages or split by page ranges. Free, fast & secure.</p>
              <div className="flex flex-wrap items-center justify-center lg:justify-start gap-4 sm:gap-6 text-xs sm:text-sm text-slate-500 mb-6">
                <div className="flex items-center gap-2"><CheckCircle className="h-4 w-4 sm:h-5 sm:w-5 text-emerald-500" /><span>No registration</span></div>
                <div className="flex items-center gap-2"><Shield className="h-4 w-4 sm:h-5 sm:w-5 text-emerald-500" /><span>Secure & Private</span></div>
                <div className="flex items-center gap-2"><Zap className="h-4 w-4 sm:h-5 sm:w-5 text-emerald-500" /><span>Instant download</span></div>
              </div>
            </div>
            <div className={`transition-all duration-700 delay-200 ${isVisible ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-10'}`}>
              <div onDragOver={handleDragOver} onDragLeave={handleDragLeave} onDrop={handleDrop} onClick={() => !isProcessing && document.getElementById('pdf-upload').click()}
                className={`relative bg-white rounded-2xl sm:rounded-3xl p-6 sm:p-8 lg:p-10 border-2 border-dashed transition-all duration-300 cursor-pointer shadow-xl hover:shadow-2xl ${isDragging ? 'border-emerald-500 bg-emerald-50/50 scale-[1.02]' : conversionComplete ? 'border-emerald-400 bg-emerald-50/30' : 'border-emerald-200 hover:border-emerald-400'} ${isProcessing ? 'pointer-events-none' : ''}`}>
                <input id="pdf-upload" type="file" accept=".pdf" onChange={handleFileSelect} className="hidden" disabled={isProcessing} />
                {isProcessing ? (
                  <div className="text-center py-4">
                    <div className="relative w-20 h-20 sm:w-24 sm:h-24 mx-auto mb-4 sm:mb-6">
                      <svg className="w-full h-full transform -rotate-90"><circle cx="50%" cy="50%" r="45%" stroke="#e5e7eb" strokeWidth="8" fill="none" /><circle cx="50%" cy="50%" r="45%" stroke="url(#gradientSplit)" strokeWidth="8" fill="none" strokeLinecap="round" strokeDasharray={`${processingProgress * 2.83} 283`} className="transition-all duration-500" /><defs><linearGradient id="gradientSplit" x1="0%" y1="0%" x2="100%" y2="0%"><stop offset="0%" stopColor="#10b981" /><stop offset="100%" stopColor="#14b8a6" /></linearGradient></defs></svg>
                      <div className="absolute inset-0 flex items-center justify-center"><span className="text-lg sm:text-xl font-bold text-emerald-600">{processingProgress}%</span></div>
                    </div>
                    <p className="text-base sm:text-lg font-semibold text-slate-800 mb-2">{processingStage}</p>
                    <p className="text-sm text-slate-500">{uploadedFile?.name}</p>
                    <div className="flex justify-center gap-1 mt-4">
                      {[1, 2, 3, 4, 5].map((step) => (
                        <div key={step} className={`w-2 h-2 rounded-full transition-all duration-300 ${processingProgress >= step * 20 ? 'bg-emerald-500' : processingProgress >= (step - 1) * 20 ? 'bg-emerald-300 animate-pulse' : 'bg-gray-200'}`} />
                      ))}
                    </div>
                    <p className="text-xs text-slate-400 mt-2">{processingProgress < 25 ? 'Uploading...' : processingProgress < 50 ? 'Analyzing...' : processingProgress < 75 ? 'Splitting...' : processingProgress < 90 ? 'Finalizing...' : 'Complete!'}</p>
                  </div>
                ) : conversionComplete ? (
                  <div className="text-center py-4">
                    <div className="w-16 h-16 sm:w-20 sm:h-20 mx-auto mb-4 bg-emerald-100 rounded-full flex items-center justify-center"><CheckCircle className="h-8 w-8 sm:h-10 sm:w-10 text-emerald-600" /></div>
                    <p className="text-lg sm:text-xl font-semibold text-emerald-700 mb-2">Split Complete!</p>
                    <p className="text-sm text-slate-500 mb-4">Your split files have been downloaded</p>
                    <Button onClick={(e) => { e.stopPropagation(); resetConverter(); }} variant="outline" className="border-emerald-300 text-emerald-700 hover:bg-emerald-50"><RefreshCw className="h-4 w-4 mr-2" /> Split Another</Button>
                  </div>
                ) : (
                  <div className="text-center">
                    <div className="w-16 h-16 sm:w-20 sm:h-20 mx-auto mb-4 sm:mb-6 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl flex items-center justify-center shadow-lg"><FileUp className="h-8 w-8 sm:h-10 sm:w-10 text-white" /></div>
                    <h3 className="text-lg sm:text-xl font-semibold text-slate-800 mb-2">Drop your PDF here</h3>
                    <p className="text-sm sm:text-base text-slate-500 mb-4 sm:mb-6">or click to browse files</p>
                    <Button size="lg" className="w-full sm:w-auto px-6 sm:px-8 py-3 sm:py-4 text-base font-semibold bg-gradient-to-r from-emerald-600 to-teal-600 text-white hover:shadow-lg transition-all rounded-xl"><Upload className="mr-2 h-4 w-4 sm:h-5 sm:w-5" /> Select PDF File</Button>
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

      <section className="py-8 sm:py-10 md:py-16 px-3 sm:px-4 md:px-6 bg-gradient-to-r from-emerald-50 via-teal-50 to-cyan-50">
        <div className="container mx-auto max-w-6xl">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 md:gap-6">
            {features.map((feature, index) => (
              <div key={index} className="text-center">
                <div className="inline-flex items-center justify-center w-12 h-12 sm:w-14 sm:h-14 bg-white rounded-xl sm:rounded-2xl shadow-md mb-3 sm:mb-4"><feature.icon className="h-5 w-5 sm:h-6 sm:w-6 text-emerald-600" /></div>
                <div className="text-sm sm:text-base font-semibold text-slate-900">{feature.title}</div>
                <div className="text-xs sm:text-sm text-slate-500">{feature.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-10 sm:py-12 md:py-20 px-3 sm:px-4 md:px-6">
        <div className="container mx-auto max-w-5xl">
          <div className="text-center mb-6 sm:mb-8 md:mb-12">
            <Badge className="mb-2 sm:mb-3 md:mb-4 px-3 sm:px-4 py-1.5 bg-gradient-to-r from-emerald-100 to-teal-100 text-emerald-700 text-xs sm:text-sm font-semibold">SIMPLE PROCESS</Badge>
            <h2 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold text-slate-900 mb-2 sm:mb-3 md:mb-4">How to Split PDF Files</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6 md:gap-8">
            {[
              { step: '1', title: 'Upload PDF', desc: 'Drag & drop or click to upload your PDF file', icon: Upload },
              { step: '2', title: 'Auto Split', desc: 'We automatically split each page into separate files', icon: Scissors },
              { step: '3', title: 'Download ZIP', desc: 'Get all split pages in a convenient ZIP file', icon: Download },
            ].map((item, index) => (
              <div key={index} className="relative bg-white rounded-xl sm:rounded-2xl p-5 sm:p-6 border-2 border-emerald-100 hover:border-emerald-300 hover:shadow-xl transition-all group">
                <div className="absolute -top-3 -left-3 w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-full flex items-center justify-center text-white font-bold shadow-lg">{item.step}</div>
                <div className="w-12 h-12 sm:w-14 sm:h-14 bg-emerald-50 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform"><item.icon className="h-5 w-5 sm:h-6 sm:w-6 text-emerald-600" /></div>
                <h3 className="text-base sm:text-lg font-semibold text-slate-900 mb-2">{item.title}</h3>
                <p className="text-sm text-slate-600">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-10 sm:py-12 md:py-20 px-3 sm:px-4 md:px-6 bg-gradient-to-b from-slate-50 to-white">
        <div className="container mx-auto max-w-5xl">
          <div className="text-center mb-6 sm:mb-8 md:mb-12"><h2 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold text-slate-900">Perfect for Every Use Case</h2></div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-6">
            {useCases.map((item, index) => (
              <div key={index} className="bg-white rounded-xl sm:rounded-2xl p-4 sm:p-6 border-2 border-gray-100 hover:border-emerald-200 hover:shadow-lg transition-all text-center group">
                <div className="w-12 h-12 sm:w-14 sm:h-14 bg-emerald-50 rounded-xl flex items-center justify-center mx-auto mb-3 sm:mb-4 group-hover:scale-110 transition-transform"><item.icon className="h-5 w-5 sm:h-6 sm:w-6 text-emerald-600" /></div>
                <h3 className="text-sm sm:text-base font-semibold text-slate-900 mb-1">{item.title}</h3>
                <p className="text-xs sm:text-sm text-slate-500">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-10 sm:py-12 md:py-20 px-3 sm:px-4 md:px-6">
        <div className="container mx-auto max-w-4xl">
          <div className="text-center mb-6 sm:mb-8 md:mb-12">
            <Badge className="mb-2 sm:mb-3 md:mb-4 px-3 sm:px-4 py-1.5 bg-gradient-to-r from-emerald-100 to-teal-100 text-emerald-700 text-xs sm:text-sm font-semibold">FAQ</Badge>
            <h2 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold text-slate-900 mb-2 sm:mb-3">Frequently Asked Questions</h2>
          </div>
          <div className="space-y-2 sm:space-y-3 md:space-y-4">
            {[
              { q: 'How do I split a PDF for free?', a: 'Upload your PDF file above and we\'ll automatically split it into individual pages. Download all pages as a ZIP file instantly.' },
              { q: 'Can I extract specific pages from a PDF?', a: 'Yes! Our splitter extracts each page as a separate PDF file, allowing you to keep only the pages you need.' },
              { q: 'Is the PDF splitter secure?', a: 'Absolutely. All files are encrypted during transfer and automatically deleted after processing.' },
              { q: 'What\'s the maximum file size?', a: 'You can split PDF files up to 100MB for free. Premium users can process larger files.' },
            ].map((item, index) => (
              <div key={index} className="bg-white rounded-xl sm:rounded-2xl p-4 sm:p-6 border border-gray-200 hover:border-emerald-200 hover:shadow-md transition-all">
                <h3 className="text-sm sm:text-base font-semibold text-slate-900 mb-2 flex items-start gap-2">
                  <span className="w-5 h-5 sm:w-6 sm:h-6 bg-emerald-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5"><span className="text-emerald-600 text-xs font-bold">?</span></span>{item.q}
                </h3>
                <p className="text-xs sm:text-sm text-slate-600 pl-7 sm:pl-8">{item.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-8 sm:py-10 md:py-16 px-3 sm:px-4 md:px-6 bg-gradient-to-r from-emerald-50 via-teal-50 to-cyan-50">
        <div className="container mx-auto max-w-5xl">
          <div className="text-center mb-6 sm:mb-8 md:mb-10">
            <h2 className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold text-slate-900 mb-2">Trusted by 50,000+ Users</h2>
            <div className="flex items-center justify-center gap-1 mb-3 sm:mb-4">{[...Array(5)].map((_, i) => (<Star key={i} className="h-3 w-3 sm:h-4 sm:w-4 md:h-5 md:w-5 fill-yellow-400 text-yellow-400" />))}<span className="ml-2 text-xs sm:text-sm text-slate-600">4.8/5 rating</span></div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 md:gap-6">
            {[
              { text: "Split a 200-page PDF in seconds. Exactly what I needed!", author: "Mike T.", role: "Teacher" },
              { text: "Simple and effective. No watermarks, no signup required.", author: "Anna S.", role: "Designer" },
              { text: "Use it weekly to extract chapters from ebooks. Works perfectly.", author: "Chris P.", role: "Researcher" },
            ].map((item, index) => (
              <div key={index} className="bg-white rounded-xl sm:rounded-2xl p-4 sm:p-6 border border-gray-200 shadow-sm">
                <div className="flex gap-1 mb-3">{[...Array(5)].map((_, i) => (<Star key={i} className="h-3 w-3 sm:h-4 sm:w-4 fill-yellow-400 text-yellow-400" />))}</div>
                <p className="text-xs sm:text-sm text-slate-600 mb-3">"{item.text}"</p>
                <p className="text-xs sm:text-sm font-semibold text-slate-900">— {item.author}, <span className="font-normal text-slate-500">{item.role}</span></p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-10 sm:py-12 md:py-20 px-3 sm:px-4 md:px-6">
        <div className="container mx-auto max-w-5xl">
          <div className="text-center mb-6 sm:mb-8 md:mb-10"><h2 className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold text-slate-900 mb-2">Related PDF Tools</h2></div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 sm:gap-3 md:gap-4">
            {[
              { to: '/merge-pdf', icon: Combine, title: 'Merge PDF', color: 'text-blue-600', bg: 'bg-blue-50' },
              { to: '/compress-pdf', icon: Minimize2, title: 'Compress PDF', color: 'text-orange-600', bg: 'bg-orange-50' },
              { to: '/pdf-to-word', icon: FileText, title: 'PDF to Word', color: 'text-indigo-600', bg: 'bg-indigo-50' },
              { to: '/pdf-to-excel', icon: Table2, title: 'PDF to Excel', color: 'text-green-600', bg: 'bg-green-50' },
            ].map((item, index) => (
              <Link key={index} to={item.to} className="bg-white rounded-xl p-4 sm:p-5 border-2 border-gray-100 hover:border-emerald-200 hover:shadow-lg transition-all text-center group">
                <div className={`w-10 h-10 sm:w-12 sm:h-12 ${item.bg} rounded-xl flex items-center justify-center mx-auto mb-2 sm:mb-3 group-hover:scale-110 transition-transform`}><item.icon className={`h-5 w-5 sm:h-6 sm:w-6 ${item.color}`} /></div>
                <span className="text-sm font-medium text-slate-700">{item.title}</span>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </div>
  )
}

export default SplitPdf
