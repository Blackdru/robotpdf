const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const fs = require('fs').promises;
const { supabase, supabaseAdmin } = require('../config/supabase');
const resumeParser = require('../services/resumeParser');
const resumeAI = require('../services/resumeAI');
const resumeGenerator = require('../services/resumeGenerator');
const resumeExport = require('../services/resumeExport');
const { authenticateUser } = require('../middleware/auth');

const upload = multer({
  dest: path.join(__dirname, '../../temp'),
  limits: {
    fileSize: 10 * 1024 * 1024
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/msword',
      'image/png',
      'image/jpeg',
      'image/jpg'
    ];
    
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only PDF, Word, and images are allowed.'));
    }
  }
});

router.post('/upload', authenticateUser, upload.single('resume'), async (req, res) => {
  let tempFilePath = null;
  
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    tempFilePath = req.file.path;
    console.log('Parsing resume:', req.file.originalname);

    const parsedData = await resumeParser.parseResume(
      tempFilePath,
      req.file.mimetype
    );

    const fileBuffer = await fs.readFile(tempFilePath);
    const fileName = `${uuidv4()}_${req.file.originalname}`;
    const storagePath = `resumes/${req.user.id}/${fileName}`;

    const { data: uploadData, error: uploadError } = await supabaseAdmin
      .storage
      .from('user-files')
      .upload(storagePath, fileBuffer, {
        contentType: req.file.mimetype,
        upsert: false
      });

    if (uploadError) {
      console.error('Storage upload error:', uploadError);
      throw new Error('Failed to upload file to storage');
    }

    const { data: resumeData, error: dbError } = await supabaseAdmin
      .from('resumes')
      .insert({
        user_id: req.user.id,
        original_file: storagePath,
        filename: req.file.originalname,
        file_size: req.file.size,
        file_type: req.file.mimetype,
        parsed: parsedData,
        status: 'uploaded'
      })
      .select()
      .single();

    if (dbError) {
      console.error('Database error:', dbError);
      throw new Error('Failed to save resume data');
    }

    await fs.unlink(tempFilePath).catch(console.error);

    res.json({
      success: true,
      resume: resumeData,
      parsed: parsedData
    });
  } catch (error) {
    console.error('Upload error:', error);
    if (tempFilePath) {
      await fs.unlink(tempFilePath).catch(console.error);
    }
    res.status(500).json({
      error: error.message || 'Failed to process resume'
    });
  }
});

router.post('/:id/optimize', authenticateUser, async (req, res) => {
  try {
    const { id } = req.params;
    const { job_description, tone = 'professional' } = req.body;

    if (!job_description) {
      return res.status(400).json({ error: 'Job description is required' });
    }

    const { data: resume, error: fetchError } = await supabaseAdmin
      .from('resumes')
      .select('*')
      .eq('id', id)
      .eq('user_id', req.user.id)
      .single();

    if (fetchError || !resume) {
      return res.status(404).json({ error: 'Resume not found' });
    }

    const { data: user } = await supabaseAdmin
      .from('users')
      .select('subscription_tier, resume_optimizations_count')
      .eq('id', req.user.id)
      .single();

    resumeAI.checkUsageLimit(user);

    console.log('Optimizing resume with AI...');
    const optimized = await resumeAI.optimizeResume(
      resume.parsed,
      job_description,
      tone
    );

    await supabaseAdmin
      .from('users')
      .update({
        resume_optimizations_count: (user.resume_optimizations_count || 0) + 1
      })
      .eq('id', req.user.id);

    const { data: updated, error: updateError } = await supabaseAdmin
      .from('resumes')
      .update({
        optimized: optimized,
        status: 'optimized'
      })
      .eq('id', id)
      .select()
      .single();

    if (updateError) {
      throw new Error('Failed to save optimized resume');
    }

    res.json({
      success: true,
      resume: updated,
      optimized: optimized
    });
  } catch (error) {
    console.error('Optimization error:', error);
    res.status(500).json({
      error: error.message || 'Failed to optimize resume'
    });
  }
});

router.post('/:id/score', authenticateUser, async (req, res) => {
  try {
    const { id } = req.params;
    const { job_description } = req.body;

    if (!job_description) {
      return res.status(400).json({ error: 'Job description is required' });
    }

    const { data: resume, error: fetchError } = await supabaseAdmin
      .from('resumes')
      .select('*')
      .eq('id', id)
      .eq('user_id', req.user.id)
      .single();

    if (fetchError || !resume) {
      return res.status(404).json({ error: 'Resume not found' });
    }

    const resumeToScore = resume.optimized || resume.parsed;
    console.log('Calculating ATS score...');
    const scoreData = await resumeAI.calculateATSScore(resumeToScore, job_description);

    const { data: updated, error: updateError } = await supabaseAdmin
      .from('resumes')
      .update({
        ats_score: scoreData.overall_score,
        ats_feedback: scoreData
      })
      .eq('id', id)
      .select()
      .single();

    if (updateError) {
      throw new Error('Failed to save ATS score');
    }

    res.json({
      success: true,
      score: scoreData
    });
  } catch (error) {
    console.error('Scoring error:', error);
    res.status(500).json({
      error: error.message || 'Failed to calculate ATS score'
    });
  }
});

router.post('/:id/cover-letter', authenticateUser, async (req, res) => {
  try {
    const { id } = req.params;
    const { job_description, company_name, tone = 'professional' } = req.body;

    if (!job_description || !company_name) {
      return res.status(400).json({ error: 'Job description and company name are required' });
    }

    const { data: resume, error: fetchError } = await supabaseAdmin
      .from('resumes')
      .select('*')
      .eq('id', id)
      .eq('user_id', req.user.id)
      .single();

    if (fetchError || !resume) {
      return res.status(404).json({ error: 'Resume not found' });
    }

    const resumeData = resume.optimized || resume.parsed;
    console.log('Generating cover letter...');
    const coverLetter = await resumeAI.generateCoverLetter(
      resumeData,
      job_description,
      company_name,
      tone
    );

    const { data: updated, error: updateError } = await supabaseAdmin
      .from('resumes')
      .update({
        cover_letter: coverLetter
      })
      .eq('id', id)
      .select()
      .single();

    if (updateError) {
      throw new Error('Failed to save cover letter');
    }

    res.json({
      success: true,
      cover_letter: coverLetter
    });
  } catch (error) {
    console.error('Cover letter generation error:', error);
    res.status(500).json({
      error: error.message || 'Failed to generate cover letter'
    });
  }
});

router.get('/history', authenticateUser, async (req, res) => {
  try {
    const { data: resumes, error } = await supabaseAdmin
      .from('resumes')
      .select('*')
      .eq('user_id', req.user.id)
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error('Failed to fetch resume history');
    }

    res.json({
      success: true,
      resumes: resumes || []
    });
  } catch (error) {
    console.error('History fetch error:', error);
    res.status(500).json({
      error: error.message || 'Failed to fetch history'
    });
  }
});

router.get('/:id/download', authenticateUser, async (req, res) => {
  try {
    const { id } = req.params;
    const { format = 'pdf', version = 'optimized' } = req.query;

    const { data: resume, error: fetchError } = await supabaseAdmin
      .from('resumes')
      .select('*')
      .eq('id', id)
      .eq('user_id', req.user.id)
      .single();

    if (fetchError || !resume) {
      return res.status(404).json({ error: 'Resume not found' });
    }

    const resumeData = version === 'optimized' && resume.optimized 
      ? resume.optimized 
      : resume.parsed;

    const tempDir = path.join(__dirname, '../../temp');
    const filename = `resume_${id}_${Date.now()}`;
    let outputPath;

    if (format === 'pdf') {
      outputPath = path.join(tempDir, `${filename}.pdf`);
      await resumeExport.generatePDF(resumeData, outputPath);
      res.setHeader('Content-Type', 'application/pdf');
    } else if (format === 'docx') {
      outputPath = path.join(tempDir, `${filename}.docx`);
      await resumeExport.generateWord(resumeData, outputPath);
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
    } else {
      return res.status(400).json({ error: 'Invalid format' });
    }

    res.download(outputPath, `resume.${format}`, async (err) => {
      await fs.unlink(outputPath).catch(console.error);
      if (err) {
        console.error('Download error:', err);
      }
    });
  } catch (error) {
    console.error('Download error:', error);
    res.status(500).json({
      error: error.message || 'Failed to download resume'
    });
  }
});

// Generate resume from scratch with AI
router.post('/generate', authenticateUser, async (req, res) => {
  try {
    const { userData, options } = req.body;

    if (!userData || !userData.name || !userData.email) {
      return res.status(400).json({ 
        error: 'User data with name and email is required' 
      });
    }

    // Validate mandatory fields
    const validation = resumeGenerator.validateMandatoryFields(userData);
    if (!validation.isValid) {
      return res.status(400).json({
        error: `Missing mandatory fields: ${validation.missingFields.join(', ')}`,
        missingFields: validation.missingFields
      });
    }

    console.log('Generating resume with AI...');
    const generatedResume = await resumeGenerator.generateResume(userData, options);

    // Save generated resume to database
    const { data: resumeData, error: dbError } = await supabaseAdmin
      .from('resumes')
      .insert({
        user_id: req.user.id,
        filename: `AI_Generated_Resume_${Date.now()}.pdf`,
        parsed: generatedResume,
        status: 'generated',
        metadata: {
          generatedWith: 'AI',
          template: options?.template || 'professional',
          targetRole: options?.targetRole || 'General'
        }
      })
      .select()
      .single();

    if (dbError) {
      console.error('Database error:', dbError);
      throw new Error('Failed to save generated resume');
    }

    res.json({
      success: true,
      resume: resumeData,
      generated: generatedResume
    });
  } catch (error) {
    console.error('Resume generation error:', error);
    res.status(500).json({
      error: error.message || 'Failed to generate resume'
    });
  }
});

// Enhance specific resume section
router.post('/:id/enhance-section', authenticateUser, async (req, res) => {
  try {
    const { id } = req.params;
    const { sectionType, content, context } = req.body;

    if (!sectionType || !content) {
      return res.status(400).json({ 
        error: 'Section type and content are required' 
      });
    }

    const { data: resume, error: fetchError } = await supabaseAdmin
      .from('resumes')
      .select('*')
      .eq('id', id)
      .eq('user_id', req.user.id)
      .single();

    if (fetchError || !resume) {
      return res.status(404).json({ error: 'Resume not found' });
    }

    console.log(`Enhancing ${sectionType} section...`);
    const enhanced = await resumeGenerator.enhanceSection(sectionType, content, context);

    res.json({
      success: true,
      enhanced: enhanced,
      sectionType: sectionType
    });
  } catch (error) {
    console.error('Section enhancement error:', error);
    res.status(500).json({
      error: error.message || 'Failed to enhance section'
    });
  }
});

// Generate multiple resume versions for different roles
router.post('/generate-multiple', authenticateUser, async (req, res) => {
  try {
    const { userData, targetRoles } = req.body;

    if (!userData || !targetRoles || !Array.isArray(targetRoles)) {
      return res.status(400).json({ 
        error: 'User data and target roles array are required' 
      });
    }

    console.log(`Generating ${targetRoles.length} resume versions...`);
    const versions = await resumeGenerator.generateMultipleVersions(userData, targetRoles);

    // Save all versions to database
    const savedVersions = [];
    for (const version of versions) {
      const { data: resumeData } = await supabaseAdmin
        .from('resumes')
        .insert({
          user_id: req.user.id,
          filename: `${version.role.replace(/\s+/g, '_')}_Resume.pdf`,
          parsed: version.resume,
          status: 'generated',
          metadata: {
            generatedWith: 'AI',
            targetRole: version.role,
            industry: version.industry
          }
        })
        .select()
        .single();

      if (resumeData) {
        savedVersions.push(resumeData);
      }
    }

    res.json({
      success: true,
      versions: savedVersions,
      count: savedVersions.length
    });
  } catch (error) {
    console.error('Multiple resume generation error:', error);
    res.status(500).json({
      error: error.message || 'Failed to generate multiple resumes'
    });
  }
});

// Get improvement suggestions for a resume
router.post('/:id/suggestions', authenticateUser, async (req, res) => {
  try {
    const { id } = req.params;

    const { data: resume, error: fetchError } = await supabaseAdmin
      .from('resumes')
      .select('*')
      .eq('id', id)
      .eq('user_id', req.user.id)
      .single();

    if (fetchError || !resume) {
      return res.status(404).json({ error: 'Resume not found' });
    }

    const resumeData = resume.optimized || resume.parsed;
    console.log('Generating improvement suggestions...');
    const suggestions = await resumeGenerator.suggestImprovements(resumeData);

    res.json({
      success: true,
      suggestions: suggestions
    });
  } catch (error) {
    console.error('Suggestions error:', error);
    res.status(500).json({
      error: error.message || 'Failed to generate suggestions'
    });
  }
});

// Get available templates
router.get('/templates', authenticateUser, async (req, res) => {
  try {
    const templates = resumeGenerator.getTemplates();
    res.json({
      success: true,
      templates: templates
    });
  } catch (error) {
    console.error('Templates fetch error:', error);
    res.status(500).json({
      error: 'Failed to fetch templates'
    });
  }
});

// Get available industries
router.get('/industries', authenticateUser, async (req, res) => {
  try {
    const industries = resumeGenerator.getIndustries();
    res.json({
      success: true,
      industries: industries
    });
  } catch (error) {
    console.error('Industries fetch error:', error);
    res.status(500).json({
      error: 'Failed to fetch industries'
    });
  }
});

// Get experience levels
router.get('/experience-levels', authenticateUser, async (req, res) => {
  try {
    const levels = resumeGenerator.getExperienceLevels();
    res.json({
      success: true,
      levels: levels
    });
  } catch (error) {
    console.error('Experience levels fetch error:', error);
    res.status(500).json({
      error: 'Failed to fetch experience levels'
    });
  }
});

router.delete('/:id', authenticateUser, async (req, res) => {
  try {
    const { id } = req.params;

    const { data: resume, error: fetchError } = await supabaseAdmin
      .from('resumes')
      .select('original_file')
      .eq('id', id)
      .eq('user_id', req.user.id)
      .single();

    if (fetchError || !resume) {
      return res.status(404).json({ error: 'Resume not found' });
    }

    if (resume.original_file) {
      await supabaseAdmin
        .storage
        .from('user-files')
        .remove([resume.original_file]);
    }

    const { error: deleteError } = await supabaseAdmin
      .from('resumes')
      .delete()
      .eq('id', id)
      .eq('user_id', req.user.id);

    if (deleteError) {
      throw new Error('Failed to delete resume');
    }

    res.json({
      success: true,
      message: 'Resume deleted successfully'
    });
  } catch (error) {
    console.error('Delete error:', error);
    res.status(500).json({
      error: error.message || 'Failed to delete resume'
    });
  }
});

module.exports = router;
