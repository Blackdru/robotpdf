import { RefreshCw, CreditCard, Calendar, AlertCircle, CheckCircle, XCircle } from 'lucide-react'
import { Card } from '../components/ui/card'
import { Badge } from '../components/ui/badge'

const CancellationRefunds = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-emerald-50 to-green-50 py-12 relative overflow-hidden">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-emerald-100/40 to-green-100/40 rounded-full blur-3xl animate-pulse-slow"></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-gradient-to-tr from-blue-100/40 to-teal-100/40 rounded-full blur-3xl animate-pulse-slow" style={{ animationDelay: '1s' }}></div>
      </div>
      <div className="layout-dark-container relative z-10">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12 animate-fade-in">
            <div className="w-16 h-16 bg-gradient-to-br from-emerald-600 to-green-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg">
              <RefreshCw className="h-8 w-8 text-white" />
            </div>
            <h1 className="text-3xl font-extrabold text-slate-900 mb-4">Cancellation & Refunds</h1>
            <p className="text-slate-600 text-lg leading-relaxed">
              Understand our cancellation and refund policies for RobotPDF subscriptions.
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
                  <Calendar className="h-5 w-5 text-white" />
                </div>
                <h2 className="text-2xl font-bold text-slate-900">Subscription Cancellation</h2>
              </div>
              <div className="space-y-4 text-muted-foreground">
                <p>
                  You can cancel your RobotPDF subscription at any time through your account settings or by contacting our support team.
                </p>
                <div className="grid md:grid-cols-2 gap-6 mt-6">
                  <div className="bg-elevated p-6 rounded-lg">
                    <div className="flex items-center mb-4">
                      <CheckCircle className="h-5 w-5 text-green-400 mr-2" />
                      <h3 className="font-semibold text-card-foreground">What Happens When You Cancel</h3>
                    </div>
                    <ul className="space-y-2 text-sm">
                      <li>• Your subscription remains active until the end of the current billing period</li>
                      <li>• You retain access to all premium features until expiration</li>
                      <li>• No further charges will be made to your payment method</li>
                      <li>• Your account automatically downgrades to the free plan</li>
                      <li>• All your data and files remain accessible</li>
                    </ul>
                  </div>
                  <div className="bg-elevated p-6 rounded-lg">
                    <div className="flex items-center mb-4">
                      <AlertCircle className="h-5 w-5 text-yellow-400 mr-2" />
                      <h3 className="font-semibold text-card-foreground">Important Notes</h3>
                    </div>
                    <ul className="space-y-2 text-sm">
                      <li>• Cancellation takes effect at the end of your billing cycle</li>
                      <li>• You can reactivate your subscription at any time</li>
                      <li>• Free plan limitations will apply after cancellation</li>
                      <li>• Premium features become unavailable after expiration</li>
                      <li>• No partial refunds for unused time</li>
                    </ul>
                  </div>
                </div>
              </div>
            </Card>

            <Card className="bg-surface border-border p-8">
              <div className="flex items-center mb-6">
                <CreditCard className="h-6 w-6 text-green-400 mr-3" />
                <h2 className="text-2xl font-semibold text-card-foreground">Refund Policy</h2>
              </div>
              <div className="space-y-6 text-muted-foreground">
                <div className="bg-red-950 border border-red-800 p-6 rounded-lg">
                  <div className="flex items-center mb-4">
                    <AlertCircle className="h-6 w-6 text-red-400 mr-3" />
                    <h3 className="text-xl font-semibold text-red-200">No Refund Policy</h3>
                  </div>
                  <p className="text-red-100 mb-4">
                    All subscription payments are final and non-refundable once successfully processed. You can cancel your subscription at any time, but no refunds will be issued for the current billing period.
                  </p>
                  <ul className="space-y-2 text-red-100">
                    <li>• No refunds after successful subscription payment</li>
                    <li>• You can cancel anytime, but no refund for unused time</li>
                    <li>• Access continues until the end of current billing period</li>
                    <li>• No partial refunds for early cancellation</li>
                  </ul>
                </div>
                
                <div className="bg-green-950 border border-green-800 p-6 rounded-lg">
                  <div className="flex items-center mb-4">
                    <CheckCircle className="h-6 w-6 text-green-400 mr-3" />
                    <h3 className="text-xl font-semibold text-green-200">Exceptions - Payment Issues Only</h3>
                  </div>
                  <ul className="space-y-3 text-green-100">
                    <li className="flex items-start">
                      <Badge variant="outline" className="border-green-600 text-green-400 mr-3 mt-0.5">Always</Badge>
                      <div>
                        <strong>Billing Errors:</strong> Immediate refund for incorrect charges or duplicate payments.
                      </div>
                    </li>
                    <li className="flex items-start">
                      <Badge variant="outline" className="border-green-600 text-green-400 mr-3 mt-0.5">Always</Badge>
                      <div>
                        <strong>Payment Issues:</strong> Refund if payment was processed but subscription was not activated due to technical errors.
                      </div>
                    </li>
                  </ul>
                </div>
              </div>
            </Card>

            <Card className="bg-surface border-border p-8">
              <div className="flex items-center mb-6">
                <RefreshCw className="h-6 w-6 text-purple-400 mr-3" />
                <h2 className="text-2xl font-semibold text-card-foreground">How to Report Payment Issues</h2>
              </div>
              <div className="space-y-4 text-muted-foreground">
                <p>
                  If you experienced a payment issue (duplicate charge, billing error, or payment processed without subscription activation), please contact us:
                </p>
                <div className="bg-elevated p-6 rounded-lg">
                  <ol className="space-y-4">
                    <li className="flex items-start">
                      <span className="bg-blue-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-semibold mr-4 mt-0.5">1</span>
                      <div>
                        <strong className="text-card-foreground">Contact Support:</strong> Email us at{' '}
                        <a href="mailto:support@robotpdf.com" className="text-blue-400 hover:text-blue-300">
                          support@robotpdf.com
                        </a>{' '}
                        with details of the payment issue.
                      </div>
                    </li>
                    <li className="flex items-start">
                      <span className="bg-blue-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-semibold mr-4 mt-0.5">2</span>
                      <div>
                        <strong className="text-card-foreground">Provide Information:</strong> Include your account email, transaction ID, and description of the issue.
                      </div>
                    </li>
                    <li className="flex items-start">
                      <span className="bg-blue-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-semibold mr-4 mt-0.5">3</span>
                      <div>
                        <strong className="text-card-foreground">Review Process:</strong> We'll investigate within 2-3 business days and resolve the issue.
                      </div>
                    </li>
                    <li className="flex items-start">
                      <span className="bg-blue-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-semibold mr-4 mt-0.5">4</span>
                      <div>
                        <strong className="text-card-foreground">Resolution:</strong> Valid payment issues are resolved within 5-7 business days.
                      </div>
                    </li>
                  </ol>
                </div>
              </div>
            </Card>



            <Card className="bg-surface border-border p-8">
              <h2 className="text-2xl font-semibold text-card-foreground mb-6">Contact Us</h2>
              <div className="text-muted-foreground">
                <p className="mb-4">
                  Have questions about cancellations or refunds? We're here to help:
                </p>
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="font-semibold text-card-foreground mb-2">Payment Issues</h3>
                    <p>Email: <a href="mailto:support@robotpdf.com" className="text-blue-400 hover:text-blue-300">support@robotpdf.com</a></p>
                    <p className="text-sm text-secondary mt-1">Response time: 2-3 business days</p>
                  </div>
                  <div>
                    <h3 className="font-semibold text-card-foreground mb-2">General Support</h3>
                    <p>Email: <a href="mailto:support@robotpdf.com" className="text-blue-400 hover:text-blue-300">support@robotpdf.com</a></p>
                    <p className="text-sm text-secondary mt-1">Response time: 24 hours</p>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}

export default CancellationRefunds