import { useAuth } from '../contexts/AuthContext'
import FileManager from '../components/FileManager'

const FileManagerPage = () => {
  const { user } = useAuth()

  return (
    <div className="min-h-screen bg-gradient-to-b from-white via-slate-50 to-white relative overflow-hidden">
      {/* Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -left-40 w-[600px] h-[600px] bg-gradient-to-br from-indigo-100/30 to-purple-100/30 rounded-full blur-3xl"></div>
        <div className="absolute top-40 -right-40 w-[500px] h-[500px] bg-gradient-to-br from-blue-100/30 to-cyan-100/30 rounded-full blur-3xl"></div>
      </div>

      <div className="container mx-auto px-4 py-12 relative z-10">
        <div className="text-center mb-12">
          <h1 className="text-4xl sm:text-5xl font-bold text-slate-900 mb-4">
            File <span className="bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">Manager</span>
          </h1>
          <p className="text-lg text-slate-600">Manage your uploaded files</p>
        </div>
        <FileManager />
      </div>
    </div>
  )
}

export default FileManagerPage