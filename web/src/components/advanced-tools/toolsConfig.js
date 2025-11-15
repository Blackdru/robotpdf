import {
  Eye,
  MessageSquare,
  Sparkles,
  GitMerge,
  Scissors,
  Archive,
  Lock,
  Award,
  Upload,
  Brain,
  FileText,
  Users,
  CheckCircle,
  TrendingUp,
  Zap,
  Shield,
  Download,
  FileSpreadsheet,
  FileType,
  Wand2
} from 'lucide-react'

export const proTools = [
  {
    id: 'ai-resume-generator',
    icon: Wand2,
    title: 'AI Resume Generator',
    description: 'Create professional, ATS-optimized resumes from scratch with advanced AI',
    solidColor: 'bg-gradient-to-br from-violet-600 to-purple-600',
    color: 'from-violet-500 to-purple-700',
    acceptedFiles: '',
    multipleFiles: false,
    minFiles: 0,
    category: 'AI-Powered',
    popularity: 99,
    processingTime: '< 45s',
    features: ['AI-powered generation', 'Multiple templates', 'ATS optimization', 'Industry-specific content'],
    isGenerator: true
  },
  {
    id: 'advanced-ocr',
    icon: Eye,
    title: 'Advanced OCR Pro',
    description: 'AI-powered text extraction with 99.9% accuracy and multi-language support',
    solidColor: 'bg-cyan-600',
    color: 'from-cyan-500 to-blue-700',
    acceptedFiles: '.pdf,.jpg,.jpeg,.png',
    multipleFiles: false,
    minFiles: 1,
    category: 'AI-Powered',
    popularity: 98,
    processingTime: '< 60s',
    features: ['Multi-language OCR', 'AI enhancement', 'Entity extraction', 'Confidence scoring']
  },
  {
    id: 'ai-chat',
    icon: MessageSquare,
    title: 'AI Document Chat',
    description: 'Intelligent conversations with your PDFs and images using advanced AI',
    solidColor: 'bg-gradient-to-br from-pink-600 to-purple-600',
    color: 'from-pink-500 to-purple-700',
    acceptedFiles: '.pdf,.jpg,.jpeg,.png,.gif,.bmp,.webp,.tiff,.tif',
    multipleFiles: false,
    minFiles: 1,
    category: 'AI-Powered',
    popularity: 95,
    processingTime: '< 30s',
    features: ['GPT-4 powered', 'Context awareness', 'Smart summaries', 'Multi-turn conversations']
  },
  {
    id: 'smart-summary',
    icon: Sparkles,
    title: 'Smart Summary Pro',
    description: 'AI-generated summaries with key insights and sentiment analysis',
    solidColor: 'bg-gradient-to-br from-amber-500 to-orange-600',
    color: 'from-yellow-500 to-orange-700',
    acceptedFiles: '.pdf',
    multipleFiles: false,
    minFiles: 1,
    category: 'AI-Powered',
    popularity: 92,
    processingTime: '< 45s',
    features: ['Key insights', 'Sentiment analysis', 'Entity recognition', 'Executive summaries']
  },
  {
    id: 'pro-merge',
    icon: GitMerge,
    title: 'Pro Merge',
    description: 'Advanced PDF merging with bookmarks and professional options',
    solidColor: 'bg-indigo-600',
    color: 'from-blue-500 to-indigo-700',
    acceptedFiles: '.pdf',
    multipleFiles: true,
    minFiles: 2,
    category: 'Professional',
    popularity: 89,
    processingTime: '< 90s',
    features: ['Auto bookmarks', 'Page numbering', 'Title pages', 'Print optimization']
  },
  {
    id: 'precision-split',
    icon: Scissors,
    title: 'Precision Split',
    description: 'Advanced PDF splitting with custom ranges and batch processing',
    solidColor: 'bg-emerald-600',
    color: 'from-green-500 to-emerald-700',
    acceptedFiles: '.pdf',
    multipleFiles: false,
    minFiles: 1,
    category: 'Professional',
    popularity: 87,
    processingTime: '< 75s',
    features: ['Custom ranges', 'Batch processing', 'Smart naming', 'Quality preservation']
  },
  {
    id: 'smart-compress',
    icon: Archive,
    title: 'Smart Compress Pro',
    description: 'Intelligent compression with quality control and optimization',
    solidColor: 'bg-purple-600',
    color: 'from-purple-500 to-violet-700',
    acceptedFiles: '.pdf',
    multipleFiles: true,
    minFiles: 1,
    category: 'Professional',
    popularity: 91,
    processingTime: '< 120s',
    features: ['Quality control', 'Image optimization', 'Size prediction', 'Batch processing']
  },
  {
    id: 'password-protect',
    icon: Lock,
    title: 'Password Protect',
    description: 'Military-grade encryption with advanced security features',
    solidColor: 'bg-gradient-to-br from-rose-600 to-pink-600',
    color: 'from-red-500 to-pink-700',
    acceptedFiles: '.pdf',
    multipleFiles: true,
    minFiles: 1,
    category: 'Security',
    popularity: 85,
    processingTime: '< 60s',
    features: ['AES-256 encryption', 'Password protection', 'Permission control', 'Audit trails']
  },
  {
    id: 'images-to-pdf',
    icon: Upload,
    title: 'Images to PDF Pro',
    description: 'Convert multiple images to professional PDF with advanced settings',
    solidColor: 'bg-teal-600',
    color: 'from-emerald-500 to-teal-700',
    acceptedFiles: '.jpg,.jpeg,.png,.gif,.bmp,.webp',
    multipleFiles: true,
    minFiles: 1,
    category: 'Professional',
    popularity: 88,
    processingTime: '< 60s',
    features: ['Multiple formats', 'Custom page size', 'Quality control', 'Auto orientation']
  },
  {
    id: 'pdf-to-office',
    icon: FileSpreadsheet,
    title: 'PDF to Office Converter',
    description: 'Convert PDF to DOC, DOCX, Excel, PowerPoint with 100% accuracy',
    solidColor: 'bg-blue-700',
    color: 'from-indigo-500 to-blue-700',
    acceptedFiles: '.pdf',
    multipleFiles: true,
    minFiles: 1,
    category: 'Professional',
    popularity: 96,
    processingTime: '< 90s',
    features: ['Word conversion', 'Excel extraction', 'PowerPoint export', 'Format preservation']
  },
  {
    id: 'office-to-pdf',
    icon: FileType,
    title: 'Office to PDF Converter',
    description: 'Convert Word, Excel, PowerPoint to PDF with 100% accuracy',
    solidColor: 'bg-gradient-to-br from-orange-600 to-red-600',
    color: 'from-orange-500 to-red-700',
    acceptedFiles: '.doc,.docx,.xls,.xlsx,.ppt,.pptx,.rtf,.odt,.txt',
    multipleFiles: true,
    minFiles: 1,
    category: 'Professional',
    popularity: 96,
    processingTime: '< 90s',
    features: ['Word to PDF', 'Excel to PDF', 'PowerPoint to PDF', 'Format preservation']
  },
  {
    id: 'advanced-html-to-pdf',
    icon: FileText,
    title: 'Advanced HTML to PDF',
    description: 'Convert webpages or HTML files to PDF with custom settings',
    solidColor: 'bg-cyan-700',
    color: 'from-teal-500 to-cyan-700',
    acceptedFiles: '.html,.htm',
    multipleFiles: false,
    minFiles: 0,
    category: 'Professional',
    popularity: 82,
    processingTime: '< 60s',
    requiresUrl: true,
    features: ['Full page capture', 'Custom page size', 'Header/Footer', 'Background graphics']
  }
]

export const PROCESSING_STEPS_CONFIG = {
  'ai-resume-generator': [
    { name: 'Analyzing Input', icon: Brain },
    { name: 'AI Generation', icon: Wand2 },
    { name: 'Optimizing Content', icon: Sparkles },
    { name: 'Formatting Resume', icon: FileText },
    { name: 'Complete', icon: CheckCircle }
  ],
  'advanced-ocr': [
    { name: 'Uploading File', icon: Upload },
    { name: 'AI Enhancement', icon: Brain },
    { name: 'Text Extraction', icon: Eye },
    { name: 'Entity Detection', icon: Users },
    { name: 'Complete', icon: CheckCircle }
  ],
  'ai-chat': [
    { name: 'Uploading File', icon: Upload },
    { name: 'Text Processing', icon: FileText },
    { name: 'Creating Embeddings', icon: Brain },
    { name: 'AI Initialization', icon: MessageSquare },
    { name: 'Complete', icon: CheckCircle }
  ],
  'smart-summary': [
    { name: 'Uploading File', icon: Upload },
    { name: 'Text Analysis', icon: Brain },
    { name: 'Generating Summary', icon: Sparkles },
    { name: 'Sentiment Analysis', icon: TrendingUp },
    { name: 'Entity Extraction', icon: Users },
    { name: 'Complete', icon: CheckCircle }
  ],
  'pro-merge': [
    { name: 'Uploading Files', icon: Upload },
    { name: 'Processing PDFs', icon: FileText },
    { name: 'Merging Documents', icon: GitMerge },
    { name: 'Optimizing Output', icon: Zap },
    { name: 'Complete', icon: CheckCircle }
  ],
  'precision-split': [
    { name: 'Uploading File', icon: Upload },
    { name: 'Analyzing Structure', icon: Eye },
    { name: 'Splitting Pages', icon: Scissors },
    { name: 'Creating Archive', icon: Archive },
    { name: 'Complete', icon: CheckCircle }
  ],
  'smart-compress': [
    { name: 'Uploading Files', icon: Upload },
    { name: 'Analyzing Content', icon: Eye },
    { name: 'Optimizing Images', icon: TrendingUp },
    { name: 'Compressing PDFs', icon: Archive },
    { name: 'Complete', icon: CheckCircle }
  ],
  'password-protect': [
    { name: 'Uploading Files', icon: Upload },
    { name: 'Generating Keys', icon: Shield },
    { name: 'Applying Encryption', icon: Lock },
    { name: 'Security Verification', icon: CheckCircle },
    { name: 'Complete', icon: Download }
  ],
  'password-remove': [
    { name: 'Uploading Files', icon: Upload },
    { name: 'Verifying Password', icon: Shield },
    { name: 'Removing Protection', icon: Lock },
    { name: 'Complete', icon: CheckCircle }
  ],
  'images-to-pdf': [
    { name: 'Uploading Images', icon: Upload },
    { name: 'Processing Images', icon: Eye },
    { name: 'Creating PDF', icon: FileText },
    { name: 'Optimizing', icon: Zap },
    { name: 'Complete', icon: CheckCircle }
  ],
  'pdf-to-office': [
    { name: 'Uploading PDF', icon: Upload },
    { name: 'Analyzing Structure', icon: Brain },
    { name: 'Extracting Content', icon: Eye },
    { name: 'Converting Format', icon: FileSpreadsheet },
    { name: 'Optimizing Output', icon: Zap },
    { name: 'Complete', icon: CheckCircle }
  ],
  'office-to-pdf': [
    { name: 'Uploading Files', icon: Upload },
    { name: 'Analyzing Content', icon: Brain },
    { name: 'Processing Document', icon: FileText },
    { name: 'Converting to PDF', icon: FileType },
    { name: 'Optimizing Output', icon: Zap },
    { name: 'Complete', icon: CheckCircle }
  ],
  'advanced-html-to-pdf': [
    { name: 'Fetching URL', icon: Upload },
    { name: 'Rendering Page', icon: Eye },
    { name: 'Applying Settings', icon: Zap },
    { name: 'Creating PDF', icon: FileText },
    { name: 'Complete', icon: CheckCircle }
  ]
}