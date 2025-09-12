import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  ArrowLeft,
  Download,
  Share,
  AlertTriangle,
  CheckCircle,
  FileCode,
  GitCompare,
  Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface ReportData {
  _id: string;
  title: string;
  description: string;
  files: Array<{
    name: string;
    originalName: string;
    content: string;
    size: number;
    language: string;
    extension: string;
  }>;
  analysis: {
    overallSimilarityScore: number;
    detectedLanguages: string[];
    suspiciousPairs: Array<{
      file1: string;
      file2: string;
      similarityScore: number;
      matchedLines: number;
    }>;
  };
  status: string;
  createdAt: string;
}

export default function ReportDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [report, setReport] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (id) {
      fetchReport(id);
    }
  }, [id]);

  const fetchReport = async (reportId: string) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:5001/api/reports/${reportId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setReport(data.report);
      } else {
        setError('Report not found');
      }
    } catch (error) {
      console.error('Error fetching report:', error);
      setError('Failed to load report');
    } finally {
      setLoading(false);
    }
  };

  const getSimilarityStatus = (score: number) => {
    if (score >= 80) return { label: "High Similarity", color: "status-high", icon: AlertTriangle };
    if (score >= 50) return { label: "Medium Similarity", color: "status-medium", icon: AlertTriangle };
    return { label: "Low Similarity", color: "status-low", icon: CheckCircle };
  };

  const getLanguageColor = (language: string) => {
    const colors = {
      "cpp": "bg-blue-500/10 text-blue-500 border-blue-500/20",
      "python": "bg-green-500/10 text-green-500 border-green-500/20", 
      "java": "bg-orange-500/10 text-orange-500 border-orange-500/20",
    };
    return colors[language.toLowerCase() as keyof typeof colors] || "bg-muted text-muted-foreground";
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Loading report...</span>
      </div>
    );
  }

  if (error || !report) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <AlertTriangle className="h-12 w-12 text-muted-foreground mb-4" />
        <h1 className="text-2xl font-bold mb-2">Report Not Found</h1>
        <p className="text-muted-foreground mb-4">{error || 'The requested report could not be found.'}</p>
        <Button onClick={() => navigate('/reports')}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Reports
        </Button>
      </div>
    );
  }

  const file1 = report.files[0];
  const file2 = report.files[1];
  const similarity = report.analysis.overallSimilarityScore;
  const status = getSimilarityStatus(similarity);
  const StatusIcon = status.icon;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/reports')}
            className="flex items-center"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Reports
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-foreground">Report Analysis</h1>
            <p className="text-muted-foreground mt-1">
              {file1?.originalName || 'Unknown'} vs {file2?.originalName || 'Unknown'}
            </p>
          </div>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline">
            <Share className="mr-2 h-4 w-4" />
            Share
          </Button>
          <Button variant="outline">
            <Download className="mr-2 h-4 w-4" />
            Export PDF
          </Button>
        </div>
      </div>

      {/* Similarity Score Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className={cn("bg-gradient-card shadow-card", similarity >= 80 ? "border-similarity-high" : similarity >= 50 ? "border-similarity-medium" : "border-similarity-low")}>
          <CardContent className="p-6">
            <div className="flex items-center space-x-3">
              <div className={cn("p-3 rounded-full", similarity >= 80 ? "bg-similarity-high/10" : similarity >= 50 ? "bg-similarity-medium/10" : "bg-similarity-low/10")}>
                <StatusIcon className={cn("h-6 w-6", status.color)} />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Combined Score</p>
                <p className={cn("text-2xl font-bold", status.color)}>{similarity}%</p>
                <p className={cn("text-xs", status.color)}>{status.label}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-card shadow-card">
          <CardContent className="p-6">
            <div className="flex items-center space-x-3">
              <div className="p-3 rounded-full bg-primary/10">
                <FileCode className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Language</p>
                <p className="text-2xl font-bold text-foreground">{(file1?.language || 'Unknown').toUpperCase()}</p>
                <p className="text-xs text-muted-foreground">Both files</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-card shadow-card">
          <CardContent className="p-6">
            <div className="flex items-center space-x-3">
              <div className="p-3 rounded-full bg-blue-500/10">
                <GitCompare className="h-6 w-6 text-blue-500" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Status</p>
                <p className="text-2xl font-bold text-foreground">{report.status}</p>
                <p className="text-xs text-muted-foreground">Analysis Complete</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-card shadow-card">
          <CardContent className="p-6">
            <div className="flex items-center space-x-3">
              <div className="p-3 rounded-full bg-purple-500/10">
                <FileCode className="h-6 w-6 text-purple-500" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Files Analyzed</p>
                <p className="text-2xl font-bold text-foreground">{report.files.length}</p>
                <p className="text-xs text-muted-foreground">Total Files</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Code Comparison */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* File 1 */}
        <Card className="bg-gradient-card shadow-card">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center space-x-2">
                <FileCode className="h-5 w-5 text-primary" />
                <span>{file1?.originalName || 'File 1'}</span>
                <Badge variant="outline">Original</Badge>
              </CardTitle>
              <Badge className={cn("text-xs", getLanguageColor(file1?.language || ''))}>
                {(file1?.language || 'Unknown').toUpperCase()}
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="bg-muted/50 rounded-lg p-4 max-h-96 overflow-y-auto">
              <pre className="text-sm text-foreground whitespace-pre-wrap font-mono">
                {file1?.content || 'Content not available'}
              </pre>
            </div>
            <div className="mt-3 text-xs text-muted-foreground">
              Size: {file1?.size ? Math.round(file1.size / 1024) : 0} KB
            </div>
          </CardContent>
        </Card>

        {/* File 2 */}
        <Card className="bg-gradient-card shadow-card">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center space-x-2">
                <FileCode className="h-5 w-5 text-orange-500" />
                <span>{file2?.originalName || 'File 2'}</span>
                <Badge variant="destructive">Suspected</Badge>
              </CardTitle>
              <Badge className={cn("text-xs", getLanguageColor(file2?.language || ''))}>
                {(file2?.language || 'Unknown').toUpperCase()}
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="bg-muted/50 rounded-lg p-4 max-h-96 overflow-y-auto">
              <pre className="text-sm text-foreground whitespace-pre-wrap font-mono">
                {file2?.content || 'Content not available'}
              </pre>
            </div>
            <div className="mt-3 text-xs text-muted-foreground">
              Size: {file2?.size ? Math.round(file2.size / 1024) : 0} KB
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Analysis Details */}
      <Card className="bg-gradient-card shadow-card">
        <CardHeader>
          <CardTitle>Analysis Details</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <h4 className="font-medium text-foreground mb-2">Report Information</h4>
              <div className="grid gap-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Title:</span>
                  <span className="text-foreground">{report.title}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Created:</span>
                  <span className="text-foreground">{new Date(report.createdAt).toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Language Detected:</span>
                  <span className="text-foreground">{report.analysis.detectedLanguages.join(', ')}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Overall Similarity:</span>
                  <Badge className={status.color}>{similarity}%</Badge>
                </div>
              </div>
            </div>
            
            {report.description && (
              <div>
                <h4 className="font-medium text-foreground mb-2">Description</h4>
                <p className="text-sm text-muted-foreground">{report.description}</p>
              </div>
            )}

            {report.analysis.suspiciousPairs && report.analysis.suspiciousPairs.length > 0 && (
              <div>
                <h4 className="font-medium text-foreground mb-2">Suspicious Patterns</h4>
                <div className="space-y-2">
                  {report.analysis.suspiciousPairs.map((pair, index) => (
                    <div key={index} className="p-3 bg-muted/50 rounded-lg">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium">{pair.file1} vs {pair.file2}</span>
                        <Badge variant="outline">{pair.similarityScore}% match</Badge>
                      </div>
                      {pair.matchedLines > 0 && (
                        <p className="text-xs text-muted-foreground mt-1">
                          {pair.matchedLines} matching lines detected
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
