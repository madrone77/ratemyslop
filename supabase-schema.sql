-- RateMySlop Database Schema
-- Run this in Supabase SQL Editor

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- ============================================
-- PROFILES
-- ============================================
create table public.profiles (
  id uuid references auth.users on delete cascade primary key,
  username text unique not null,
  display_name text,
  avatar_url text,
  bio text,
  role text not null default 'user' check (role in ('user', 'admin', 'moderator')),
  karma integer not null default 0,
  is_banned boolean not null default false,
  is_trusted boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, username, display_name, avatar_url)
  values (
    new.id,
    coalesce(
      new.raw_user_meta_data->>'user_name',
      new.raw_user_meta_data->>'preferred_username',
      'user_' || substr(new.id::text, 1, 8)
    ),
    coalesce(
      new.raw_user_meta_data->>'full_name',
      new.raw_user_meta_data->>'name'
    ),
    new.raw_user_meta_data->>'avatar_url'
  );
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ============================================
-- CATEGORIES
-- ============================================
create table public.categories (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  slug text unique not null,
  description text,
  sort_order integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

-- Seed default categories
insert into public.categories (name, slug, description, sort_order) values
  ('Apps', 'apps', 'Web apps, mobile apps, tools, and utilities', 1),
  ('Design', 'design', 'UI designs, logos, graphics, and visual work', 2),
  ('Media', 'media', 'Videos, music, audio, and multimedia content', 3);

-- ============================================
-- PROJECTS
-- ============================================
create table public.projects (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references public.profiles(id) on delete cascade not null,
  slug text unique not null,
  title text not null,
  description text not null,
  url text not null,
  category text not null default 'apps',
  ai_tools_used text[] not null default '{}',
  thumbnail_url text,
  status text not null default 'approved' check (status in ('pending', 'approved', 'removed')),
  is_featured boolean not null default false,
  score integer not null default 0,
  upvotes integer not null default 0,
  downvotes integer not null default 0,
  comment_count integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_projects_status on public.projects(status);
create index idx_projects_category on public.projects(category);
create index idx_projects_score on public.projects(score desc);
create index idx_projects_created_at on public.projects(created_at desc);
create index idx_projects_user_id on public.projects(user_id);
create index idx_projects_is_featured on public.projects(is_featured) where is_featured = true;

-- ============================================
-- PROJECT IMAGES
-- ============================================
create table public.project_images (
  id uuid primary key default uuid_generate_v4(),
  project_id uuid references public.projects(id) on delete cascade not null,
  url text not null,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

-- ============================================
-- VOTES
-- ============================================
create table public.votes (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references public.profiles(id) on delete cascade not null,
  project_id uuid references public.projects(id) on delete cascade not null,
  value integer not null check (value in (-1, 1)),
  created_at timestamptz not null default now(),
  unique(user_id, project_id)
);

create index idx_votes_project_id on public.votes(project_id);
create index idx_votes_user_id on public.votes(user_id);

-- Function to update project score on vote
create or replace function public.update_project_score()
returns trigger as $$
begin
  if TG_OP = 'DELETE' then
    update public.projects set
      upvotes = (select count(*) from public.votes where project_id = OLD.project_id and value = 1),
      downvotes = (select count(*) from public.votes where project_id = OLD.project_id and value = -1),
      score = (select coalesce(sum(value), 0) from public.votes where project_id = OLD.project_id)
    where id = OLD.project_id;
    -- Update karma
    update public.profiles set
      karma = (select coalesce(sum(v.value), 0) from public.votes v join public.projects p on v.project_id = p.id where p.user_id = OLD.user_id)
    where id = (select user_id from public.projects where id = OLD.project_id);
    return OLD;
  else
    update public.projects set
      upvotes = (select count(*) from public.votes where project_id = NEW.project_id and value = 1),
      downvotes = (select count(*) from public.votes where project_id = NEW.project_id and value = -1),
      score = (select coalesce(sum(value), 0) from public.votes where project_id = NEW.project_id)
    where id = NEW.project_id;
    -- Update karma for project owner
    update public.profiles set
      karma = (select coalesce(sum(v.value), 0) from public.votes v join public.projects p on v.project_id = p.id where p.user_id = profiles.id)
    where id = (select user_id from public.projects where id = NEW.project_id);
    return NEW;
  end if;
end;
$$ language plpgsql security definer;

create trigger on_vote_change
  after insert or update or delete on public.votes
  for each row execute procedure public.update_project_score();

-- ============================================
-- COMMENTS
-- ============================================
create table public.comments (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references public.profiles(id) on delete cascade not null,
  project_id uuid references public.projects(id) on delete cascade not null,
  parent_id uuid references public.comments(id) on delete cascade,
  body text not null,
  is_removed boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_comments_project_id on public.comments(project_id);
create index idx_comments_user_id on public.comments(user_id);
create index idx_comments_parent_id on public.comments(parent_id);

-- Update comment count on project
create or replace function public.update_comment_count()
returns trigger as $$
begin
  if TG_OP = 'DELETE' then
    update public.projects set comment_count = (
      select count(*) from public.comments where project_id = OLD.project_id and is_removed = false
    ) where id = OLD.project_id;
    return OLD;
  else
    update public.projects set comment_count = (
      select count(*) from public.comments where project_id = NEW.project_id and is_removed = false
    ) where id = NEW.project_id;
    return NEW;
  end if;
end;
$$ language plpgsql security definer;

create trigger on_comment_change
  after insert or update or delete on public.comments
  for each row execute procedure public.update_comment_count();

-- ============================================
-- REPORTS
-- ============================================
create table public.reports (
  id uuid primary key default uuid_generate_v4(),
  reporter_id uuid references public.profiles(id) on delete cascade not null,
  project_id uuid references public.projects(id) on delete cascade,
  comment_id uuid references public.comments(id) on delete cascade,
  reason text not null check (reason in ('spam', 'inappropriate', 'misleading', 'other')),
  details text,
  is_resolved boolean not null default false,
  created_at timestamptz not null default now(),
  check (project_id is not null or comment_id is not null)
);

create index idx_reports_unresolved on public.reports(is_resolved) where is_resolved = false;

-- Auto-hide content after 3 reports
create or replace function public.auto_hide_reported_content()
returns trigger as $$
declare
  report_count integer;
begin
  if NEW.project_id is not null then
    select count(*) into report_count from public.reports
    where project_id = NEW.project_id and is_resolved = false;
    if report_count >= 3 then
      update public.projects set status = 'removed' where id = NEW.project_id;
    end if;
  end if;
  if NEW.comment_id is not null then
    select count(*) into report_count from public.reports
    where comment_id = NEW.comment_id and is_resolved = false;
    if report_count >= 3 then
      update public.comments set is_removed = true where id = NEW.comment_id;
    end if;
  end if;
  return NEW;
end;
$$ language plpgsql security definer;

create trigger on_report_created
  after insert on public.reports
  for each row execute procedure public.auto_hide_reported_content();

-- ============================================
-- SITE SETTINGS
-- ============================================
create table public.site_settings (
  id uuid primary key default uuid_generate_v4(),
  announcement text,
  submissions_open boolean not null default true,
  updated_at timestamptz not null default now()
);

-- Seed default settings
insert into public.site_settings (announcement, submissions_open) values (null, true);

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================

-- Profiles
alter table public.profiles enable row level security;

create policy "Profiles are viewable by everyone"
  on public.profiles for select using (true);

create policy "Users can update own profile"
  on public.profiles for update using (auth.uid() = id);

-- Categories
alter table public.categories enable row level security;

create policy "Categories are viewable by everyone"
  on public.categories for select using (true);

-- Projects
alter table public.projects enable row level security;

create policy "Approved projects are viewable by everyone"
  on public.projects for select using (status = 'approved' or auth.uid() = user_id);

create policy "Authenticated users can insert projects"
  on public.projects for insert with check (auth.uid() = user_id);

create policy "Users can update own projects"
  on public.projects for update using (auth.uid() = user_id);

-- Project Images
alter table public.project_images enable row level security;

create policy "Project images are viewable by everyone"
  on public.project_images for select using (true);

create policy "Users can insert images for own projects"
  on public.project_images for insert with check (
    auth.uid() = (select user_id from public.projects where id = project_id)
  );

-- Votes
alter table public.votes enable row level security;

create policy "Votes are viewable by everyone"
  on public.votes for select using (true);

create policy "Authenticated users can vote"
  on public.votes for insert with check (auth.uid() = user_id);

create policy "Users can update own votes"
  on public.votes for update using (auth.uid() = user_id);

create policy "Users can delete own votes"
  on public.votes for delete using (auth.uid() = user_id);

-- Comments
alter table public.comments enable row level security;

create policy "Non-removed comments are viewable"
  on public.comments for select using (is_removed = false or auth.uid() = user_id);

create policy "Authenticated users can comment"
  on public.comments for insert with check (auth.uid() = user_id);

create policy "Users can update own comments"
  on public.comments for update using (auth.uid() = user_id);

-- Reports
alter table public.reports enable row level security;

create policy "Users can insert reports"
  on public.reports for insert with check (auth.uid() = reporter_id);

create policy "Users can view own reports"
  on public.reports for select using (auth.uid() = reporter_id);

-- Site Settings
alter table public.site_settings enable row level security;

create policy "Site settings are viewable by everyone"
  on public.site_settings for select using (true);

-- ============================================
-- STORAGE BUCKET
-- ============================================
insert into storage.buckets (id, name, public) values ('project-images', 'project-images', true);

create policy "Anyone can view project images"
  on storage.objects for select using (bucket_id = 'project-images');

create policy "Authenticated users can upload images"
  on storage.objects for insert with check (
    bucket_id = 'project-images' and auth.role() = 'authenticated'
  );

create policy "Users can delete own images"
  on storage.objects for delete using (
    bucket_id = 'project-images' and auth.uid()::text = (storage.foldername(name))[1]
  );
