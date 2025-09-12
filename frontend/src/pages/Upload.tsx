import { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import api from "@/lib/api";
import {
  Upload as UploadIcon,
  FileText,
  X,
  Play,
  CheckCircle,
  AlertTriangle,
  Eye,
} from "lucide-react";

interface AnalysisResult {
  id: string;
  file1: string;
  file2: string;
  language: string;
  similarity: number;
  method: string;
  status: string;
}

export default function Upload() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisProgress, setAnalysisProgress] = useState(0);
  const [analysisResults, setAnalysisResults] = useState<AnalysisResult[]>([]);

  const getFileLanguage = (filename: string): string => {
    const extension = filename.split(".").pop()?.toLowerCase() || "";
    const langMap: { [key: string]: string } = {
      cpp: "C++",
      c: "C++",
      cc: "C++",
      cxx: "C++",
      java: "Java",
      py: "Python",
    };
    return langMap[extension] || "Unknown";
  };

  const getSupportedExtensions = (): string[] => {
    return ["cpp", "c", "cc", "cxx", "java", "py"];
  };

  const groupFilesByExtension = (files: File[]) => {
    const groups: { [key: string]: File[] } = {};

    files.forEach((file) => {
      const extension = file.name.split(".").pop()?.toLowerCase() || "";
      const supportedExtensions = getSupportedExtensions();

      if (supportedExtensions.includes(extension)) {
        // Normalize C++ extensions
        const normalizedExt = ["cpp", "c", "cc", "cxx"].includes(extension)
          ? "cpp"
          : extension;

        if (!groups[normalizedExt]) {
          groups[normalizedExt] = [];
        }
        groups[normalizedExt].push(file);
      }
    });

    return groups;
  };

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      const supportedExtensions = getSupportedExtensions();
      const validFiles = acceptedFiles.filter((file) => {
        const extension = file.name.split(".").pop()?.toLowerCase() || "";
        return supportedExtensions.includes(extension);
      });

      if (validFiles.length !== acceptedFiles.length) {
        alert(
          "Some files were not uploaded. Only C++, Java, and Python files are supported."
        );
      }

      setUploadedFiles((prev) => [...prev, ...validFiles]);
    },
    [setUploadedFiles]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    multiple: true,
    maxSize: 10 * 1024 * 1024, // 10MB
  });

  const removeFile = (index: number) => {
    setUploadedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleAnalysis = async () => {
    if (uploadedFiles.length < 2) {
      alert("Please upload at least 2 files for comparison");
      return;
    }

    // Group files by extension
    const fileGroups = groupFilesByExtension(uploadedFiles);

    // Check if we have files to compare
    const groupsWithMultipleFiles = Object.entries(fileGroups).filter(
      ([, files]) => files.length >= 2
    );

    if (groupsWithMultipleFiles.length === 0) {
      alert(
        "Please upload at least 2 files of the same type (same extension) for comparison"
      );
      return;
    }

    setIsAnalyzing(true);
    setAnalysisProgress(0);
    setAnalysisResults([]);

    try {
      const allResults: AnalysisResult[] = [];
      let completedComparisons = 0;
      let totalComparisons = 0;

      // Calculate total comparisons
      groupsWithMultipleFiles.forEach(([, files]) => {
        for (let i = 0; i < files.length - 1; i++) {
          for (let j = i + 1; j < files.length; j++) {
            totalComparisons++;
          }
        }
      });

      // Analyze each group separately
      for (const [extension, files] of groupsWithMultipleFiles) {
        if (files.length >= 2) {
          // Compare each pair of files in the group
          for (let i = 0; i < files.length - 1; i++) {
            for (let j = i + 1; j < files.length; j++) {
              try {
                const formData = new FormData();
                formData.append("files", files[i]);
                formData.append("files", files[j]);
                formData.append(
                  "title",
                  `Analysis of ${files[i].name} vs ${files[j].name}`
                );
                formData.append("description", "Automated plagiarism analysis");

                const response = await api.post("/analysis/analyze", formData, {
                  headers: {
                    "Content-Type": "multipart/form-data",
                  },
                });

                if (response.data.success) {
                  const similarity = response.data.data.similarity || 0;
                  allResults.push({
                    id: response.data.data.reportId || `${Date.now()}-${i}-${j}`,
                    file1: files[i].name,
                    file2: files[j].name,
                    language: getFileLanguage(files[i].name),
                    similarity: similarity,
                    method: "Combined",
                    status:
                      similarity >= 0.8
                        ? "High Risk"
                        : similarity >= 0.5
                        ? "Medium Risk"
                        : "Low Risk",
                  });
                }
              } catch (error) {
                console.error(
                  `Error analyzing ${files[i].name} vs ${files[j].name}:`,
                  error
                );
                // Continue with other comparisons even if one fails
              }

              completedComparisons++;
              setAnalysisProgress((completedComparisons / totalComparisons) * 100);
            }
          }
        }
      }

      setAnalysisResults(allResults);

      if (allResults.length > 0) {
        alert(
          `Analysis completed! Found ${allResults.length} comparisons. Check the results below.`
        );
      } else {
        alert(
          "Analysis completed but no results were generated. Please try again."
        );
      }
    } catch (error) {
      console.error("Analysis failed:", error);
      alert(
        "Analysis failed. Please try again or check your internet connection."
      );
    } finally {
      setIsAnalyzing(false);
      setAnalysisProgress(0);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "High Risk":
        return "bg-red-500";
      case "Medium Risk":
        return "bg-yellow-500";
      case "Low Risk":
        return "bg-green-500";
      default:
        return "bg-gray-500";
    }
  };

  const viewReport = (resultId: string) => {
    navigate(`/reports/${resultId}`);
  };

  // Group uploaded files by extension for display
  const fileGroups = groupFilesByExtension(uploadedFiles);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground">Upload & Analyze</h1>
        <p className="text-muted-foreground mt-2">
          Upload your code files to detect plagiarism and analyze similarities.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main Upload Area */}
        <div className="lg:col-span-2 space-y-6">
          {/* File Upload */}
          <Card className="bg-gradient-card shadow-card">
            <CardHeader>
              <CardTitle className="text-foreground">File Upload</CardTitle>
              <p className="text-sm text-muted-foreground">
                Drag and drop files or click to select. Upload at least 2 files for
                comparison.
              </p>
            </CardHeader>
            <CardContent>
              <div
                {...getRootProps()}
                className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
                  isDragActive
                    ? "border-primary bg-primary/5"
                    : "border-muted-foreground/25 hover:border-primary/50"
                }`}
              >
                <input {...getInputProps()} />
                <UploadIcon className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium text-foreground mb-2">
                  {isDragActive ? "Drop files here" : "Drag & drop files here"}
                </h3>
                <p className="text-muted-foreground">or click to select files</p>
              </div>

              {/* Uploaded Files */}
              {uploadedFiles.length > 0 && (
                <div className="mt-6">
                  <h4 className="font-medium text-foreground mb-3">
                    Uploaded Files ({uploadedFiles.length})
                  </h4>

                  {/* Group files by extension */}
                  {Object.entries(fileGroups).map(([extension, files]) => (
                    <div key={extension} className="mb-4">
                      <h5 className="text-sm font-medium text-muted-foreground mb-2">
                        {getFileLanguage(files[0].name)} Files ({files.length})
                      </h5>
                      <div className="space-y-2">
                        {files.map((file, index) => {
                          const originalIndex = uploadedFiles.indexOf(file);
                          return (
                            <div
                              key={originalIndex}
                              className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
                            >
                              <div className="flex items-center space-x-3">
                                <FileText className="h-4 w-4 text-muted-foreground" />
                                <span className="text-sm font-medium">{file.name}</span>
                                <Badge variant="secondary">
                                  {getFileLanguage(file.name)}
                                </Badge>
                              </div>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => removeFile(originalIndex)}
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Analysis Button */}
              <div className="mt-6 flex justify-center">
                <Button
                  onClick={handleAnalysis}
                  disabled={uploadedFiles.length < 2 || isAnalyzing}
                  className="bg-gradient-primary hover:shadow-glow transition-all"
                >
                  {isAnalyzing ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Analyzing...
                    </>
                  ) : (
                    <>
                      <Play className="mr-2 h-4 w-4" />
                      Start Analysis
                    </>
                  )}
                </Button>
              </div>

              {/* Analysis Progress */}
              {isAnalyzing && (
                <div className="mt-4">
                  <div className="flex justify-between text-sm mb-2">
                    <span>Analysis Progress</span>
                    <span>{Math.round(analysisProgress)}%</span>
                  </div>
                  <Progress value={analysisProgress} className="h-2" />
                </div>
              )}
            </CardContent>
          </Card>

          {/* Analysis Results */}
          {analysisResults.length > 0 && (
            <Card className="bg-gradient-card shadow-card">
              <CardHeader>
                <CardTitle className="text-foreground">Analysis Results</CardTitle>
                <p className="text-sm text-muted-foreground">
                  Comparison results for uploaded files
                </p>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {analysisResults.map((result, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-4 border rounded-lg"
                    >
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <Badge variant="outline">{result.language}</Badge>
                          <Badge className={getStatusColor(result.status)}>
                            {result.status}
                          </Badge>
                        </div>
                        <p className="text-sm font-medium">
                          {result.file1} vs {result.file2}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Similarity: {Math.round(result.similarity * 100)}% • Method:{" "}
                          {result.method}
                        </p>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => viewReport(result.id)}
                      >
                        <Eye className="mr-2 h-4 w-4" />
                        View Report
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Supported Languages */}
          <Card className="bg-gradient-card shadow-card">
            <CardHeader>
              <CardTitle className="text-foreground">Supported Languages</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm">C++</span>
                  <Badge variant="secondary">.cpp, .c, .cc, .cxx</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Java</span>
                  <Badge variant="secondary">.java</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Python</span>
                  <Badge variant="secondary">.py</Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Upload Guidelines */}
          <Card className="bg-gradient-card shadow-card">
            <CardHeader>
              <CardTitle className="text-foreground flex items-center">
                <AlertTriangle className="mr-2 h-4 w-4" />
                Upload Guidelines
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 text-sm">
                <div className="flex items-start space-x-2">
                  <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                  <span>Upload at least 2 files for comparison</span>
                </div>
                <div className="flex items-start space-x-2">
                  <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                  <span>Maximum file size: 10MB each</span>
                </div>
                <div className="flex items-start space-x-2">
                  <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                  <span>Maximum 20 files per analysis</span>
                </div>
                <div className="flex items-start space-x-2">
                  <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                  <span>Remove sensitive information</span>
                </div>
                <div className="flex items-start space-x-2">
                  <AlertTriangle className="h-4 w-4 text-orange-500 mt-0.5 flex-shrink-0" />
                  <span>Files are processed securely and not stored permanently</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}