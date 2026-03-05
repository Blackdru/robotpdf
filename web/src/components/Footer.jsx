import { Link } from 'react-router-dom'
import { FileText, Heart, Shield, CreditCard, RefreshCw, Mail, Code, Book } from 'lucide-react'

const Footer = () => {
  return (
    <footer className="bg-gradient-to-b from-white to-slate-50 border-t border-gray-200 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-2 md:grid-cols-6 gap-6 md:gap-8">
          {/* Brand */}
          <div className="col-span-1 md:col-span-2">
            <div className="flex items-center space-x-3 mb-4">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl blur-lg opacity-20"></div>
                <img src="/icon.png" alt="RobotPDF" className="relative h-10 w-10 object-contain" />
              </div>
              <div>
                <span className="text-xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                  RobotPDF
                </span>
                <p className="text-xs text-slate-500 font-medium">
                  AI-Powered Platform
                </p>
              </div>
            </div>
            <p className="text-slate-600 text-sm mb-4 max-w-md leading-relaxed">
              Transform your PDF workflow with intelligent OCR, AI-powered summaries,
              and advanced document processing tools.
            </p>
            
          </div>

          {/* Legal */}
          <div>
            <h3 className="text-slate-900 font-semibold mb-4">Legal</h3>
            <div className="space-y-3">
              <Link
                to="/privacy-policy"
                className="flex items-center text-slate-600 hover:text-indigo-600 transition-colors text-sm"
              >
                <Shield className="h-4 w-4 mr-2" />
                Privacy Policy
              </Link>
              <Link
                to="/terms-conditions"
                className="flex items-center text-slate-600 hover:text-indigo-600 transition-colors text-sm"
              >
                <FileText className="h-4 w-4 mr-2" />
                Terms & Conditions
              </Link>
              <Link
                to="/cancellation-refunds"
                className="flex items-center text-slate-600 hover:text-indigo-600 transition-colors text-sm"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Cancellation & Refunds
              </Link>
            </div>
          </div>

          {/* PDF Tools */}
          <div>
            <h3 className="text-slate-900 font-semibold mb-4">PDF Tools</h3>
            <div className="space-y-2">
              <Link to="/merge-pdf" className="block text-slate-600 hover:text-blue-600 transition-colors text-sm">Merge PDF</Link>
              <Link to="/split-pdf" className="block text-slate-600 hover:text-emerald-600 transition-colors text-sm">Split PDF</Link>
              <Link to="/compress-pdf" className="block text-slate-600 hover:text-orange-600 transition-colors text-sm">Compress PDF</Link>
              <Link to="/password-remover" className="block text-slate-600 hover:text-amber-600 transition-colors text-sm">Remove Password</Link>
               <Link to="/ai-enhanced-ocr-pdf" className="block text-slate-600 hover:text-purple-600 transition-colors text-sm">AI OCR</Link>
              <Link to="/ai-chat-with-pdf" className="block text-slate-600 hover:text-purple-600 transition-colors text-sm">Chat with PDF</Link>
              <Link to="/ai-smart-summary" className="block text-slate-600 hover:text-purple-600 transition-colors text-sm">AI Summary</Link>
            </div>
          </div>

          {/* Convert Tools */}
          <div>
            <h3 className="text-slate-900 font-semibold mb-4">Convert</h3>
            <div className="space-y-2">
              <Link to="/image-to-pdf" className="block text-slate-600 hover:text-cyan-600 transition-colors text-sm">Image to PDF</Link>
              <Link to="/word-to-pdf" className="block text-slate-600 hover:text-indigo-600 transition-colors text-sm">Word to PDF</Link>
              <Link to="/excel-to-pdf" className="block text-slate-600 hover:text-green-600 transition-colors text-sm">Excel to PDF</Link>
              <Link to="/pdf-to-excel" className="block text-slate-600 hover:text-green-600 transition-colors text-sm">PDF to Excel</Link>
              <Link to="/html-to-pdf" className="block text-slate-600 hover:text-teal-600 transition-colors text-sm">HTML to PDF</Link>
              <Link to="/text-to-pdf" className="block text-slate-600 hover:text-violet-600 transition-colors text-sm">Text to PDF</Link>
              <Link to="/image-compress" className="block text-slate-600 hover:text-pink-600 transition-colors text-sm">Compress Images</Link>
            </div>
          </div>

          {/* Resources */}
          <div>
            <h3 className="text-slate-900 font-semibold mb-4">Resources</h3>
            <div className="space-y-2">
              <Link to="/developers/docs" className="block text-slate-600 hover:text-indigo-600 transition-colors text-sm">API Docs</Link>
              <Link to="/pricing" className="block text-slate-600 hover:text-indigo-600 transition-colors text-sm">Pricing</Link>
              <Link to="/contact" className="block text-slate-600 hover:text-indigo-600 transition-colors text-sm">Contact Us</Link>
            </div>
          </div>
        </div>

        {/* Bottom */}
        <div className="border-t border-gray-200 mt-8 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex flex-col md:flex-row items-center gap-4">
            <p className="text-slate-600 text-sm">
              © 2026 Budrock Technologies Private Limited. All rights reserved.
            </p>
            <div className="flex items-center px-3 py-1.5 rounded-lg bg-gradient-to-r from-orange-50 to-green-50 border border-orange-200">
              <span className="text-sm mr-1.5">🇮🇳</span>
              <span className="text-xs font-semibold bg-gradient-to-r from-orange-600 to-green-600 bg-clip-text text-transparent">
                Made in India
              </span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}

export default Footer