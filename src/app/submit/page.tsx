import { createClient } from "@/lib/supabase/server";
import { submitProject } from "@/lib/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">Submit Your Slop</CardTitle>
          <CardDescription>
            Share an AI-generated project with the community. All submissions
            are public.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {error && (
            <div className="mb-4 p-3 rounded-md bg-destructive/10 text-destructive text-sm">
              {error}
            </div>
          )}

          <form action={submitProject} className="space-y-4">
            {/* Honeypot */}
            <div className="hidden">
              <input
                type="text"
                name="company"
                tabIndex={-1}
                autoComplete="off"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="title">Project Name</Label>
              <Input
                id="title"
                name="title"
                placeholder="My Amazing AI App"
                maxLength={100}
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="url">URL</Label>
              <Input
                id="url"
                name="url"
                type="url"
                placeholder="https://myproject.com"
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                name="description"
                placeholder="What does it do? How much of it was AI-generated? Be honest — the community will find out anyway."
                rows={4}
                maxLength={2000}
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="category">Category</Label>
                <Select name="category" defaultValue="apps">
                  <SelectTrigger>
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

              <div className="space-y-1.5">
                <Label htmlFor="ai_tools">AI Tools Used</Label>
                <Input
                  id="ai_tools"
                  name="ai_tools"
                  placeholder="ChatGPT, Claude, Cursor"
                />
                <p className="text-xs text-muted-foreground">
                  Comma-separated
                </p>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="images">Screenshots</Label>
              <Input
                id="images"
                name="images"
                type="file"
                accept="image/*"
                multiple
                className="file:mr-4 file:py-1 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-orange-50 file:text-orange-700 hover:file:bg-orange-100"
              />
              <p className="text-xs text-muted-foreground">
                Upload up to 5 screenshots. First image becomes the thumbnail.
              </p>
            </div>

            <Button type="submit" className="w-full" size="lg">
              Submit for Rating
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
