import { StatsCard } from "@/components/dashboard/StatsCard";
import { RecentReports } from "@/components/dashboard/RecentReports";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  FileCheck,
  TrendingUp,
  AlertTriangle,
  Code,
  Upload,
  ArrowRight,
} from "lucide-react";

export default function Dashboard() {
  const currentDate = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Welcome Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">
            Welcome back, John 👋
          </h1>
          <p className="text-muted-foreground mt-2">{currentDate}</p>
        </div>
        <Button className="bg-gradient-primary hover:shadow-glow transition-all">
          <Upload className="mr-2 h-4 w-4" />
          Upload Code
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title="Total Files Checked"
          value="1,247"
          description="Code files analyzed"
          icon={<FileCheck className="h-4 w-4" />}
          trend={{
            value: 12,
            isPositive: true,
          }}
        />
        <StatsCard
          title="Average Similarity"
          value="32%"
          description="Across all comparisons"
          icon={<TrendingUp className="h-4 w-4" />}
          trend={{
            value: -5,
            isPositive: false,
          }}
        />
        <StatsCard
          title="Cases Flagged"
          value="89"
          description="High similarity detected"
          icon={<AlertTriangle className="h-4 w-4" />}
          trend={{
            value: 8,
            isPositive: false,
          }}
        />
        <StatsCard
          title="Languages Supported"
          value="4"
          description="C++, Java, Python, C"
          icon={<Code className="h-4 w-4" />}
        />
      </div>

      {/* Main Content Grid */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Recent Reports - Takes 2 columns */}
        <div className="lg:col-span-2">
          <RecentReports />
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

          {/* Recent Activity */}
          <Card className="bg-gradient-card shadow-card">
            <CardHeader>
              <CardTitle className="text-foreground">Recent Activity</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center space-x-3">
                  <div className="h-2 w-2 bg-primary rounded-full"></div>
                  <div className="text-sm">
                    <span className="text-foreground">High similarity</span>
                    <span className="text-muted-foreground"> detected in algorithm.cpp</span>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="h-2 w-2 bg-similarity-medium rounded-full"></div>
                  <div className="text-sm">
                    <span className="text-foreground">Medium match</span>
                    <span className="text-muted-foreground"> found in main.py</span>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="h-2 w-2 bg-similarity-low rounded-full"></div>
                  <div className="text-sm">
                    <span className="text-foreground">Clean result</span>
                    <span className="text-muted-foreground"> for HelloWorld.java</span>
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