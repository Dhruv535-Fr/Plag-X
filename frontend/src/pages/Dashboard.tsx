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
  Plus,
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
      setStats({ totalFilesChecked: 0, averageSimilarity: 0, casesFlagged: 0, languagesSupported: 3 });
      setRecentReports([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            Welcome back, {user?.firstName || 'User'}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">Here's what's happening with your analyses today</p>
        </div>
        <Button
          onClick={() => navigate('/upload')}
          className="bg-primary hover:bg-primary/90 text-white gap-2"
        >
          <Plus className="h-4 w-4" />
          New Analysis
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title="Total Files Checked"
          value={loading ? "..." : stats.totalFilesChecked.toString()}
          description="Code files analyzed"
          icon={<FileCheck className="h-5 w-5 text-blue-600" />}
          iconBg="bg-blue-50"
          trend={stats.totalFilesChecked > 0 ? { value: 0, isPositive: true } : undefined}
        />
        <StatsCard
          title="Average Similarity"
          value={loading ? "..." : `${Math.round(stats.averageSimilarity * 100)}%`}
          description="Across all comparisons"
          icon={<TrendingUp className="h-5 w-5 text-emerald-600" />}
          iconBg="bg-emerald-50"
          trend={stats.averageSimilarity > 0 ? {
            value: Math.round(stats.averageSimilarity * 100),
            isPositive: stats.averageSimilarity < 0.5,
          } : undefined}
        />
        <StatsCard
          title="Cases Flagged"
          value={loading ? "..." : stats.casesFlagged.toString()}
          description="High similarity detected"
          icon={<AlertTriangle className="h-5 w-5 text-violet-600" />}
          iconBg="bg-violet-50"
          trend={stats.casesFlagged > 0 ? {
            value: Math.round((stats.casesFlagged / Math.max(stats.totalFilesChecked, 1)) * 100),
            isPositive: false,
          } : undefined}
        />
        <StatsCard
          title="Languages Supported"
          value="3"
          description="C++, Java, Python"
          icon={<Code className="h-5 w-5 text-orange-500" />}
          iconBg="bg-orange-50"
        />
      </div>

      {/* Main Content Grid */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Recent Reports */}
        <div className="lg:col-span-2">
          <RecentReports reports={recentReports} loading={loading} />
        </div>

        {/* Quick Actions & Detection Methods */}
        <div className="space-y-4">
          {/* Start New Analysis */}
          <Card className="bg-primary border-0 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-white text-base">Start New Analysis</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-white/80 text-sm mb-4">
                Upload code files to detect potential plagiarism using advanced algorithms.
              </p>
              <Button
                onClick={() => navigate('/upload')}
                variant="secondary"
                className="w-full bg-white text-primary hover:bg-white/90 font-medium"
              >
                <Upload className="mr-2 h-4 w-4" />
                Upload Files
              </Button>
            </CardContent>
          </Card>

          {/* Detection Methods */}
          <Card className="bg-white border border-border shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-foreground text-base">Detection Methods</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Jaccard Similarity</span>
                <div className="h-1.5 w-20 bg-muted rounded-full overflow-hidden">
                  <div className="h-full w-3/4 bg-amber-400 rounded-full"></div>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">AST Analysis</span>
                <div className="h-1.5 w-20 bg-muted rounded-full overflow-hidden">
                  <div className="h-full w-4/5 bg-primary rounded-full"></div>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Combined Score</span>
                <div className="h-1.5 w-20 bg-muted rounded-full overflow-hidden">
                  <div className="h-full w-5/6 bg-emerald-500 rounded-full"></div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
