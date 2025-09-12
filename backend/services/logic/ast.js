const { exec } = require('child_process');
const path = require('path');
const fs = require('fs');

/**
 * AST Logic - Calls correct parser based on language
 * @param {string} file1 - Path to first file
 * @param {string} file2 - Path to second file
 * @param {string} language - Language type ('cpp', 'java', 'python')
 * @returns {Promise<number>} - Similarity score (0-1)
 */
module.exports = function astLogic(file1, file2, language) {
  return new Promise((resolve, reject) => {
    console.log(`[AST Logic] Comparing: ${file1} vs ${file2} (Language: ${language})`);
    
    const astPath = path.resolve(__dirname, '../../ComparisionLogic/AST');
    let command = '';
    let executablePath = '';
    
    // Convert file paths to absolute paths first, then to relative paths from AST directory
    const absoluteFile1 = path.resolve(file1);
    const absoluteFile2 = path.resolve(file2);
    const relativeFile1 = path.relative(astPath, absoluteFile1);
    const relativeFile2 = path.relative(astPath, absoluteFile2);
    
    // Choose correct parser based on language
    switch (language.toLowerCase()) {
      case 'cpp':
      case 'c++':
        executablePath = path.join(astPath, 'AST.exe');
        command = `AST.exe "${relativeFile1}" "${relativeFile2}"`;
        break;
        
      case 'java':
        executablePath = path.join(astPath, 'Java_parser.class');
        const jarPath = path.join(astPath, 'javaparser-core-3.25.5.jar');
        // Use relative paths for Java too
        command = `java -cp ".;javaparser-core-3.25.5.jar" Java_parser "${relativeFile1}" "${relativeFile2}"`;
        break;
        
      case 'python':
        executablePath = path.join(astPath, 'py_parser.py');
        command = `python py_parser.py "${relativeFile1}" "${relativeFile2}"`;
        break;
        
      default:
        console.error(`[AST Logic] Unsupported language: ${language}`);
        return resolve(0);
    }
    
    // Check if required files exist (except for Java which uses classpath)
    if (language !== 'java' && !fs.existsSync(executablePath)) {
      console.error(`[AST Logic] Parser not found: ${executablePath}`);
      return resolve(0);
    }
    
    console.log(`[AST Logic] Command: ${command}`);
    
    // Execute AST comparison
    exec(command, {
      timeout: 30000,
      cwd: astPath // This is important - AST.exe needs to run from its directory
    }, (error, stdout, stderr) => {
      if (error) {
        console.error(`[AST Logic] Execution error:`, error.message);
        return resolve(0); // Return 0 on error
      }
      
      if (stderr) {
        console.log(`[AST Logic] stderr:`, stderr);
      }
      
      console.log(`[AST Logic] stdout:`, stdout);
      
      // Parse output to extract similarity score
      let similarity = 0;
      const output = stdout.trim();
      
      if (output) {
        // Look for percentage or decimal number in output
        const match = output.match(/([\d.]+)%?/);
        if (match) {
          similarity = parseFloat(match[1]);
          
          // Convert percentage to decimal if needed
          if (similarity > 1) {
            similarity = similarity / 100;
          }
        }
      }
      
      // Ensure score is in 0-1 range
      similarity = Math.min(Math.max(similarity, 0), 1);
      
      console.log(`[AST Logic] Final score: ${similarity}`);
      resolve(similarity);
    });
  });
};
