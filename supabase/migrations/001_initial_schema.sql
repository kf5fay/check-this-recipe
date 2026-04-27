-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- ============================================================
-- PROFILES (extends Supabase auth.users)
-- ============================================================
create table public.profiles (
  id uuid references auth.users(id) on delete cascade primary key,
  email text not null,
  display_name text not null default '',
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "Users can view all profiles" on public.profiles
  for select using (true);

create policy "Users can update own profile" on public.profiles
  for update using (auth.uid() = id);

create policy "Users can insert own profile" on public.profiles
  for insert with check (auth.uid() = id);

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public
as $$
begin
  insert into public.profiles (id, email, display_name)
  values (new.id, new.email, split_part(new.email, '@', 1));
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ============================================================
-- RECIPES
-- ============================================================
create table public.recipes (
  id uuid primary key default uuid_generate_v4(),
  owner_id uuid references public.profiles(id) on delete cascade not null,
  title text not null,
  description text,
  source_url text,
  source_type text not null default 'manual'
    check (source_type in ('web_url', 'instagram', 'tiktok', 'youtube', 'photo', 'manual')),
  original_image_url text,
  uploaded_image_path text,
  status text not null default 'draft'
    check (status in ('draft', 'complete')),
  servings integer not null default 2,
  prep_time_minutes integer,
  cook_time_minutes integer,
  ingredients jsonb not null default '[]'::jsonb,
  instructions jsonb not null default '[]'::jsonb,
  tags text[] not null default '{}',
  is_favorite boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.recipes enable row level security;

create policy "Users can view own recipes" on public.recipes
  for select using (auth.uid() = owner_id);

create policy "Users can insert own recipes" on public.recipes
  for insert with check (auth.uid() = owner_id);

create policy "Users can update own recipes" on public.recipes
  for update using (auth.uid() = owner_id);

create policy "Users can delete own recipes" on public.recipes
  for delete using (auth.uid() = owner_id);

create index recipes_owner_id_idx on public.recipes (owner_id);
create index recipes_status_idx on public.recipes (status);
create index recipes_tags_idx on public.recipes using gin (tags);

-- ============================================================
-- RECIPE NOTES
-- ============================================================
create table public.recipe_notes (
  id uuid primary key default uuid_generate_v4(),
  recipe_id uuid references public.recipes(id) on delete cascade not null,
  user_id uuid references public.profiles(id) on delete cascade not null,
  content text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.recipe_notes enable row level security;

create policy "Users can manage own notes" on public.recipe_notes
  for all using (auth.uid() = user_id);

-- ============================================================
-- FRIENDSHIPS
-- ============================================================
create table public.friendships (
  id uuid primary key default uuid_generate_v4(),
  requester_id uuid references public.profiles(id) on delete cascade not null,
  addressee_id uuid references public.profiles(id) on delete cascade not null,
  status text not null default 'pending'
    check (status in ('pending', 'accepted')),
  created_at timestamptz not null default now(),
  unique (requester_id, addressee_id)
);

alter table public.friendships enable row level security;

create policy "Users can view friendships involving them" on public.friendships
  for select using (auth.uid() = requester_id or auth.uid() = addressee_id);

create policy "Users can create friend requests" on public.friendships
  for insert with check (auth.uid() = requester_id);

create policy "Addressee can update friendship status" on public.friendships
  for update using (auth.uid() = addressee_id);

create policy "Either party can delete friendship" on public.friendships
  for delete using (auth.uid() = requester_id or auth.uid() = addressee_id);

-- ============================================================
-- SHARED RECIPES
-- ============================================================
create table public.shared_recipes (
  id uuid primary key default uuid_generate_v4(),
  recipe_id uuid references public.recipes(id) on delete cascade not null,
  sender_id uuid references public.profiles(id) on delete cascade not null,
  recipient_id uuid references public.profiles(id) on delete cascade not null,
  note text,
  created_at timestamptz not null default now()
);

alter table public.shared_recipes enable row level security;

create policy "Sender or recipient can view shared recipe" on public.shared_recipes
  for select using (auth.uid() = sender_id or auth.uid() = recipient_id);

create policy "Users can share recipes they own" on public.shared_recipes
  for insert with check (
    auth.uid() = sender_id
    and exists (select 1 from public.recipes where id = recipe_id and owner_id = auth.uid())
  );

create policy "Recipient can delete (dismiss)" on public.shared_recipes
  for delete using (auth.uid() = recipient_id);

-- ============================================================
-- COLLECTIONS
-- ============================================================
create table public.collections (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  owner_id uuid references public.profiles(id) on delete cascade not null,
  created_at timestamptz not null default now()
);

alter table public.collections enable row level security;

create table public.collection_members (
  collection_id uuid references public.collections(id) on delete cascade not null,
  user_id uuid references public.profiles(id) on delete cascade not null,
  joined_at timestamptz not null default now(),
  primary key (collection_id, user_id)
);

alter table public.collection_members enable row level security;

create table public.collection_recipes (
  collection_id uuid references public.collections(id) on delete cascade not null,
  recipe_id uuid references public.recipes(id) on delete cascade not null,
  added_by uuid references public.profiles(id) on delete set null,
  added_at timestamptz not null default now(),
  primary key (collection_id, recipe_id)
);

alter table public.collection_recipes enable row level security;

-- Collections are visible to members
create policy "Members can view collection" on public.collections
  for select using (
    auth.uid() = owner_id
    or exists (
      select 1 from public.collection_members
      where collection_id = id and user_id = auth.uid()
    )
  );

create policy "Owner can manage collection" on public.collections
  for all using (auth.uid() = owner_id);

create policy "Members can view collection_members" on public.collection_members
  for select using (
    exists (
      select 1 from public.collection_members cm
      where cm.collection_id = collection_id and cm.user_id = auth.uid()
    )
    or exists (
      select 1 from public.collections c
      where c.id = collection_id and c.owner_id = auth.uid()
    )
  );

create policy "Owner can manage collection_members" on public.collection_members
  for all using (
    exists (
      select 1 from public.collections c
      where c.id = collection_id and c.owner_id = auth.uid()
    )
  );

create policy "Members can view collection_recipes" on public.collection_recipes
  for select using (
    exists (
      select 1 from public.collection_members cm
      where cm.collection_id = collection_id and cm.user_id = auth.uid()
    )
    or exists (
      select 1 from public.collections c
      where c.id = collection_id and c.owner_id = auth.uid()
    )
  );

create policy "Members can add collection_recipes" on public.collection_recipes
  for insert with check (
    auth.uid() = added_by
    and (
      exists (
        select 1 from public.collection_members cm
        where cm.collection_id = collection_id and cm.user_id = auth.uid()
      )
      or exists (
        select 1 from public.collections c
        where c.id = collection_id and c.owner_id = auth.uid()
      )
    )
  );

-- ============================================================
-- MEAL PLAN
-- ============================================================
create table public.meal_plan_entries (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references public.profiles(id) on delete cascade not null,
  recipe_id uuid references public.recipes(id) on delete cascade not null,
  week_start date not null,
  day_of_week integer not null check (day_of_week between 1 and 7),
  meal_slot text check (meal_slot in ('breakfast', 'lunch', 'dinner')),
  servings integer not null default 2,
  created_at timestamptz not null default now()
);

alter table public.meal_plan_entries enable row level security;

create policy "Users manage own meal plan" on public.meal_plan_entries
  for all using (auth.uid() = user_id);

create index meal_plan_user_week_idx on public.meal_plan_entries (user_id, week_start);

-- ============================================================
-- NOTIFICATIONS
-- ============================================================
create table public.notifications (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references public.profiles(id) on delete cascade not null,
  type text not null check (type in ('friend_request', 'friend_accepted', 'recipe_shared', 'collection_recipe_added')),
  payload jsonb not null default '{}'::jsonb,
  read boolean not null default false,
  created_at timestamptz not null default now()
);

alter table public.notifications enable row level security;

create policy "Users manage own notifications" on public.notifications
  for all using (auth.uid() = user_id);

create index notifications_user_unread_idx on public.notifications (user_id, read);

-- ============================================================
-- UPDATED_AT trigger helper
-- ============================================================
create or replace function public.set_updated_at()
returns trigger language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger set_recipes_updated_at
  before update on public.recipes
  for each row execute procedure public.set_updated_at();

create trigger set_profiles_updated_at
  before update on public.profiles
  for each row execute procedure public.set_updated_at();

create trigger set_recipe_notes_updated_at
  before update on public.recipe_notes
  for each row execute procedure public.set_updated_at();
