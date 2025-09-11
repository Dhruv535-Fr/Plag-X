const express = require('express');
const User = require('../models/User');
const Report = require('../models/Report');
const { protect } = require('../middleware/auth');

const router = express.Router();

// Get user dashboard statistics
router.get('/stats', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Get recent reports for this user
    const recentReports = await Report.find({ 
      createdBy: req.user.id 
    })
    .sort({ createdAt: -1 })
    .limit(5)
    .select('files similarity method createdAt status')
    .populate('files', 'filename language');

    // Calculate stats if not properly initialized
    const stats = user.stats || {
      totalFilesChecked: 0,
      averageSimilarity: 0,
      casesFlagged: 0,
      totalSimilaritySum: 0
    };

    res.json({
      success: true,
      data: {
        stats: {
          totalFilesChecked: stats.totalFilesChecked,
          averageSimilarity: stats.averageSimilarity,
          casesFlagged: stats.casesFlagged,
          languagesSupported: 3 // Static: C++, Java, Python
        },
        recentReports: recentReports.map(report => ({
          id: report._id,
          files: report.files.map(f => f.filename).join(' vs '),
          language: report.files[0]?.language || 'Unknown',
          similarity: Math.round(report.similarity * 100),
          method: report.method,
          date: report.createdAt,
          status: report.status
        }))
      }
    });

  } catch (error) {
    console.error('Dashboard stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch dashboard statistics',
      error: process.env.NODE_ENV === 'development' ? error.message : {}
    });
  }
});

// Update user statistics (called after analysis)
router.put('/stats/update', protect, async (req, res) => {
  try {
    const { similarity, flagged } = req.body;
    
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Initialize stats if not present
    if (!user.stats) {
      user.stats = {
        totalFilesChecked: 0,
        averageSimilarity: 0,
        casesFlagged: 0,
        totalSimilaritySum: 0
      };
    }

    // Update statistics
    user.stats.totalFilesChecked += 1;
    user.stats.totalSimilaritySum += similarity;
    user.stats.averageSimilarity = user.stats.totalSimilaritySum / user.stats.totalFilesChecked;
    
    if (flagged || similarity >= 0.8) {
      user.stats.casesFlagged += 1;
    }

    await user.save();

    res.json({
      success: true,
      message: 'Statistics updated successfully',
      data: {
        totalFilesChecked: user.stats.totalFilesChecked,
        averageSimilarity: user.stats.averageSimilarity,
        casesFlagged: user.stats.casesFlagged
      }
    });

  } catch (error) {
    console.error('Update stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update statistics',
      error: process.env.NODE_ENV === 'development' ? error.message : {}
    });
  }
});

module.exports = router;
