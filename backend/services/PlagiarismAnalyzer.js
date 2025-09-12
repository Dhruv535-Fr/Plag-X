const path = require('path');
const fs = require('fs').promises;
const jaccardLogic = require('./logic/jaccard');
const astLogic = require('./logic/ast');

class PlagiarismAnalyzer {
  constructor() {
    this.comparisonLogicPath = path.join(__dirname, '../ComparisionLogic');
  }

  // Main analysis function - follows your described flow
  async analyzeFiles(file1Path, file2Path, language) {
    try {
      console.log(`Starting analysis: ${file1Path} vs ${file2Path} (${language})`);
      
      // Verify files exist
      const file1Exists = await this.fileExists(file1Path);
      const file2Exists = await this.fileExists(file2Path);
      
      if (!file1Exists || !file2Exists) {
        throw new Error(`Files not found: ${file1Path} (${file1Exists}), ${file2Path} (${file2Exists})`);
      }
      
      // Extract extensions and determine language
      const ext1 = this.getFileExtension(file1Path);
      const ext2 = this.getFileExtension(file2Path);
      const actualLanguage = this.determineLanguage(ext1);
      
      console.log(`File extensions: ${ext1}, ${ext2}, Language: ${actualLanguage}`);
      
      // If different extensions, similarity is 0
      if (!this.isSameLanguage(ext1, ext2)) {
        console.log(`Different languages: ${ext1} vs ${ext2} - Similarity: 0`);
        return {
          similarity: 0,
          details: {
            jaccard: { similarity: 0, method: 'Jaccard', reason: 'Different file types' },
            ast: { similarity: 0, method: 'AST', reason: 'Different file types' },
            combined: { similarity: 0, method: 'Combined', reason: 'Different file types' }
          }
        };
      }
      
      // ===== MAIN LOGIC FLOW =====
      // 1. Call Jaccard Logic
      console.log('Calling jaccardLogic...');
      const jaccardScore = await jaccardLogic(file1Path, file2Path);
      console.log('Jaccard result:', jaccardScore);
      
      // 2. Call AST Logic with language
      console.log('Calling astLogic...');
      const astScore = await astLogic(file1Path, file2Path, actualLanguage);
      console.log('AST result:', astScore);
      
      // 3. Combine results into final JSON/object
      const finalResult = {
        file1: path.basename(file1Path),
        file2: path.basename(file2Path),
        similarity: (jaccardScore + astScore) / 2, // Average of both scores
        details: {
          jaccard: { similarity: jaccardScore, method: 'Jaccard' },
          ast: { similarity: astScore, method: 'AST' },
          combined: { 
            similarity: (jaccardScore + astScore) / 2, 
            method: 'Combined Average',
            validMethods: 2
          }
        }
      };
      
      console.log('Final analysis result:', finalResult);
      return finalResult;
    } catch (error) {
      console.error('Analysis failed:', error);
      throw error;
    }
  }

  // Check if file exists
  async fileExists(filePath) {
    try {
      await fs.access(filePath);
      return true;
    } catch {
      return false;
    }
  }

  // Get file extension
  getFileExtension(filePath) {
    return path.extname(filePath).toLowerCase().substring(1);
  }

  // Check if two extensions belong to same language
  isSameLanguage(ext1, ext2) {
    const cppExtensions = ['cpp', 'c', 'cc', 'cxx'];
    const javaExtensions = ['java'];
    const pythonExtensions = ['py'];
    
    const isCpp1 = cppExtensions.includes(ext1);
    const isCpp2 = cppExtensions.includes(ext2);
    const isJava1 = javaExtensions.includes(ext1);
    const isJava2 = javaExtensions.includes(ext2);
    const isPython1 = pythonExtensions.includes(ext1);
    const isPython2 = pythonExtensions.includes(ext2);
    
    return (isCpp1 && isCpp2) || (isJava1 && isJava2) || (isPython1 && isPython2);
  }

  // Determine language from extension
  determineLanguage(extension) {
    const cppExtensions = ['cpp', 'c', 'cc', 'cxx'];
    const javaExtensions = ['java'];
    const pythonExtensions = ['py'];
    
    if (cppExtensions.includes(extension)) return 'cpp';
    if (javaExtensions.includes(extension)) return 'java';
    if (pythonExtensions.includes(extension)) return 'python';
    
    return 'unknown';
  }
}

module.exports = PlagiarismAnalyzer;
