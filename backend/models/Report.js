const mongoose = require('mongoose');

const reportSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Report title is required'],
    trim: true,
    maxlength: [200, 'Title cannot exceed 200 characters']
  },
  description: {
    type: String,
    trim: true,
    maxlength: [1000, 'Description cannot exceed 1000 characters']
  },
  user: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: [true, 'Report must belong to a user']
  },
  files: [{
    name: {
      type: String,
      required: true
    },
    originalName: {
      type: String,
      required: true
    },
    content: {
      type: String,
      required: true
    },
    size: {
      type: Number,
      required: true
    },
    language: {
      type: String,
      required: true
    },
    extension: {
      type: String,
      required: true
    }
  }],
  analysis: {
    overallSimilarityScore: {
      type: Number,
      min: 0,
      max: 100,
      default: 0
    },
    detectedLanguages: [{
      type: String
    }],
    totalFiles: {
      type: Number,
      default: 0
    },
    suspiciousPairs: [{
      file1: String,
      file2: String,
      similarityScore: Number,
      matchedLines: Number,
      commonBlocks: [{
        startLine1: Number,
        endLine1: Number,
        startLine2: Number,
        endLine2: Number,
        content: String
      }]
    }],
    statistics: {
      totalLines: Number,
      duplicatedLines: Number,
      uniqueLines: Number,
      codeBlocks: Number,
      functions: Number,
      variables: Number
    }
  },
  status: {
    type: String,
    enum: ['pending', 'processing', 'completed', 'failed'],
    default: 'pending'
  },
  processingTime: {
    type: Number, // in milliseconds
    default: 0
  },
  tags: [{
    type: String,
    trim: true
  }],
  isPublic: {
    type: Boolean,
    default: false
  },
  sharedWith: [{
    user: {
      type: mongoose.Schema.ObjectId,
      ref: 'User'
    },
    permission: {
      type: String,
      enum: ['read', 'write'],
      default: 'read'
    },
    sharedAt: {
      type: Date,
      default: Date.now
    }
  }]
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for better query performance
reportSchema.index({ user: 1, createdAt: -1 });
reportSchema.index({ status: 1 });
reportSchema.index({ 'analysis.overallSimilarityScore': -1 });
reportSchema.index({ tags: 1 });

// Virtual for high similarity threshold
reportSchema.virtual('isHighSimilarity').get(function() {
  return this.analysis.overallSimilarityScore > 70;
});

// Virtual for medium similarity threshold
reportSchema.virtual('isMediumSimilarity').get(function() {
  return this.analysis.overallSimilarityScore > 40 && this.analysis.overallSimilarityScore <= 70;
});

// Virtual for processing duration in readable format
reportSchema.virtual('processingDuration').get(function() {
  if (this.processingTime < 1000) {
    return `${this.processingTime}ms`;
  }
  return `${(this.processingTime / 1000).toFixed(2)}s`;
});

// Pre-save middleware to calculate total files
reportSchema.pre('save', function(next) {
  if (this.files) {
    this.analysis.totalFiles = this.files.length;
  }
  next();
});

// Static method to get user reports with pagination
reportSchema.statics.getUserReports = function(userId, page = 1, limit = 10) {
  const skip = (page - 1) * limit;
  
  return this.find({ user: userId })
    .populate('user', 'username email firstName lastName')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);
};

// Static method to get public reports
reportSchema.statics.getPublicReports = function(page = 1, limit = 10) {
  const skip = (page - 1) * limit;
  
  return this.find({ isPublic: true })
    .populate('user', 'username firstName lastName')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);
};

// Method to check if user can access this report
reportSchema.methods.canUserAccess = function(userId) {
  if (this.user.toString() === userId.toString()) return true;
  if (this.isPublic) return true;
  
  return this.sharedWith.some(share => 
    share.user.toString() === userId.toString()
  );
};

module.exports = mongoose.model('Report', reportSchema);
