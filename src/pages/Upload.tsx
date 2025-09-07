import { useState, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Upload as UploadIcon,
  FileCode,
  X,
  CheckCircle,
  AlertCircle,
  Play,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface UploadedFile {
  id: string;
  name: string;
  size: number;
  language: string;
  status: "pending" | "uploaded" | "error";
}

const supportedLanguages = [
  { value: "cpp", label: "C++", extensions: [".cpp", ".cc", ".cxx"] },
  { value: "c", label: "C", extensions: [".c"] },
  { value: "java", label: "Java", extensions: [".java"] },
  { value: "python", label: "Python", extensions: [".py"] },
];

export default function Upload() {
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [compareMode, setCompareMode] = useState<"pair" | "batch">("pair");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [progress, setProgress] = useState(0);

  const detectLanguage = (filename: string): string => {
    const extension = filename.toLowerCase().match(/\.[^.]+$/)?.[0];
    const lang = supportedLanguages.find(lang => 
      lang.extensions.includes(extension || "")
    );
    return lang?.label || "Unknown";
  };

  const formatFileSize = (bytes: number): string => {
    const sizes = ["B", "KB", "MB"];
    if (bytes === 0) return "0 B";
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${sizes[i]}`;
  };

  const handleFileSelect = useCallback((selectedFiles: FileList) => {
    const newFiles: UploadedFile[] = Array.from(selectedFiles).map(file => ({
      id: Math.random().toString(36).substr(2, 9),
      name: file.name,
      size: file.size,
      language: detectLanguage(file.name),
      status: "uploaded" as const,
    }));

    setFiles(prev => [...prev, ...newFiles]);
  }, []);

  const removeFile = (id: string) => {
    setFiles(files.filter(file => file.id !== id));
  };

  const startAnalysis = async () => {
    if (files.length < 2) return;
    
    setIsAnalyzing(true);
    setProgress(0);

    // Simulate analysis progress
    const progressInterval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          clearInterval(progressInterval);
          setIsAnalyzing(false);
          return 100;
        }
        return prev + Math.random() * 15;
      });
    }, 500);
  };

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const droppedFiles = e.dataTransfer.files;
    if (droppedFiles.length > 0) {
      handleFileSelect(droppedFiles);
    }
  }, [handleFileSelect]);

  const onDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
  }, []);

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Upload & Analyze</h1>
        <p className="text-muted-foreground mt-2">
          Upload your code files to detect potential plagiarism
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Upload Area - Takes 2 columns */}
        <div className="lg:col-span-2 space-y-6">
          {/* File Upload Card */}
          <Card className="bg-gradient-card shadow-card">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <UploadIcon className="h-5 w-5 text-primary" />
                <span>Upload Files</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div
                className="border-2 border-dashed border-border rounded-lg p-8 text-center hover:border-primary transition-colors cursor-pointer"
                onDrop={onDrop}
                onDragOver={onDragOver}
                onClick={() => document.getElementById("file-input")?.click()}
              >
                <FileCode className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium text-foreground mb-2">
                  Drag and drop files here
                </h3>
                <p className="text-muted-foreground mb-4">
                  or click to browse and select files
                </p>
                <p className="text-sm text-muted-foreground">
                  Supported: .cpp, .c, .java, .py (max 500KB each)
                </p>
              </div>
              <input
                id="file-input"
                type="file"
                multiple
                accept=".cpp,.c,.java,.py,.cc,.cxx"
                onChange={(e) => e.target.files && handleFileSelect(e.target.files)}
                className="hidden"
              />
            </CardContent>
          </Card>

          {/* Uploaded Files */}
          {files.length > 0 && (
            <Card className="bg-gradient-card shadow-card">
              <CardHeader>
                <CardTitle>Uploaded Files ({files.length})</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {files.map((file) => (
                    <div
                      key={file.id}
                      className="flex items-center justify-between p-3 rounded-lg bg-accent/30 border border-border"
                    >
                      <div className="flex items-center space-x-3">
                        <div className="flex items-center space-x-2">
                          {file.status === "uploaded" && (
                            <CheckCircle className="h-4 w-4 text-similarity-low" />
                          )}
                          {file.status === "error" && (
                            <AlertCircle className="h-4 w-4 text-similarity-high" />
                          )}
                          <FileCode className="h-4 w-4 text-muted-foreground" />
                        </div>
                        <div>
                          <p className="font-medium text-foreground">{file.name}</p>
                          <p className="text-sm text-muted-foreground">
                            {formatFileSize(file.size)}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Badge variant="secondary">{file.language}</Badge>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeFile(file.id)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Analysis Progress */}
          {isAnalyzing && (
            <Card className="bg-gradient-card shadow-card">
              <CardHeader>
                <CardTitle>Analyzing Code...</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <Progress value={progress} className="w-full" />
                  <div className="flex justify-between text-sm text-muted-foreground">
                    <span>Processing files with Jaccard & AST analysis</span>
                    <span>{Math.round(progress)}%</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Analysis Options Sidebar */}
        <div className="space-y-6">
          {/* Comparison Mode */}
          <Card className="bg-gradient-card shadow-card">
            <CardHeader>
              <CardTitle>Comparison Mode</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium text-foreground">
                  Analysis Type
                </label>
                <Select value={compareMode} onValueChange={(value: "pair" | "batch") => setCompareMode(value)}>
                  <SelectTrigger className="w-full mt-2">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pair">Compare Two Files</SelectItem>
                    <SelectItem value="batch">Batch Compare All</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {compareMode === "pair" && (
                <p className="text-sm text-muted-foreground">
                  Select exactly 2 files to compare them against each other.
                </p>
              )}

              {compareMode === "batch" && (
                <p className="text-sm text-muted-foreground">
                  Compare all uploaded files pairwise to find potential matches.
                </p>
              )}
            </CardContent>
          </Card>

          {/* Detection Methods */}
          <Card className="bg-gradient-card shadow-card">
            <CardHeader>
              <CardTitle>Detection Methods</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex items-center space-x-3">
                  <div className="h-2 w-2 bg-primary rounded-full"></div>
                  <div>
                    <p className="text-sm font-medium text-foreground">Jaccard Similarity</p>
                    <p className="text-xs text-muted-foreground">Token-based comparison</p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="h-2 w-2 bg-primary rounded-full"></div>
                  <div>
                    <p className="text-sm font-medium text-foreground">AST Analysis</p>
                    <p className="text-xs text-muted-foreground">Structure-based detection</p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="h-2 w-2 bg-primary rounded-full"></div>
                  <div>
                    <p className="text-sm font-medium text-foreground">Combined Score</p>
                    <p className="text-xs text-muted-foreground">Weighted final result</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Start Analysis */}
          <Card className="bg-gradient-primary shadow-glow border-0">
            <CardContent className="p-6">
              <Button
                onClick={startAnalysis}
                disabled={files.length < 2 || isAnalyzing}
                className="w-full bg-primary-foreground text-primary hover:bg-primary-foreground/90"
              >
                <Play className="mr-2 h-4 w-4" />
                {isAnalyzing ? "Analyzing..." : "Start Analysis"}
              </Button>
              {files.length < 2 && (
                <p className="text-primary-foreground/80 text-xs mt-2 text-center">
                  Upload at least 2 files to start
                </p>
              )}
            </CardContent>
          </Card>

          {/* Supported Languages */}
          <Card className="bg-gradient-card shadow-card">
            <CardHeader>
              <CardTitle>Supported Languages</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-2">
                {supportedLanguages.map((lang) => (
                  <Badge 
                    key={lang.value} 
                    variant="secondary"
                    className="justify-center"
                  >
                    {lang.label}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}