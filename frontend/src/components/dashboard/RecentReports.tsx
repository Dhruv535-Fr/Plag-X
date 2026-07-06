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
import { Eye, FileCode, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { useNavigate } from "react-router-dom";

interface Report {
  id: string;
  files: string;
  language: string;
  similarity: number;
  method: string;
  date: string;
  status: string;
}

interface RecentReportsProps {
  reports: Report[];
  loading: boolean;
}

function getSimilarityBadge(similarity: number) {
  if (similarity >= 85) {
    return <Badge className="status-high text-xs">High ({similarity}%)</Badge>;
  } else if (similarity >= 60) {
    return <Badge className="status-medium text-xs">Medium ({similarity}%)</Badge>;
  } else {
    return <Badge className="status-low text-xs">Low ({similarity}%)</Badge>;
  }
}

function getLanguageColor(language: string) {
  const colors: Record<string, string> = {
    "C++": "bg-blue-50 text-blue-700 border-blue-200",
    "Python": "bg-emerald-50 text-emerald-700 border-emerald-200",
    "Java": "bg-orange-50 text-orange-700 border-orange-200",
  };
  return colors[language] || "bg-muted text-muted-foreground border-border";
}

export function RecentReports({ reports, loading }: RecentReportsProps) {
  const navigate = useNavigate();

  return (
    <Card className="bg-white border border-border shadow-sm">
      <CardHeader className="flex flex-row items-center justify-between pb-4">
        <CardTitle className="flex items-center gap-2 text-base font-semibold">
          <FileCode className="h-4 w-4 text-primary" />
          Recent Reports
        </CardTitle>
        <Button variant="ghost" size="sm" onClick={() => navigate('/reports')} className="text-sm text-primary h-8 gap-1">
          View all <ArrowRight className="h-3 w-3" />
        </Button>
      </CardHeader>
      <CardContent className="p-0">
        {loading ? (
          <div className="flex items-center justify-center py-12 text-sm text-muted-foreground">
            Loading recent reports...
          </div>
        ) : reports.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center px-6">
            <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-3">
              <FileCode className="h-6 w-6 text-muted-foreground" />
            </div>
            <p className="text-sm font-medium text-foreground">No reports yet</p>
            <p className="text-xs text-muted-foreground mt-1">Upload files to start analyzing</p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="border-border hover:bg-transparent">
                <TableHead className="text-xs font-medium text-muted-foreground pl-6">Files</TableHead>
                <TableHead className="text-xs font-medium text-muted-foreground">Language</TableHead>
                <TableHead className="text-xs font-medium text-muted-foreground">Similarity</TableHead>
                <TableHead className="text-xs font-medium text-muted-foreground">Method</TableHead>
                <TableHead className="text-xs font-medium text-muted-foreground">Date</TableHead>
                <TableHead className="w-12 pr-6"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {reports.map((report) => (
                <TableRow key={report.id} className="border-border hover:bg-muted/30 cursor-pointer" onClick={() => navigate(`/reports/${report.id}`)}>
                  <TableCell className="pl-6">
                    <span className="text-sm font-medium text-foreground">{report.files}</span>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className={cn("text-xs border", getLanguageColor(report.language))}>
                      {report.language}
                    </Badge>
                  </TableCell>
                  <TableCell>{getSimilarityBadge(report.similarity)}</TableCell>
                  <TableCell>
                    <span className="text-sm text-muted-foreground">{report.method}</span>
                  </TableCell>
                  <TableCell>
                    <span className="text-sm text-muted-foreground">
                      {new Date(report.date).toLocaleDateString()}
                    </span>
                  </TableCell>
                  <TableCell className="pr-6">
                    <Button variant="ghost" size="icon" className="h-7 w-7">
                      <Eye className="h-3.5 w-3.5" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
