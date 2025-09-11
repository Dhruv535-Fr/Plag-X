import { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { toast } from "@/hooks/use-toast";
import {
  Upload as UploadIcon,
  FileText,
  X,
  CheckCircle,
  AlertCircle,
  Loader2,
} from "lucide-react";
import { analysisAPI, reportsAPI } from "@/lib/api";
import { cn } from "@/lib/utils";

interface UploadedFile extends File {
  id: string;
  preview?: string;
}

const Upload = () => {
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [tags, setTags] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [progress, setProgress] = useState(0);
  const navigate = useNavigate();

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const newFiles = acceptedFiles.map(file => ({
      ...file,
      id: Math.random().toString(36).substr(2, 9)
    }));
    
    setFiles(prev => [...prev, ...newFiles]);
    toast({
      title: "Files added",
      description: `${acceptedFiles.length} file(s) added for analysis.`,
    });
  }, []);

  const removeFile = (fileId: string) => {
    setFiles(prev => prev.filter(file => file.id !== fileId));
  };

  const handleAnalyze = async () => {
    if (files.length < 2) {
      toast({
        title: "Insufficient files",
        description: "Please upload at least 2 files for comparison.",
        variant: "destructive",
      });
      return;
    }

    setIsAnalyzing(true);
    setProgress(0);

    try {
      // Simulate progress
      const progressInterval = setInterval(() => {
        setProgress(prev => {
          if (prev < 90) return prev + 10;
          return prev;
        });
      }, 200);

      // Prepare form data
      const formData = new FormData();
      files.forEach(file => {
        formData.append('files', file);
      });
      
      if (title) formData.append('title', title);
      if (description) formData.append('description', description);
      if (tags) formData.append('tags', tags);

      // Analyze files
      const analysisResponse = await analysisAPI.analyzeFiles(formData);
      
      clearInterval(progressInterval);
      setProgress(100);

      // Create report from analysis
      const reportData = {
        title: analysisResponse.data.title,
        description: analysisResponse.data.description,
        files: analysisResponse.data.files.map((file: any) => ({
          name: file.name,
          originalName: file.originalName,
          content: '', // Content is processed on backend
          size: file.size,
          language: file.language,
          extension: file.extension
        })),
        analysis: analysisResponse.data.analysis,
        processingTime: analysisResponse.data.processingTime,
        tags: analysisResponse.data.tags,
        status: 'completed'
      };

      const reportResponse = await reportsAPI.createReport(reportData);

      toast({
        title: "Analysis completed!",
        description: "Your files have been analyzed successfully.",
      });

      // Navigate to report details
      navigate(`/reports/${reportResponse.data.report._id}`);

    } catch (error: any) {
      console.error('Analysis error:', error);
      toast({
        title: "Analysis failed",
        description: error.response?.data?.message || "An error occurred during analysis.",
        variant: "destructive",
      });
      setProgress(0);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const getFileLanguage = (filename: string) => {
    const ext = filename.split('.').pop()?.toLowerCase();
    const languageMap: { [key: string]: string } = {
      js: 'JavaScript',
      jsx: 'JavaScript',
      ts: 'TypeScript',
      tsx: 'TypeScript',
      py: 'Python',
      java: 'Java',
      c: 'C',
      cpp: 'C++',
      cc: 'C++',
      cxx: 'C++',
      cs: 'C#',
      php: 'PHP',
      rb: 'Ruby',
      go: 'Go',
      rs: 'Rust'
    };
    return languageMap[ext || ''] || 'Unknown';
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Upload & Analyze</h1>
        <p className="text-muted-foreground">
          Upload your code files to detect plagiarism and analyze similarities.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          {/* File Upload Area */}
          <Card>
            <CardHeader>
              <CardTitle>File Upload</CardTitle>
              <CardDescription>
                Drag and drop files or click to select. Upload at least 2 files for comparison.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors border-muted-foreground/25 hover:border-primary/50">
                <UploadIcon className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-lg font-medium mb-2">Drag & drop files here</p>
                <p className="text-sm text-muted-foreground">or click to select files</p>
              </div>
            </CardContent>
          </Card>

          {/* Uploaded Files */}
          {files.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Uploaded Files ({files.length})</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {files.map((file) => (
                    <div key={file.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center space-x-3">
                        <FileText className="h-5 w-5 text-muted-foreground" />
                        <div>
                          <p className="font-medium">{file.name}</p>
                          <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                            <span>{(file.size / 1024).toFixed(1)} KB</span>
                            <Badge variant="secondary" className="text-xs">
                              {getFileLanguage(file.name)}
                            </Badge>
                          </div>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeFile(file.id)}
                        className="text-muted-foreground hover:text-destructive"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Analysis Configuration */}
          <Card>
            <CardHeader>
              <CardTitle>Analysis Configuration</CardTitle>
              <CardDescription>
                Configure your analysis settings and metadata.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  placeholder="Enter a title for this analysis..."
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description (Optional)</Label>
                <Textarea
                  id="description"
                  placeholder="Describe the purpose of this analysis..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="tags">Tags (Optional)</Label>
                <Input
                  id="tags"
                  placeholder="Enter tags separated by commas..."
                  value={tags}
                  onChange={(e) => setTags(e.target.value)}
                />
              </div>

              {isAnalyzing && (
                <div className="space-y-2">
                  <Label>Analysis Progress</Label>
                  <Progress value={progress} className="w-full" />
                  <p className="text-sm text-muted-foreground">
                    {progress < 30 ? 'Uploading files...' :
                     progress < 60 ? 'Processing files...' :
                     progress < 90 ? 'Running analysis...' : 'Generating report...'}
                  </p>
                </div>
              )}

              <Button 
                onClick={handleAnalyze} 
                disabled={files.length < 2 || isAnalyzing}
                className="w-full"
                size="lg"
              >
                {isAnalyzing ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Analyzing Files...
                  </>
                ) : (
                  <>
                    <CheckCircle className="mr-2 h-4 w-4" />
                    Start Analysis
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Supported Languages</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 gap-2 text-sm">
                {[
                  'JavaScript', 'TypeScript', 'Python', 'Java',
                  'C/C++', 'C#', 'PHP', 'Ruby', 'Go', 'Rust'
                ].map((lang) => (
                  <Badge key={lang} variant="outline" className="justify-center">
                    {lang}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <AlertCircle className="mr-2 h-5 w-5" />
                Upload Guidelines
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex items-start space-x-2">
                <CheckCircle className="h-4 w-4 text-green-500 mt-0.5" />
                <span>Upload at least 2 files for comparison</span>
              </div>
              <div className="flex items-start space-x-2">
                <CheckCircle className="h-4 w-4 text-green-500 mt-0.5" />
                <span>Maximum file size: 10MB each</span>
              </div>
              <div className="flex items-start space-x-2">
                <CheckCircle className="h-4 w-4 text-green-500 mt-0.5" />
                <span>Maximum 20 files per analysis</span>
              </div>
              <div className="flex items-start space-x-2">
                <CheckCircle className="h-4 w-4 text-green-500 mt-0.5" />
                <span>Remove sensitive information</span>
              </div>
              <div className="flex items-start space-x-2">
                <AlertCircle className="h-4 w-4 text-orange-500 mt-0.5" />
                <span>Files are processed securely and not stored permanently</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Analysis Features</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <p>• Semantic similarity detection</p>
              <p>• Code structure analysis</p>
              <p>• Line-by-line comparison</p>
              <p>• Function signature matching</p>
              <p>• Variable name patterns</p>
              <p>• Comprehensive similarity scoring</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Upload;