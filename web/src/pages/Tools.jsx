import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { trackPageViewOnce } from '../lib/visitorTracking'
import {
  Combine, Scissors, Minimize2, ImagePlus, Globe, FileOutput, FileInput,
  Table2, Sheet, Unlock, Type, ImageDown, Layers, Sparkles, CheckCircle,
  Zap, Shield, ArrowRight, Star
} from 'lucide-react'

const Tools = () => {
  const [selectedCategory, setSelectedCategory] = useState('All')

  useEffect(() => {
    trackPageViewOnce(window.location.href, 'PDF Tools - RobotPDF')
      .then(result => {
        if (result) console.log('Visitor tracked:', result.isNewVisitor ? 'New visitor' : 'Returning visitor')
      })
      .catch(err => console.error('Failed to track visitor:', err))
  }, [])

  const tools = [
    { id: 'merge', icon: Combine, title: 'Merge PDFs', description: 'Combine multiple PDF files into one document', path: '/merge-pdf', solidColor: 'bg-blue-600', category: 'Basic', isFree: true, processingTime: '< 30s' },
    { id: 'split', icon: Scissors, title: 'Split PDF', description: 'Extract specific pages or split into multiple files', path: '/split-pdf', solidColor: 'bg-emerald-600', category: 'Basic', isFree: true, processingTime: '< 45s' },
    { id: 'compress', icon: Minimize2, title: 'Compress PDF', description: 'Reduce file size while maintaining quality', path: '/compress-pdf', solidColor: 'bg-orange-600', category: 'Optimization', isFree: true, processingTime: '< 60s' },
    { id: 'convert', icon: ImagePlus, title: 'Image to PDF', description: 'Convert images (JPG, PNG, GIF) to PDF', path: '/image-to-pdf', solidColor: 'bg-cyan-600', category: 'Conversion', isFree: true, processingTime: '< 90s' },
    { id: 'html-to-pdf', icon: Globe, title: 'HTML to PDF', description: 'Convert webpage URL to PDF', path: '/html-to-pdf', solidColor: 'bg-teal-600', category: 'Conversion', isFree: true, processingTime: '< 60s' },
    { id: 'pdf-to-word', icon: FileOutput, title: 'PDF to Word', description: 'Convert PDF files to editable Word documents', path: '/pdf-to-word', solidColor: 'bg-blue-700', category: 'Conversion', isFree: true, processingTime: '< 60s' },
    { id: 'word-to-pdf', icon: FileInput, title: 'Word to PDF', description: 'Convert Word documents to PDF format', path: '/word-to-pdf', solidColor: 'bg-indigo-600', category: 'Conversion', isFree: false, processingTime: '< 60s' },
    { id: 'pdf-to-excel', icon: Table2, title: 'PDF to Excel', description: 'Convert PDF files to Excel spreadsheets', path: '/pdf-to-excel', solidColor: 'bg-emerald-700', category: 'Conversion', isFree: true, processingTime: '< 60s' },
    { id: 'excel-to-pdf', icon: Sheet, title: 'Excel to PDF', description: 'Convert Excel spreadsheets to PDF format', path: '/excel-to-pdf', solidColor: 'bg-green-600', category: 'Conversion', isFree: false, processingTime: '< 60s' },

    { id: 'pdf-to-pptx', icon: Layers, title: 'PDF to PowerPoint', description: 'Convert PDF to editable PPTX format', path: '/tools#pdf-to-pptx', solidColor: 'bg-orange-600', category: 'Conversion', isFree: true, processingTime: '< 90s' },
    { id: 'password-remove', icon: Unlock, title: 'Password Remover', description: 'Remove password protection from your PDFs', path: '/password-remover', solidColor: 'bg-amber-600', category: 'Security', isFree: true, processingTime: '< 45s' },
    { id: 'text-to-pdf', icon: Type, title: 'Text to PDF', description: 'Type or paste text to convert into PDF documents', path: '/text-to-pdf', solidColor: 'bg-violet-600', category: 'Conversion', isFree: true, processingTime: '< 30s' },
    { id: 'image-compress', icon: ImageDown, title: 'Image Compressor', description: 'Compress images to 50% size with fixed quality', path: '/image-compress', solidColor: 'bg-pink-600', category: 'Optimization', isFree: true, processingTime: '< 45s' }
  ]

  const categories = ['All', 'Basic', 'Optimization', 'Conversion', 'Security']
  const filteredTools = selectedCategory === 'All' ? tools : tools.filter(tool => tool.category === selectedCategory)

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-indigo-50/30">
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-indigo-200/30 to-purple-200/30 rounded-full blur-3xl"></div>
        <div className="absolute top-1/2 -left-40 w-80 h-80 bg-gradient-to-br from-blue-200/20 to-cyan-200/20 rounded-full blur-3xl"></div>
      </div>

      <div className="relative z-10 container mx-auto px-4 py-8 max-w-7xl">

        {/* Category Filter */}
        <div className="flex flex-wrap justify-center gap-2 mb-8">
          {categories.map((category) => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              className={`px-5 py-2.5 rounded-xl text-sm font-medium transition-all duration-300 ${
                selectedCategory === category
                  ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg shadow-indigo-500/25'
                  : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200'
              }`}
            >
              {category}
            </button>
          ))}
        </div>

        {/* Tools Grid - Original Card Design */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-4 mb-12">
          {filteredTools.map((tool, index) => (
            <Link
              key={tool.id}
              to={tool.path}
              className="group relative bg-white rounded-xl overflow-hidden cursor-pointer transition-all duration-300 hover:-translate-y-1 hover:shadow-lg shadow-md hover:shadow-indigo-100"
              style={{ animation: `fadeInUp 0.4s ease-out ${index * 0.03}s both` }}
            >
              {/* Colored Header */}
              <div className={`p-3 sm:p-4 ${tool.solidColor}`}>
                <div className="flex items-center gap-2 sm:gap-3">
                  <div className="p-2 bg-white/20 rounded-lg group-hover:scale-105 transition-transform">
                    <tool.icon className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
                  </div>
                  <h3 className="text-sm sm:text-base font-semibold text-white flex-1 line-clamp-2 leading-tight">{tool.title}</h3>
                </div>
              </div>
              {/* Card Body */}
              <div className="p-3 sm:p-4">
                <p className="text-slate-600 text-xs sm:text-sm leading-snug mb-2 line-clamp-2" title={tool.description}>
                  {tool.description}
                </p>
                <div className="flex items-center justify-between">
                  <span className={`text-[10px] sm:text-xs font-medium px-1.5 py-0.5 rounded flex items-center gap-1 ${
                    tool.isFree 
                      ? 'text-green-600 bg-green-50' 
                      : 'text-purple-600 bg-purple-50'
                  }`}>
                    {tool.isFree ? (
                      <><CheckCircle className="h-2.5 w-2.5" />FREE</>
                    ) : (
                      <><Star className="h-2.5 w-2.5" />PRO</>
                    )}
                  </span>
                  <span className="text-[10px] sm:text-xs text-slate-400">{tool.processingTime}</span>
                </div>
              </div>
            </Link>
          ))}
        </div>

        {/* Header */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-indigo-500/10 to-purple-500/10 rounded-full mb-6">
            <Sparkles className="h-5 w-5 text-indigo-600" />
            <span className="text-sm font-semibold text-indigo-700">Free PDF Tools</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-slate-900 via-indigo-900 to-slate-800 bg-clip-text text-transparent">
            All-in-One PDF Toolkit
          </h1>
          <p className="text-lg text-slate-600 max-w-2xl mx-auto mb-6">
            Professional PDF tools to merge, split, compress, and convert your documents.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-6 text-sm text-slate-500">
            <div className="flex items-center gap-2"><CheckCircle className="h-5 w-5 text-green-500" /><span>No registration</span></div>
            <div className="flex items-center gap-2"><Shield className="h-5 w-5 text-blue-500" /><span>Secure & Private</span></div>
            <div className="flex items-center gap-2"><Zap className="h-5 w-5 text-yellow-500" /><span>Instant processing</span></div>
          </div>
        </div>

        {/* AI Tools CTA */}
        <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-700 rounded-2xl p-8 md:p-10 text-center text-white">
          <Sparkles className="h-10 w-10 mx-auto mb-4 opacity-80" />
          <h2 className="text-2xl md:text-3xl font-bold mb-3">Need AI-Powered Features?</h2>
          <p className="text-indigo-100 mb-6 max-w-xl mx-auto">
            Unlock powerful AI features like OCR, document chat, smart summaries, and batch processing.
          </p>
          <Link
            to="/advanced-tools"
            className="inline-flex items-center px-6 py-3 bg-white text-indigo-600 font-semibold rounded-xl hover:bg-indigo-50 transition-colors"
          >
            Explore AI Tools
            <ArrowRight className="h-5 w-5 ml-2" />
          </Link>
        </div>
      </div>

      <style>{`
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  )
}

export default Tools
