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
import { ImageDown, Upload, Download, CheckCircle, FileText, Zap, Shield, Building2, GraduationCap, Briefcase, Star, RefreshCw, Sparkles, Combine, Minimize2 } from 'lucide-react'

const ImageCompress = () => {
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
    trackPageViewOnce(window.location.href, 'Image Compressor Online Free - RobotPDF').catch(err => console.error('Failed to track:', err))
    const script = document.createElement('script')
    script.type = 'application/ld+json'
    script.text = JSON.stringify({ "@context": "https://schema.org", "@type": "SoftwareApplication", "name": "Image Compressor", "applicationCategory": "BusinessApplication", "operatingSystem": "Web Browser", "offers": { "@type": "Offer", "price": "0", "priceCurrency": "USD" }, "aggregateRating": { "@type": "AggregateRating", "ratingValue": "4.8", "ratingCount": "11200" } })
    document.head.appendChild(script)
    return () => { document.head.removeChild(script) }
  }, [])

  const handleDragOver = useCallback((e) => { e.preventDefault(); setIsDragging(true) }, [])
  const handleDragLeave = useCallback((e) => { e.preventDefault(); setIsDragging(false) }, [])

  const handleDrop = useCallback((e) => {
    e.preventDefault(); setIsDragging(false)
    const files = Array.from(e.dataTransfer.files).filter(f => f.type.startsWith('image/'))
    if (files.length > 0) { setUploadedFiles(files); handleCompress(files) }
    else toast.error('Please upload image files (JPG, PNG, WebP)')
  }, [])

  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files).filter(f => f.type.startsWith('image/'))
    if (files.length > 0) { setUploadedFiles(files); handleCompress(files) }
    else toast.error('Please select image files')
  }

  const resetConverter = () => { setUploadedFiles([]); setIsProcessing(false); setProcessingProgress(0); setProcessingStage(''); setConversionComplete(false) }

  const handleCompress = async (files) => {
    if (!files.length) return
    if (user && session && usage && usage.current >= usage.limit && subscription?.plan === 'free') { toast.error('Monthly limit reached.'); return }
    setIsProcessing(true); setConversionComplete(false); setProcessingProgress(10); setProcessingStage('Uploading images...')
    try {
      const uploadedFileIds = []
      for (let i = 0; i < files.length; i++) {
        setProcessingProgress(10 + (i / files.length) * 30); setProcessingStage(`Uploading ${i + 1}/${files.length}...`)
        const response = await api.uploadFile(files[i])
        uploadedFileIds.push(response.file.id)
      }
      setProcessingProgress(50); setProcessingStage('Compressing images...')
      const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'
      const response = await fetch(`${API_BASE_URL}/pdf/compress-images`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${session?.access_token || localStorage.getItem('auth_session') && JSON.parse(localStorage.getItem('auth_session')).access_token}` },
        body: JSON.stringify({ fileIds: uploadedFileIds, quality: 50, outputName: `compressed-images-${Date.now()}.zip` })
      })
      if (!response.ok) throw new Error('Compression failed')
      setProcessingProgress(90); setProcessingStage('Preparing download...')
      const blob = await response.blob()
      setProcessingProgress(100); setProcessingStage('Download ready!'); setConversionComplete(true)
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a'); a.href = url; a.download = `compressed-images-${Date.now()}.zip`; a.click()
      window.URL.revokeObjectURL(url)
      toast.success('Images compressed successfully!')
      trackToolUsage('image-compress', 'Image Compressor').catch(err => console.error('Failed to track:', err))
      setTimeout(() => resetConverter(), 3000)
    } catch (error) { console.error('Compression error:', error); toast.error(error.message || 'Compression failed.'); resetConverter() }
  }

  const features = [{ icon: ImageDown, title: '50% Smaller', desc: 'Reduce file size by half' }, { icon: Zap, title: 'Lightning Fast', desc: 'Compress in seconds' }, { icon: Shield, title: '100% Secure', desc: 'Files auto-deleted' }, { icon: CheckCircle, title: 'Quality Preserved', desc: 'Smart compression' }]
  const useCases = [{ icon: Building2, title: 'Websites', desc: 'Faster page loads' }, { icon: Briefcase, title: 'Email', desc: 'Smaller attachments' }, { icon: GraduationCap, title: 'Storage', desc: 'Save disk space' }, { icon: FileText, title: 'Social Media', desc: 'Quick uploads' }]

  return (
    <div className="min-h-screen bg-gradient-to-b from-white via-pink-50/30 to-white overflow-hidden">
      <div className="fixed inset-0 overflow-hidden pointer-events-none"><div className="absolute -top-40 -left-40 w-[600px] h-[600px] bg-gradient-to-br from-pink-100/40 to-rose-100/40 rounded-full blur-3xl"></div><div className="absolute top-40 -right-40 w-[500px] h-[500px] bg-gradient-to-br from-pink-100/30 to-red-100/30 rounded-full blur-3xl"></div></div>
      <section className="relative pt-6 sm:pt-8 md:pt-12 lg:pt-16 pb-6 sm:pb-8 md:pb-12 px-3 sm:px-4 md:px-6">
        <div className="container mx-auto max-w-6xl">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8 lg:gap-12 items-center">
            <div className={`text-center lg:text-left transition-all duration-700 ${isVisible ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-10'}`}>
              <Badge className="mb-4 sm:mb-6 px-3 sm:px-4 py-1.5 bg-gradient-to-r from-pink-500 to-rose-500 text-white text-xs sm:text-sm font-semibold inline-flex items-center"><Sparkles className="h-3 w-3 sm:h-4 sm:w-4 mr-1.5" />50% SMALLER • FREE</Badge>
              <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-5xl font-bold mb-4 sm:mb-6 leading-tight"><span className="bg-gradient-to-r from-slate-900 via-pink-900 to-slate-900 bg-clip-text text-transparent">Image</span><br /><span className="bg-gradient-to-r from-pink-600 to-rose-600 bg-clip-text text-transparent">Compressor Online</span></h1>
              <p className="text-base sm:text-lg text-slate-600 mb-6 sm:mb-8 leading-relaxed max-w-lg mx-auto lg:mx-0">Compress JPG, PNG, WebP images to 50% of original size while maintaining quality. Free, fast & secure.</p>
              <div className="flex flex-wrap items-center justify-center lg:justify-start gap-4 sm:gap-6 text-xs sm:text-sm text-slate-500 mb-6"><div className="flex items-center gap-2"><CheckCircle className="h-4 w-4 sm:h-5 sm:w-5 text-pink-500" /><span>No registration</span></div><div className="flex items-center gap-2"><Shield className="h-4 w-4 sm:h-5 sm:w-5 text-pink-500" /><span>Secure & Private</span></div><div className="flex items-center gap-2"><Zap className="h-4 w-4 sm:h-5 sm:w-5 text-pink-500" /><span>Instant download</span></div></div>
            </div>
            <div className={`transition-all duration-700 delay-200 ${isVisible ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-10'}`}>
              <div onDragOver={handleDragOver} onDragLeave={handleDragLeave} onDrop={handleDrop} onClick={() => !isProcessing && document.getElementById('image-upload').click()} className={`relative bg-white rounded-2xl sm:rounded-3xl p-6 sm:p-8 lg:p-10 border-2 border-dashed transition-all duration-300 cursor-pointer shadow-xl hover:shadow-2xl ${isDragging ? 'border-pink-500 bg-pink-50/50 scale-[1.02]' : conversionComplete ? 'border-pink-400 bg-pink-50/30' : 'border-pink-200 hover:border-pink-400'} ${isProcessing ? 'pointer-events-none' : ''}`}>
                <input id="image-upload" type="file" accept="image/*" multiple onChange={handleFileSelect} className="hidden" disabled={isProcessing} />
                {isProcessing ? (<div className="text-center py-4"><div className="relative w-20 h-20 sm:w-24 sm:h-24 mx-auto mb-4 sm:mb-6"><svg className="w-full h-full transform -rotate-90"><circle cx="50%" cy="50%" r="45%" stroke="#e5e7eb" strokeWidth="8" fill="none" /><circle cx="50%" cy="50%" r="45%" stroke="url(#gradientImg)" strokeWidth="8" fill="none" strokeLinecap="round" strokeDasharray={`${processingProgress * 2.83} 283`} className="transition-all duration-500" /><defs><linearGradient id="gradientImg" x1="0%" y1="0%" x2="100%" y2="0%"><stop offset="0%" stopColor="#ec4899" /><stop offset="100%" stopColor="#f43f5e" /></linearGradient></defs></svg><div className="absolute inset-0 flex items-center justify-center"><span className="text-lg sm:text-xl font-bold text-pink-600">{processingProgress}%</span></div></div><p className="text-base sm:text-lg font-semibold text-slate-800 mb-2">{processingStage}</p><p className="text-sm text-slate-500">{uploadedFiles.length} image(s)</p><div className="flex justify-center gap-1 mt-4">{[1, 2, 3, 4, 5].map((step) => (<div key={step} className={`w-2 h-2 rounded-full transition-all duration-300 ${processingProgress >= step * 20 ? 'bg-pink-500' : processingProgress >= (step - 1) * 20 ? 'bg-pink-300 animate-pulse' : 'bg-gray-200'}`} />))}</div><p className="text-xs text-slate-400 mt-2">{processingProgress < 25 ? 'Uploading...' : processingProgress < 50 ? 'Analyzing...' : processingProgress < 75 ? 'Compressing...' : processingProgress < 90 ? 'Packaging...' : 'Complete!'}</p></div>
                ) : conversionComplete ? (<div className="text-center py-4"><div className="w-16 h-16 sm:w-20 sm:h-20 mx-auto mb-4 bg-pink-100 rounded-full flex items-center justify-center"><CheckCircle className="h-8 w-8 sm:h-10 sm:w-10 text-pink-600" /></div><p className="text-lg sm:text-xl font-semibold text-pink-700 mb-2">Compression Complete!</p><p className="text-sm text-slate-500 mb-4">Your images have been downloaded</p><Button onClick={(e) => { e.stopPropagation(); resetConverter() }} variant="outline" className="border-pink-300 text-pink-700 hover:bg-pink-50"><RefreshCw className="h-4 w-4 mr-2" /> Compress More</Button></div>
                ) : (<div className="text-center"><div className="w-16 h-16 sm:w-20 sm:h-20 mx-auto mb-4 sm:mb-6 bg-gradient-to-br from-pink-500 to-rose-600 rounded-2xl flex items-center justify-center shadow-lg"><ImageDown className="h-8 w-8 sm:h-10 sm:w-10 text-white" /></div><h3 className="text-lg sm:text-xl font-semibold text-slate-800 mb-2">Drop your images here</h3><p className="text-sm sm:text-base text-slate-500 mb-4 sm:mb-6">or click to browse files</p><Button size="lg" className="w-full sm:w-auto px-6 sm:px-8 py-3 sm:py-4 text-base font-semibold bg-gradient-to-r from-pink-600 to-rose-600 text-white hover:shadow-lg transition-all rounded-xl"><Upload className="mr-2 h-4 w-4 sm:h-5 sm:w-5" /> Select Images</Button><p className="text-xs sm:text-sm text-slate-400 mt-4">JPG, PNG, WebP • Multiple files supported</p></div>)}
              </div>
            </div>
          </div>
        </div>
      </section>
      <section className="py-10 sm:py-16 px-4 sm:px-6 bg-gradient-to-r from-pink-50 via-rose-50 to-red-50"><div className="container mx-auto max-w-6xl"><div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">{features.map((feature, index) => (<div key={index} className="text-center"><div className="inline-flex items-center justify-center w-12 h-12 sm:w-14 sm:h-14 bg-white rounded-xl sm:rounded-2xl shadow-md mb-3 sm:mb-4"><feature.icon className="h-5 w-5 sm:h-6 sm:w-6 text-pink-600" /></div><div className="text-sm sm:text-base font-semibold text-slate-900">{feature.title}</div><div className="text-xs sm:text-sm text-slate-500">{feature.desc}</div></div>))}</div></div></section>
      <section className="py-12 sm:py-20 px-4 sm:px-6"><div className="container mx-auto max-w-5xl"><div className="text-center mb-8 sm:mb-12"><Badge className="mb-3 sm:mb-4 px-3 sm:px-4 py-1.5 bg-gradient-to-r from-pink-100 to-rose-100 text-pink-700 text-xs sm:text-sm font-semibold">SIMPLE PROCESS</Badge><h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-slate-900">How to Compress Images</h2></div><div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">{[{ step: '1', title: 'Upload Images', desc: 'Drag & drop or select your images', icon: Upload },{ step: '2', title: 'Auto Compress', desc: 'We compress to 50% size automatically', icon: Sparkles },{ step: '3', title: 'Download', desc: 'Get your compressed images as ZIP', icon: Download }].map((item, index) => (<div key={index} className="relative bg-white rounded-xl sm:rounded-2xl p-5 sm:p-6 border-2 border-pink-100 hover:border-pink-300 hover:shadow-xl transition-all group"><div className="absolute -top-3 -left-3 w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-pink-500 to-rose-600 rounded-full flex items-center justify-center text-white font-bold shadow-lg">{item.step}</div><div className="w-12 h-12 sm:w-14 sm:h-14 bg-pink-50 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform"><item.icon className="h-5 w-5 sm:h-6 sm:w-6 text-pink-600" /></div><h3 className="text-base sm:text-lg font-semibold text-slate-900 mb-2">{item.title}</h3><p className="text-sm text-slate-600">{item.desc}</p></div>))}</div></div></section>
      <section className="py-12 sm:py-20 px-4 sm:px-6 bg-gradient-to-b from-slate-50 to-white"><div className="container mx-auto max-w-5xl"><div className="text-center mb-8 sm:mb-12"><h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-slate-900">Perfect for Every Use Case</h2></div><div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">{useCases.map((item, index) => (<div key={index} className="bg-white rounded-xl sm:rounded-2xl p-4 sm:p-6 border-2 border-gray-100 hover:border-pink-200 hover:shadow-lg transition-all text-center group"><div className="w-12 h-12 sm:w-14 sm:h-14 bg-pink-50 rounded-xl flex items-center justify-center mx-auto mb-3 sm:mb-4 group-hover:scale-110 transition-transform"><item.icon className="h-5 w-5 sm:h-6 sm:w-6 text-pink-600" /></div><h3 className="text-sm sm:text-base font-semibold text-slate-900 mb-1">{item.title}</h3><p className="text-xs sm:text-sm text-slate-500">{item.desc}</p></div>))}</div></div></section>
      <section className="py-12 sm:py-20 px-4 sm:px-6"><div className="container mx-auto max-w-4xl"><div className="text-center mb-8 sm:mb-12"><Badge className="mb-3 sm:mb-4 px-3 sm:px-4 py-1.5 bg-gradient-to-r from-pink-100 to-rose-100 text-pink-700 text-xs sm:text-sm font-semibold">FAQ</Badge><h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-slate-900 mb-3">Frequently Asked Questions</h2></div><div className="space-y-3 sm:space-y-4">{[{ q: 'How much will my images be compressed?', a: 'Images are compressed to approximately 50% of their original size while maintaining good visual quality.' },{ q: 'What image formats are supported?', a: 'We support JPG, JPEG, PNG, WebP, GIF, and BMP formats. All compressed images maintain their original format.' },{ q: 'Is there a limit on file size or number of images?', a: 'You can compress multiple images at once. Each image can be up to 10MB for free users.' }].map((item, index) => (<div key={index} className="bg-white rounded-xl sm:rounded-2xl p-4 sm:p-6 border border-gray-200 hover:border-pink-200 hover:shadow-md transition-all"><h3 className="text-sm sm:text-base font-semibold text-slate-900 mb-2 flex items-start gap-2"><span className="w-5 h-5 sm:w-6 sm:h-6 bg-pink-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5"><span className="text-pink-600 text-xs font-bold">?</span></span>{item.q}</h3><p className="text-xs sm:text-sm text-slate-600 pl-7 sm:pl-8">{item.a}</p></div>))}</div></div></section>
      <section className="py-10 sm:py-16 px-4 sm:px-6 bg-gradient-to-r from-pink-50 via-rose-50 to-red-50"><div className="container mx-auto max-w-5xl"><div className="text-center mb-8 sm:mb-10"><h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-slate-900 mb-2">Trusted by 50,000+ Users</h2><div className="flex items-center justify-center gap-1 mb-4">{[...Array(5)].map((_, i) => (<Star key={i} className="h-4 w-4 sm:h-5 sm:w-5 fill-yellow-400 text-yellow-400" />))}<span className="ml-2 text-sm text-slate-600">4.8/5 rating</span></div></div><div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">{[{ text: "Compressed 100+ images in minutes. Amazing tool!", author: "David K.", role: "Photographer" },{ text: "Perfect for optimizing website images. Fast and easy.", author: "Emma R.", role: "Web Developer" },{ text: "Saves so much storage space. Use it daily!", author: "Frank L.", role: "Designer" }].map((item, index) => (<div key={index} className="bg-white rounded-xl sm:rounded-2xl p-4 sm:p-6 border border-gray-200 shadow-sm"><div className="flex gap-1 mb-3">{[...Array(5)].map((_, i) => (<Star key={i} className="h-3 w-3 sm:h-4 sm:w-4 fill-yellow-400 text-yellow-400" />))}</div><p className="text-xs sm:text-sm text-slate-600 mb-3">"{item.text}"</p><p className="text-xs sm:text-sm font-semibold text-slate-900">— {item.author}, <span className="font-normal text-slate-500">{item.role}</span></p></div>))}</div></div></section>
      <section className="py-12 sm:py-20 px-4 sm:px-6"><div className="container mx-auto max-w-5xl"><div className="text-center mb-8 sm:mb-10"><h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-slate-900 mb-2">Related Tools</h2></div><div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">{[{ to: '/compress-pdf', icon: Minimize2, title: 'Compress PDF', color: 'text-orange-600', bg: 'bg-orange-50' },{ to: '/image-to-pdf', icon: FileText, title: 'Image to PDF', color: 'text-cyan-600', bg: 'bg-cyan-50' },{ to: '/merge-pdf', icon: Combine, title: 'Merge PDF', color: 'text-blue-600', bg: 'bg-blue-50' },{ to: '/pdf-to-word', icon: FileText, title: 'PDF to Word', color: 'text-indigo-600', bg: 'bg-indigo-50' }].map((item, index) => (<Link key={index} to={item.to} className="bg-white rounded-xl p-4 sm:p-5 border-2 border-gray-100 hover:border-pink-200 hover:shadow-lg transition-all text-center group"><div className={`w-10 h-10 sm:w-12 sm:h-12 ${item.bg} rounded-xl flex items-center justify-center mx-auto mb-2 sm:mb-3 group-hover:scale-110 transition-transform`}><item.icon className={`h-5 w-5 sm:h-6 sm:w-6 ${item.color}`} /></div><span className="text-sm font-medium text-slate-700">{item.title}</span></Link>))}</div></div></section>
    </div>
  )
}

export default ImageCompress
