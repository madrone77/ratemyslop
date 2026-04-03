"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { slugify } from "@/lib/utils";

// ============================================
// AUTH ACTIONS
// ============================================

export async function signUpWithEmail(formData: FormData) {
  const supabase = await createClient();
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const username = formData.get("username") as string;

  // Check honeypot
  if (formData.get("website")) {
    redirect("/auth/signup?error=Something went wrong");
  }

  if (!email || !password || !username) {
    redirect("/auth/signup?error=All fields are required");
  }

  if (username.length < 3 || username.length > 20) {
    redirect("/auth/signup?error=Username must be 3-20 characters");
  }

  if (!/^[a-zA-Z0-9_-]+$/.test(username)) {
    redirect("/auth/signup?error=Username can only contain letters, numbers, hyphens, and underscores");
  }

  // Check username availability
  const { data: existing } = await supabase
    .from("profiles")
    .select("id")
    .eq("username", username)
    .single();

  if (existing) {
    redirect("/auth/signup?error=Username is taken");
  }

  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { user_name: username },
      emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback`,
    },
  });

  if (error) {
    redirect(`/auth/signup?error=${encodeURIComponent(error.message)}`);
  }

  redirect("/auth/confirm");
}

export async function signInWithEmail(formData: FormData) {
  const supabase = await createClient();
  let emailOrUsername = formData.get("email") as string;
  const password = formData.get("password") as string;
  const redirectTo = formData.get("redirect") as string;

  // If input doesn't look like an email, treat it as a username
  if (!emailOrUsername.includes("@")) {
    const { createClient: createSupabaseClient } = await import(
      "@supabase/supabase-js"
    );
    const serviceClient = createSupabaseClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Look up the user's email by username
    const { data: profile } = await serviceClient
      .from("profiles")
      .select("id")
      .eq("username", emailOrUsername)
      .single();

    if (!profile) {
      redirect(`/auth/login?error=${encodeURIComponent("User not found")}`);
    }

    // Get email from auth.users via admin API
    const { data: authUser } = await serviceClient.auth.admin.getUserById(
      profile.id
    );

    if (!authUser?.user?.email) {
      redirect(`/auth/login?error=${encodeURIComponent("User not found")}`);
    }

    emailOrUsername = authUser.user.email;
  }

  const { error } = await supabase.auth.signInWithPassword({
    email: emailOrUsername,
    password,
  });

  if (error) {
    redirect(`/auth/login?error=${encodeURIComponent(error.message)}`);
  }

  redirect(redirectTo || "/");
}

export async function signInWithOAuth(provider: "github" | "google") {
  const supabase = await createClient();

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider,
    options: {
      redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback`,
    },
  });

  if (error) {
    redirect(`/auth/login?error=${encodeURIComponent(error.message)}`);
  }

  if (data.url) {
    redirect(data.url);
  }
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/");
}

// ============================================
// PROJECT ACTIONS
// ============================================

export async function submitProject(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/auth/login");

  // Check honeypot
  if (formData.get("company")) {
    redirect("/submit?error=Something went wrong");
  }

  // Check if user is banned
  const { data: profile } = await supabase
    .from("profiles")
    .select("is_banned, is_trusted, role, created_at")
    .eq("id", user.id)
    .single();

  if (profile?.is_banned) {
    redirect("/submit?error=Your account has been suspended");
  }

  // Check rate limit (15 per day)
  const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  const { count } = await supabase
    .from("projects")
    .select("*", { count: "exact", head: true })
    .eq("user_id", user.id)
    .gte("created_at", oneDayAgo);

  if ((count || 0) >= 15) {
    redirect("/submit?error=You've reached the daily submission limit (15). Try again tomorrow!");
  }

  // Check if new account needs approval (admins and trusted users bypass)
  const isTrusted = profile?.is_trusted || profile?.role === "admin" || profile?.role === "moderator";
  const accountAge =
    Date.now() - new Date(profile?.created_at || "").getTime();
  const isNewAccount = accountAge < 24 * 60 * 60 * 1000;
  const status = isNewAccount && !isTrusted ? "pending" : "approved";

  // Check submissions are open
  const { data: settings } = await supabase
    .from("site_settings")
    .select("submissions_open")
    .single();

  if (!settings?.submissions_open) {
    redirect("/submit?error=Submissions are currently closed");
  }

  const title = formData.get("title") as string;
  const description = formData.get("description") as string;
  const url = formData.get("url") as string;
  const category = formData.get("category") as string;
  const aiTools = formData.get("ai_tools") as string;

  if (!title || !description || !url) {
    redirect("/submit?error=Title, description, and URL are required");
  }

  const slug = slugify(title) + "-" + Date.now().toString(36);

  const { data: project, error } = await supabase
    .from("projects")
    .insert({
      user_id: user.id,
      slug,
      title,
      description,
      url,
      category: category || "apps",
      ai_tools_used: aiTools
        ? aiTools.split(",").map((t: string) => t.trim())
        : [],
      status,
    })
    .select()
    .single();

  if (error) {
    redirect(`/submit?error=${encodeURIComponent(error.message)}`);
  }

  // Handle image uploads
  const images = formData.getAll("images") as File[];
  for (let i = 0; i < images.length; i++) {
    const file = images[i];
    if (!file || file.size === 0) continue;

    const ext = file.name.split(".").pop();
    const path = `${user.id}/${project.id}/${i}.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from("project-images")
      .upload(path, file);

    if (!uploadError) {
      const {
        data: { publicUrl },
      } = supabase.storage.from("project-images").getPublicUrl(path);

      await supabase.from("project_images").insert({
        project_id: project.id,
        url: publicUrl,
        sort_order: i,
      });

      // Set first image as thumbnail
      if (i === 0) {
        await supabase
          .from("projects")
          .update({ thumbnail_url: publicUrl })
          .eq("id", project.id);
      }
    }
  }

  redirect(`/p/${project.slug}`);
}

// ============================================
// VOTE ACTIONS
// ============================================

export async function vote(projectId: string, value: number) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "Must be logged in to vote" };

  // Check if already voted
  const { data: existing } = await supabase
    .from("votes")
    .select("id, value")
    .eq("user_id", user.id)
    .eq("project_id", projectId)
    .single();

  if (existing) {
    if (existing.value === value) {
      // Remove vote (toggle off)
      await supabase.from("votes").delete().eq("id", existing.id);
      return { vote: 0 };
    } else {
      // Change vote
      await supabase.from("votes").update({ value }).eq("id", existing.id);
      return { vote: value };
    }
  }

  // New vote
  const { error } = await supabase.from("votes").insert({
    user_id: user.id,
    project_id: projectId,
    value,
  });

  if (error) return { error: error.message };
  return { vote: value };
}

// ============================================
// COMMENT ACTIONS
// ============================================

export async function addComment(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "Must be logged in to comment" };

  // Check honeypot
  if (formData.get("phone")) {
    return { error: "Something went wrong" };
  }

  // Check ban
  const { data: profile } = await supabase
    .from("profiles")
    .select("is_banned")
    .eq("id", user.id)
    .single();

  if (profile?.is_banned) return { error: "Account suspended" };

  // Rate limit: 20 comments per hour
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
  const { count } = await supabase
    .from("comments")
    .select("*", { count: "exact", head: true })
    .eq("user_id", user.id)
    .gte("created_at", oneHourAgo);

  if ((count || 0) >= 20) {
    return { error: "Comment rate limit reached. Try again later." };
  }

  const body = formData.get("body") as string;
  const projectId = formData.get("project_id") as string;
  const parentId = (formData.get("parent_id") as string) || null;

  if (!body?.trim()) return { error: "Comment cannot be empty" };

  const { error } = await supabase.from("comments").insert({
    user_id: user.id,
    project_id: projectId,
    parent_id: parentId,
    body: body.trim(),
  });

  if (error) return { error: error.message };
  return { success: true };
}

// ============================================
// REPORT ACTIONS
// ============================================

export async function reportContent(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "Must be logged in" };

  const projectId = (formData.get("project_id") as string) || null;
  const commentId = (formData.get("comment_id") as string) || null;
  const reason = formData.get("reason") as string;
  const details = (formData.get("details") as string) || null;

  const { error } = await supabase.from("reports").insert({
    reporter_id: user.id,
    project_id: projectId,
    comment_id: commentId,
    reason,
    details,
  });

  if (error) return { error: error.message };
  return { success: true };
}

// ============================================
// PROFILE ACTIONS
// ============================================

export async function updateProfile(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/auth/login");

  const displayName = formData.get("display_name") as string;
  const bio = formData.get("bio") as string;

  const { error } = await supabase
    .from("profiles")
    .update({
      display_name: displayName || null,
      bio: bio || null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", user.id);

  if (error) {
    return { error: error.message };
  }

  return { success: true };
}

// ============================================
// ADMIN ACTIONS
// ============================================

export async function adminUpdateProject(projectId: string, updates: Record<string, unknown>) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "Not authenticated" };

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "admin") return { error: "Not authorized" };

  const { error } = await supabase
    .from("projects")
    .update(updates)
    .eq("id", projectId);

  if (error) return { error: error.message };
  return { success: true };
}

export async function adminUpdateUser(userId: string, updates: Record<string, unknown>) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "Not authenticated" };

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "admin") return { error: "Not authorized" };

  const { error } = await supabase
    .from("profiles")
    .update(updates)
    .eq("id", userId);

  if (error) return { error: error.message };
  return { success: true };
}

export async function adminUpdateComment(commentId: string, updates: Record<string, unknown>) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "Not authenticated" };

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "admin") return { error: "Not authorized" };

  const { error } = await supabase
    .from("comments")
    .update(updates)
    .eq("id", commentId);

  if (error) return { error: error.message };
  return { success: true };
}

export async function adminResolveReport(reportId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "Not authenticated" };

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "admin") return { error: "Not authorized" };

  const { error } = await supabase
    .from("reports")
    .update({ is_resolved: true })
    .eq("id", reportId);

  if (error) return { error: error.message };
  return { success: true };
}

export async function adminUpdateSettings(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "Not authenticated" };

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "admin") return { error: "Not authorized" };

  const announcement = formData.get("announcement") as string;
  const submissionsOpen = formData.get("submissions_open") === "true";

  const { error } = await supabase
    .from("site_settings")
    .update({
      announcement: announcement || null,
      submissions_open: submissionsOpen,
      updated_at: new Date().toISOString(),
    })
    .eq(
      "id",
      (
        await supabase.from("site_settings").select("id").single()
      ).data?.id
    );

  if (error) return { error: error.message };
  return { success: true };
}

export async function adminUpdateCategory(
  categoryId: string,
  updates: Record<string, unknown>
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "Not authenticated" };

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "admin") return { error: "Not authorized" };

  const { error } = await supabase
    .from("categories")
    .update(updates)
    .eq("id", categoryId);

  if (error) return { error: error.message };
  return { success: true };
}

export async function adminCreateCategory(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "Not authenticated" };

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "admin") return { error: "Not authorized" };

  const name = formData.get("name") as string;
  const slug = slugify(name);
  const description = formData.get("description") as string;

  const { error } = await supabase.from("categories").insert({
    name,
    slug,
    description: description || null,
  });

  if (error) return { error: error.message };
  return { success: true };
}
