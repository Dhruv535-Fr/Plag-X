import ast
import sys
from typing import List, Set

class PythonParser:
    @staticmethod
    def get_ast(file_path: str) -> ast.AST:
        """Parse Python file and return its AST."""
        try:
            with open(file_path, 'r', encoding='utf-8') as file:
                return ast.parse(file.read())
        except Exception as e:
            print(f"Error parsing {file_path}: {str(e)}")
            return None

    @staticmethod
    def get_node_types(tree: ast.AST) -> Set[str]:
        """Extract all node types from the AST."""
        return {type(node).__name__ for node in ast.walk(tree)}

    @staticmethod
    def get_function_names(tree: ast.AST) -> Set[str]:
        """Extract all function names from the AST."""
        return {node.name for node in ast.walk(tree) if isinstance(node, ast.FunctionDef)}

    @staticmethod
    def calculate_similarity(ast1: ast.AST, ast2: ast.AST) -> float:
        """Calculate similarity between two ASTs."""
        if not ast1 or not ast2:
            return 0.0

        # Get node types and function names
        nodes1 = PythonParser.get_node_types(ast1)
        nodes2 = PythonParser.get_node_types(ast2)
        funcs1 = PythonParser.get_function_names(ast1)
        funcs2 = PythonParser.get_function_names(ast2)

        # Calculate Jaccard similarity for both node types and function names
        node_similarity = len(nodes1.intersection(nodes2)) / len(nodes1.union(nodes2))
        
        # Calculate function name similarity if functions exist
        func_similarity = 0.0
        if funcs1 or funcs2:
            func_similarity = len(funcs1.intersection(funcs2)) / len(funcs1.union(funcs2))

        # Weighted average (giving more weight to structural similarity)
        return (0.7 * node_similarity + 0.3 * func_similarity) * 100

def main():
    if len(sys.argv) != 3:
        print("Usage: python py_parser.py <file1.py> <file2.py>")
        return

    file1, file2 = sys.argv[1], sys.argv[2]
    parser = PythonParser()
    
    ast1 = parser.get_ast(file1)
    ast2 = parser.get_ast(file2)
    
    similarity = parser.calculate_similarity(ast1, ast2)
    print(f"AST Similarity: {similarity:.2f}%")

if __name__ == "__main__":
    main()