import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { BarChart3, Activity, TrendingUp, Clock, Download, Loader2, ArrowLeft, Key, Book, Code, Home } from 'lucide-react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { developerApi } from '../services/developerApi';

const DeveloperUsage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [usageData, setUsageData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('30d');

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    fetchUsageData();
  }, [user, timeRange, navigate]);

  const fetchUsageData = async () => {
    try {
      setLoading(true);
      const response = await developerApi.getUsage(timeRange);
      setUsageData(response.data || {
        monthly_limit: 0,
        current_month_used: 0,
        remaining: 0,
        rate_limit_per_minute: 0,
        tools: []
      });
    } catch (error) {
      console.error('Failed to fetch usage:', error);
      if (error.message?.includes('log in')) {
        toast.error('Please log in to access usage data');
        navigate('/login');
        return;
      }
      toast.error(error.message || 'Failed to load usage data');
      setUsageData({
        monthly_limit: 0,
        current_month_used: 0,
        remaining: 0,
        rate_limit_per_minute: 0,
        tools: []
      });
    } finally {
      setLoading(false);
    }
  };

  const stats = [
    {
      label: 'Total Requests',
      value: usageData?.current_month_used || 0,
      icon: Activity,
      color: 'blue'
    },
    {
      label: 'Remaining',
      value: usageData?.remaining || 0,
      icon: TrendingUp,
      color: 'green'
    },
    {
      label: 'Rate Limit',
      value: `${usageData?.rate_limit_per_minute || 0}/min`,
      icon: Clock,
      color: 'purple'
    }
  ];

  const usagePercentage = usageData && usageData.monthly_limit > 0
    ? ((usageData.current_month_used / usageData.monthly_limit) * 100).toFixed(1)
    : 0;

  const chartData = usageData?.tools.map(tool => ({
    name: tool.tool_name.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
    value: tool.usage_count
  })) || [];

  const COLORS = ['#3b82f6', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444', '#ec4899'];

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-white via-slate-50 to-white flex items-center justify-center">
        <Loader2 className="w-12 h-12 text-indigo-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-white via-slate-50 to-white">
      {/* Subtle Background Effects */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -left-40 w-[600px] h-[600px] bg-gradient-to-br from-indigo-100/30 to-purple-100/30 rounded-full blur-3xl"></div>
        <div className="absolute top-40 -right-40 w-[500px] h-[500px] bg-gradient-to-br from-blue-100/30 to-cyan-100/30 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-40 left-1/4 w-[700px] h-[700px] bg-gradient-to-br from-purple-100/20 to-pink-100/20 rounded-full blur-3xl"></div>
      </div>
      
      <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Navigation */}
        <div className="flex items-center gap-4 mb-6 flex-wrap">
          <Link
            to="/developers"
            className="flex items-center gap-2 px-4 py-2 bg-white border-2 border-gray-200 rounded-xl text-slate-700 hover:text-indigo-600 hover:border-indigo-300 hover:shadow-md transition-all"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Portal
          </Link>
          <Link to="/developers/keys" className="flex items-center gap-2 px-4 py-2 bg-white border-2 border-gray-200 rounded-xl text-slate-700 hover:text-indigo-600 hover:border-indigo-300 hover:shadow-md transition-all">
            <Key className="w-4 h-4" />
            API Keys
          </Link>
          <Link to="/developers/docs" className="flex items-center gap-2 px-4 py-2 bg-white border-2 border-gray-200 rounded-xl text-slate-700 hover:text-indigo-600 hover:border-indigo-300 hover:shadow-md transition-all">
            <Book className="w-4 h-4" />
            Docs
          </Link>
          <Link to="/developers/playground" className="flex items-center gap-2 px-4 py-2 bg-white border-2 border-gray-200 rounded-xl text-slate-700 hover:text-indigo-600 hover:border-indigo-300 hover:shadow-md transition-all">
            <Code className="w-4 h-4" />
            Playground
          </Link>
        </div>
        
        <div className="flex items-center justify-between mb-8 flex-wrap gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 mb-2">
              Usage & Analytics
            </h1>
            <p className="text-slate-600">
              Track your API usage and performance
            </p>
          </div>
          <div className="flex gap-2">
            <select
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value)}
              className="px-4 py-2 bg-white border-2 border-gray-200 rounded-xl text-slate-900 focus:border-indigo-300 focus:ring-2 focus:ring-indigo-200 transition-colors"
            >
              <option value="24h">Last 24 Hours</option>
              <option value="7d">Last 7 Days</option>
              <option value="30d">Last 30 Days</option>
              <option value="90d">Last 90 Days</option>
            </select>
            <button className="p-2 bg-white border-2 border-gray-200 hover:bg-indigo-50 hover:border-indigo-300 text-slate-700 rounded-xl transition-colors">
              <Download className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {stats.map((stat, index) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="bg-white border-2 border-gray-200 rounded-2xl p-6 shadow-md hover:shadow-xl hover:border-indigo-200 transition-all"
            >
              <div className="flex items-center justify-between mb-4">
                <div className={`p-3 bg-${stat.color}-100 rounded-xl border-2 border-${stat.color}-200`}>
                  <stat.icon className={`w-6 h-6 text-${stat.color}-600`} />
                </div>
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

        {/* Usage Progress */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white rounded-2xl border-2 border-gray-200 shadow-md hover:shadow-xl transition-all p-6 mb-8"
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-slate-900">
              Monthly Usage
            </h2>
            <span className="text-sm text-slate-600">
              {usageData?.current_month_used?.toLocaleString()} / {usageData?.monthly_limit?.toLocaleString()} requests
            </span>
          </div>
          <div className="relative h-4 bg-slate-200 rounded-full overflow-hidden">
            <div
              className={`h-full transition-all duration-500 ${
                usagePercentage > 90 ? 'bg-red-500' : usagePercentage > 70 ? 'bg-yellow-500' : 'bg-gradient-to-r from-indigo-600 to-purple-600'
              }`}
              style={{ width: `${Math.min(usagePercentage, 100)}%` }}
            />
          </div>
          <div className="mt-2 text-sm text-slate-600">
            {usagePercentage}% used
          </div>
        </motion.div>

        {/* Per-Tool Usage */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-white rounded-2xl border-2 border-gray-200 shadow-md hover:shadow-xl transition-all p-6"
        >
          <h2 className="text-xl font-semibold text-slate-900 mb-6">
            Usage by Tool
          </h2>

          {/* Chart */}
          {chartData.length > 0 && (
            <div className="mb-8">
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.1} />
                  <XAxis 
                    dataKey="name" 
                    angle={-45}
                    textAnchor="end"
                    height={100}
                    tick={{ fill: '#6b7280', fontSize: 12 }}
                  />
                  <YAxis tick={{ fill: '#6b7280' }} />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#1f2937', 
                      border: '1px solid #374151',
                      borderRadius: '0.5rem',
                      color: '#fff'
                    }}
                  />
                  <Bar dataKey="value" radius={[8, 8, 0, 0]}>
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Tool List */}
          <div className="space-y-4">
            {usageData?.tools.length === 0 && (
              <div className="text-center py-8 text-slate-600">
                No API usage yet. Start making requests to see statistics here.
              </div>
            )}
            {usageData?.tools.map((tool, index) => (
              <div key={tool.tool_name} className="flex items-center gap-4">
                <div 
                  className="w-3 h-3 rounded-full flex-shrink-0" 
                  style={{ backgroundColor: COLORS[index % COLORS.length] }}
                />
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium text-slate-900 capitalize">
                      {tool.tool_name.replace(/_/g, ' ')}
                    </span>
                    <span className="text-sm text-slate-600">
                      {tool.usage_count.toLocaleString()} requests
                    </span>
                  </div>
                  <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
                    <div
                      className="h-full transition-all duration-500"
                      style={{ 
                        width: `${usageData.current_month_used > 0 ? (tool.usage_count / usageData.current_month_used) * 100 : 0}%`,
                        backgroundColor: COLORS[index % COLORS.length]
                      }}
                    />
                  </div>
                  <div className="mt-1 text-xs text-slate-500">
                    Last used: {new Date(tool.last_used_at).toLocaleString()}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default DeveloperUsage;
