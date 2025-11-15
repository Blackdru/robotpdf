import { Shield, Lock, Eye, Database, UserCheck, Globe } from 'lucide-react'
import { Card } from '../components/ui/card'

const PrivacyPolicy = () => {
  return (
    <div className="min-h-screen bg-gradient-to-b from-white via-slate-50 to-white py-12 relative overflow-hidden">
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -left-40 w-[600px] h-[600px] bg-gradient-to-br from-indigo-100/30 to-purple-100/30 rounded-full blur-3xl"></div>
        <div className="absolute top-40 -right-40 w-[500px] h-[500px] bg-gradient-to-br from-blue-100/30 to-cyan-100/30 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-40 left-1/4 w-[700px] h-[700px] bg-gradient-to-br from-purple-100/20 to-pink-100/20 rounded-full blur-3xl"></div>
      </div>
      <div className="layout-dark-container relative z-10">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12 animate-fade-in">
            <div className="w-16 h-16 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg">
              <Shield className="h-8 w-8 text-white" />
            </div>
            <h1 className="text-3xl font-extrabold text-slate-900 mb-4">Privacy Policy</h1>
            <p className="text-slate-600 text-lg leading-relaxed">
              Your privacy is our priority. Learn how we protect and handle your data.
            </p>
            <p className="text-slate-500 text-sm mt-2 font-medium">
              Last updated: {new Date().toLocaleDateString()}
            </p>
          </div>

          {/* Content */}
          <div className="space-y-8">
            <Card className="bg-white/90 backdrop-blur-sm border border-slate-200/50 p-8 hover:shadow-lg transition-all duration-300">
              <div className="flex items-center mb-6">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center mr-3">
                  <Database className="h-5 w-5 text-white" />
                </div>
                <h2 className="text-2xl font-bold text-slate-900">Information We Collect</h2>
              </div>
              <div className="space-y-4 text-muted-foreground">
                <p>
                  We collect information you provide directly to us, such as when you create an account, 
                  upload documents, or contact us for support.
                </p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>Account information (email, name, password)</li>
                  <li>Document content for processing (OCR, AI analysis)</li>
                  <li>Usage data and analytics</li>
                  <li>Payment information (processed securely through Stripe)</li>
                  <li>Communication records with our support team</li>
                </ul>
              </div>
            </Card>

            <Card className="bg-surface border-border p-8">
              <div className="flex items-center mb-6">
                <Eye className="h-6 w-6 text-green-400 mr-3" />
                <h2 className="text-2xl font-semibold text-card-foreground">How We Use Your Information</h2>
              </div>
              <div className="space-y-4 text-muted-foreground">
                <p>
                  We use the information we collect to provide, maintain, and improve our services:
                </p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>Process and analyze your documents using OCR and AI</li>
                  <li>Provide customer support and respond to inquiries</li>
                  <li>Send important service updates and notifications</li>
                  <li>Improve our services and develop new features</li>
                  <li>Prevent fraud and ensure platform security</li>
                  <li>Comply with legal obligations</li>
                </ul>
              </div>
            </Card>

            <Card className="bg-surface border-border p-8">
              <div className="flex items-center mb-6">
                <Lock className="h-6 w-6 text-purple-400 mr-3" />
                <h2 className="text-2xl font-semibold text-card-foreground">Data Security</h2>
              </div>
              <div className="space-y-4 text-muted-foreground">
                <p>
                  We implement industry-standard security measures to protect your data:
                </p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>End-to-end encryption for data transmission</li>
                  <li>Secure cloud storage with access controls</li>
                  <li>Regular security audits and monitoring</li>
                  <li>Document processing in isolated environments</li>
                  <li>Automatic deletion of processed documents after 30 days</li>
                  <li>Two-factor authentication support</li>
                </ul>
              </div>
            </Card>

            <Card className="bg-surface border-border p-8">
              <div className="flex items-center mb-6">
                <Globe className="h-6 w-6 text-orange-400 mr-3" />
                <h2 className="text-2xl font-semibold text-card-foreground">Data Sharing</h2>
              </div>
              <div className="space-y-4 text-muted-foreground">
                <p>
                  We do not sell, trade, or rent your personal information. We may share data only in these limited circumstances:
                </p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>With your explicit consent</li>
                  <li>To comply with legal requirements</li>
                  <li>With trusted service providers (under strict confidentiality agreements)</li>
                  <li>To protect our rights and prevent fraud</li>
                  <li>In case of business transfer (with prior notice)</li>
                </ul>
              </div>
            </Card>

            <Card className="bg-surface border-border p-8">
              <div className="flex items-center mb-6">
                <UserCheck className="h-6 w-6 text-yellow-400 mr-3" />
                <h2 className="text-2xl font-semibold text-card-foreground">Your Rights</h2>
              </div>
              <div className="space-y-4 text-muted-foreground">
                <p>
                  You have the following rights regarding your personal data:
                </p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>Access and download your data</li>
                  <li>Correct inaccurate information</li>
                  <li>Delete your account and associated data</li>
                  <li>Restrict processing of your data</li>
                  <li>Data portability</li>
                  <li>Withdraw consent at any time</li>
                </ul>
                <p className="mt-4">
                  To exercise these rights, contact us at{' '}
                  <a href="mailto:privacy@robotpdf.com" className="text-blue-400 hover:text-blue-300">
                    privacy@robotpdf.com
                  </a>
                </p>
              </div>
            </Card>

            <Card className="bg-surface border-border p-8">
              <h2 className="text-2xl font-semibold text-card-foreground mb-6">Contact Us</h2>
              <div className="text-muted-foreground">
                <p className="mb-4">
                  If you have any questions about this Privacy Policy, please contact us:
                </p>
                <div className="space-y-2">
                  <p>Email: <a href="mailto:privacy@robotpdf.com" className="text-blue-400 hover:text-blue-300">privacy@robotpdf.com</a></p>
                  <p>Support: <a href="mailto:support@robotpdf.com" className="text-blue-400 hover:text-blue-300">support@robotpdf.com</a></p>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}

export default PrivacyPolicy