import { useState } from "react";
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
} from "lucide-react";
import { cn } from "@/lib/utils";

interface Report {
  id: string;
  file1: string;
  file2: string;
  similarity: number;
  jaccardScore: number;
  astScore: number;
  method: string;
  language: string;
  date: string;
  verdict: "high" | "medium" | "low";
}

const mockReports: Report[] = [
  {
    id: "1",
    file1: "algorithm.cpp",
    file2: "sorting.cpp",
    similarity: 89,
    jaccardScore: 85,
    astScore: 92,
    method: "Combined",
    language: "C++",
    date: "2024-01-15",
    verdict: "high",
  },
  {
    id: "2",
    file1: "main.py",
    file2: "script.py",
    similarity: 65,
    jaccardScore: 62,
    astScore: 68,
    method: "Combined",
    language: "Python",
    date: "2024-01-14",
    verdict: "medium",
  },
  {
    id: "3",
    file1: "HelloWorld.java",
    file2: "Program.java",
    similarity: 42,
    jaccardScore: 45,
    astScore: 39,
    method: "Combined",
    language: "Java",
    date: "2024-01-13",
    verdict: "low",
  },
  {
    id: "4",
    file1: "utils.cpp",
    file2: "helpers.cpp",
    similarity: 78,
    jaccardScore: 75,
    astScore: 81,
    method: "Combined",
    language: "C++",
    date: "2024-01-12",
    verdict: "medium",
  },
  {
    id: "5",
    file1: "test.py",
    file2: "unittest.py",
    similarity: 34,
    jaccardScore: 38,
    astScore: 30,
    method: "Combined",
    language: "Python",
    date: "2024-01-11",
    verdict: "low",
  },
  {
    id: "6",
    file1: "matrix.cpp",
    file2: "linear_algebra.cpp",
    similarity: 91,
    jaccardScore: 88,
    astScore: 94,
    method: "Combined",
    language: "C++",
    date: "2024-01-10",
    verdict: "high",
  },
];

function getSimilarityBadge(similarity: number, verdict: string) {
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
    "Python": "bg-green-500/10 text-green-500 border-green-500/20",
    "Java": "bg-orange-500/10 text-orange-500 border-orange-500/20",
  };
  return colors[language as keyof typeof colors] || "bg-muted text-muted-foreground";
}

export default function Reports() {
  const [searchTerm, setSearchTerm] = useState("");
  const [languageFilter, setLanguageFilter] = useState("all");
  const [verdictFilter, setVerdictFilter] = useState("all");
  const [reports] = useState(mockReports);

  const filteredReports = reports.filter(report => {
    const matchesSearch = report.file1.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         report.file2.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesLanguage = languageFilter === "all" || report.language === languageFilter;
    const matchesVerdict = verdictFilter === "all" || report.verdict === verdictFilter;
    
    return matchesSearch && matchesLanguage && matchesVerdict;
  });

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
                <SelectItem value="C++">C++</SelectItem>
                <SelectItem value="Python">Python</SelectItem>
                <SelectItem value="Java">Java</SelectItem>
              </SelectContent>
            </Select>
            <Select value={verdictFilter} onValueChange={setVerdictFilter}>
              <SelectTrigger>
                <SelectValue placeholder="All Similarity" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Similarity</SelectItem>
                <SelectItem value="high">High (≥85%)</SelectItem>
                <SelectItem value="medium">Medium (60-84%)</SelectItem>
                <SelectItem value="low">Low (&lt;60%)</SelectItem>
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
                <Eye className="h-8 w-8" />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-card shadow-card">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">High Similarity</p>
                <p className="text-2xl font-bold text-similarity-high">
                  {filteredReports.filter(r => r.verdict === "high").length}
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
                  {Math.round(filteredReports.reduce((sum, r) => sum + r.similarity, 0) / filteredReports.length || 0)}%
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
          <Table>
            <TableHeader>
              <TableRow className="border-border">
                <TableHead>Files</TableHead>
                <TableHead>Language</TableHead>
                <TableHead>Combined Score</TableHead>
                <TableHead>Jaccard</TableHead>
                <TableHead>AST</TableHead>
                <TableHead>Date</TableHead>
                <TableHead className="w-24">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredReports.map((report) => (
                <TableRow key={report.id} className="border-border">
                  <TableCell>
                    <div className="flex flex-col space-y-1">
                      <span className="font-medium text-foreground">{report.file1}</span>
                      <span className="text-sm text-muted-foreground">vs {report.file2}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge className={cn("text-xs", getLanguageColor(report.language))}>
                      {report.language}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {getSimilarityBadge(report.similarity, report.verdict)}
                  </TableCell>
                  <TableCell>
                    <span className="text-sm text-muted-foreground">{report.jaccardScore}%</span>
                  </TableCell>
                  <TableCell>
                    <span className="text-sm text-muted-foreground">{report.astScore}%</span>
                  </TableCell>
                  <TableCell>
                    <span className="text-sm text-muted-foreground">{report.date}</span>
                  </TableCell>
                  <TableCell>
                    <div className="flex space-x-2">
                      <Button variant="ghost" size="sm">
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm">
                        <Download className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}