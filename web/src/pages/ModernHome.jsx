import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { Button } from '../components/ui/button'
import { Badge } from '../components/ui/badge'
import { 
  FileText, 
  GitMerge, 
  Scissors, 
  Archive,
  ArrowRight,
  CheckCircle,
  Sparkles,
  Rocket,
  Brain,
  MessageSquare,
  Wand2,
  Scan,
  Zap,
  Shield,
  Globe,
  Star,
  Users,
  TrendingUp,
  Play,
  Download,
  Upload,
  Lock,
  ChevronRight
} from 'lucide-react'

const ModernHome = () => {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    setIsVisible(true)
  }, [])

  const mainTools = [
    {
      icon: Scan,
      title: 'Advanced OCR',
      description: 'Extract text from images with 99% accuracy using AI',
      color: 'from-blue-500 to-cyan-500',
      bgColor: 'bg-blue-50',
      iconColor: 'text-blue-600'
    },
    {
      icon: MessageSquare,
      title: 'Chat with PDF',
      description: 'Ask questions and get instant answers from your documents',
      color: 'from-purple-500 to-indigo-500',
      bgColor: 'bg-purple-50',
      iconColor: 'text-purple-600'
    },
    {
      icon: GitMerge,
      title: 'Merge & Split',
      description: 'Combine multiple PDFs or extract specific pages',
      color: 'from-emerald-500 to-teal-500',
      bgColor: 'bg-emerald-50',
      iconColor: 'text-emerald-600'
    },
    {
      icon: Wand2,
      title: 'AI Summarize',
      description: 'Get intelligent summaries of long documents instantly',
      color: 'from-orange-500 to-red-500',
      bgColor: 'bg-orange-50',
      iconColor: 'text-orange-600'
    }
  ]

  const features = [
    {
      icon: Shield,
      title: 'Enterprise Security',
      description: 'Bank-level encryption for all your documents'
    },
    {
      icon: Zap,
      title: 'Lightning Fast',
      description: 'Process PDFs in seconds, not minutes'
    },
    {
      icon: Brain,
      title: 'AI-Powered',
      description: 'Advanced AI for intelligent document processing'
    }
  ]

  const stats = [
    { number: '5K+', label: 'Active Users', icon: Users },
    { number: '10K+', label: 'PDFs Processed', icon: FileText },
    { number: '99.9%', label: 'Uptime', icon: TrendingUp },
    { number: '4.8/5', label: 'User Rating', icon: Star }
  ]

  return (
    <div className="min-h-screen bg-gradient-to-b from-white via-slate-50 to-white overflow-hidden">
      {/* Subtle Background Effects */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -left-40 w-[600px] h-[600px] bg-gradient-to-br from-indigo-100/30 to-purple-100/30 rounded-full blur-3xl"></div>
        <div className="absolute top-40 -right-40 w-[500px] h-[500px] bg-gradient-to-br from-blue-100/30 to-cyan-100/30 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-40 left-1/4 w-[700px] h-[700px] bg-gradient-to-br from-purple-100/20 to-pink-100/20 rounded-full blur-3xl"></div>
      </div>

      {/* Hero Section */}
      <section className="relative pt-20 pb-16 px-4 sm:px-6">
        <div className="container mx-auto max-w-6xl">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left Column - Content */}
            <div className={`transition-all duration-1000 ${
              isVisible ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-10'
            }`}>
              {/* Badge */}
              <Badge className="mb-6 px-4 py-1.5 bg-gradient-to-r from-indigo-500 to-purple-500 text-white text-sm font-semibold inline-flex items-center">
                <Sparkles className="h-4 w-4 mr-2" />
                AI-POWERED PLATFORM
              </Badge>
              
              {/* Main Heading */}
              <h1 className="text-5xl sm:text-6xl lg:text-6xl font-bold mb-6 leading-tight">
                <span className="bg-gradient-to-r from-slate-900 via-indigo-900 to-slate-900 bg-clip-text text-transparent">
                  Transform Your PDFs
                </span>
                <br />
                <span className="bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                  with AI Magic
                </span>
              </h1>
              
              {/* Description */}
              <p className="text-lg text-slate-600 mb-8 leading-relaxed">
                Experience the future of document management. Merge, split, convert, 
                and chat with your PDFs using cutting-edge AI technology.
              </p>
              
              {/* CTA Buttons */}
              <div className="flex flex-wrap gap-4 mb-8">
                <Button
                  onClick={() => navigate('/tools')}
                  size="lg"
                  className="px-8 py-6 text-lg font-semibold bg-gradient-to-r from-indigo-600 to-purple-600 text-white hover:shadow-xl transition-all hover:scale-105 rounded-xl"
                >
                  <Rocket className="mr-2 h-5 w-5" />
                  {user ? 'Go to Tools' : 'Start Free'}
                </Button>
                <Button
                  onClick={() => navigate('/register')}
                  variant="outline"
                  size="lg"
                  className="px-8 py-6 text-lg font-semibold border-2 border-gray-300 hover:border-indigo-300 hover:bg-indigo-50 rounded-xl transition-all"
                >
                  Sign Up
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </div>
              
              {/* Trust Indicators */}
              <div className="flex items-center gap-6 text-sm text-slate-500">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-green-500" />
                  <span>No credit card required</span>
                </div>
                <div className="flex items-center gap-2">
                  <Shield className="h-5 w-5 text-blue-500" />
                  <span>Secure & Private</span>
                </div>
              </div>
            </div>

            {/* Right Column - Visual */}
            <div className={`relative transition-all duration-1000 delay-300 ${
              isVisible ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-10'
            }`}>
              {/* Floating Cards */}
              <div className="relative h-[500px]">
                {/* Main Card */}
                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-80 h-48 bg-white rounded-2xl shadow-2xl border border-gray-200 p-6 hover:scale-105 transition-transform">
                  <div className="flex items-start justify-between mb-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center">
                      <FileText className="h-6 w-6 text-white" />
                    </div>
                    <Badge className="bg-green-100 text-green-700 text-xs">Active</Badge>
                  </div>
                  <h3 className="font-semibold text-slate-900 mb-2">Document.pdf</h3>
                  <p className="text-sm text-slate-500">Processing with AI...</p>
                  <div className="mt-4 h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full" style={{ width: '75%' }}></div>
                  </div>
                </div>

                {/* Floating Feature Cards */}
                <div className="absolute top-0 left-0 w-48 h-28 bg-white/90 backdrop-blur rounded-xl shadow-lg border border-gray-200/50 p-4 animate-float">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                      <Scan className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <div className="text-xs font-semibold text-slate-900">OCR Complete</div>
                      <div className="text-xs text-slate-500">99% accuracy</div>
                    </div>
                  </div>
                </div>

                <div className="absolute bottom-0 right-0 w-48 h-28 bg-white/90 backdrop-blur rounded-xl shadow-lg border border-gray-200/50 p-4 animate-float" style={{ animationDelay: '1s' }}>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                      <MessageSquare className="h-5 w-5 text-purple-600" />
                    </div>
                    <div>
                      <div className="text-xs font-semibold text-slate-900">AI Chat Ready</div>
                      <div className="text-xs text-slate-500">Ask anything</div>
                    </div>
                  </div>
                </div>

                <div className="absolute top-1/4 right-0 w-48 h-28 bg-white/90 backdrop-blur rounded-xl shadow-lg border border-gray-200/50 p-4 animate-float" style={{ animationDelay: '2s' }}>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center">
                      <CheckCircle className="h-5 w-5 text-emerald-600" />
                    </div>
                    <div>
                      <div className="text-xs font-semibold text-slate-900">Processed</div>
                      <div className="text-xs text-slate-500">2.3s completion</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 px-4 sm:px-6 bg-gradient-to-r from-indigo-50 via-purple-50 to-pink-50">
        <div className="container mx-auto max-w-6xl">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <div key={index} className="text-center">
                <div className="inline-flex items-center justify-center w-12 h-12 bg-white rounded-xl shadow-md mb-4">
                  <stat.icon className="h-6 w-6 text-indigo-600" />
                </div>
                <div className="text-3xl font-bold text-slate-900">{stat.number}</div>
                <div className="text-sm text-slate-600">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Main Tools Section */}
      <section className="py-20 px-4 sm:px-6">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-12">
            <Badge className="mb-4 px-4 py-1.5 bg-gradient-to-r from-indigo-100 to-purple-100 text-indigo-700 text-sm font-semibold">
              POWERFUL FEATURES
            </Badge>
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">
              Everything You Need in One Platform
            </h2>
            <p className="text-lg text-slate-600 max-w-2xl mx-auto">
              From basic PDF operations to advanced AI-powered features
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {mainTools.map((tool, index) => (
              <div
                key={index}
                className="group bg-white rounded-2xl p-6 border-2 border-gray-200 hover:border-indigo-300 hover:shadow-xl transition-all duration-300 cursor-pointer"
                onClick={() => navigate(user ? '/tools' : '/register')}
              >
                <div className={`w-14 h-14 ${tool.bgColor} rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                  <tool.icon className={`h-7 w-7 ${tool.iconColor}`} />
                </div>
                <h3 className="text-lg font-semibold text-slate-900 mb-2">
                  {tool.title}
                </h3>
                <p className="text-sm text-slate-600 mb-4">
                  {tool.description}
                </p>
                <div className="flex items-center text-indigo-600 font-medium text-sm group-hover:gap-3 transition-all">
                  Learn more
                  <ChevronRight className="h-4 w-4 ml-1 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4 sm:px-6 bg-gradient-to-b from-slate-50 to-white">
        <div className="container mx-auto max-w-6xl">
          <div className="grid md:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <div key={index} className="text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-2xl mb-4">
                  <feature.icon className="h-8 w-8 text-indigo-600" />
                </div>
                <h3 className="text-xl font-semibold text-slate-900 mb-2">
                  {feature.title}
                </h3>
                <p className="text-slate-600">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      
    </div>
  )
}

export default ModernHome
