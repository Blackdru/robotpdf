import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { api } from '../lib/api';
import toast from 'react-hot-toast';
import {
  Users,
  Eye,
  TrendingUp,
  Monitor,
  Smartphone,
  Globe,
  ArrowLeft,
  Calendar,
  BarChart3,
  PieChart,
  Activity,
  RefreshCw
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const AdminAnalytics = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('30d');
  const [dashboardData, setDashboardData] = useState(null);
  const [visitors, setVisitors] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    // Check if user is admin
    if (user && user.role !== 'admin') {
      toast.error('Access denied. Admin only.');
      navigate('/');
      return;
    }

    // Load analytics data
    loadDashboardData();
    loadVisitors();
  }, [timeRange, currentPage]);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/analytics/dashboard?timeRange=${timeRange}`);
      setDashboardData(response);
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
      toast.error('Failed to load analytics data');
    } finally {
      setLoading(false);
    }
  };

  const loadVisitors = async () => {
    try {
      const response = await api.get(`/analytics/visitors?page=${currentPage}&limit=50`);
      setVisitors(response.visitors);
      setTotalPages(response.pagination.pages);
    } catch (error) {
      console.error('Failed to load visitors:', error);
      toast.error('Failed to load visitor data');
    }
  };

  const handleRefresh = () => {
    loadDashboardData();
    loadVisitors();
    toast.success('Data refreshed');
  };

  if (loading && !dashboardData) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center">
        <div className="text-white text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-500 border-t-transparent mx-auto mb-4"></div>
          <p className="text-lg">Loading analytics...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900 text-white">
      {/* Header */}
      <div className="bg-gray-800/50 backdrop-blur-sm border-b border-gray-700 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center space-x-3 sm:space-x-4">
              <button
                onClick={() => navigate('/')}
                className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
              >
                <ArrowLeft className="h-5 w-5 sm:h-6 sm:w-6" />
              </button>
              <div>
                <h1 className="text-xl sm:text-2xl font-bold">Visitor Analytics</h1>
                <p className="text-gray-400 text-xs sm:text-sm hidden sm:block">Track and analyze tools page visitors</p>
              </div>
            </div>
            <div className="flex items-center space-x-2 sm:space-x-3 w-full sm:w-auto">
              {/* Time Range Selector */}
              <select
                value={timeRange}
                onChange={(e) => setTimeRange(e.target.value)}
                className="bg-gray-700 border border-gray-600 rounded-lg px-3 sm:px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 flex-1 sm:flex-none"
              >
                <option value="24h">Last 24 Hours</option>
                <option value="7d">Last 7 Days</option>
                <option value="30d">Last 30 Days</option>
                <option value="90d">Last 90 Days</option>
                <option value="all">All Time</option>
              </select>
              <button
                onClick={handleRefresh}
                className="p-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
                title="Refresh data"
              >
                <RefreshCw className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Summary Cards */}
        {dashboardData && (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-6 sm:mb-8">
              {/* Total Visitors */}
              <div className="bg-gradient-to-br from-blue-600 to-blue-800 rounded-xl sm:rounded-2xl p-4 sm:p-6 shadow-xl">
                <div className="flex items-center justify-between mb-3 sm:mb-4">
                  <Users className="h-8 w-8 sm:h-10 sm:w-10 text-blue-100" />
                  <div className="bg-blue-500/30 rounded-full p-1.5 sm:p-2">
                    <TrendingUp className="h-4 w-4 sm:h-5 sm:w-5 text-blue-100" />
                  </div>
                </div>
                <h3 className="text-xs sm:text-sm font-medium text-blue-100 mb-1">Total Unique Visitors</h3>
                <p className="text-2xl sm:text-3xl font-bold">{dashboardData.summary.totalVisitors.toLocaleString()}</p>
              </div>

              {/* New Visitors */}
              <div className="bg-gradient-to-br from-green-600 to-green-800 rounded-xl sm:rounded-2xl p-4 sm:p-6 shadow-xl">
                <div className="flex items-center justify-between mb-3 sm:mb-4">
                  <Users className="h-8 w-8 sm:h-10 sm:w-10 text-green-100" />
                  <div className="bg-green-500/30 rounded-full p-1.5 sm:p-2">
                    <Activity className="h-4 w-4 sm:h-5 sm:w-5 text-green-100" />
                  </div>
                </div>
                <h3 className="text-xs sm:text-sm font-medium text-green-100 mb-1">New Visitors</h3>
                <p className="text-2xl sm:text-3xl font-bold">{dashboardData.summary.newVisitors.toLocaleString()}</p>
              </div>

              {/* Returning Visitors */}
              <div className="bg-gradient-to-br from-purple-600 to-purple-800 rounded-xl sm:rounded-2xl p-4 sm:p-6 shadow-xl">
                <div className="flex items-center justify-between mb-3 sm:mb-4">
                  <Users className="h-8 w-8 sm:h-10 sm:w-10 text-purple-100" />
                  <div className="bg-purple-500/30 rounded-full p-1.5 sm:p-2">
                    <RefreshCw className="h-4 w-4 sm:h-5 sm:w-5 text-purple-100" />
                  </div>
                </div>
                <h3 className="text-xs sm:text-sm font-medium text-purple-100 mb-1">Returning Visitors</h3>
                <p className="text-2xl sm:text-3xl font-bold">{dashboardData.summary.returningVisitors.toLocaleString()}</p>
              </div>

              {/* Total Page Views */}
              <div className="bg-gradient-to-br from-orange-600 to-orange-800 rounded-xl sm:rounded-2xl p-4 sm:p-6 shadow-xl">
                <div className="flex items-center justify-between mb-3 sm:mb-4">
                  <Eye className="h-8 w-8 sm:h-10 sm:w-10 text-orange-100" />
                  <div className="bg-orange-500/30 rounded-full p-1.5 sm:p-2">
                    <BarChart3 className="h-4 w-4 sm:h-5 sm:w-5 text-orange-100" />
                  </div>
                </div>
                <h3 className="text-xs sm:text-sm font-medium text-orange-100 mb-1">Total Page Views</h3>
                <p className="text-2xl sm:text-3xl font-bold">{dashboardData.summary.totalPageViews.toLocaleString()}</p>
                <p className="text-xs sm:text-sm text-orange-100 mt-1">
                  Avg: {dashboardData.summary.avgVisitsPerVisitor} per visitor
                </p>
              </div>
            </div>

            {/* Charts Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 mb-6 sm:mb-8">
              {/* Device Stats */}
              <div className="bg-gray-800 rounded-xl sm:rounded-2xl p-4 sm:p-6 shadow-xl">
                <h3 className="text-lg sm:text-xl font-bold mb-3 sm:mb-4 flex items-center">
                  <Monitor className="h-5 w-5 sm:h-6 sm:w-6 mr-2 text-blue-400" />
                  Device Types
                </h3>
                <div className="space-y-3">
                  {Object.entries(dashboardData.deviceStats).map(([device, count]) => {
                    const total = Object.values(dashboardData.deviceStats).reduce((a, b) => a + b, 0);
                    const percentage = ((count / total) * 100).toFixed(1);
                    return (
                      <div key={device} className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span className="capitalize flex items-center">
                            {device === 'mobile' && <Smartphone className="h-4 w-4 mr-2" />}
                            {device === 'desktop' && <Monitor className="h-4 w-4 mr-2" />}
                            {device === 'tablet' && <Monitor className="h-4 w-4 mr-2" />}
                            {device}
                          </span>
                          <span className="text-gray-400">{count} ({percentage}%)</span>
                        </div>
                        <div className="w-full bg-gray-700 rounded-full h-2">
                          <div
                            className="bg-blue-500 h-2 rounded-full transition-all"
                            style={{ width: `${percentage}%` }}
                          ></div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Browser Stats */}
              <div className="bg-gray-800 rounded-xl sm:rounded-2xl p-4 sm:p-6 shadow-xl">
                <h3 className="text-lg sm:text-xl font-bold mb-3 sm:mb-4 flex items-center">
                  <Globe className="h-5 w-5 sm:h-6 sm:w-6 mr-2 text-green-400" />
                  Browsers
                </h3>
                <div className="space-y-3">
                  {Object.entries(dashboardData.browserStats)
                    .sort((a, b) => b[1] - a[1])
                    .slice(0, 5)
                    .map(([browser, count]) => {
                      const total = Object.values(dashboardData.browserStats).reduce((a, b) => a + b, 0);
                      const percentage = ((count / total) * 100).toFixed(1);
                      return (
                        <div key={browser} className="space-y-2">
                          <div className="flex items-center justify-between text-sm">
                            <span className="capitalize">{browser}</span>
                            <span className="text-gray-400">{count} ({percentage}%)</span>
                          </div>
                          <div className="w-full bg-gray-700 rounded-full h-2">
                            <div
                              className="bg-green-500 h-2 rounded-full transition-all"
                              style={{ width: `${percentage}%` }}
                            ></div>
                          </div>
                        </div>
                      );
                    })}
                </div>
              </div>
            </div>

            {/* Top Countries */}
            {dashboardData.topCountries.length > 0 && (
              <div className="bg-gray-800 rounded-xl sm:rounded-2xl p-4 sm:p-6 shadow-xl mb-6 sm:mb-8">
                <h3 className="text-lg sm:text-xl font-bold mb-3 sm:mb-4 flex items-center">
                  <Globe className="h-5 w-5 sm:h-6 sm:w-6 mr-2 text-purple-400" />
                  Top Countries
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                  {dashboardData.topCountries.map(({ country, count }) => (
                    <div key={country} className="bg-gray-700/50 rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <span className="font-medium">{country}</span>
                        <span className="text-purple-400 font-bold">{count}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Daily Trend */}
            <div className="bg-gray-800 rounded-xl sm:rounded-2xl p-4 sm:p-6 shadow-xl mb-6 sm:mb-8">
              <h3 className="text-lg sm:text-xl font-bold mb-3 sm:mb-4 flex items-center">
                <TrendingUp className="h-5 w-5 sm:h-6 sm:w-6 mr-2 text-orange-400" />
                Daily Visitors (Last 30 Days)
              </h3>
              <div className="h-48 sm:h-64 flex items-end space-x-1">
                {dashboardData.dailyTrend.map(({ date, count }) => {
                  const maxCount = Math.max(...dashboardData.dailyTrend.map(d => d.count));
                  const height = maxCount > 0 ? (count / maxCount) * 100 : 0;
                  return (
                    <div
                      key={date}
                      className="flex-1 bg-orange-500 rounded-t hover:bg-orange-400 transition-colors cursor-pointer group relative"
                      style={{ height: `${height}%`, minHeight: count > 0 ? '4px' : '0' }}
                      title={`${date}: ${count} visitors`}
                    >
                      <div className="absolute bottom-full mb-2 left-1/2 transform -translate-x-1/2 bg-gray-900 text-white text-xs rounded py-1 px-2 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                        {date}: {count}
                      </div>
                    </div>
                  );
                })}
              </div>
              <div className="mt-4 text-xs text-gray-400 text-center">
                Hover over bars to see details
              </div>
            </div>
          </>
        )}

        {/* Recent Visitors Table */}
        <div className="bg-gray-800 rounded-xl sm:rounded-2xl shadow-xl overflow-hidden">
          <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-gray-700">
            <h3 className="text-lg sm:text-xl font-bold flex items-center">
              <Users className="h-5 w-5 sm:h-6 sm:w-6 mr-2 text-blue-400" />
              Recent Visitors
            </h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px]">
              <thead className="bg-gray-700/50">
                <tr>
                  <th className="px-3 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    Visitor ID
                  </th>
                  <th className="px-3 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    Device
                  </th>
                  <th className="px-3 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider hidden md:table-cell">
                    Browser / OS
                  </th>
                  <th className="px-3 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    Location
                  </th>
                  <th className="px-3 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    Visits
                  </th>
                  <th className="px-3 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider hidden lg:table-cell">
                    First Visit
                  </th>
                  <th className="px-3 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    Last Visit
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-700">
                {visitors.map((visitor) => (
                  <tr key={visitor.id} className="hover:bg-gray-700/30 transition-colors">
                    <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm font-mono text-gray-400">
                      {visitor.visitor_id.substring(0, 8)}...
                    </td>
                    <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm">
                      <div className="flex items-center">
                        {visitor.device_type === 'mobile' && <Smartphone className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2 text-blue-400" />}
                        {visitor.device_type === 'desktop' && <Monitor className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2 text-green-400" />}
                        {visitor.device_type === 'tablet' && <Monitor className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2 text-purple-400" />}
                        <span className="capitalize hidden sm:inline">{visitor.device_type || 'Unknown'}</span>
                      </div>
                    </td>
                    <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm hidden md:table-cell">
                      <div className="text-gray-300">{visitor.browser || 'N/A'}</div>
                      <div className="text-gray-500 text-xs">{visitor.os || 'N/A'}</div>
                    </td>
                    <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm">
                      <div className="text-gray-300">{visitor.country || 'Not Available'}</div>
                      {visitor.city && visitor.city !== 'null' && (
                        <div className="text-gray-500 text-xs hidden sm:block">{visitor.city}</div>
                      )}
                    </td>
                    <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm">
                      <span className="px-2 py-1 bg-blue-500/20 text-blue-400 rounded-full text-xs font-medium">
                        {visitor.visit_count}
                      </span>
                    </td>
                    <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-gray-400 hidden lg:table-cell">
                      {new Date(visitor.first_visit_at).toLocaleString()}
                    </td>
                    <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-gray-400">
                      {new Date(visitor.last_visit_at).toLocaleString(undefined, { 
                        month: 'short', 
                        day: 'numeric', 
                        hour: '2-digit', 
                        minute: '2-digit' 
                      })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="px-4 sm:px-6 py-3 sm:py-4 border-t border-gray-700 flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="text-xs sm:text-sm text-gray-400">
                Page {currentPage} of {totalPages}
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                  className="px-3 sm:px-4 py-2 text-sm bg-gray-700 hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-colors"
                >
                  Previous
                </button>
                <button
                  onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                  disabled={currentPage === totalPages}
                  className="px-3 sm:px-4 py-2 text-sm bg-gray-700 hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-colors"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminAnalytics;
