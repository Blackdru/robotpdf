import { useState } from 'react'
import { Button } from './ui/button'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs'
import { Upload, FolderOpen, Plus } from 'lucide-react'
import FileManager from './FileManager'
import FileUpload from './FileUpload'

const FileSelector = ({ 
  onFileSelect, 
  allowMultiple = false, 
  fileTypes = null,
  buttonText = "Select Files",
  buttonVariant = "outline",
  buttonSize = "default",
  children = null
}) => {
  const [isOpen, setIsOpen] = useState(false)
  const [activeTab, setActiveTab] = useState('storage')
  const [showUpload, setShowUpload] = useState(false)

  const handleFileSelect = (files) => {
    if (onFileSelect) {
      onFileSelect(files)
    }
    setIsOpen(false)
  }

  const handleUploadSuccess = (uploadedFiles) => {
    setShowUpload(false)
    // Auto-select the uploaded files
    if (onFileSelect && uploadedFiles) {
      onFileSelect(allowMultiple ? uploadedFiles : uploadedFiles[0])
      setIsOpen(false)
    }
  }

  return (
    <>
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogTrigger asChild>
          {children || (
            <Button variant={buttonVariant} size={buttonSize}>
              <FolderOpen className="mr-2 h-4 w-4" />
              {buttonText}
            </Button>
          )}
        </DialogTrigger>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-hidden">
          <DialogHeader>
            <DialogTitle>Select Files</DialogTitle>
            <DialogDescription>
              Choose files from your storage or upload new ones
            </DialogDescription>
          </DialogHeader>
          
          <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="storage" className="flex items-center">
                <FolderOpen className="mr-2 h-4 w-4" />
                From Storage
              </TabsTrigger>
              <TabsTrigger value="upload" className="flex items-center">
                <Upload className="mr-2 h-4 w-4" />
                Upload New
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="storage" className="mt-4 h-[70vh] overflow-auto">
              <FileManager
                selectionMode={true}
                allowMultiple={allowMultiple}
                fileTypes={fileTypes}
                onFileSelect={handleFileSelect}
                onClose={() => setIsOpen(false)}
              />
            </TabsContent>
            
            <TabsContent value="upload" className="mt-4">
              <div className="h-[70vh] flex items-center justify-center">
                <div className="text-center space-y-4">
                  <Upload className="mx-auto h-12 w-12 text-gray-400" />
                  <div>
                    <h3 className="text-lg font-medium">Upload Files</h3>
                    <p className="text-muted-foreground">
                      Upload new files and they will be automatically selected
                    </p>
                  </div>
                  <Button 
                    onClick={() => setShowUpload(true)}
                    className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Choose Files to Upload
                  </Button>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>

      {/* Upload Modal */}
      {showUpload && (
        <FileUpload
          onClose={() => setShowUpload(false)}
          onSuccess={handleUploadSuccess}
        />
      )}
    </>
  )
}

export default FileSelector