import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Button } from './ui/button'
import { Textarea } from './ui/textarea'
import { Badge } from './ui/badge'
import { Label } from './ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs'
import { Progress } from './ui/progress'
import { 
  X, 
  Copy, 
  Eye, 
  Brain, 
  Languages, 
  Sparkles, 
  Download,
  Globe,
  FileText,
  Loader2,
  ChevronDown,
  ChevronUp
} from 'lucide-react'
import toast from 'react-hot-toast'
import { api } from '../lib/api'

const EnhancedOCRModal = ({ isOpen, onClose, result, fileName, fileId, onResultUpdate }) => {
  const [activeTab, setActiveTab] = useState('results')
  const [translatedText, setTranslatedText] = useState('')
  const [targetLanguage, setTargetLanguage] = useState('')
  const [isTranslating, setIsTranslating] = useState(false)
  const [autoDetectedLanguage, setAutoDetectedLanguage] = useState('')
  const [translationProgress, setTranslationProgress] = useState(0)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(true)

  const languages = [
    { code: 'es', name: 'Spanish' },
    { code: 'fr', name: 'French' },
    { code: 'de', name: 'German' },
    { code: 'it', name: 'Italian' },
    { code: 'pt', name: 'Portuguese' },
    { code: 'ru', name: 'Russian' },
    { code: 'zh', name: 'Chinese' },
    { code: 'ja', name: 'Japanese' },
    { code: 'ko', name: 'Korean' },
    { code: 'ar', name: 'Arabic' },
    { code: 'hi', name: 'Hindi' },
    { code: 'te', name: 'Telugu' },
    { code: 'ta', name: 'Tamil' },
    { code: 'bn', name: 'Bengali' },
    { code: 'th', name: 'Thai' },
    { code: 'vi', name: 'Vietnamese' },
    { code: 'nl', name: 'Dutch' },
    { code: 'pl', name: 'Polish' },
    { code: 'sv', name: 'Swedish' },
    { code: 'no', name: 'Norwegian' },
    { code: 'da', name: 'Danish' },
    { code: 'fi', name: 'Finnish' },
    { code: 'tr', name: 'Turkish' },
    { code: 'he', name: 'Hebrew' },
    { code: 'cs', name: 'Czech' },
    { code: 'hu', name: 'Hungarian' },
    { code: 'ro', name: 'Romanian' },
    { code: 'uk', name: 'Ukrainian' },
    { code: 'bg', name: 'Bulgarian' },
    { code: 'hr', name: 'Croatian' },
    { code: 'sk', name: 'Slovak' },
    { code: 'sl', name: 'Slovenian' },
    { code: 'et', name: 'Estonian' },
    { code: 'lv', name: 'Latvian' },
    { code: 'lt', name: 'Lithuanian' }
  ]

  useEffect(() => {
    if (result && result.detectedLanguage) {
      setAutoDetectedLanguage(result.detectedLanguage)
    }
  }, [result])

  if (!isOpen || !result) return null

  const handleCopyText = (text = result.text) => {
    navigator.clipboard.writeText(text)
    toast.success('Text copied to clipboard!')
  }

  const handleTranslate = async () => {
    if (!targetLanguage) {
      toast.error('Please select a target language')
      return
    }

    if (!result.text) {
      toast.error('No text available to translate')
      return
    }

    setIsTranslating(true)
    setTranslationProgress(0)

    try {
      const progressInterval = setInterval(() => {
        setTranslationProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval)
            return 90
          }
          return prev + 15
        })
      }, 300)

      const targetLanguageName = languages.find(lang => lang.code === targetLanguage)?.name || targetLanguage

      const response = await api.requestWithRetry('/ai/translate-text', {
        method: 'POST',
        body: JSON.stringify({
          fileId: fileId,
          text: result.text,
          targetLanguage: targetLanguageName
        }),
        timeout: 60000
      }, 2)

      clearInterval(progressInterval)
      setTranslationProgress(100)

      if (response && response.translatedText) {
        setTranslatedText(response.translatedText)
        setActiveTab('translated')
        toast.success(`Text translated to ${targetLanguageName}!`)
        setSidebarCollapsed(true)
      } else {
        throw new Error('No translated text received')
      }
    } catch (error) {
      console.error('Translation error:', error)
      toast.error(error.response?.data?.error || 'Failed to translate text')
    } finally {
      setIsTranslating(false)
      setTranslationProgress(0)
    }
  }

  const downloadText = (text, filename) => {
    const blob = new Blob([text], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    toast.success('Text file downloaded!')
  }

  return (
    <div 
      className="fixed inset-0 bg-black/95 backdrop-blur-md z-50 flex items-center justify-center p-0 sm:p-4" 
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="w-full h-[75vh] sm:h-auto sm:max-h-[90vh] sm:max-w-6xl flex flex-col bg-background sm:rounded-xl overflow-hidden shadow-2xl border-0 sm:border border-border">
        {/* Header - Mobile Optimized */}
        <div className="flex-shrink-0 bg-gradient-to-r from-blue-600 to-purple-600 px-3 py-2 sm:px-4 sm:py-2.5">
          <div className="flex items-center justify-between gap-2 sm:gap-2">
            <div className="flex items-center gap-2 sm:gap-2 min-w-0 flex-1">
              <div className="p-1.5 sm:p-1.5 bg-white/10 rounded">
                <Brain className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
              </div>
              <div className="min-w-0 flex-1">
                <h2 className="text-white font-bold text-sm sm:text-base flex items-center gap-1">
                  <span className="truncate">OCR Results</span>
                  <Sparkles className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-yellow-300 animate-pulse flex-shrink-0" />
                </h2>
                <p className="text-white/80 text-xs sm:text-xs truncate" title={fileName}>{fileName}</p>
              </div>
            </div>
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={onClose} 
              className="h-8 w-8 sm:h-8 sm:w-8 flex-shrink-0 rounded hover:bg-white/20 text-white"
            >
              <X className="h-4 w-4 sm:h-4 sm:w-4" />
            </Button>
          </div>
        </div>
        
        {/* Content Area */}
        <div className="flex-1 overflow-hidden flex flex-col">
          {/* Mobile: Collapsible Sidebar - Mobile Optimized */}
          <div className="lg:hidden border-b border-border">
            <button
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              className="w-full px-4 py-3 flex items-center justify-between bg-surface hover:bg-elevated transition-colors"
            >
              <span className="text-sm font-semibold text-foreground flex items-center gap-2">
                <Eye className="h-4 w-4 text-cyan-400" />
                Translate 
              </span>
              {sidebarCollapsed ? (
                <ChevronDown className="h-4 w-4 text-muted-foreground" />
              ) : (
                <ChevronUp className="h-4 w-4 text-muted-foreground" />
              )}
            </button>
            
            {!sidebarCollapsed && (
              <div className="max-h-60 overflow-y-auto bg-surface border-t border-border">
                <div className="p-3 space-y-3">


                  {/* AI Translation */}
                  <div className="space-y-3 p-4 bg-gradient-to-br from-emerald-500/10 to-teal-500/10 rounded-lg border border-emerald-500/20">
                    <h3 className="text-xs font-semibold flex items-center gap-2 text-foreground uppercase tracking-wide">
                      <Globe className="h-4 w-4 text-emerald-400" />
                      AI Translation
                    </h3>
                    
                    <div className="space-y-3">
                      <div>
                        <Label className="text-xs text-muted-foreground mb-2 block">Target Language</Label>
                        <Select value={targetLanguage} onValueChange={setTargetLanguage}>
                          <SelectTrigger className="h-10 text-sm">
                            <SelectValue placeholder="Select language..." />
                          </SelectTrigger>
                          <SelectContent className="max-h-48">
                            {languages.map((lang) => (
                              <SelectItem key={lang.code} value={lang.code} className="text-sm py-2">
                                {lang.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <Button 
                        onClick={handleTranslate}
                        disabled={isTranslating || !targetLanguage || !result.text}
                        className="w-full h-11 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-semibold text-sm"
                      >
                        {isTranslating ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Translating...
                          </>
                        ) : (
                          <>
                            <Languages className="h-4 w-4 mr-2" />
                            Translate Now
                          </>
                        )}
                      </Button>

                      {isTranslating && (
                        <div className="space-y-2">
                          <Progress value={translationProgress} className="h-2" />
                          <p className="text-xs text-center text-muted-foreground">
                            {translationProgress}% Complete
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Desktop & Tablet Layout */}
          <div className="flex-1 flex overflow-hidden">
            {/* Desktop Sidebar */}
            <div className="hidden lg:block w-64 xl:w-72 border-r border-border bg-surface overflow-y-auto">
              <div className="p-4 space-y-4">
                {/* OCR Information */}
                <div className="space-y-2">
                  <h3 className="text-xs font-semibold flex items-center gap-2 text-foreground">
                    <Eye className="h-3.5 w-3.5 text-cyan-400" />
                    OCR Information
                  </h3>
                  <div className="space-y-1.5">
                    <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-blue-400 font-medium">Accuracy</span>
                        <Badge className="bg-blue-600 text-white text-xs px-1.5 py-0.5">
                          <Eye className="h-2.5 w-2.5 mr-0.5" />
                          {Math.round(result.confidence * 100)}%
                        </Badge>
                      </div>
                    </div>
                    <div className="bg-gray-500/10 border border-gray-500/20 rounded-lg p-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-gray-400 font-medium">Pages</span>
                        <Badge className="bg-gray-600 text-white text-xs px-1.5 py-0.5">
                          {result.pageCount}
                        </Badge>
                      </div>
                    </div>
                    {autoDetectedLanguage && (
                      <div className="bg-purple-500/10 border border-purple-500/20 rounded-lg p-2">
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-purple-400 font-medium">Language</span>
                          <Badge className="bg-purple-600 text-white text-xs px-1.5 py-0.5">
                            <Languages className="h-2.5 w-2.5 mr-0.5" />
                            {autoDetectedLanguage}
                          </Badge>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* AI Translation */}
                <div className="space-y-2 p-3 bg-gradient-to-br from-emerald-500/10 to-teal-500/10 rounded-lg border border-emerald-500/20">
                  <h3 className="text-xs font-semibold flex items-center gap-2 text-foreground">
                    <Globe className="h-3.5 w-3.5 text-emerald-400" />
                    AI Translation
                  </h3>
                  
                  <div className="space-y-2">
                    <div>
                      <Label className="text-xs text-muted-foreground mb-2 block">Target Language</Label>
                      <Select value={targetLanguage} onValueChange={setTargetLanguage}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select language..." />
                        </SelectTrigger>
                        <SelectContent className="max-h-60">
                          {languages.map((lang) => (
                            <SelectItem key={lang.code} value={lang.code}>
                              {lang.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <Button 
                      onClick={handleTranslate}
                      disabled={isTranslating || !targetLanguage || !result.text}
                      className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-semibold"
                    >
                      {isTranslating ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Translating...
                        </>
                      ) : (
                        <>
                          <Languages className="h-4 w-4 mr-2" />
                          Translate Now
                        </>
                      )}
                    </Button>

                    {isTranslating && (
                      <div className="space-y-2">
                        <Progress value={translationProgress} className="h-2" />
                        <p className="text-xs text-center text-muted-foreground">
                          {translationProgress}% Complete
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 flex flex-col overflow-hidden bg-background">
              <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
                <TabsList className="grid w-full grid-cols-2 m-2 sm:m-2 shrink-0 bg-surface h-10 sm:h-9">
                  <TabsTrigger 
                    value="results" 
                    className="flex items-center justify-center gap-1.5 sm:gap-1.5 text-sm sm:text-sm data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-600 data-[state=active]:to-purple-600 data-[state=active]:text-white"
                  >
                    <FileText className="h-4 w-4 sm:h-3.5 sm:w-3.5" />
                    <span>Extracted Text</span>
                  </TabsTrigger>
                  <TabsTrigger 
                    value="translated" 
                    className="flex items-center justify-center gap-1.5 sm:gap-1.5 text-sm sm:text-sm data-[state=active]:bg-gradient-to-r data-[state=active]:from-emerald-600 data-[state=active]:to-teal-600 data-[state=active]:text-white" 
                    disabled={!translatedText}
                  >
                    <Globe className="h-4 w-4 sm:h-3.5 sm:w-3.5" />
                    <span>Translated</span>
                  </TabsTrigger>
                </TabsList>

                <div className="flex-1 overflow-hidden">
                  <TabsContent value="results" className="h-full m-0 p-0 data-[state=active]:flex data-[state=active]:flex-col">
                    <div className="flex flex-col h-full p-2 sm:p-4">
                      {/* Header */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-2 mb-2 sm:mb-3 pb-2 sm:pb-2 border-b border-border">
                        <Label className="text-sm sm:text-xs font-semibold flex items-center gap-2 sm:gap-1.5 text-foreground">
                          <FileText className="h-4 w-4 sm:h-3.5 sm:w-3.5 text-blue-400" />
                          Extracted Text
                        </Label>
                        <div className="flex gap-2 sm:gap-2">
                          <Button 
                            onClick={() => handleCopyText(result.text)} 
                            size="sm" 
                            variant="outline"
                            disabled={!result.text}
                            className="flex-1 sm:flex-none h-9 sm:h-9 text-sm sm:text-sm px-4 sm:px-3"
                          >
                            <Copy className="h-4 w-4 sm:h-4 sm:w-4 mr-2 sm:mr-2" />
                            <span>Copy</span>
                          </Button>
                          <Button 
                            onClick={() => downloadText(result.text, `${fileName}_original.txt`)} 
                            size="sm" 
                            variant="outline"
                            disabled={!result.text}
                            className="flex-1 sm:flex-none h-9 sm:h-9 text-sm sm:text-sm px-4 sm:px-3"
                          >
                            <Download className="h-4 w-4 sm:h-4 sm:w-4 mr-2 sm:mr-2" />
                            <span>Download</span>
                          </Button>
                        </div>
                      </div>
                      
                      {/* Text Area */}
                      <Textarea
                        value={result.text}
                        readOnly
                        className="flex-1 min-h-[200px] sm:min-h-[260px] text-sm sm:text-sm resize-none font-mono leading-relaxed sm:leading-relaxed bg-surface border-border"
                        placeholder="No text extracted..."
                      />
                      
                      {/* Stats */}
                      {result.text && (
                        <div className="flex items-center justify-center gap-4 sm:gap-4 mt-3 sm:mt-3 pt-3 sm:pt-3 border-t border-border text-xs sm:text-xs text-muted-foreground">
                          <span>{result.text.length.toLocaleString()} chars</span>
                          <span>•</span>
                          <span>{result.text.split(/\s+/).filter(w => w.length > 0).length.toLocaleString()} words</span>
                        </div>
                      )}
                    </div>
                  </TabsContent>

                  <TabsContent value="translated" className="h-full m-0 p-0 data-[state=active]:flex data-[state=active]:flex-col">
                    <div className="flex flex-col h-full p-2 sm:p-6">
                      {/* Header */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-3 mb-2 sm:mb-4 pb-2 sm:pb-3 border-b border-border">
                        <Label className="text-sm sm:text-sm font-semibold flex items-center gap-2 sm:gap-2 text-foreground">
                          <Globe className="h-4 w-4 sm:h-4 sm:w-4 text-emerald-400" />
                          Translated Text
                        </Label>
                        <div className="flex gap-2 sm:gap-2">
                          <Button 
                            onClick={() => handleCopyText(translatedText)} 
                            size="sm" 
                            variant="outline"
                            disabled={!translatedText}
                            className="flex-1 sm:flex-none h-9 sm:h-9 text-sm sm:text-sm px-4 sm:px-3"
                          >
                            <Copy className="h-4 w-4 sm:h-4 sm:w-4 mr-2 sm:mr-2" />
                            <span>Copy</span>
                          </Button>
                          <Button 
                            onClick={() => downloadText(translatedText, `${fileName}_translated.txt`)} 
                            size="sm" 
                            variant="outline"
                            disabled={!translatedText}
                            className="flex-1 sm:flex-none h-9 sm:h-9 text-sm sm:text-sm px-4 sm:px-3"
                          >
                            <Download className="h-4 w-4 sm:h-4 sm:w-4 mr-2 sm:mr-2" />
                            <span>Download</span>
                          </Button>
                        </div>
                      </div>
                      
                      {/* Text Area */}
                      <Textarea
                        value={translatedText}
                        readOnly
                        className="flex-1 min-h-[200px] sm:min-h-[200px] text-sm sm:text-sm resize-none font-mono leading-relaxed sm:leading-relaxed bg-surface border-border"
                        placeholder="Select a language and click Translate Now..."
                      />
                      
                      {/* Stats */}
                      {translatedText && (
                        <div className="flex items-center justify-center gap-4 sm:gap-4 mt-3 sm:mt-3 pt-3 sm:pt-3 border-t border-border text-xs sm:text-xs text-muted-foreground">
                          <span>{translatedText.length.toLocaleString()} chars</span>
                          <span>•</span>
                          <span>{translatedText.split(/\s+/).filter(w => w.length > 0).length.toLocaleString()} words</span>
                        </div>
                      )}
                    </div>
                  </TabsContent>
                </div>
              </Tabs>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default EnhancedOCRModal
