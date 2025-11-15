const PDFDocument = require('pdfkit');
const { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType } = require('docx');
const fs = require('fs').promises;
const path = require('path');

class ResumeExport {
  async generatePDF(resumeData, outputPath) {
    return new Promise((resolve, reject) => {
      try {
        const doc = new PDFDocument({
          size: 'A4',
          margins: { top: 50, bottom: 50, left: 60, right: 60 }
        });

        const stream = require('fs').createWriteStream(outputPath);
        doc.pipe(stream);

        const contact = resumeData.contact || {};
        const name = contact.name || 'Candidate Name';
        
        // Modern header with colored background
        const headerHeight = 100;
        doc.rect(0, 0, doc.page.width, headerHeight).fill('#2c3e50');
        
        // Name in white on colored background
        doc.fontSize(28).font('Helvetica-Bold').fillColor('#ffffff')
           .text(name.toUpperCase(), 60, 25, { align: 'center', width: doc.page.width - 120 });
        
        // Target role if available
        if (resumeData.targetRole) {
          doc.fontSize(13).font('Helvetica').fillColor('#ecf0f1')
             .text(resumeData.targetRole, 60, 55, { align: 'center', width: doc.page.width - 120 });
        }

        // Contact info in header
        doc.fontSize(9).font('Helvetica').fillColor('#bdc3c7');
        const contactLine = [contact.email, contact.phone, contact.location || contact.address]
          .filter(Boolean).join(' | ');
        
        if (contactLine) {
          doc.text(contactLine, 60, resumeData.targetRole ? 75 : 55, { 
            align: 'center', 
            width: doc.page.width - 120 
          });
        }
        
        // Links on next line if available
        const links = [contact.linkedin, contact.github, contact.portfolio].filter(Boolean);
        if (links.length > 0) {
          doc.fontSize(8).fillColor('#3498db')
             .text(links.join(' | '), 60, doc.y + 2, { 
               align: 'center', 
               width: doc.page.width - 120 
             });
        }
        
        // Reset position after header
        doc.y = headerHeight + 25;

        // Helper function for section headers
        const addSectionHeader = (title) => {
          doc.fontSize(14).font('Helvetica-Bold').fillColor('#2c3e50').text(title);
          doc.moveDown(0.15);
          const lineY = doc.y;
          doc.strokeColor('#3498db').lineWidth(2.5)
             .moveTo(60, lineY)
             .lineTo(doc.page.width - 60, lineY)
             .stroke();
          doc.moveDown(0.6);
        };

        if (resumeData.summary) {
          addSectionHeader('PROFESSIONAL SUMMARY');
          doc.fontSize(10.5).font('Helvetica').fillColor('#34495e')
             .text(resumeData.summary, { align: 'justify', lineGap: 3 });
          doc.moveDown(1.3);
        }

        if (resumeData.experience && resumeData.experience.length > 0) {
          addSectionHeader('PROFESSIONAL EXPERIENCE');
          
          resumeData.experience.forEach((exp, index) => {
            // Job title with accent color
            doc.fontSize(12).font('Helvetica-Bold').fillColor('#2c3e50')
               .text(exp.title || exp.position || exp.company);
            
            // Company and location
            const company = exp.company || '';
            const location = exp.location && exp.location.trim() && exp.location !== 'Not specified' ? exp.location : '';
            const duration = exp.duration || `${exp.startDate || ''} - ${exp.endDate || ''}`;
            
            doc.fontSize(10.5).font('Helvetica-Bold').fillColor('#3498db');
            if (company && location) {
              doc.text(`${company} | ${location}`, { continued: false });
            } else if (company) {
              doc.text(company, { continued: false });
            }
            
            // Duration
            doc.fontSize(9.5).font('Helvetica').fillColor('#7f8c8d').text(duration);
            doc.moveDown(0.4);
            
            // Achievements with modern bullets
            if (exp.achievements && Array.isArray(exp.achievements)) {
              doc.fontSize(10).font('Helvetica').fillColor('#34495e');
              exp.achievements.forEach((achievement, i) => {
                const bulletY = doc.y;
                // Modern square bullet
                doc.rect(65, bulletY + 3, 4, 4).fill('#3498db');
                doc.text(achievement, 75, bulletY, { 
                  width: doc.page.width - 135,
                  align: 'left',
                  lineGap: 2.5
                });
                if (i < exp.achievements.length - 1) doc.moveDown(0.25);
              });
            } else if (exp.description) {
              doc.fontSize(10).font('Helvetica').fillColor('#34495e')
                 .text(exp.description, { align: 'justify', lineGap: 2.5 });
            }
            
            if (index < resumeData.experience.length - 1) {
              doc.moveDown(0.9);
              // Subtle separator between experiences
              doc.strokeColor('#ecf0f1').lineWidth(0.5)
                 .moveTo(60, doc.y)
                 .lineTo(doc.page.width - 60, doc.y)
                 .stroke();
              doc.moveDown(0.9);
            }
          });
          doc.moveDown(1.3);
        }

        if (resumeData.education && resumeData.education.length > 0) {
          addSectionHeader('EDUCATION');
          
          resumeData.education.forEach((edu, index) => {
            if (typeof edu === 'string') {
              doc.fontSize(10.5).font('Helvetica').fillColor('#34495e').text(`• ${edu}`);
            } else {
              // Degree in bold
              doc.fontSize(11).font('Helvetica-Bold').fillColor('#2c3e50')
                 .text(edu.degree || 'Degree', { continued: false });
              
              // Institution with accent color
              doc.fontSize(10.5).font('Helvetica-Bold').fillColor('#3498db')
                 .text(edu.institution || 'Institution', { continued: false });
              
              // Location and date
              const details = [];
              if (edu.location && edu.location.trim() && edu.location !== 'Not specified') details.push(edu.location);
              if (edu.graduationDate && edu.graduationDate.trim()) details.push(edu.graduationDate);
              if (details.length > 0) {
                doc.fontSize(9.5).font('Helvetica').fillColor('#7f8c8d').text(details.join(' | '));
              }
              
              // GPA with highlight
              if (edu.gpa && edu.gpa.trim()) {
                doc.fontSize(9.5).font('Helvetica-Bold').fillColor('#27ae60').text(`GPA: ${edu.gpa}`);
              }
              
              // Coursework
              if (edu.coursework && edu.coursework.trim()) {
                doc.fontSize(9.5).font('Helvetica').fillColor('#34495e')
                   .text(edu.coursework, { lineGap: 1.5 });
              }
              
              // Honors
              if (edu.honors && Array.isArray(edu.honors) && edu.honors.length > 0) {
                doc.fontSize(9.5).font('Helvetica-Oblique').fillColor('#7f8c8d')
                   .text(`Honors: ${edu.honors.join(', ')}`);
              }
            }
            if (index < resumeData.education.length - 1) doc.moveDown(0.6);
          });
          doc.moveDown(1.3);
        }

        const skills = resumeData.skills;
        if (skills) {
          const hasSkills = (skills.technical && skills.technical.length > 0) || 
                           (skills.tools && skills.tools.length > 0) || 
                           (skills.soft && skills.soft.length > 0);
          
          if (hasSkills) {
            addSectionHeader('TECHNICAL SKILLS');
            
            if (skills.technical && skills.technical.length > 0) {
              doc.fontSize(10.5).font('Helvetica-Bold').fillColor('#2c3e50')
                 .text('Programming & Technologies:', { continued: false });
              doc.moveDown(0.2);
              doc.fontSize(10).font('Helvetica').fillColor('#34495e')
                 .text(skills.technical.join(', '), { lineGap: 2 });
              doc.moveDown(0.5);
            }
            
            if (skills.tools && skills.tools.length > 0) {
              doc.fontSize(10.5).font('Helvetica-Bold').fillColor('#2c3e50')
                 .text('Tools & Frameworks:', { continued: false });
              doc.moveDown(0.2);
              doc.fontSize(10).font('Helvetica').fillColor('#34495e')
                 .text(skills.tools.join(', '), { lineGap: 2 });
              doc.moveDown(0.5);
            }
            
            if (skills.soft && skills.soft.length > 0) {
              doc.fontSize(10.5).font('Helvetica-Bold').fillColor('#2c3e50')
                 .text('Professional Skills:', { continued: false });
              doc.moveDown(0.2);
              doc.fontSize(10).font('Helvetica').fillColor('#34495e')
                 .text(skills.soft.join(', '), { lineGap: 2 });
            }
            doc.moveDown(1.3);
          }
        }

        if (resumeData.certifications && resumeData.certifications.length > 0) {
          addSectionHeader('CERTIFICATIONS');
          doc.fontSize(10.5).font('Helvetica').fillColor('#34495e');
          resumeData.certifications.forEach(cert => {
            const bulletY = doc.y;
            doc.circle(65, bulletY + 4, 2).fill('#27ae60');
            doc.text(cert, 75, bulletY, { width: doc.page.width - 135 });
            doc.moveDown(0.3);
          });
          doc.moveDown(1);
        }

        if (resumeData.languages && resumeData.languages.length > 0) {
          addSectionHeader('LANGUAGES');
          doc.fontSize(10.5).font('Helvetica').fillColor('#34495e')
             .text(resumeData.languages.join(' | '));
        }

        doc.end();
        stream.on('finish', () => resolve(outputPath));
        stream.on('error', reject);
      } catch (error) {
        reject(error);
      }
    });
  }

  async generateWord(resumeData, outputPath) {
    try {
      const contact = resumeData.contact || {};
      const sections = [];

      sections.push(
        new Paragraph({
          text: contact.name || 'Candidate Name',
          heading: HeadingLevel.TITLE,
          alignment: AlignmentType.CENTER,
          spacing: { after: 200 }
        })
      );

      const contactInfo = [
        contact.email,
        contact.phone,
        contact.address || contact.location,
        contact.linkedin,
        contact.github,
        contact.portfolio
      ].filter(Boolean).join(' | ');

      if (contactInfo) {
        sections.push(
          new Paragraph({
            text: contactInfo,
            alignment: AlignmentType.CENTER,
            spacing: { after: 400 }
          })
        );
      }

      if (resumeData.summary) {
        sections.push(
          new Paragraph({
            text: 'PROFESSIONAL SUMMARY',
            heading: HeadingLevel.HEADING_1,
            spacing: { before: 200, after: 100 }
          }),
          new Paragraph({
            text: resumeData.summary,
            spacing: { after: 300 }
          })
        );
      }

      if (resumeData.experience && resumeData.experience.length > 0) {
        sections.push(
          new Paragraph({
            text: 'EXPERIENCE',
            heading: HeadingLevel.HEADING_1,
            spacing: { before: 200, after: 100 }
          })
        );

        resumeData.experience.forEach(exp => {
          const duration = exp.duration || `${exp.startDate || ''} - ${exp.endDate || ''}`;
          const company = exp.company ? `${exp.company}` : '';
          const location = exp.location && exp.location.trim() && exp.location !== 'Not specified' ? ` | ${exp.location}` : '';
          
          sections.push(
            new Paragraph({
              children: [
                new TextRun({
                  text: exp.title || exp.position || exp.company,
                  bold: true
                })
              ],
              spacing: { after: 50 }
            }),
            new Paragraph({
              children: [
                new TextRun({
                  text: `${company}${location}`,
                  italics: true
                })
              ],
              spacing: { after: 50 }
            }),
            new Paragraph({
              children: [
                new TextRun({
                  text: duration,
                  italics: true
                })
              ],
              spacing: { after: 100 }
            })
          );
          
          if (exp.achievements && Array.isArray(exp.achievements)) {
            exp.achievements.forEach(achievement => {
              sections.push(
                new Paragraph({
                  text: `• ${achievement}`,
                  spacing: { after: 50 }
                })
              );
            });
          } else if (exp.description) {
            sections.push(
              new Paragraph({
                text: exp.description,
                spacing: { after: 100 }
              })
            );
          }
          
          sections.push(
            new Paragraph({
              text: '',
              spacing: { after: 100 }
            })
          );
        });
      }

      if (resumeData.education && resumeData.education.length > 0) {
        sections.push(
          new Paragraph({
            text: 'EDUCATION',
            heading: HeadingLevel.HEADING_1,
            spacing: { before: 200, after: 100 }
          })
        );

        resumeData.education.forEach(edu => {
          if (typeof edu === 'string') {
            sections.push(
              new Paragraph({
                text: `• ${edu}`,
                spacing: { after: 100 }
              })
            );
          } else {
            const location = edu.location && edu.location.trim() && edu.location !== 'Not specified' ? `, ${edu.location}` : '';
            const gpa = edu.gpa && edu.gpa.trim() ? `, GPA: ${edu.gpa}` : '';
            const eduText = `${edu.degree || ''} - ${edu.institution || ''}${location}${edu.graduationDate ? ` (${edu.graduationDate})` : ''}${gpa}`;
            sections.push(
              new Paragraph({
                text: `• ${eduText.trim()}`,
                spacing: { after: 100 }
              })
            );
          }
        });
      }

      const skills = resumeData.skills;
      if (skills) {
        const hasSkills = (skills.technical && skills.technical.length > 0) || 
                         (skills.tools && skills.tools.length > 0) || 
                         (skills.soft && skills.soft.length > 0);
        
        if (hasSkills) {
          sections.push(
            new Paragraph({
              text: 'SKILLS',
              heading: HeadingLevel.HEADING_1,
              spacing: { before: 200, after: 100 }
            })
          );
          
          if (skills.technical && skills.technical.length > 0) {
            sections.push(
              new Paragraph({
                children: [
                  new TextRun({ text: 'Technical: ', bold: true }),
                  new TextRun({ text: skills.technical.join(', ') })
                ],
                spacing: { after: 100 }
              })
            );
          }
          
          if (skills.tools && skills.tools.length > 0) {
            sections.push(
              new Paragraph({
                children: [
                  new TextRun({ text: 'Tools & Technologies: ', bold: true }),
                  new TextRun({ text: skills.tools.join(', ') })
                ],
                spacing: { after: 100 }
              })
            );
          }
          
          if (skills.soft && skills.soft.length > 0) {
            sections.push(
              new Paragraph({
                children: [
                  new TextRun({ text: 'Soft Skills: ', bold: true }),
                  new TextRun({ text: skills.soft.join(', ') })
                ],
                spacing: { after: 200 }
              })
            );
          }
        }
      }

      if (resumeData.certifications && resumeData.certifications.length > 0) {
        sections.push(
          new Paragraph({
            text: 'CERTIFICATIONS',
            heading: HeadingLevel.HEADING_1,
            spacing: { before: 200, after: 100 }
          })
        );

        resumeData.certifications.forEach(cert => {
          sections.push(
            new Paragraph({
              text: `• ${cert}`,
              spacing: { after: 100 }
            })
          );
        });
      }

      if (resumeData.languages && resumeData.languages.length > 0) {
        sections.push(
          new Paragraph({
            text: 'LANGUAGES',
            heading: HeadingLevel.HEADING_1,
            spacing: { before: 200, after: 100 }
          }),
          new Paragraph({
            text: resumeData.languages.join(', ')
          })
        );
      }

      const doc = new Document({
        sections: [{
          properties: {},
          children: sections
        }]
      });

      const buffer = await Packer.toBuffer(doc);
      await fs.writeFile(outputPath, buffer);
      return outputPath;
    } catch (error) {
      console.error('Word generation error:', error);
      throw new Error(`Failed to generate Word document: ${error.message}`);
    }
  }

  async generateCoverLetterPDF(coverLetterText, candidateName, outputPath) {
    return new Promise((resolve, reject) => {
      try {
        const doc = new PDFDocument({
          size: 'A4',
          margins: { top: 50, bottom: 50, left: 50, right: 50 }
        });

        const stream = require('fs').createWriteStream(outputPath);
        doc.pipe(stream);

        doc.fontSize(12).font('Helvetica').text(coverLetterText, {
          align: 'justify',
          lineGap: 5
        });

        doc.end();
        stream.on('finish', () => resolve(outputPath));
        stream.on('error', reject);
      } catch (error) {
        reject(error);
      }
    });
  }
}

module.exports = new ResumeExport();
