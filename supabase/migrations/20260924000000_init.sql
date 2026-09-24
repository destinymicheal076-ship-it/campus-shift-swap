-- Campus Shift Swap: initial schema.
-- Scope follows plan.md (availability and emails are cut).

-- ---------------------------------------------------------------------------
-- Tables
-- ---------------------------------------------------------------------------

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text not null default '',
  created_at timestamptz not null default now()
);

create table public.workplaces (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  created_at timestamptz not null default now()
);

create table public.roles (
  id uuid primary key default gen_random_uuid(),
  workplace_id uuid not null references public.workplaces (id) on delete cascade,
  name text not null,
  unique (workplace_id, name)
);

create table public.memberships (
  user_id uuid not null references public.profiles (id) on delete cascade,
  workplace_id uuid not null references public.workplaces (id) on delete cascade,
  is_supervisor boolean not null default false,
  primary key (user_id, workplace_id)
);

create table public.user_roles (
  user_id uuid not null references public.profiles (id) on delete cascade,
  role_id uuid not null references public.roles (id) on delete cascade,
  primary key (user_id, role_id)
);

create table public.shifts (
  id uuid primary key default gen_random_uuid(),
  workplace_id uuid not null references public.workplaces (id) on delete cascade,
  role_id uuid not null references public.roles (id) on delete cascade,
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  assignee_id uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  check (ends_at > starts_at)
);

create index shifts_workplace_starts_idx on public.shifts (workplace_id, starts_at);
create index shifts_assignee_idx on public.shifts (assignee_id);

create type public.swap_status as enum ('open', 'pending', 'approved', 'denied', 'cancelled');

create table public.swap_requests (
  id uuid primary key default gen_random_uuid(),
  shift_id uuid not null references public.shifts (id) on delete cascade,
  requester_id uuid not null references public.profiles (id) on delete cascade,
  claimer_id uuid references public.profiles (id) on delete set null,
  status public.swap_status not null default 'open',
  note text,
  created_at timestamptz not null default now(),
  decided_at timestamptz
);

-- Rule from spec.md: only one active request per shift.
create unique index swap_requests_one_active_per_shift
  on public.swap_requests (shift_id)
  where status in ('open', 'pending');

-- ---------------------------------------------------------------------------
-- New users get a profile row
-- ---------------------------------------------------------------------------

create function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'full_name', ''));
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------------
-- RLS helpers. security definer so policies can check memberships
-- without memberships' own policy calling itself.
-- ---------------------------------------------------------------------------

create function public.is_member(wp uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.memberships
    where user_id = auth.uid() and workplace_id = wp
  );
$$;

create function public.is_supervisor(wp uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.memberships
    where user_id = auth.uid() and workplace_id = wp and is_supervisor
  );
$$;

create function public.shares_workplace(other uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.memberships mine
    join public.memberships theirs on theirs.workplace_id = mine.workplace_id
    where mine.user_id = auth.uid() and theirs.user_id = other
  );
$$;

create function public.shift_workplace(shift uuid)
returns uuid
language sql
stable
security definer
set search_path = ''
as $$
  select workplace_id from public.shifts where id = shift;
$$;

create function public.role_workplace(role uuid)
returns uuid
language sql
stable
security definer
set search_path = ''
as $$
  select workplace_id from public.roles where id = role;
$$;

-- ---------------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------------

alter table public.profiles enable row level security;
alter table public.workplaces enable row level security;
alter table public.roles enable row level security;
alter table public.memberships enable row level security;
alter table public.user_roles enable row level security;
alter table public.shifts enable row level security;
alter table public.swap_requests enable row level security;

-- profiles: see yourself and coworkers; edit only yourself.
create policy "profiles: read self and coworkers" on public.profiles
  for select to authenticated
  using (id = auth.uid() or public.shares_workplace(id));

create policy "profiles: update self" on public.profiles
  for update to authenticated
  using (id = auth.uid())
  with check (id = auth.uid());

-- workplaces, memberships: members read. Writes happen through the seed script
-- (service role) since the workplace-management screens were cut.
create policy "workplaces: members read" on public.workplaces
  for select to authenticated
  using (public.is_member(id));

create policy "memberships: members read" on public.memberships
  for select to authenticated
  using (public.is_member(workplace_id));

-- roles, user_roles: members read.
create policy "roles: members read" on public.roles
  for select to authenticated
  using (public.is_member(workplace_id));

create policy "user_roles: members read" on public.user_roles
  for select to authenticated
  using (public.is_member(public.role_workplace(role_id)));

-- shifts: members read; supervisors create, change and delete.
create policy "shifts: members read" on public.shifts
  for select to authenticated
  using (public.is_member(workplace_id));

create policy "shifts: supervisors insert" on public.shifts
  for insert to authenticated
  with check (public.is_supervisor(workplace_id));

create policy "shifts: supervisors update" on public.shifts
  for update to authenticated
  using (public.is_supervisor(workplace_id))
  with check (public.is_supervisor(workplace_id));

create policy "shifts: supervisors delete" on public.shifts
  for delete to authenticated
  using (public.is_supervisor(workplace_id));

-- swap_requests: members read; a student can only request cover for their own
-- shift; supervisors approve or deny. Claim and cancel will be added as
-- security definer functions with the swap flow (weeks 4-5), so they can
-- enforce the overlap rule.
create policy "swap_requests: members read" on public.swap_requests
  for select to authenticated
  using (public.is_member(public.shift_workplace(shift_id)));

create policy "swap_requests: request cover for own shift" on public.swap_requests
  for insert to authenticated
  with check (
    requester_id = auth.uid()
    and status = 'open'
    and claimer_id is null
    and exists (
      select 1 from public.shifts s
      where s.id = shift_id and s.assignee_id = auth.uid()
    )
  );

create policy "swap_requests: supervisors decide" on public.swap_requests
  for update to authenticated
  using (public.is_supervisor(public.shift_workplace(shift_id)))
  with check (public.is_supervisor(public.shift_workplace(shift_id)));
