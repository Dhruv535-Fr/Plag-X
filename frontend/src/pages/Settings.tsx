import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { toast } from "@/hooks/use-toast";
import {
  User,
  Bell,
  Shield,
  Download,
  Trash2,
  Save,
  Key,
} from "lucide-react";

const Settings = () => {
  const { user, updateProfile } = useAuth();
  const [isUpdating, setIsUpdating] = useState(false);

  const [profile, setProfile] = useState({
    firstName: user?.firstName || "",
    lastName: user?.lastName || "",
    username: user?.username || "",
    institution: user?.institution || "",
  });

  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const [preferences, setPreferences] = useState({
    emailNotifications: true,
    analysisAlerts: false,
    weeklyReports: true,
  });

  const handleProfileUpdate = async () => {
    setIsUpdating(true);
    try {
      await updateProfile(profile);
      toast({ title: "Profile updated", description: "Your profile has been updated successfully." });
    } catch (error: any) {
      toast({ title: "Update failed", description: error.response?.data?.message || "Failed to update profile.", variant: "destructive" });
    } finally {
      setIsUpdating(false);
    }
  };

  const handlePasswordChange = async () => {
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast({ title: "Password mismatch", description: "New passwords do not match.", variant: "destructive" });
      return;
    }
    if (passwordData.newPassword.length < 6) {
      toast({ title: "Weak password", description: "Password must be at least 6 characters long.", variant: "destructive" });
      return;
    }
    toast({ title: "Password updated", description: "Your password has been updated successfully." });
    setPasswordData({ currentPassword: "", newPassword: "", confirmPassword: "" });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Settings</h1>
        <p className="text-sm text-muted-foreground mt-1">Manage your account settings and preferences.</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-5">
          {/* Profile */}
          <Card className="bg-white border border-border shadow-sm">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2 text-base">
                <User className="h-4 w-4 text-primary" />
                Profile Information
              </CardTitle>
              <CardDescription className="text-sm">Update your personal information.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="firstName" className="text-sm">First Name</Label>
                  <Input id="firstName" value={profile.firstName} onChange={(e) => setProfile({ ...profile, firstName: e.target.value })} className="h-9" />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="lastName" className="text-sm">Last Name</Label>
                  <Input id="lastName" value={profile.lastName} onChange={(e) => setProfile({ ...profile, lastName: e.target.value })} className="h-9" />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="username" className="text-sm">Username</Label>
                <Input id="username" value={profile.username} onChange={(e) => setProfile({ ...profile, username: e.target.value })} className="h-9" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="email" className="text-sm">Email</Label>
                <Input id="email" type="email" value={user?.email || ""} disabled className="h-9 bg-muted" />
                <p className="text-xs text-muted-foreground">Contact support to change your email address.</p>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="institution" className="text-sm">Institution (Optional)</Label>
                <Input id="institution" value={profile.institution} onChange={(e) => setProfile({ ...profile, institution: e.target.value })} placeholder="Enter your institution" className="h-9" />
              </div>
              <Button onClick={handleProfileUpdate} disabled={isUpdating} className="bg-primary hover:bg-primary/90">
                <Save className="mr-2 h-4 w-4" />
                {isUpdating ? "Updating..." : "Update Profile"}
              </Button>
            </CardContent>
          </Card>

          {/* Password */}
          <Card className="bg-white border border-border shadow-sm">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2 text-base">
                <Key className="h-4 w-4 text-primary" />
                Change Password
              </CardTitle>
              <CardDescription className="text-sm">Update your account password for security.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="currentPassword" className="text-sm">Current Password</Label>
                <Input id="currentPassword" type="password" value={passwordData.currentPassword} onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })} className="h-9" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="newPassword" className="text-sm">New Password</Label>
                  <Input id="newPassword" type="password" value={passwordData.newPassword} onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })} className="h-9" />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="confirmPassword" className="text-sm">Confirm Password</Label>
                  <Input id="confirmPassword" type="password" value={passwordData.confirmPassword} onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })} className="h-9" />
                </div>
              </div>
              <Button onClick={handlePasswordChange} disabled={!passwordData.currentPassword || !passwordData.newPassword || !passwordData.confirmPassword} className="bg-primary hover:bg-primary/90">
                <Save className="mr-2 h-4 w-4" />
                Change Password
              </Button>
            </CardContent>
          </Card>

          {/* Notifications */}
          <Card className="bg-white border border-border shadow-sm">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2 text-base">
                <Bell className="h-4 w-4 text-primary" />
                Notifications
              </CardTitle>
              <CardDescription className="text-sm">Manage your notification preferences.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {[
                { id: "emailNotifications", label: "Email Notifications", desc: "Receive email updates about your account", key: "emailNotifications" as const },
                { id: "analysisAlerts", label: "Analysis Alerts", desc: "Get notified when analysis is complete", key: "analysisAlerts" as const },
                { id: "weeklyReports", label: "Weekly Reports", desc: "Receive weekly summary of your activity", key: "weeklyReports" as const },
              ].map((item, i) => (
                <div key={item.id}>
                  {i > 0 && <Separator className="my-4" />}
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor={item.id} className="text-sm font-medium">{item.label}</Label>
                      <p className="text-xs text-muted-foreground mt-0.5">{item.desc}</p>
                    </div>
                    <Switch id={item.id} checked={preferences[item.key]} onCheckedChange={(v) => setPreferences({ ...preferences, [item.key]: v })} />
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-5">
          <Card className="bg-white border border-border shadow-sm">
            <CardHeader className="pb-4">
              <CardTitle className="text-base">Account Status</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Role</span>
                <Badge variant="secondary" className="text-xs">{user?.role}</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Reports</span>
                <Badge variant="outline" className="text-xs">{user?.reportsCount || 0}</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Member Since</span>
                <span className="text-xs text-muted-foreground">
                  {user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}
                </span>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white border border-border shadow-sm">
            <CardHeader className="pb-4">
              <CardTitle className="text-base">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2.5">
              <Button variant="outline" className="w-full justify-start h-9 text-sm gap-2"
                onClick={() => toast({ title: "Data export initiated", description: "Your data export will be sent to your email." })}>
                <Download className="h-4 w-4" />
                Export Data
              </Button>
              <Button variant="outline" className="w-full justify-start h-9 text-sm gap-2 text-destructive border-destructive/30 hover:bg-destructive hover:text-white"
                onClick={() => toast({ title: "Account deletion", description: "Please contact support to delete your account.", variant: "destructive" })}>
                <Trash2 className="h-4 w-4" />
                Delete Account
              </Button>
            </CardContent>
          </Card>

          <Card className="bg-white border border-border shadow-sm">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2 text-base">
                <Shield className="h-4 w-4 text-primary" />
                Privacy
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">Your data is private and secured. Reports are only visible to you.</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Settings;
