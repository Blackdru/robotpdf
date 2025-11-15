const OpenAI = require('openai');

class ResumeGenerator {
  constructor() {
    const useOpenRouter = process.env.OPENROUTER_API_KEY && 
                         process.env.OPENROUTER_API_KEY !== 'your_openrouter_api_key_here' &&
                         process.env.OPENROUTER_API_KEY !== 'sk-test-key-for-development' &&
                         (process.env.OPENROUTER_API_KEY.startsWith('sk-or-') || process.env.OPENROUTER_API_KEY.startsWith('sk-or-v1-'));
    
    if (useOpenRouter) {
      this.client = new OpenAI({
        apiKey: process.env.OPENROUTER_API_KEY,
        baseURL: 'https://openrouter.ai/api/v1',
        defaultHeaders: {
          'HTTP-Referer': 'http://localhost:5000',
          'X-Title': 'RobotPDF Resume Generator'
        }
      });
      this.model = 'meta-llama/llama-3.3-70b-instruct:free';
    } else if (process.env.OPENAI_API_KEY && process.env.OPENAI_API_KEY.startsWith('sk-')) {
      this.client = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY,
        baseURL: process.env.AI_BASE_URL || 'https://api.openai.com/v1'
      });
      this.model = process.env.AI_MODEL || 'gpt-4o-mini';
    } else {
      this.client = null;
      this.model = null;
    }
  }

  isEnabled() {
    return this.client !== null && this.model !== null;
  }

  validateMandatoryFields(userData) {
    const mandatoryFields = {
      name: userData.name,
      email: userData.email,
      phone: userData.phone,
      address: userData.address || userData.location,
      targetRole: userData.targetRole,
      industry: userData.industry,
      experience: userData.experience,
      education: userData.education,
      technicalSkills: userData.skills?.technical || userData.technicalSkills,
      tools: userData.skills?.tools || userData.tools
    };

    const missingFields = [];
    
    if (!mandatoryFields.name || mandatoryFields.name.trim() === '') missingFields.push('name');
    if (!mandatoryFields.email || mandatoryFields.email.trim() === '') missingFields.push('email');
    if (!mandatoryFields.phone || mandatoryFields.phone.trim() === '') missingFields.push('phone');
    if (!mandatoryFields.address || mandatoryFields.address.trim() === '') missingFields.push('address');
    if (!mandatoryFields.targetRole || mandatoryFields.targetRole.trim() === '') missingFields.push('targetRole');
    if (!mandatoryFields.industry || mandatoryFields.industry.trim() === '') missingFields.push('industry');
    if (!mandatoryFields.experience || !Array.isArray(mandatoryFields.experience) || mandatoryFields.experience.length === 0) {
      missingFields.push('work experience');
    }
    if (!mandatoryFields.education || !Array.isArray(mandatoryFields.education) || mandatoryFields.education.length === 0) {
      missingFields.push('education');
    }
    if (!mandatoryFields.technicalSkills || !Array.isArray(mandatoryFields.technicalSkills) || mandatoryFields.technicalSkills.length === 0) {
      missingFields.push('technical skills');
    }
    if (!mandatoryFields.tools || !Array.isArray(mandatoryFields.tools) || mandatoryFields.tools.length === 0) {
      missingFields.push('tools and technologies');
    }

    return { isValid: missingFields.length === 0, missingFields };
  }

  async generateResume(userData, options = {}) {
    if (!this.isEnabled()) {
      throw new Error('AI service is not configured. Please set up OpenRouter or OpenAI API key.');
    }

    // Validate mandatory fields
    const validation = this.validateMandatoryFields(userData);
    if (!validation.isValid) {
      throw new Error(`Missing mandatory fields: ${validation.missingFields.join(', ')}`);
    }

    try {
      const {
        template = 'professional',
        tone = 'professional',
        experienceLevel = 'mid',
        includeSkills = true,
        includeSummary = true,
        includeProjects = false,
        includeCertifications = false,
        includeLanguages = false,
        customSections = []
      } = options;

      const prompt = this.buildGenerationPrompt(userData, options);
      
      const response = await this.client.chat.completions.create({
        model: this.model,
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.7,
        max_tokens: 4000,
        timeout: 90000
      });

      const generatedContent = response.choices[0].message.content;
      return this.parseGeneratedResume(generatedContent, userData);
    } catch (error) {
      console.error('Resume generation error:', error);
      throw new Error(`Failed to generate resume: ${error.message}`);
    }
  }

  buildGenerationPrompt(userData, options) {
    const {
      template = 'professional',
      tone = 'professional',
      experienceLevel = 'mid'
    } = options;

    const address = userData.address || userData.location || '';
    const targetRole = userData.targetRole || '';
    const industry = userData.industry || '';
    const technicalSkills = userData.skills?.technical || userData.technicalSkills || [];
    const tools = userData.skills?.tools || userData.tools || [];
    const softSkills = userData.skills?.soft || [];

    return `You are creating a ${tone}, ${experienceLevel}-level resume for a ${targetRole} position in the ${industry} industry.

MANDATORY CONTACT INFORMATION:
- Full Name: ${userData.name}
- Email: ${userData.email}
- Phone: ${userData.phone}
- Address: ${address}
${userData.linkedin ? `- LinkedIn: ${userData.linkedin}` : ''}
${userData.github ? `- GitHub: ${userData.github}` : ''}
${userData.portfolio ? `- Portfolio: ${userData.portfolio}` : ''}

TARGET ROLE & INDUSTRY:
- Target Role: ${targetRole}
- Industry: ${industry}
- Experience Level: ${experienceLevel}

WORK EXPERIENCE (MANDATORY):
${userData.experience.map((exp, i) => `
Experience ${i + 1}:
- Job Title: ${exp.title || exp.position}
- Company: ${exp.company}
${exp.location && exp.location.trim() ? `- Location: ${exp.location}` : ''}
- Duration: ${exp.startDate} - ${exp.endDate || 'Present'}
- Responsibilities/Achievements:
${exp.achievements && exp.achievements.length > 0 ? exp.achievements.filter(a => a && a.trim()).map(a => `  • ${a}`).join('\n') : '  • ' + (exp.description || 'Provide detailed achievements based on the role')}
`).join('\n')}

EDUCATION (MANDATORY):
${userData.education.map((edu, i) => `
Education ${i + 1}:
- Degree: ${edu.degree}
- Institution: ${edu.institution || edu.school}
${edu.location && edu.location.trim() ? `- Location: ${edu.location}` : ''}
- Graduation Date: ${edu.graduationDate || edu.year}
${edu.gpa && edu.gpa.trim() ? `- GPA: ${edu.gpa}` : ''}
${edu.honors && edu.honors.length > 0 ? `- Honors: ${edu.honors.join(', ')}` : ''}
`).join('\n')}

TECHNICAL SKILLS (MANDATORY):
${technicalSkills.join(', ')}

TOOLS & TECHNOLOGIES (MANDATORY):
${tools.join(', ')}

${softSkills.length > 0 ? `SOFT SKILLS:\n${softSkills.join(', ')}\n` : ''}

${userData.projects && userData.projects.length > 0 ? `PROJECTS:\n${userData.projects.map((p, i) => `
Project ${i + 1}:
- Name: ${p.name}
- Description: ${p.description}
- Technologies: ${p.technologies ? p.technologies.join(', ') : 'Not specified'}
`).join('\n')}` : ''}

${userData.certifications && userData.certifications.length > 0 ? `CERTIFICATIONS:\n${userData.certifications.map(c => `- ${c.name} (${c.issuer}, ${c.date})`).join('\n')}\n` : ''}

${userData.languages && userData.languages.length > 0 ? `LANGUAGES:\n${userData.languages.map(l => `- ${l.language}: ${l.proficiency}`).join('\n')}\n` : ''}

CRITICAL INSTRUCTIONS - FOLLOW THESE EXACTLY:

1. PROFESSIONAL SUMMARY (MANDATORY - YOU MUST CREATE THIS):
   - Write a compelling 2-3 line professional summary for a ${targetRole} in ${industry}
   - Calculate years of experience from work history dates
   - Mention 2-3 key skills from their technical skills list
   - Include their target role and industry
   - Example: "Experienced Software Developer with 3+ years building scalable web applications using React, Node.js, and Python. Proven track record in delivering high-quality solutions for the technology industry. Strong problem-solving skills and collaborative team player."

2. EDUCATION (MANDATORY ENHANCEMENT - YOU MUST ADD COURSEWORK):
   - List degree, institution, location, and graduation date
   - Include GPA if provided and above 3.0
   - YOU MUST ALWAYS add relevant coursework based on the degree field
   - Add 4-6 relevant courses that match the degree and target role
   - Format as: "Relevant Coursework: Course1, Course2, Course3, Course4"
   
   EXAMPLES YOU MUST FOLLOW:
   - Computer Science/IT: "Relevant Coursework: Data Structures & Algorithms, Database Management Systems, Web Development, Software Engineering, Operating Systems, Computer Networks"
   - Electrical Engineering: "Relevant Coursework: Circuit Analysis, Digital Electronics, Microprocessors, Control Systems, Power Systems, Signal Processing"
   - Business/MBA: "Relevant Coursework: Financial Analysis, Marketing Strategy, Operations Management, Business Analytics, Strategic Planning, Leadership"
   - Mechanical Engineering: "Relevant Coursework: Thermodynamics, Fluid Mechanics, Machine Design, Manufacturing Processes, CAD/CAM, Materials Science"
   - Data Science: "Relevant Coursework: Machine Learning, Statistical Analysis, Data Mining, Python Programming, Big Data Analytics, Visualization"
   
   CRITICAL: Even if user didn't mention coursework, YOU MUST intelligently add it based on their degree

3. WORK EXPERIENCE (CRITICAL - YOU MUST ENHANCE AND EXPAND):
   For EACH work experience entry, YOU MUST create 3-5 DETAILED bullet points:
   
   IMPORTANT: If user provided minimal or no achievements, YOU MUST intelligently create realistic achievements based on the job title and company.
   
   STRUCTURE OF EACH BULLET:
   - Start with professional action verbs: Contributed, Developed, Assisted, Coordinated, Implemented, Troubleshooted, Resolved, Managed, Created, Supported
   - Describe specific tasks and responsibilities
   - ALWAYS include numerical results (%, numbers, metrics)
   - Keep bullets concise (1-2 lines)
   - Be realistic and professional
   
   EXAMPLES OF WHAT TO GENERATE:
   - If job title is "Software Developer": "Developed and maintained web applications using React and Node.js, serving 10,000+ active users with 99% uptime"
   - If job title is "Customer Support": "Resolved 100+ customer inquiries daily via phone and email, maintaining 95% satisfaction rating"
   - If job title is "Data Analyst": "Analyzed sales data using Python and SQL, identifying trends that increased revenue by 15%"
   
   VERB TENSE:
   - Past tense for previous roles: "Contributed", "Developed", "Assisted"
   - Present tense for current role: "Contribute", "Develop", "Assist"

4. TECHNICAL SKILLS (YOU MUST ENHANCE):
   - List all technical skills provided by user
   - Group into: Programming Languages, Frameworks/Libraries, Databases, Cloud/DevOps
   - If user provided basic skills, intelligently add related common skills for their role
   - Example: If user has "HTML, CSS, JS" and role is "Web Developer", add "React, Node.js, Express"
   - Keep skills relevant to target role and industry
   - Format as clean, scannable list

5. PROJECTS/VOLUNTEER (if provided):
   - Use same bullet format as work experience
   - 2-3 bullets per project
   - Include technologies used
   - Mention impact or outcome

6. STRENGTHS (if requested):
   - List 2 key strengths
   - One short sentence each
   - Professional and factual

7. REFERENCES (if requested):
   - Name, role/title, phone number
   - No email addresses
   - Format: "John Smith - Former Manager - (555) 123-4567"

FORMATTING RULES:
- Use standard section headings: SUMMARY, EDUCATION, EXPERIENCE, TECHNICAL SKILLS, PROJECTS, STRENGTHS, REFERENCES
- Format dates as MM/YYYY - MM/YYYY
- No tables, no complex formatting
- Clean spacing between sections
- Professional and readable

CRITICAL: YOU MUST ENHANCE USER INPUT
- If user wrote "worked on projects" → YOU write "Developed and deployed 5+ web applications using React and Node.js, serving 10,000+ users"
- If user wrote "helped customers" → YOU write "Resolved 100+ customer inquiries daily via phone and email, achieving 95% satisfaction rating"
- If user wrote "did data analysis" → YOU write "Analyzed sales data using Python and SQL, identifying trends that increased revenue by 15%"
- If user wrote "managed team" → YOU write "Coordinated and led team of 8 developers, ensuring on-time delivery of 10+ projects"

EXAMPLES OF GOOD BULLETS:
- "Contributed to development of customer portal using React and Node.js, serving 5,000+ active users"
- "Resolved 150+ technical support tickets monthly with 95% customer satisfaction rating"
- "Assisted in implementing automated testing framework, reducing bug detection time by 25%"
- "Coordinated team meetings and project timelines for 8-person development team"
- "Developed Python scripts to automate data processing, saving 10 hours per week"

Return ONLY valid JSON in this exact structure (no markdown, no code blocks, no extra text):
{
  "contact": {
    "name": "${userData.name}",
    "email": "${userData.email}",
    "phone": "${userData.phone}",
    "address": "${address}",
    "linkedin": "${userData.linkedin || ''}",
    "github": "${userData.github || ''}",
    "portfolio": "${userData.portfolio || ''}"
  },
  "targetRole": "${targetRole}",
  "industry": "${industry}",
  "summary": "Write a compelling 3-4 sentence professional summary here",
  "experience": [
    {
      "title": "Job Title",
      "company": "Company Name",
      "location": "City, State/Country (leave empty if not provided)",
      "startDate": "MM/YYYY",
      "endDate": "MM/YYYY or Present",
      "achievements": [
        "Achievement 1 with quantifiable results",
        "Achievement 2 with impact metrics",
        "Achievement 3 with action verb and outcome"
      ]
    }
  ],
  "education": [
    {
      "degree": "Degree Name",
      "institution": "University/College Name",
      "location": "City, State/Country (leave empty if not provided)",
      "graduationDate": "MM/YYYY or YYYY",
      "gpa": "X.X/4.0 (leave empty if not provided)",
      "coursework": "Relevant Coursework: Course1, Course2, Course3, Course4, Course5, Course6 (YOU MUST ADD THIS)",
      "honors": ["Honor 1", "Honor 2"]
    }
  ],
  "skills": {
    "technical": ${JSON.stringify(technicalSkills)},
    "tools": ${JSON.stringify(tools)},
    "soft": ${JSON.stringify(softSkills)}
  }${userData.projects && userData.projects.length > 0 ? `,
  "projects": [
    {
      "name": "Project Name",
      "description": "Brief description with impact",
      "technologies": ["Tech1", "Tech2"],
      "link": "URL if available"
    }
  ]` : ''}${userData.certifications && userData.certifications.length > 0 ? `,
  "certifications": [
    {
      "name": "Certification Name",
      "issuer": "Issuing Organization",
      "date": "MM/YYYY",
      "credential": "Credential ID if available"
    }
  ]` : ''}${userData.languages && userData.languages.length > 0 ? `,
  "languages": [
    {
      "language": "Language Name",
      "proficiency": "Native/Fluent/Intermediate/Basic"
    }
  ]` : ''}
}`;
  }

  parseGeneratedResume(content, userData) {
    try {
      // Remove markdown code blocks if present
      let cleanContent = content.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();
      
      // Find the JSON object
      const jsonMatch = cleanContent.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        
        // Validate critical mandatory fields
        if (!parsed.contact || !parsed.contact.name || !parsed.contact.email || 
            !parsed.contact.phone || !parsed.contact.address) {
          console.warn('AI response missing mandatory contact fields, using original data');
          parsed.contact = {
            name: userData.name,
            email: userData.email,
            phone: userData.phone,
            address: userData.address || userData.location,
            linkedin: userData.linkedin || '',
            github: userData.github || '',
            portfolio: userData.portfolio || ''
          };
        }

        if (!parsed.targetRole) parsed.targetRole = userData.targetRole;
        if (!parsed.industry) parsed.industry = userData.industry;
        
        if (!parsed.experience || !Array.isArray(parsed.experience) || parsed.experience.length === 0) {
          console.warn('AI response missing work experience, using original data');
          parsed.experience = userData.experience;
        }
        
        if (!parsed.education || !Array.isArray(parsed.education) || parsed.education.length === 0) {
          console.warn('AI response missing education, using original data');
          parsed.education = userData.education;
        }

        // Ensure skills object with mandatory fields
        if (!parsed.skills) {
          parsed.skills = {};
        }
        if (!parsed.skills.technical || parsed.skills.technical.length === 0) {
          parsed.skills.technical = userData.skills?.technical || userData.technicalSkills || [];
        }
        if (!parsed.skills.tools || parsed.skills.tools.length === 0) {
          parsed.skills.tools = userData.skills?.tools || userData.tools || [];
        }
        if (!parsed.skills.soft) {
          parsed.skills.soft = userData.skills?.soft || [];
        }
        
        // Ensure arrays are properly formatted
        if (parsed.education && Array.isArray(parsed.education)) {
          parsed.education = parsed.education.map(edu => ({
            degree: edu.degree || '',
            institution: edu.institution || '',
            location: edu.location || '',
            graduationDate: edu.graduationDate || '',
            gpa: edu.gpa || '',
            coursework: edu.coursework || '',
            honors: Array.isArray(edu.honors) ? edu.honors : []
          }));
        }

        if (parsed.experience && Array.isArray(parsed.experience)) {
          parsed.experience = parsed.experience.map(exp => ({
            title: exp.title || '',
            company: exp.company || '',
            location: exp.location || '',
            startDate: exp.startDate || '',
            endDate: exp.endDate || '',
            achievements: Array.isArray(exp.achievements) ? exp.achievements : []
          }));
        }
        
        return {
          ...parsed,
          metadata: {
            generatedAt: new Date().toISOString(),
            model: this.model,
            version: '2.0',
            template: userData.template || 'professional'
          }
        };
      }
      throw new Error('Invalid JSON response from AI');
    } catch (error) {
      console.error('Failed to parse generated resume:', error);
      console.error('Raw content:', content);
      return this.createFallbackResume(userData);
    }
  }

  createFallbackResume(userData) {
    return {
      contact: {
        name: userData.name || 'Your Name',
        email: userData.email || 'your.email@example.com',
        phone: userData.phone || '+1234567890',
        address: userData.address || userData.location || 'City, State',
        linkedin: userData.linkedin || '',
        portfolio: userData.portfolio || '',
        github: userData.github || ''
      },
      targetRole: userData.targetRole || 'Professional',
      industry: userData.industry || 'General',
      summary: userData.summary || 'Experienced professional with a strong background in the field.',
      experience: userData.experience || [],
      education: userData.education || [],
      skills: {
        technical: userData.skills?.technical || userData.technicalSkills || [],
        tools: userData.skills?.tools || userData.tools || [],
        soft: userData.skills?.soft || []
      },
      projects: userData.projects || [],
      certifications: userData.certifications || [],
      languages: userData.languages || [],
      metadata: {
        generatedAt: new Date().toISOString(),
        model: 'fallback',
        version: '2.0'
      }
    };
  }

  async enhanceSection(sectionType, content, context = {}) {
    if (!this.isEnabled()) {
      return content;
    }

    try {
      const prompt = this.buildEnhancementPrompt(sectionType, content, context);
      
      const response = await this.client.chat.completions.create({
        model: this.model,
        messages: [
          {
            role: 'system',
            content: 'You are a professional resume writer. Enhance resume sections with strong action verbs, quantifiable achievements, and ATS optimization.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.7,
        max_tokens: 1000
      });

      return response.choices[0].message.content.trim();
    } catch (error) {
      console.error('Section enhancement error:', error);
      return content;
    }
  }

  buildEnhancementPrompt(sectionType, content, context) {
    const prompts = {
      summary: `Enhance this professional summary to be more impactful and achievement-focused for a ${context.targetRole || 'professional'} in ${context.industry || 'the industry'}:\n\n${content}\n\nMake it 3-4 sentences, highlight key achievements, include relevant keywords, and quantify experience where possible.`,
      
      experience: `Enhance these job experience bullet points with strong action verbs and quantifiable results for a ${context.targetRole || 'professional'} role:\n\n${content}\n\nUse metrics, percentages, dollar amounts, and specific achievements. Start each bullet with a strong action verb (Led, Developed, Achieved, Improved, etc.). Focus on impact and business value.`,
      
      skills: `Organize and enhance this skills list for maximum ATS impact in ${context.industry || 'the industry'}:\n\n${content}\n\nGroup by: Technical Skills, Tools & Technologies, and Soft Skills. Prioritize based on relevance to ${context.targetRole || 'the role'}.`,
      
      projects: `Enhance this project description to highlight technical skills and measurable impact:\n\n${content}\n\nFocus on: technologies used, problems solved, measurable outcomes, and your specific contributions.`
    };

    return prompts[sectionType] || `Enhance this resume section with strong action verbs and quantifiable achievements:\n\n${content}`;
  }

  async generateMultipleVersions(userData, targetRoles = []) {
    const versions = [];
    
    for (const role of targetRoles) {
      try {
        const customUserData = {
          ...userData,
          targetRole: role.title,
          industry: role.industry
        };
        
        const resume = await this.generateResume(customUserData, {
          template: role.template || 'professional',
          tone: role.tone || 'professional',
          experienceLevel: role.experienceLevel || 'mid'
        });
        
        versions.push({
          role: role.title,
          industry: role.industry,
          resume: resume
        });
      } catch (error) {
        console.error(`Failed to generate resume for ${role.title}:`, error);
      }
    }
    
    return versions;
  }

  async suggestImprovements(resumeData) {
    if (!this.isEnabled()) {
      return [];
    }

    try {
      const prompt = `Analyze this resume and suggest specific improvements for ATS optimization and impact:\n\n${JSON.stringify(resumeData, null, 2)}\n\nProvide 5-7 actionable suggestions focusing on:\n1. ATS keyword optimization\n2. Quantifiable achievements\n3. Action verb usage\n4. Formatting and structure\n5. Missing information\n\nFormat as a JSON array with this structure:\n[{"category": "Category", "suggestion": "Specific actionable suggestion", "priority": "high/medium/low"}]`;
      
      const response = await this.client.chat.completions.create({
        model: this.model,
        messages: [
          {
            role: 'system',
            content: 'You are a resume expert and ATS specialist providing actionable improvement suggestions.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.5,
        max_tokens: 1500
      });

      const content = response.choices[0].message.content;
      const jsonMatch = content.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
      return [];
    } catch (error) {
      console.error('Improvement suggestion error:', error);
      return [];
    }
  }

  getTemplates() {
    return [
      {
        id: 'professional',
        name: 'Professional',
        description: 'Clean, traditional format suitable for corporate roles',
        preview: 'professional-preview.png',
        bestFor: ['Corporate', 'Finance', 'Consulting']
      },
      {
        id: 'modern',
        name: 'Modern',
        description: 'Contemporary design with subtle colors and modern typography',
        preview: 'modern-preview.png',
        bestFor: ['Tech', 'Marketing', 'Startups']
      },
      {
        id: 'creative',
        name: 'Creative',
        description: 'Bold design for creative industries and portfolios',
        preview: 'creative-preview.png',
        bestFor: ['Design', 'Media', 'Arts']
      },
      {
        id: 'technical',
        name: 'Technical',
        description: 'Optimized for technical roles with emphasis on skills',
        preview: 'technical-preview.png',
        bestFor: ['Engineering', 'IT', 'Software Development']
      },
      {
        id: 'executive',
        name: 'Executive',
        description: 'Sophisticated format for senior leadership positions',
        preview: 'executive-preview.png',
        bestFor: ['C-Suite', 'Senior Management', 'Directors']
      },
      {
        id: 'minimal',
        name: 'Minimal',
        description: 'Simple, elegant design focusing on content',
        preview: 'minimal-preview.png',
        bestFor: ['Academic', 'Research', 'Consulting']
      }
    ];
  }

  getIndustries() {
    return [
      'Technology', 'Software Development', 'Finance', 'Healthcare', 'Education', 
      'Marketing', 'Sales', 'Engineering', 'Design', 'Consulting', 'Legal',
      'Manufacturing', 'Retail', 'Hospitality', 'Real Estate', 'Construction',
      'Media & Entertainment', 'Non-Profit', 'Government', 'Other'
    ];
  }

  getExperienceLevels() {
    return [
      { value: 'entry', label: 'Entry Level (0-2 years)', description: 'Recent graduate or career starter' },
      { value: 'mid', label: 'Mid Level (3-7 years)', description: 'Experienced professional' },
      { value: 'senior', label: 'Senior Level (8-15 years)', description: 'Senior professional or team lead' },
      { value: 'executive', label: 'Executive (15+ years)', description: 'C-suite or senior leadership' }
    ];
  }

  getMandatoryFields() {
    return [
      'name',
      'email',
      'phone',
      'address',
      'targetRole',
      'industry',
      'work experience (at least one)',
      'education (at least one)',
      'technical skills (at least one)',
      'tools and technologies (at least one)'
    ];
  }
}

module.exports = new ResumeGenerator();