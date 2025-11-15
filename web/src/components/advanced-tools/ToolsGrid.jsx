import { Button } from '../ui/button'
import { Crown, TrendingUp, Clock, Shield, CheckCircle, Play } from 'lucide-react'

const ToolsGrid = ({ tools, selectedTool, onToolSelect }) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5 sm:gap-6 mb-8 sm:mb-12 lg:mb-16">
      {tools.map((tool, index) => (
        <div
          key={tool.id}
          onClick={() => onToolSelect(tool)}
          className={`group relative rounded-2xl transition-all duration-300 cursor-pointer hover:-translate-y-2 hover:shadow-2xl overflow-hidden ${
            selectedTool?.id === tool.id
              ? 'shadow-2xl scale-105'
              : 'shadow-lg'
          }`}
          style={{
            animation: `fadeInUp 0.5s ease-out ${index * 0.1}s both`
          }}
        >
          {/* Solid Color Background */}
          <div className={`${tool.solidColor} p-6 pb-4 rounded-t-2xl relative`}>
            {/* PRO Badge */}
            <div className="absolute top-3 right-3">
              <div className="bg-white text-slate-700 text-xs font-bold px-3 py-1 rounded-full shadow-md flex items-center">
                <Crown className="h-3 w-3 mr-1" />
                PRO
              </div>
            </div>

            {/* Icon */}
            <div className="mb-4">
              <div className="inline-flex items-center justify-center w-14 h-14 rounded-xl bg-white/20 backdrop-blur-sm">
                <tool.icon className="h-7 w-7 text-white" />
              </div>
            </div>

            {/* Title */}
            <h3 className="text-xl font-bold text-white mb-2">
              {tool.title}
            </h3>
          </div>

          {/* White Bottom Section */}
          <div className="bg-white p-6 pt-4 rounded-b-2xl">
            {/* Description */}
            <p className="text-sm text-slate-600 leading-relaxed mb-4">
              {tool.description}
            </p>

            {/* Pro Features List */}
            {tool.features && tool.features.length > 0 && (
              <div className="space-y-2 mb-4">
                {tool.features.slice(0, 2).map((feature, idx) => (
                  <div key={idx} className="flex items-start text-xs text-slate-600">
                    <CheckCircle className="h-3.5 w-3.5 mr-2 text-emerald-500 flex-shrink-0 mt-0.5" />
                    <span className="line-clamp-1">{feature}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Hover Effect Overlay */}
          <div className="absolute inset-0 bg-gradient-to-br from-white/0 to-white/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
        </div>
      ))}
    </div>
  )
}

export default ToolsGrid