const OpenAI = require('openai');

class ResumeAI {
  constructor() {
    // Always prefer OpenAI with GPT-4o-mini for resume generation (best quality)
    const useOpenAI = process.env.OPENAI_API_KEY && 
                     process.env.OPENAI_API_KEY !== 'your_openai_api_key_here' &&
                     process.env.OPENAI_API_KEY.startsWith('sk-');
    
    const useOpenRouter = !useOpenAI && 
                         process.env.OPENROUTER_API_KEY && 
                         process.env.OPENROUTER_API_KEY !== 'your_openrouter_api_key_here' &&
                         process.env.OPENROUTER_API_KEY !== 'sk-test-key-for-development' &&
                         (process.env.OPENROUTER_API_KEY.startsWith('sk-or-') || process.env.OPENROUTER_API_KEY.startsWith('sk-or-v1-'));
    
    if (useOpenAI) {
      this.client = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY,
        baseURL: process.env.AI_BASE_URL || 'https://api.openai.com/v1'
      });
      // Always use GPT-4o-mini for professional quality resumes
      this.model = 'gpt-4o-mini';
      this.provider = 'OpenAI';
      console.log('Resume AI: Using OpenAI GPT-4o-mini for professional resume generation');
    } else if (useOpenRouter) {
      this.client = new OpenAI({
        apiKey: process.env.OPENROUTER_API_KEY,
        baseURL: 'https://openrouter.ai/api/v1',
        defaultHeaders: {
          'HTTP-Referer': 'http://localhost:5000',
          'X-Title': 'RobotPDF Resume AI'
        }
      });
      this.model = 'meta-llama/llama-3.3-70b-instruct:free';
      this.provider = 'OpenRouter';
      console.log('Resume AI: Using OpenRouter Llama 3.3 70B (fallback)');
    } else {
      this.client = null;
      this.model = null;
      this.provider = null;
      console.log('Resume AI: No AI service configured');
    }
  }

  isEnabled() {
    return this.client !== null && this.model !== null;
  }

  async optimizeResume(resumeData, jobDescription, tone = 'professional') {
    if (!this.isEnabled()) {
      throw new Error('AI service is not configured. Please set up OpenRouter or OpenAI API key.');
    }

    try {
      const prompt = this.buildOptimizationPrompt(resumeData, jobDescription, tone);
      
      // Use GPT-4o-mini via OpenRouter for best resume quality
      const resumeModel = this.provider === 'OpenAI' ? 'gpt-4o-mini' : 'openai/gpt-4o-mini';
      console.log(`Resume AI: Generating resume with ${resumeModel} via ${this.provider}`);
      
      const response = await this.client.chat.completions.create({
        model: resumeModel,
        messages: [
          {
            role: 'system',
            content: 'You are an elite professional resume writer and career coach with 15+ years of experience at Fortune 500 companies. You specialize in crafting executive-level, ATS-optimized resumes that consistently land interviews. Your resumes are known for powerful achievement statements with quantifiable metrics, strategic keyword optimization, and compelling professional narratives. You create publication-ready, professional documents that showcase candidates as top-tier talent. Every resume you write is worth $500+ in professional value.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.7,
        max_tokens: 4000
      });

      const optimizedContent = response.choices[0].message.content;
      return this.parseOptimizedResume(optimizedContent, resumeData);
    } catch (error) {
      console.error('Resume optimization error:', error);
      throw new Error(`Failed to optimize resume: ${error.message}`);
    }
  }

  buildOptimizationPrompt(resumeData, jobDescription, tone) {
    return `You are an elite professional resume writer and career strategist with 15+ years of experience crafting executive-level resumes that consistently land interviews at Fortune 500 companies. Transform this resume into a powerful, ATS-optimized, professionally-crafted document.

CURRENT RESUME DATA:
${JSON.stringify(resumeData, null, 2)}

TARGET JOB DESCRIPTION:
${jobDescription}

DESIRED PROFESSIONAL TONE: ${tone}

CRITICAL REQUIREMENTS FOR PROFESSIONAL RESUME GENERATION:

1. EXECUTIVE PROFESSIONAL SUMMARY (Must be compelling):
   - Write a powerful 4-5 sentence summary that immediately captures attention
   - Lead with the candidate's unique value proposition and years of expertise
   - Include 2-3 quantifiable career achievements with specific metrics (%, $, scale)
   - Directly address 3-4 key requirements from the job description
   - Use industry-specific terminology and demonstrate deep domain expertise
   - Example: "Results-driven Software Engineer with 8+ years architecting scalable enterprise solutions that increased system performance by 200% and reduced costs by $2M annually..."

2. STRATEGIC KEYWORD OPTIMIZATION:
   - Identify and extract 15-20 high-impact keywords from job description
   - Prioritize: Technical skills (programming languages, frameworks), Industry tools, Methodologies (Agile, DevOps), Certifications, Domain expertise
   - Seamlessly integrate keywords throughout summary, experience, and skills sections
   - Match exact terminology and acronyms used in job posting (e.g., "AWS" vs "Amazon Web Services")
   - Ensure 80%+ keyword match for ATS compatibility

3. ACHIEVEMENT-FOCUSED EXPERIENCE BULLETS (Most Critical):
   - Transform every bullet into a powerful achievement statement using the STAR method
   - Start with strong action verbs: Spearheaded, Architected, Engineered, Drove, Orchestrated, Transformed, Delivered, Scaled, Optimized, Led
   - ALWAYS include quantifiable metrics - be specific and impressive:
     * Revenue impact: "Increased revenue by $5.2M (35%) through..."
     * Efficiency gains: "Reduced processing time by 70% (from 2 hours to 20 minutes)..."
     * Scale: "Managed team of 15 engineers across 3 time zones..."
     * User impact: "Improved user engagement by 250%, reaching 2M+ active users..."
     * Cost savings: "Cut operational costs by $1.8M annually through automation..."
   - Show progression and increasing responsibility
   - Demonstrate technical depth and business impact
   - Each bullet should answer: What did you do? How did you do it? What was the measurable result?
   - Include relevant technologies and tools used

4. COMPREHENSIVE SKILLS ARCHITECTURE:
   - Create distinct, well-organized skill categories:
     * Core Technical Skills: (Programming languages, frameworks)
     * Tools & Technologies: (AWS, Docker, Kubernetes, etc.)
     * Methodologies: (Agile, Scrum, DevOps, CI/CD)
     * Soft Skills: (Leadership, Communication, Problem-solving)
   - Prioritize skills mentioned in job description (list first)
   - Include proficiency levels where appropriate (Expert, Advanced, Proficient)
   - List 15-25 relevant skills total

5. EDUCATION & CERTIFICATIONS:
   - Format professionally with institution, degree, graduation year
   - Include GPA if 3.5+ or honors/distinctions
   - List relevant certifications prominently
   - Add relevant coursework for recent graduates

6. ADVANCED ATS OPTIMIZATION:
   - Use standard section headings: "Professional Summary", "Professional Experience", "Technical Skills", "Education"
   - Format all dates consistently: "MM/YYYY - MM/YYYY" or "MM/YYYY - Present"
   - Avoid: tables, text boxes, headers/footers, graphics, special characters
   - Use simple bullet points (•) for lists
   - Maintain clean hierarchy with proper spacing
   - Ensure keyword density of 2-3% without appearing stuffed
   - Use both acronyms and full terms (e.g., "Machine Learning (ML)")

7. PROFESSIONAL FORMATTING & STRUCTURE:
   - Organize in reverse chronological order
   - Include clear section separators
   - Ensure consistency in formatting throughout
   - Professional job titles and company names
   - Location format: "City, State" or "City, Country"

8. AUTHENTICITY & ETHICS:
   - Enhance and optimize existing information professionally
   - NEVER fabricate experiences, skills, or achievements
   - Use realistic, impressive metrics based on typical industry standards
   - Expand on existing achievements with appropriate context and quantification
   - Stay truthful while presenting information in the best professional light

OUTPUT REQUIREMENTS:
- Return the optimized resume as a properly formatted JSON object
- Maintain the exact same structure as the input data
- Ensure every section is significantly improved and professionally crafted
- Content should be publication-ready and executive-level quality
- All bullets must have quantifiable achievements
- Professional summary must be compelling and keyword-rich

QUALITY STANDARDS:
This resume should be indistinguishable from one created by a $500/hour professional resume writer. Every word should add value. Every achievement should impress. Every section should demonstrate expertise and results.`;
  }

  parseOptimizedResume(content, originalData) {
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
      return originalData;
    } catch (error) {
      console.error('Failed to parse optimized resume:', error);
      return originalData;
    }
  }

  async calculateATSScore(resumeData, jobDescription) {
    if (!this.isEnabled()) {
      throw new Error('AI service is not configured. Please set up OpenRouter or OpenAI API key.');
    }

    try {
      const prompt = this.buildATSScorePrompt(resumeData, jobDescription);
      
      const response = await this.client.chat.completions.create({
        model: this.model,
        messages: [
          {
            role: 'system',
            content: 'You are an ATS (Applicant Tracking System) expert and technical recruiter who analyzes resume compatibility with job descriptions using industry-standard scoring criteria.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.3,
        max_tokens: 1500
      });

      const scoreContent = response.choices[0].message.content;
      return this.parseATSScore(scoreContent);
    } catch (error) {
      console.error('ATS scoring error:', error);
      throw new Error(`Failed to calculate ATS score: ${error.message}`);
    }
  }

  buildATSScorePrompt(resumeData, jobDescription) {
    return `Analyze this resume against the job description and provide an ATS compatibility score.

RESUME DATA:
${JSON.stringify(resumeData, null, 2)}

JOB DESCRIPTION:
${jobDescription}

Provide a score from 0-100 and detailed feedback in the following JSON format:
{
  "overall_score": 85,
  "keyword_match": 90,
  "formatting": 80,
  "experience_relevance": 85,
  "skills_match": 88,
  "suggestions": [
    "Add more specific technical skills mentioned in the job description",
    "Include measurable achievements in your experience bullets",
    "Add relevant certifications if you have them"
  ],
  "matched_keywords": ["keyword1", "keyword2"],
  "missing_keywords": ["keyword3", "keyword4"]
}`;
  }

  parseATSScore(content) {
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
      return {
        overall_score: 0,
        keyword_match: 0,
        formatting: 0,
        experience_relevance: 0,
        skills_match: 0,
        suggestions: ['Unable to generate score'],
        matched_keywords: [],
        missing_keywords: []
      };
    } catch (error) {
      console.error('Failed to parse ATS score:', error);
      return {
        overall_score: 0,
        suggestions: ['Error calculating score'],
        matched_keywords: [],
        missing_keywords: []
      };
    }
  }

  async generateCoverLetter(resumeData, jobDescription, companyName, tone = 'professional') {
    if (!this.isEnabled()) {
      throw new Error('AI service is not configured. Please set up OpenRouter or OpenAI API key.');
    }

    try {
      const prompt = this.buildCoverLetterPrompt(resumeData, jobDescription, companyName, tone);
      
      const response = await this.client.chat.completions.create({
        model: this.model,
        messages: [
          {
            role: 'system',
            content: 'You are an expert cover letter writer who creates compelling, personalized cover letters that capture attention and demonstrate perfect fit for the role.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.8,
        max_tokens: 1000
      });

      return response.choices[0].message.content.trim();
    } catch (error) {
      console.error('Cover letter generation error:', error);
      throw new Error(`Failed to generate cover letter: ${error.message}`);
    }
  }

  buildCoverLetterPrompt(resumeData, jobDescription, companyName, tone) {
    const name = resumeData.contact?.name || 'Candidate';
    
    return `Write a compelling 3-paragraph cover letter for this candidate applying to ${companyName}.

CANDIDATE PROFILE:
${JSON.stringify(resumeData, null, 2)}

JOB DESCRIPTION:
${jobDescription}

TONE: ${tone}

REQUIREMENTS:
1. Start with a strong opening that shows enthusiasm and relevant qualifications
2. Second paragraph: Highlight 2-3 key achievements that match the job requirements
3. Third paragraph: Express interest and call to action
4. Keep it concise (250-350 words)
5. Make it personal and specific to this role
6. Use the candidate's actual name: ${name}

Format as a professional business letter without address headers.`;
  }

  async enhanceJobDescription(resumeData, rawJobDescription) {
    if (!this.isEnabled()) {
      return { clean_description: rawJobDescription };
    }

    try {
      const prompt = `Extract and structure the following job description into a clean format:

${rawJobDescription}

Return a JSON object with:
{
  "title": "Job Title",
  "company": "Company Name",
  "location": "Location",
  "key_requirements": ["requirement1", "requirement2"],
  "key_skills": ["skill1", "skill2"],
  "clean_description": "cleaned and formatted description"
}`;

      const response = await this.client.chat.completions.create({
        model: this.model,
        messages: [
          { role: 'system', content: 'You are a job description parser and analyzer.' },
          { role: 'user', content: prompt }
        ],
        temperature: 0.3,
        max_tokens: 1000
      });

      const content = response.choices[0].message.content;
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
      return { clean_description: rawJobDescription };
    } catch (error) {
      console.error('Job description enhancement error:', error);
      return { clean_description: rawJobDescription };
    }
  }

  checkUsageLimit(user) {
    const freeLimit = 2;
    const usageCount = user.resume_optimizations_count || 0;
    
    if (user.subscription_tier === 'free' && usageCount >= freeLimit) {
      throw new Error(`Free tier limit reached. You've used ${usageCount}/${freeLimit} optimizations this month.`);
    }
    
    return true;
  }
}

module.exports = new ResumeAI();
