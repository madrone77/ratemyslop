export const dynamic = "force-dynamic";

import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  BarChart3,
  Users,
  FileText,
  MessageSquare,
  Flag,
  Settings,
  FolderOpen,
} from "lucide-react";
import Link from "next/link";
import { AdminProjects } from "./projects";
import { AdminUsers } from "./users";
import { AdminReports } from "./reports";
import { AdminSettings } from "./settings";
import { AdminCategories } from "./categories";

export default async function AdminPage() {
  const supabase = await createClient();

  // Stats
  const [
    { count: totalUsers },
    { count: totalProjects },
    { count: totalComments },
    { count: pendingReports },
    { count: pendingProjects },
    { count: todaySignups },
  ] = await Promise.all([
    supabase.from("profiles").select("*", { count: "exact", head: true }),
    supabase.from("projects").select("*", { count: "exact", head: true }),
    supabase.from("comments").select("*", { count: "exact", head: true }),
    supabase
      .from("reports")
      .select("*", { count: "exact", head: true })
      .eq("is_resolved", false),
    supabase
      .from("projects")
      .select("*", { count: "exact", head: true })
      .eq("status", "pending"),
    supabase
      .from("profiles")
      .select("*", { count: "exact", head: true })
      .gte(
        "created_at",
        new Date(new Date().setHours(0, 0, 0, 0)).toISOString()
      ),
  ]);

  // Data for tabs
  const { data: projects } = await supabase
    .from("projects")
    .select("*, profiles(username)")
    .order("created_at", { ascending: false })
    .limit(50);

  const { data: users } = await supabase
    .from("profiles")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(50);

  const { data: reports } = await supabase
    .from("reports")
    .select(
      "*, profiles:reporter_id(username), projects(title, slug), comments(body)"
    )
    .eq("is_resolved", false)
    .order("created_at", { ascending: false })
    .limit(50);

  const { data: settings } = await supabase
    .from("site_settings")
    .select("*")
    .single();

  const { data: categories } = await supabase
    .from("categories")
    .select("*")
    .order("sort_order");

  return (
    <div className="container mx-auto px-4 py-6 max-w-6xl">
      <h1 className="text-2xl font-bold mb-6">Admin Dashboard</h1>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
              <Users className="h-4 w-4" />
              Users
            </div>
            <p className="text-2xl font-bold">{totalUsers || 0}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
              <FileText className="h-4 w-4" />
              Projects
            </div>
            <p className="text-2xl font-bold">{totalProjects || 0}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
              <MessageSquare className="h-4 w-4" />
              Comments
            </div>
            <p className="text-2xl font-bold">{totalComments || 0}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
              <Flag className="h-4 w-4 text-destructive" />
              Reports
            </div>
            <p className="text-2xl font-bold text-destructive">
              {pendingReports || 0}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
              <BarChart3 className="h-4 w-4" />
              Pending
            </div>
            <p className="text-2xl font-bold">{pendingProjects || 0}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
              <Users className="h-4 w-4 text-green-500" />
              Today
            </div>
            <p className="text-2xl font-bold">{todaySignups || 0}</p>
          </CardContent>
        </Card>
      </div>

      {/* Main tabs */}
      <Tabs defaultValue="projects">
        <TabsList className="mb-4">
          <TabsTrigger value="projects" className="gap-1.5">
            <FileText className="h-4 w-4" />
            Projects
          </TabsTrigger>
          <TabsTrigger value="users" className="gap-1.5">
            <Users className="h-4 w-4" />
            Users
          </TabsTrigger>
          <TabsTrigger value="reports" className="gap-1.5">
            <Flag className="h-4 w-4" />
            Reports
            {(pendingReports || 0) > 0 && (
              <span className="ml-1 rounded-full bg-destructive px-1.5 py-0.5 text-xs text-destructive-foreground">
                {pendingReports}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="categories" className="gap-1.5">
            <FolderOpen className="h-4 w-4" />
            Categories
          </TabsTrigger>
          <TabsTrigger value="settings" className="gap-1.5">
            <Settings className="h-4 w-4" />
            Settings
          </TabsTrigger>
        </TabsList>

        <TabsContent value="projects">
          <AdminProjects projects={projects || []} />
        </TabsContent>

        <TabsContent value="users">
          <AdminUsers users={users || []} />
        </TabsContent>

        <TabsContent value="reports">
          <AdminReports reports={reports || []} />
        </TabsContent>

        <TabsContent value="categories">
          <AdminCategories categories={categories || []} />
        </TabsContent>

        <TabsContent value="settings">
          <AdminSettings settings={settings} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
