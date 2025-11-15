import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { api } from '../lib/api'
import { formatFileSize, getFileIcon } from '../lib/utils'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Badge } from './ui/badge'
import { Progress } from './ui/progress'
import { 
  Play, 
  Pause,
  Square,
  Plus,
  Trash2,
  Settings,
  Clock,
  CheckCircle,
  XCircle,
  Loader2,
  FileText,
  Merge,
  Split,
  Archive,
  Eye,
  Brain,
  Zap,
  ArrowRight,
  X
} from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from './ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select'
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from './ui/tabs'
import toast from 'react-hot-toast'

const BatchProcessor = ({ files = [], onClose }) => {
  const [activeTab, setActiveTab] = useState('builder')
  const [batchName, setBatchName] = useState('')
  const [operations, setOperations] = useState([])
  const [selectedFiles, setSelectedFiles] = useState([])
  const [batchOperations, setBatchOperations] = useState([])
  const [templates, setTemplates] = useState([])
  const [showTemplates, setShowTemplates] = useState(false)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    loadBatchOperations()
    loadTemplates()
  }, [])

  const loadBatchOperations = async () => {
    try {
      const response = await api.get('/batch')
      setBatchOperations(response.operations || [])
    } catch (error) {
      console.error('Error loading batch operations:', error)
    }
  }

  const loadTemplates = async () => {
    try {
      const response = await api.get('/batch/templates/common')
      setTemplates(response.templates || [])
    } catch (error) {
      console.error('Error loading templates:', error)
    }
  }

  const addOperation = () => {
    setOperations([...operations, {
      id: Date.now(),
      type: 'merge',
      fileIds: [],
      options: {}
    }])
  }

  const updateOperation = (id, updates) => {
    setOperations(operations.map(op => 
      op.id === id ? { ...op, ...updates } : op
    ))
  }

  const removeOperation = (id) => {
    setOperations(operations.filter(op => op.id !== id))
  }

  const handleFileSelection = (operationId, fileIds) => {
    updateOperation(operationId, { fileIds })
  }

  const createBatchOperation = async () => {
    if (!batchName.trim()) {
      toast.error('Please enter a batch name')
      return
    }

    if (operations.length === 0) {
      toast.error('Please add at least one operation')
      return
    }

    // Validate operations
    for (const op of operations) {
      if (op.fileIds.length === 0) {
        toast.error(`Operation "${op.type}" needs at least one file`)
        return
      }
    }

    setLoading(true)
    try {
      const response = await api.post('/batch', {
        name: batchName,
        operations: operations.map(op => ({
          type: op.type,
          fileIds: op.fileIds,
          options: op.options
        }))
      })

      toast.success('Batch operation created successfully!')
      setBatchName('')
      setOperations([])
      setActiveTab('monitor')
      loadBatchOperations()
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to create batch operation')
    } finally {
      setLoading(false)
    }
  }

  const createFromTemplate = async (template) => {
    if (selectedFiles.length === 0) {
      toast.error('Please select files first')
      return
    }

    setLoading(true)
    try {
      const response = await api.post('/batch/from-template', {
        templateId: template.id,
        name: `${template.name} - ${new Date().toLocaleDateString()}`,
        fileIds: selectedFiles,
        customOptions: {}
      })

      toast.success('Batch operation created from template!')
      setShowTemplates(false)
      setActiveTab('monitor')
      loadBatchOperations()
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to create batch from template')
    } finally {
      setLoading(false)
    }
  }

  const cancelBatchOperation = async (batchId) => {
    try {
      await api.delete(`/batch/${batchId}`)
      toast.success('Batch operation cancelled')
      loadBatchOperations()
    } catch (error) {
      toast.error('Failed to cancel batch operation')
    }
  }

  const getOperationIcon = (type) => {
    switch (type) {
      case 'merge': return <Merge className="h-4 w-4" />
      case 'split': return <Split className="h-4 w-4" />
      case 'compress': return <Archive className="h-4 w-4" />
      case 'ocr': return <Eye className="h-4 w-4" />
      case 'summarize': return <Brain className="h-4 w-4" />
      default: return <FileText className="h-4 w-4" />
    }
  }

  const getStatusIcon = (status) => {
    switch (status) {
      case 'pending': return <Clock className="h-4 w-4 text-orange-500" />
      case 'processing': return <Loader2 className="h-4 w-4 text-blue-500 animate-spin" />
      case 'completed': return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'failed': return <XCircle className="h-4 w-4 text-red-500" />
      default: return <Clock className="h-4 w-4 text-gray-500" />
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-2 sm:p-4"
    >
      <Card className="w-full max-w-[95vw] sm:max-w-3xl lg:max-w-4xl max-h-[95vh] sm:max-h-[90vh] overflow-hidden">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="flex items-center">
              <Zap className="h-5 w-5 mr-2" />
              Batch Processor
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              Process multiple files with automated workflows
            </p>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </CardHeader>

        <CardContent className="p-0">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="builder">Workflow Builder</TabsTrigger>
              <TabsTrigger value="templates">Templates</TabsTrigger>
              <TabsTrigger value="monitor">Monitor</TabsTrigger>
            </TabsList>

            <div className="p-6 max-h-[60vh] overflow-y-auto">
              <TabsContent value="builder" className="space-y-6">
                {/* Batch Name */}
                <div>
                  <label className="text-sm font-medium mb-2 block">Batch Name</label>
                  <Input
                    value={batchName}
                    onChange={(e) => setBatchName(e.target.value)}
                    placeholder="Enter batch operation name"
                  />
                </div>

                {/* Operations */}
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-medium">Operations</h3>
                    <Button onClick={addOperation} size="sm">
                      <Plus className="h-4 w-4 mr-2" />
                      Add Operation
                    </Button>
                  </div>

                  <div className="space-y-4">
                    {operations.map((operation, index) => (
                      <Card key={operation.id} className="p-4">
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex items-center space-x-2">
                            <span className="text-sm font-medium">Step {index + 1}</span>
                            {getOperationIcon(operation.type)}
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => removeOperation(operation.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="text-sm font-medium mb-2 block">Operation Type</label>
                            <Select
                              value={operation.type}
                              onValueChange={(value) => updateOperation(operation.id, { type: value })}
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="merge">Merge PDFs</SelectItem>
                                <SelectItem value="split">Split PDF</SelectItem>
                                <SelectItem value="compress">Compress PDF</SelectItem>
                                <SelectItem value="convert">Convert to PDF</SelectItem>
                                <SelectItem value="ocr">Extract Text (OCR)</SelectItem>
                                <SelectItem value="summarize">AI Summarize</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>

                          <div>
                            <label className="text-sm font-medium mb-2 block">
                              Files ({operation.fileIds.length} selected)
                            </label>
                            <div className="border rounded-md p-2 max-h-32 overflow-y-auto">
                              {files.map((file) => (
                                <label key={file.id} className="flex items-center space-x-2 p-1">
                                  <input
                                    type="checkbox"
                                    checked={operation.fileIds.includes(file.id)}
                                    onChange={(e) => {
                                      const newFileIds = e.target.checked
                                        ? [...operation.fileIds, file.id]
                                        : operation.fileIds.filter(id => id !== file.id)
                                      handleFileSelection(operation.id, newFileIds)
                                    }}
                                    className="rounded"
                                  />
                                  <span className="text-sm truncate">{file.filename}</span>
                                </label>
                              ))}
                            </div>
                          </div>
                        </div>

                        {/* Operation-specific options */}
                        {operation.type === 'compress' && (
                          <div className="mt-4">
                            <label className="text-sm font-medium mb-2 block">Quality</label>
                            <Select
                              value={operation.options.quality || '0.7'}
                              onValueChange={(value) => updateOperation(operation.id, {
                                options: { ...operation.options, quality: parseFloat(value) }
                              })}
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="0.3">High Compression (30%)</SelectItem>
                                <SelectItem value="0.5">Medium Compression (50%)</SelectItem>
                                <SelectItem value="0.7">Low Compression (70%)</SelectItem>
                                <SelectItem value="0.9">Minimal Compression (90%)</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        )}

                        {operation.type === 'summarize' && (
                          <div className="mt-4">
                            <label className="text-sm font-medium mb-2 block">Summary Type</label>
                            <Select
                              value={operation.options.summaryType || 'auto'}
                              onValueChange={(value) => updateOperation(operation.id, {
                                options: { ...operation.options, summaryType: value }
                              })}
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="brief">Brief Summary</SelectItem>
                                <SelectItem value="auto">Auto Summary</SelectItem>
                                <SelectItem value="detailed">Detailed Summary</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        )}
                      </Card>
                    ))}

                    {operations.length === 0 && (
                      <div className="text-center py-8 text-muted-foreground">
                        <Zap className="h-8 w-8 mx-auto mb-2" />
                        <p>No operations added yet</p>
                        <p className="text-sm">Click "Add Operation" to get started</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Create Button */}
                <div className="flex justify-end space-x-2">
                  <Button variant="outline" onClick={onClose}>
                    Cancel
                  </Button>
                  <Button onClick={createBatchOperation} disabled={loading}>
                    {loading ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Play className="h-4 w-4 mr-2" />
                    )}
                    Create Batch
                  </Button>
                </div>
              </TabsContent>

              <TabsContent value="templates" className="space-y-6">
                <div>
                  <h3 className="text-lg font-medium mb-4">Quick Start Templates</h3>
                  <p className="text-sm text-muted-foreground mb-6">
                    Select files and choose a template to quickly create common workflows
                  </p>

                  {/* File Selection */}
                  <div className="mb-6">
                    <label className="text-sm font-medium mb-2 block">
                      Select Files ({selectedFiles.length} selected)
                    </label>
                    <div className="border rounded-md p-4 max-h-48 overflow-y-auto">
                      <div className="grid grid-cols-2 gap-2">
                        {files.map((file) => (
                          <label key={file.id} className="flex items-center space-x-2 p-2 hover:bg-muted rounded">
                            <input
                              type="checkbox"
                              checked={selectedFiles.includes(file.id)}
                              onChange={(e) => {
                                const newSelection = e.target.checked
                                  ? [...selectedFiles, file.id]
                                  : selectedFiles.filter(id => id !== file.id)
                                setSelectedFiles(newSelection)
                              }}
                              className="rounded"
                            />
                            <div className="text-lg">{getFileIcon(file.type)}</div>
                            <span className="text-sm truncate">{file.filename}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Templates */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {templates.map((template) => (
                      <Card key={template.id} className="cursor-pointer hover:shadow-md transition-shadow">
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between mb-3">
                            <h4 className="font-medium">{template.name}</h4>
                            <Badge variant="secondary">{template.operations.length} steps</Badge>
                          </div>
                          <p className="text-sm text-muted-foreground mb-4">{template.description}</p>
                          
                          <div className="space-y-2 mb-4">
                            {template.operations.map((op, index) => (
                              <div key={index} className="flex items-center space-x-2 text-sm">
                                {getOperationIcon(op.type)}
                                <span className="capitalize">{op.type}</span>
                                {index < template.operations.length - 1 && (
                                  <ArrowRight className="h-3 w-3 text-muted-foreground" />
                                )}
                              </div>
                            ))}
                          </div>

                          <Button
                            onClick={() => createFromTemplate(template)}
                            disabled={selectedFiles.length === 0 || loading}
                            className="w-full"
                            size="sm"
                          >
                            {loading ? (
                              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            ) : (
                              <Play className="h-4 w-4 mr-2" />
                            )}
                            Use Template
                          </Button>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="monitor" className="space-y-6">
                <div>
                  <h3 className="text-lg font-medium mb-4">Batch Operations</h3>
                  
                  {batchOperations.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <Clock className="h-8 w-8 mx-auto mb-2" />
                      <p>No batch operations yet</p>
                      <p className="text-sm">Create your first batch operation to see it here</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {batchOperations.map((batch) => (
                        <Card key={batch.id}>
                          <CardContent className="p-4">
                            <div className="flex items-start justify-between mb-4">
                              <div>
                                <h4 className="font-medium">{batch.name}</h4>
                                <p className="text-sm text-muted-foreground">
                                  {batch.operations.length} operations • Created {new Date(batch.created_at).toLocaleDateString()}
                                </p>
                              </div>
                              <div className="flex items-center space-x-2">
                                {getStatusIcon(batch.status)}
                                <Badge variant={
                                  batch.status === 'completed' ? 'default' :
                                  batch.status === 'failed' ? 'destructive' :
                                  batch.status === 'processing' ? 'secondary' : 'outline'
                                }>
                                  {batch.status}
                                </Badge>
                              </div>
                            </div>

                            {batch.status === 'processing' && (
                              <div className="mb-4">
                                <div className="flex items-center justify-between text-sm mb-2">
                                  <span>Progress</span>
                                  <span>{batch.progress}%</span>
                                </div>
                                <Progress value={batch.progress} className="h-2" />
                              </div>
                            )}

                            <div className="flex items-center justify-between">
                              <div className="flex space-x-2">
                                {batch.operations.map((op, index) => (
                                  <div key={index} className="flex items-center space-x-1 text-sm">
                                    {getOperationIcon(op.type)}
                                    <span className="capitalize">{op.type}</span>
                                    {index < batch.operations.length - 1 && (
                                      <ArrowRight className="h-3 w-3 text-muted-foreground mx-1" />
                                    )}
                                  </div>
                                ))}
                              </div>

                              {batch.status === 'processing' && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => cancelBatchOperation(batch.id)}
                                >
                                  <Square className="h-4 w-4 mr-2" />
                                  Cancel
                                </Button>
                              )}
                            </div>

                            {batch.error_message && (
                              <div className="mt-4 p-3 bg-destructive/10 border border-destructive/20 rounded-md">
                                <p className="text-sm text-destructive">{batch.error_message}</p>
                              </div>
                            )}

                            {batch.result_files && batch.result_files.length > 0 && (
                              <div className="mt-4">
                                <p className="text-sm font-medium mb-2">Result Files:</p>
                                <div className="text-sm text-muted-foreground">
                                  {batch.result_files.length} file(s) created
                                </div>
                              </div>
                            )}
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </div>
              </TabsContent>
            </div>
          </Tabs>
        </CardContent>
      </Card>
    </motion.div>
  )
}

export default BatchProcessor