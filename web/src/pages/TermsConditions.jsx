import { FileText, Users, AlertTriangle, Scale, CreditCard, Shield } from 'lucide-react'
import { Card } from '../components/ui/card'

const TermsConditions = () => {
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
              <FileText className="h-8 w-8 text-white" />
            </div>
            <h1 className="text-3xl font-extrabold text-slate-900 mb-4">Terms & Conditions</h1>
            <p className="text-slate-600 text-lg leading-relaxed">
              Please read these terms carefully before using our services.
            </p>
            <p className="text-slate-500 text-sm mt-2 font-medium">
              Last updated: {new Date().toLocaleDateString()}
            </p>
          </div>

          {/* Content */}
          <div className="space-y-8">
            <Card className="bg-surface border-border p-8">
              <div className="flex items-center mb-6">
                <Users className="h-6 w-6 text-blue-400 mr-3" />
                <h2 className="text-2xl font-semibold text-card-foreground">Acceptance of Terms</h2>
              </div>
              <div className="space-y-4 text-muted-foreground">
                <p>
                  By accessing and using RobotPDF ("the Service"), you accept and agree to be bound by the terms 
                  and provision of this agreement. If you do not agree to abide by the above, please do not use this service.
                </p>
                <p>
                  These terms apply to all visitors, users, and others who access or use the service.
                </p>
              </div>
            </Card>

            <Card className="bg-surface border-border p-8">
              <div className="flex items-center mb-6">
                <Shield className="h-6 w-6 text-green-400 mr-3" />
                <h2 className="text-2xl font-semibold text-card-foreground">Use License</h2>
              </div>
              <div className="space-y-4 text-muted-foreground">
                <p>
                  Permission is granted to temporarily use RobotPDF for personal and commercial document processing. 
                  This is the grant of a license, not a transfer of title, and under this license you may not:
                </p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>Modify or copy the materials</li>
                  <li>Use the materials for any commercial purpose or for any public display</li>
                  <li>Attempt to reverse engineer any software contained on the website</li>
                  <li>Remove any copyright or other proprietary notations from the materials</li>
                  <li>Share your account credentials with others</li>
                  <li>Use the service to process illegal or harmful content</li>
                </ul>
              </div>
            </Card>

            <Card className="bg-surface border-border p-8">
              <div className="flex items-center mb-6">
                <CreditCard className="h-6 w-6 text-purple-400 mr-3" />
                <h2 className="text-2xl font-semibold text-card-foreground">Subscription and Billing</h2>
              </div>
              <div className="space-y-4 text-muted-foreground">
                <p>
                  RobotPDF offers both free and paid subscription plans:
                </p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>Free accounts have limited features and usage quotas</li>
                  <li>Paid subscriptions are billed monthly or annually</li>
                  <li>All fees are non-refundable except as required by law</li>
                  <li>You may cancel your subscription at any time</li>
                  <li>Price changes will be communicated 30 days in advance</li>
                  <li>Failed payments may result in service suspension</li>
                </ul>
                <p>
                  By subscribing to a paid plan, you authorize us to charge your payment method for the applicable fees.
                </p>
              </div>
            </Card>

            <Card className="bg-surface border-border p-8">
              <div className="flex items-center mb-6">
                <AlertTriangle className="h-6 w-6 text-orange-400 mr-3" />
                <h2 className="text-2xl font-semibold text-card-foreground">Prohibited Uses</h2>
              </div>
              <div className="space-y-4 text-muted-foreground">
                <p>
                  You may not use our service:
                </p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>For any unlawful purpose or to solicit others to perform unlawful acts</li>
                  <li>To violate any international, federal, provincial, or state regulations, rules, laws, or local ordinances</li>
                  <li>To infringe upon or violate our intellectual property rights or the intellectual property rights of others</li>
                  <li>To harass, abuse, insult, harm, defame, slander, disparage, intimidate, or discriminate</li>
                  <li>To submit false or misleading information</li>
                  <li>To upload or transmit viruses or any other type of malicious code</li>
                  <li>To spam, phish, pharm, pretext, spider, crawl, or scrape</li>
                  <li>For any obscene or immoral purpose</li>
                  <li>To interfere with or circumvent the security features of the service</li>
                </ul>
              </div>
            </Card>

            <Card className="bg-surface border-border p-8">
              <div className="flex items-center mb-6">
                <Scale className="h-6 w-6 text-yellow-400 mr-3" />
                <h2 className="text-2xl font-semibold text-card-foreground">Disclaimer</h2>
              </div>
              <div className="space-y-4 text-muted-foreground">
                <p>
                  The information on this website is provided on an "as is" basis. To the fullest extent permitted by law, 
                  this Company:
                </p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>Excludes all representations and warranties relating to this website and its contents</li>
                  <li>Does not guarantee the accuracy of OCR or AI-generated content</li>
                  <li>Excludes all liability for damages arising out of or in connection with your use of this website</li>
                  <li>Makes no warranties about the availability or functionality of the service</li>
                </ul>
                <p className="mt-4 font-semibold text-card-foreground">
                  You use this service at your own risk. Always verify important information from AI-generated summaries.
                </p>
              </div>
            </Card>

            <Card className="bg-surface border-border p-8">
              <div className="flex items-center mb-6">
                <FileText className="h-6 w-6 text-red-400 mr-3" />
                <h2 className="text-2xl font-semibold text-card-foreground">Termination</h2>
              </div>
              <div className="space-y-4 text-muted-foreground">
                <p>
                  We may terminate or suspend your account and bar access to the service immediately, without prior notice 
                  or liability, under our sole discretion, for any reason whatsoever and without limitation, including but 
                  not limited to a breach of the Terms.
                </p>
                <p>
                  If you wish to terminate your account, you may simply discontinue using the service or contact our support team.
                </p>
                <p>
                  Upon termination, your right to use the service will cease immediately. All provisions of the Terms which 
                  by their nature should survive termination shall survive termination.
                </p>
              </div>
            </Card>

            <Card className="bg-surface border-border p-8">
              <h2 className="text-2xl font-semibold text-card-foreground mb-6">Changes to Terms</h2>
              <div className="text-muted-foreground space-y-4">
                <p>
                  We reserve the right, at our sole discretion, to modify or replace these Terms at any time. 
                  If a revision is material, we will provide at least 30 days notice prior to any new terms taking effect.
                </p>
                <p>
                  What constitutes a material change will be determined at our sole discretion. By continuing to access 
                  or use our service after any revisions become effective, you agree to be bound by the revised terms.
                </p>
              </div>
            </Card>

            <Card className="bg-surface border-border p-8">
              <h2 className="text-2xl font-semibold text-card-foreground mb-6">Contact Information</h2>
              <div className="text-muted-foreground">
                <p className="mb-4">
                  If you have any questions about these Terms & Conditions, please contact us:
                </p>
                <div className="space-y-2">
                  <p>Email: <a href="mailto:legal@robotpdf.com" className="text-blue-400 hover:text-blue-300">legal@robotpdf.com</a></p>
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

export default TermsConditions