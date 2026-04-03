"use client";

import { useState, useTransition } from "react";
import { adminUpdateUser } from "@/lib/actions";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Ban, ShieldCheck, ShieldOff, Search, UserCheck } from "lucide-react";
import { timeAgo } from "@/lib/utils";
import Link from "next/link";

interface AdminUsersProps {
  users: Array<{
    id: string;
    username: string;
    display_name: string | null;
    role: string;
    karma: number;
    is_banned: boolean;
    is_trusted: boolean;
    created_at: string;
  }>;
}

export function AdminUsers({ users: initialUsers }: AdminUsersProps) {
  const [users, setUsers] = useState(initialUsers);
  const [search, setSearch] = useState("");
  const [isPending, startTransition] = useTransition();

  const filtered = users.filter(
    (u) =>
      u.username.toLowerCase().includes(search.toLowerCase()) ||
      u.display_name?.toLowerCase().includes(search.toLowerCase())
  );

  const handleAction = (userId: string, updates: Record<string, unknown>) => {
    startTransition(async () => {
      const result = await adminUpdateUser(userId, updates);
      if (!result.error) {
        setUsers((prev) =>
          prev.map((u) => (u.id === userId ? { ...u, ...updates } : u))
        );
      }
    });
  };

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center gap-2 mb-4">
          <Search className="h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search users..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="max-w-sm"
          />
        </div>

        <div className="rounded-md border overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Username</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Karma</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Joined</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((user) => (
                <TableRow key={user.id}>
                  <TableCell>
                    <Link
                      href={`/u/${user.username}`}
                      className="font-medium hover:text-orange-500"
                    >
                      {user.username}
                    </Link>
                    {user.display_name && (
                      <p className="text-xs text-muted-foreground">
                        {user.display_name}
                      </p>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        user.role === "admin" ? "default" : "secondary"
                      }
                      className="text-xs"
                    >
                      {user.role}
                    </Badge>
                  </TableCell>
                  <TableCell className="font-mono text-sm">
                    {user.karma}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      {user.is_banned && (
                        <Badge variant="destructive" className="text-xs">
                          Banned
                        </Badge>
                      )}
                      {user.is_trusted && (
                        <Badge
                          className="text-xs bg-green-100 text-green-700 border-green-200"
                        >
                          Trusted
                        </Badge>
                      )}
                      {!user.is_banned && !user.is_trusted && (
                        <span className="text-xs text-muted-foreground">
                          Normal
                        </span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {timeAgo(user.created_at)}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1 justify-end">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() =>
                          handleAction(user.id, {
                            is_banned: !user.is_banned,
                          })
                        }
                        disabled={isPending}
                        title={user.is_banned ? "Unban" : "Ban"}
                      >
                        {user.is_banned ? (
                          <UserCheck className="h-4 w-4 text-green-600" />
                        ) : (
                          <Ban className="h-4 w-4 text-destructive" />
                        )}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() =>
                          handleAction(user.id, {
                            is_trusted: !user.is_trusted,
                          })
                        }
                        disabled={isPending}
                        title={user.is_trusted ? "Remove trust" : "Trust user"}
                      >
                        {user.is_trusted ? (
                          <ShieldOff className="h-4 w-4 text-orange-500" />
                        ) : (
                          <ShieldCheck className="h-4 w-4" />
                        )}
                      </Button>
                      {user.role !== "admin" && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() =>
                            handleAction(user.id, {
                              role:
                                user.role === "moderator" ? "user" : "moderator",
                            })
                          }
                          disabled={isPending}
                          title={
                            user.role === "moderator"
                              ? "Remove moderator"
                              : "Make moderator"
                          }
                        >
                          <Badge
                            variant="outline"
                            className="text-xs cursor-pointer"
                          >
                            {user.role === "moderator" ? "Demote" : "Mod"}
                          </Badge>
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {filtered.length === 0 && (
                <TableRow>
                  <TableCell
                    colSpan={6}
                    className="text-center py-8 text-muted-foreground"
                  >
                    No users found
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
