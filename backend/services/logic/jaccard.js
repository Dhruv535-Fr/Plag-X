const { exec } = require('child_process');
const path = require('path');
const fs = require('fs');

/**
 * Jaccard Logic - Sends both files to Jaccard comparison program
 * @param {string} file1 - Path to first file
 * @param {string} file2 - Path to second file
 * @returns {Promise<number>} - Similarity score (0-1)
 */
module.exports = function jaccardLogic(file1, file2) {
  return new Promise((resolve, reject) => {
    console.log(`[Jaccard Logic] Comparing: ${file1} vs ${file2}`);
    
    // Path to jaccard.exe
    const jaccardExe = path.resolve(__dirname, '../../ComparisionLogic/jaccard.exe');
    
    // Check if executable exists
    if (!fs.existsSync(jaccardExe)) {
      console.error(`[Jaccard Logic] Executable not found: ${jaccardExe}`);
      return resolve(0); // Return 0 if tool not available
    }
    
    // Convert to absolute paths
    const absoluteFile1 = path.resolve(file1);
    const absoluteFile2 = path.resolve(file2);
    
    // Build command with absolute paths
    const command = `"${jaccardExe}" "${absoluteFile1}" "${absoluteFile2}"`;
    console.log(`[Jaccard Logic] Command: ${command}`);
    
    // Execute jaccard comparison
    exec(command, { 
      timeout: 30000,
      cwd: path.dirname(jaccardExe)
    }, (error, stdout, stderr) => {
      if (error) {
        console.error(`[Jaccard Logic] Execution error:`, error.message);
        return resolve(0); // Return 0 on error
      }
      
      if (stderr) {
        console.log(`[Jaccard Logic] stderr:`, stderr);
      }
      
      console.log(`[Jaccard Logic] stdout:`, stdout);
      
      // Parse output to extract similarity score
      let similarity = 0;
      const output = stdout.trim();
      
      if (output) {
        // Look for percentage or decimal number
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
      
      console.log(`[Jaccard Logic] Final score: ${similarity}`);
      resolve(similarity);
    });
  });
};
