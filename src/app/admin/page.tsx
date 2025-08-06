"use client";

import React, { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useRouter } from "next/navigation";
import { 
  Users, 
  Building, 
  FileText, 
  Settings, 
  Database,
  Shield,
  Activity,
  Package,
  AlertCircle
} from "lucide-react";

export default function AdminPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    // Check for user in sessionStorage
    try {
      const storedUser = sessionStorage.getItem('currentUser');
      if (storedUser) {
        const userData = JSON.parse(storedUser);
        setUser(userData);
      }
      setLoading(false);
    } catch (err) {
      console.error('Error loading user data:', err);
      setError('Failed to load user data');
      setLoading(false);
    }
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-4">Loading admin panel...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-red-500" />
              Error
            </CardTitle>
            <CardDescription>{error}</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => router.push('/')} className="w-full">
              Go to Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Check if user is admin
  const isAdmin = user?.role === 'admin' || user?.role === 'developer';

  if (!isAdmin && user) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Access Denied</CardTitle>
            <CardDescription>
              This page requires administrator privileges.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => router.push('/cases')} className="w-full">
              Go to Cases
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const adminActions = [
    {
      title: "User Management",
      description: "Manage user accounts and permissions",
      icon: Users,
      href: "/users",
      color: "text-blue-600"
    },
    {
      title: "Workspace Management",
      description: "Configure workspace settings",
      icon: Building,
      href: "/workspaces",
      color: "text-green-600"
    },
    {
      title: "Case Management",
      description: "View and manage all cases",
      icon: FileText,
      href: "/cases",
      color: "text-purple-600"
    },
    {
      title: "Fleet Management",
      description: "Manage bikes and assignments",
      icon: Package,
      href: "/fleet",
      color: "text-orange-600"
    },
    {
      title: "Database Health",
      description: "Monitor database status",
      icon: Database,
      href: "/api/health",
      color: "text-red-600",
      external: true
    },
    {
      title: "System Settings",
      description: "Configure system parameters",
      icon: Settings,
      href: "/settings",
      color: "text-gray-600"
    }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Admin Panel</h1>
          <p className="text-muted-foreground mt-2">
            System administration and configuration
          </p>
        </div>
        <Badge variant="default" className="text-sm">
          <Shield className="w-4 h-4 mr-1" />
          Administrator
        </Badge>
      </div>

      {/* System Status Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="w-5 h-5" />
            System Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
              <span className="text-sm font-medium">Application</span>
              <Badge variant="outline" className="bg-green-100 text-green-800">
                Online
              </Badge>
            </div>
            <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
              <span className="text-sm font-medium">Database</span>
              <Badge variant="outline" className="bg-blue-100 text-blue-800">
                SQLite
              </Badge>
            </div>
            <div className="flex items-center justify-between p-3 bg-purple-50 rounded-lg">
              <span className="text-sm font-medium">Environment</span>
              <Badge variant="outline" className="bg-purple-100 text-purple-800">
                Production
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Admin Actions Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {adminActions.map((action) => {
          const Icon = action.icon;
          return (
            <Card 
              key={action.href}
              className="hover:shadow-lg transition-shadow cursor-pointer"
              onClick={() => {
                try {
                  if (action.external) {
                    window.open(action.href, '_blank');
                  } else {
                    router.push(action.href);
                  }
                } catch (err) {
                  console.error('Navigation error:', err);
                }
              }}
            >
              <CardHeader>
                <CardTitle className="flex items-center gap-3">
                  <Icon className={`w-6 h-6 ${action.color}`} />
                  {action.title}
                </CardTitle>
                <CardDescription>{action.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <Button 
                  variant="ghost" 
                  className="w-full justify-start"
                >
                  Open →
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* User Info Card */}
      {user && (
        <Card>
          <CardHeader>
            <CardTitle>Current User</CardTitle>
            <CardDescription>Your account information</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm font-medium">Email:</span>
                <span className="text-sm text-muted-foreground">{user.email || 'Not set'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm font-medium">Role:</span>
                <Badge variant="outline">{user.role || 'Unknown'}</Badge>
              </div>
              <div className="flex justify-between">
                <span className="text-sm font-medium">User ID:</span>
                <span className="text-sm text-muted-foreground font-mono">{user.id || 'Not set'}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Login Prompt */}
      {!user && (
        <Card>
          <CardHeader>
            <CardTitle>Not Logged In</CardTitle>
            <CardDescription>Please log in to access admin features</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => router.push('/login')} className="w-full">
              Go to Login
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}