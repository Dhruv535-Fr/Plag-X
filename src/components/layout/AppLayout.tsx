import { useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  Upload,
  FileText,
  BarChart3,
  Settings,
  Menu,
  Search,
  Bell,
  User,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

const navigation = [
  { name: "Dashboard", href: "/", icon: LayoutDashboard },
  { name: "Upload", href: "/upload", icon: Upload },
  { name: "Reports", href: "/reports", icon: FileText },
  { name: "Analytics", href: "/analytics", icon: BarChart3 },
  { name: "Settings", href: "/settings", icon: Settings },
];

interface AppLayoutProps {
  children: React.ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const location = useLocation();

  const isActive = (path: string) => {
    return location.pathname === path;
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Sidebar */}
      <div
        className={cn(
          "fixed left-0 top-0 z-50 h-full bg-sidebar border-r border-sidebar-border transition-all duration-300",
          sidebarCollapsed ? "w-16" : "w-64"
        )}
      >
        <div className="flex h-16 items-center justify-between px-4 border-b border-sidebar-border">
          {!sidebarCollapsed && (
            <div className="flex items-center space-x-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-primary">
                <Search className="h-4 w-4 text-primary-foreground" />
              </div>
              <span className="text-lg font-semibold text-sidebar-foreground">
                PlagiarismX
              </span>
            </div>
          )}
          <Button 
            variant="ghost" 
            size="icon"
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className="text-sidebar-foreground hover:bg-sidebar-accent"
          >
            <Menu className="h-4 w-4" />
          </Button>
        </div>

        <nav className="mt-6 px-2">
          <ul className="space-y-2">
            {navigation.map((item) => (
              <li key={item.name}>
                <NavLink
                  to={item.href}
                  className={cn(
                    "group flex items-center rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                    isActive(item.href)
                      ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-glow"
                      : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                  )}
                >
                  <item.icon
                    className={cn(
                      "h-5 w-5 flex-shrink-0",
                      sidebarCollapsed ? "mx-auto" : "mr-3"
                    )}
                  />
                  {!sidebarCollapsed && item.name}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>
      </div>

      {/* Main Content */}
      <div
        className={cn(
          "transition-all duration-300",
          sidebarCollapsed ? "ml-16" : "ml-64"
        )}
      >
        {/* Top Navigation */}
        <header className="border-b border-border bg-card shadow-card">
          <div className="flex h-16 items-center justify-between px-6">
            <div className="flex items-center space-x-4">
              <h1 className="text-xl font-semibold text-foreground">
                Code Plagiarism Detection
              </h1>
            </div>

            <div className="flex items-center space-x-4">
              <Button variant="ghost" size="icon" className="relative">
                <Bell className="h-4 w-4" />
                <span className="absolute -top-1 -right-1 h-2 w-2 rounded-full bg-primary"></span>
              </Button>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="flex items-center space-x-2 px-3">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src="" alt="User" />
                      <AvatarFallback className="bg-primary text-primary-foreground">
                        JD
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col items-start text-sm">
                      <span className="font-medium">John Doe</span>
                      <span className="text-muted-foreground text-xs">Student</span>
                    </div>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel>My Account</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem>
                    <User className="mr-2 h-4 w-4" />
                    Profile
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <Settings className="mr-2 h-4 w-4" />
                    Settings
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem className="text-destructive">
                    Log out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="p-6">
          {children}
        </main>
      </div>
    </div>
  );
}