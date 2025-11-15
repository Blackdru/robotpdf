import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card'
import { Button } from '../components/ui/button'
import { Badge } from '../components/ui/badge'
import { useAuth } from '../contexts/AuthContext'
import { 
  Check, 
  X, 
  Star, 
  Zap, 
  Crown,
  Sparkles,
  ArrowRight,
  Shield,
  Infinity,
  Users,
  Rocket
} from 'lucide-react'

const Pricing = () => {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [billingPeriod, setBillingPeriod] = useState('monthly')

  const handleSelectPlan = (planId) => {
    if (!user) {
      navigate('/register')
      return
    }
    navigate('/upgrade')
  }

  // Static plan data - All prices in INR
  const plans = [
    {
      id: 'free',
      name: 'Free',
      price: 0,
      currency: 'INR',
      description: 'Perfect for getting started',
      icon: Zap,
      gradient: 'from-gray-400 to-gray-500',
      features: [
        { text: 'Unlimited use of free tools', included: true },
        { text: '10 MB max file size', included: true },
        { text: 'Supported by ads', included: true },
        { text: 'No storage', included: false },
        { text: 'No AI features', included: false },
        { text: 'No advanced tools access', included: false }
      ]
    },
    {
      id: 'basic',
      name: 'Basic',
      price: 99,
      currency: 'INR',
      description: 'Great for regular users',
      popular: true,
      icon: Star,
      gradient: 'from-blue-500 to-cyan-500',
      features: [
        { text: '✨ Ad-Free Experience', included: true, highlight: true },
        { text: '50 files per month', included: true },
        { text: '50 MB max file size', included: true },
        { text: '500 MB storage', included: true },
        { text: '25 Advanced OCR pages', included: true },
        { text: '25 AI chat messages', included: true },
        { text: '25 AI summaries', included: true },
        { text: 'Access to all advanced tools', included: true }
      ]
    },
    {
      id: 'pro',
      name: 'Pro',
      price: 499,
      currency: 'INR',
      description: 'For power users and teams',
      bestValue: true,
      icon: Crown,
      gradient: 'from-purple-500 to-indigo-500',
      features: [
        { text: '✨ Ad-Free Experience', included: true, highlight: true },
        { text: 'Unlimited files per month', included: true, highlight: true },
        { text: '200 MB max file size', included: true },
        { text: 'Unlimited storage', included: true, highlight: true },
        { text: 'Unlimited OCR pages', included: true },
        { text: 'Unlimited AI chat', included: true },
        { text: 'Unlimited AI summaries', included: true },
        { text: 'All advanced tools & settings', included: true },
        { text: 'Priority support', included: true, highlight: true }
      ]
    }
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-indigo-50">
      {/* Background decoration */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-[600px] h-[600px] bg-gradient-to-br from-indigo-100/40 to-purple-100/40 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-40 -left-40 w-[600px] h-[600px] bg-gradient-to-br from-blue-100/40 to-cyan-100/40 rounded-full blur-3xl"></div>
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <Badge className="mb-4 px-4 py-1.5 bg-gradient-to-r from-indigo-500 to-purple-500 text-white text-sm font-semibold">
            <Sparkles className="h-4 w-4 mr-2" />
            PRICING PLANS
          </Badge>
          <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-slate-900 via-indigo-900 to-slate-900 bg-clip-text text-transparent mb-4">
            Choose Your Perfect Plan
          </h1>
          <p className="text-lg text-slate-600 max-w-2xl mx-auto">
            Start free and upgrade as you grow. All plans include core features with flexible limits.
          </p>
        </div>

        {/* Plan Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
          {plans.map((plan) => (
            <div
              key={plan.id}
              className={`relative bg-white rounded-2xl shadow-lg border-2 transition-all duration-300 hover:shadow-2xl hover:scale-[1.02] ${
                plan.popular ? 'border-blue-200' : plan.bestValue ? 'border-purple-200' : 'border-gray-200'
              }`}
            >
              {/* Popular/Best Value Badge */}
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                  <Badge className="px-4 py-1 bg-gradient-to-r from-blue-500 to-cyan-500 text-white text-xs font-semibold">
                    MOST POPULAR
                  </Badge>
                </div>
              )}
              {plan.bestValue && (
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                  <Badge className="px-4 py-1 bg-gradient-to-r from-purple-500 to-indigo-500 text-white text-xs font-semibold">
                    BEST VALUE
                  </Badge>
                </div>
              )}

              <CardHeader className="text-center pb-8 pt-8">
                <div className={`w-16 h-16 mx-auto mb-4 rounded-xl bg-gradient-to-br ${plan.gradient} flex items-center justify-center`}>
                  <plan.icon className="h-8 w-8 text-white" />
                </div>
                <CardTitle className="text-2xl font-bold text-slate-900">
                  {plan.name}
                </CardTitle>
                <CardDescription className="text-slate-600 mt-2">
                  {plan.description}
                </CardDescription>
                <div className="mt-6">
                  <span className="text-5xl font-bold text-slate-900">
                    {plan.price === 0 ? 'Free' : `₹${plan.price}`}
                  </span>
                  {plan.price !== 0 && (
                    <span className="text-slate-500 ml-2">/month</span>
                  )}
                </div>
              </CardHeader>

              <CardContent>
                {/* Features */}
                <div className="space-y-3 mb-8">
                  {plan.features.map((feature, index) => (
                    <div key={index} className="flex items-start">
                      {feature.included ? (
                        <div className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 mr-3 mt-0.5 ${
                          feature.highlight ? 'bg-green-500' : 'bg-green-100'
                        }`}>
                          <Check className={`h-3 w-3 ${feature.highlight ? 'text-white' : 'text-green-600'}`} />
                        </div>
                      ) : (
                        <div className="w-5 h-5 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0 mr-3 mt-0.5">
                          <X className="h-3 w-3 text-gray-400" />
                        </div>
                      )}
                      <span className={`text-sm ${
                        feature.included 
                          ? feature.highlight ? 'text-slate-900 font-semibold' : 'text-slate-700' 
                          : 'text-gray-400 line-through'
                      }`}>
                        {feature.text}
                      </span>
                    </div>
                  ))}
                </div>

                {/* CTA Button */}
                <Button
                  onClick={() => handleSelectPlan(plan.id)}
                  className={`w-full rounded-xl py-3 font-semibold transition-all ${
                    plan.id === 'free' 
                      ? 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      : plan.popular
                      ? 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white hover:shadow-lg'
                      : plan.bestValue
                      ? 'bg-gradient-to-r from-purple-500 to-indigo-500 text-white hover:shadow-lg'
                      : ''
                  }`}
                >
                  {plan.id === 'free' ? 'Current Plan' : 'Get Started'}
                  {plan.id !== 'free' && <ArrowRight className="ml-2 h-4 w-4" />}
                </Button>
              </CardContent>
            </div>
          ))}
        </div>

        {/* Comparison Table */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
          <div className="p-8 bg-gradient-to-r from-indigo-50 to-purple-50">
            <h2 className="text-2xl font-bold text-slate-900 mb-2">
              Detailed Feature Comparison
            </h2>
            <p className="text-slate-600">
              Compare all features across our plans
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left px-6 py-4 text-sm font-semibold text-slate-900">
                    Feature
                  </th>
                  <th className="text-center px-6 py-4 text-sm font-semibold text-slate-900">
                    Free
                  </th>
                  <th className="text-center px-6 py-4 text-sm font-semibold text-slate-900">
                    <div className="flex items-center justify-center gap-2">
                      Basic
                      <Badge className="bg-blue-100 text-blue-700 text-xs">Popular</Badge>
                    </div>
                  </th>
                  <th className="text-center px-6 py-4 text-sm font-semibold text-slate-900">
                    <div className="flex items-center justify-center gap-2">
                      Pro
                      <Badge className="bg-purple-100 text-purple-700 text-xs">Best</Badge>
                    </div>
                  </th>
                </tr>
              </thead>
              <tbody>
                {[
                  { feature: 'Monthly Price', free: 'Free', basic: '₹99', pro: '₹499' },
                  { feature: 'Advertisements', free: '✓ Ads shown', basic: '✨ Ad-Free', pro: '✨ Ad-Free', highlight: true },
                  { feature: 'Files per month', free: 'Unlimited', basic: '50', pro: 'Unlimited' },
                  { feature: 'Max file size', free: '10 MB', basic: '50 MB', pro: '200 MB' },
                  { feature: 'Cloud storage', free: '-', basic: '500 MB', pro: 'Unlimited' },
                  { feature: 'OCR pages', free: '-', basic: '25/month', pro: 'Unlimited' },
                  { feature: 'AI Chat', free: '-', basic: '25 messages', pro: 'Unlimited' },
                  { feature: 'AI Summaries', free: '-', basic: '25/month', pro: 'Unlimited' },
                  { feature: 'Advanced tools', free: '-', basic: '✓', pro: '✓' },
                  { feature: 'Priority support', free: '-', basic: '-', pro: '✓' },
                  { feature: 'API Access', free: '-', basic: 'Limited', pro: 'Full access' },
                ].map((row, index) => (
                  <tr key={index} className={`border-b border-gray-100 ${index % 2 === 0 ? 'bg-gray-50/50' : ''}`}>
                    <td className="px-6 py-4 text-sm font-medium text-slate-700">
                      {row.feature}
                    </td>
                    <td className="text-center px-6 py-4 text-sm text-slate-600">
                      {row.free === '✓' ? (
                        <Check className="h-5 w-5 text-green-500 mx-auto" />
                      ) : row.free === '-' ? (
                        <X className="h-5 w-5 text-gray-300 mx-auto" />
                      ) : (
                        row.free
                      )}
                    </td>
                    <td className={`text-center px-6 py-4 text-sm ${row.highlight ? 'font-semibold text-blue-600' : 'text-slate-600'}`}>
                      {row.basic === '✓' ? (
                        <Check className="h-5 w-5 text-green-500 mx-auto" />
                      ) : row.basic === '-' ? (
                        <X className="h-5 w-5 text-gray-300 mx-auto" />
                      ) : (
                        row.basic
                      )}
                    </td>
                    <td className={`text-center px-6 py-4 text-sm ${row.highlight ? 'font-semibold text-purple-600' : 'text-slate-600'}`}>
                      {row.pro === '✓' ? (
                        <Check className="h-5 w-5 text-green-500 mx-auto" />
                      ) : row.pro === '-' ? (
                        <X className="h-5 w-5 text-gray-300 mx-auto" />
                      ) : (
                        row.pro
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Trust Badges */}
        <div className="mt-12 text-center">
          <div className="flex flex-wrap justify-center gap-8">
            <div className="flex items-center gap-2 text-slate-600">
              <Shield className="h-5 w-5 text-green-500" />
              <span className="font-medium">Secure Payments</span>
            </div>
            <div className="flex items-center gap-2 text-slate-600">
              <Users className="h-5 w-5 text-blue-500" />
              <span className="font-medium">50K+ Happy Users</span>
            </div>
            <div className="flex items-center gap-2 text-slate-600">
              <Rocket className="h-5 w-5 text-purple-500" />
              <span className="font-medium">Cancel Anytime</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Pricing
