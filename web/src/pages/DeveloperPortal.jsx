import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { 
  Key, 
  BarChart3, 
  Book, 
  Settings, 
  Code, 
  Zap,
  Activity,
  DollarSign,
  ArrowRight,
  Shield,
  Clock,
  CheckCircle,
  Loader2
} from 'lucide-react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { developerApi } from '../services/developerApi';

const DeveloperPortal = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    fetchDeveloperStats();
  }, [user, navigate]);

  const fetchDeveloperStats = async () => {
    try {
      setLoading(true);
      const response = await developerApi.getPortalStats();
      setStats(response.data || {
        totalRequests: 0,
        monthlyLimit: 0,
        activeKeys: 0,
        uptime: '99.9%',
        hasDeveloperAccount: false
      });
    } catch (error) {
      console.error('Failed to fetch stats:', error);
      if (error.message?.includes('log in') || error.message?.includes('portal')) {
        toast.error(error.message);
        setTimeout(() => navigate('/login'), 1500);
        return;
      }
      toast.error(error.message || 'Failed to load developer stats');
      setStats({
        totalRequests: 0,
        monthlyLimit: 0,
        activeKeys: 0,
        uptime: '99.9%',
        hasDeveloperAccount: false
      });
    } finally {
      setLoading(false);
    }
  };

  const features = [
    {
      icon: Key,
      title: 'API Keys',
      description: 'Manage your API keys and secrets',
      link: '/developers/keys',
      color: 'blue'
    },
    {
      icon: BarChart3,
      title: 'Usage & Analytics',
      description: 'Track your API usage and performance',
      link: '/developers/usage',
      color: 'green'
    },
    {
      icon: Book,
      title: 'Documentation',
      description: 'Complete API reference and guides',
      link: '/developers/docs',
      color: 'purple'
    }
  ];

  const quickStats = [
    {
      label: 'API Requests',
      value: stats?.totalRequests || 0,
      icon: Activity,
      change: '+12%',
      positive: true
    },
    {
      label: 'Monthly Limit',
      value: stats?.monthlyLimit || 0,
      icon: DollarSign,
      change: 'Pro Plan',
      positive: true
    },
    {
      label: 'Active Keys',
      value: stats?.activeKeys || 0,
      icon: Key,
      change: 'Manage',
      positive: true
    },
    {
      label: 'Uptime',
      value: stats?.uptime || '0%',
      icon: CheckCircle,
      change: 'Last 30 days',
      positive: true
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-white via-slate-50 to-white relative overflow-hidden">
      {/* Subtle Background Effects */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -left-40 w-[600px] h-[600px] bg-gradient-to-br from-indigo-100/30 to-purple-100/30 rounded-full blur-3xl"></div>
        <div className="absolute top-40 -right-40 w-[500px] h-[500px] bg-gradient-to-br from-blue-100/30 to-cyan-100/30 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-40 left-1/4 w-[700px] h-[700px] bg-gradient-to-br from-purple-100/20 to-pink-100/20 rounded-full blur-3xl"></div>
      </div>
      
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-12"
        >
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-4xl md:text-5xl font-bold text-slate-900 mb-2">
                Developer Portal
              </h1>
              <p className="text-lg text-slate-600">
                Build powerful integrations with RobotPDF API
              </p>
            </div>
            <Link
              to="/developers/docs"
              className="hidden md:flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl hover:shadow-lg transition-all hover:scale-105"
            >
              <Book className="w-5 h-5" />
              View Docs
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {quickStats.map((stat, index) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="bg-white/90 backdrop-blur-xl border-2 border-gray-200 rounded-2xl p-6 shadow-lg hover:shadow-xl hover:border-indigo-200 transition-all"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-xl">
                    <stat.icon className="w-6 h-6 text-indigo-600" />
                  </div>
                  <span className={`text-sm font-medium ${stat.positive ? 'text-green-600' : 'text-red-600'}`}>
                    {stat.change}
                  </span>
                </div>
                <div className="text-2xl font-bold text-slate-900 mb-1">
                  {typeof stat.value === 'number' ? stat.value.toLocaleString() : stat.value}
                </div>
                <div className="text-sm text-slate-600">
                  {stat.label}
                </div>
              </motion.div>
            ))}
          </div>

          {/* Getting Started */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl p-8 text-white mb-8 shadow-lg"
          >
            <div className="flex items-start gap-6">
              <div className="p-4 bg-white/20 rounded-xl">
                <Zap className="w-8 h-8" />
              </div>
              <div className="flex-1">
                <h2 className="text-2xl font-bold mb-2">Get Started in Minutes</h2>
                <p className="text-indigo-100 mb-6">
                  Generate your API keys and start building powerful PDF integrations today
                </p>
                <div className="flex flex-wrap gap-4">
                  <Link
                    to="/developers/keys"
                    className="px-6 py-3 bg-white text-indigo-600 rounded-xl hover:bg-indigo-50 transition-all hover:scale-105 font-semibold shadow-md"
                  >
                    Generate API Keys
                  </Link>
                  <Link
                    to="/developers/docs"
                    className="px-6 py-3 bg-white/10 backdrop-blur-sm text-white rounded-xl hover:bg-white/20 transition-all font-semibold border border-white/20"
                  >
                    Read Documentation
                  </Link>
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          {features.map((feature, index) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 + index * 0.1 }}
            >
              <Link
                to={feature.link}
                className="block bg-white rounded-2xl p-6 shadow-md border-2 border-gray-200 hover:shadow-xl hover:border-indigo-200 hover:-translate-y-1 transition-all group"
              >
                <div className="inline-flex p-3 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-xl mb-4 group-hover:scale-110 transition-transform duration-300">
                  <feature.icon className="w-6 h-6 text-indigo-600" />
                </div>
                <h3 className="text-xl font-semibold text-slate-900 mb-2 group-hover:text-indigo-600 transition-colors">
                  {feature.title}
                </h3>
                <p className="text-slate-600 mb-4">
                  {feature.description}
                </p>
                <div className="flex items-center text-indigo-600 font-medium">
                  Explore
                  <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-2 transition-transform" />
                </div>
              </Link>
            </motion.div>
          ))}
        </div>

        {/* Why Choose Our API */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1 }}
          className="bg-white rounded-2xl p-8 shadow-md border-2 border-gray-200"
        >
          <h2 className="text-2xl font-bold text-slate-900 mb-6">
            Why Choose RobotPDF API?
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="flex gap-4">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-100 to-indigo-100 flex items-center justify-center">
                  <Shield className="w-6 h-6 text-indigo-600" />
                </div>
              </div>
              <div>
                <h3 className="font-semibold text-slate-900 mb-2">
                  Enterprise Security
                </h3>
                <p className="text-slate-600 text-sm">
                  API key + secret authentication with SHA-256 encryption and secure storage
                </p>
              </div>
            </div>
            <div className="flex gap-4">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-green-100 to-emerald-100 flex items-center justify-center">
                  <Activity className="w-6 h-6 text-green-600" />
                </div>
              </div>
              <div>
                <h3 className="font-semibold text-slate-900 mb-2">
                  99.9% Uptime
                </h3>
                <p className="text-slate-600 text-sm">
                  Reliable infrastructure with comprehensive monitoring and instant failover
                </p>
              </div>
            </div>
            <div className="flex gap-4">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-100 to-pink-100 flex items-center justify-center">
                  <Clock className="w-6 h-6 text-purple-600" />
                </div>
              </div>
              <div>
                <h3 className="font-semibold text-slate-900 mb-2">
                  Fast Processing
                </h3>
                <p className="text-slate-600 text-sm">
                  Optimized endpoints with response times under 2 seconds for most operations
                </p>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default DeveloperPortal;
