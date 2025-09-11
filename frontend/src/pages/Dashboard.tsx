import { useState, useEffect } from "react";
import { StatsCard } from "@/components/dashboard/StatsCard";
import { RecentReports } from "@/components/dashboard/RecentReports";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import api from "@/lib/api";
import {
  FileCheck,
  TrendingUp,
  AlertTriangle,
  Code,
  Upload,
  ArrowRight,
} from "lucide-react";

interface DashboardStats {
  totalFilesChecked: number;
  averageSimilarity: number;
  casesFlagged: number;
  languagesSupported: number;
}

interface RecentReport {
  id: string;
  files: string;
  language: string;
  similarity: number;
  method: string;
  date: string;
  status: string;
}

export default function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState<DashboardStats>({
    totalFilesChecked: 0,
    averageSimilarity: 0,
    casesFlagged: 0,
    languagesSupported: 3
  });
  const [recentReports, setRecentReports] = useState<RecentReport[]>([]);
  const [loading, setLoading] = useState(true);

  const currentDate = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const response = await api.get('/dashboard/stats');
      if (response.data.success) {
        setStats(response.data.data.stats);
        setRecentReports(response.data.data.recentReports);
      }
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUploadClick = () => {
    navigate('/upload');
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Welcome Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">
            Welcome back, {user?.firstName || 'User'} 👋
          </h1>
          <p className="text-muted-foreground mt-2">{currentDate}</p>
        </div>
        <Button 
          onClick={handleUploadClick}
          className="bg-gradient-primary hover:shadow-glow transition-all"
        >
          <Upload className="mr-2 h-4 w-4" />
          Upload Code
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title="Total Files Checked"
          value={loading ? "..." : stats.totalFilesChecked.toLocaleString()}
          description="Code files analyzed"
          icon={<FileCheck className="h-4 w-4" />}
          trend={stats.totalFilesChecked > 0 ? {
            value: 0,
            isPositive: true,
          } : undefined}
        />
        <StatsCard
          title="Average Similarity"
          value={loading ? "..." : `${Math.round(stats.averageSimilarity * 100)}%`}
          description="Across all comparisons"
          icon={<TrendingUp className="h-4 w-4" />}
          trend={stats.averageSimilarity > 0 ? {
            value: Math.round(stats.averageSimilarity * 100),
            isPositive: stats.averageSimilarity < 0.5,
          } : undefined}
        />
        <StatsCard
          title="Cases Flagged"
          value={loading ? "..." : stats.casesFlagged.toString()}
          description="High similarity detected"
          icon={<AlertTriangle className="h-4 w-4" />}
          trend={stats.casesFlagged > 0 ? {
            value: Math.round((stats.casesFlagged / Math.max(stats.totalFilesChecked, 1)) * 100),
            isPositive: false,
          } : undefined}
        />
        <StatsCard
          title="Languages Supported"
          value="3"
          description="C++, Java, Python"
          icon={<Code className="h-4 w-4" />}
        />
      </div>

      {/* Main Content Grid */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Recent Reports - Takes 2 columns */}
        <div className="lg:col-span-2">
          <RecentReports reports={recentReports} loading={loading} />
        </div>

        {/* Quick Actions Sidebar */}
        <div className="space-y-6">
          {/* Upload CTA Card */}
          <Card className="bg-gradient-primary shadow-glow border-0">
            <CardHeader>
              <CardTitle className="text-primary-foreground">
                Start New Analysis
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-primary-foreground/80 text-sm mb-4">
                Upload your code files to detect potential plagiarism using our advanced algorithms.
              </p>
              <Button 
                onClick={handleUploadClick}
                variant="secondary" 
                className="w-full bg-primary-foreground text-primary hover:bg-primary-foreground/90"
              >
                <Upload className="mr-2 h-4 w-4" />
                Upload Files
              </Button>
            </CardContent>
          </Card>

          {/* Detection Methods Card */}
          <Card className="bg-gradient-card shadow-card">
            <CardHeader>
              <CardTitle className="text-foreground">Detection Methods</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Jaccard Similarity</span>
                  <div className="h-2 w-16 bg-muted rounded-full overflow-hidden">
                    <div className="h-full w-3/4 bg-gradient-warning"></div>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">AST Analysis</span>
                  <div className="h-2 w-16 bg-muted rounded-full overflow-hidden">
                    <div className="h-full w-4/5 bg-gradient-primary"></div>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Combined Score</span>
                  <div className="h-2 w-16 bg-muted rounded-full overflow-hidden">
                    <div className="h-full w-5/6 bg-gradient-success"></div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}