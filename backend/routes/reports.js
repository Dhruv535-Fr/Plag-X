const express = require('express');
const Report = require('../models/Report');
const { protect, optionalAuth } = require('../middleware/auth');
const PlagiarismAnalyzer = require('../services/PlagiarismAnalyzer');

const router = express.Router();

// @desc    Create a new report
// @route   POST /api/reports
// @access  Private
router.post('/', protect, async (req, res) => {
  try {
    const { title, description, files, tags, isPublic } = req.body;

    if (!files || files.length < 2) {
      return res.status(400).json({
        success: false,
        message: 'Please provide at least 2 files for analysis'
      });
    }

    // Perform plagiarism analysis
    const analyzer = new PlagiarismAnalyzer();
    const analysisResult = await analyzer.analyzeFiles(files);

    // Create report
    const report = await Report.create({
      title: title || `Report ${new Date().toLocaleString()}`,
      description,
      user: req.user.id,
      files,
      analysis: analysisResult.analysis,
      processingTime: analysisResult.processingTime,
      status: 'completed',
      tags: tags || [],
      isPublic: isPublic || false
    });

    // Update user's report count
    req.user.reportsCount += 1;
    await req.user.save({ validateBeforeSave: false });

    // Populate user data for response
    await report.populate('user', 'username email firstName lastName');

    res.status(201).json({
      success: true,
      message: 'Report created successfully',
      data: {
        report
      }
    });
  } catch (error) {
    console.error('Report creation error:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating report',
      error: error.message
    });
  }
});

// @desc    Get all reports (with pagination and filters)
// @route   GET /api/reports
// @access  Private
router.get('/', protect, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const sortBy = req.query.sortBy || 'createdAt';
    const sortOrder = req.query.sortOrder === 'asc' ? 1 : -1;
    const status = req.query.status;
    const minSimilarity = parseInt(req.query.minSimilarity);
    const maxSimilarity = parseInt(req.query.maxSimilarity);
    const language = req.query.language;
    const search = req.query.search;

    // Build query
    let query = { user: req.user.id };

    if (status) {
      query.status = status;
    }

    if (minSimilarity !== undefined || maxSimilarity !== undefined) {
      query['analysis.overallSimilarityScore'] = {};
      if (minSimilarity !== undefined) {
        query['analysis.overallSimilarityScore'].$gte = minSimilarity;
      }
      if (maxSimilarity !== undefined) {
        query['analysis.overallSimilarityScore'].$lte = maxSimilarity;
      }
    }

    if (language) {
      query['analysis.detectedLanguages'] = language;
    }

    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { tags: { $regex: search, $options: 'i' } }
      ];
    }

    const skip = (page - 1) * limit;

    // Get reports with pagination
    const reports = await Report.find(query)
      .populate('user', 'username firstName lastName')
      .sort({ [sortBy]: sortOrder })
      .skip(skip)
      .limit(limit);

    // Get total count for pagination
    const total = await Report.countDocuments(query);
    const totalPages = Math.ceil(total / limit);

    res.status(200).json({
      success: true,
      data: {
        reports,
        pagination: {
          current: page,
          total: totalPages,
          limit,
          totalReports: total,
          hasNext: page < totalPages,
          hasPrev: page > 1
        }
      }
    });
  } catch (error) {
    console.error('Reports fetch error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching reports',
      error: error.message
    });
  }
});

// @desc    Get public reports
// @route   GET /api/reports/public
// @access  Public (with optional auth)
router.get('/public', optionalAuth, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const sortBy = req.query.sortBy || 'createdAt';
    const sortOrder = req.query.sortOrder === 'asc' ? 1 : -1;

    const skip = (page - 1) * limit;

    const reports = await Report.find({ isPublic: true })
      .populate('user', 'username firstName lastName')
      .sort({ [sortBy]: sortOrder })
      .skip(skip)
      .limit(limit)
      .select('-files.content'); // Exclude file content for public view

    const total = await Report.countDocuments({ isPublic: true });
    const totalPages = Math.ceil(total / limit);

    res.status(200).json({
      success: true,
      data: {
        reports,
        pagination: {
          current: page,
          total: totalPages,
          limit,
          totalReports: total,
          hasNext: page < totalPages,
          hasPrev: page > 1
        }
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching public reports',
      error: error.message
    });
  }
});

// @desc    Get single report by ID
// @route   GET /api/reports/:id
// @access  Private
router.get('/:id', protect, async (req, res) => {
  try {
    const report = await Report.findById(req.params.id)
      .populate('user', 'username email firstName lastName')
      .populate('sharedWith.user', 'username firstName lastName');

    if (!report) {
      return res.status(404).json({
        success: false,
        message: 'Report not found'
      });
    }

    // Check if user can access this report
    if (!report.canUserAccess(req.user.id)) {
      return res.status(403).json({
        success: false,
        message: 'You do not have access to this report'
      });
    }

    res.status(200).json({
      success: true,
      data: {
        report
      }
    });
  } catch (error) {
    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: 'Invalid report ID'
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Error fetching report',
      error: error.message
    });
  }
});

// @desc    Update report
// @route   PUT /api/reports/:id
// @access  Private
router.put('/:id', protect, async (req, res) => {
  try {
    const { title, description, tags, isPublic } = req.body;

    const report = await Report.findById(req.params.id);

    if (!report) {
      return res.status(404).json({
        success: false,
        message: 'Report not found'
      });
    }

    // Check if user owns this report
    if (report.user.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'You can only update your own reports'
      });
    }

    // Update report
    const updatedReport = await Report.findByIdAndUpdate(
      req.params.id,
      { title, description, tags, isPublic },
      { new: true, runValidators: true }
    ).populate('user', 'username firstName lastName');

    res.status(200).json({
      success: true,
      message: 'Report updated successfully',
      data: {
        report: updatedReport
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error updating report',
      error: error.message
    });
  }
});

// @desc    Delete report
// @route   DELETE /api/reports/:id
// @access  Private
router.delete('/:id', protect, async (req, res) => {
  try {
    const report = await Report.findById(req.params.id);

    if (!report) {
      return res.status(404).json({
        success: false,
        message: 'Report not found'
      });
    }

    // Check if user owns this report
    if (report.user.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'You can only delete your own reports'
      });
    }

    await Report.findByIdAndDelete(req.params.id);

    // Update user's report count
    if (req.user.reportsCount > 0) {
      req.user.reportsCount -= 1;
      await req.user.save({ validateBeforeSave: false });
    }

    res.status(200).json({
      success: true,
      message: 'Report deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error deleting report',
      error: error.message
    });
  }
});

// @desc    Share report with another user
// @route   POST /api/reports/:id/share
// @access  Private
router.post('/:id/share', protect, async (req, res) => {
  try {
    const { userEmail, permission } = req.body;

    if (!userEmail) {
      return res.status(400).json({
        success: false,
        message: 'User email is required'
      });
    }

    const report = await Report.findById(req.params.id);

    if (!report) {
      return res.status(404).json({
        success: false,
        message: 'Report not found'
      });
    }

    // Check if user owns this report
    if (report.user.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'You can only share your own reports'
      });
    }

    // Find user to share with
    const User = require('../models/User');
    const targetUser = await User.findOne({ email: userEmail });

    if (!targetUser) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Check if already shared
    const alreadyShared = report.sharedWith.some(
      share => share.user.toString() === targetUser._id.toString()
    );

    if (alreadyShared) {
      return res.status(400).json({
        success: false,
        message: 'Report is already shared with this user'
      });
    }

    // Add to shared list
    report.sharedWith.push({
      user: targetUser._id,
      permission: permission || 'read'
    });

    await report.save();

    res.status(200).json({
      success: true,
      message: 'Report shared successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error sharing report',
      error: error.message
    });
  }
});

// @desc    Get report analytics
// @route   GET /api/reports/analytics/summary
// @access  Private
router.get('/analytics/summary', protect, async (req, res) => {
  try {
    const userId = req.user.id;

    // Aggregate user's report statistics
    const stats = await Report.aggregate([
      { $match: { user: userId } },
      {
        $group: {
          _id: null,
          totalReports: { $sum: 1 },
          avgSimilarity: { $avg: '$analysis.overallSimilarityScore' },
          highSimilarityReports: {
            $sum: {
              $cond: [{ $gt: ['$analysis.overallSimilarityScore', 70] }, 1, 0]
            }
          },
          mediumSimilarityReports: {
            $sum: {
              $cond: [
                {
                  $and: [
                    { $gt: ['$analysis.overallSimilarityScore', 40] },
                    { $lte: ['$analysis.overallSimilarityScore', 70] }
                  ]
                },
                1,
                0
              ]
            }
          },
          lowSimilarityReports: {
            $sum: {
              $cond: [{ $lte: ['$analysis.overallSimilarityScore', 40] }, 1, 0]
            }
          }
        }
      }
    ]);

    // Get language distribution
    const languageStats = await Report.aggregate([
      { $match: { user: userId } },
      { $unwind: '$analysis.detectedLanguages' },
      {
        $group: {
          _id: '$analysis.detectedLanguages',
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } }
    ]);

    // Get recent activity (last 7 days)
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);

    const recentActivity = await Report.find({
      user: userId,
      createdAt: { $gte: weekAgo }
    }).sort({ createdAt: -1 }).limit(10);

    const summary = stats[0] || {
      totalReports: 0,
      avgSimilarity: 0,
      highSimilarityReports: 0,
      mediumSimilarityReports: 0,
      lowSimilarityReports: 0
    };

    res.status(200).json({
      success: true,
      data: {
        summary,
        languageDistribution: languageStats,
        recentActivity: recentActivity.length,
        weeklyReports: recentActivity.length
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching analytics',
      error: error.message
    });
  }
});

module.exports = router;
