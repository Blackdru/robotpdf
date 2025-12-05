import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Book, Code, Server, Key, Zap, Shield, Search, ArrowLeft, BarChart3, 
  Copy, Check, AlertTriangle, Info, ChevronDown, ChevronRight, 
  FileText, Image, MessageSquare, Scissors, Merge, FileOutput,
  RefreshCw, Clock, Globe, Lock, Database
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { trackPageViewOnce } from '../lib/visitorTracking';
import toast from 'react-hot-toast';

const DeveloperDocs = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeSection, setActiveSection] = useState('getting-started');
  const [expandedEndpoint, setExpandedEndpoint] = useState(null);
  const [copiedCode, setCopiedCode] = useState(null);
  const [selectedPlatform, setSelectedPlatform] = useState('curl');

  const sections = [
    { id: 'getting-started', title: 'Getting Started', icon: Zap },
    { id: 'authentication', title: 'Authentication', icon: Key },
    { id: 'rate-limits', title: 'Rate Limits & Quotas', icon: Clock },
    { id: 'endpoints', title: 'API Endpoints', icon: Server },
    { id: 'file-handling', title: 'Handling File Responses', icon: FileOutput },
    { id: 'error-codes', title: 'Error Codes', icon: AlertTriangle },
    { id: 'examples', title: 'Code Examples', icon: Code },
    { id: 'sdks', title: 'SDKs & Libraries', icon: Database },
    { id: 'security', title: 'Security', icon: Shield }
  ];

  const BASE_URL = 'https://api.robotpdf.com/api/v1';

  // Comprehensive endpoint documentation
  const endpoints = [
    {
      category: 'Health & Usage',
      icon: BarChart3,
      items: [
        {
          method: 'GET',
          path: '/health',
          title: 'Health Check',
          description: 'Verify API connectivity and authentication status',
          auth: true,
          requestBody: null,
          queryParams: null,
          responseExample: {
            success: true,
            status: 'ok',
            version: '1.0.0',
            timestamp: '2024-12-04T10:30:00.000Z',
            developer: {
              id: 'uuid-here',
              name: 'My App'
            }
          }
        },
        {
          method: 'GET',
          path: '/usage',
          title: 'Usage Statistics',
          description: 'Get your current API usage, limits, and per-tool breakdown',
          auth: true,
          requestBody: null,
          queryParams: null,
          responseExample: {
            success: true,
            data: {
              monthly_limit: 1000,
              current_month_used: 150,
              remaining: 850,
              rate_limit_per_minute: 100,
              current_month: '2024-12',
              tools: [
                { tool_name: 'ocr_pro', usage_count: 50, last_used_at: '2024-12-04T10:00:00Z' },
                { tool_name: 'summarize', usage_count: 30, last_used_at: '2024-12-04T09:30:00Z' }
              ]
            }
          }
        }
      ]
    },
    {
      category: 'OCR & Text Extraction',
      icon: FileText,
      items: [
        {
          method: 'POST',
          path: '/ocr',
          title: 'OCR Pro - Extract Text',
          description: 'Extract text from images and PDFs with AI enhancement. Supports multiple languages and image preprocessing.',
          auth: true,
          contentType: 'multipart/form-data',
          requestBody: {
            file: { type: 'File', required: true, description: 'PDF or image file (JPEG, PNG, TIFF, BMP, WebP)' },
            language: { type: 'string', required: false, default: 'auto', description: 'Language code: auto, eng, hin, tel, spa, fra, deu, etc.' },
            enhance_image: { type: 'boolean', required: false, default: 'true', description: 'Apply image preprocessing for better accuracy' },
            ai_enhanced: { type: 'boolean', required: false, default: 'true', description: 'Use AI to correct OCR errors and improve formatting' },
            extract_original: { type: 'boolean', required: false, default: 'false', description: 'Also return raw OCR output before AI enhancement' }
          },
          responseExample: {
            success: true,
            data: {
              text: 'Extracted and enhanced text content...',
              original_text: 'Raw OCR output (if extract_original=true)',
              enhanced_text: 'AI-enhanced text',
              detected_language: 'eng',
              confidence: 0.95,
              page_count: 3,
              pages: [
                { page: 1, text: 'Page 1 content...' }
              ],
              ai_enhanced: true,
              processing_options: {
                language: 'auto',
                enhance_image: true
              }
            }
          },
          limits: {
            maxFileSize: '100MB',
            supportedFormats: ['PDF', 'JPEG', 'PNG', 'TIFF', 'BMP', 'WebP']
          }
        }
      ]
    },
    {
      category: 'AI Features',
      icon: MessageSquare,
      items: [
        {
          method: 'POST',
          path: '/chat',
          title: 'AI Document Chat',
          description: 'Have an AI-powered conversation about your document content. Ask questions, get summaries, or extract specific information.',
          auth: true,
          contentType: 'application/json',
          requestBody: {
            document_text: { type: 'string', required: true, description: 'The document text to chat about (max 10,000 characters per request)' },
            message: { type: 'string', required: true, description: 'Your question or prompt' },
            context: { type: 'array', required: false, default: '[]', description: 'Previous conversation messages for context' }
          },
          responseExample: {
            success: true,
            data: {
              response: 'Based on the document, the main points are...',
              model: 'gpt-4'
            }
          }
        },
        {
          method: 'POST',
          path: '/summarize',
          title: 'Smart Summary Pro',
          description: 'Generate intelligent summaries of text content with different summary styles.',
          auth: true,
          contentType: 'application/json',
          requestBody: {
            text: { type: 'string', required: true, description: 'Text content to summarize' },
            summary_type: { type: 'string', required: false, default: 'auto', description: 'Summary style: auto, brief, detailed, bullet_points, executive' }
          },
          responseExample: {
            success: true,
            data: {
              summary: 'A concise summary of the document...',
              word_count: 150,
              summary_type: 'brief'
            }
          }
        }
      ]
    },
    {
      category: 'PDF Operations',
      icon: FileOutput,
      items: [
        {
          method: 'POST',
          path: '/compress',
          title: 'Smart Compress Pro',
          description: 'Compress PDF files while maintaining quality. Choose compression level based on your needs.',
          auth: true,
          contentType: 'multipart/form-data',
          requestBody: {
            file: { type: 'File', required: true, description: 'PDF file to compress' },
            quality: { type: 'string', required: false, default: 'medium', description: 'Compression quality: low, medium, high' }
          },
          responseExample: {
            success: true,
            data: {
              original_size: 5242880,
              compressed_size: 1048576,
              compression_ratio: '80.00%',
              file_base64: 'JVBERi0xLjQK...'
            }
          },
          notes: 'Response includes base64-encoded compressed PDF. Decode and save to get the file.'
        },
        {
          method: 'POST',
          path: '/merge',
          title: 'Merge PDFs',
          description: 'Combine multiple PDF files into a single document. Files are merged in the order provided.',
          auth: true,
          contentType: 'multipart/form-data',
          requestBody: {
            files: { type: 'File[]', required: true, description: 'Array of PDF files to merge (2-10 files)' }
          },
          responseExample: {
            success: true,
            data: {
              file_count: 3,
              file_size: 2097152,
              file_base64: 'JVBERi0xLjQK...'
            }
          },
          limits: {
            minFiles: 2,
            maxFiles: 10,
            maxTotalSize: '100MB'
          }
        },
        {
          method: 'POST',
          path: '/split',
          title: 'Split PDF',
          description: 'Extract specific pages from a PDF document or split into individual page PDFs returned as a ZIP file.',
          auth: true,
          contentType: 'multipart/form-data',
          requestBody: {
            file: { type: 'File', required: true, description: 'PDF file to split' },
            pages: { type: 'string', required: true, description: 'Page specification: "1-3,5,7-9", "1,3,5", or "all" for all pages' },
            split_mode: { type: 'string', required: false, default: 'single', description: 'Split mode: "single" (one PDF with selected pages) or "individual" (separate PDF per page as ZIP)' }
          },
          responseExample: {
            success: true,
            data: {
              page_count: 5,
              file_count: 5,
              file_size: 524288,
              format: 'zip',
              file_base64: 'UEsDBBQAAAAI...'
            }
          },
          notes: 'When split_mode="individual" or pages="all", returns a ZIP file containing individual PDFs for each page. Otherwise returns a single PDF with selected pages.'
        },
        {
          method: 'POST',
          path: '/images-to-pdf',
          title: 'Images to PDF Pro',
          description: 'Convert multiple images into a single PDF document with customizable page settings.',
          auth: true,
          contentType: 'multipart/form-data',
          requestBody: {
            files: { type: 'File[]', required: true, description: 'Image files to convert (1-10 images)' },
            page_size: { type: 'string', required: false, default: 'A4', description: 'Page size: A4, Letter, Legal, A3, A5' },
            orientation: { type: 'string', required: false, default: 'portrait', description: 'Page orientation: portrait, landscape' }
          },
          responseExample: {
            success: true,
            data: {
              page_count: 5,
              file_size: 1048576,
              file_base64: 'JVBERi0xLjQK...'
            }
          },
          limits: {
            maxFiles: 10,
            supportedFormats: ['JPEG', 'PNG', 'TIFF', 'BMP', 'WebP']
          }
        }
      ]
    },
    {
      category: 'Document Conversion',
      icon: RefreshCw,
      items: [
        {
          method: 'POST',
          path: '/convert/pdf-to-docx',
          title: 'PDF to Word',
          description: 'Convert PDF documents to editable Microsoft Word format (.docx).',
          auth: true,
          contentType: 'multipart/form-data',
          requestBody: {
            file: { type: 'File', required: true, description: 'PDF file to convert' }
          },
          responseExample: {
            success: true,
            data: {
              file_size: 524288,
              file_base64: 'UEsDBBQAAAAI...',
              format: 'docx'
            }
          }
        },
        {
          method: 'POST',
          path: '/convert/pdf-to-excel',
          title: 'PDF to Excel',
          description: 'Convert PDF tables and data to Microsoft Excel format (.xlsx). Best for PDFs with tabular data.',
          auth: true,
          contentType: 'multipart/form-data',
          requestBody: {
            file: { type: 'File', required: true, description: 'PDF file to convert' }
          },
          responseExample: {
            success: true,
            data: {
              file_size: 262144,
              file_base64: 'UEsDBBQAAAAI...',
              format: 'xlsx'
            }
          }
        },
        {
          method: 'POST',
          path: '/convert/pdf-to-ppt',
          title: 'PDF to PowerPoint',
          description: 'Convert PDF documents to Microsoft PowerPoint format (.pptx).',
          auth: true,
          contentType: 'multipart/form-data',
          requestBody: {
            file: { type: 'File', required: true, description: 'PDF file to convert' }
          },
          responseExample: {
            success: true,
            data: {
              file_size: 786432,
              file_base64: 'UEsDBBQAAAAI...',
              format: 'pptx'
            }
          }
        }
      ]
    },
    {
      category: 'Resume Builder',
      icon: FileText,
      items: [
        {
          method: 'POST',
          path: '/resumes/generate',
          title: 'AI Resume Generator',
          description: 'Generate a professional resume using AI based on user data and preferences.',
          auth: true,
          contentType: 'application/json',
          requestBody: {
            userData: { 
              type: 'object', 
              required: true, 
              description: 'User profile data',
              properties: {
                name: { type: 'string', required: true },
                email: { type: 'string', required: true },
                phone: { type: 'string', required: false },
                location: { type: 'string', required: false },
                summary: { type: 'string', required: false },
                experience: { type: 'array', required: false },
                education: { type: 'array', required: false },
                skills: { type: 'array', required: false }
              }
            },
            options: { 
              type: 'object', 
              required: false, 
              description: 'Generation options',
              properties: {
                template: { type: 'string', description: 'Template ID' },
                industry: { type: 'string', description: 'Target industry' },
                experienceLevel: { type: 'string', description: 'Experience level' }
              }
            }
          },
          responseExample: {
            success: true,
            data: {
              resume: {
                personalInfo: { name: 'John Doe', email: 'john@example.com' },
                summary: 'AI-generated professional summary...',
                experience: [],
                education: [],
                skills: []
              },
              metadata: {
                generatedAt: '2024-12-04T10:30:00Z',
                model: 'gpt-4'
              }
            }
          }
        },
        {
          method: 'POST',
          path: '/resumes/export',
          title: 'Export Resume',
          description: 'Export a generated resume to PDF or DOCX format.',
          auth: true,
          contentType: 'application/json',
          requestBody: {
            resumeData: { type: 'object', required: true, description: 'Resume data object from /resumes/generate' },
            format: { type: 'string', required: false, default: 'pdf', description: 'Export format: pdf, docx' }
          },
          responseExample: {
            success: true,
            data: {
              format: 'pdf',
              file_size: 262144,
              file_base64: 'JVBERi0xLjQK...'
            }
          }
        },
        {
          method: 'GET',
          path: '/resumes/templates',
          title: 'Get Resume Templates',
          description: 'List all available resume templates.',
          auth: true,
          requestBody: null,
          responseExample: {
            success: true,
            data: {
              templates: [
                { id: 'modern', name: 'Modern', description: 'Clean and contemporary design' },
                { id: 'professional', name: 'Professional', description: 'Traditional business format' },
                { id: 'creative', name: 'Creative', description: 'Stand out with unique styling' }
              ]
            }
          }
        },
        {
          method: 'GET',
          path: '/resumes/industries',
          title: 'Get Industries',
          description: 'List all supported industries for resume customization.',
          auth: true,
          requestBody: null,
          responseExample: {
            success: true,
            data: {
              industries: ['Technology', 'Healthcare', 'Finance', 'Education', 'Marketing']
            }
          }
        },
        {
          method: 'GET',
          path: '/resumes/experience-levels',
          title: 'Get Experience Levels',
          description: 'List all experience level options.',
          auth: true,
          requestBody: null,
          responseExample: {
            success: true,
            data: {
              levels: ['Entry Level', 'Mid Level', 'Senior', 'Executive', 'Student']
            }
          }
        }
      ]
    }
  ];

  // Error codes documentation
  const errorCodes = [
    { code: 400, name: 'Bad Request', description: 'Invalid request parameters or missing required fields', resolution: 'Check request body and parameters match the API specification' },
    { code: 401, name: 'Unauthorized', description: 'Missing or invalid API credentials', resolution: 'Verify X-API-Key and X-API-Secret headers are correct' },
    { code: 403, name: 'Forbidden', description: 'Account inactive or access denied', resolution: 'Contact support to reactivate your account' },
    { code: 404, name: 'Not Found', description: 'Endpoint or resource not found', resolution: 'Verify the endpoint URL is correct' },
    { code: 408, name: 'Request Timeout', description: 'Request took too long to process', resolution: 'Try with a smaller file or check your connection' },
    { code: 413, name: 'Payload Too Large', description: 'File size exceeds the limit', resolution: 'Reduce file size to under 100MB' },
    { code: 415, name: 'Unsupported Media Type', description: 'Invalid file format', resolution: 'Use supported file formats (PDF, JPEG, PNG, etc.)' },
    { code: 429, name: 'Too Many Requests', description: 'Rate limit or monthly quota exceeded', resolution: 'Wait for rate limit reset or upgrade your plan' },
    { code: 500, name: 'Internal Server Error', description: 'Server-side error occurred', resolution: 'Retry the request or contact support if persistent' },
    { code: 503, name: 'Service Unavailable', description: 'Service temporarily unavailable', resolution: 'Wait and retry after a few minutes' }
  ];

  const platforms = [
    { id: 'curl', name: 'cURL', icon: '🔧' },
    { id: 'nodejs', name: 'Node.js', icon: '🟢' },
    { id: 'python', name: 'Python', icon: '🐍' },
    { id: 'php', name: 'PHP', icon: '🐘' },
    { id: 'java', name: 'Java', icon: '☕' },
    { id: 'csharp', name: 'C#', icon: '💜' },
    { id: 'go', name: 'Go', icon: '🔵' },
    { id: 'ruby', name: 'Ruby', icon: '💎' }
  ];

  useEffect(() => {
    trackPageViewOnce(window.location.href, 'Developer Docs - RobotPDF')
      .catch(err => console.error('Tracking error:', err));
  }, []);

  const copyToClipboard = (text, id) => {
    navigator.clipboard.writeText(text);
    setCopiedCode(id);
    toast.success('Copied to clipboard!');
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const CodeBlock = ({ code, language = 'bash', id }) => (
    <div className="relative group">
      <pre className="bg-slate-900 p-4 rounded-xl overflow-x-auto">
        <code className="text-sm text-slate-300 whitespace-pre">{code}</code>
      </pre>
      <button
        onClick={() => copyToClipboard(code, id)}
        className="absolute top-3 right-3 p-2 bg-slate-700 hover:bg-slate-600 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
      >
        {copiedCode === id ? (
          <Check className="w-4 h-4 text-green-400" />
        ) : (
          <Copy className="w-4 h-4 text-slate-300" />
        )}
      </button>
    </div>
  );

  const filteredSections = sections.filter(section =>
    section.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gradient-to-b from-white via-slate-50 to-white relative overflow-hidden">
      {/* Background Effects */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -left-40 w-[600px] h-[600px] bg-gradient-to-br from-indigo-100/30 to-purple-100/30 rounded-full blur-3xl"></div>
        <div className="absolute top-40 -right-40 w-[500px] h-[500px] bg-gradient-to-br from-blue-100/30 to-cyan-100/30 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-40 left-1/4 w-[700px] h-[700px] bg-gradient-to-br from-purple-100/20 to-pink-100/20 rounded-full blur-3xl"></div>
      </div>
      
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Navigation */}
        <div className="flex items-center gap-4 mb-6 flex-wrap">
          <Link to="/developers" className="flex items-center gap-2 px-4 py-2 bg-white border-2 border-gray-200 rounded-xl text-slate-700 hover:text-indigo-600 hover:border-indigo-200 transition-all shadow-sm">
            <ArrowLeft className="w-4 h-4" />
            Back to Portal
          </Link>
          <Link to="/developers/keys" className="flex items-center gap-2 px-4 py-2 bg-white border-2 border-gray-200 rounded-xl text-slate-700 hover:text-indigo-600 hover:border-indigo-200 transition-all shadow-sm">
            <Key className="w-4 h-4" />
            API Keys
          </Link>
          <Link to="/developers/usage" className="flex items-center gap-2 px-4 py-2 bg-white border-2 border-gray-200 rounded-xl text-slate-700 hover:text-indigo-600 hover:border-indigo-200 transition-all shadow-sm">
            <BarChart3 className="w-4 h-4" />
            Usage
          </Link>
        </div>
        
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-xl">
              <Book className="w-6 h-6 text-indigo-600" />
            </div>
            <h1 className="text-3xl md:text-4xl font-bold text-slate-900">
              API Documentation
            </h1>
            <span className="px-3 py-1 bg-indigo-100 text-indigo-700 text-sm font-medium rounded-full">
              v1.0
            </span>
          </div>
          <p className="text-slate-600 mb-6">
            Complete reference for RobotPDF API - Build powerful PDF tools into your applications
          </p>
          
          {/* Search */}
          <div className="relative max-w-xl">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              type="text"
              placeholder="Search documentation..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-white border-2 border-gray-200 rounded-xl text-slate-900 placeholder-slate-400 focus:border-indigo-300 focus:ring-2 focus:ring-indigo-100 transition-all"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white border-2 border-gray-200 rounded-2xl p-4 shadow-md sticky top-4">
              <h3 className="font-semibold text-slate-900 mb-4">Contents</h3>
              <nav className="space-y-1">
                {filteredSections.map((section) => (
                  <button
                    key={section.id}
                    onClick={() => setActiveSection(section.id)}
                    className={`w-full text-left px-4 py-2.5 rounded-xl transition-colors flex items-center gap-3 ${
                      activeSection === section.id
                        ? 'bg-gradient-to-r from-indigo-50 to-purple-50 text-indigo-600 shadow-sm font-medium'
                        : 'text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <section.icon className="w-4 h-4" />
                    {section.title}
                  </button>
                ))}
              </nav>
            </div>
          </div>

          {/* Content */}
          <div className="lg:col-span-3 space-y-8">

            {/* Getting Started */}
            {activeSection === 'getting-started' && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-6"
              >
                <div className="bg-white border-2 border-gray-200 rounded-2xl p-8 shadow-md">
                  <h2 className="text-2xl font-bold text-slate-900 mb-4">Getting Started</h2>
                  <p className="text-slate-600 mb-6">
                    Welcome to the RobotPDF API! This guide will help you integrate our powerful PDF processing tools into your applications in minutes.
                  </p>
                  
                  <h3 className="text-xl font-semibold text-slate-900 mt-6 mb-3">Base URL</h3>
                  <CodeBlock 
                    code="https://api.robotpdf.com/api/v1" 
                    id="base-url"
                  />

                  <h3 className="text-xl font-semibold text-slate-900 mt-8 mb-3">Quick Start Steps</h3>
                  <div className="space-y-4">
                    <div className="flex gap-4 p-4 bg-slate-50 rounded-xl">
                      <div className="flex-shrink-0 w-8 h-8 bg-indigo-600 text-white rounded-full flex items-center justify-center font-bold">1</div>
                      <div>
                        <h4 className="font-semibold text-slate-900">Create an Account</h4>
                        <p className="text-slate-600 text-sm">Sign up at RobotPDF and navigate to the Developer Portal</p>
                      </div>
                    </div>
                    <div className="flex gap-4 p-4 bg-slate-50 rounded-xl">
                      <div className="flex-shrink-0 w-8 h-8 bg-indigo-600 text-white rounded-full flex items-center justify-center font-bold">2</div>
                      <div>
                        <h4 className="font-semibold text-slate-900">Generate API Keys</h4>
                        <p className="text-slate-600 text-sm">Create your API key and secret from the <Link to="/developers/keys" className="text-indigo-600 hover:underline">API Keys page</Link></p>
                      </div>
                    </div>
                    <div className="flex gap-4 p-4 bg-slate-50 rounded-xl">
                      <div className="flex-shrink-0 w-8 h-8 bg-indigo-600 text-white rounded-full flex items-center justify-center font-bold">3</div>
                      <div>
                        <h4 className="font-semibold text-slate-900">Make Your First Request</h4>
                        <p className="text-slate-600 text-sm">Test the API with a simple health check request</p>
                      </div>
                    </div>
                  </div>

                  <h3 className="text-xl font-semibold text-slate-900 mt-8 mb-3">Your First API Call</h3>
                  <CodeBlock 
                    code={`curl -X GET "https://api.robotpdf.com/api/v1/health" \\
  -H "X-API-Key: pk_live_YOUR_API_KEY" \\
  -H "X-API-Secret: sk_live_YOUR_API_SECRET"`}
                    id="first-call"
                  />

                  <h3 className="text-xl font-semibold text-slate-900 mt-8 mb-3">Expected Response</h3>
                  <CodeBlock 
                    code={`{
  "success": true,
  "status": "ok",
  "version": "1.0.0",
  "timestamp": "2024-12-04T10:30:00.000Z",
  "developer": {
    "id": "your-developer-id",
    "name": "Your App Name"
  }
}`}
                    id="first-response"
                  />
                </div>

                {/* API Features Overview */}
                <div className="bg-white border-2 border-gray-200 rounded-2xl p-8 shadow-md">
                  <h3 className="text-xl font-semibold text-slate-900 mb-4">Available Features</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {[
                      { icon: FileText, title: 'OCR Pro', desc: 'Extract text from images & PDFs with AI enhancement' },
                      { icon: MessageSquare, title: 'AI Chat', desc: 'Chat with your documents using AI' },
                      { icon: Scissors, title: 'Split & Merge', desc: 'Split or merge PDF documents' },
                      { icon: RefreshCw, title: 'Convert', desc: 'PDF to Word, Excel, PowerPoint' },
                      { icon: Image, title: 'Images to PDF', desc: 'Convert images to PDF documents' },
                      { icon: FileOutput, title: 'Compress', desc: 'Reduce PDF file size intelligently' }
                    ].map((feature, i) => (
                      <div key={i} className="flex gap-3 p-4 bg-slate-50 rounded-xl">
                        <feature.icon className="w-5 h-5 text-indigo-600 flex-shrink-0 mt-0.5" />
                        <div>
                          <h4 className="font-medium text-slate-900">{feature.title}</h4>
                          <p className="text-sm text-slate-600">{feature.desc}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}

            {/* Authentication */}
            {activeSection === 'authentication' && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-6"
              >
                <div className="bg-white border-2 border-gray-200 rounded-2xl p-8 shadow-md">
                  <h2 className="text-2xl font-bold text-slate-900 mb-4">Authentication</h2>
                  <p className="text-slate-600 mb-6">
                    All API requests require authentication using an API key pair. You must include both headers in every request.
                  </p>
                  
                  <h3 className="text-xl font-semibold text-slate-900 mt-6 mb-3">Required Headers</h3>
                  <div className="bg-slate-50 border border-slate-200 rounded-xl overflow-hidden">
                    <table className="w-full text-sm">
                      <thead className="bg-slate-100">
                        <tr>
                          <th className="text-left px-4 py-3 font-semibold text-slate-700">Header</th>
                          <th className="text-left px-4 py-3 font-semibold text-slate-700">Format</th>
                          <th className="text-left px-4 py-3 font-semibold text-slate-700">Description</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200">
                        <tr>
                          <td className="px-4 py-3 font-mono text-indigo-600">X-API-Key</td>
                          <td className="px-4 py-3 font-mono text-slate-600">pk_live_xxx...</td>
                          <td className="px-4 py-3 text-slate-600">Your public API key</td>
                        </tr>
                        <tr>
                          <td className="px-4 py-3 font-mono text-indigo-600">X-API-Secret</td>
                          <td className="px-4 py-3 font-mono text-slate-600">sk_live_xxx...</td>
                          <td className="px-4 py-3 text-slate-600">Your private API secret</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>

                  <h3 className="text-xl font-semibold text-slate-900 mt-8 mb-3">Key Formats</h3>
                  <div className="space-y-3">
                    <div className="p-4 bg-green-50 border border-green-200 rounded-xl">
                      <div className="flex items-center gap-2 mb-1">
                        <Check className="w-4 h-4 text-green-600" />
                        <span className="font-semibold text-green-800">Production Keys</span>
                      </div>
                      <p className="text-sm text-green-700">
                        <code className="bg-green-100 px-2 py-0.5 rounded">pk_live_</code> and <code className="bg-green-100 px-2 py-0.5 rounded">sk_live_</code> - Use in production environments
                      </p>
                    </div>
                    <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl">
                      <div className="flex items-center gap-2 mb-1">
                        <Info className="w-4 h-4 text-amber-600" />
                        <span className="font-semibold text-amber-800">Test Keys</span>
                      </div>
                      <p className="text-sm text-amber-700">
                        <code className="bg-amber-100 px-2 py-0.5 rounded">pk_test_</code> and <code className="bg-amber-100 px-2 py-0.5 rounded">sk_test_</code> - Use for development and testing
                      </p>
                    </div>
                  </div>

                  <h3 className="text-xl font-semibold text-slate-900 mt-8 mb-3">Example Request</h3>
                  <CodeBlock 
                    code={`curl -X GET "https://api.robotpdf.com/api/v1/health" \\
  -H "X-API-Key: pk_live_abc123def456..." \\
  -H "X-API-Secret: sk_live_xyz789ghi012..."`}
                    id="auth-example"
                  />

                  <div className="mt-6 p-4 bg-red-50 border-2 border-red-200 rounded-xl">
                    <div className="flex gap-3">
                      <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                      <div>
                        <h4 className="font-semibold text-red-800 mb-1">Security Warning</h4>
                        <ul className="text-sm text-red-700 space-y-1">
                          <li>• Never expose your API secret in client-side code</li>
                          <li>• Never commit API credentials to version control</li>
                          <li>• Store credentials in environment variables</li>
                          <li>• Rotate keys immediately if compromised</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Authentication Errors */}
                <div className="bg-white border-2 border-gray-200 rounded-2xl p-8 shadow-md">
                  <h3 className="text-xl font-semibold text-slate-900 mb-4">Authentication Errors</h3>
                  <div className="space-y-4">
                    <div className="p-4 bg-slate-50 rounded-xl">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="px-2 py-1 bg-red-100 text-red-700 text-xs font-semibold rounded">401</span>
                        <span className="font-medium text-slate-900">Missing Credentials</span>
                      </div>
                      <CodeBlock 
                        code={`{
  "error": "Unauthorized",
  "message": "API key and secret are required. Include X-API-Key and X-API-Secret headers."
}`}
                        id="auth-error-1"
                      />
                    </div>
                    <div className="p-4 bg-slate-50 rounded-xl">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="px-2 py-1 bg-red-100 text-red-700 text-xs font-semibold rounded">401</span>
                        <span className="font-medium text-slate-900">Invalid Key Format</span>
                      </div>
                      <CodeBlock 
                        code={`{
  "error": "Invalid API key format",
  "message": "API key must start with pk_live_ or pk_test_"
}`}
                        id="auth-error-2"
                      />
                    </div>
                    <div className="p-4 bg-slate-50 rounded-xl">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="px-2 py-1 bg-red-100 text-red-700 text-xs font-semibold rounded">403</span>
                        <span className="font-medium text-slate-900">Account Inactive</span>
                      </div>
                      <CodeBlock 
                        code={`{
  "error": "Account inactive",
  "message": "Your API access has been disabled. Contact support."
}`}
                        id="auth-error-3"
                      />
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Rate Limits */}
            {activeSection === 'rate-limits' && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-6"
              >
                <div className="bg-white border-2 border-gray-200 rounded-2xl p-8 shadow-md">
                  <h2 className="text-2xl font-bold text-slate-900 mb-4">Rate Limits & Quotas</h2>
                  <p className="text-slate-600 mb-6">
                    API requests are subject to rate limiting and monthly quotas to ensure fair usage and service stability.
                  </p>

                  <h3 className="text-xl font-semibold text-slate-900 mt-6 mb-3">Default Limits</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-4 bg-indigo-50 border border-indigo-200 rounded-xl">
                      <div className="text-3xl font-bold text-indigo-600 mb-1">100</div>
                      <div className="text-sm text-indigo-800">Requests per minute</div>
                    </div>
                    <div className="p-4 bg-purple-50 border border-purple-200 rounded-xl">
                      <div className="text-3xl font-bold text-purple-600 mb-1">1,000</div>
                      <div className="text-sm text-purple-800">Requests per month</div>
                    </div>
                  </div>

                  <h3 className="text-xl font-semibold text-slate-900 mt-8 mb-3">Rate Limit Headers</h3>
                  <p className="text-slate-600 mb-4">Every API response includes headers to help you track your usage:</p>
                  <div className="bg-slate-50 border border-slate-200 rounded-xl overflow-hidden">
                    <table className="w-full text-sm">
                      <thead className="bg-slate-100">
                        <tr>
                          <th className="text-left px-4 py-3 font-semibold text-slate-700">Header</th>
                          <th className="text-left px-4 py-3 font-semibold text-slate-700">Description</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200">
                        <tr>
                          <td className="px-4 py-3 font-mono text-indigo-600">X-RateLimit-Limit</td>
                          <td className="px-4 py-3 text-slate-600">Maximum requests per minute</td>
                        </tr>
                        <tr>
                          <td className="px-4 py-3 font-mono text-indigo-600">X-RateLimit-Remaining</td>
                          <td className="px-4 py-3 text-slate-600">Remaining requests in current minute</td>
                        </tr>
                        <tr>
                          <td className="px-4 py-3 font-mono text-indigo-600">X-RateLimit-Reset</td>
                          <td className="px-4 py-3 text-slate-600">Unix timestamp when rate limit resets</td>
                        </tr>
                        <tr>
                          <td className="px-4 py-3 font-mono text-indigo-600">X-Quota-Limit</td>
                          <td className="px-4 py-3 text-slate-600">Monthly request quota</td>
                        </tr>
                        <tr>
                          <td className="px-4 py-3 font-mono text-indigo-600">X-Quota-Used</td>
                          <td className="px-4 py-3 text-slate-600">Requests used this month</td>
                        </tr>
                        <tr>
                          <td className="px-4 py-3 font-mono text-indigo-600">X-Quota-Remaining</td>
                          <td className="px-4 py-3 text-slate-600">Remaining monthly requests</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>

                  <h3 className="text-xl font-semibold text-slate-900 mt-8 mb-3">Rate Limit Exceeded Response</h3>
                  <CodeBlock 
                    code={`{
  "error": "Rate limit exceeded",
  "message": "Too many requests. Rate limit: 100 requests per minute.",
  "limit": 100,
  "reset_in_seconds": 45
}`}
                    id="rate-limit-error"
                  />

                  <h3 className="text-xl font-semibold text-slate-900 mt-8 mb-3">Monthly Quota Exceeded Response</h3>
                  <CodeBlock 
                    code={`{
  "error": "Monthly quota exceeded",
  "message": "You have reached your monthly limit of 1000 requests. Upgrade your plan or wait for the next billing cycle.",
  "limit": 1000,
  "used": 1000,
  "remaining": 0,
  "reset_date": 1735689600000
}`}
                    id="quota-error"
                  />

                  <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-xl">
                    <div className="flex gap-3">
                      <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                      <div>
                        <h4 className="font-semibold text-blue-800 mb-1">Best Practices</h4>
                        <ul className="text-sm text-blue-700 space-y-1">
                          <li>• Implement exponential backoff when rate limited</li>
                          <li>• Cache responses when possible</li>
                          <li>• Monitor your usage via the /usage endpoint</li>
                          <li>• Contact support for higher limits if needed</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>

                {/* File Size Limits */}
                <div className="bg-white border-2 border-gray-200 rounded-2xl p-8 shadow-md">
                  <h3 className="text-xl font-semibold text-slate-900 mb-4">File Size Limits</h3>
                  <div className="bg-slate-50 border border-slate-200 rounded-xl overflow-hidden">
                    <table className="w-full text-sm">
                      <thead className="bg-slate-100">
                        <tr>
                          <th className="text-left px-4 py-3 font-semibold text-slate-700">Limit Type</th>
                          <th className="text-left px-4 py-3 font-semibold text-slate-700">Value</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200">
                        <tr>
                          <td className="px-4 py-3 text-slate-900">Maximum file size</td>
                          <td className="px-4 py-3 font-mono text-slate-600">100 MB</td>
                        </tr>
                        <tr>
                          <td className="px-4 py-3 text-slate-900">Maximum files per request</td>
                          <td className="px-4 py-3 font-mono text-slate-600">10 files</td>
                        </tr>
                        <tr>
                          <td className="px-4 py-3 text-slate-900">Request timeout</td>
                          <td className="px-4 py-3 font-mono text-slate-600">10 minutes</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              </motion.div>
            )}


            {/* File Handling */}
            {activeSection === 'file-handling' && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-6"
              >
                <div className="bg-white border-2 border-gray-200 rounded-2xl p-8 shadow-md">
                  <h2 className="text-2xl font-bold text-slate-900 mb-4">Handling File Responses</h2>
                  <p className="text-slate-600 mb-6">
                    Many API endpoints return processed files as base64-encoded strings in JSON responses. 
                    This guide shows you how to properly decode and save these files to avoid corruption.
                  </p>

                  <div className="p-4 bg-amber-50 border-2 border-amber-200 rounded-xl mb-6">
                    <div className="flex gap-3">
                      <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                      <div>
                        <h4 className="font-semibold text-amber-800 mb-1">Important</h4>
                        <p className="text-sm text-amber-700">
                          Endpoints that return files (compress, merge, split, convert, etc.) include a <code className="bg-amber-100 px-1 rounded">file_base64</code> field 
                          containing the base64-encoded file data. You must decode this string properly to get a valid file.
                        </p>
                      </div>
                    </div>
                  </div>

                  <h3 className="text-xl font-semibold text-slate-900 mt-8 mb-3">Response Format</h3>
                  <p className="text-slate-600 mb-4">File-returning endpoints respond with this structure:</p>
                  <CodeBlock 
                    code={`{
  "success": true,
  "data": {
    "file_size": 524288,
    "file_base64": "JVBERi0xLjQKJeLjz9MKMSAwIG9iago8PC9UeXBlL0NhdGFsb2cvUGFnZXMgMiAwIFI+PgplbmRvYmoKMiAwIG9iago8PC9UeXBlL1BhZ2VzL0tpZHNbMyAwIFJdL0NvdW50IDE+PgplbmRvYmoKMyAwIG9iago8PC9UeXBlL1BhZ2UvTWVkaWFCb3hbMCAwIDYxMiA3OTJdL1BhcmVudCAyIDAgUi9SZXNvdXJjZXM8PC9Gb250PDwvRjEgNCAwIFI+Pj4+L0NvbnRlbnRzIDUgMCBSPj4KZW5kb2JqCjQgMCBvYmoKPDwvVHlwZS9Gb250L1N1YnR5cGUvVHlwZTEvQmFzZUZvbnQvSGVsdmV0aWNhPj4KZW5kb2JqCjUgMCBvYmoKPDwvTGVuZ3RoIDQ0Pj4Kc3RyZWFtCkJUCi9GMSA0OCBUZgoxMDAgNzAwIFRkCihIZWxsbywgV29ybGQhKSBUagpFVAplbmRzdHJlYW0KZW5kb2JqCnhyZWYKMCA2CjAwMDAwMDAwMDAgNjU1MzUgZiAKMDAwMDAwMDAxNSAwMDAwMCBuIAowMDAwMDAwMDY0IDAwMDAwIG4gCjAwMDAwMDAxMjEgMDAwMDAgbiAKMDAwMDAwMDI0NyAwMDAwMCBuIAowMDAwMDAwMzI2IDAwMDAwIG4gCnRyYWlsZXIKPDwvU2l6ZSA2L1Jvb3QgMSAwIFI+PgpzdGFydHhyZWYKNDE4CiUlRU9GCg==",
    "compression_ratio": "80.00%",
    "format": "pdf"
  }
}`}
                    id="file-response-format"
                  />

                  <h3 className="text-xl font-semibold text-slate-900 mt-8 mb-3">Decoding Base64 Files</h3>
                  <p className="text-slate-600 mb-4">Here's how to properly decode and save files in different languages:</p>

                  {/* Node.js Example */}
                  <div className="mb-6">
                    <h4 className="font-medium text-slate-900 mb-2 flex items-center gap-2">
                      <span className="text-xl">🟢</span> Node.js
                    </h4>
                    <CodeBlock 
                      code={`const fs = require('fs');
const axios = require('axios');

async function compressAndSavePdf(inputPath, outputPath) {
  const formData = new FormData();
  formData.append('file', fs.createReadStream(inputPath));
  formData.append('quality', 'medium');
  
  const response = await axios.post(
    'https://api.robotpdf.com/api/v1/compress',
    formData,
    {
      headers: {
        'X-API-Key': process.env.ROBOTPDF_API_KEY,
        'X-API-Secret': process.env.ROBOTPDF_API_SECRET,
        ...formData.getHeaders()
      }
    }
  );
  
  // Decode base64 string to Buffer
  const fileBuffer = Buffer.from(
    response.data.data.file_base64,
    'base64'
  );
  
  // Write to file
  fs.writeFileSync(outputPath, fileBuffer);
  
  console.log('File saved successfully!');
  console.log('Original size:', response.data.data.original_size);
  console.log('Compressed size:', response.data.data.compressed_size);
  
  return fileBuffer;
}

// Usage
compressAndSavePdf('./input.pdf', './output.pdf');`}
                      id="nodejs-decode"
                    />
                  </div>

                  {/* Python Example */}
                  <div className="mb-6">
                    <h4 className="font-medium text-slate-900 mb-2 flex items-center gap-2">
                      <span className="text-xl">🐍</span> Python
                    </h4>
                    <CodeBlock 
                      code={`import requests
import base64
import os

def compress_and_save_pdf(input_path, output_path):
    """Compress a PDF and save the result."""
    
    # Make API request
    with open(input_path, 'rb') as f:
        response = requests.post(
            'https://api.robotpdf.com/api/v1/compress',
            headers={
                'X-API-Key': os.environ['ROBOTPDF_API_KEY'],
                'X-API-Secret': os.environ['ROBOTPDF_API_SECRET']
            },
            files={'file': f},
            data={'quality': 'medium'}
        )
    
    response.raise_for_status()
    result = response.json()['data']
    
    # Decode base64 string to bytes
    file_bytes = base64.b64decode(result['file_base64'])
    
    # Write to file
    with open(output_path, 'wb') as f:
        f.write(file_bytes)
    
    print(f"File saved successfully!")
    print(f"Original size: {result['original_size']} bytes")
    print(f"Compressed size: {result['compressed_size']} bytes")
    print(f"Compression ratio: {result['compression_ratio']}")
    
    return file_bytes

# Usage
compress_and_save_pdf('input.pdf', 'output.pdf')`}
                      id="python-decode"
                    />
                  </div>

                  {/* PHP Example */}
                  <div className="mb-6">
                    <h4 className="font-medium text-slate-900 mb-2 flex items-center gap-2">
                      <span className="text-xl">🐘</span> PHP
                    </h4>
                    <CodeBlock 
                      code={`<?php
function compressAndSavePdf($inputPath, $outputPath) {
    $apiKey = getenv('ROBOTPDF_API_KEY');
    $apiSecret = getenv('ROBOTPDF_API_SECRET');
    
    // Prepare file upload
    $ch = curl_init('https://api.robotpdf.com/api/v1/compress');
    $cfile = new CURLFile($inputPath);
    
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_POST, true);
    curl_setopt($ch, CURLOPT_HTTPHEADER, [
        'X-API-Key: ' . $apiKey,
        'X-API-Secret: ' . $apiSecret
    ]);
    curl_setopt($ch, CURLOPT_POSTFIELDS, [
        'file' => $cfile,
        'quality' => 'medium'
    ]);
    
    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);
    
    if ($httpCode !== 200) {
        throw new Exception("API Error: " . $response);
    }
    
    $result = json_decode($response, true)['data'];
    
    // Decode base64 string
    $fileBytes = base64_decode($result['file_base64']);
    
    // Write to file
    file_put_contents($outputPath, $fileBytes);
    
    echo "File saved successfully!\n";
    echo "Original size: {$result['original_size']} bytes\n";
    echo "Compressed size: {$result['compressed_size']} bytes\n";
    
    return $fileBytes;
}

// Usage
compressAndSavePdf('input.pdf', 'output.pdf');
?>`}
                      id="php-decode"
                    />
                  </div>

                  {/* Java Example */}
                  <div className="mb-6">
                    <h4 className="font-medium text-slate-900 mb-2 flex items-center gap-2">
                      <span className="text-xl">☕</span> Java
                    </h4>
                    <CodeBlock 
                      code={`import okhttp3.*;
import com.google.gson.JsonObject;
import com.google.gson.JsonParser;
import java.io.File;
import java.io.FileOutputStream;
import java.io.IOException;
import java.util.Base64;

public class PDFCompressor {
    private static final String API_KEY = System.getenv("ROBOTPDF_API_KEY");
    private static final String API_SECRET = System.getenv("ROBOTPDF_API_SECRET");
    
    public static void compressAndSavePdf(String inputPath, String outputPath) 
            throws IOException {
        OkHttpClient client = new OkHttpClient();
        
        // Prepare multipart request
        RequestBody fileBody = RequestBody.create(
            new File(inputPath),
            MediaType.parse("application/pdf")
        );
        
        MultipartBody body = new MultipartBody.Builder()
            .setType(MultipartBody.FORM)
            .addFormDataPart("file", "input.pdf", fileBody)
            .addFormDataPart("quality", "medium")
            .build();
        
        Request request = new Request.Builder()
            .url("https://api.robotpdf.com/api/v1/compress")
            .addHeader("X-API-Key", API_KEY)
            .addHeader("X-API-Secret", API_SECRET)
            .post(body)
            .build();
        
        try (Response response = client.newCall(request).execute()) {
            String responseBody = response.body().string();
            JsonObject json = JsonParser.parseString(responseBody)
                .getAsJsonObject();
            JsonObject data = json.getAsJsonObject("data");
            
            // Decode base64 string
            String base64String = data.get("file_base64").getAsString();
            byte[] fileBytes = Base64.getDecoder().decode(base64String);
            
            // Write to file
            try (FileOutputStream fos = new FileOutputStream(outputPath)) {
                fos.write(fileBytes);
            }
            
            System.out.println("File saved successfully!");
            System.out.println("Original size: " + 
                data.get("original_size").getAsInt());
            System.out.println("Compressed size: " + 
                data.get("compressed_size").getAsInt());
        }
    }
    
    public static void main(String[] args) throws IOException {
        compressAndSavePdf("input.pdf", "output.pdf");
    }
}`}
                      id="java-decode"
                    />
                  </div>

                  {/* C# Example */}
                  <div className="mb-6">
                    <h4 className="font-medium text-slate-900 mb-2 flex items-center gap-2">
                      <span className="text-xl">💜</span> C#
                    </h4>
                    <CodeBlock 
                      code={`using System;
using System.IO;
using System.Net.Http;
using System.Threading.Tasks;
using Newtonsoft.Json.Linq;

public class PDFCompressor
{
    private static readonly string ApiKey = 
        Environment.GetEnvironmentVariable("ROBOTPDF_API_KEY");
    private static readonly string ApiSecret = 
        Environment.GetEnvironmentVariable("ROBOTPDF_API_SECRET");
    
    public static async Task CompressAndSavePdfAsync(
        string inputPath, string outputPath)
    {
        using var client = new HttpClient();
        client.DefaultRequestHeaders.Add("X-API-Key", ApiKey);
        client.DefaultRequestHeaders.Add("X-API-Secret", ApiSecret);
        
        // Prepare multipart form data
        using var form = new MultipartFormDataContent();
        using var fileStream = File.OpenRead(inputPath);
        form.Add(new StreamContent(fileStream), "file", "input.pdf");
        form.Add(new StringContent("medium"), "quality");
        
        // Make API request
        var response = await client.PostAsync(
            "https://api.robotpdf.com/api/v1/compress",
            form
        );
        response.EnsureSuccessStatusCode();
        
        var responseBody = await response.Content.ReadAsStringAsync();
        var json = JObject.Parse(responseBody);
        var data = json["data"];
        
        // Decode base64 string
        string base64String = data["file_base64"].ToString();
        byte[] fileBytes = Convert.FromBase64String(base64String);
        
        // Write to file
        await File.WriteAllBytesAsync(outputPath, fileBytes);
        
        Console.WriteLine("File saved successfully!");
        Console.WriteLine($"Original size: {data["original_size"]}");
        Console.WriteLine($"Compressed size: {data["compressed_size"]}");
    }
    
    public static async Task Main(string[] args)
    {
        await CompressAndSavePdfAsync("input.pdf", "output.pdf");
    }
}`}
                      id="csharp-decode"
                    />
                  </div>

                  <h3 className="text-xl font-semibold text-slate-900 mt-8 mb-3">Common Issues & Solutions</h3>
                  <div className="space-y-4">
                    <div className="p-4 bg-red-50 border border-red-200 rounded-xl">
                      <div className="flex gap-3">
                        <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                        <div>
                          <h4 className="font-semibold text-red-800 mb-1">Issue: File is corrupted or won't open</h4>
                          <p className="text-sm text-red-700 mb-2">
                            <strong>Cause:</strong> The base64 string wasn't decoded properly, or extra characters were added.
                          </p>
                          <p className="text-sm text-red-700">
                            <strong>Solution:</strong> Ensure you're decoding the exact base64 string from <code className="bg-red-100 px-1 rounded">file_base64</code> 
                            without any modifications. Don't add line breaks or whitespace.
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="p-4 bg-red-50 border border-red-200 rounded-xl">
                      <div className="flex gap-3">
                        <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                        <div>
                          <h4 className="font-semibold text-red-800 mb-1">Issue: File size is different than expected</h4>
                          <p className="text-sm text-red-700 mb-2">
                            <strong>Cause:</strong> The file was saved as text instead of binary.
                          </p>
                          <p className="text-sm text-red-700">
                            <strong>Solution:</strong> Always write the decoded bytes in binary mode (e.g., <code className="bg-red-100 px-1 rounded">'wb'</code> in Python, 
                            <code className="bg-red-100 px-1 rounded">fs.writeFileSync</code> with Buffer in Node.js).
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="p-4 bg-red-50 border border-red-200 rounded-xl">
                      <div className="flex gap-3">
                        <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                        <div>
                          <h4 className="font-semibold text-red-800 mb-1">Issue: Memory issues with large files</h4>
                          <p className="text-sm text-red-700 mb-2">
                            <strong>Cause:</strong> Large base64 strings consume significant memory.
                          </p>
                          <p className="text-sm text-red-700">
                            <strong>Solution:</strong> For files larger than 50MB, consider processing them in chunks or using streaming. 
                            Contact support if you need to process very large files regularly.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-xl">
                    <div className="flex gap-3">
                      <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                      <div>
                        <h4 className="font-semibold text-blue-800 mb-1">Testing Your Implementation</h4>
                        <p className="text-sm text-blue-700">
                          After decoding and saving a file, verify it opens correctly in the appropriate application (PDF reader, Word, Excel, etc.). 
                          Compare the file size with the <code className="bg-blue-100 px-1 rounded">file_size</code> field in the API response to ensure proper decoding.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* ZIP File Handling */}
                <div className="bg-white border-2 border-gray-200 rounded-2xl p-8 shadow-md">
                  <h3 className="text-xl font-semibold text-slate-900 mb-4">Handling ZIP File Responses</h3>
                  <p className="text-slate-600 mb-6">
                    The split endpoint with split_mode=individual returns ZIP files containing multiple PDFs. 
                    The ZIP file is base64-encoded and must be decoded then extracted.
                  </p>

                  <h4 className="font-medium text-slate-900 mb-3">Node.js Example</h4>
                  <CodeBlock 
                    code={`const fs = require('fs');
const AdmZip = require('adm-zip');

const zipBuffer = Buffer.from(response.data.data.file_base64, 'base64');
const zip = new AdmZip(zipBuffer);
zip.extractAllTo('./output', true);
console.log('Extracted', response.data.data.file_count, 'PDFs');`}
                    id="nodejs-zip-decode"
                  />

                  <h4 className="font-medium text-slate-900 mb-3 mt-6">Python Example</h4>
                  <CodeBlock 
                    code={`import base64
import zipfile
import io

zip_bytes = base64.b64decode(result['file_base64'])
with zipfile.ZipFile(io.BytesIO(zip_bytes)) as zip_file:
    zip_file.extractall('./output')
print(f"Extracted {result['file_count']} PDFs")`}
                    id="python-zip-decode"
                  />
                </div>

                {/* Alternative: Direct Binary Response */}
                <div className="bg-white border-2 border-gray-200 rounded-2xl p-8 shadow-md">
                  <h3 className="text-xl font-semibold text-slate-900 mb-4">Alternative: Request Binary Response (Coming Soon)</h3>
                  <p className="text-slate-600 mb-4">
                    We're working on adding support for direct binary file responses as an alternative to base64 encoding. 
                    This will eliminate the need for base64 decoding and reduce response sizes.
                  </p>
                  <div className="p-4 bg-slate-50 rounded-xl">
                    <p className="text-sm text-slate-600">
                      <strong>Future usage:</strong> Add <code className="bg-slate-200 px-1 rounded">Accept: application/octet-stream</code> header 
                      to receive files directly as binary data instead of base64-encoded JSON.
                    </p>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Endpoints */}
            {activeSection === 'endpoints' && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-6"
              >
                <div className="bg-white border-2 border-gray-200 rounded-2xl p-6 shadow-md">
                  <h2 className="text-2xl font-bold text-slate-900 mb-2">API Endpoints</h2>
                  <p className="text-slate-600 mb-4">
                    Complete reference for all available API endpoints. Click on any endpoint to see detailed documentation.
                  </p>
                  <div className="flex items-center gap-2 text-sm text-slate-500">
                    <Globe className="w-4 h-4" />
                    <span>Base URL: <code className="bg-slate-100 px-2 py-0.5 rounded">{BASE_URL}</code></span>
                  </div>
                </div>

                {endpoints.map((category, catIndex) => (
                  <div key={catIndex} className="bg-white border-2 border-gray-200 rounded-2xl shadow-md overflow-hidden">
                    <div className="p-4 bg-gradient-to-r from-slate-50 to-white border-b border-gray-200">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-indigo-100 rounded-lg">
                          <category.icon className="w-5 h-5 text-indigo-600" />
                        </div>
                        <h3 className="text-lg font-semibold text-slate-900">{category.category}</h3>
                      </div>
                    </div>
                    <div className="divide-y divide-gray-100">
                      {category.items.map((endpoint, endIndex) => (
                        <div key={endIndex} className="hover:bg-slate-50 transition-colors">
                          <button
                            onClick={() => setExpandedEndpoint(expandedEndpoint === `${catIndex}-${endIndex}` ? null : `${catIndex}-${endIndex}`)}
                            className="w-full p-4 text-left"
                          >
                            <div className="flex items-start gap-4">
                              <span className={`px-3 py-1 rounded-lg text-sm font-semibold flex-shrink-0 ${
                                endpoint.method === 'GET' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'
                              }`}>
                                {endpoint.method}
                              </span>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                  <code className="font-mono text-slate-900">{endpoint.path}</code>
                                  {endpoint.auth && <Lock className="w-3.5 h-3.5 text-amber-500" />}
                                </div>
                                <p className="text-sm text-slate-600">{endpoint.description}</p>
                              </div>
                              {expandedEndpoint === `${catIndex}-${endIndex}` ? (
                                <ChevronDown className="w-5 h-5 text-slate-400 flex-shrink-0" />
                              ) : (
                                <ChevronRight className="w-5 h-5 text-slate-400 flex-shrink-0" />
                              )}
                            </div>
                          </button>
                          
                          <AnimatePresence>
                            {expandedEndpoint === `${catIndex}-${endIndex}` && (
                              <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: 'auto', opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                className="overflow-hidden"
                              >
                                <div className="px-4 pb-4 space-y-4 border-t border-gray-100 pt-4 bg-slate-50/50">
                                  {/* Request Details */}
                                  {endpoint.requestBody && (
                                    <div>
                                      <h4 className="font-semibold text-slate-900 mb-2 flex items-center gap-2">
                                        <span>Request Parameters</span>
                                        {endpoint.contentType && (
                                          <span className="text-xs font-normal px-2 py-0.5 bg-slate-200 rounded">
                                            {endpoint.contentType}
                                          </span>
                                        )}
                                      </h4>
                                      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
                                        <table className="w-full text-sm">
                                          <thead className="bg-slate-100">
                                            <tr>
                                              <th className="text-left px-3 py-2 font-semibold text-slate-700">Parameter</th>
                                              <th className="text-left px-3 py-2 font-semibold text-slate-700">Type</th>
                                              <th className="text-left px-3 py-2 font-semibold text-slate-700">Required</th>
                                              <th className="text-left px-3 py-2 font-semibold text-slate-700">Description</th>
                                            </tr>
                                          </thead>
                                          <tbody className="divide-y divide-slate-100">
                                            {Object.entries(endpoint.requestBody).map(([key, value]) => (
                                              <tr key={key}>
                                                <td className="px-3 py-2 font-mono text-indigo-600">{key}</td>
                                                <td className="px-3 py-2 text-slate-600">{value.type}</td>
                                                <td className="px-3 py-2">
                                                  {value.required ? (
                                                    <span className="px-2 py-0.5 bg-red-100 text-red-700 text-xs rounded">Required</span>
                                                  ) : (
                                                    <span className="px-2 py-0.5 bg-slate-100 text-slate-600 text-xs rounded">Optional</span>
                                                  )}
                                                </td>
                                                <td className="px-3 py-2 text-slate-600">
                                                  {value.description}
                                                  {value.default && (
                                                    <span className="ml-1 text-slate-400">(default: {value.default})</span>
                                                  )}
                                                </td>
                                              </tr>
                                            ))}
                                          </tbody>
                                        </table>
                                      </div>
                                    </div>
                                  )}

                                  {/* Limits */}
                                  {endpoint.limits && (
                                    <div>
                                      <h4 className="font-semibold text-slate-900 mb-2">Limits</h4>
                                      <div className="flex flex-wrap gap-2">
                                        {Object.entries(endpoint.limits).map(([key, value]) => (
                                          <span key={key} className="px-3 py-1 bg-amber-50 border border-amber-200 text-amber-800 text-sm rounded-lg">
                                            {key.replace(/([A-Z])/g, ' $1').trim()}: {Array.isArray(value) ? value.join(', ') : value}
                                          </span>
                                        ))}
                                      </div>
                                    </div>
                                  )}

                                  {/* Notes */}
                                  {endpoint.notes && (
                                    <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                                      <div className="flex gap-2">
                                        <Info className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
                                        <p className="text-sm text-blue-800">{endpoint.notes}</p>
                                      </div>
                                    </div>
                                  )}

                                  {/* Response Example */}
                                  {endpoint.responseExample && (
                                    <div>
                                      <h4 className="font-semibold text-slate-900 mb-2">Response Example</h4>
                                      <CodeBlock 
                                        code={JSON.stringify(endpoint.responseExample, null, 2)}
                                        id={`response-${catIndex}-${endIndex}`}
                                      />
                                    </div>
                                  )}

                                  {/* cURL Example */}
                                  <div>
                                    <h4 className="font-semibold text-slate-900 mb-2">cURL Example</h4>
                                    <CodeBlock 
                                      code={generateCurlExample(endpoint)}
                                      id={`curl-${catIndex}-${endIndex}`}
                                    />
                                  </div>
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </motion.div>
            )}

            {/* Error Codes */}
            {activeSection === 'error-codes' && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-6"
              >
                <div className="bg-white border-2 border-gray-200 rounded-2xl p-8 shadow-md">
                  <h2 className="text-2xl font-bold text-slate-900 mb-4">Error Codes</h2>
                  <p className="text-slate-600 mb-6">
                    The API uses standard HTTP status codes to indicate success or failure. All error responses include a JSON body with details.
                  </p>

                  <h3 className="text-xl font-semibold text-slate-900 mt-6 mb-3">Error Response Format</h3>
                  <CodeBlock 
                    code={`{
  "error": "Error type",
  "message": "Human-readable error description"
}`}
                    id="error-format"
                  />

                  <h3 className="text-xl font-semibold text-slate-900 mt-8 mb-4">HTTP Status Codes</h3>
                  <div className="space-y-3">
                    {errorCodes.map((error, index) => (
                      <div key={index} className="p-4 bg-slate-50 border border-slate-200 rounded-xl">
                        <div className="flex items-start gap-4">
                          <span className={`px-3 py-1 rounded-lg text-sm font-bold flex-shrink-0 ${
                            error.code < 400 ? 'bg-green-100 text-green-700' :
                            error.code < 500 ? 'bg-amber-100 text-amber-700' :
                            'bg-red-100 text-red-700'
                          }`}>
                            {error.code}
                          </span>
                          <div className="flex-1">
                            <h4 className="font-semibold text-slate-900">{error.name}</h4>
                            <p className="text-sm text-slate-600 mt-1">{error.description}</p>
                            <p className="text-sm text-indigo-600 mt-2">
                              <strong>Resolution:</strong> {error.resolution}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Common Error Examples */}
                <div className="bg-white border-2 border-gray-200 rounded-2xl p-8 shadow-md">
                  <h3 className="text-xl font-semibold text-slate-900 mb-4">Common Error Examples</h3>
                  
                  <div className="space-y-6">
                    <div>
                      <h4 className="font-medium text-slate-900 mb-2">Missing Required Field</h4>
                      <CodeBlock 
                        code={`{
  "error": "Missing required field",
  "message": "text is required"
}`}
                        id="error-missing-field"
                      />
                    </div>

                    <div>
                      <h4 className="font-medium text-slate-900 mb-2">Invalid File Type</h4>
                      <CodeBlock 
                        code={`{
  "error": "Invalid file type",
  "message": "Invalid file type: text/plain. Allowed types: PDF, images (JPEG, PNG, TIFF, BMP, WebP), and Office documents."
}`}
                        id="error-invalid-file"
                      />
                    </div>

                    <div>
                      <h4 className="font-medium text-slate-900 mb-2">File Too Large</h4>
                      <CodeBlock 
                        code={`{
  "error": "File too large",
  "message": "Maximum file size is 100MB"
}`}
                        id="error-file-size"
                      />
                    </div>
                  </div>
                </div>
              </motion.div>
            )}


            {/* Code Examples */}
            {activeSection === 'examples' && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-6"
              >
                <div className="bg-white border-2 border-gray-200 rounded-2xl p-8 shadow-md">
                  <h2 className="text-2xl font-bold text-slate-900 mb-6">Code Examples</h2>
                  
                  {/* Platform Selector */}
                  <div className="flex flex-wrap gap-2 mb-6 p-2 bg-slate-100 rounded-xl">
                    {platforms.map(platform => (
                      <button
                        key={platform.id}
                        onClick={() => setSelectedPlatform(platform.id)}
                        className={`px-4 py-2 rounded-lg transition-all font-medium text-sm ${
                          selectedPlatform === platform.id
                            ? 'bg-white text-indigo-600 shadow-sm'
                            : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        {platform.icon} {platform.name}
                      </button>
                    ))}
                  </div>

                  {/* cURL Examples */}
                  {selectedPlatform === 'curl' && (
                    <div className="space-y-8">
                      <div>
                        <h3 className="text-lg font-semibold text-slate-900 mb-3">Health Check</h3>
                        <CodeBlock 
                          code={`curl -X GET "https://api.robotpdf.com/api/v1/health" \\
  -H "X-API-Key: pk_live_YOUR_KEY" \\
  -H "X-API-Secret: sk_live_YOUR_SECRET"`}
                          id="curl-health"
                        />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-slate-900 mb-3">OCR - Extract Text from Image</h3>
                        <CodeBlock 
                          code={`curl -X POST "https://api.robotpdf.com/api/v1/ocr" \\
  -H "X-API-Key: pk_live_YOUR_KEY" \\
  -H "X-API-Secret: sk_live_YOUR_SECRET" \\
  -F "file=@document.png" \\
  -F "language=eng" \\
  -F "ai_enhanced=true"`}
                          id="curl-ocr"
                        />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-slate-900 mb-3">Summarize Text</h3>
                        <CodeBlock 
                          code={`curl -X POST "https://api.robotpdf.com/api/v1/summarize" \\
  -H "X-API-Key: pk_live_YOUR_KEY" \\
  -H "X-API-Secret: sk_live_YOUR_SECRET" \\
  -H "Content-Type: application/json" \\
  -d '{
    "text": "Your long document text here...",
    "summary_type": "brief"
  }'`}
                          id="curl-summarize"
                        />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-slate-900 mb-3">Compress PDF</h3>
                        <CodeBlock 
                          code={`curl -X POST "https://api.robotpdf.com/api/v1/compress" \\
  -H "X-API-Key: pk_live_YOUR_KEY" \\
  -H "X-API-Secret: sk_live_YOUR_SECRET" \\
  -F "file=@document.pdf" \\
  -F "quality=medium"`}
                          id="curl-compress"
                        />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-slate-900 mb-3">Merge PDFs</h3>
                        <CodeBlock 
                          code={`curl -X POST "https://api.robotpdf.com/api/v1/merge" \\
  -H "X-API-Key: pk_live_YOUR_KEY" \\
  -H "X-API-Secret: sk_live_YOUR_SECRET" \\
  -F "files=@file1.pdf" \\
  -F "files=@file2.pdf" \\
  -F "files=@file3.pdf"`}
                          id="curl-merge"
                        />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-slate-900 mb-3">Convert PDF to Word</h3>
                        <CodeBlock 
                          code={`curl -X POST "https://api.robotpdf.com/api/v1/convert/pdf-to-docx" \\
  -H "X-API-Key: pk_live_YOUR_KEY" \\
  -H "X-API-Secret: sk_live_YOUR_SECRET" \\
  -F "file=@document.pdf" \\
  -o converted.docx.base64`}
                          id="curl-convert"
                        />
                      </div>
                    </div>
                  )}

                  {/* Node.js Examples */}
                  {selectedPlatform === 'nodejs' && (
                    <div className="space-y-8">
                      <div>
                        <h3 className="text-lg font-semibold text-slate-900 mb-3">Installation</h3>
                        <CodeBlock code="npm install axios form-data" id="node-install" />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-slate-900 mb-3">Setup & Configuration</h3>
                        <CodeBlock 
                          code={`const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');

const API_KEY = process.env.ROBOTPDF_API_KEY;
const API_SECRET = process.env.ROBOTPDF_API_SECRET;
const BASE_URL = 'https://api.robotpdf.com/api/v1';

// Create axios instance with default headers
const api = axios.create({
  baseURL: BASE_URL,
  headers: {
    'X-API-Key': API_KEY,
    'X-API-Secret': API_SECRET
  }
});`}
                          id="node-setup"
                        />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-slate-900 mb-3">OCR - Extract Text</h3>
                        <CodeBlock 
                          code={`async function extractText(filePath) {
  const formData = new FormData();
  formData.append('file', fs.createReadStream(filePath));
  formData.append('language', 'eng');
  formData.append('ai_enhanced', 'true');
  
  try {
    const response = await api.post('/ocr', formData, {
      headers: formData.getHeaders()
    });
    
    console.log('Extracted text:', response.data.data.text);
    console.log('Confidence:', response.data.data.confidence);
    return response.data.data;
  } catch (error) {
    console.error('OCR Error:', error.response?.data || error.message);
    throw error;
  }
}

// Usage
extractText('./document.png').then(result => {
  console.log(result.text);
});`}
                          id="node-ocr"
                        />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-slate-900 mb-3">Summarize Text</h3>
                        <CodeBlock 
                          code={`async function summarizeText(text, summaryType = 'brief') {
  try {
    const response = await api.post('/summarize', {
      text,
      summary_type: summaryType
    });
    
    return response.data.data.summary;
  } catch (error) {
    console.error('Summarize Error:', error.response?.data || error.message);
    throw error;
  }
}

// Usage
const longText = 'Your long document text here...';
summarizeText(longText, 'bullet_points').then(summary => {
  console.log('Summary:', summary);
});`}
                          id="node-summarize"
                        />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-slate-900 mb-3">Compress PDF</h3>
                        <CodeBlock 
                          code={`async function compressPdf(filePath, quality = 'medium') {
  const formData = new FormData();
  formData.append('file', fs.createReadStream(filePath));
  formData.append('quality', quality);
  
  try {
    const response = await api.post('/compress', formData, {
      headers: formData.getHeaders()
    });
    
    // Decode base64 and save
    const buffer = Buffer.from(response.data.data.file_base64, 'base64');
    fs.writeFileSync('compressed.pdf', buffer);
    
    console.log('Original size:', response.data.data.original_size);
    console.log('Compressed size:', response.data.data.compressed_size);
    console.log('Compression ratio:', response.data.data.compression_ratio);
    
    return response.data.data;
  } catch (error) {
    console.error('Compress Error:', error.response?.data || error.message);
    throw error;
  }
}

// Usage
compressPdf('./large-document.pdf', 'high');`}
                          id="node-compress"
                        />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-slate-900 mb-3">Error Handling</h3>
                        <CodeBlock 
                          code={`async function apiRequest(endpoint, options = {}) {
  try {
    const response = await api.request({
      url: endpoint,
      ...options
    });
    return response.data;
  } catch (error) {
    if (error.response) {
      // Server responded with error
      const { status, data } = error.response;
      
      switch (status) {
        case 401:
          console.error('Authentication failed. Check your API credentials.');
          break;
        case 429:
          console.error('Rate limit exceeded. Waiting before retry...');
          // Implement exponential backoff
          await new Promise(r => setTimeout(r, data.reset_in_seconds * 1000));
          return apiRequest(endpoint, options); // Retry
        case 400:
          console.error('Bad request:', data.message);
          break;
        default:
          console.error('API Error:', data.message || 'Unknown error');
      }
      
      throw new Error(data.message || 'API request failed');
    }
    throw error;
  }
}`}
                          id="node-error"
                        />
                      </div>
                    </div>
                  )}

                  {/* Python Examples */}
                  {selectedPlatform === 'python' && (
                    <div className="space-y-8">
                      <div>
                        <h3 className="text-lg font-semibold text-slate-900 mb-3">Installation</h3>
                        <CodeBlock code="pip install requests" id="python-install" />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-slate-900 mb-3">Setup & Configuration</h3>
                        <CodeBlock 
                          code={`import requests
import os
import base64

API_KEY = os.environ.get('ROBOTPDF_API_KEY')
API_SECRET = os.environ.get('ROBOTPDF_API_SECRET')
BASE_URL = 'https://api.robotpdf.com/api/v1'

headers = {
    'X-API-Key': API_KEY,
    'X-API-Secret': API_SECRET
}`}
                          id="python-setup"
                        />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-slate-900 mb-3">OCR - Extract Text</h3>
                        <CodeBlock 
                          code={`def extract_text(file_path, language='eng', ai_enhanced=True):
    """Extract text from an image or PDF using OCR."""
    with open(file_path, 'rb') as f:
        files = {'file': f}
        data = {
            'language': language,
            'ai_enhanced': str(ai_enhanced).lower()
        }
        
        response = requests.post(
            f'{BASE_URL}/ocr',
            headers=headers,
            files=files,
            data=data
        )
    
    response.raise_for_status()
    result = response.json()
    
    return {
        'text': result['data']['text'],
        'confidence': result['data']['confidence'],
        'pages': result['data'].get('pages', [])
    }

# Usage
result = extract_text('document.png')
print(f"Extracted text: {result['text']}")
print(f"Confidence: {result['confidence']}")`}
                          id="python-ocr"
                        />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-slate-900 mb-3">Summarize Text</h3>
                        <CodeBlock 
                          code={`def summarize_text(text, summary_type='brief'):
    """Generate a summary of the provided text."""
    response = requests.post(
        f'{BASE_URL}/summarize',
        headers={**headers, 'Content-Type': 'application/json'},
        json={
            'text': text,
            'summary_type': summary_type
        }
    )
    
    response.raise_for_status()
    return response.json()['data']['summary']

# Usage
long_text = "Your long document text here..."
summary = summarize_text(long_text, 'bullet_points')
print(f"Summary: {summary}")`}
                          id="python-summarize"
                        />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-slate-900 mb-3">Compress PDF</h3>
                        <CodeBlock 
                          code={`def compress_pdf(file_path, quality='medium', output_path='compressed.pdf'):
    """Compress a PDF file."""
    with open(file_path, 'rb') as f:
        files = {'file': f}
        data = {'quality': quality}
        
        response = requests.post(
            f'{BASE_URL}/compress',
            headers=headers,
            files=files,
            data=data
        )
    
    response.raise_for_status()
    result = response.json()['data']
    
    # Decode and save the compressed PDF
    pdf_bytes = base64.b64decode(result['file_base64'])
    with open(output_path, 'wb') as f:
        f.write(pdf_bytes)
    
    print(f"Original: {result['original_size']} bytes")
    print(f"Compressed: {result['compressed_size']} bytes")
    print(f"Ratio: {result['compression_ratio']}")
    
    return output_path

# Usage
compress_pdf('large-document.pdf', 'high', 'output.pdf')`}
                          id="python-compress"
                        />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-slate-900 mb-3">Convert PDF to Word</h3>
                        <CodeBlock 
                          code={`def pdf_to_docx(file_path, output_path='converted.docx'):
    """Convert a PDF to Word document."""
    with open(file_path, 'rb') as f:
        files = {'file': f}
        
        response = requests.post(
            f'{BASE_URL}/convert/pdf-to-docx',
            headers=headers,
            files=files
        )
    
    response.raise_for_status()
    result = response.json()['data']
    
    # Decode and save the DOCX file
    docx_bytes = base64.b64decode(result['file_base64'])
    with open(output_path, 'wb') as f:
        f.write(docx_bytes)
    
    return output_path

# Usage
pdf_to_docx('document.pdf', 'document.docx')`}
                          id="python-convert"
                        />
                      </div>
                    </div>
                  )}

                  {/* PHP Examples */}
                  {selectedPlatform === 'php' && (
                    <div className="space-y-8">
                      <div>
                        <h3 className="text-lg font-semibold text-slate-900 mb-3">Setup & Configuration</h3>
                        <CodeBlock 
                          code={`<?php
$apiKey = getenv('ROBOTPDF_API_KEY');
$apiSecret = getenv('ROBOTPDF_API_SECRET');
$baseUrl = 'https://api.robotpdf.com/api/v1';

function getHeaders() {
    global $apiKey, $apiSecret;
    return [
        'X-API-Key: ' . $apiKey,
        'X-API-Secret: ' . $apiSecret
    ];
}`}
                          id="php-setup"
                        />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-slate-900 mb-3">OCR - Extract Text</h3>
                        <CodeBlock 
                          code={`<?php
function extractText($filePath, $language = 'eng') {
    global $baseUrl;
    
    $ch = curl_init("$baseUrl/ocr");
    $cfile = new CURLFile($filePath);
    
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_POST, true);
    curl_setopt($ch, CURLOPT_HTTPHEADER, getHeaders());
    curl_setopt($ch, CURLOPT_POSTFIELDS, [
        'file' => $cfile,
        'language' => $language,
        'ai_enhanced' => 'true'
    ]);
    
    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);
    
    if ($httpCode !== 200) {
        throw new Exception("API Error: " . $response);
    }
    
    return json_decode($response, true)['data'];
}

// Usage
$result = extractText('document.png');
echo "Text: " . $result['text'];
?>`}
                          id="php-ocr"
                        />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-slate-900 mb-3">Summarize Text</h3>
                        <CodeBlock 
                          code={`<?php
function summarizeText($text, $summaryType = 'brief') {
    global $baseUrl;
    
    $ch = curl_init("$baseUrl/summarize");
    
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_POST, true);
    curl_setopt($ch, CURLOPT_HTTPHEADER, array_merge(
        getHeaders(),
        ['Content-Type: application/json']
    ));
    curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode([
        'text' => $text,
        'summary_type' => $summaryType
    ]));
    
    $response = curl_exec($ch);
    curl_close($ch);
    
    return json_decode($response, true)['data']['summary'];
}

// Usage
$summary = summarizeText('Your long text here...', 'bullet_points');
echo $summary;
?>`}
                          id="php-summarize"
                        />
                      </div>
                    </div>
                  )}

                  {/* Java Examples */}
                  {selectedPlatform === 'java' && (
                    <div className="space-y-8">
                      <div>
                        <h3 className="text-lg font-semibold text-slate-900 mb-3">Dependencies (Maven)</h3>
                        <CodeBlock 
                          code={`<dependencies>
    <dependency>
        <groupId>com.squareup.okhttp3</groupId>
        <artifactId>okhttp</artifactId>
        <version>4.12.0</version>
    </dependency>
    <dependency>
        <groupId>com.google.code.gson</groupId>
        <artifactId>gson</artifactId>
        <version>2.10.1</version>
    </dependency>
</dependencies>`}
                          id="java-deps"
                        />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-slate-900 mb-3">API Client Class</h3>
                        <CodeBlock 
                          code={`import okhttp3.*;
import com.google.gson.Gson;
import java.io.File;
import java.io.IOException;
import java.util.Map;

public class RobotPDFClient {
    private static final String API_KEY = System.getenv("ROBOTPDF_API_KEY");
    private static final String API_SECRET = System.getenv("ROBOTPDF_API_SECRET");
    private static final String BASE_URL = "https://api.robotpdf.com/api/v1";
    
    private final OkHttpClient client = new OkHttpClient();
    private final Gson gson = new Gson();
    
    public String summarizeText(String text, String summaryType) throws IOException {
        String json = gson.toJson(Map.of(
            "text", text,
            "summary_type", summaryType
        ));
        
        RequestBody body = RequestBody.create(
            json, MediaType.parse("application/json")
        );
        
        Request request = new Request.Builder()
            .url(BASE_URL + "/summarize")
            .addHeader("X-API-Key", API_KEY)
            .addHeader("X-API-Secret", API_SECRET)
            .post(body)
            .build();
        
        try (Response response = client.newCall(request).execute()) {
            return response.body().string();
        }
    }
    
    public String extractText(File file) throws IOException {
        RequestBody fileBody = RequestBody.create(
            file, MediaType.parse("application/octet-stream")
        );
        
        MultipartBody body = new MultipartBody.Builder()
            .setType(MultipartBody.FORM)
            .addFormDataPart("file", file.getName(), fileBody)
            .addFormDataPart("language", "eng")
            .build();
        
        Request request = new Request.Builder()
            .url(BASE_URL + "/ocr")
            .addHeader("X-API-Key", API_KEY)
            .addHeader("X-API-Secret", API_SECRET)
            .post(body)
            .build();
        
        try (Response response = client.newCall(request).execute()) {
            return response.body().string();
        }
    }
}`}
                          id="java-client"
                        />
                      </div>
                    </div>
                  )}

                  {/* C# Examples */}
                  {selectedPlatform === 'csharp' && (
                    <div className="space-y-8">
                      <div>
                        <h3 className="text-lg font-semibold text-slate-900 mb-3">Installation</h3>
                        <CodeBlock code="dotnet add package Newtonsoft.Json" id="csharp-install" />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-slate-900 mb-3">API Client Class</h3>
                        <CodeBlock 
                          code={`using System;
using System.Net.Http;
using System.Text;
using System.Threading.Tasks;
using Newtonsoft.Json;

public class RobotPDFClient
{
    private const string BaseUrl = "https://api.robotpdf.com/api/v1";
    private readonly HttpClient _client;
    
    public RobotPDFClient(string apiKey, string apiSecret)
    {
        _client = new HttpClient();
        _client.DefaultRequestHeaders.Add("X-API-Key", apiKey);
        _client.DefaultRequestHeaders.Add("X-API-Secret", apiSecret);
    }
    
    public async Task<string> SummarizeTextAsync(string text, string summaryType = "brief")
    {
        var payload = new { text, summary_type = summaryType };
        var content = new StringContent(
            JsonConvert.SerializeObject(payload),
            Encoding.UTF8,
            "application/json"
        );
        
        var response = await _client.PostAsync($"{BaseUrl}/summarize", content);
        response.EnsureSuccessStatusCode();
        return await response.Content.ReadAsStringAsync();
    }
    
    public async Task<string> ExtractTextAsync(string filePath)
    {
        using var form = new MultipartFormDataContent();
        using var fileStream = File.OpenRead(filePath);
        form.Add(new StreamContent(fileStream), "file", Path.GetFileName(filePath));
        form.Add(new StringContent("eng"), "language");
        
        var response = await _client.PostAsync($"{BaseUrl}/ocr", form);
        response.EnsureSuccessStatusCode();
        return await response.Content.ReadAsStringAsync();
    }
}

// Usage
var client = new RobotPDFClient(
    Environment.GetEnvironmentVariable("ROBOTPDF_API_KEY"),
    Environment.GetEnvironmentVariable("ROBOTPDF_API_SECRET")
);
var summary = await client.SummarizeTextAsync("Your text here...");`}
                          id="csharp-client"
                        />
                      </div>
                    </div>
                  )}

                  {/* Go Examples */}
                  {selectedPlatform === 'go' && (
                    <div className="space-y-8">
                      <div>
                        <h3 className="text-lg font-semibold text-slate-900 mb-3">API Client</h3>
                        <CodeBlock 
                          code={`package main

import (
    "bytes"
    "encoding/json"
    "io"
    "mime/multipart"
    "net/http"
    "os"
)

const BaseURL = "https://api.robotpdf.com/api/v1"

type Client struct {
    APIKey    string
    APISecret string
    HTTP      *http.Client
}

func NewClient(apiKey, apiSecret string) *Client {
    return &Client{
        APIKey:    apiKey,
        APISecret: apiSecret,
        HTTP:      &http.Client{},
    }
}

func (c *Client) SummarizeText(text, summaryType string) (string, error) {
    payload := map[string]string{
        "text":         text,
        "summary_type": summaryType,
    }
    jsonData, _ := json.Marshal(payload)
    
    req, _ := http.NewRequest("POST", BaseURL+"/summarize", bytes.NewBuffer(jsonData))
    req.Header.Set("X-API-Key", c.APIKey)
    req.Header.Set("X-API-Secret", c.APISecret)
    req.Header.Set("Content-Type", "application/json")
    
    resp, err := c.HTTP.Do(req)
    if err != nil {
        return "", err
    }
    defer resp.Body.Close()
    
    body, _ := io.ReadAll(resp.Body)
    return string(body), nil
}

func main() {
    client := NewClient(
        os.Getenv("ROBOTPDF_API_KEY"),
        os.Getenv("ROBOTPDF_API_SECRET"),
    )
    
    result, _ := client.SummarizeText("Your text here...", "brief")
    println(result)
}`}
                          id="go-client"
                        />
                      </div>
                    </div>
                  )}

                  {/* Ruby Examples */}
                  {selectedPlatform === 'ruby' && (
                    <div className="space-y-8">
                      <div>
                        <h3 className="text-lg font-semibold text-slate-900 mb-3">Installation</h3>
                        <CodeBlock code="gem install httparty" id="ruby-install" />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-slate-900 mb-3">API Client</h3>
                        <CodeBlock 
                          code={`require 'httparty'
require 'json'

class RobotPDFClient
  BASE_URL = 'https://api.robotpdf.com/api/v1'
  
  def initialize(api_key, api_secret)
    @headers = {
      'X-API-Key' => api_key,
      'X-API-Secret' => api_secret
    }
  end
  
  def summarize_text(text, summary_type = 'brief')
    response = HTTParty.post(
      "#{BASE_URL}/summarize",
      headers: @headers.merge('Content-Type' => 'application/json'),
      body: { text: text, summary_type: summary_type }.to_json
    )
    JSON.parse(response.body)['data']['summary']
  end
  
  def extract_text(file_path)
    response = HTTParty.post(
      "#{BASE_URL}/ocr",
      headers: @headers,
      multipart: true,
      body: {
        file: File.open(file_path),
        language: 'eng'
      }
    )
    JSON.parse(response.body)['data']
  end
end

# Usage
client = RobotPDFClient.new(
  ENV['ROBOTPDF_API_KEY'],
  ENV['ROBOTPDF_API_SECRET']
)
summary = client.summarize_text('Your text here...')
puts summary`}
                          id="ruby-client"
                        />
                      </div>
                    </div>
                  )}
                </div>
              </motion.div>
            )}


            {/* SDKs & Libraries */}
            {activeSection === 'sdks' && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-6"
              >
                <div className="bg-white border-2 border-gray-200 rounded-2xl p-8 shadow-md">
                  <h2 className="text-2xl font-bold text-slate-900 mb-4">SDKs & Libraries</h2>
                  <p className="text-slate-600 mb-6">
                    While we don't have official SDKs yet, you can easily integrate with our REST API using standard HTTP libraries in any language.
                  </p>

                  <h3 className="text-xl font-semibold text-slate-900 mt-6 mb-4">Recommended Libraries</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {[
                      { lang: 'Node.js', lib: 'axios, node-fetch', icon: '🟢' },
                      { lang: 'Python', lib: 'requests, httpx', icon: '🐍' },
                      { lang: 'PHP', lib: 'Guzzle, cURL', icon: '🐘' },
                      { lang: 'Java', lib: 'OkHttp, HttpClient', icon: '☕' },
                      { lang: 'C#', lib: 'HttpClient, RestSharp', icon: '💜' },
                      { lang: 'Go', lib: 'net/http', icon: '🔵' },
                      { lang: 'Ruby', lib: 'HTTParty, Faraday', icon: '💎' },
                      { lang: 'Rust', lib: 'reqwest', icon: '🦀' }
                    ].map((item, i) => (
                      <div key={i} className="p-4 bg-slate-50 rounded-xl flex items-center gap-3">
                        <span className="text-2xl">{item.icon}</span>
                        <div>
                          <div className="font-medium text-slate-900">{item.lang}</div>
                          <div className="text-sm text-slate-600">{item.lib}</div>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="mt-8 p-4 bg-indigo-50 border border-indigo-200 rounded-xl">
                    <div className="flex gap-3">
                      <Info className="w-5 h-5 text-indigo-600 flex-shrink-0 mt-0.5" />
                      <div>
                        <h4 className="font-semibold text-indigo-800 mb-1">Community SDKs</h4>
                        <p className="text-sm text-indigo-700">
                          We welcome community-contributed SDKs! If you've built an SDK for RobotPDF, let us know and we'll feature it here.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Webhook Integration */}
                <div className="bg-white border-2 border-gray-200 rounded-2xl p-8 shadow-md">
                  <h3 className="text-xl font-semibold text-slate-900 mb-4">Webhook Integration (Coming Soon)</h3>
                  <p className="text-slate-600 mb-4">
                    We're working on webhook support for async processing of large files. Stay tuned for updates!
                  </p>
                  <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl">
                    <p className="text-sm text-amber-800">
                      <strong>Interested in webhooks?</strong> Contact us at support@robotpdf.com to be notified when this feature launches.
                    </p>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Security */}
            {activeSection === 'security' && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-6"
              >
                <div className="bg-white border-2 border-gray-200 rounded-2xl p-8 shadow-md">
                  <h2 className="text-2xl font-bold text-slate-900 mb-4">Security Best Practices</h2>
                  <p className="text-slate-600 mb-6">
                    Follow these guidelines to keep your API integration secure.
                  </p>

                  <div className="space-y-4">
                    {[
                      {
                        icon: Lock,
                        title: 'Never expose API secrets in client-side code',
                        description: 'API calls should always be made from your backend server, never from browsers or mobile apps directly.'
                      },
                      {
                        icon: Shield,
                        title: 'Use environment variables',
                        description: 'Store API credentials in environment variables, not in your source code or configuration files.'
                      },
                      {
                        icon: Key,
                        title: 'Rotate keys regularly',
                        description: 'Regenerate your API keys periodically and immediately if you suspect they may have been compromised.'
                      },
                      {
                        icon: Globe,
                        title: 'Use HTTPS only',
                        description: 'All API requests must use HTTPS. HTTP requests will be rejected.'
                      },
                      {
                        icon: Database,
                        title: 'Implement proper error handling',
                        description: 'Never expose raw API errors to end users. Log errors securely and show generic messages.'
                      },
                      {
                        icon: Clock,
                        title: 'Monitor your usage',
                        description: 'Regularly check your API usage for unusual patterns that might indicate unauthorized access.'
                      }
                    ].map((item, i) => (
                      <div key={i} className="flex gap-4 p-4 bg-slate-50 rounded-xl">
                        <div className="flex-shrink-0 w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center">
                          <item.icon className="w-5 h-5 text-indigo-600" />
                        </div>
                        <div>
                          <h4 className="font-semibold text-slate-900">{item.title}</h4>
                          <p className="text-sm text-slate-600 mt-1">{item.description}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Data Handling */}
                <div className="bg-white border-2 border-gray-200 rounded-2xl p-8 shadow-md">
                  <h3 className="text-xl font-semibold text-slate-900 mb-4">Data Handling & Privacy</h3>
                  <div className="space-y-4">
                    <div className="p-4 bg-green-50 border border-green-200 rounded-xl">
                      <div className="flex gap-3">
                        <Check className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                        <div>
                          <h4 className="font-semibold text-green-800">Files are processed and deleted</h4>
                          <p className="text-sm text-green-700">Uploaded files are processed immediately and deleted from our servers after processing completes.</p>
                        </div>
                      </div>
                    </div>
                    <div className="p-4 bg-green-50 border border-green-200 rounded-xl">
                      <div className="flex gap-3">
                        <Check className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                        <div>
                          <h4 className="font-semibold text-green-800">Encrypted in transit</h4>
                          <p className="text-sm text-green-700">All data is encrypted using TLS 1.2+ during transmission.</p>
                        </div>
                      </div>
                    </div>
                    <div className="p-4 bg-green-50 border border-green-200 rounded-xl">
                      <div className="flex gap-3">
                        <Check className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                        <div>
                          <h4 className="font-semibold text-green-800">API logs retained for 30 days</h4>
                          <p className="text-sm text-green-700">Request logs (without file content) are retained for 30 days for debugging purposes.</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Reporting Security Issues */}
                <div className="bg-white border-2 border-gray-200 rounded-2xl p-8 shadow-md">
                  <h3 className="text-xl font-semibold text-slate-900 mb-4">Reporting Security Issues</h3>
                  <p className="text-slate-600 mb-4">
                    If you discover a security vulnerability, please report it responsibly:
                  </p>
                  <div className="p-4 bg-slate-50 rounded-xl">
                    <p className="text-slate-700">
                      Email: <a href="mailto:security@robotpdf.com" className="text-indigo-600 hover:underline">security@robotpdf.com</a>
                    </p>
                    <p className="text-sm text-slate-500 mt-2">
                      Please include detailed steps to reproduce the issue. We'll respond within 48 hours.
                    </p>
                  </div>
                </div>
              </motion.div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// Helper function to generate cURL examples
function generateCurlExample(endpoint) {
  const BASE_URL = 'https://api.robotpdf.com/api/v1';
  let curl = `curl -X ${endpoint.method} "${BASE_URL}${endpoint.path}"`;
  curl += ` \\\n  -H "X-API-Key: pk_live_YOUR_KEY"`;
  curl += ` \\\n  -H "X-API-Secret: sk_live_YOUR_SECRET"`;
  
  if (endpoint.contentType === 'application/json' && endpoint.requestBody) {
    curl += ` \\\n  -H "Content-Type: application/json"`;
    const sampleBody = {};
    Object.entries(endpoint.requestBody).forEach(([key, value]) => {
      if (value.required) {
        sampleBody[key] = value.type === 'string' ? 'example_value' : 
                         value.type === 'object' ? {} : 'value';
      }
    });
    if (Object.keys(sampleBody).length > 0) {
      curl += ` \\\n  -d '${JSON.stringify(sampleBody, null, 2).replace(/\n/g, '\n  ')}'`;
    }
  } else if (endpoint.contentType === 'multipart/form-data' && endpoint.requestBody) {
    Object.entries(endpoint.requestBody).forEach(([key, value]) => {
      if (value.type === 'File') {
        curl += ` \\\n  -F "${key}=@example.pdf"`;
      } else if (value.type === 'File[]') {
        curl += ` \\\n  -F "${key}=@file1.pdf"`;
        curl += ` \\\n  -F "${key}=@file2.pdf"`;
      } else if (value.required || value.default) {
        curl += ` \\\n  -F "${key}=${value.default || 'value'}"`;
      }
    });
  }
  
  return curl;
}

export default DeveloperDocs;
