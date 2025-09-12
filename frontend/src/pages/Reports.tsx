import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Search,
  Filter,
  Eye,
  Download,
  Calendar,
  Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface Report {
  _id: string;
  title: string;
  files: Array<{
    originalName: string;
    language: string;
  }>;
  analysis: {
    overallSimilarityScore: number;
    detectedLanguages: string[];
  };
  status: string;
  createdAt: string;
}

const mockReports: Report[] = [];

function getSimilarityBadge(similarity: number) {
  const verdict = similarity >= 80 ? "high" : similarity >= 50 ? "medium" : "low";
  if (verdict === "high") {
    return <Badge className="status-high">High ({similarity}%)</Badge>;
  } else if (verdict === "medium") {
    return <Badge className="status-medium">Medium ({similarity}%)</Badge>;
  } else {
    return <Badge className="status-low">Low ({similarity}%)</Badge>;
  }
}

function getLanguageColor(language: string) {
  const colors = {
    "C++": "bg-blue-500/10 text-blue-500 border-blue-500/20",
    "cpp": "bg-blue-500/10 text-blue-500 border-blue-500/20",
    "Python": "bg-green-500/10 text-green-500 border-green-500/20",
    "python": "bg-green-500/10 text-green-500 border-green-500/20",
    "Java": "bg-orange-500/10 text-orange-500 border-orange-500/20",
    "java": "bg-orange-500/10 text-orange-500 border-orange-500/20",
  };
  return colors[language as keyof typeof colors] || "bg-muted text-muted-foreground";
}

function getVerdict(similarity: number): "high" | "medium" | "low" {
  return similarity >= 80 ? "high" : similarity >= 50 ? "medium" : "low";
}

export default function Reports() {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [languageFilter, setLanguageFilter] = useState("all");
  const [verdictFilter, setVerdictFilter] = useState("all");
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchReports();
  }, []);

  const fetchReports = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5001/api/reports', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setReports(data.reports || []);
      }
    } catch (error) {
      console.error('Error fetching reports:', error);
      setReports(mockReports); // Fallback to empty array
    } finally {
      setLoading(false);
    }
  };

  const filteredReports = reports.filter(report => {
    const file1 = report.files[0]?.originalName || '';
    const file2 = report.files[1]?.originalName || '';
    const language = report.files[0]?.language || report.analysis.detectedLanguages[0] || '';
    const similarity = report.analysis.overallSimilarityScore;
    const verdict = getVerdict(similarity);
    
    const matchesSearch = file1.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         file2.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         report.title.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesLanguage = languageFilter === "all" || 
                           language.toLowerCase() === languageFilter.toLowerCase() ||
                           report.analysis.detectedLanguages.some(lang => 
                             lang.toLowerCase() === languageFilter.toLowerCase());
    const matchesVerdict = verdictFilter === "all" || verdict === verdictFilter;
    
    return matchesSearch && matchesLanguage && matchesVerdict;
  });

  const handleViewReport = (reportId: string) => {
    navigate(`/reports/${reportId}`);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Reports</h1>
          <p className="text-muted-foreground mt-2">
            View and analyze all plagiarism detection reports
          </p>
        </div>
        <Button variant="outline">
          <Download className="mr-2 h-4 w-4" />
          Export All
        </Button>
      </div>

      {/* Filters */}
      <Card className="bg-gradient-card shadow-card">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Filter className="h-5 w-5 text-primary" />
            <span>Filters</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search files..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={languageFilter} onValueChange={setLanguageFilter}>
              <SelectTrigger>
                <SelectValue placeholder="All Languages" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Languages</SelectItem>
                <SelectItem value="cpp">C++</SelectItem>
                <SelectItem value="python">Python</SelectItem>
                <SelectItem value="java">Java</SelectItem>
              </SelectContent>
            </Select>
            <Select value={verdictFilter} onValueChange={setVerdictFilter}>
              <SelectTrigger>
                <SelectValue placeholder="All Risk Levels" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Risk Levels</SelectItem>
                <SelectItem value="high">High Risk (≥80%)</SelectItem>
                <SelectItem value="medium">Medium Risk (50-79%)</SelectItem>
                <SelectItem value="low">Low Risk (&lt;50%)</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" className="w-full">
              <Calendar className="mr-2 h-4 w-4" />
              Date Range
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Results Summary */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="bg-gradient-card shadow-card">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Reports</p>
                <p className="text-2xl font-bold text-foreground">{filteredReports.length}</p>
              </div>
              <div className="text-primary">
                {loading ? <Loader2 className="h-8 w-8 animate-spin" /> : <Eye className="h-8 w-8" />}
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-card shadow-card">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">High Risk</p>
                <p className="text-2xl font-bold text-similarity-high">
                  {filteredReports.filter(r => getVerdict(r.analysis.overallSimilarityScore) === "high").length}
                </p>
              </div>
              <div className="text-similarity-high">
                <div className="h-8 w-8 rounded-full bg-similarity-high/10 flex items-center justify-center">
                  <div className="h-4 w-4 rounded-full bg-similarity-high"></div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-card shadow-card">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Average Score</p>
                <p className="text-2xl font-bold text-foreground">
                  {filteredReports.length > 0 ? 
                    Math.round(filteredReports.reduce((sum, r) => sum + r.analysis.overallSimilarityScore, 0) / filteredReports.length) : 0}%
                </p>
              </div>
              <div className="text-primary">
                <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                  <div className="h-4 w-4 rounded-full bg-primary"></div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Reports Table */}
      <Card className="bg-gradient-card shadow-card">
        <CardHeader>
          <CardTitle>All Reports</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin" />
              <span className="ml-2">Loading reports...</span>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="border-border">
                  <TableHead>Files</TableHead>
                  <TableHead>Language</TableHead>
                  <TableHead>Combined Score</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead className="w-24">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredReports.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                      No reports found. Upload files to start plagiarism detection.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredReports.map((report) => {
                    const file1 = report.files[0]?.originalName || 'Unknown';
                    const file2 = report.files[1]?.originalName || 'Unknown';
                    const language = report.files[0]?.language || report.analysis.detectedLanguages[0] || 'Unknown';
                    const similarity = report.analysis.overallSimilarityScore;
                    const date = new Date(report.createdAt).toLocaleDateString();
                    
                    return (
                      <TableRow key={report._id} className="border-border">
                        <TableCell>
                          <div className="flex flex-col space-y-1">
                            <span className="font-medium text-foreground">{file1}</span>
                            <span className="text-sm text-muted-foreground">vs {file2}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge className={cn("text-xs", getLanguageColor(language))}>
                            {language.toUpperCase()}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {getSimilarityBadge(similarity)}
                        </TableCell>
                        <TableCell>
                          <Badge variant={report.status === 'completed' ? 'default' : 'secondary'}>
                            {report.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <span className="text-sm text-muted-foreground">{date}</span>
                        </TableCell>
                        <TableCell>
                          <div className="flex space-x-2">
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => handleViewReport(report._id)}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="sm">
                              <Download className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}