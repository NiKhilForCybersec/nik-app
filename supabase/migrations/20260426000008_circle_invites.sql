-- Nik — multi-tenant family circle invites.
--
-- Today's circle.add only writes a row in the OWNER's circle_members
-- table — the invitee never knows. This migration adds the invite
-- ledger so two real Supabase users can join each other's circle:
--   1. Owner creates an invite → gets back a long random `token`
--      and a friendly 6-digit `code`. Token goes in a QR; code is
--      readable over voice/SMS.
--   2. Invitee opens app, taps "Join circle", scans QR or types code.
--   3. circle.acceptInvite() validates expiry/uses, then inserts
--      reciprocal rows in BOTH circle_members tables and marks the
--      invite as accepted.
--
-- Privacy: each side independently controls what categories they
-- share with the other (default 'family' tier). Either side can
-- circle.remove the connection on their own copy.

set check_function_bodies = off;

create table if not exists public.circle_invites (
  id uuid primary key default gen_random_uuid(),
  -- Who created the invite. RLS scopes select/update to this user.
  owner_user_id uuid not null references auth.users(id) on delete cascade,
  -- Long random token for QR / deep-link. URL-safe.
  token text not null unique check (length(token) between 16 and 64),
  -- Short human-readable code (6 digits). Scoped unique while active.
  code text not null check (length(code) = 6),
  -- Optional human-readable label the inviter sets ("Mom", "Roommate").
  -- The invitee uses this when they accept so the owner sees a name.
  label text not null default '' check (length(label) <= 80),
  -- Default trust tier the invitee will land at on acceptance.
  default_share_tier text not null default 'family' check (default_share_tier in ('inner','family','kid','caregiver','custom')),
  -- Lifetime caps.
  expires_at timestamptz not null default (now() + interval '7 days'),
  max_uses int not null default 1 check (max_uses > 0),
  used_count int not null default 0 check (used_count >= 0),
  -- Last accepter (for the simple max_uses=1 case this is the only one).
  accepted_by_user_id uuid references auth.users(id) on delete set null,
  accepted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Code uniqueness only matters for in-flight invites. Once an invite
-- is consumed/expired we can let the same 6-digit code be reissued.
create unique index if not exists circle_invites_active_code_uq
  on public.circle_invites (code)
  where used_count < max_uses and expires_at > now();

create index if not exists circle_invites_owner_idx
  on public.circle_invites (owner_user_id, created_at desc);

alter table public.circle_invites enable row level security;

-- Owner can manage their own invites. Anyone signed in can SELECT
-- by token (for the accept flow); the handler validates expiry +
-- uses before doing anything else.
drop policy if exists "invites: owner select" on public.circle_invites;
drop policy if exists "invites: owner insert" on public.circle_invites;
drop policy if exists "invites: owner update" on public.circle_invites;
drop policy if exists "invites: owner delete" on public.circle_invites;
drop policy if exists "invites: anyone select for accept" on public.circle_invites;
create policy "invites: owner select"        on public.circle_invites for select using (owner_user_id = auth.uid());
create policy "invites: owner insert"        on public.circle_invites for insert with check (owner_user_id = auth.uid());
create policy "invites: owner update"        on public.circle_invites for update using (owner_user_id = auth.uid());
create policy "invites: owner delete"        on public.circle_invites for delete using (owner_user_id = auth.uid());
-- Invitee needs to read the row to accept it. They look it up by
-- token (or code). Only return non-expired, non-consumed rows.
create policy "invites: anyone select for accept"
  on public.circle_invites for select
  using (auth.uid() is not null and expires_at > now() and used_count < max_uses);

drop trigger if exists touch_circle_invites_updated_at on public.circle_invites;
create trigger touch_circle_invites_updated_at
  before update on public.circle_invites
  for each row execute function public.touch_updated_at();

-- ── RPC: accept_circle_invite ─────────────────────────────────
--
-- Validates the invite + inserts reciprocal circle_members rows in a
-- single transaction. Lives as an RPC because it crosses two users'
-- private rows — the contract handler can't write into the inviter's
-- circle_members under RLS without service-role.
--
-- Returns: { invite_id, owner_user_id, owner_name, member_member_id }
create or replace function public.accept_circle_invite(
  in_token text default null,
  in_code text default null,
  in_invitee_label text default null
) returns json
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  v_invite circle_invites;
  v_invitee_id uuid := auth.uid();
  v_invitee_name text;
  v_owner_name text;
  v_invitee_label text;
  v_owner_label text;
  v_invitee_member_id text;
  v_owner_member_id text;
begin
  if v_invitee_id is null then raise exception 'Not signed in'; end if;
  if in_token is null and in_code is null then raise exception 'Need token or code'; end if;

  -- Lock the row.
  if in_token is not null then
    select * into v_invite from circle_invites
      where token = in_token
      for update;
  else
    select * into v_invite from circle_invites
      where code = in_code and expires_at > now() and used_count < max_uses
      order by created_at desc
      limit 1
      for update;
  end if;

  if v_invite.id is null then raise exception 'Invite not found or expired'; end if;
  if v_invite.expires_at <= now() then raise exception 'Invite expired'; end if;
  if v_invite.used_count >= v_invite.max_uses then raise exception 'Invite already used'; end if;
  if v_invite.owner_user_id = v_invitee_id then raise exception 'Cannot accept your own invite'; end if;

  -- Resolve display names from profiles (fall back to email prefix).
  select coalesce(nullif(p.name, ''), split_part(u.email, '@', 1), 'Friend')
    into v_owner_name
    from profiles p join auth.users u on u.id = p.id
    where p.id = v_invite.owner_user_id;
  select coalesce(nullif(p.name, ''), split_part(u.email, '@', 1), 'Friend')
    into v_invitee_name
    from profiles p join auth.users u on u.id = p.id
    where p.id = v_invitee_id;

  v_invitee_label := coalesce(nullif(in_invitee_label, ''), v_invite.label, v_invitee_name);
  v_owner_label := v_owner_name;

  -- Generate stable member_id slugs for each side. Use the other user's
  -- id (first 8 chars) so they're unique and don't collide with 'self'.
  v_invitee_member_id := 'u_' || replace(substr(v_invite.owner_user_id::text, 1, 8), '-', '');
  v_owner_member_id   := 'u_' || replace(substr(v_invitee_id::text, 1, 8), '-', '');

  -- Owner's circle gets the invitee.
  insert into circle_members (
    user_id, member_id, name, role, relation, hue, is_self, status,
    share_tier, custom_cats, profile, care_recipient
  ) values (
    v_invite.owner_user_id, v_owner_member_id, v_invitee_label, '',
    'family', 220, false, 'offline',
    v_invite.default_share_tier, '{}'::jsonb, '{}'::jsonb, false
  )
  on conflict do nothing;

  -- Invitee's circle gets the owner.
  insert into circle_members (
    user_id, member_id, name, role, relation, hue, is_self, status,
    share_tier, custom_cats, profile, care_recipient
  ) values (
    v_invitee_id, v_invitee_member_id, v_owner_label, '',
    'family', 320, false, 'offline',
    v_invite.default_share_tier, '{}'::jsonb, '{}'::jsonb, false
  )
  on conflict do nothing;

  update circle_invites
    set used_count = used_count + 1,
        accepted_by_user_id = v_invitee_id,
        accepted_at = now()
    where id = v_invite.id;

  return json_build_object(
    'invite_id', v_invite.id,
    'owner_user_id', v_invite.owner_user_id,
    'owner_name', v_owner_name,
    'member_member_id', v_invitee_member_id
  );
end $$;

grant execute on function public.accept_circle_invite(text, text, text) to authenticated;
