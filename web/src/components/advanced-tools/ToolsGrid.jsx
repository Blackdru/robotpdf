import { Crown, CheckCircle } from 'lucide-react'

const ToolsGrid = ({ tools, selectedTool, onToolSelect }) => {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-4 mb-8">
      {tools.map((tool, index) => (
        <div
          key={tool.id}
          onClick={() => onToolSelect(tool)}
          className={`group relative bg-white rounded-xl overflow-hidden cursor-pointer transition-all duration-300 hover:-translate-y-1 hover:shadow-lg ${
            selectedTool?.id === tool.id
              ? 'ring-2 ring-purple-500 shadow-lg'
              : 'shadow-md hover:shadow-purple-100'
          }`}
          style={{ animation: `fadeInUp 0.4s ease-out ${index * 0.03}s both` }}
        >
          {/* Compact Card Design */}
          <div className={`p-3 sm:p-4 ${tool.solidColor}`}>
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="p-2 bg-white/20 rounded-lg group-hover:scale-105 transition-transform">
                <tool.icon className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
              </div>
              <h3 className="text-sm sm:text-base font-semibold text-white truncate flex-1">{tool.title}</h3>
            </div>
          </div>
          <div className="p-3 sm:p-4">
            <p className="text-slate-600 text-xs sm:text-sm leading-snug mb-2 line-clamp-2" title={tool.description}>
              {tool.description}
            </p>
            <div className="flex items-center justify-between">
              <span className="text-[10px] sm:text-xs text-purple-600 font-medium bg-purple-50 px-1.5 py-0.5 rounded flex items-center gap-1">
                <Crown className="h-2.5 w-2.5" />PRO
              </span>
              <span className="text-[10px] sm:text-xs text-slate-400">{tool.processingTime}</span>
            </div>
          </div>
          {selectedTool?.id === tool.id && (
            <div className="absolute top-2 right-2 p-1 bg-purple-600 rounded-full">
              <CheckCircle className="h-3 w-3 text-white" />
            </div>
          )}
        </div>
      ))}
    </div>
  )
}

export default ToolsGrid
