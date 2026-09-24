-- Swap flow: claim, cancel, approve and deny.
-- These run as security definer functions so the rules that span rows
-- (same role, no overlapping shift, one claimer, supervisor only) are
-- enforced by the database, not just the UI. Errors are raised with
-- plain-language messages that the app shows as-is.

-- A student's shifts that overlap [starts, ends), ignoring one shift.
create function public.has_overlapping_shift(
  who uuid, starts timestamptz, ends timestamptz, ignore_shift uuid default null
)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.shifts
    where assignee_id = who
      and starts_at < ends
      and ends_at > starts
      and id is distinct from ignore_shift
  );
$$;

-- A coworker claims an open request.
create function public.claim_shift(request uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  r public.swap_requests;
  s public.shifts;
begin
  -- Lock the request so two people claiming at once can't both win.
  select * into r from public.swap_requests where id = request for update;
  if not found then
    raise exception 'That request no longer exists.';
  end if;
  select * into s from public.shifts where id = r.shift_id;

  if r.status <> 'open' then
    raise exception 'Someone already claimed this shift.';
  end if;
  if s.starts_at <= now() then
    raise exception 'This shift has already started.';
  end if;
  if r.requester_id = auth.uid() then
    raise exception 'You can''t claim your own shift.';
  end if;
  if not public.is_member(s.workplace_id) then
    raise exception 'You''re not part of this workplace.';
  end if;
  if not exists (
    select 1 from public.user_roles where user_id = auth.uid() and role_id = s.role_id
  ) then
    raise exception 'This shift needs someone with a different role.';
  end if;
  if public.has_overlapping_shift(auth.uid(), s.starts_at, s.ends_at) then
    raise exception 'You already have a shift at that time.';
  end if;

  update public.swap_requests
  set claimer_id = auth.uid(), status = 'pending'
  where id = request;
end;
$$;

-- The student who asked takes the request back.
create function public.cancel_request(request uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  r public.swap_requests;
begin
  select * into r from public.swap_requests where id = request for update;
  if not found or r.requester_id <> auth.uid() then
    raise exception 'You can only cancel your own request.';
  end if;
  if r.status not in ('open', 'pending') then
    raise exception 'This request is already closed.';
  end if;

  update public.swap_requests
  set status = 'cancelled', decided_at = now()
  where id = request;
end;
$$;

-- The supervisor approves (the shift moves to the claimer) or denies
-- (the shift goes back to needing cover, keeping the denied request as history).
create function public.decide_request(request uuid, approve boolean)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  r public.swap_requests;
  s public.shifts;
begin
  select * into r from public.swap_requests where id = request for update;
  if not found then
    raise exception 'That request no longer exists.';
  end if;
  select * into s from public.shifts where id = r.shift_id for update;

  if not public.is_supervisor(s.workplace_id) then
    raise exception 'Only a supervisor can approve or deny swaps.';
  end if;
  if r.status <> 'pending' then
    raise exception 'This swap isn''t waiting for approval anymore.';
  end if;

  if approve then
    if public.has_overlapping_shift(r.claimer_id, s.starts_at, s.ends_at, s.id) then
      raise exception 'The claimer now has another shift at that time. Deny this swap instead.';
    end if;
    update public.shifts set assignee_id = r.claimer_id where id = s.id;
    update public.swap_requests
    set status = 'approved', decided_at = now()
    where id = request;
  else
    update public.swap_requests
    set status = 'denied', decided_at = now()
    where id = request;
    -- Spec: a denied shift goes back to Open.
    if s.starts_at > now() then
      insert into public.swap_requests (shift_id, requester_id, note)
      values (r.shift_id, r.requester_id, r.note);
    end if;
  end if;
end;
$$;

-- Requests are only for future shifts.
drop policy "swap_requests: request cover for own shift" on public.swap_requests;
create policy "swap_requests: request cover for own shift" on public.swap_requests
  for insert to authenticated
  with check (
    requester_id = auth.uid()
    and status = 'open'
    and claimer_id is null
    and exists (
      select 1 from public.shifts s
      where s.id = shift_id and s.assignee_id = auth.uid() and s.starts_at > now()
    )
  );

-- Supervisors decide through decide_request(), so direct updates aren't needed.
drop policy "swap_requests: supervisors decide" on public.swap_requests;

-- Only logged-in users can call these.
revoke execute on function public.has_overlapping_shift(uuid, timestamptz, timestamptz, uuid) from public, anon;
revoke execute on function public.claim_shift(uuid) from public, anon;
revoke execute on function public.cancel_request(uuid) from public, anon;
revoke execute on function public.decide_request(uuid, boolean) from public, anon;
grant execute on function public.has_overlapping_shift(uuid, timestamptz, timestamptz, uuid) to authenticated;
grant execute on function public.claim_shift(uuid) to authenticated;
grant execute on function public.cancel_request(uuid) to authenticated;
grant execute on function public.decide_request(uuid, boolean) to authenticated;
