import { useNavigate, useLocation } from 'react-router-dom'
import { FolderOpen, Wrench, Sparkles, Code } from 'lucide-react'

const MobileBottomNav = () => {
  const navigate = useNavigate()
  const location = useLocation()

  const navItems = [
    { id: 'files', label: 'Files', icon: FolderOpen, path: '/files' },
    { id: 'tools', label: 'Tools', icon: Wrench, path: '/tools' },
    { id: 'advanced', label: 'Pro Tools', icon: Sparkles, path: '/advanced-tools' },
    { id: 'developers', label: 'Developers', icon: Code, path: '/developers' }
  ]

  const isActive = (path) => {
    return location.pathname === path || location.pathname.startsWith(path + '/')
  }

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50 safe-area-bottom shadow-lg">
      <div className="grid grid-cols-4 gap-1 px-2 py-2">
        {navItems.map((item) => {
          const Icon = item.icon
          const active = isActive(item.path)
          
          return (
            <button
              key={item.id}
              onClick={() => navigate(item.path)}
              className={`flex flex-col items-center justify-center py-2 px-1 rounded-xl transition-all duration-200 min-h-[60px] touch-manipulation ${
                active
                  ? 'bg-gradient-to-br from-indigo-500 to-purple-600 text-white shadow-md'
                  : 'text-gray-600 hover:bg-gray-50 active:bg-gray-100'
              }`}
            >
              <Icon className={`h-5 w-5 mb-1 ${active ? 'text-white' : 'text-gray-600'}`} />
              <span className={`text-xs font-medium ${active ? 'text-white' : 'text-gray-600'}`}>
                {item.label}
              </span>
            </button>
          )
        })}
      </div>
    </nav>
  )
}

export default MobileBottomNav
