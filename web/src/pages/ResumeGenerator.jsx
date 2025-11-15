import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useNavigate } from 'react-router-dom'
import { api } from '../lib/api'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { Label } from '../components/ui/label'
import { Textarea } from '../components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card'
import { Switch } from '../components/ui/switch'
import ProcessingModal from '../components/ProcessingModal'
import ResumePreview from '../components/ResumePreview'
import toast from 'react-hot-toast'
import { FileText, Sparkles, Download, Plus, Trash2, Wand2, Target, Briefcase, GraduationCap, Award, ChevronRight, ChevronLeft, Check, Eye } from 'lucide-react'

const ResumeGenerator = () => {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [currentStep, setCurrentStep] = useState(1)
  const [isGenerating, setIsGenerating] = useState(false)
  const [progress, setProgress] = useState(0)
  const [progressStage, setProgressStage] = useState('')
  const [generatedResume, setGeneratedResume] = useState(null)
  const [templates, setTemplates] = useState([])
  const [industries, setIndustries] = useState([])
  const [experienceLevels, setExperienceLevels] = useState([])

  const [formData, setFormData] = useState({
    name: '', email: '', phone: '', address: '', linkedin: '', github: '', portfolio: '',
    summary: '', targetRole: '', industry: '', experienceLevel: 'mid',
    experience: [], education: [], skills: { technical: '', soft: '', tools: '' },
    projects: [], certifications: [], languages: []
  })

  const [options, setOptions] = useState({
    template: 'professional', tone: 'professional', includeSummary: true,
    includeSkills: true, includeProjects: false, includeCertifications: false, includeLanguages: false
  })

  const steps = [
    { number: 1, title: 'Contact Info', icon: FileText },
    { number: 2, title: 'Work Experience', icon: Briefcase },
    { number: 3, title: 'Education', icon: GraduationCap },
    { number: 4, title: 'Skills', icon: Award },
    { number: 5, title: 'Options', icon: Target }
  ]

  useEffect(() => {
    if (user) {
      loadMetadata()
    }
  }, [user])

  const loadMetadata = async () => {
    try {
      const [templatesRes, industriesRes, levelsRes] = await Promise.all([
        api.get('/v1/resumes/templates'),
        api.get('/v1/resumes/industries'),
        api.get('/v1/resumes/experience-levels')
      ])
      setTemplates(templatesRes.templates || [])
      setIndustries(industriesRes.industries || [])
      setExperienceLevels(levelsRes.levels || [])
    } catch (error) {
      console.error('Failed to load metadata:', error)
      // Set default values if API fails
      setIndustries(['Technology', 'Healthcare', 'Finance', 'Education', 'Marketing', 'Sales', 'Engineering', 'Design', 'Other'])
      setExperienceLevels([
        { value: 'entry', label: 'Entry Level (0-2 years)' },
        { value: 'mid', label: 'Mid Level (3-5 years)' },
        { value: 'senior', label: 'Senior Level (6-10 years)' },
        { value: 'lead', label: 'Lead/Principal (10+ years)' }
      ])
    }
  }

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const validateStep = (step) => {
    switch(step) {
      case 1:
        if (!formData.name?.trim()) return 'Name is required'
        if (!formData.email?.trim()) return 'Email is required'
        if (!formData.phone?.trim()) return 'Phone is required'
        if (!formData.address?.trim()) return 'Address is required'
        if (!formData.targetRole?.trim()) return 'Target role is required'
        if (!formData.industry?.trim()) return 'Industry is required'
        return null
      case 2:
        if (formData.experience.length === 0) return 'At least one work experience is required'
        for (let exp of formData.experience) {
          if (!exp.title?.trim()) return 'Job title is required for all experiences'
          if (!exp.company?.trim()) return 'Company name is required for all experiences'
          if (!exp.startDate?.trim()) return 'Start date is required for all experiences'
          if (!exp.endDate?.trim()) return 'End date is required for all experiences'
        }
        return null
      case 3:
        if (formData.education.length === 0) return 'At least one education entry is required'
        for (let edu of formData.education) {
          if (!edu.degree?.trim()) return 'Degree is required for all education entries'
          if (!edu.institution?.trim()) return 'Institution is required for all education entries'
          if (!edu.graduationDate?.trim()) return 'Graduation year is required for all education entries'
        }
        return null
      case 4:
        const techSkills = formData.skills.technical.split(',').map(s => s.trim()).filter(Boolean)
        const toolSkills = formData.skills.tools.split(',').map(s => s.trim()).filter(Boolean)
        if (techSkills.length === 0) {
          return 'At least one technical skill is required'
        }
        if (toolSkills.length === 0) {
          return 'At least one tool/technology is required'
        }
        return null
      default:
        return null
    }
  }

  const handleNext = () => {
    const error = validateStep(currentStep)
    if (error) {
      toast.error(error)
      return
    }
    if (currentStep < 5) {
      setCurrentStep(currentStep + 1)
    }
  }

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
    }
  }

  const handleOptionChange = (field, value) => {
    setOptions(prev => ({ ...prev, [field]: value }))
  }

  const addExperience = () => {
    setFormData(prev => ({
      ...prev,
      experience: [...prev.experience, { title: '', company: '', location: '', startDate: '', endDate: '', achievements: [] }]
    }))
  }

  const updateExperience = (index, field, value) => {
    setFormData(prev => ({
      ...prev,
      experience: prev.experience.map((exp, i) => i === index ? { ...exp, [field]: value } : exp)
    }))
  }

  const removeExperience = (index) => {
    setFormData(prev => ({ ...prev, experience: prev.experience.filter((_, i) => i !== index) }))
  }

  const addEducation = () => {
    setFormData(prev => ({
      ...prev,
      education: [...prev.education, { degree: '', institution: '', location: '', graduationDate: '', gpa: '' }]
    }))
  }

  const updateEducation = (index, field, value) => {
    setFormData(prev => ({
      ...prev,
      education: prev.education.map((edu, i) => i === index ? { ...edu, [field]: value } : edu)
    }))
  }

  const removeEducation = (index) => {
    setFormData(prev => ({ ...prev, education: prev.education.filter((_, i) => i !== index) }))
  }

  const handleGenerate = async () => {
    // Validate all steps before generating
    for (let step = 1; step <= 4; step++) {
      const error = validateStep(step)
      if (error) {
        toast.error(error)
        setCurrentStep(step)
        return
      }
    }

    setIsGenerating(true)
    setProgress(0)
    setProgressStage('Preparing your data...')

    try {
      setProgress(5)
      toast.loading('Preparing your data...', { id: 'generate' })

      // Prepare userData with proper structure
      const technicalSkills = formData.skills.technical.split(',').map(s => s.trim()).filter(Boolean)
      const toolsSkills = formData.skills.tools.split(',').map(s => s.trim()).filter(Boolean)
      const softSkills = formData.skills.soft.split(',').map(s => s.trim()).filter(Boolean)
      
      const userData = {
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        address: formData.address,
        location: formData.address,
        linkedin: formData.linkedin,
        github: formData.github,
        portfolio: formData.portfolio,
        summary: formData.summary,
        targetRole: formData.targetRole,
        industry: formData.industry,
        experienceLevel: formData.experienceLevel,
        experience: formData.experience,
        education: formData.education,
        technicalSkills: technicalSkills,
        tools: toolsSkills,
        softSkills: softSkills,
        projects: formData.projects,
        certifications: formData.certifications,
        languages: formData.languages
      }

      setProgress(10)
      setProgressStage('Analyzing your profile and experience...')
      toast.loading('AI is analyzing your profile...', { id: 'generate' })
      
      // Simulate realistic progress updates with stages
      const stages = [
        { progress: 20, stage: 'Crafting professional summary...', delay: 3000 },
        { progress: 35, stage: 'Enhancing work experience with metrics...', delay: 4000 },
        { progress: 50, stage: 'Optimizing achievements and impact statements...', delay: 4000 },
        { progress: 65, stage: 'Formatting education and skills...', delay: 3000 },
        { progress: 75, stage: 'Applying ATS optimization...', delay: 2000 }
      ]
      
      let currentStageIndex = 0
      const progressInterval = setInterval(() => {
        if (currentStageIndex < stages.length) {
          const stage = stages[currentStageIndex]
          setProgress(stage.progress)
          setProgressStage(stage.stage)
          toast.loading(stage.stage, { id: 'generate' })
          currentStageIndex++
        }
      }, 3500)

      const response = await api.request('/v1/resumes/generate', {
        method: 'POST',
        body: JSON.stringify({ userData, options }),
        timeout: 180000 // 3 minutes timeout
      })

      clearInterval(progressInterval)
      setProgress(90)
      setProgressStage('Finalizing your professional resume...')
      toast.loading('Finalizing your resume...', { id: 'generate' })
      
      setGeneratedResume({
        ...response.generated,
        metadata: { ...response.generated.metadata, resumeId: response.resume.id }
      })
      
      setProgress(100)
      setProgressStage('Complete!')
      toast.dismiss('generate')
      toast.success('Resume generated successfully! 🎉')

    } catch (error) {
      console.error('Generation error:', error)
      toast.dismiss('generate')
      toast.error(error.message || 'Failed to generate resume')
    } finally {
      setTimeout(() => setIsGenerating(false), 500)
    }
  }

  const handleDownload = async (format = 'pdf') => {
    if (!generatedResume || !generatedResume.metadata?.resumeId) {
      toast.error('No resume to download')
      return
    }

    try {
      toast.loading('Preparing download...', { id: 'download' })
      
      const blob = await api.downloadResume(generatedResume.metadata.resumeId, format, 'generated')
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `resume.${format}`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
      
      toast.dismiss('download')
      toast.success('Resume downloaded!')
    } catch (error) {
      toast.dismiss('download')
      toast.error('Download failed: ' + error.message)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-white via-slate-50 to-white relative overflow-hidden py-3 sm:py-6 lg:py-8">
      {/* Subtle Background Effects */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -left-40 w-[600px] h-[600px] bg-gradient-to-br from-indigo-100/30 to-purple-100/30 rounded-full blur-3xl"></div>
        <div className="absolute top-40 -right-40 w-[500px] h-[500px] bg-gradient-to-br from-blue-100/30 to-cyan-100/30 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-40 left-1/4 w-[700px] h-[700px] bg-gradient-to-br from-purple-100/20 to-pink-100/20 rounded-full blur-3xl"></div>
      </div>
      <div className="max-w-7xl mx-auto px-2 sm:px-4 lg:px-8 relative z-10">
        {/* Header */}
        <div className="text-center mb-4 sm:mb-6 lg:mb-8">
          <div className="flex items-center justify-center gap-2 mb-2 sm:mb-3 lg:mb-4">
            <div className="p-1.5 sm:p-2 lg:p-3 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-lg sm:rounded-xl lg:rounded-2xl">
              <Wand2 className="h-5 w-5 sm:h-6 sm:w-6 lg:h-8 lg:w-8 text-white" />
            </div>
            <h1 className="text-xl sm:text-2xl lg:text-4xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
              AI Resume Generator
            </h1>
          </div>
          <p className="text-gray-600 text-xs sm:text-sm lg:text-base px-3">
            Create professional, ATS-optimized resumes in minutes
          </p>
        </div>

        {/* Step Progress */}
        <div className="mb-4 sm:mb-6 lg:mb-8 overflow-x-auto">
          <div className="flex items-center justify-between max-w-4xl mx-auto min-w-[600px] sm:min-w-0 px-2">
            {steps.map((step, index) => {
              const StepIcon = step.icon
              const isCompleted = currentStep > step.number
              const isCurrent = currentStep === step.number
              return (
                <div key={step.number} className="flex items-center flex-1">
                  <div className="flex flex-col items-center">
                    <div className={`w-8 h-8 sm:w-10 sm:h-10 lg:w-12 lg:h-12 rounded-full flex items-center justify-center border-2 transition-all ${
                      isCompleted ? 'bg-green-600 border-green-600' :
                      isCurrent ? 'bg-purple-600 border-purple-600' :
                      'bg-gray-800 border-gray-700'
                    }`}>
                      {isCompleted ? <Check className="h-4 w-4 sm:h-5 sm:w-5 lg:h-6 lg:w-6 text-white" /> : <StepIcon className="h-3 w-3 sm:h-4 sm:w-4 lg:h-5 lg:w-5 text-white" />}
                    </div>
                    <span className={`text-[10px] sm:text-xs lg:text-sm mt-1 sm:mt-2 text-center whitespace-nowrap ${
                      isCurrent ? 'text-purple-400 font-semibold' : 'text-gray-600'
                    }`}>{step.title}</span>
                  </div>
                  {index < steps.length - 1 && (
                    <div className={`flex-1 h-0.5 mx-1 sm:mx-2 transition-all ${
                      isCompleted ? 'bg-green-600' : 'bg-gray-300'
                    }`} />
                  )}
                </div>
              )
            })}
          </div>
        </div>

        {/* Resume Preview */}
        {generatedResume && (
          <div className="mb-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold flex items-center gap-2">
                <Eye className="h-5 w-5" />
                Resume Preview
              </h2>
            </div>
            <ResumePreview resume={generatedResume} />
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 sm:gap-4 lg:gap-6">
          {/* Form Section */}
          <div className="lg:col-span-2">
            <Card className="bg-card border-grey-800">
              <CardHeader className="pb-2 sm:pb-4 lg:pb-6 px-3 sm:px-4 lg:px-6 pt-3 sm:pt-4 lg:pt-6">
                <CardTitle className="flex items-center gap-1.5 sm:gap-2 text-base sm:text-lg lg:text-xl">
                  <FileText className="h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0" />
                  <span className="truncate">Step {currentStep}: {steps[currentStep - 1].title}</span>
                </CardTitle>
                <CardDescription className="text-[10px] sm:text-xs lg:text-sm">
                  Fill in your details to generate a professional resume
                  <span className="block mt-0.5 sm:mt-1 text-purple-400">* indicates required field</span>
                </CardDescription>
              </CardHeader>
              <CardContent className="px-3 sm:px-4 lg:px-6 pb-3 sm:pb-4 lg:pb-6">
                {/* Step 1: Contact Info */}
                {currentStep === 1 && (
                  <div className="space-y-2 sm:space-y-3 lg:space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3 lg:gap-4">
                      <div>
                        <Label htmlFor="name" className="text-xs sm:text-sm mb-1 block">Full Name *</Label>
                        <Input id="name" value={formData.name} onChange={(e) => handleInputChange('name', e.target.value)} placeholder="John Doe" className="bg-grey-900 border-grey-800 h-9 sm:h-10 text-sm" />
                      </div>
                      <div>
                        <Label htmlFor="email" className="text-xs sm:text-sm mb-1 block">Email *</Label>
                        <Input id="email" type="email" value={formData.email} onChange={(e) => handleInputChange('email', e.target.value)} placeholder="john@example.com" className="bg-grey-900 border-grey-800 h-9 sm:h-10 text-sm" />
                      </div>
                      <div>
                        <Label htmlFor="phone" className="text-xs sm:text-sm mb-1 block">Phone *</Label>
                        <Input id="phone" value={formData.phone} onChange={(e) => handleInputChange('phone', e.target.value)} placeholder="+1 234 567 8900" className="bg-grey-900 border-grey-800 h-9 sm:h-10 text-sm" />
                      </div>
                      <div className="sm:col-span-2">
                        <Label htmlFor="address" className="text-xs sm:text-sm mb-1 block">Full Address *</Label>
                        <Textarea id="address" value={formData.address} onChange={(e) => handleInputChange('address', e.target.value)} placeholder="123 Main Street, Apt 4B, New York, NY 10001" rows={2} className="bg-grey-900 border-grey-800 text-sm" />
                      </div>
                      <div>
                        <Label htmlFor="linkedin" className="text-xs sm:text-sm mb-1 block">LinkedIn</Label>
                        <Input id="linkedin" value={formData.linkedin} onChange={(e) => handleInputChange('linkedin', e.target.value)} placeholder="linkedin.com/in/johndoe" className="bg-grey-900 border-grey-800 h-9 sm:h-10 text-sm" />
                      </div>
                      <div>
                        <Label htmlFor="github" className="text-xs sm:text-sm mb-1 block">GitHub</Label>
                        <Input id="github" value={formData.github} onChange={(e) => handleInputChange('github', e.target.value)} placeholder="github.com/johndoe" className="bg-grey-900 border-grey-800 h-9 sm:h-10 text-sm" />
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="summary" className="text-xs sm:text-sm mb-1 block">Professional Summary</Label>
                      <Textarea id="summary" value={formData.summary} onChange={(e) => handleInputChange('summary', e.target.value)} placeholder="Brief professional summary..." rows={3} className="bg-grey-900 border-grey-800 text-sm" />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-3 lg:gap-4">
                      <div>
                        <Label htmlFor="targetRole" className="text-xs sm:text-sm mb-1 block">Target Role *</Label>
                        <Input id="targetRole" value={formData.targetRole} onChange={(e) => handleInputChange('targetRole', e.target.value)} placeholder="Software Engineer" className="bg-grey-900 border-grey-800 h-9 sm:h-10 text-sm" />
                      </div>
                      <div>
                        <Label className="text-xs sm:text-sm mb-1 block">Industry *</Label>
                        <Select value={formData.industry} onValueChange={(val) => handleInputChange('industry', val)}>
                          <SelectTrigger className="bg-grey-900 border-grey-800 h-9 sm:h-10 text-sm">
                            <SelectValue placeholder="Select industry" />
                          </SelectTrigger>
                          <SelectContent className="bg-grey-500 border-grey-500 text-white">
                            {industries.map(ind => (
                              <SelectItem key={ind} value={ind} className="focus:bg-grey-500 text-white">{ind}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label className="text-xs sm:text-sm mb-1 block">Experience Level</Label>
                        <Select value={formData.experienceLevel} onValueChange={(val) => handleInputChange('experienceLevel', val)}>
                          <SelectTrigger className="bg-grey-900 border-grey-800 h-9 sm:h-10 text-sm">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="bg-grey-900 border-grey-800 text-white">
                            {experienceLevels.map(level => (
                              <SelectItem key={level.value} value={level.value} className="focus:bg-grey-800 text-white">{level.label}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>
                )}

                {/* Step 2: Work Experience */}
                {currentStep === 2 && (
                  <div className="space-y-2 sm:space-y-3 lg:space-y-4">
                    <div className="flex justify-between items-center gap-2">
                      <h3 className="text-sm sm:text-base lg:text-lg font-semibold">Work Experience *</h3>
                      <Button onClick={addExperience} size="sm" variant="outline" className="text-xs h-8 sm:h-9 px-2 sm:px-3">
                        <Plus className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                        <span className="hidden xs:inline">Add</span>
                      </Button>
                    </div>
                    {formData.experience.map((exp, index) => (
                      <Card key={index} className="bg-grey-900 border-grey-800">
                        <CardContent className="pt-3 sm:pt-4 lg:pt-6 px-3 sm:px-4 lg:px-6 pb-3 sm:pb-4 lg:pb-6 space-y-2">
                          <div className="flex justify-between items-start gap-2">
                            <h4 className="font-medium text-xs sm:text-sm lg:text-base">Experience {index + 1}</h4>
                            <Button onClick={() => removeExperience(index)} size="sm" variant="ghost" className="h-7 w-7 sm:h-8 sm:w-8 p-0">
                              <Trash2 className="h-3 w-3 sm:h-4 sm:w-4" />
                            </Button>
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            <Input placeholder="Job Title *" value={exp.title} onChange={(e) => updateExperience(index, 'title', e.target.value)} className="bg-grey-800 border-grey-700 text-xs sm:text-sm h-8 sm:h-9" />
                            <Input placeholder="Company *" value={exp.company} onChange={(e) => updateExperience(index, 'company', e.target.value)} className="bg-grey-800 border-grey-700 text-xs sm:text-sm h-8 sm:h-9" />
                            <Input placeholder="Location" value={exp.location} onChange={(e) => updateExperience(index, 'location', e.target.value)} className="bg-grey-800 border-grey-700 text-xs sm:text-sm h-8 sm:h-9" />
                            <Input placeholder="Start Date (MM/YYYY) *" value={exp.startDate} onChange={(e) => updateExperience(index, 'startDate', e.target.value)} className="bg-grey-800 border-grey-700 text-xs sm:text-sm h-8 sm:h-9" />
                            <Input placeholder="End Date (MM/YYYY or Present) *" value={exp.endDate} onChange={(e) => updateExperience(index, 'endDate', e.target.value)} className="bg-grey-800 border-grey-700 text-xs sm:text-sm h-8 sm:h-9" />
                          </div>
                          <Textarea placeholder="Key achievements (one per line) " value={exp.achievements.join('\n')} onChange={(e) => updateExperience(index, 'achievements', e.target.value.split('\n'))} rows={2} className="bg-grey-800 border-grey-700 text-xs sm:text-sm" />
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}

                {/* Step 3: Education */}
                {currentStep === 3 && (
                  <div className="space-y-2 sm:space-y-3 lg:space-y-4">
                    <div className="flex justify-between items-center gap-2">
                      <h3 className="text-sm sm:text-base lg:text-lg font-semibold">Education</h3>
                      <Button onClick={addEducation} size="sm" variant="outline" className="text-xs h-8 sm:h-9 px-2 sm:px-3">
                        <Plus className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                        <span className="hidden xs:inline">Add</span>
                      </Button>
                    </div>
                    {formData.education.map((edu, index) => (
                      <Card key={index} className="bg-grey-900 border-grey-800">
                        <CardContent className="pt-3 sm:pt-4 lg:pt-6 px-3 sm:px-4 lg:px-6 pb-3 sm:pb-4 lg:pb-6 space-y-2">
                          <div className="flex justify-between items-start gap-2">
                            <h4 className="font-medium text-xs sm:text-sm lg:text-base">Education {index + 1}</h4>
                            <Button onClick={() => removeEducation(index)} size="sm" variant="ghost" className="h-7 w-7 sm:h-8 sm:w-8 p-0">
                              <Trash2 className="h-3 w-3 sm:h-4 sm:w-4" />
                            </Button>
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            <Input placeholder="Degree *" value={edu.degree} onChange={(e) => updateEducation(index, 'degree', e.target.value)} className="bg-grey-800 border-grey-700 text-xs sm:text-sm h-8 sm:h-9" />
                            <Input placeholder="Institution *" value={edu.institution} onChange={(e) => updateEducation(index, 'institution', e.target.value)} className="bg-grey-800 border-grey-700 text-xs sm:text-sm h-8 sm:h-9" />
                            <Input placeholder="Location" value={edu.location} onChange={(e) => updateEducation(index, 'location', e.target.value)} className="bg-grey-800 border-grey-700 text-xs sm:text-sm h-8 sm:h-9" />
                            <Input placeholder="Graduation Year (YYYY) *" value={edu.graduationDate} onChange={(e) => updateEducation(index, 'graduationDate', e.target.value)} className="bg-grey-800 border-grey-700 text-xs sm:text-sm h-8 sm:h-9" />
                            <Input placeholder="GPA (optional)" value={edu.gpa} onChange={(e) => updateEducation(index, 'gpa', e.target.value)} className="bg-grey-800 border-grey-700 text-xs sm:text-sm h-8 sm:h-9" />
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}

                {/* Step 4: Skills */}
                {currentStep === 4 && (
                  <div className="space-y-2 sm:space-y-3 lg:space-y-4">
                    <div>
                      <Label className="text-xs sm:text-sm mb-1 block">Technical Skills *</Label>
                      <Input placeholder="Enter skills separated by commas (e.g., Python, JavaScript, React)" value={formData.skills.technical} onChange={(e) => handleInputChange('skills', { ...formData.skills, technical: e.target.value })} className="bg-grey-900 border-grey-800 text-xs sm:text-sm h-8 sm:h-9" />
                      <p className="text-[10px] sm:text-xs text-grey-500 mt-0.5 sm:mt-1">At least one technical skill is required</p>
                    </div>
                    <div>
                      <Label className="text-xs sm:text-sm mb-1 block">Tools & Technologies *</Label>
                      <Input placeholder="Enter tools separated by commas (e.g., Git, Docker, AWS)" value={formData.skills.tools} onChange={(e) => handleInputChange('skills', { ...formData.skills, tools: e.target.value })} className="bg-grey-900 border-grey-800 text-xs sm:text-sm h-8 sm:h-9" />
                      <p className="text-[10px] sm:text-xs text-grey-500 mt-0.5 sm:mt-1">At least one tool/technology is required</p>
                    </div>
                    <div>
                      <Label className="text-xs sm:text-sm mb-1 block">Soft Skills</Label>
                      <Input placeholder="Enter skills separated by commas (e.g., Leadership, Communication)" value={formData.skills.soft} onChange={(e) => handleInputChange('skills', { ...formData.skills, soft: e.target.value })} className="bg-grey-900 border-grey-800 text-xs sm:text-sm h-8 sm:h-9" />
                    </div>
                  </div>
                )}

                {/* Step 5: Options */}
                {currentStep === 5 && (
                  <div className="space-y-3 sm:space-y-4 lg:space-y-5">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3 lg:gap-4">
                      <div>
                        <Label className="text-xs sm:text-sm font-medium mb-1 block">Tone</Label>
                        <Select value={options.tone} onValueChange={(val) => handleOptionChange('tone', val)}>
                          <SelectTrigger className="bg-grey-900 border-grey-800 h-9 sm:h-10 text-xs sm:text-sm">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="bg-grey-900 border-grey-800 text-white">
                            <SelectItem value="professional" className="focus:bg-grey-800 text-white text-xs sm:text-sm">Professional</SelectItem>
                            <SelectItem value="casual" className="focus:bg-grey-800 text-white text-xs sm:text-sm">Casual</SelectItem>
                            <SelectItem value="formal" className="focus:bg-grey-800 text-white text-xs sm:text-sm">Formal</SelectItem>
                            <SelectItem value="creative" className="focus:bg-grey-800 text-white text-xs sm:text-sm">Creative</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    
                    <div className="pt-1 sm:pt-2">
                      <h4 className="text-xs sm:text-sm lg:text-base font-semibold mb-2 sm:mb-3 lg:mb-4 text-grey-200">Include Sections</h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3 lg:gap-4">
                        <div className="flex items-center justify-between p-2 sm:p-2.5 lg:p-3.5 bg-grey-900 rounded-lg border border-grey-800 hover:border-grey-700 transition-colors">
                          <Label className="text-xs sm:text-sm cursor-pointer flex-1">Professional Summary</Label>
                          <Switch checked={options.includeSummary} onCheckedChange={(val) => handleOptionChange('includeSummary', val)} className="ml-2 scale-90 sm:scale-100" />
                        </div>
                        <div className="flex items-center justify-between p-2 sm:p-2.5 lg:p-3.5 bg-grey-900 rounded-lg border border-grey-800 hover:border-grey-700 transition-colors">
                          <Label className="text-xs sm:text-sm cursor-pointer flex-1">Skills Section</Label>
                          <Switch checked={options.includeSkills} onCheckedChange={(val) => handleOptionChange('includeSkills', val)} className="ml-2 scale-90 sm:scale-100" />
                        </div>
                        <div className="flex items-center justify-between p-2 sm:p-2.5 lg:p-3.5 bg-grey-900 rounded-lg border border-grey-800 hover:border-grey-700 transition-colors">
                          <Label className="text-xs sm:text-sm cursor-pointer flex-1">Projects</Label>
                          <Switch checked={options.includeProjects} onCheckedChange={(val) => handleOptionChange('includeProjects', val)} className="ml-2 scale-90 sm:scale-100" />
                        </div>
                        <div className="flex items-center justify-between p-2 sm:p-2.5 lg:p-3.5 bg-grey-900 rounded-lg border border-grey-800 hover:border-grey-700 transition-colors">
                          <Label className="text-xs sm:text-sm cursor-pointer flex-1">Certifications</Label>
                          <Switch checked={options.includeCertifications} onCheckedChange={(val) => handleOptionChange('includeCertifications', val)} className="ml-2 scale-90 sm:scale-100" />
                        </div>
                        <div className="flex items-center justify-between p-2 sm:p-2.5 lg:p-3.5 bg-grey-900 rounded-lg border border-grey-800 hover:border-grey-700 transition-colors sm:col-span-2">
                          <Label className="text-xs sm:text-sm cursor-pointer flex-1">Languages</Label>
                          <Switch checked={options.includeLanguages} onCheckedChange={(val) => handleOptionChange('includeLanguages', val)} className="ml-2 scale-90 sm:scale-100" />
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Navigation Buttons */}
                <div className="flex justify-between gap-2 mt-4 sm:mt-6 pt-4 sm:pt-6 border-t border-grey-800">
                  <Button
                    onClick={handlePrevious}
                    disabled={currentStep === 1}
                    variant="outline"
                    className="text-xs sm:text-sm h-9 sm:h-10 px-3 sm:px-4"
                  >
                    <ChevronLeft className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                    <span className="hidden xs:inline">Previous</span>
                    <span className="xs:hidden">Prev</span>
                  </Button>
                  {currentStep < 5 ? (
                    <Button
                      onClick={handleNext}
                      className="bg-purple-600 hover:bg-purple-700 text-xs sm:text-sm h-9 sm:h-10 px-3 sm:px-4"
                    >
                      <span className="hidden xs:inline">Next</span>
                      <span className="xs:hidden">Next</span>
                      <ChevronRight className="h-3 w-3 sm:h-4 sm:w-4 ml-1 sm:ml-2" />
                    </Button>
                  ) : (
                    <Button
                      onClick={handleGenerate}
                      disabled={isGenerating}
                      className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-xs sm:text-sm h-9 sm:h-10 px-3 sm:px-4"
                    >
                      <Sparkles className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                      <span className="hidden xs:inline">Generate Resume</span>
                      <span className="xs:hidden">Generate</span>
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Actions Section */}
          <div className="space-y-3 sm:space-y-4 lg:space-y-6">
            <Card className="bg-card border-grey-800">
              <CardHeader className="pb-2 sm:pb-4 lg:pb-6 px-3 sm:px-4 lg:px-6 pt-3 sm:pt-4 lg:pt-6">
                <CardTitle className="text-sm sm:text-base lg:text-lg">Generate Resume</CardTitle>
                <CardDescription className="text-[10px] sm:text-xs lg:text-sm">Create your professional resume with AI</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2 sm:space-y-3 lg:space-y-4 px-3 sm:px-4 lg:px-6 pb-3 sm:pb-4 lg:pb-6">
                <div className="text-center p-3 sm:p-4 bg-grey-900 rounded-lg">
                  <p className="text-xs sm:text-sm text-grey-400 mb-1 sm:mb-2">Current Step</p>
                  <p className="text-xl sm:text-2xl font-bold text-purple-400">{currentStep} / 5</p>
                  <p className="text-[10px] sm:text-xs text-grey-500 mt-1 sm:mt-2">{steps[currentStep - 1].title}</p>
                </div>

                <Card className="bg-grey-900 border-grey-800">
                  <CardHeader className="pb-1.5 sm:pb-2 px-3 sm:px-4 pt-3 sm:pt-4">
                    <CardTitle className="text-xs sm:text-sm">Progress Summary</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-1.5 sm:space-y-2 text-[10px] sm:text-xs px-3 sm:px-4 pb-3 sm:pb-4">
                    <div className="flex justify-between gap-2">
                      <span className="text-grey-400 truncate">Contact Info:</span>
                      <span className={formData.name && formData.email && formData.phone && formData.address && formData.targetRole && formData.industry ? 'text-green-500' : 'text-grey-500'}>
                        {formData.name && formData.email && formData.phone && formData.address && formData.targetRole && formData.industry ? '✓ Complete' : '○ Incomplete'}
                      </span>
                    </div>
                    <div className="flex justify-between gap-2">
                      <span className="text-grey-400 truncate">Work Experience:</span>
                      <span className={formData.experience.length > 0 ? 'text-green-500' : 'text-grey-500'}>
                        {formData.experience.length > 0 ? `✓ ${formData.experience.length} added` : '○ None'}
                      </span>
                    </div>
                    <div className="flex justify-between gap-2">
                      <span className="text-grey-400 truncate">Education:</span>
                      <span className={formData.education.length > 0 ? 'text-green-500' : 'text-grey-500'}>
                        {formData.education.length > 0 ? `✓ ${formData.education.length} added` : '○ None'}
                      </span>
                    </div>
                    <div className="flex justify-between gap-2">
                      <span className="text-grey-400 truncate">Skills:</span>
                      <span className={formData.skills.technical.trim() && formData.skills.tools.trim() ? 'text-green-500' : 'text-grey-500'}>
                        {formData.skills.technical.trim() && formData.skills.tools.trim() ? '✓ Complete' : '○ Incomplete'}
                      </span>
                    </div>
                  </CardContent>
                </Card>

                {generatedResume && (
                  <div className="pt-2 sm:pt-3 lg:pt-4 border-t border-grey-800">
                    <h4 className="font-semibold mb-2 text-xs sm:text-sm lg:text-base">Download Options</h4>
                    <div className="space-y-2">
                      <Button onClick={() => handleDownload('pdf')} variant="outline" className="w-full text-xs sm:text-sm h-9 sm:h-10 lg:h-12">
                        <Download className="h-3 w-3 sm:h-4 sm:w-4 mr-1.5 sm:mr-2" />
                        Download PDF
                      </Button>
                      <Button onClick={() => handleDownload('docx')} variant="outline" className="w-full text-xs sm:text-sm h-9 sm:h-10 lg:h-12">
                        <Download className="h-3 w-3 sm:h-4 sm:w-4 mr-1.5 sm:mr-2" />
                        Download DOCX
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

          </div>
        </div>

        {isGenerating && (
          <ProcessingModal isOpen={isGenerating} title="Generating Resume" fileName="AI Resume" progress={progress} stage={progressStage} icon={Wand2} />
        )}
      </div>
    </div>
  )
}

export default ResumeGenerator
