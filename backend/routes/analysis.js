const express = require('express');
const multer = require('multer');
const path = require('path');
const { protect } = require('../middleware/auth');
const PlagiarismAnalyzer = require('../services/PlagiarismAnalyzer');

const router = express.Router();

// Configure multer for file uploads
const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE) || 10 * 1024 * 1024, // 10MB default
    files: 20 // Maximum 20 files per upload
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = (process.env.ALLOWED_FILE_TYPES || '.js,.ts,.tsx,.jsx,.py,.java,.cpp,.c,.cs,.php,.rb,.go,.rs,.swift').split(',');
    const fileExtension = path.extname(file.originalname).toLowerCase();
    
    if (allowedTypes.includes(fileExtension)) {
      cb(null, true);
    } else {
      cb(new Error(`File type ${fileExtension} is not allowed. Allowed types: ${allowedTypes.join(', ')}`), false);
    }
  }
});

// @desc    Analyze files for plagiarism
// @route   POST /api/analysis/analyze
// @access  Private
router.post('/analyze', protect, upload.array('files', 20), async (req, res) => {
  try {
    const { title, description, tags } = req.body;
    const uploadedFiles = req.files;

    if (!uploadedFiles || uploadedFiles.length < 2) {
      return res.status(400).json({
        success: false,
        message: 'Please upload at least 2 files for comparison'
      });
    }

    // Process uploaded files
    const files = uploadedFiles.map(file => {
      const extension = path.extname(file.originalname).toLowerCase();
      const analyzer = new PlagiarismAnalyzer();
      
      return {
        name: file.originalname,
        originalName: file.originalname,
        content: file.buffer.toString('utf-8'),
        size: file.size,
        language: analyzer.detectLanguage(file.originalname, file.buffer.toString('utf-8')),
        extension: extension
      };
    });

    // Initialize analyzer and perform analysis
    const analyzer = new PlagiarismAnalyzer();
    const result = await analyzer.analyzeFiles(files);

    // Prepare response
    const analysisResult = {
      success: true,
      message: 'Analysis completed successfully',
      data: {
        title: title || `Analysis ${new Date().toISOString()}`,
        description: description || '',
        files: files.map(file => ({
          name: file.name,
          originalName: file.originalName,
          size: file.size,
          language: file.language,
          extension: file.extension
        })),
        analysis: result.analysis,
        processingTime: result.processingTime,
        tags: tags ? tags.split(',').map(tag => tag.trim()) : [],
        timestamp: new Date().toISOString()
      }
    };

    res.status(200).json(analysisResult);
  } catch (error) {
    console.error('Analysis error:', error);
    
    if (error instanceof multer.MulterError) {
      if (error.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({
          success: false,
          message: 'File size too large. Maximum size is 10MB per file.'
        });
      }
      if (error.code === 'LIMIT_FILE_COUNT') {
        return res.status(400).json({
          success: false,
          message: 'Too many files. Maximum is 20 files per upload.'
        });
      }
    }
    
    res.status(500).json({
      success: false,
      message: 'Error during analysis',
      error: error.message
    });
  }
});

// @desc    Get supported file types
// @route   GET /api/analysis/supported-types
// @access  Public
router.get('/supported-types', (req, res) => {
  const allowedTypes = (process.env.ALLOWED_FILE_TYPES || '.js,.ts,.tsx,.jsx,.py,.java,.cpp,.c,.cs,.php,.rb,.go,.rs,.swift').split(',');
  const maxSize = parseInt(process.env.MAX_FILE_SIZE) || 10 * 1024 * 1024;

  res.status(200).json({
    success: true,
    data: {
      allowedExtensions: allowedTypes,
      maxFileSize: maxSize,
      maxFiles: 20,
      supportedLanguages: [
        'JavaScript',
        'TypeScript',
        'Python',
        'Java',
        'C++',
        'C',
        'C#',
        'PHP',
        'Ruby',
        'Go',
        'Rust',
        'Swift'
      ]
    }
  });
});

// @desc    Quick analysis for two text inputs
// @route   POST /api/analysis/quick-compare
// @access  Private
router.post('/quick-compare', protect, async (req, res) => {
  try {
    const { text1, text2, title } = req.body;

    if (!text1 || !text2) {
      return res.status(400).json({
        success: false,
        message: 'Please provide both text inputs for comparison'
      });
    }

    if (text1.length > 50000 || text2.length > 50000) {
      return res.status(400).json({
        success: false,
        message: 'Text input too large. Maximum 50,000 characters per input.'
      });
    }

    // Create mock files for analysis
    const files = [
      {
        name: 'text1.txt',
        originalName: 'Input 1',
        content: text1,
        size: text1.length,
        language: 'Text',
        extension: '.txt'
      },
      {
        name: 'text2.txt',
        originalName: 'Input 2',
        content: text2,
        size: text2.length,
        language: 'Text',
        extension: '.txt'
      }
    ];

    // Perform analysis
    const analyzer = new PlagiarismAnalyzer();
    const result = await analyzer.analyzeFiles(files);

    res.status(200).json({
      success: true,
      message: 'Quick comparison completed',
      data: {
        title: title || `Quick Compare ${new Date().toISOString()}`,
        analysis: result.analysis,
        processingTime: result.processingTime,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Quick comparison error:', error);
    res.status(500).json({
      success: false,
      message: 'Error during quick comparison',
      error: error.message
    });
  }
});

// @desc    Get analysis statistics
// @route   GET /api/analysis/stats
// @access  Private
router.get('/stats', protect, async (req, res) => {
  try {
    // This would typically come from database queries
    // For now, returning mock data
    const stats = {
      totalAnalyses: 0,
      averageSimilarity: 0,
      mostCommonLanguage: 'JavaScript',
      recentAnalyses: []
    };

    res.status(200).json({
      success: true,
      data: stats
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching analysis statistics',
      error: error.message
    });
  }
});

module.exports = router;
