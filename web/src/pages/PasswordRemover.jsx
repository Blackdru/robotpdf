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
import { Unlock, Upload, Download, CheckCircle, FileText, Zap, Shield, Building2, GraduationCap, Briefcase, Star, RefreshCw, Sparkles, FileUp, Table2, Combine, Lock } from 'lucide-react'

const PasswordRemover = () => {
  const { user, session } = useAuth()
  const { subscription, usage } = useSubscription()
  const [isDragging, setIsDragging] = useState(false)
  const [uploadedFile, setUploadedFile] = useState(null)
  const [password, setPassword] = useState('')
  const [isProcessing, setIsProcessing] = useState(false)
  const [processingProgress, setProcessingProgress] = useState(0)
  const [processingStage, setProcessingStage] = useState('')
  const [isVisible, setIsVisible] = useState(false)
  const [conversionComplete, setConversionComplete] = useState(false)
  const [showPasswordInput, setShowPasswordInput] = useState(false)

  useEffect(() => {
    setIsVisible(true)
    trackPageViewOnce(window.location.href, 'PDF Password Remover Online Free - RobotPDF').catch(err => console.error('Failed to track:', err))
    const script = document.createElement('script')
    script.type = 'application/ld+json'
    script.text = JSON.stringify({ "@context": "https://schema.org", "@type": "SoftwareApplication", "name": "PDF Password Remover", "applicationCategory": "BusinessApplication", "operatingSystem": "Web Browser", "offers": { "@type": "Offer", "price": "0", "priceCurrency": "USD" }, "aggregateRating": { "@type": "AggregateRating", "ratingValue": "4.7", "ratingCount": "8920" } })
    document.head.appendChild(script)
    return () => { document.head.removeChild(script) }
  }, [])

  const handleDragOver = useCallback((e) => { e.preventDefault(); setIsDragging(true) }, [])
  const handleDragLeave = useCallback((e) => { e.preventDefault(); setIsDragging(false) }, [])
  const handleDrop = useCallback((e) => {
    e.preventDefault(); setIsDragging(false)
    const files = Array.from(e.dataTransfer.files)
    if (files.length > 0 && files[0].type === 'application/pdf') { setUploadedFile(files[0]); setShowPasswordInput(true) }
    else { toast.error('Please upload a PDF file') }
  }, [])
  const handleFileSelect = (e) => {
    const file = e.target.files?.[0]
    if (file && file.type === 'application/pdf') { setUploadedFile(file); setShowPasswordInput(true) }
    else { toast.error('Please select a PDF file') }
  }
  const resetConverter = () => { setUploadedFile(null); setPassword(''); setIsProcessing(false); setProcessingProgress(0); setProcessingStage(''); setConversionComplete(false); setShowPasswordInput(false) }

  const handleRemovePassword = async () => {
    if (!uploadedFile || !password) { toast.error('Please enter the PDF password'); return }
    if (user && session && usage && usage.current >= usage.limit && subscription?.plan === 'free') { toast.error('Monthly limit reached.'); return }
    setIsProcessing(true); setConversionComplete(false); setProcessingProgress(10); setProcessingStage('Uploading PDF...')
    try {
      const uploadResponse = await api.uploadFile(uploadedFile)
      const fileId = uploadResponse.file.id
      setProcessingProgress(40); setProcessingStage('Verifying password...')
      await new Promise(resolve => setTimeout(resolve, 500))
      setProcessingProgress(60); setProcessingStage('Removing password protection...')
      const result = await api.post('/pdf/advanced/password-remove', { fileId, password, outputName: `unlocked_${Date.now()}.pdf` })
      setProcessingProgress(90); setProcessingStage('Preparing download...')
      if (result?.file?.id) {
        const blob = await api.downloadFile(result.file.id)
        setProcessingProgress(100); setProcessingStage('Download ready!'); setConversionComplete(true)
        downloadBlob(blob, result.file.filename || 'unlocked.pdf')
        toast.success('Password removed successfully!')
        trackToolUsage('password-remover', 'Password Remover').catch(err => console.error('Failed to track:', err))
      }
      setTimeout(() => resetConverter(), 3000)
    } catch (error) {
      console.error('Error:', error)
      if (error.message.includes('password') || error.message.includes('decrypt')) { toast.error('Incorrect password. Please try again.') }
      else { toast.error(error.message || 'Failed to remove password.') }
      setIsProcessing(false); setProcessingProgress(0); setProcessingStage('')
    }
  }

  const features = [{ icon: Unlock, title: 'Remove Password', desc: 'Unlock protected PDFs' }, { icon: Zap, title: 'Lightning Fast', desc: 'Unlock in seconds' }, { icon: Shield, title: '100% Secure', desc: 'Files auto-deleted' }, { icon: CheckCircle, title: 'Full Access', desc: 'Edit, print, copy' }]
  const useCases = [{ icon: Building2, title: 'Old Documents', desc: 'Unlock forgotten passwords' }, { icon: Briefcase, title: 'Work Files', desc: 'Access protected docs' }, { icon: GraduationCap, title: 'Academic', desc: 'Unlock study materials' }, { icon: FileText, title: 'Archives', desc: 'Access old files' }]


  return (
    <div className="min-h-screen bg-gradient-to-b from-white via-amber-50/30 to-white overflow-hidden">
      <div className="fixed inset-0 overflow-hidden pointer-events-none"><div className="absolute -top-40 -left-40 w-[600px] h-[600px] bg-gradient-to-br from-amber-100/40 to-orange-100/40 rounded-full blur-3xl"></div><div className="absolute top-40 -right-40 w-[500px] h-[500px] bg-gradient-to-br from-amber-100/30 to-yellow-100/30 rounded-full blur-3xl"></div></div>
      <section className="relative pt-6 sm:pt-8 md:pt-12 lg:pt-16 pb-6 sm:pb-8 md:pb-12 px-3 sm:px-4 md:px-6">
        <div className="container mx-auto max-w-6xl">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8 lg:gap-12 items-center">
            <div className={`text-center lg:text-left transition-all duration-700 ${isVisible ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-10'}`}>
              <Badge className="mb-4 sm:mb-6 px-3 sm:px-4 py-1.5 bg-gradient-to-r from-amber-500 to-orange-500 text-white text-xs sm:text-sm font-semibold inline-flex items-center"><Sparkles className="h-3 w-3 sm:h-4 sm:w-4 mr-1.5" />UNLOCK PDFs • FREE</Badge>
              <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-5xl font-bold mb-4 sm:mb-6 leading-tight"><span className="bg-gradient-to-r from-slate-900 via-amber-900 to-slate-900 bg-clip-text text-transparent">PDF Password</span><br /><span className="bg-gradient-to-r from-amber-600 to-orange-600 bg-clip-text text-transparent">Remover Online</span></h1>
              <p className="text-base sm:text-lg text-slate-600 mb-6 sm:mb-8 leading-relaxed max-w-lg mx-auto lg:mx-0">Remove password protection from your PDFs. Unlock documents for editing, printing, and copying. Free, fast & secure.</p>
              <div className="flex flex-wrap items-center justify-center lg:justify-start gap-4 sm:gap-6 text-xs sm:text-sm text-slate-500 mb-6"><div className="flex items-center gap-2"><CheckCircle className="h-4 w-4 sm:h-5 sm:w-5 text-amber-500" /><span>No registration</span></div><div className="flex items-center gap-2"><Shield className="h-4 w-4 sm:h-5 sm:w-5 text-amber-500" /><span>Secure & Private</span></div><div className="flex items-center gap-2"><Zap className="h-4 w-4 sm:h-5 sm:w-5 text-amber-500" /><span>Instant download</span></div></div>
            </div>
            <div className={`transition-all duration-700 delay-200 ${isVisible ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-10'}`}>
              <div onDragOver={handleDragOver} onDragLeave={handleDragLeave} onDrop={handleDrop} onClick={() => !isProcessing && !showPasswordInput && document.getElementById('pdf-upload').click()} className={`relative bg-white rounded-2xl sm:rounded-3xl p-6 sm:p-8 lg:p-10 border-2 border-dashed transition-all duration-300 cursor-pointer shadow-xl hover:shadow-2xl ${isDragging ? 'border-amber-500 bg-amber-50/50 scale-[1.02]' : conversionComplete ? 'border-amber-400 bg-amber-50/30' : 'border-amber-200 hover:border-amber-400'} ${isProcessing ? 'pointer-events-none' : ''}`}>
                <input id="pdf-upload" type="file" accept=".pdf" onChange={handleFileSelect} className="hidden" disabled={isProcessing} />
                {isProcessing ? (<div className="text-center py-4"><div className="relative w-20 h-20 sm:w-24 sm:h-24 mx-auto mb-4 sm:mb-6"><svg className="w-full h-full transform -rotate-90"><circle cx="50%" cy="50%" r="45%" stroke="#e5e7eb" strokeWidth="8" fill="none" /><circle cx="50%" cy="50%" r="45%" stroke="url(#gradientPwd)" strokeWidth="8" fill="none" strokeLinecap="round" strokeDasharray={`${processingProgress * 2.83} 283`} className="transition-all duration-500" /><defs><linearGradient id="gradientPwd" x1="0%" y1="0%" x2="100%" y2="0%"><stop offset="0%" stopColor="#f59e0b" /><stop offset="100%" stopColor="#f97316" /></linearGradient></defs></svg><div className="absolute inset-0 flex items-center justify-center"><span className="text-lg sm:text-xl font-bold text-amber-600">{processingProgress}%</span></div></div><p className="text-base sm:text-lg font-semibold text-slate-800 mb-2">{processingStage}</p><div className="flex justify-center gap-1 mt-4">{[1, 2, 3, 4, 5].map((step) => (<div key={step} className={`w-2 h-2 rounded-full transition-all duration-300 ${processingProgress >= step * 20 ? 'bg-amber-500' : processingProgress >= (step - 1) * 20 ? 'bg-amber-300 animate-pulse' : 'bg-gray-200'}`} />))}</div><p className="text-xs text-slate-400 mt-2">{processingProgress < 25 ? 'Uploading...' : processingProgress < 50 ? 'Decrypting...' : processingProgress < 75 ? 'Removing password...' : processingProgress < 90 ? 'Finalizing...' : 'Complete!'}</p></div>
                ) : conversionComplete ? (<div className="text-center py-4"><div className="w-16 h-16 sm:w-20 sm:h-20 mx-auto mb-4 bg-amber-100 rounded-full flex items-center justify-center"><CheckCircle className="h-8 w-8 sm:h-10 sm:w-10 text-amber-600" /></div><p className="text-lg sm:text-xl font-semibold text-amber-700 mb-2">Password Removed!</p><p className="text-sm text-slate-500 mb-4">Your unlocked PDF has been downloaded</p><Button onClick={(e) => { e.stopPropagation(); resetConverter(); }} variant="outline" className="border-amber-300 text-amber-700 hover:bg-amber-50"><RefreshCw className="h-4 w-4 mr-2" /> Unlock Another</Button></div>
                ) : showPasswordInput ? (<div className="text-center" onClick={(e) => e.stopPropagation()}><div className="w-16 h-16 mx-auto mb-4 bg-amber-100 rounded-full flex items-center justify-center"><Lock className="h-8 w-8 text-amber-600" /></div><p className="text-lg font-semibold text-slate-800 mb-2">{uploadedFile?.name}</p><p className="text-sm text-slate-500 mb-4">Enter the PDF password to unlock</p><input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Enter PDF password" className="w-full px-4 py-3 border-2 border-amber-200 rounded-xl focus:border-amber-500 focus:outline-none text-slate-700 mb-4" /><div className="flex gap-2 justify-center"><Button onClick={resetConverter} variant="outline" className="border-amber-300">Cancel</Button><Button onClick={handleRemovePassword} className="bg-gradient-to-r from-amber-600 to-orange-600 text-white"><Unlock className="h-4 w-4 mr-2" /> Unlock PDF</Button></div></div>
                ) : (<div className="text-center"><div className="w-16 h-16 sm:w-20 sm:h-20 mx-auto mb-4 sm:mb-6 bg-gradient-to-br from-amber-500 to-orange-600 rounded-2xl flex items-center justify-center shadow-lg"><FileUp className="h-8 w-8 sm:h-10 sm:w-10 text-white" /></div><h3 className="text-lg sm:text-xl font-semibold text-slate-800 mb-2">Drop your locked PDF here</h3><p className="text-sm sm:text-base text-slate-500 mb-4 sm:mb-6">or click to browse files</p><Button size="lg" className="w-full sm:w-auto px-6 sm:px-8 py-3 sm:py-4 text-base font-semibold bg-gradient-to-r from-amber-600 to-orange-600 text-white hover:shadow-lg transition-all rounded-xl"><Upload className="mr-2 h-4 w-4 sm:h-5 sm:w-5" /> Select PDF File</Button><p className="text-xs sm:text-sm text-slate-400 mt-4">You must know the password to unlock</p></div>)}
              </div>
            </div>
          </div>
        </div>
      </section>
      <section className="py-8 sm:py-10 md:py-16 px-3 sm:px-4 md:px-6 bg-gradient-to-r from-amber-50 via-orange-50 to-yellow-50"><div className="container mx-auto max-w-6xl"><div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 md:gap-6">{features.map((feature, index) => (<div key={index} className="text-center p-2 sm:p-3"><div className="inline-flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 bg-white rounded-lg sm:rounded-xl md:rounded-2xl shadow-md mb-2 sm:mb-3 md:mb-4"><feature.icon className="h-4 w-4 sm:h-5 sm:w-5 md:h-6 md:w-6 text-amber-600" /></div><div className="text-xs sm:text-sm md:text-base font-semibold text-slate-900">{feature.title}</div><div className="text-[10px] sm:text-xs md:text-sm text-slate-500">{feature.desc}</div></div>))}</div></div></section>
      <section className="py-10 sm:py-12 md:py-20 px-3 sm:px-4 md:px-6"><div className="container mx-auto max-w-5xl"><div className="text-center mb-6 sm:mb-8 md:mb-12"><Badge className="mb-2 sm:mb-3 md:mb-4 px-3 sm:px-4 py-1.5 bg-gradient-to-r from-amber-100 to-orange-100 text-amber-700 text-xs sm:text-sm font-semibold">SIMPLE PROCESS</Badge><h2 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold text-slate-900">How to Remove PDF Password</h2></div><div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6 md:gap-8">{[{ step: '1', title: 'Upload PDF', desc: 'Select your password-protected PDF file', icon: Upload },{ step: '2', title: 'Enter Password', desc: 'Type the current password to verify access', icon: Lock },{ step: '3', title: 'Download Unlocked', desc: 'Get your unlocked PDF without restrictions', icon: Download }].map((item, index) => (<div key={index} className="relative bg-white rounded-lg sm:rounded-xl md:rounded-2xl p-4 sm:p-5 md:p-6 border-2 border-amber-100 hover:border-amber-300 hover:shadow-xl transition-all group"><div className="absolute -top-2 -left-2 sm:-top-3 sm:-left-3 w-6 h-6 sm:w-8 sm:h-8 md:w-10 md:h-10 bg-gradient-to-br from-amber-500 to-orange-600 rounded-full flex items-center justify-center text-white text-xs sm:text-sm font-bold shadow-lg">{item.step}</div><div className="w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 bg-amber-50 rounded-lg sm:rounded-xl flex items-center justify-center mb-3 sm:mb-4 group-hover:scale-110 transition-transform"><item.icon className="h-4 w-4 sm:h-5 sm:w-5 md:h-6 md:w-6 text-amber-600" /></div><h3 className="text-sm sm:text-base md:text-lg font-semibold text-slate-900 mb-1 sm:mb-2">{item.title}</h3><p className="text-xs sm:text-sm text-slate-600">{item.desc}</p></div>))}</div></div></section>
      <section className="py-10 sm:py-12 md:py-20 px-3 sm:px-4 md:px-6 bg-gradient-to-b from-slate-50 to-white"><div className="container mx-auto max-w-5xl"><div className="text-center mb-6 sm:mb-8 md:mb-12"><h2 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold text-slate-900">Perfect for Every Use Case</h2></div><div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-6">{useCases.map((item, index) => (<div key={index} className="bg-white rounded-lg sm:rounded-xl md:rounded-2xl p-3 sm:p-4 md:p-6 border-2 border-gray-100 hover:border-amber-200 hover:shadow-lg transition-all text-center group"><div className="w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 bg-amber-50 rounded-lg sm:rounded-xl flex items-center justify-center mx-auto mb-2 sm:mb-3 md:mb-4 group-hover:scale-110 transition-transform"><item.icon className="h-4 w-4 sm:h-5 sm:w-5 md:h-6 md:w-6 text-amber-600" /></div><h3 className="text-xs sm:text-sm md:text-base font-semibold text-slate-900 mb-1">{item.title}</h3><p className="text-[10px] sm:text-xs md:text-sm text-slate-500">{item.desc}</p></div>))}</div></div></section>
      <section className="py-10 sm:py-12 md:py-20 px-3 sm:px-4 md:px-6"><div className="container mx-auto max-w-4xl"><div className="text-center mb-6 sm:mb-8 md:mb-12"><Badge className="mb-2 sm:mb-3 md:mb-4 px-3 sm:px-4 py-1.5 bg-gradient-to-r from-amber-100 to-orange-100 text-amber-700 text-xs sm:text-sm font-semibold">FAQ</Badge><h2 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold text-slate-900 mb-2 sm:mb-3">Frequently Asked Questions</h2></div><div className="space-y-2 sm:space-y-3 md:space-y-4">{[{ q: 'Can I remove a password I don\'t know?', a: 'No, you must know the current password to unlock the PDF. This tool removes the password requirement, not cracks it.' },{ q: 'Is this legal?', a: 'Yes, as long as you have the right to access the document. This tool is for unlocking your own files.' },{ q: 'What restrictions are removed?', a: 'All restrictions including printing, copying, and editing are removed from the unlocked PDF.' }].map((item, index) => (<div key={index} className="bg-white rounded-lg sm:rounded-xl md:rounded-2xl p-3 sm:p-4 md:p-6 border border-gray-200 hover:border-amber-200 hover:shadow-md transition-all"><h3 className="text-xs sm:text-sm md:text-base font-semibold text-slate-900 mb-1 sm:mb-2 flex items-start gap-1.5 sm:gap-2"><span className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 bg-amber-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5"><span className="text-amber-600 text-[10px] sm:text-xs font-bold">?</span></span>{item.q}</h3><p className="text-[10px] sm:text-xs md:text-sm text-slate-600 pl-5 sm:pl-7 md:pl-8">{item.a}</p></div>))}</div></div></section>
      <section className="py-8 sm:py-10 md:py-16 px-3 sm:px-4 md:px-6 bg-gradient-to-r from-amber-50 via-orange-50 to-yellow-50"><div className="container mx-auto max-w-5xl"><div className="text-center mb-6 sm:mb-8 md:mb-10"><h2 className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold text-slate-900 mb-2">Trusted by 50,000+ Users</h2><div className="flex items-center justify-center gap-1 mb-3 sm:mb-4">{[...Array(5)].map((_, i) => (<Star key={i} className="h-3 w-3 sm:h-4 sm:w-4 md:h-5 md:w-5 fill-yellow-400 text-yellow-400" />))}<span className="ml-2 text-xs sm:text-sm text-slate-600">4.7/5 rating</span></div></div><div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 md:gap-6">{[{ text: "Finally unlocked my old tax documents. Lifesaver!", author: "Robert M.", role: "Accountant" },{ text: "Simple and effective. Works exactly as described.", author: "Jennifer L.", role: "Admin" },{ text: "Unlocked files I couldn't access for years.", author: "Steve K.", role: "Archivist" }].map((item, index) => (<div key={index} className="bg-white rounded-lg sm:rounded-xl md:rounded-2xl p-3 sm:p-4 md:p-6 border border-gray-200 shadow-sm"><div className="flex gap-1 mb-2 sm:mb-3">{[...Array(5)].map((_, i) => (<Star key={i} className="h-3 w-3 sm:h-4 sm:w-4 fill-yellow-400 text-yellow-400" />))}</div><p className="text-[10px] sm:text-xs md:text-sm text-slate-600 mb-2 sm:mb-3">"{item.text}"</p><p className="text-[10px] sm:text-xs md:text-sm font-semibold text-slate-900">— {item.author}, <span className="font-normal text-slate-500">{item.role}</span></p></div>))}</div></div></section>
      <section className="py-10 sm:py-12 md:py-20 px-3 sm:px-4 md:px-6"><div className="container mx-auto max-w-5xl"><div className="text-center mb-6 sm:mb-8 md:mb-10"><h2 className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold text-slate-900 mb-2">Related PDF Tools</h2></div><div className="grid grid-cols-2 md:grid-cols-4 gap-2 sm:gap-3 md:gap-4">{[{ to: '/merge-pdf', icon: Combine, title: 'Merge PDF', color: 'text-blue-600', bg: 'bg-blue-50' },{ to: '/compress-pdf', icon: FileText, title: 'Compress PDF', color: 'text-orange-600', bg: 'bg-orange-50' },{ to: '/pdf-to-word', icon: FileText, title: 'PDF to Word', color: 'text-indigo-600', bg: 'bg-indigo-50' },{ to: '/pdf-to-excel', icon: Table2, title: 'PDF to Excel', color: 'text-green-600', bg: 'bg-green-50' }].map((item, index) => (<Link key={index} to={item.to} className="bg-white rounded-lg sm:rounded-xl p-3 sm:p-4 md:p-5 border-2 border-gray-100 hover:border-amber-200 hover:shadow-lg transition-all text-center group"><div className={`w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 ${item.bg} rounded-lg sm:rounded-xl flex items-center justify-center mx-auto mb-1.5 sm:mb-2 md:mb-3 group-hover:scale-110 transition-transform`}><item.icon className={`h-4 w-4 sm:h-5 sm:w-5 md:h-6 md:w-6 ${item.color}`} /></div><span className="text-xs sm:text-sm font-medium text-slate-700">{item.title}</span></Link>))}</div></div></section>
    </div>
  )
}

export default PasswordRemover
