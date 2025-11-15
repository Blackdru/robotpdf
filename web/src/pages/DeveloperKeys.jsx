import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Key, Copy, Plus, Trash2, RefreshCw, AlertTriangle, Loader2, ArrowLeft, BarChart3, Book, Code } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import { developerApi } from '../services/developerApi';

const DeveloperKeys = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [keys, setKeys] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newKeyData, setNewKeyData] = useState(null);
  const [creating, setCreating] = useState(false);
  const [keyName, setKeyName] = useState('');

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    fetchKeys();
  }, [user, navigate]);

  const fetchKeys = async () => {
    try {
      setLoading(true);
      const response = await developerApi.listKeys();
      setKeys(response.data || []);
    } catch (error) {
      console.error('Failed to fetch keys:', error);
      if (error.message?.includes('log in')) {
        toast.error('Please log in to access API keys');
        navigate('/login');
        return;
      }
      toast.error(error.message || 'Failed to load API keys');
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard!');
  };

  const createNewKey = async () => {
    if (!keyName.trim()) {
      toast.error('Please enter a key name');
      return;
    }

    try {
      setCreating(true);
      const response = await developerApi.createKey({
        name: keyName,
        monthly_limit: 1000
      });
      
      setNewKeyData(response.data);
      setShowCreateModal(false);
      toast.success('API key created successfully!');
      setKeyName('');
      await fetchKeys();
    } catch (error) {
      console.error('Create key error:', error);
      toast.error(error.message || 'Failed to create API key');
    } finally {
      setCreating(false);
    }
  };

  const deleteKey = async (keyId) => {
    if (!confirm('Are you sure you want to delete this API key? This action cannot be undone.')) {
      return;
    }
    
    try {
      await developerApi.deleteKey(keyId);
      toast.success('API key deleted successfully');
      await fetchKeys();
    } catch (error) {
      console.error('Delete key error:', error);
      toast.error(error.message || 'Failed to delete API key');
    }
  };

  const regenerateKey = async (keyId) => {
    if (!confirm('Regenerating will invalidate the current secret. The API key will remain the same. Are you sure?')) {
      return;
    }
    
    try {
      const response = await developerApi.regenerateKey(keyId);
      setNewKeyData(response.data);
      toast.success('API secret regenerated successfully');
      await fetchKeys();
    } catch (error) {
      console.error('Regenerate key error:', error);
      toast.error(error.message || 'Failed to regenerate API key');
    }
  };

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
          <Link to="/developers" className="flex items-center gap-2 px-4 py-2 bg-white border-2 border-gray-200 rounded-xl text-slate-700 hover:text-indigo-600 hover:border-indigo-300 hover:shadow-md transition-all">
            <ArrowLeft className="w-4 h-4" />
            Back to Portal
          </Link>
          <Link to="/developers/usage" className="flex items-center gap-2 px-4 py-2 bg-white border-2 border-gray-200 rounded-xl text-slate-700 hover:text-indigo-600 hover:border-indigo-300 hover:shadow-md transition-all">
            <BarChart3 className="w-4 h-4" />
            Usage
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
        
        {/* Header */}
        <div className="flex items-center justify-between mb-8 flex-wrap gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 mb-2">
              API Keys
            </h1>
            <p className="text-slate-600">
              Manage your API authentication credentials
            </p>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl hover:shadow-lg transition-all"
          >
            <Plus className="w-5 h-5" />
            Create New Key
          </button>
        </div>

        {/* Security Notice */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-yellow-50 border-2 border-yellow-200 rounded-2xl p-6 mb-8 shadow-md"
        >
          <div className="flex gap-4">
            <AlertTriangle className="w-6 h-6 text-yellow-600 flex-shrink-0" />
            <div>
              <h3 className="font-semibold text-slate-900 mb-2">
                Security Best Practices
              </h3>
              <ul className="text-sm text-slate-600 space-y-1">
                <li>• Never expose your API secret in client-side code or public repositories</li>
                <li>• Store secrets in environment variables on your server</li>
                <li>• Use test keys for development and live keys for production</li>
                <li>• Rotate keys regularly and immediately if compromised</li>
              </ul>
            </div>
          </div>
        </motion.div>

        {/* Loading State */}
        {loading && (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
          </div>
        )}

        {/* API Keys List */}
        {!loading && keys.length > 0 && (
          <div className="space-y-4">
          {keys.map((key, index) => (
            <motion.div
              key={key.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="bg-white border-2 border-gray-200 rounded-2xl p-6 shadow-md hover:shadow-xl hover:border-indigo-200 transition-all"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-start gap-4">
                  <div className="p-3 bg-indigo-100 rounded-xl">
                    <Key className="w-6 h-6 text-indigo-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-slate-900 mb-1">
                      {key.name}
                    </h3>
                    <div className="flex items-center gap-4 text-sm text-slate-600">
                      <span>Created {new Date(key.created_at).toLocaleDateString()}</span>
                      {key.last_used && (
                        <span>Last used {new Date(key.last_used).toLocaleDateString()}</span>
                      )}
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        key.is_active 
                          ? 'bg-green-100 text-green-700 border border-green-200' 
                          : 'bg-red-100 text-red-700 border border-red-200'
                      }`}>
                        {key.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => regenerateKey(key.id)}
                    className="p-2 text-slate-600 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-colors border-2 border-transparent hover:border-indigo-200"
                    title="Regenerate Key"
                  >
                    <RefreshCw className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => deleteKey(key.id)}
                    className="p-2 text-slate-600 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors border-2 border-transparent hover:border-red-200"
                    title="Delete Key"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* API Key */}
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-900 mb-2">
                    API Key (Public)
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={key.api_key}
                      readOnly
                      className="flex-1 px-4 py-2 bg-slate-50 border-2 border-gray-200 rounded-xl text-slate-900 font-mono text-sm"
                    />
                    <button
                      onClick={() => copyToClipboard(key.api_key)}
                      className="px-4 py-2 bg-indigo-100 hover:bg-indigo-200 text-indigo-700 rounded-xl transition-colors border-2 border-indigo-200"
                      title="Copy to clipboard"
                    >
                      <Copy className="w-5 h-5" />
                    </button>
                  </div>
                </div>

                {/* API Secret */}
                <div>
                  <label className="block text-sm font-medium text-slate-900 mb-2">
                    API Secret (Private)
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value="Secret hidden - cannot be retrieved after creation"
                      readOnly
                      className="flex-1 px-4 py-2 bg-slate-50 border-2 border-gray-200 rounded-xl text-slate-500 italic text-sm"
                    />
                  </div>
                  <p className="mt-2 text-xs text-yellow-700 flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3" />
                    For security, secrets are only shown once during creation. Use "Regenerate" to create a new secret.
                  </p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
        )}

        {!loading && keys.length === 0 && (
          <div className="text-center py-12 bg-white rounded-2xl border-2 border-gray-200 shadow-md">
            <Key className="w-16 h-16 text-indigo-600 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-slate-900 mb-2">
              No API Keys Yet
            </h3>
            <p className="text-slate-600 mb-6">
              Create your first API key to start building with RobotPDF
            </p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl hover:shadow-lg transition-all"
            >
              Create API Key
            </button>
          </div>
        )}

        {/* Create Key Modal */}
        <AnimatePresence>
          {showCreateModal && (
            <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-white rounded-2xl border-2 border-gray-200 shadow-xl p-6 max-w-md w-full"
              >
                <h3 className="text-xl font-bold text-slate-900 mb-4">
                  Create New API Key
                </h3>
                <div className="mb-6">
                  <label className="block text-sm font-medium text-slate-900 mb-2">
                    Key Name
                  </label>
                  <input
                    type="text"
                    value={keyName}
                    onChange={(e) => setKeyName(e.target.value)}
                    placeholder="e.g., Production API"
                    className="w-full px-4 py-2 bg-slate-50 border-2 border-gray-200 rounded-xl text-slate-900 focus:border-indigo-300 focus:ring-2 focus:ring-indigo-200 transition-colors"
                    disabled={creating}
                  />
                  <p className="mt-2 text-xs text-slate-600">
                    Choose a descriptive name to help identify this key
                  </p>
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={() => {
                      setShowCreateModal(false);
                      setKeyName('');
                    }}
                    disabled={creating}
                    className="flex-1 px-4 py-2 bg-white border-2 border-gray-200 text-slate-700 rounded-xl hover:bg-slate-50 hover:border-gray-300 transition-colors disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={createNewKey}
                    disabled={creating}
                    className="flex-1 px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl hover:shadow-lg transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {creating ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Creating...
                      </>
                    ) : (
                      'Create Key'
                    )}
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* New Key Display Modal */}
        <AnimatePresence>
          {newKeyData && (
            <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-white rounded-2xl border-2 border-gray-200 shadow-xl p-6 max-w-2xl w-full"
              >
                <div className="flex items-start gap-4 mb-6">
                  <div className="p-3 bg-green-100 rounded-xl border-2 border-green-200">
                    <Key className="w-6 h-6 text-green-600" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-slate-900 mb-2">
                      API Key Created Successfully!
                    </h3>
                    <p className="text-slate-600">
                      Save these credentials now. The secret will never be shown again.
                    </p>
                  </div>
                </div>

                <div className="space-y-4 mb-6">
                  <div>
                    <label className="block text-sm font-medium text-slate-900 mb-2">
                      API Key (Public)
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={newKeyData.api_key}
                        readOnly
                        className="flex-1 px-4 py-2 bg-slate-50 border-2 border-gray-200 rounded-xl text-slate-900 font-mono text-sm"
                      />
                      <button
                        onClick={() => {
                          copyToClipboard(newKeyData.api_key);
                          toast.success('API key copied!');
                        }}
                        className="px-4 py-2 bg-indigo-100 hover:bg-indigo-200 text-indigo-700 rounded-xl transition-colors border-2 border-indigo-200"
                      >
                        <Copy className="w-5 h-5" />
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-900 mb-2">
                      API Secret (Private)
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={newKeyData.api_secret}
                        readOnly
                        className="flex-1 px-4 py-2 bg-yellow-50 border-2 border-yellow-300 rounded-xl text-slate-900 font-mono text-sm"
                      />
                      <button
                        onClick={() => {
                          copyToClipboard(newKeyData.api_secret);
                          toast.success('API secret copied!');
                        }}
                        className="px-4 py-2 bg-yellow-100 hover:bg-yellow-200 text-yellow-700 rounded-xl transition-colors border-2 border-yellow-300"
                      >
                        <Copy className="w-5 h-5" />
                      </button>
                    </div>
                    <p className="mt-2 text-xs text-yellow-700 flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4" />
                      {newKeyData.warning}
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => setNewKeyData(null)}
                  className="w-full px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl hover:shadow-lg transition-all"
                >
                  I've Saved My Credentials
                </button>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default DeveloperKeys;
