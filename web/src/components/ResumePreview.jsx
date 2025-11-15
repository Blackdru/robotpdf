import { Mail, Phone, MapPin, Github, Linkedin, Globe } from 'lucide-react'
import { Card } from './ui/card'

const ResumePreview = ({ resume }) => {
  if (!resume) return null

  const { contact, summary, experience, education, skills, projects, certifications, languages } = resume

  return (
    <Card className="bg-white text-black p-8 max-w-4xl mx-auto shadow-2xl">
      {/* Header */}
      <div className="border-b-2 border-gray-800 pb-4 mb-6">
        <h1 className="text-4xl font-bold text-gray-900 mb-2">{contact?.name}</h1>
        <p className="text-lg text-gray-600 mb-3">{resume.targetRole}</p>
        
        {/* Contact Info */}
        <div className="flex flex-wrap gap-4 text-sm text-gray-700">
          {contact?.phone && (
            <div className="flex items-center gap-1">
              <Phone className="h-4 w-4" />
              <span>{contact.phone}</span>
            </div>
          )}
          {contact?.email && (
            <div className="flex items-center gap-1">
              <Mail className="h-4 w-4" />
              <span>{contact.email}</span>
            </div>
          )}
          {contact?.address && (
            <div className="flex items-center gap-1">
              <MapPin className="h-4 w-4" />
              <span>{contact.address}</span>
            </div>
          )}
          {contact?.github && (
            <div className="flex items-center gap-1">
              <Github className="h-4 w-4" />
              <span>{contact.github}</span>
            </div>
          )}
          {contact?.linkedin && (
            <div className="flex items-center gap-1">
              <Linkedin className="h-4 w-4" />
              <span>{contact.linkedin}</span>
            </div>
          )}
        </div>
      </div>

      {/* Summary */}
      {summary && (
        <div className="mb-6">
          <h2 className="text-xl font-bold text-gray-900 mb-2 uppercase border-b border-gray-300 pb-1">Summary</h2>
          <p className="text-gray-700 leading-relaxed">{summary}</p>
        </div>
      )}

      {/* Education */}
      {education && education.length > 0 && (
        <div className="mb-6">
          <h2 className="text-xl font-bold text-gray-900 mb-3 uppercase border-b border-gray-300 pb-1">Education</h2>
          {education.map((edu, idx) => (
            <div key={idx} className="mb-4">
              <div className="flex justify-between items-start mb-1">
                <div>
                  <h3 className="font-bold text-gray-900">{edu.degree}</h3>
                  <p className="text-gray-700">{edu.institution}</p>
                </div>
                <div className="text-right text-sm text-gray-600">
                  {edu.location && <p>{edu.location}</p>}
                  <p>{edu.graduationDate}</p>
                </div>
              </div>
              {edu.gpa && <p className="text-sm text-gray-600">GPA: {edu.gpa}</p>}
              {edu.honors && edu.honors.length > 0 && (
                <ul className="list-disc list-inside text-sm text-gray-700 mt-1">
                  {edu.honors.map((honor, i) => (
                    <li key={i}>{honor}</li>
                  ))}
                </ul>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Experience */}
      {experience && experience.length > 0 && (
        <div className="mb-6">
          <h2 className="text-xl font-bold text-gray-900 mb-3 uppercase border-b border-gray-300 pb-1">Experience</h2>
          {experience.map((exp, idx) => (
            <div key={idx} className="mb-4">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <h3 className="font-bold text-gray-900">{exp.title}</h3>
                  <p className="text-gray-700">{exp.company}</p>
                </div>
                <div className="text-right text-sm text-gray-600">
                  {exp.location && <p className="flex items-center gap-1 justify-end"><MapPin className="h-3 w-3" />{exp.location}</p>}
                  <p>{exp.startDate} - {exp.endDate}</p>
                </div>
              </div>
              {exp.achievements && exp.achievements.length > 0 && (
                <ul className="list-disc list-outside ml-5 space-y-1 text-gray-700">
                  {exp.achievements.map((achievement, i) => (
                    <li key={i} className="leading-relaxed">{achievement}</li>
                  ))}
                </ul>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Technical Skills */}
      {skills && (skills.technical?.length > 0 || skills.tools?.length > 0) && (
        <div className="mb-6">
          <h2 className="text-xl font-bold text-gray-900 mb-3 uppercase border-b border-gray-300 pb-1">Technical Skills</h2>
          <div className="space-y-2">
            {skills.technical && skills.technical.length > 0 && (
              <div>
                <span className="font-semibold text-gray-800">Technical: </span>
                <div className="inline-flex flex-wrap gap-2 mt-1">
                  {skills.technical.map((skill, i) => (
                    <span key={i} className="px-3 py-1 bg-gray-200 text-gray-800 rounded-full text-sm">{skill}</span>
                  ))}
                </div>
              </div>
            )}
            {skills.tools && skills.tools.length > 0 && (
              <div>
                <span className="font-semibold text-gray-800">Tools & Technologies: </span>
                <div className="inline-flex flex-wrap gap-2 mt-1">
                  {skills.tools.map((tool, i) => (
                    <span key={i} className="px-3 py-1 bg-gray-200 text-gray-800 rounded-full text-sm">{tool}</span>
                  ))}
                </div>
              </div>
            )}
            {skills.soft && skills.soft.length > 0 && (
              <div>
                <span className="font-semibold text-gray-800">Soft Skills: </span>
                <div className="inline-flex flex-wrap gap-2 mt-1">
                  {skills.soft.map((skill, i) => (
                    <span key={i} className="px-3 py-1 bg-gray-200 text-gray-800 rounded-full text-sm">{skill}</span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Projects */}
      {projects && projects.length > 0 && (
        <div className="mb-6">
          <h2 className="text-xl font-bold text-gray-900 mb-3 uppercase border-b border-gray-300 pb-1">Projects</h2>
          {projects.map((project, idx) => (
            <div key={idx} className="mb-3">
              <h3 className="font-bold text-gray-900">{project.name}</h3>
              <p className="text-gray-700 mb-1">{project.description}</p>
              {project.technologies && project.technologies.length > 0 && (
                <p className="text-sm text-gray-600">
                  <span className="font-semibold">Technologies:</span> {project.technologies.join(', ')}
                </p>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Certifications */}
      {certifications && certifications.length > 0 && (
        <div className="mb-6">
          <h2 className="text-xl font-bold text-gray-900 mb-3 uppercase border-b border-gray-300 pb-1">Certifications</h2>
          {certifications.map((cert, idx) => (
            <div key={idx} className="mb-2">
              <p className="text-gray-900"><span className="font-semibold">{cert.name}</span> - {cert.issuer} ({cert.date})</p>
            </div>
          ))}
        </div>
      )}

      {/* Languages */}
      {languages && languages.length > 0 && (
        <div className="mb-6">
          <h2 className="text-xl font-bold text-gray-900 mb-3 uppercase border-b border-gray-300 pb-1">Languages</h2>
          <div className="flex flex-wrap gap-4">
            {languages.map((lang, idx) => (
              <p key={idx} className="text-gray-700"><span className="font-semibold">{lang.language}:</span> {lang.proficiency}</p>
            ))}
          </div>
        </div>
      )}
    </Card>
  )
}

export default ResumePreview
