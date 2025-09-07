import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
} from "recharts";
import {
  TrendingUp,
  FileCode,
  AlertTriangle,
  CheckCircle,
} from "lucide-react";

const weeklyData = [
  { name: "Mon", reports: 12, highSimilarity: 3 },
  { name: "Tue", reports: 19, highSimilarity: 5 },
  { name: "Wed", reports: 8, highSimilarity: 1 },
  { name: "Thu", reports: 15, highSimilarity: 4 },
  { name: "Fri", reports: 22, highSimilarity: 7 },
  { name: "Sat", reports: 5, highSimilarity: 2 },
  { name: "Sun", reports: 3, highSimilarity: 0 },
];

const languageData = [
  { name: "C++", value: 45, color: "#3b82f6" },
  { name: "Python", value: 30, color: "#10b981" },
  { name: "Java", value: 20, color: "#f59e0b" },
  { name: "C", value: 5, color: "#ef4444" },
];

const similarityTrend = [
  { month: "Jan", avgSimilarity: 32 },
  { month: "Feb", avgSimilarity: 28 },
  { month: "Mar", avgSimilarity: 35 },
  { month: "Apr", avgSimilarity: 31 },
  { month: "May", avgSimilarity: 29 },
  { month: "Jun", avgSimilarity: 33 },
];

const COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444"];

export default function Analytics() {
  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Analytics</h1>
        <p className="text-muted-foreground mt-2">
          Comprehensive insights into plagiarism detection patterns
        </p>
      </div>

      {/* Key Metrics */}
      <div className="grid gap-6 md:grid-cols-4">
        <Card className="bg-gradient-card shadow-card">
          <CardContent className="p-6">
            <div className="flex items-center space-x-4">
              <div className="p-2 bg-primary/10 rounded-lg">
                <FileCode className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Scans</p>
                <p className="text-2xl font-bold text-foreground">1,247</p>
                <p className="text-xs text-similarity-low">+12% this month</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-card shadow-card">
          <CardContent className="p-6">
            <div className="flex items-center space-x-4">
              <div className="p-2 bg-similarity-high/10 rounded-lg">
                <AlertTriangle className="h-6 w-6 text-similarity-high" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">High Similarity</p>
                <p className="text-2xl font-bold text-foreground">89</p>
                <p className="text-xs text-similarity-high">+8% this month</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-card shadow-card">
          <CardContent className="p-6">
            <div className="flex items-center space-x-4">
              <div className="p-2 bg-similarity-low/10 rounded-lg">
                <CheckCircle className="h-6 w-6 text-similarity-low" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Clean Results</p>
                <p className="text-2xl font-bold text-foreground">892</p>
                <p className="text-xs text-similarity-low">+15% this month</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-card shadow-card">
          <CardContent className="p-6">
            <div className="flex items-center space-x-4">
              <div className="p-2 bg-primary/10 rounded-lg">
                <TrendingUp className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Avg. Similarity</p>
                <p className="text-2xl font-bold text-foreground">32%</p>
                <p className="text-xs text-similarity-low">-5% this month</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Grid */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Weekly Reports Chart */}
        <Card className="bg-gradient-card shadow-card">
          <CardHeader>
            <CardTitle>Weekly Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={weeklyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" />
                <YAxis stroke="hsl(var(--muted-foreground))" />
                <Tooltip 
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "8px",
                  }}
                />
                <Bar dataKey="reports" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                <Bar dataKey="highSimilarity" fill="hsl(var(--high-similarity))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Language Distribution */}
        <Card className="bg-gradient-card shadow-card">
          <CardHeader>
            <CardTitle>Language Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-center">
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={languageData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={120}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {languageData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px",
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="grid grid-cols-2 gap-4 mt-4">
              {languageData.map((lang, index) => (
                <div key={lang.name} className="flex items-center space-x-2">
                  <div 
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: COLORS[index] }}
                  />
                  <span className="text-sm text-muted-foreground">{lang.name}</span>
                  <Badge variant="secondary" className="ml-auto">
                    {lang.value}%
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Similarity Trend */}
      <Card className="bg-gradient-card shadow-card">
        <CardHeader>
          <CardTitle>Similarity Trend Over Time</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={similarityTrend}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" />
              <YAxis stroke="hsl(var(--muted-foreground))" />
              <Tooltip 
                contentStyle={{
                  backgroundColor: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "8px",
                }}
              />
              <Line 
                type="monotone" 
                dataKey="avgSimilarity" 
                stroke="hsl(var(--primary))" 
                strokeWidth={3}
                dot={{ fill: "hsl(var(--primary))", strokeWidth: 2, r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Detection Methods Performance */}
      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="bg-gradient-card shadow-card">
          <CardHeader>
            <CardTitle>Jaccard Algorithm</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Accuracy</span>
                <span className="text-sm font-medium text-foreground">87%</span>
              </div>
              <div className="w-full bg-muted rounded-full h-2">
                <div className="bg-gradient-warning h-2 rounded-full" style={{ width: "87%" }}></div>
              </div>
              <div className="grid grid-cols-2 gap-4 text-center">
                <div>
                  <p className="text-lg font-bold text-foreground">1,156</p>
                  <p className="text-xs text-muted-foreground">Total Scans</p>
                </div>
                <div>
                  <p className="text-lg font-bold text-foreground">3.2s</p>
                  <p className="text-xs text-muted-foreground">Avg. Time</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-card shadow-card">
          <CardHeader>
            <CardTitle>AST Analysis</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Accuracy</span>
                <span className="text-sm font-medium text-foreground">92%</span>
              </div>
              <div className="w-full bg-muted rounded-full h-2">
                <div className="bg-gradient-primary h-2 rounded-full" style={{ width: "92%" }}></div>
              </div>
              <div className="grid grid-cols-2 gap-4 text-center">
                <div>
                  <p className="text-lg font-bold text-foreground">1,089</p>
                  <p className="text-xs text-muted-foreground">Total Scans</p>
                </div>
                <div>
                  <p className="text-lg font-bold text-foreground">8.7s</p>
                  <p className="text-xs text-muted-foreground">Avg. Time</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-card shadow-card">
          <CardHeader>
            <CardTitle>Combined Score</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Accuracy</span>
                <span className="text-sm font-medium text-foreground">95%</span>
              </div>
              <div className="w-full bg-muted rounded-full h-2">
                <div className="bg-gradient-success h-2 rounded-full" style={{ width: "95%" }}></div>
              </div>
              <div className="grid grid-cols-2 gap-4 text-center">
                <div>
                  <p className="text-lg font-bold text-foreground">1,247</p>
                  <p className="text-xs text-muted-foreground">Total Scans</p>
                </div>
                <div>
                  <p className="text-lg font-bold text-foreground">11.9s</p>
                  <p className="text-xs text-muted-foreground">Avg. Time</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}