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

// DISPLAY similarity....
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

export function RecentReports({ reports, loading }: RecentReportsProps) {
  return (
    <Card className="bg-gradient-card shadow-card border-border">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <FileCode className="h-5 w-5 text-primary" />
          <span>Recent Reports</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="text-muted-foreground">Loading recent reports...</div>
          </div>
        ) : reports.length === 0 ? (
          <div className="flex items-center justify-center py-8">
            <div className="text-center">
              <FileCode className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
              <p className="text-muted-foreground">No reports yet</p>
              <p className="text-sm text-muted-foreground">Upload files to start analyzing</p>
            </div>
          </div>
        ) : (
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
              {reports.map((report) => (
                <TableRow key={report.id} className="border-border">
                  <TableCell>
                    <div className="flex flex-col space-y-1">
                      <span className="font-medium text-foreground">{report.files}</span>
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
                    <span className="text-sm text-muted-foreground">
                      {new Date(report.date).toLocaleDateString()}
                    </span>
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
        )}
      </CardContent>
    </Card>
  );
}