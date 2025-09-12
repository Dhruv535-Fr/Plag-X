#include <iostream>
#include <fstream>
#include <sstream>
#include <regex>
#include <set>
#include <algorithm> // Add this at the top

using namespace std;

// Step 1: Read file content
string readCode(const string& filename) {
    ifstream file(filename);
    if (!file) {
        cerr << "Error: Cannot open " << filename << endl;
        exit(1);
    }
    stringstream buffer;
    buffer << file.rdbuf();
    return buffer.str();
}

// Step 2: Normalize code (remove comments, compress spaces)
string normalizeCode(const string& code, const string& filename) {
    string clean = code;

    // Remove single-line comments
    clean = regex_replace(clean, regex("//.*"), "");           // C/C++/Java
    clean = regex_replace(clean, regex("#.*"), "");            // Python / C Macros

    // Remove multi-line comments (/* ... */)
    clean = regex_replace(clean, regex("/\\*[^*]*\\*+(?:[^/*][^*]*\\*+)*/"), "");

    // Remove newlines and tabs
    clean = regex_replace(clean, regex("[\\n\\t]"), " ");
    clean = regex_replace(clean, regex("\\s+"), " ");

    return clean;
}

// Step 3: Get appropriate regex based on file extension
regex getLanguageRegex(const string& filename) {
    string ext = filename.substr(filename.find_last_of('.') + 1);

    if (ext == "py") {
        return regex("[a-zA-Z_][a-zA-Z0-9_]*|[:=+*/<>!\\-]+"); // Dash at end
    } else if (ext == "java" || ext == "cpp" || ext == "c") {
        return regex("[a-zA-Z_][a-zA-Z0-9_]*|[{}();=+*/<>!&|\\-]+"); // Dash at end
    } else {
        cerr << "Unsupported file extension: " << ext << endl;
        exit(1);
    }
}

// Step 4: Tokenize code
set<string> tokenize(const string& code, const string& filename) {
    set<string> tokens;
    regex tokenRegex = getLanguageRegex(filename);

    auto words_begin = sregex_iterator(code.begin(), code.end(), tokenRegex);
    auto words_end = sregex_iterator();

    for (auto it = words_begin; it != words_end; ++it) {
        string token = it->str();
        // Convert token to lowercase for case-insensitive comparison
        transform(token.begin(), token.end(), token.begin(), ::tolower);
        tokens.insert(token);
    }

    return tokens;
}

// Step 5: Jaccard Similarity
double jaccardSimilarity(const set<string>& tokens1, const set<string>& tokens2) {
    int intersection = 0;
    for (const string& token : tokens1) {
        if (tokens2.find(token) != tokens2.end()) {
            intersection++;
        }
    }

    int unionSize = tokens1.size() + tokens2.size() - intersection;
    if (unionSize == 0) return 0.0;

    return (double)intersection / unionSize * 100.0;
}

// Step 6: Main
int main(int argc, char* argv[]) {
    if (argc != 3) {
        cerr << "Usage: ./jaccard file1.cpp file2.py\n";
        return 1;
    }

    string file1 = argv[1];
    string file2 = argv[2];

    string code1 = readCode(file1);
    string code2 = readCode(file2);

    string norm1 = normalizeCode(code1, file1);
    string norm2 = normalizeCode(code2, file2);

    set<string> tokens1 = tokenize(norm1, file1);
    set<string> tokens2 = tokenize(norm2, file2);

    double similarity = jaccardSimilarity(tokens1, tokens2);
    cout << "Jaccard Similarity: " << similarity << "%" << endl;

    return 0;
}
