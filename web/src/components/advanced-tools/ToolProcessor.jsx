import { useState, useEffect } from 'react'
import { Button } from '../ui/button'
import { Crown, Upload, FileText, Info, Rocket } from 'lucide-react'
import AdvancedSettings from './AdvancedSettings'
import HtmlToPdfUploadModal from '../HtmlToPdfUploadModal'

const ToolProcessor = ({
  selectedTool,
  uploadedFiles,
  onFilesUploaded,
  isProcessing,
  canProcess,
  usageExceeded,
  onProcess,
  showUploadModal,
  setShowUploadModal,
  toolSettings,
  setToolSettings,
  onUrlSubmitted
}) => {
  const [showAdvancedSettings, setShowAdvancedSettings] = useState(true)

  // Always show advanced settings when a tool is selected
  useEffect(() => {
    if (selectedTool) {
      setShowAdvancedSettings(true)
    }
  }, [selectedTool])

  return (
    <div className="bg-surface rounded-2xl sm:rounded-3xl border border-border p-4 sm:p-6 lg:p-8 mb-6 sm:mb-8">
      <div className="flex flex-col sm:flex-row items-start sm:items-center mb-6 sm:mb-8 gap-3 sm:gap-4">
        <div className={`w-10 h-10 sm:w-12 sm:h-12 ${selectedTool.iconBg} rounded-lg sm:rounded-xl flex items-center justify-center flex-shrink-0`}>
          <selectedTool.icon className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <h2 className="text-lg sm:text-xl lg:text-2xl font-bold text-foreground truncate">{selectedTool.title}</h2>
          <p className="text-xs sm:text-sm text-muted-foreground line-clamp-2">{selectedTool.description}</p>
        </div>
        <div className="bg-gradient-to-r from-purple-500 to-pink-500 text-white text-xs font-bold px-2 sm:px-3 py-1 rounded-full self-start sm:self-auto flex-shrink-0">
          <Crown className="h-2 w-2 sm:h-3 sm:w-3 mr-1 inline" />
          PRO
        </div>
      </div>

      {/* Advanced Settings Panel */}
      <AdvancedSettings
        selectedTool={selectedTool}
        showAdvancedSettings={showAdvancedSettings}
        setShowAdvancedSettings={setShowAdvancedSettings}
        toolSettings={toolSettings}
        setToolSettings={setToolSettings}
      />

      {/* File Upload Area or URL Input - Mobile First */}
      <div id="upload-section" className="bg-elevated rounded-xl sm:rounded-2xl p-4 sm:p-6 mb-4 sm:mb-6 text-center">
        {selectedTool.id === 'advanced-html-to-pdf' ? (
          <>
            <h3 className="text-base sm:text-lg font-semibold text-card-foreground mb-3 sm:mb-4">
              Convert HTML to PDF
            </h3>
            <p className="text-xs sm:text-sm text-muted-foreground mb-4">
              Upload an HTML file or enter a webpage URL to convert to PDF
            </p>
            
            <Button
              onClick={() => setShowUploadModal(true)}
              className={`bg-gradient-to-r ${selectedTool.color} text-white px-6 sm:px-8 py-3 sm:py-4 text-sm sm:text-base lg:text-lg font-semibold hover:shadow-lg transition-all duration-300 w-full sm:w-auto mobile-touch-target`}
            >
              <Upload className="h-4 w-4 sm:h-5 sm:w-5 mr-2" />
              Upload File or Enter URL
            </Button>
            
            <p className="text-xs sm:text-sm text-muted-foreground mt-3">
              Supports: HTML files or any public webpage URL
            </p>
          </>
        ) : (
          <>
            <h3 className="text-base sm:text-lg font-semibold text-card-foreground mb-3 sm:mb-4">
              {selectedTool.multipleFiles ? 'Upload Files' : 'Upload File'}
            </h3>
            
            <Button
              onClick={() => setShowUploadModal(true)}
              className={`bg-gradient-to-r ${selectedTool.color} text-white px-6 sm:px-8 py-3 sm:py-4 text-sm sm:text-base lg:text-lg font-semibold hover:shadow-lg transition-all duration-300 w-full sm:w-auto mobile-touch-target`}
            >
              <Upload className="h-4 w-4 sm:h-5 sm:w-5 mr-2" />
              {selectedTool.multipleFiles ? 'Select Files' : 'Select File'}
            </Button>

            <p className="text-xs sm:text-sm text-muted-foreground mt-3">
              Supports: {selectedTool.acceptedFiles.replace(/\./g, '').toUpperCase()}
              {selectedTool.multipleFiles && ` • Up to 10 files`}
            </p>
          </>
        )}

        {/* Uploaded Files Display - Mobile First */}
        {uploadedFiles.length > 0 && (
          <div className="mt-4 sm:mt-6 space-y-2 sm:space-y-3">
            <h4 className="text-xs sm:text-sm font-medium text-card-foreground">
              Selected Files ({uploadedFiles.length})
            </h4>
            <div className="space-y-2">
              {uploadedFiles.map((file, index) => (
                <div key={index} className="flex items-center justify-between p-2 sm:p-3 bg-accent rounded-lg mobile-touch-target">
                  <div className="flex items-center space-x-2 sm:space-x-3 flex-1 min-w-0">
                    <FileText className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground flex-shrink-0" />
                    <span className="text-xs sm:text-sm text-card-foreground truncate">{file.name}</span>
                  </div>
                  <span className="text-xs text-muted-foreground whitespace-nowrap ml-2">
                    {(file.size / 1024 / 1024).toFixed(2)} MB
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {selectedTool.minFiles > 1 && uploadedFiles.length > 0 && uploadedFiles.length < selectedTool.minFiles && (
          <div className="mt-4 p-3 sm:p-4 bg-blue-900 border border-blue-800 rounded-xl flex items-start sm:items-center">
            <Info className="h-4 w-4 sm:h-5 sm:w-5 text-blue-400 mr-2 sm:mr-3 flex-shrink-0 mt-0.5 sm:mt-0" />
            <p className="text-xs sm:text-sm text-blue-300 text-left">
              You need at least {selectedTool.minFiles} files to use this tool. 
              Upload {selectedTool.minFiles - uploadedFiles.length} more file(s).
            </p>
          </div>
        )}
      </div>

      {/* Process Button - Mobile First */}
      {(uploadedFiles.length > 0 || (selectedTool.id === 'advanced-html-to-pdf' && toolSettings?.url?.trim())) && (
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 sm:p-6 bg-elevated rounded-xl sm:rounded-2xl gap-4">
          <div className="flex-1">
            <h3 className="text-base sm:text-lg font-semibold text-card-foreground mb-1">Ready to Process</h3>
            <p className="text-xs sm:text-sm text-muted-foreground">
              {selectedTool.id === 'advanced-html-to-pdf' 
                ? (uploadedFiles.length > 0 
                    ? `HTML file ready to convert` 
                    : 'URL ready to convert')
                : `${uploadedFiles.length} file(s) ready for ${selectedTool.title.toLowerCase()}`
              }
            </p>
          </div>
          <Button
            onClick={() => onProcess(uploadedFiles, toolSettings)}
            disabled={usageExceeded || isProcessing}
            className={`bg-gradient-to-r ${selectedTool.color} text-white px-6 sm:px-8 py-2.5 sm:py-3 hover:shadow-lg transition-all duration-300 w-full sm:w-auto mobile-touch-target text-sm sm:text-base`}
          >
            {isProcessing ? (
              <>
                <div className="animate-spin rounded-full h-3 w-3 sm:h-4 sm:w-4 border-2 border-white border-t-transparent mr-2" />
                Processing...
              </>
            ) : (
              <>
                <Rocket className="h-3 w-3 sm:h-4 sm:w-4 mr-2" />
                Convert to PDF
              </>
            )}
          </Button>
        </div>
      )}

      {/* HTML to PDF Upload Modal */}
      {selectedTool.id === 'advanced-html-to-pdf' && (
        <HtmlToPdfUploadModal
          isOpen={showUploadModal}
          onClose={() => setShowUploadModal(false)}
          onFilesUploaded={onFilesUploaded}
          onUrlSubmitted={onUrlSubmitted}
          acceptedFiles={selectedTool.acceptedFiles}
          toolName={selectedTool.title}
        />
      )}
    </div>
  )
}

export default ToolProcessor