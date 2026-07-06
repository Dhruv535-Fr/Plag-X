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
  Eye,
  Download,
  Loader2,
  FileText,
  AlertTriangle,
  TrendingUp,
} from "lucide-react";
import { cn } from "@/lib/utils";
import api from "@/lib/api";

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

function getSimilarityBadge(similarity: number) {
  const pct = Math.round(similarity);
  if (similarity >= 80)
    return <Badge className="status-high text-xs">High ({pct}%)</Badge>;
  if (similarity >= 50)
    return <Badge className="status-medium text-xs">Medium ({pct}%)</Badge>;
  return <Badge className="status-low text-xs">Low ({pct}%)</Badge>;
}

function getLanguageColor(language: string) {
  const colors: Record<string, string> = {
    "C++": "bg-blue-50 text-blue-700 border-blue-200",
    "cpp": "bg-blue-50 text-blue-700 border-blue-200",
    "Python": "bg-emerald-50 text-emerald-700 border-emerald-200",
    "python": "bg-emerald-50 text-emerald-700 border-emerald-200",
    "Java": "bg-orange-50 text-orange-700 border-orange-200",
    "java": "bg-orange-50 text-orange-700 border-orange-200",
  };
  return colors[language] || "bg-muted text-muted-foreground border-border";
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

  useEffect(() => { fetchReports(); }, []);

  const fetchReports = async () => {
    try {
      const response = await api.get('/reports?limit=50&sortBy=createdAt&sortOrder=desc');
      setReports(response.data.data.reports || []);
    } catch (error) {
      console.error('Error fetching reports:', error);
      setReports([]);
    } finally {
      setLoading(false);
    }
  };

  const groupReportsBySessions = (reports: Report[]) => {
    const sessions: { [key: string]: Report[] } = {};
    const sortedReports = [...reports].sort((a, b) =>
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
    sortedReports.forEach(report => {
      const reportTime = new Date(report.createdAt).getTime();
      let assigned = false;
      for (const sessionKey in sessions) {
        if (Math.abs(reportTime - new Date(sessionKey).getTime()) <= 5 * 60 * 1000) {
          sessions[sessionKey].push(report);
          assigned = true;
          break;
        }
      }
      if (!assigned) sessions[report.createdAt] = [report];
    });
    const sessionKeys = Object.keys(sessions)
      .sort((a, b) => new Date(b).getTime() - new Date(a).getTime())
      .slice(0, 5);
    const limited: { [key: string]: Report[] } = {};
    sessionKeys.forEach(k => { limited[k] = sessions[k]; });
    return limited;
  };

  const filteredReports = reports.filter(report => {
    const file1 = report.files[0]?.originalName || '';
    const file2 = report.files[1]?.originalName || '';
    const language = report.files[0]?.language || report.analysis.detectedLanguages[0] || '';
    const verdict = getVerdict(report.analysis.overallSimilarityScore);
    const matchesSearch = file1.toLowerCase().includes(searchTerm.toLowerCase()) ||
      file2.toLowerCase().includes(searchTerm.toLowerCase()) ||
      report.title.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesLanguage = languageFilter === "all" ||
      language.toLowerCase() === languageFilter.toLowerCase() ||
      report.analysis.detectedLanguages.some(l => l.toLowerCase() === languageFilter.toLowerCase());
    const matchesVerdict = verdictFilter === "all" || verdict === verdictFilter;
    return matchesSearch && matchesLanguage && matchesVerdict;
  });

  const reportSessions = groupReportsBySessions(filteredReports);
  const recentSessionReports = Object.values(reportSessions).flat();
  const highRiskCount = recentSessionReports.filter(r => getVerdict(r.analysis.overallSimilarityScore) === "high").length;
  const avgScore = recentSessionReports.length > 0
    ? Math.round(recentSessionReports.reduce((s, r) => s + r.analysis.overallSimilarityScore, 0) / recentSessionReports.length)
    : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Reports</h1>
          <p className="text-sm text-muted-foreground mt-1">View your last 5 analysis sessions</p>
        </div>
        <Button variant="outline" size="sm" className="gap-2">
          <Download className="h-4 w-4" />
          Export All
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="bg-white border border-border shadow-sm">
          <CardContent className="p-5">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Reports</p>
                <p className="text-2xl font-bold mt-1">{loading ? '...' : recentSessionReports.length}</p>
                <p className="text-xs text-muted-foreground mt-0.5">Last 5 sessions</p>
              </div>
              <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center">
                {loading ? <Loader2 className="h-5 w-5 text-blue-600 animate-spin" /> : <Eye className="h-5 w-5 text-blue-600" />}
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-white border border-border shadow-sm">
          <CardContent className="p-5">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-muted-foreground">High Risk Cases</p>
                <p className="text-2xl font-bold mt-1 text-red-600">{loading ? '...' : highRiskCount}</p>
                <p className="text-xs text-muted-foreground mt-0.5">≥80% similarity</p>
              </div>
              <div className="w-10 h-10 rounded-lg bg-red-50 flex items-center justify-center">
                <AlertTriangle className="h-5 w-5 text-red-500" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-white border border-border shadow-sm">
          <CardContent className="p-5">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Average Score</p>
                <p className="text-2xl font-bold mt-1">{loading ? '...' : `${avgScore}%`}</p>
                <p className="text-xs text-muted-foreground mt-0.5">Across sessions</p>
              </div>
              <div className="w-10 h-10 rounded-lg bg-emerald-50 flex items-center justify-center">
                <TrendingUp className="h-5 w-5 text-emerald-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="bg-white border border-border shadow-sm">
        <CardContent className="p-4">
          <div className="flex flex-wrap gap-3 items-center">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search files..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 h-9"
              />
            </div>
            <Select value={languageFilter} onValueChange={setLanguageFilter}>
              <SelectTrigger className="w-40 h-9">
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
              <SelectTrigger className="w-44 h-9">
                <SelectValue placeholder="All Risk Levels" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Risk Levels</SelectItem>
                <SelectItem value="high">High Risk (≥80%)</SelectItem>
                <SelectItem value="medium">Medium Risk (50-79%)</SelectItem>
                <SelectItem value="low">Low Risk (&lt;50%)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Reports Table */}
      <Card className="bg-white border border-border shadow-sm">
        <CardHeader className="pb-0">
          <CardTitle className="text-base font-semibold">All Reports</CardTitle>
        </CardHeader>
        <CardContent className="p-0 mt-4">
          {loading ? (
            <div className="flex items-center justify-center py-12 gap-2 text-muted-foreground text-sm">
              <Loader2 className="h-5 w-5 animate-spin" /> Loading reports...
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="border-border hover:bg-transparent">
                  <TableHead className="pl-6 text-xs font-medium text-muted-foreground">Files</TableHead>
                  <TableHead className="text-xs font-medium text-muted-foreground">Language</TableHead>
                  <TableHead className="text-xs font-medium text-muted-foreground">Similarity</TableHead>
                  <TableHead className="text-xs font-medium text-muted-foreground">Status</TableHead>
                  <TableHead className="text-xs font-medium text-muted-foreground">Date</TableHead>
                  <TableHead className="pr-6 text-xs font-medium text-muted-foreground">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {Object.keys(reportSessions).length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-12 text-muted-foreground text-sm">
                      No reports found. Upload files to start plagiarism detection.
                    </TableCell>
                  </TableRow>
                ) : (
                  <>
                    {Object.entries(reportSessions).map(([sessionDate, sessionReports]) => {
                      const sessionTime = new Date(sessionDate).toLocaleString();
                      const avgSim = sessionReports.reduce((s, r) => s + r.analysis.overallSimilarityScore, 0) / sessionReports.length;

                      return (
                        <>
                          <TableRow key={sessionDate} className="bg-muted/40 border-border hover:bg-muted/40">
                            <TableCell colSpan={6} className="pl-6 py-2">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  <FileText className="h-3.5 w-3.5 text-muted-foreground" />
                                  <span className="text-xs font-semibold text-foreground">Session — {sessionTime}</span>
                                  <Badge variant="secondary" className="text-xs h-5">{sessionReports.length} comparisons</Badge>
                                </div>
                                <div className="flex items-center gap-1.5 pr-6">
                                  <span className="text-xs text-muted-foreground">Avg:</span>
                                  {getSimilarityBadge(Math.round(avgSim))}
                                </div>
                              </div>
                            </TableCell>
                          </TableRow>
                          {sessionReports.map((report) => {
                            const file1 = report.files[0]?.originalName || 'Unknown';
                            const file2 = report.files[1]?.originalName || 'Unknown';
                            const language = report.files[0]?.language || report.analysis.detectedLanguages[0] || 'Unknown';
                            const similarity = report.analysis.overallSimilarityScore;
                            const date = new Date(report.createdAt).toLocaleDateString();

                            return (
                              <TableRow key={report._id} className="border-border hover:bg-muted/30 cursor-pointer"
                                onClick={() => navigate(`/reports/${report._id}`)}>
                                <TableCell className="pl-10">
                                  <div className="flex flex-col">
                                    <span className="text-sm font-medium">{file1}</span>
                                    <span className="text-xs text-muted-foreground">vs {file2}</span>
                                  </div>
                                </TableCell>
                                <TableCell>
                                  <Badge variant="outline" className={cn("text-xs border", getLanguageColor(language))}>
                                    {language.toUpperCase()}
                                  </Badge>
                                </TableCell>
                                <TableCell>{getSimilarityBadge(similarity)}</TableCell>
                                <TableCell>
                                  <Badge variant={report.status === 'completed' ? 'default' : 'secondary'} className="text-xs">
                                    {report.status}
                                  </Badge>
                                </TableCell>
                                <TableCell>
                                  <span className="text-sm text-muted-foreground">{date}</span>
                                </TableCell>
                                <TableCell className="pr-6">
                                  <div className="flex gap-1">
                                    <Button variant="ghost" size="icon" className="h-7 w-7"
                                      onClick={(e) => { e.stopPropagation(); navigate(`/reports/${report._id}`); }}>
                                      <Eye className="h-3.5 w-3.5" />
                                    </Button>
                                    <Button variant="ghost" size="icon" className="h-7 w-7">
                                      <Download className="h-3.5 w-3.5" />
                                    </Button>
                                  </div>
                                </TableCell>
                              </TableRow>
                            );
                          })}
                        </>
                      );
                    })}
                  </>
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

