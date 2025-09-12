import com.github.javaparser.JavaParser;
import com.github.javaparser.ast.CompilationUnit;
import com.github.javaparser.ast.visitor.VoidVisitorAdapter;
import java.io.FileInputStream;
import java.util.ArrayList;
import java.util.List;

public class Java_parser {
    private static List<String> structures = new ArrayList<>();

    public static double compareFiles(String file1, String file2) {
        try {
            // Parse both files
            CompilationUnit cu1 = parseFile(file1);
            CompilationUnit cu2 = parseFile(file2);

            // Extract structures from both files
            structures.clear();
            List<String> structures1 = extractStructure(cu1);
            List<String> structures2 = extractStructure(cu2);

            // Compare structures and calculate similarity
            return calculateSimilarity(structures1, structures2);
        } catch (Exception e) {
            System.err.println("Error comparing files: " + e.getMessage());
            return 0.0;
        }
    }

    private static CompilationUnit parseFile(String filePath) throws Exception {
        FileInputStream in = new FileInputStream(filePath);
        try {
            JavaParser parser = new JavaParser();
            com.github.javaparser.ParseResult<CompilationUnit> result = parser.parse(in);
            if (result.isSuccessful() && result.getResult().isPresent()) {
                return result.getResult().get();
            } else {
                throw new RuntimeException("Could not parse file: " + filePath);
            }
        } finally {
            in.close();
        }
    }

    private static List<String> extractStructure(CompilationUnit cu) {
        List<String> nodeTypes = new ArrayList<>();
        new VoidVisitorAdapter<Object>() {
            @Override
            public void visit(CompilationUnit n, Object arg) {
                nodeTypes.add("CompilationUnit");
                super.visit(n, arg);
            }
            // Add more visit methods for different node types
        }.visit(cu, null);
        return nodeTypes;
    }

    private static double calculateSimilarity(List<String> struct1, List<String> struct2) {
        int matches = 0;
        int total = Math.max(struct1.size(), struct2.size());
        
        for (String node : struct1) {
            if (struct2.contains(node)) {
                matches++;
            }
        }
        
        return total == 0 ? 0.0 : (double) matches / total * 100.0;
    }

    public static void main(String[] args) {
        if (args.length != 2) {
            System.out.println("Usage: java Java_parser <file1> <file2>");
            return;
        }

        String file1 = args[0];
        String file2 = args[1];
        
        double similarity = compareFiles(file1, file2);
        System.out.println("AST Similarity: " + similarity + "%");
    }
}