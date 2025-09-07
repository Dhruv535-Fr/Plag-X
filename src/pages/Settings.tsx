import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import {
  User,
  Settings as SettingsIcon,
  Bell,
  Shield,
  Database,
  Download,
  Trash2,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";

export default function Settings() {
  const { toast } = useToast();
  const [settings, setSettings] = useState({
    notifications: {
      email: true,
      desktop: false,
      highSimilarity: true,
      reportComplete: true,
    },
    analysis: {
      jaccardWeight: [40],
      astWeight: [60],
      similarityThreshold: [85],
      maxFileSize: [500],
    },
    privacy: {
      dataRetention: "6months",
      shareAnalytics: false,
      autoDelete: true,
    },
  });

  const handleSave = () => {
    toast({
      title: "Settings saved",
      description: "Your preferences have been updated successfully.",
    });
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Settings</h1>
        <p className="text-muted-foreground mt-2">
          Manage your account and application preferences
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Profile Settings */}
        <div className="lg:col-span-2 space-y-6">
          {/* Account Information */}
          <Card className="bg-gradient-card shadow-card">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <User className="h-5 w-5 text-primary" />
                <span>Account Information</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center space-x-4">
                <Avatar className="h-20 w-20">
                  <AvatarImage src="" alt="Profile" />
                  <AvatarFallback className="bg-primary text-primary-foreground text-lg">
                    JD
                  </AvatarFallback>
                </Avatar>
                <div className="space-y-2">
                  <Button variant="outline" size="sm">
                    Change Avatar
                  </Button>
                  <p className="text-xs text-muted-foreground">
                    JPG, PNG or GIF. Max size 2MB.
                  </p>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="firstName">First Name</Label>
                  <Input id="firstName" defaultValue="John" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName">Last Name</Label>
                  <Input id="lastName" defaultValue="Doe" />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <Input id="email" type="email" defaultValue="john.doe@university.edu" />
              </div>

              <div className="space-y-2">
                <Label htmlFor="role">Role</Label>
                <Select defaultValue="student">
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="student">Student</SelectItem>
                    <SelectItem value="instructor">Instructor</SelectItem>
                    <SelectItem value="admin">Administrator</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Analysis Settings */}
          <Card className="bg-gradient-card shadow-card">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <SettingsIcon className="h-5 w-5 text-primary" />
                <span>Analysis Configuration</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div>
                  <Label className="text-sm font-medium">Jaccard Weight ({settings.analysis.jaccardWeight[0]}%)</Label>
                  <Slider
                    value={settings.analysis.jaccardWeight}
                    onValueChange={(value) => 
                      setSettings(prev => ({
                        ...prev,
                        analysis: { ...prev.analysis, jaccardWeight: value }
                      }))
                    }
                    max={100}
                    step={5}
                    className="mt-2"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Weight for token-based similarity in combined score
                  </p>
                </div>

                <div>
                  <Label className="text-sm font-medium">AST Weight ({settings.analysis.astWeight[0]}%)</Label>
                  <Slider
                    value={settings.analysis.astWeight}
                    onValueChange={(value) => 
                      setSettings(prev => ({
                        ...prev,
                        analysis: { ...prev.analysis, astWeight: value }
                      }))
                    }
                    max={100}
                    step={5}
                    className="mt-2"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Weight for structural similarity in combined score
                  </p>
                </div>

                <div>
                  <Label className="text-sm font-medium">High Similarity Threshold ({settings.analysis.similarityThreshold[0]}%)</Label>
                  <Slider
                    value={settings.analysis.similarityThreshold}
                    onValueChange={(value) => 
                      setSettings(prev => ({
                        ...prev,
                        analysis: { ...prev.analysis, similarityThreshold: value }
                      }))
                    }
                    min={70}
                    max={95}
                    step={1}
                    className="mt-2"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Minimum score to flag as high similarity
                  </p>
                </div>

                <div>
                  <Label className="text-sm font-medium">Max File Size ({settings.analysis.maxFileSize[0]} KB)</Label>
                  <Slider
                    value={settings.analysis.maxFileSize}
                    onValueChange={(value) => 
                      setSettings(prev => ({
                        ...prev,
                        analysis: { ...prev.analysis, maxFileSize: value }
                      }))
                    }
                    min={100}
                    max={2000}
                    step={50}
                    className="mt-2"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Maximum allowed file size for uploads
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Sidebar */}
        <div className="space-y-6">
          {/* Notifications */}
          <Card className="bg-gradient-card shadow-card">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Bell className="h-5 w-5 text-primary" />
                <span>Notifications</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-foreground">Email Notifications</p>
                  <p className="text-xs text-muted-foreground">Receive updates via email</p>
                </div>
                <Switch
                  checked={settings.notifications.email}
                  onCheckedChange={(checked) => 
                    setSettings(prev => ({
                      ...prev,
                      notifications: { ...prev.notifications, email: checked }
                    }))
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-foreground">Desktop Notifications</p>
                  <p className="text-xs text-muted-foreground">Browser notifications</p>
                </div>
                <Switch
                  checked={settings.notifications.desktop}
                  onCheckedChange={(checked) => 
                    setSettings(prev => ({
                      ...prev,
                      notifications: { ...prev.notifications, desktop: checked }
                    }))
                  }
                />
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-foreground">High Similarity Alerts</p>
                  <p className="text-xs text-muted-foreground">Alert on plagiarism detection</p>
                </div>
                <Switch
                  checked={settings.notifications.highSimilarity}
                  onCheckedChange={(checked) => 
                    setSettings(prev => ({
                      ...prev,
                      notifications: { ...prev.notifications, highSimilarity: checked }
                    }))
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-foreground">Report Complete</p>
                  <p className="text-xs text-muted-foreground">Notify when analysis finishes</p>
                </div>
                <Switch
                  checked={settings.notifications.reportComplete}
                  onCheckedChange={(checked) => 
                    setSettings(prev => ({
                      ...prev,
                      notifications: { ...prev.notifications, reportComplete: checked }
                    }))
                  }
                />
              </div>
            </CardContent>
          </Card>

          {/* Privacy & Security */}
          <Card className="bg-gradient-card shadow-card">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Shield className="h-5 w-5 text-primary" />
                <span>Privacy & Security</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Data Retention Period</Label>
                <Select
                  value={settings.privacy.dataRetention}
                  onValueChange={(value) => 
                    setSettings(prev => ({
                      ...prev,
                      privacy: { ...prev.privacy, dataRetention: value }
                    }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1month">1 Month</SelectItem>
                    <SelectItem value="3months">3 Months</SelectItem>
                    <SelectItem value="6months">6 Months</SelectItem>
                    <SelectItem value="1year">1 Year</SelectItem>
                    <SelectItem value="forever">Forever</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-foreground">Share Analytics</p>
                  <p className="text-xs text-muted-foreground">Help improve detection</p>
                </div>
                <Switch
                  checked={settings.privacy.shareAnalytics}
                  onCheckedChange={(checked) => 
                    setSettings(prev => ({
                      ...prev,
                      privacy: { ...prev.privacy, shareAnalytics: checked }
                    }))
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-foreground">Auto-delete Reports</p>
                  <p className="text-xs text-muted-foreground">Based on retention period</p>
                </div>
                <Switch
                  checked={settings.privacy.autoDelete}
                  onCheckedChange={(checked) => 
                    setSettings(prev => ({
                      ...prev,
                      privacy: { ...prev.privacy, autoDelete: checked }
                    }))
                  }
                />
              </div>
            </CardContent>
          </Card>

          {/* Data Management */}
          <Card className="bg-gradient-card shadow-card">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Database className="h-5 w-5 text-primary" />
                <span>Data Management</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button variant="outline" className="w-full justify-start">
                <Download className="mr-2 h-4 w-4" />
                Export All Data
              </Button>
              <Button variant="outline" className="w-full justify-start text-destructive hover:text-destructive">
                <Trash2 className="mr-2 h-4 w-4" />
                Delete All Reports
              </Button>
              <p className="text-xs text-muted-foreground">
                Export your data or permanently delete all reports and files.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Save Button */}
      <div className="flex justify-end">
        <Button onClick={handleSave} className="bg-gradient-primary hover:shadow-glow">
          Save Changes
        </Button>
      </div>
    </div>
  );
}