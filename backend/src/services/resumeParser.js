const mammoth = require('mammoth');
const pdfParse = require('pdf-parse');
const Tesseract = require('tesseract.js');
const fs = require('fs').promises;

class ResumeParser {
  async parseResume(filePath, mimeType) {
    try {
      let text = '';

      if (mimeType === 'application/pdf') {
        text = await this.parsePDF(filePath);
      } else if (mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
        text = await this.parseWord(filePath);
      } else if (mimeType.startsWith('image/')) {
        text = await this.parseImage(filePath);
      } else {
        throw new Error('Unsupported file type');
      }

      const structuredData = await this.extractStructuredData(text);
      return {
        raw_text: text,
        ...structuredData
      };
    } catch (error) {
      console.error('Resume parsing error:', error);
      throw new Error(`Failed to parse resume: ${error.message}`);
    }
  }

  async parsePDF(filePath) {
    const dataBuffer = await fs.readFile(filePath);
    const data = await pdfParse(dataBuffer);
    return data.text;
  }

  async parseWord(filePath) {
    const result = await mammoth.extractRawText({ path: filePath });
    return result.value;
  }

  async parseImage(filePath) {
    const { data: { text } } = await Tesseract.recognize(filePath, 'eng', {
      logger: m => console.log(m)
    });
    return text;
  }

  async extractStructuredData(text) {
    const data = {
      contact: this.extractContact(text),
      summary: this.extractSummary(text),
      experience: this.extractExperience(text),
      education: this.extractEducation(text),
      skills: this.extractSkills(text),
      certifications: this.extractCertifications(text),
      languages: this.extractLanguages(text)
    };

    return data;
  }

  extractContact(text) {
    const contact = {
      name: null,
      email: null,
      phone: null,
      location: null,
      linkedin: null,
      github: null,
      portfolio: null
    };

    const emailRegex = /([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9_-]+)/gi;
    const emailMatch = text.match(emailRegex);
    if (emailMatch) contact.email = emailMatch[0];

    const phoneRegex = /(\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/g;
    const phoneMatch = text.match(phoneRegex);
    if (phoneMatch) contact.phone = phoneMatch[0];

    const linkedinRegex = /(linkedin\.com\/in\/[\w-]+)/gi;
    const linkedinMatch = text.match(linkedinRegex);
    if (linkedinMatch) contact.linkedin = `https://${linkedinMatch[0]}`;

    const githubRegex = /(github\.com\/[\w-]+)/gi;
    const githubMatch = text.match(githubRegex);
    if (githubMatch) contact.github = `https://${githubMatch[0]}`;

    const lines = text.split('\n');
    if (lines.length > 0) {
      contact.name = lines[0].trim();
    }

    return contact;
  }

  extractSummary(text) {
    const summaryKeywords = ['summary', 'profile', 'objective', 'about'];
    const lines = text.split('\n');
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].toLowerCase();
      if (summaryKeywords.some(keyword => line.includes(keyword))) {
        const summaryLines = [];
        for (let j = i + 1; j < lines.length && j < i + 5; j++) {
          if (lines[j].trim() && !this.isHeaderLine(lines[j])) {
            summaryLines.push(lines[j].trim());
          } else {
            break;
          }
        }
        return summaryLines.join(' ');
      }
    }
    return null;
  }

  extractExperience(text) {
    const experiences = [];
    const experienceKeywords = ['experience', 'employment', 'work history'];
    const lines = text.split('\n');
    
    let inExperienceSection = false;
    let currentExp = null;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      const lowerLine = line.toLowerCase();

      if (experienceKeywords.some(keyword => lowerLine.includes(keyword))) {
        inExperienceSection = true;
        continue;
      }

      if (inExperienceSection) {
        if (this.isHeaderLine(line) && !experienceKeywords.some(k => lowerLine.includes(k))) {
          break;
        }

        const yearMatch = line.match(/\b(19|20)\d{2}\b/);
        if (yearMatch && line.length < 100) {
          if (currentExp) {
            experiences.push(currentExp);
          }
          currentExp = {
            title: null,
            company: line.split(/[-–—|]/)[0].trim(),
            duration: line,
            description: []
          };
        } else if (currentExp && line.startsWith('•') || line.startsWith('-') || line.startsWith('*')) {
          currentExp.description.push(line.replace(/^[•\-*]\s*/, ''));
        } else if (currentExp && line && line.length > 20) {
          currentExp.description.push(line);
        }
      }
    }

    if (currentExp) {
      experiences.push(currentExp);
    }

    return experiences.map(exp => ({
      ...exp,
      description: exp.description.join(' ')
    }));
  }

  extractEducation(text) {
    const education = [];
    const educationKeywords = ['education', 'academic', 'qualification'];
    const lines = text.split('\n');
    
    let inEducationSection = false;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      const lowerLine = line.toLowerCase();

      if (educationKeywords.some(keyword => lowerLine.includes(keyword))) {
        inEducationSection = true;
        continue;
      }

      if (inEducationSection) {
        if (this.isHeaderLine(line) && !educationKeywords.some(k => lowerLine.includes(k))) {
          break;
        }

        if (line && (line.length > 10 || line.match(/\b(19|20)\d{2}\b/))) {
          education.push(line);
        }
      }
    }

    return education;
  }

  extractSkills(text) {
    const skills = [];
    const skillsKeywords = ['skills', 'technologies', 'technical skills', 'competencies'];
    const lines = text.split('\n');
    
    let inSkillsSection = false;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      const lowerLine = line.toLowerCase();

      if (skillsKeywords.some(keyword => lowerLine.includes(keyword))) {
        inSkillsSection = true;
        continue;
      }

      if (inSkillsSection) {
        if (this.isHeaderLine(line) && !skillsKeywords.some(k => lowerLine.includes(k))) {
          break;
        }

        if (line) {
          const skillsList = line.split(/[,;|•]/);
          skills.push(...skillsList.map(s => s.trim()).filter(s => s.length > 0));
        }
      }
    }

    return skills;
  }

  extractCertifications(text) {
    const certifications = [];
    const certKeywords = ['certification', 'certificate', 'licenses'];
    const lines = text.split('\n');
    
    let inCertSection = false;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      const lowerLine = line.toLowerCase();

      if (certKeywords.some(keyword => lowerLine.includes(keyword))) {
        inCertSection = true;
        continue;
      }

      if (inCertSection) {
        if (this.isHeaderLine(line) && !certKeywords.some(k => lowerLine.includes(k))) {
          break;
        }

        if (line && line.length > 5) {
          certifications.push(line);
        }
      }
    }

    return certifications;
  }

  extractLanguages(text) {
    const commonLanguages = [
      'english', 'spanish', 'french', 'german', 'chinese', 'japanese', 
      'korean', 'arabic', 'hindi', 'portuguese', 'russian', 'italian'
    ];
    
    const languages = [];
    const lowerText = text.toLowerCase();
    
    commonLanguages.forEach(lang => {
      if (lowerText.includes(lang)) {
        languages.push(lang.charAt(0).toUpperCase() + lang.slice(1));
      }
    });

    return [...new Set(languages)];
  }

  isHeaderLine(line) {
    const headerKeywords = [
      'experience', 'education', 'skills', 'certification', 
      'projects', 'awards', 'languages', 'references'
    ];
    const lowerLine = line.toLowerCase().trim();
    return headerKeywords.some(keyword => lowerLine === keyword || lowerLine.includes(keyword + ':'));
  }
}

module.exports = new ResumeParser();
