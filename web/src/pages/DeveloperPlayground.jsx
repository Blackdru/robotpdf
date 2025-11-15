import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Play, Copy, Code, ArrowLeft, Key, BarChart3, Book } from 'lucide-react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';

const DeveloperPlayground = () => {
  const [endpoint, setEndpoint] = useState('/v1/summarize');
  const [method, setMethod] = useState('POST');
  const [requestBody, setRequestBody] = useState(JSON.stringify({
    text: 'Sample text to summarize...',
    summary_type: 'brief'
  }, null, 2));
  const [response, setResponse] = useState(null);
  const [loading, setLoading] = useState(false);

  const endpoints = [
    { value: '/v1/health', method: 'GET', label: 'Health Check' },
    { value: '/v1/usage', method: 'GET', label: 'Usage Stats' },
    { value: '/v1/summarize', method: 'POST', label: 'Summarize' },
    { value: '/v1/chat', method: 'POST', label: 'Chat' },
    { value: '/v1/compress', method: 'POST', label: 'Compress PDF' }
  ];

  const executeRequest = async () => {
    setLoading(true);
    try {
      // Mock response
      await new Promise(resolve => setTimeout(resolve, 1000));
      setResponse({
        success: true,
        data: {
          summary: 'This is a mocked summary response from the API playground.',
          word_count: 12
        },
        timestamp: new Date().toISOString()
      });
      toast.success('Request executed successfully');
    } catch (error) {
      toast.error('Request failed');
      setResponse({ error: error.message });
    } finally {
      setLoading(false);
    }
  };

  const copyResponse = () => {
    if (response) {
      navigator.clipboard.writeText(JSON.stringify(response, null, 2));
      toast.success('Response copied to clipboard');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Navigation */}
        <div className="flex items-center gap-4 mb-6">
          <Link to="/developers" className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-700 dark:text-gray-300 hover:border-blue-300 dark:hover:border-blue-600 transition-all">
            <ArrowLeft className="w-4 h-4" />
            Back to Portal
          </Link>
          <Link to="/developers/keys" className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-700 dark:text-gray-300 hover:border-blue-300 dark:hover:border-blue-600 transition-all">
            <Key className="w-4 h-4" />
            API Keys
          </Link>
          <Link to="/developers/usage" className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-700 dark:text-gray-300 hover:border-blue-300 dark:hover:border-blue-600 transition-all">
            <BarChart3 className="w-4 h-4" />
            Usage
          </Link>
          <Link to="/developers/docs" className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-700 dark:text-gray-300 hover:border-blue-300 dark:hover:border-blue-600 transition-all">
            <Book className="w-4 h-4" />
            Docs
          </Link>
        </div>
        
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            API Playground
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Test API endpoints interactively
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Request Panel */}
          <div className="space-y-6">
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Request</h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Endpoint
                  </label>
                  <select
                    value={endpoint}
                    onChange={(e) => {
                      const selected = endpoints.find(ep => ep.value === e.target.value);
                      setEndpoint(e.target.value);
                      setMethod(selected.method);
                    }}
                    className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white"
                  >
                    {endpoints.map(ep => (
                      <option key={ep.value} value={ep.value}>{ep.label}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Method
                  </label>
                  <div className="px-4 py-2 bg-gray-100 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg font-mono text-sm">
                    {method}
                  </div>
                </div>

                {method === 'POST' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Request Body (JSON)
                    </label>
                    <textarea
                      value={requestBody}
                      onChange={(e) => setRequestBody(e.target.value)}
                      rows={10}
                      className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white font-mono text-sm"
                    />
                  </div>
                )}

                <button
                  onClick={executeRequest}
                  disabled={loading}
                  className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                >
                  {loading ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Executing...
                    </>
                  ) : (
                    <>
                      <Play className="w-5 h-5" />
                      Execute Request
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Response Panel */}
          <div className="space-y-6">
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Response</h2>
                {response && (
                  <button
                    onClick={copyResponse}
                    className="p-2 text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition-colors"
                  >
                    <Copy className="w-5 h-5" />
                  </button>
                )}
              </div>

              {response ? (
                <pre className="bg-gray-50 dark:bg-gray-900 p-4 rounded-lg overflow-auto max-h-96 text-sm">
                  <code className="text-gray-900 dark:text-white">
                    {JSON.stringify(response, null, 2)}
                  </code>
                </pre>
              ) : (
                <div className="flex flex-col items-center justify-center py-12 text-gray-400">
                  <Code className="w-16 h-16 mb-4" />
                  <p>Execute a request to see the response</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DeveloperPlayground;
