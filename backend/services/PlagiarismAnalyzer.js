const natural = require('natural');
const diff = require('diff');
const _ = require('lodash');

class PlagiarismAnalyzer {
  constructor() {
    this.tokenizer = new natural.WordTokenizer();
    this.stemmer = natural.PorterStemmer;
    this.tfidf = new natural.TfIdf();
  }

  // Main analysis function
  async analyzeFiles(files) {
    const startTime = Date.now();
    
    try {
      const analysis = {
        overallSimilarityScore: 0,
        detectedLanguages: [],
        totalFiles: files.length,
        suspiciousPairs: [],
        statistics: {
          totalLines: 0,
          duplicatedLines: 0,
          uniqueLines: 0,
          codeBlocks: 0,
          functions: 0,
          variables: 0
        }
      };

      // Preprocess files
      const processedFiles = this.preprocessFiles(files);
      
      // Calculate statistics for each file
      for (const file of processedFiles) {
        const stats = this.calculateFileStatistics(file);
        analysis.statistics.totalLines += stats.lines;
        analysis.statistics.codeBlocks += stats.codeBlocks;
        analysis.statistics.functions += stats.functions;
        analysis.statistics.variables += stats.variables;
        
        if (!analysis.detectedLanguages.includes(file.language)) {
          analysis.detectedLanguages.push(file.language);
        }
      }

      // Compare all file pairs
      const comparisons = [];
      for (let i = 0; i < processedFiles.length; i++) {
        for (let j = i + 1; j < processedFiles.length; j++) {
          const similarity = await this.compareFiles(processedFiles[i], processedFiles[j]);
          comparisons.push(similarity);
          
          if (similarity.similarityScore > 30) { // Threshold for suspicious pairs
            analysis.suspiciousPairs.push(similarity);
          }
        }
      }

      // Calculate overall similarity score
      if (comparisons.length > 0) {
        analysis.overallSimilarityScore = Math.round(
          comparisons.reduce((sum, comp) => sum + comp.similarityScore, 0) / comparisons.length
        );
      }

      // Calculate duplicated vs unique lines
      const allLines = processedFiles.flatMap(file => file.normalizedLines);
      const uniqueLines = new Set(allLines);
      analysis.statistics.uniqueLines = uniqueLines.size;
      analysis.statistics.duplicatedLines = analysis.statistics.totalLines - analysis.statistics.uniqueLines;

      const processingTime = Date.now() - startTime;
      
      return {
        analysis,
        processingTime
      };
    } catch (error) {
      throw new Error(`Analysis failed: ${error.message}`);
    }
  }

  // Preprocess files for analysis
  preprocessFiles(files) {
    return files.map(file => {
      const lines = file.content.split('\n');
      const normalizedLines = this.normalizeCode(lines);
      const tokens = this.tokenizeContent(file.content);
      
      return {
        ...file,
        lines,
        normalizedLines,
        tokens,
        fingerprint: this.generateFingerprint(normalizedLines)
      };
    });
  }

  // Normalize code by removing whitespace, comments, and formatting
  normalizeCode(lines) {
    return lines.map(line => {
      // Remove leading/trailing whitespace
      let normalized = line.trim();
      
      // Remove single-line comments
      normalized = normalized.replace(/\/\/.*$/, '');
      normalized = normalized.replace(/#.*$/, '');
      normalized = normalized.replace(/;.*$/, ''); // For some languages
      
      // Remove extra whitespace
      normalized = normalized.replace(/\s+/g, ' ');
      
      // Convert to lowercase for comparison
      normalized = normalized.toLowerCase();
      
      return normalized;
    }).filter(line => line.length > 0); // Remove empty lines
  }

  // Tokenize content for semantic analysis
  tokenizeContent(content) {
    // Remove comments and strings
    const cleanContent = content
      .replace(/\/\*[\s\S]*?\*\//g, '') // Multi-line comments
      .replace(/\/\/.*$/gm, '') // Single-line comments
      .replace(/"[^"]*"/g, '') // Double quotes
      .replace(/'[^']*'/g, '') // Single quotes
      .replace(/`[^`]*`/g, ''); // Template literals

    return this.tokenizer.tokenize(cleanContent.toLowerCase()) || [];
  }

  // Generate a fingerprint for quick similarity detection
  generateFingerprint(normalizedLines) {
    const combined = normalizedLines.join(' ');
    const hash = this.simpleHash(combined);
    return hash;
  }

  // Simple hash function
  simpleHash(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return hash;
  }

  // Compare two files and return similarity analysis
  async compareFiles(file1, file2) {
    const similarity = {
      file1: file1.name,
      file2: file2.name,
      similarityScore: 0,
      matchedLines: 0,
      commonBlocks: []
    };

    // 1. Fingerprint comparison (quick check)
    const fingerprintSimilarity = this.compareFingerprintSimilarity(file1.fingerprint, file2.fingerprint);

    // 2. Line-by-line comparison
    const lineSimilarity = this.compareLines(file1.normalizedLines, file2.normalizedLines);
    similarity.matchedLines = lineSimilarity.matchedLines;
    similarity.commonBlocks = lineSimilarity.commonBlocks;

    // 3. Token-based semantic similarity
    const semanticSimilarity = this.compareTokens(file1.tokens, file2.tokens);

    // 4. Structural similarity (for code files)
    const structuralSimilarity = this.compareStructure(file1.content, file2.content);

    // Combine all similarity measures with weights
    similarity.similarityScore = Math.round(
      (lineSimilarity.similarity * 0.4) +
      (semanticSimilarity * 0.3) +
      (structuralSimilarity * 0.2) +
      (fingerprintSimilarity * 0.1)
    );

    return similarity;
  }

  // Compare fingerprint similarity
  compareFingerprintSimilarity(hash1, hash2) {
    if (hash1 === hash2) return 100;
    
    // Convert hashes to binary and compare bit differences
    const xor = hash1 ^ hash2;
    const bits = xor.toString(2).split('1').length - 1;
    return Math.max(0, 100 - (bits * 3)); // Rough similarity based on bit differences
  }

  // Compare normalized lines
  compareLines(lines1, lines2) {
    const result = {
      similarity: 0,
      matchedLines: 0,
      commonBlocks: []
    };

    if (lines1.length === 0 || lines2.length === 0) {
      return result;
    }

    // Use diff to find common subsequences
    const patches = diff.diffArrays(lines1, lines2);
    let matchedLines = 0;
    let currentBlock = null;

    patches.forEach((patch, index) => {
      if (!patch.added && !patch.removed) {
        // This is a common block
        matchedLines += patch.value.length;
        
        if (patch.value.length > 2) { // Only consider blocks of 3+ lines
          currentBlock = {
            content: patch.value.join('\n'),
            startLine1: this.findLineIndex(lines1, patch.value[0]),
            endLine1: this.findLineIndex(lines1, patch.value[patch.value.length - 1]),
            startLine2: this.findLineIndex(lines2, patch.value[0]),
            endLine2: this.findLineIndex(lines2, patch.value[patch.value.length - 1])
          };
          result.commonBlocks.push(currentBlock);
        }
      }
    });

    result.matchedLines = matchedLines;
    result.similarity = (matchedLines / Math.max(lines1.length, lines2.length)) * 100;

    return result;
  }

  // Find line index in array
  findLineIndex(lines, targetLine) {
    return lines.indexOf(targetLine) + 1; // 1-based indexing
  }

  // Compare tokens using cosine similarity
  compareTokens(tokens1, tokens2) {
    if (tokens1.length === 0 || tokens2.length === 0) {
      return 0;
    }

    // Create frequency vectors
    const allTokens = [...new Set([...tokens1, ...tokens2])];
    const vector1 = allTokens.map(token => tokens1.filter(t => t === token).length);
    const vector2 = allTokens.map(token => tokens2.filter(t => t === token).length);

    // Calculate cosine similarity
    return this.cosineSimilarity(vector1, vector2) * 100;
  }

  // Cosine similarity calculation
  cosineSimilarity(vec1, vec2) {
    const dotProduct = vec1.reduce((sum, a, i) => sum + (a * vec2[i]), 0);
    const magnitude1 = Math.sqrt(vec1.reduce((sum, a) => sum + (a * a), 0));
    const magnitude2 = Math.sqrt(vec2.reduce((sum, a) => sum + (a * a), 0));

    if (magnitude1 === 0 || magnitude2 === 0) {
      return 0;
    }

    return dotProduct / (magnitude1 * magnitude2);
  }

  // Compare code structure (functions, classes, etc.)
  compareStructure(content1, content2) {
    const structure1 = this.extractStructure(content1);
    const structure2 = this.extractStructure(content2);

    // Compare function signatures
    const functionSimilarity = this.compareArrays(structure1.functions, structure2.functions);
    
    // Compare class names
    const classSimilarity = this.compareArrays(structure1.classes, structure2.classes);
    
    // Compare variable patterns
    const variableSimilarity = this.compareArrays(structure1.variables, structure2.variables);

    return (functionSimilarity + classSimilarity + variableSimilarity) / 3;
  }

  // Extract structural elements from code
  extractStructure(content) {
    const structure = {
      functions: [],
      classes: [],
      variables: []
    };

    // Extract function names (supports multiple languages)
    const functionPatterns = [
      /function\s+(\w+)/g,
      /def\s+(\w+)/g,
      /(\w+)\s*\(/g,
      /const\s+(\w+)\s*=/g,
      /let\s+(\w+)\s*=/g,
      /var\s+(\w+)\s*=/g
    ];

    functionPatterns.forEach(pattern => {
      let match;
      while ((match = pattern.exec(content)) !== null) {
        if (match[1] && match[1].length > 1) {
          structure.functions.push(match[1].toLowerCase());
        }
      }
    });

    // Extract class names
    const classPatterns = [
      /class\s+(\w+)/g,
      /interface\s+(\w+)/g,
      /struct\s+(\w+)/g
    ];

    classPatterns.forEach(pattern => {
      let match;
      while ((match = pattern.exec(content)) !== null) {
        if (match[1]) {
          structure.classes.push(match[1].toLowerCase());
        }
      }
    });

    // Extract variable names
    const variablePattern = /\b([a-zA-Z_][a-zA-Z0-9_]*)\s*[=:]/g;
    let match;
    while ((match = variablePattern.exec(content)) !== null) {
      if (match[1] && match[1].length > 1) {
        structure.variables.push(match[1].toLowerCase());
      }
    }

    return structure;
  }

  // Compare two arrays for similarity
  compareArrays(arr1, arr2) {
    if (arr1.length === 0 && arr2.length === 0) return 100;
    if (arr1.length === 0 || arr2.length === 0) return 0;

    const set1 = new Set(arr1);
    const set2 = new Set(arr2);
    const intersection = new Set([...set1].filter(x => set2.has(x)));
    const union = new Set([...set1, ...set2]);

    return (intersection.size / union.size) * 100;
  }

  // Calculate file statistics
  calculateFileStatistics(file) {
    const lines = file.content.split('\n').length;
    const codeBlocks = (file.content.match(/{[\s\S]*?}/g) || []).length;
    const functions = (file.content.match(/function|def |fn /g) || []).length;
    const variables = (file.content.match(/let |var |const |=/g) || []).length;

    return {
      lines,
      codeBlocks,
      functions,
      variables
    };
  }

  // Detect programming language from file extension and content
  detectLanguage(filename, content) {
    const extension = filename.split('.').pop().toLowerCase();
    
    const languageMap = {
      'js': 'JavaScript',
      'jsx': 'JavaScript (JSX)',
      'ts': 'TypeScript',
      'tsx': 'TypeScript (TSX)',
      'py': 'Python',
      'java': 'Java',
      'cpp': 'C++',
      'c': 'C',
      'cs': 'C#',
      'php': 'PHP',
      'rb': 'Ruby',
      'go': 'Go',
      'rs': 'Rust',
      'swift': 'Swift',
      'kt': 'Kotlin',
      'scala': 'Scala',
      'html': 'HTML',
      'css': 'CSS',
      'sql': 'SQL'
    };

    return languageMap[extension] || 'Unknown';
  }
}

module.exports = PlagiarismAnalyzer;
