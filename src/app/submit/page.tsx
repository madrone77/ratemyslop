export const dynamic = "force-dynamic";

import { createClient } from "@/lib/supabase/server";
import { submitProject } from "@/lib/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface PageProps {
  searchParams: Promise<{ error?: string }>;
}

export default async function SubmitPage({ searchParams }: PageProps) {
  const { error } = await searchParams;
  const supabase = await createClient();

  const { data: categories } = await supabase
    .from("categories")
    .select("*")
    .eq("is_active", true)
    .order("sort_order");

  return (
    <div className="mx-auto max-w-2xl px-4 sm:px-6 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Submit Your Slop</h1>
        <p className="text-base text-muted-foreground mt-1">
          Share an AI-generated project with the community.
        </p>
      </div>

      <div className="rounded-2xl border bg-card p-6 sm:p-8">
        {error && (
          <div className="mb-6 p-4 rounded-xl bg-destructive/10 text-destructive text-sm">
            {error}
          </div>
        )}

        <form action={submitProject} className="space-y-6">
          {/* Honeypot */}
          <div className="hidden">
            <input
              type="text"
              name="company"
              tabIndex={-1}
              autoComplete="off"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="title" className="text-sm font-medium">
              Project Name
            </Label>
            <Input
              id="title"
              name="title"
              placeholder="My Amazing AI App"
              maxLength={100}
              required
              className="h-11"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="url" className="text-sm font-medium">
              URL
            </Label>
            <Input
              id="url"
              name="url"
              type="url"
              placeholder="https://myproject.com"
              required
              className="h-11"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description" className="text-sm font-medium">
              Description
            </Label>
            <Textarea
              id="description"
              name="description"
              placeholder="What does it do? How much of it was AI-generated? Be honest — the community will find out anyway."
              rows={5}
              maxLength={2000}
              required
              className="resize-none text-[15px] leading-relaxed"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="category" className="text-sm font-medium">
                Category
              </Label>
              <Select name="category" defaultValue="apps">
                <SelectTrigger className="h-11">
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {categories?.map((cat) => (
                    <SelectItem key={cat.slug} value={cat.slug}>
                      {cat.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="ai_tools" className="text-sm font-medium">
                AI Tools Used
              </Label>
              <Input
                id="ai_tools"
                name="ai_tools"
                placeholder="ChatGPT, Claude, Cursor"
                className="h-11"
              />
              <p className="text-xs text-muted-foreground">Comma-separated</p>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="images" className="text-sm font-medium">
              Screenshots
            </Label>
            <Input
              id="images"
              name="images"
              type="file"
              accept="image/*"
              multiple
              className="h-11 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-medium file:bg-orange-50 file:text-orange-700 hover:file:bg-orange-100"
            />
            <p className="text-xs text-muted-foreground">
              Up to 5 screenshots. First one becomes the thumbnail.
            </p>
          </div>

          <Button
            type="submit"
            className="w-full h-12 text-base rounded-full font-semibold"
          >
            Submit for Rating
          </Button>
        </form>
      </div>
    </div>
  );
}
