#include <iostream>
#include <fstream>
#include <string>
#include <set>
#include <sstream>
#include <vector>
#include <algorithm>

using namespace std;

// Helper to get file extension
string get_extension(const string& filename) {
    size_t pos = filename.find_last_of('.');
    if (pos == string::npos) return "";
    return filename.substr(pos + 1);
}

// Calculate Jaccard similarity between two AST strings
double jaccard_similarity(const string& ast1, const string& ast2) {
    set<string> set1, set2;
    istringstream iss1(ast1), iss2(ast2);
    string line;
    
    // Split AST1 into lines and add to set
    while (getline(iss1, line)) {
        if (!line.empty()) {
            set1.insert(line);
        }
    }
    
    // Split AST2 into lines and add to set
    while (getline(iss2, line)) {
        if (!line.empty()) {
            set2.insert(line);
        }
    }
    
    // Calculate intersection
    vector<string> intersection;
    set_intersection(set1.begin(), set1.end(), 
                    set2.begin(), set2.end(), 
                    back_inserter(intersection));
    
    // Calculate union
    vector<string> union_set;
    set_union(set1.begin(), set1.end(), 
             set2.begin(), set2.end(), 
             back_inserter(union_set));
    
    // Return Jaccard similarity
    if (union_set.empty()) return 0.0;
    return (double)intersection.size() / union_set.size();
}

// Dummy parser call (replace with real parser logic)
string parse_cpp_ast(const string& filename) {
    string command = "cpp_parser.exe \"" + filename + "\"";
    FILE* pipe = _popen(command.c_str(), "r");
    if (!pipe) {
        return "ERROR";
    }
    
    char buffer[128];
    string result = "";
    while (fgets(buffer, sizeof(buffer), pipe) != NULL) {
        result += buffer;
    }
    _pclose(pipe);
    return result;
}

string parse_python_ast(const string& filename) {
    string command = "python py_parser.py \"" + filename + "\"";
    FILE* pipe = _popen(command.c_str(), "r");
    if (!pipe) {
        return "ERROR";
    }
    
    char buffer[128];
    string result = "";
    while (fgets(buffer, sizeof(buffer), pipe) != NULL) {
        result += buffer;
    }
    _pclose(pipe);
    return result;
}

string parse_java_ast(const string& filename) {
    string command = "java Java_parser \"" + filename + "\"";
    FILE* pipe = _popen(command.c_str(), "r");
    if (!pipe) {
        return "ERROR";
    }
    
    char buffer[128];
    string result = "";
    while (fgets(buffer, sizeof(buffer), pipe) != NULL) {
        result += buffer;
    }
    _pclose(pipe);
    return result;
}

// Update the main function to handle the parser outputs
int main(int argc, char* argv[]) {
    if (argc != 3) {
        cerr << "Usage: ./AST file1 file2\n";
        return 1;
    }

    string file1 = argv[1];
    string file2 = argv[2];
    string ext1 = get_extension(file1);
    string ext2 = get_extension(file2);

    // Check if files have same extension
    if (ext1 != ext2) {
        cout << "AST Similarity: 0.00%" << endl;
        return 0;
    }

    string ast1, ast2;

    if (ext1 == "cpp" || ext1 == "c" || ext1 == "cc" || ext1 == "cxx") {
        ast1 = parse_cpp_ast(file1);
        ast2 = parse_cpp_ast(file2);
    } else if (ext1 == "py") {
        ast1 = parse_python_ast(file1);
        ast2 = parse_python_ast(file2);
    } else if (ext1 == "java") {
        ast1 = parse_java_ast(file1);
        ast2 = parse_java_ast(file2);
    } else {
        cout << "AST Similarity: 0.00%" << endl;
        return 0;
    }

    // Check for parser errors
    if (ast1 == "ERROR" || ast2 == "ERROR") {
        cout << "AST Similarity: 0.00%" << endl;
        return 0;
    }

    // Calculate similarity between ASTs
    double similarity = jaccard_similarity(ast1, ast2);
    
    // Output similarity as percentage
    cout << "AST Similarity: " << (similarity * 100.0) << "%" << endl;

    return 0;
}