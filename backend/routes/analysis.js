const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;
const fsSync = require('fs');
const PlagiarismAnalyzer = require('../services/PlagiarismAnalyzer');
const Report = require('../models/Report');
const User = require('../models/User');
const { protect } = require('../middleware/auth');

const router = express.Router();

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, '../uploads');
if (!fsSync.existsSync(uploadsDir)) {
  fsSync.mkdirSync(uploadsDir, { recursive: true });
  console.log('Created uploads directory:', uploadsDir);
}

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    // Keep original filename with timestamp to avoid conflicts
    const timestamp = Date.now();
    const originalName = file.originalname;
    const safeFilename = `${timestamp}-${originalName}`;
    console.log(`Storing file as: ${safeFilename}`);
    cb(null, safeFilename);
  }
});

const upload = multer({ 
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    // Check file extension
    const allowedExtensions = ['.cpp', '.c', '.cc', '.cxx', '.java', '.py'];
    const fileExtension = path.extname(file.originalname).toLowerCase();
    
    if (allowedExtensions.includes(fileExtension)) {
      cb(null, true);
    } else {
      cb(new Error(`File type ${fileExtension} not supported. Only C++, Java, and Python files are allowed.`));
    }
  }
});

// Helper function to get language name
function getLanguageName(extension) {
  const langMap = {
    'cpp': 'C++',
    'java': 'Java',
    'py': 'Python'
  };
  return langMap[extension] || 'Unknown';
}

// Helper function to update user statistics
async function updateUserStats(userId, results) {
  try {
    const user = await User.findById(userId);
    if (!user) return;

    // Calculate new statistics
    const newFilesChecked = results.length * 2; // Each comparison involves 2 files
    const totalSimilarity = results.reduce((sum, result) => sum + result.similarity, 0);
    const newCasesFlagged = results.filter(result => result.similarity >= 0.8).length;

    // Update user stats
    user.stats.totalFilesChecked += newFilesChecked;
    user.stats.totalSimilaritySum += totalSimilarity;
    user.stats.casesFlagged += newCasesFlagged;

    // Recalculate average similarity
    const totalComparisons = user.stats.totalFilesChecked / 2;
    user.stats.averageSimilarity = totalComparisons > 0 ? user.stats.totalSimilaritySum / totalComparisons : 0;

    await user.save();
    console.log('User stats updated:', user.stats);
  } catch (error) {
    console.error('Error updating user stats:', error);
  }
}

// Analyze files endpoint
router.post('/analyze', protect, upload.array('files', 20), async (req, res) => {
  try {
    console.log('=== ANALYSIS ROUTE CALLED ===');
    console.log('User:', req.user.email);
    console.log('Files received:', req.files?.length || 0);
    
    if (req.files) {
      console.log('File debug info:');
      req.files.forEach((file, index) => {
        console.log(`File ${index + 1}:`, {
          originalname: file.originalname,
          filename: file.filename,
          path: file.path,
          size: file.size,
          mimetype: file.mimetype
        });
        console.log(`File exists: ${fsSync.existsSync(file.path)}`);
      });
    }

    if (!req.files || req.files.length < 2) {
      return res.status(400).json({
        success: false,
        message: 'Please upload at least 2 files for comparison'
      });
    }

    // Verify all files exist before proceeding
    const missingFiles = req.files.filter(file => !fsSync.existsSync(file.path));
    if (missingFiles.length > 0) {
      console.error('Missing files:', missingFiles.map(f => f.path));
      return res.status(400).json({
        success: false,
        message: 'Some uploaded files could not be found. Please try again.'
      });
    }

    const analyzer = new PlagiarismAnalyzer();
    const allResults = [];
    let totalComparisons = 0;
    let successfulComparisons = 0;

    // Group files by extension
    const fileGroups = {};
    req.files.forEach(file => {
      const extension = path.extname(file.originalname).toLowerCase().substring(1);
      // Normalize C++ extensions
      const normalizedExt = ['cpp', 'c', 'cc', 'cxx'].includes(extension) ? 'cpp' : extension;
      
      if (!fileGroups[normalizedExt]) {
        fileGroups[normalizedExt] = [];
      }
      fileGroups[normalizedExt].push(file);
    });

    console.log('File groups:', Object.keys(fileGroups).map(key => `${key}: ${fileGroups[key].length} files`));

    // Process each group
    for (const [extension, files] of Object.entries(fileGroups)) {
      if (files.length >= 2) {
        console.log(`Processing ${extension} group with ${files.length} files`);
        
        // Compare each pair of files in the group
        for (let i = 0; i < files.length - 1; i++) {
          for (let j = i + 1; j < files.length; j++) {
            totalComparisons++;
            
            try {
              console.log(`Comparing: ${files[i].originalname} vs ${files[j].originalname}`);
              console.log(`File paths: ${files[i].path} vs ${files[j].path}`);
              
              // Double-check files exist before analysis
              if (!fsSync.existsSync(files[i].path)) {
                throw new Error(`File not found: ${files[i].path}`);
              }
              if (!fsSync.existsSync(files[j].path)) {
                throw new Error(`File not found: ${files[j].path}`);
              }
              
              const analysisResult = await analyzer.analyzeFiles(
                files[i].path,
                files[j].path,
                extension
              );

              console.log('Analysis result received:', analysisResult);

              // Extract similarity score
              let similarity = 0;
              if (analysisResult && typeof analysisResult.similarity === 'number') {
                similarity = analysisResult.similarity;
              } else if (analysisResult && analysisResult.details && analysisResult.details.combined) {
                similarity = analysisResult.details.combined.similarity || 0;
              }

              console.log(`Final similarity for ${files[i].originalname} vs ${files[j].originalname}: ${similarity}`);

              // Read file contents for database storage
              const file1Content = await fs.readFile(files[i].path, 'utf-8');
              const file2Content = await fs.readFile(files[j].path, 'utf-8');

              // Create report entry with proper schema structure
              const reportData = {
                user: req.user._id,  // Changed from userId to user
                title: req.body.title || `Analysis: ${files[i].originalname} vs ${files[j].originalname}`,
                description: req.body.description || 'Automated plagiarism analysis',
                files: [
                  {
                    name: files[i].filename || path.basename(files[i].path),  // Use filename or extract from path
                    originalName: files[i].originalname,  // Required field (original filename)
                    filename: files[i].filename || path.basename(files[i].path),
                    path: files[i].path,
                    content: file1Content,  // Required field
                    size: files[i].size,  // Required field
                    extension: path.extname(files[i].originalname).toLowerCase().substring(1),  // Required field
                    language: getLanguageName(extension),  // Required field
                    mimeType: files[i].mimetype
                  },
                  {
                    name: files[j].filename || path.basename(files[j].path),  // Use filename or extract from path
                    originalName: files[j].originalname,  // Required field (original filename)
                    filename: files[j].filename || path.basename(files[j].path),
                    path: files[j].path,
                    content: file2Content,  // Required field
                    size: files[j].size,  // Required field
                    extension: path.extname(files[j].originalname).toLowerCase().substring(1),  // Required field
                    language: getLanguageName(extension),  // Required field
                    mimeType: files[j].mimetype
                  }
                ],
                analysis: {
                  overallSimilarityScore: Math.round(similarity * 100),  // Convert to percentage
                  detectedLanguages: [getLanguageName(extension)],
                  totalFiles: 2,
                  suspiciousPairs: [{
                    file1: files[i].originalname,
                    file2: files[j].originalname,
                    similarityScore: Math.round(similarity * 100),
                    matchedLines: 0,  // Will be filled by actual analysis if available
                    commonBlocks: []
                  }]
                },
                status: similarity >= 0.8 ? 'completed' : similarity >= 0.5 ? 'completed' : 'completed'  // Use valid enum values
              };

              const report = new Report(reportData);
              await report.save();

              allResults.push({
                reportId: report._id,
                file1: files[i].originalname,
                file2: files[j].originalname,
                similarity: similarity,
                language: getLanguageName(extension),
                method: 'Combined',
                status: similarity >= 0.8 ? 'High Risk' : similarity >= 0.5 ? 'Medium Risk' : 'Low Risk',
                details: analysisResult,
                overallSimilarityScore: Math.round(similarity * 100)
              });

              successfulComparisons++;

            } catch (error) {
              console.error(`Error comparing ${files[i].originalname} vs ${files[j].originalname}:`, error);
              
              // Read file contents even for failed comparisons
              let file1Content = '';
              let file2Content = '';
              try {
                file1Content = await fs.readFile(files[i].path, 'utf-8');
                file2Content = await fs.readFile(files[j].path, 'utf-8');
              } catch (readError) {
                console.error('Error reading file contents:', readError);
                file1Content = 'Error reading file content';
                file2Content = 'Error reading file content';
              }
              
              // Still create a report with 0 similarity for failed comparisons
              const reportData = {
                user: req.user._id,  // Changed from userId to user
                title: req.body.title || `Analysis: ${files[i].originalname} vs ${files[j].originalname}`,
                description: req.body.description || 'Automated plagiarism analysis',
                files: [
                  {
                    name: files[i].filename || path.basename(files[i].path),  // Use filename or extract from path
                    originalName: files[i].originalname,  // Required field (original filename)
                    filename: files[i].filename || path.basename(files[i].path),
                    path: files[i].path,
                    content: file1Content,  // Required field
                    size: files[i].size || 0,  // Required field
                    extension: path.extname(files[i].originalname).toLowerCase().substring(1),  // Required field
                    language: getLanguageName(extension),  // Required field
                    mimeType: files[i].mimetype
                  },
                  {
                    name: files[j].filename || path.basename(files[j].path),  // Use filename or extract from path
                    originalName: files[j].originalname,  // Required field (original filename)
                    filename: files[j].filename || path.basename(files[j].path),
                    path: files[j].path,
                    content: file2Content,  // Required field
                    size: files[j].size || 0,  // Required field
                    extension: path.extname(files[j].originalname).toLowerCase().substring(1),  // Required field
                    language: getLanguageName(extension),  // Required field
                    mimeType: files[j].mimetype
                  }
                ],
                analysis: {
                  overallSimilarityScore: 0,
                  detectedLanguages: [getLanguageName(extension)],
                  totalFiles: 2,
                  suspiciousPairs: []
                },
                status: 'failed'  // Use valid enum value
              };

              try {
                const report = new Report(reportData);
                await report.save();

                allResults.push({
                  reportId: report._id,
                  file1: files[i].originalname,
                  file2: files[j].originalname,
                  similarity: 0,
                  language: getLanguageName(extension),
                  method: 'Failed',
                  status: 'Analysis Failed',
                  error: error.message,
                  overallSimilarityScore: 0
                });
              } catch (reportError) {
                console.error('Failed to save error report:', reportError);
              }
            }
          }
        }
      }
    }

    // Update user statistics
    try {
      await updateUserStats(req.user._id, allResults);
    } catch (error) {
      console.error('Failed to update user stats:', error);
    }

    console.log(`Analysis completed: ${successfulComparisons}/${totalComparisons} successful comparisons`);
    console.log('Results:', allResults.length);

    if (allResults.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No comparisons could be performed. Please check file formats and try again.'
      });
    }

    // Clean up uploaded files after analysis is complete
    setTimeout(async () => {
      try {
        await Promise.all(req.files.map(file => {
          if (fsSync.existsSync(file.path)) {
            return fs.unlink(file.path).catch(console.error);
          }
        }));
        console.log('Cleaned up uploaded files');
      } catch (error) {
        console.error('Error cleaning up files:', error);
      }
    }, 5000); // Wait 5 seconds before cleanup

    res.json({
      success: true,
      message: `Analysis completed! ${successfulComparisons}/${totalComparisons} comparisons successful.`,
      data: {
        totalComparisons,
        successfulComparisons,
        results: allResults,
        // Return the first report ID for backward compatibility
        reportId: allResults[0]?.reportId,
        similarity: allResults.length > 0 ? allResults.reduce((sum, r) => sum + r.similarity, 0) / allResults.length : 0
      }
    });

  } catch (error) {
    console.error('Analysis route error:', error);
    
    // Clean up uploaded files on error
    if (req.files) {
      setTimeout(async () => {
        await Promise.all(req.files.map(file => {
          if (fsSync.existsSync(file.path)) {
            return fs.unlink(file.path).catch(console.error);
          }
        }));
      }, 1000);
    }

    res.status(500).json({
      success: false,
      message: 'Analysis failed',
      error: error.message
    });
  }
});

module.exports = router;
