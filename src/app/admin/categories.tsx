"use client";

import { useState, useTransition } from "react";
import { adminUpdateCategory, adminCreateCategory } from "@/lib/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Plus } from "lucide-react";

interface Category {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  sort_order: number;
  is_active: boolean;
}

export function AdminCategories({
  categories: initialCategories,
}: {
  categories: Category[];
}) {
  const [categories, setCategories] = useState(initialCategories);
  const [newName, setNewName] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [isPending, startTransition] = useTransition();

  const handleToggle = (catId: string, isActive: boolean) => {
    startTransition(async () => {
      const result = await adminUpdateCategory(catId, {
        is_active: isActive,
      });
      if (!result.error) {
        setCategories((prev) =>
          prev.map((c) => (c.id === catId ? { ...c, is_active: isActive } : c))
        );
      }
    });
  };

  const handleCreate = () => {
    if (!newName.trim()) return;

    startTransition(async () => {
      const formData = new FormData();
      formData.set("name", newName);
      formData.set("description", newDesc);
      const result = await adminCreateCategory(formData);
      if (!result.error) {
        // Reload to get the new category with its ID
        window.location.reload();
      }
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Categories</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Slug</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Order</TableHead>
                <TableHead className="text-right">Active</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {categories.map((cat) => (
                <TableRow key={cat.id}>
                  <TableCell className="font-medium">{cat.name}</TableCell>
                  <TableCell className="text-sm text-muted-foreground font-mono">
                    {cat.slug}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground max-w-[200px] truncate">
                    {cat.description || "—"}
                  </TableCell>
                  <TableCell className="text-sm">{cat.sort_order}</TableCell>
                  <TableCell className="text-right">
                    <Switch
                      checked={cat.is_active}
                      onCheckedChange={(checked) =>
                        handleToggle(cat.id, checked)
                      }
                      disabled={isPending}
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {/* Add new category */}
        <div className="flex items-end gap-3">
          <div className="flex-1 space-y-1">
            <label className="text-sm font-medium">New Category</label>
            <Input
              placeholder="Category name"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
            />
          </div>
          <div className="flex-1 space-y-1">
            <label className="text-sm font-medium">Description</label>
            <Input
              placeholder="Optional description"
              value={newDesc}
              onChange={(e) => setNewDesc(e.target.value)}
            />
          </div>
          <Button
            onClick={handleCreate}
            disabled={isPending || !newName.trim()}
            className="gap-1.5"
          >
            <Plus className="h-4 w-4" />
            Add
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
