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
  XCircle,
  Clock,
} from "lucide-react";

interface AnalysisResult {
  id: string;
  file1: string;
  file2: string;
  language: string;
  similarity: number;
  method: string;
  status: string;
  error?: string;
  isError?: boolean;
}

interface AnalysisError {
  file1: string;
  file2: string;
  error: string;
  language: string;
}

export default function Upload() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisProgress, setAnalysisProgress] = useState(0);
  const [analysisResults, setAnalysisResults] = useState<AnalysisResult[]>([]);
  const [analysisErrors, setAnalysisErrors] = useState<AnalysisError[]>([]);
  const [currentAnalysis, setCurrentAnalysis] = useState<string>("");
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

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
    (acceptedFiles: File[], rejectedFiles: any[]) => {
      setUploadError(null); // Clear previous errors
      
      const supportedExtensions = getSupportedExtensions();
      const validFiles = acceptedFiles.filter((file) => {
        const extension = file.name.split(".").pop()?.toLowerCase() || "";
        return supportedExtensions.includes(extension);
      });

      // Handle rejected files
      if (rejectedFiles.length > 0) {
        const errors = rejectedFiles.map(rejection => 
          rejection.errors?.map((error: any) => error.message).join(", ") || "File rejected"
        );
        setUploadError(`Some files were rejected: ${errors.join("; ")}`);
      }

      // Handle unsupported file types
      if (validFiles.length !== acceptedFiles.length) {
        const unsupportedFiles = acceptedFiles.filter(file => !validFiles.includes(file));
        const unsupportedNames = unsupportedFiles.map(f => f.name).join(", ");
        setUploadError(
          `Unsupported file types detected: ${unsupportedNames}. Only C++, Java, and Python files are supported.`
        );
      }

      if (validFiles.length > 0) {
        const totalFiles = uploadedFiles.length + validFiles.length;
        if (totalFiles > 10) {
          setUploadError(`Too many files. Maximum 10 files allowed. You currently have ${uploadedFiles.length} files.`);
          return;
        }
        setUploadedFiles((prev) => [...prev, ...validFiles]);
      }
    },
    [setUploadedFiles]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    multiple: true,
    maxSize: 10 * 1024 * 1024, // 10MB
    maxFiles: 10, // Limit to 10 files to prevent too many comparisons
  });

  const removeFile = (index: number) => {
    setUploadedFiles((prev) => prev.filter((_, i) => i !== index));
    // Clear errors when files change
    setUploadError(null);
    setSuccessMessage(null);
  };

  const clearAllFiles = () => {
    setUploadedFiles([]);
    setAnalysisResults([]);
    setAnalysisErrors([]);
    setUploadError(null);
    setSuccessMessage(null);
  };

  const handleAnalysis = async () => {
    if (uploadedFiles.length < 2) {
      setUploadError("Please upload at least 2 files for comparison");
      return;
    }

    // Clear previous errors and results
    setUploadError(null);
    setAnalysisErrors([]);
    setSuccessMessage(null);

    // Group files by extension
    const fileGroups = groupFilesByExtension(uploadedFiles);

    // Check if we have files to compare
    const groupsWithMultipleFiles = Object.entries(fileGroups).filter(
      ([, files]) => files.length >= 2
    );

    if (groupsWithMultipleFiles.length === 0) {
      setUploadError(
        "Please upload at least 2 files of the same type (same extension) for comparison"
      );
      return;
    }

    setIsAnalyzing(true);
    setAnalysisProgress(0);
    setAnalysisResults([]);
    setCurrentAnalysis("");

    try {
      const allResults: AnalysisResult[] = [];
      const allErrors: AnalysisError[] = [];
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
                setCurrentAnalysis(`Analyzing ${files[i].name} vs ${files[j].name}`);
                
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
                  timeout: 120000, // 2 minute timeout for analysis
                });

                if (response.data.success && response.data.data) {
                  const similarity = response.data.data.similarity || 0;
                  const reportId = response.data.data.reportId;
                  
                  if (!reportId) {
                    throw new Error("No report ID returned from server");
                  }
                  
                  allResults.push({
                    id: reportId,
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
                } else {
                  throw new Error(response.data.message || "Analysis failed - no data returned");
                }
              } catch (error: any) {
                console.error(
                  `Error analyzing ${files[i].name} vs ${files[j].name}:`,
                  error
                );
                
                let errorMessage = "Unknown error occurred";
                if (error.response?.status === 429) {
                  errorMessage = "Too many requests - server is busy. Please try again later.";
                } else if (error.response?.data?.message) {
                  errorMessage = error.response.data.message;
                } else if (error.message) {
                  errorMessage = error.message;
                } else if (error.code === 'ECONNABORTED') {
                  errorMessage = "Request timeout - analysis took too long";
                } else if (error.response?.status === 413) {
                  errorMessage = "Files too large";
                } else if (error.response?.status >= 500) {
                  errorMessage = "Server error - please try again";
                }
                
                allErrors.push({
                  file1: files[i].name,
                  file2: files[j].name,
                  error: errorMessage,
                  language: getFileLanguage(files[i].name),
                });
              }

              completedComparisons++;
              setAnalysisProgress((completedComparisons / totalComparisons) * 100);
              
              // Add a small delay between requests to prevent rate limiting
              if (completedComparisons < totalComparisons) {
                await new Promise(resolve => setTimeout(resolve, 1000)); // 1 second delay
              }
            }
          }
        }
      }

      setAnalysisResults(allResults);
      setAnalysisErrors(allErrors);

      // Set final status message
      setCurrentAnalysis("");
      
      if (allResults.length > 0) {
        setSuccessMessage(
          `Analysis completed successfully! Generated ${allResults.length} comparison report${allResults.length > 1 ? 's' : ''}.`
        );
      }
      
      if (allResults.length === 0 && allErrors.length > 0) {
        setUploadError("All analyses failed. Please check your files and try again.");
      } else if (allErrors.length > 0) {
        setUploadError(`${allErrors.length} comparison(s) failed, but ${allResults.length} succeeded.`);
      }
      
    } catch (error: any) {
      console.error("Analysis failed:", error);
      
      let errorMessage = "Analysis failed. Please try again.";
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      setUploadError(errorMessage);
    } finally {
      setIsAnalyzing(false);
      setAnalysisProgress(0);
      setCurrentAnalysis("");
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
    if (!resultId || resultId.includes('-')) {
      // If it's a fallback ID (contains dash), show error
      setUploadError("This report is not available. The analysis may have failed to save properly.");
      return;
    }
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
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-medium text-foreground">
                      Uploaded Files ({uploadedFiles.length})
                    </h4>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={clearAllFiles}
                      disabled={isAnalyzing}
                    >
                      <X className="mr-1 h-3 w-3" />
                      Clear All
                    </Button>
                  </div>

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
                <div className="mt-4 space-y-3">
                  <div className="flex justify-between text-sm mb-2">
                    <span>Analysis Progress</span>
                    <span>{Math.round(analysisProgress)}%</span>
                  </div>
                  <Progress value={analysisProgress} className="h-2" />
                  {currentAnalysis && (
                    <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                      <Clock className="h-4 w-4 animate-spin" />
                      <span>{currentAnalysis}</span>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Error Display */}
          {uploadError && (
            <Alert variant="destructive">
              <XCircle className="h-4 w-4" />
              <AlertDescription>{uploadError}</AlertDescription>
            </Alert>
          )}

          {/* Success Message */}
          {successMessage && (
            <Alert variant="default" className="border-green-500/20 bg-green-500/5">
              <CheckCircle className="h-4 w-4 text-green-500" />
              <AlertDescription className="text-green-700">{successMessage}</AlertDescription>
            </Alert>
          )}

          {/* Analysis Errors */}
          {analysisErrors.length > 0 && (
            <Card className="bg-gradient-card shadow-card border-yellow-500/20">
              <CardHeader>
                <CardTitle className="text-foreground flex items-center">
                  <AlertTriangle className="mr-2 h-4 w-4 text-yellow-500" />
                  Analysis Issues ({analysisErrors.length})
                </CardTitle>
                <p className="text-sm text-muted-foreground">
                  Some comparisons failed but others may have succeeded
                </p>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {analysisErrors.map((error, index) => (
                    <div
                      key={index}
                      className="flex items-start justify-between p-3 bg-yellow-500/5 border border-yellow-500/20 rounded-lg"
                    >
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-1">
                          <Badge variant="outline">{error.language}</Badge>
                          <Badge variant="destructive">Failed</Badge>
                        </div>
                        <p className="text-sm font-medium">
                          {error.file1} vs {error.file2}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Error: {error.error}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

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
                  <span>Maximum 10 files per analysis</span>
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