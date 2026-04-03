"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useEffect, useState } from "react";
import { buttonVariants } from "@/components/ui/button";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Plus, LogOut, User, Shield, Trophy } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Profile } from "@/types/database";

export function Header() {
  const [user, setUser] = useState<{ id: string } | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    const getUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        setUser(user);
        const { data } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", user.id)
          .single();
        if (data) setProfile(data);
      }
    };
    getUser();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setUser(session.user);
      } else {
        setUser(null);
        setProfile(null);
      }
    });

    return () => subscription.unsubscribe();
  }, [supabase]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setProfile(null);
    router.refresh();
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto flex h-14 items-center justify-between px-4">
        <div className="flex items-center gap-6">
          <Link href="/" className="flex items-center gap-2">
            <span className="text-xl font-bold tracking-tight">
              rate<span className="text-orange-500">my</span>slop
            </span>
          </Link>
          <nav className="hidden md:flex items-center gap-4 text-sm">
            <Link
              href="/"
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              Feed
            </Link>
            <Link
              href="/leaderboard"
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              Leaderboard
            </Link>
          </nav>
        </div>

        <div className="flex items-center gap-3">
          {user ? (
            <>
              <Link
                href="/submit"
                className={cn(
                  buttonVariants({ size: "sm" }),
                  "gap-1.5"
                )}
              >
                <Plus className="h-4 w-4" />
                <span className="hidden sm:inline">Submit</span>
              </Link>
              <DropdownMenu>
                <DropdownMenuTrigger className="relative h-8 w-8 rounded-full cursor-pointer">
                  <Avatar className="h-8 w-8">
                    <AvatarImage
                      src={profile?.avatar_url || undefined}
                      alt={profile?.username}
                    />
                    <AvatarFallback>
                      {profile?.username?.[0]?.toUpperCase() || "?"}
                    </AvatarFallback>
                  </Avatar>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <div className="px-2 py-1.5">
                    <p className="text-sm font-medium">{profile?.username}</p>
                    <p className="text-xs text-muted-foreground">
                      {profile?.karma || 0} karma
                    </p>
                  </div>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    className="gap-2 cursor-pointer"
                    onClick={() => router.push(`/u/${profile?.username}`)}
                  >
                    <User className="h-4 w-4" />
                    Profile
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    className="gap-2 cursor-pointer"
                    onClick={() => router.push("/leaderboard")}
                  >
                    <Trophy className="h-4 w-4" />
                    Leaderboard
                  </DropdownMenuItem>
                  {profile?.role === "admin" && (
                    <DropdownMenuItem
                      className="gap-2 cursor-pointer"
                      onClick={() => router.push("/admin")}
                    >
                      <Shield className="h-4 w-4" />
                      Admin
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={handleSignOut}
                    className="gap-2 cursor-pointer"
                  >
                    <LogOut className="h-4 w-4" />
                    Sign out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          ) : (
            <div className="flex items-center gap-2">
              <Link
                href="/auth/login"
                className={cn(
                  buttonVariants({ variant: "ghost", size: "sm" })
                )}
              >
                Log in
              </Link>
              <Link
                href="/auth/signup"
                className={cn(buttonVariants({ size: "sm" }))}
              >
                Sign up
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
