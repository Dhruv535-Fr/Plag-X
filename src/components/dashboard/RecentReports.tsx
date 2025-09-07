import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Eye, FileCode } from "lucide-react";
import { cn } from "@/lib/utils";

interface Report {
  id: string;
  file1: string;
  file2: string;
  similarity: number;
  method: string;
  date: string;
  language: string;
}

const mockReports: Report[] = [
  {
    id: "1",
    file1: "algorithm.cpp",
    file2: "sorting.cpp",
    similarity: 89,
    method: "Combined",
    date: "2024-01-15",
    language: "C++",
  },
  {
    id: "2",
    file1: "main.py",
    file2: "script.py",
    similarity: 65,
    method: "AST",
    date: "2024-01-14",
    language: "Python",
  },
  {
    id: "3",
    file1: "HelloWorld.java",
    file2: "Program.java",
    similarity: 42,
    method: "Jaccard",
    date: "2024-01-13",
    language: "Java",
  },
  {
    id: "4",
    file1: "utils.cpp",
    file2: "helpers.cpp",
    similarity: 78,
    method: "Combined",
    date: "2024-01-12",
    language: "C++",
  },
  {
    id: "5",
    file1: "test.py",
    file2: "unittest.py",
    similarity: 34,
    method: "AST",
    date: "2024-01-11",
    language: "Python",
  },
];

function getSimilarityBadge(similarity: number) {
  if (similarity >= 85) {
    return <Badge className="status-high">High ({similarity}%)</Badge>;
  } else if (similarity >= 60) {
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

export function RecentReports() {
  return (
    <Card className="bg-gradient-card shadow-card border-border">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <FileCode className="h-5 w-5 text-primary" />
          <span>Recent Reports</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow className="border-border">
              <TableHead>Files</TableHead>
              <TableHead>Language</TableHead>
              <TableHead>Similarity</TableHead>
              <TableHead>Method</TableHead>
              <TableHead>Date</TableHead>
              <TableHead className="w-20">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {mockReports.map((report) => (
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
                  {getSimilarityBadge(report.similarity)}
                </TableCell>
                <TableCell>
                  <span className="text-sm text-muted-foreground">{report.method}</span>
                </TableCell>
                <TableCell>
                  <span className="text-sm text-muted-foreground">{report.date}</span>
                </TableCell>
                <TableCell>
                  <Button variant="ghost" size="sm">
                    <Eye className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}