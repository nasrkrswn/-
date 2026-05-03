create extension if not exists pgcrypto;

do $$
begin
  create type public.user_role as enum ('employee', 'supervisor', 'manager', 'admin');
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create type public.attendance_status as enum ('present', 'late', 'absent', 'leave', 'early_leave', 'incomplete');
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create type public.attendance_request_type as enum ('absence', 'leave', 'correction');
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create type public.attendance_request_status as enum ('pending', 'approved', 'rejected');
exception
  when duplicate_object then null;
end $$;

create table if not exists public.departments (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  manager_id uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz
);

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  email text,
  role public.user_role not null default 'employee',
  department_id uuid references public.departments(id) on delete set null,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz
);

do $$
begin
  alter table public.departments
    add constraint departments_manager_id_fkey
    foreign key (manager_id) references public.profiles(id) on delete set null;
exception
  when duplicate_object then null;
end $$;

create table if not exists public.work_locations (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  latitude numeric(10, 7) not null,
  longitude numeric(10, 7) not null,
  radius_meters integer not null default 150 check (radius_meters > 0),
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz
);

create table if not exists public.shifts (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  start_time time not null,
  end_time time not null,
  grace_minutes integer not null default 10 check (grace_minutes >= 0),
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz
);

create table if not exists public.public_holidays (
  id uuid primary key default gen_random_uuid(),
  holiday_date date not null unique,
  name text not null,
  description text,
  is_weekend_override boolean not null default false,
  year integer generated always as (extract(year from holiday_date)::integer) stored,
  created_at timestamptz not null default now(),
  updated_at timestamptz
);

create table if not exists public.weekend_config (
  id uuid primary key default gen_random_uuid(),
  location_id uuid references public.work_locations(id) on delete cascade,
  day_of_week integer not null check (day_of_week between 0 and 6),
  is_weekend boolean not null default false,
  description text,
  created_at timestamptz not null default now(),
  updated_at timestamptz,
  unique(location_id, day_of_week)
);

create table if not exists public.attendance_rules_config (
  id uuid primary key default gen_random_uuid(),
  
  -- قاعدة التأخير
  calculate_late_immediately boolean not null default true,
  late_penalty_type text,
  late_penalty_value numeric,
  
  -- تسجيل الانصراف
  require_checkout_within_location boolean not null default true,
  
  -- الحضور المتعدد
  allow_multiple_checkins_per_day boolean not null default true,
  
  -- تصحيح الحضور
  correction_requires_approval boolean not null default true,
  correction_approval_roles text[] default array['manager', 'admin'],
  correction_expiration_days integer not null default 7,
  
  -- العطلات
  exclude_weekends_from_reports boolean not null default true,
  exclude_holidays_from_reports boolean not null default true,
  
  created_at timestamptz not null default now(),
  updated_at timestamptz
);

alter table public.attendance_rules_config
  alter column correction_approval_roles set default array['manager', 'admin']::text[];

update public.attendance_rules_config
set correction_approval_roles = array['manager', 'admin']::text[]
where correction_approval_roles @> array['supervisor']::text[];

create table if not exists public.attendance_records (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  work_location_id uuid references public.work_locations(id) on delete set null,
  shift_id uuid references public.shifts(id) on delete set null,
  check_in_time timestamptz not null default now(),
  check_out_time timestamptz,
  check_in_latitude numeric(10, 7),
  check_in_longitude numeric(10, 7),
  check_out_latitude numeric(10, 7),
  check_out_longitude numeric(10, 7),
  status public.attendance_status not null default 'present',
  
  -- معلومات التصحيح
  is_corrected boolean not null default false,
  correction_request_id uuid,
  original_status public.attendance_status,
  corrected_by uuid references public.profiles(id) on delete set null,
  corrected_at timestamptz,
  
  -- ملاحظات
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz,
  
  constraint attendance_checkout_after_checkin check (
    check_out_time is null or check_out_time >= check_in_time
  )
);

create table if not exists public.attendance_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  request_type public.attendance_request_type not null,
  target_date date not null,
  reason text not null,
  status public.attendance_request_status not null default 'pending',
  
  -- معلومات الموافقة
  reviewed_by uuid references public.profiles(id) on delete set null,
  reviewed_at timestamptz,
  review_notes text,
  
  -- للطلبات التصحيحية
  old_status public.attendance_status,
  new_status public.attendance_status,
  supporting_documents text[],
  
  -- تتبع التغييرات
  created_at timestamptz not null default now(),
  updated_at timestamptz,
  
  constraint correction_needs_status_change check (
    request_type != 'correction' or (old_status is not null and new_status is not null)
  )
);

do $$
begin
  alter table public.attendance_records
    add constraint attendance_records_correction_request_id_fkey
    foreign key (correction_request_id) references public.attendance_requests(id) on delete set null;
exception
  when duplicate_object then null;
end $$;

create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  title text not null,
  body text not null,
  read_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists profiles_department_id_idx on public.profiles(department_id);
create unique index if not exists work_locations_name_key on public.work_locations(name);
create unique index if not exists shifts_name_key on public.shifts(name);
create index if not exists attendance_records_user_time_idx on public.attendance_records(user_id, check_in_time desc);
create index if not exists attendance_records_location_idx on public.attendance_records(work_location_id);
create index if not exists attendance_records_status_idx on public.attendance_records(status);
create index if not exists attendance_requests_user_idx on public.attendance_requests(user_id);
create index if not exists attendance_requests_status_idx on public.attendance_requests(status);
create index if not exists notifications_user_read_idx on public.notifications(user_id, read_at);
create index if not exists public_holidays_year_idx on public.public_holidays(year);
create index if not exists public_holidays_date_idx on public.public_holidays(holiday_date);
create index if not exists attendance_records_corrected_idx on public.attendance_records(is_corrected, created_at);
create index if not exists attendance_requests_type_status_idx on public.attendance_requests(request_type, status);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_departments_updated_at on public.departments;
create trigger set_departments_updated_at
before update on public.departments
for each row execute function public.set_updated_at();

drop trigger if exists set_profiles_updated_at on public.profiles;
create trigger set_profiles_updated_at
before update on public.profiles
for each row execute function public.set_updated_at();

drop trigger if exists set_work_locations_updated_at on public.work_locations;
create trigger set_work_locations_updated_at
before update on public.work_locations
for each row execute function public.set_updated_at();

drop trigger if exists set_shifts_updated_at on public.shifts;
create trigger set_shifts_updated_at
before update on public.shifts
for each row execute function public.set_updated_at();

drop trigger if exists set_attendance_records_updated_at on public.attendance_records;
create trigger set_attendance_records_updated_at
before update on public.attendance_records
for each row execute function public.set_updated_at();

drop trigger if exists set_attendance_requests_updated_at on public.attendance_requests;
create trigger set_attendance_requests_updated_at
before update on public.attendance_requests
for each row execute function public.set_updated_at();

drop trigger if exists set_public_holidays_updated_at on public.public_holidays;
create trigger set_public_holidays_updated_at
before update on public.public_holidays
for each row execute function public.set_updated_at();

drop trigger if exists set_weekend_config_updated_at on public.weekend_config;
create trigger set_weekend_config_updated_at
before update on public.weekend_config
for each row execute function public.set_updated_at();

drop trigger if exists set_attendance_rules_config_updated_at on public.attendance_rules_config;
create trigger set_attendance_rules_config_updated_at
before update on public.attendance_rules_config
for each row execute function public.set_updated_at();

create or replace function public.current_user_role()
returns public.user_role
language sql
stable
security definer
set search_path = public
as $$
  select role from public.profiles where id = auth.uid()
$$;

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(public.current_user_role() in ('manager', 'admin'), false)
$$;

create or replace function public.can_manage_profile(target_user_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(public.is_admin(), false)
$$;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, email)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', split_part(new.email, '@', 1)),
    new.email
  )
  on conflict (id) do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

insert into public.profiles (id, full_name, email)
select
  id,
  coalesce(raw_user_meta_data ->> 'full_name', split_part(email, '@', 1)),
  email
from auth.users
on conflict (id) do update set
  full_name = coalesce(public.profiles.full_name, excluded.full_name),
  email = excluded.email;

-- دوال مساعدة للتحقق من القواعس والتنفيذ
create or replace function public.is_holiday(check_date date)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists(
    select 1 from public_holidays where holiday_date = check_date
  )
$$;

create or replace function public.is_weekend(check_date date, target_location_id uuid default null)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    case 
      when target_location_id is not null then
        exists(
          select 1 from weekend_config wc
          where wc.location_id = target_location_id
            and is_weekend = true 
            and day_of_week = extract(dow from check_date)::int
        )
      else
        extract(dow from check_date)::int in (5, 6)  -- الجمعة والسبت
    end,
    false
  )
$$;

create or replace function public.can_approve_correction(user_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    exists(
      select 1 from profiles 
      where id = user_id 
        and role = any(array['manager', 'admin']::public.user_role[])
    ),
    false
  )
$$;

create or replace function public.get_attendance_rules()
returns jsonb
language sql
stable
security definer
set search_path = public
as $$
  select jsonb_build_object(
    'calculate_late_immediately', calculate_late_immediately,
    'require_checkout_within_location', require_checkout_within_location,
    'allow_multiple_checkins_per_day', allow_multiple_checkins_per_day,
    'correction_requires_approval', correction_requires_approval,
    'exclude_weekends', exclude_weekends_from_reports,
    'exclude_holidays', exclude_holidays_from_reports
  ) from attendance_rules_config
  order by created_at desc
  limit 1
$$;

-- دالة للتحقق من الخروج داخل الموقع
create or replace function public.is_within_location(
  latitude numeric,
  longitude numeric,
  location_id uuid
)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists(
    select 1 from work_locations wl
    where wl.id = location_id
      and (
        6371000 * 2 * asin(
          sqrt(
            power(sin(radians((wl.latitude::double precision - latitude::double precision) / 2)), 2)
            + cos(radians(latitude::double precision))
            * cos(radians(wl.latitude::double precision))
            * power(sin(radians((wl.longitude::double precision - longitude::double precision) / 2)), 2)
          )
        )
      ) <= wl.radius_meters
  )
$$;

-- تهيئة قواعس الحضور الافتراضية
insert into public.attendance_rules_config (
  calculate_late_immediately,
  require_checkout_within_location,
  allow_multiple_checkins_per_day,
  correction_requires_approval,
  exclude_weekends_from_reports,
  exclude_holidays_from_reports
) select
  true,  -- نعم
  true,  -- لا (يعني يجب أن يكون داخل الموقع)
  true,  -- أكثر من مرة
  true,  -- نعم
  true,  -- نعم
  true   -- نعم
where not exists (select 1 from public.attendance_rules_config);

create or replace function public.prevent_self_privilege_escalation()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() = old.id and not public.is_admin() then
    if new.role is distinct from old.role
      or new.department_id is distinct from old.department_id
      or new.active is distinct from old.active
    then
      raise exception 'Profile role, department, and active state can only be changed by admins';
    end if;
  end if;

  return new;
end;
$$;

drop trigger if exists prevent_self_privilege_escalation on public.profiles;
create trigger prevent_self_privilege_escalation
before update on public.profiles
for each row execute function public.prevent_self_privilege_escalation();

alter table public.profiles enable row level security;
alter table public.departments enable row level security;
alter table public.work_locations enable row level security;
alter table public.shifts enable row level security;
alter table public.attendance_records enable row level security;
alter table public.attendance_requests enable row level security;
alter table public.notifications enable row level security;

grant usage on schema public to anon, authenticated, service_role;
grant select, insert, update, delete on all tables in schema public to authenticated, service_role;
grant select on table public.departments to anon;
grant select on table public.work_locations to anon;
grant select on table public.shifts to anon;
grant execute on all functions in schema public to authenticated, service_role;

drop policy if exists "profiles_select_scoped" on public.profiles;
create policy "profiles_select_scoped"
on public.profiles for select
to authenticated
using (id = auth.uid() or public.can_manage_profile(id));

drop policy if exists "profiles_update_self" on public.profiles;
create policy "profiles_update_self"
on public.profiles for update
to authenticated
using (id = auth.uid())
with check (id = auth.uid());

drop policy if exists "profiles_admin_all" on public.profiles;
create policy "profiles_admin_all"
on public.profiles for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "departments_select_authenticated" on public.departments;
create policy "departments_select_authenticated"
on public.departments for select
to authenticated
using (true);

drop policy if exists "departments_admin_all" on public.departments;
create policy "departments_admin_all"
on public.departments for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "work_locations_select_active" on public.work_locations;
create policy "work_locations_select_active"
on public.work_locations for select
to authenticated
using (active = true or public.is_admin());

drop policy if exists "work_locations_admin_all" on public.work_locations;
create policy "work_locations_admin_all"
on public.work_locations for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "shifts_select_active" on public.shifts;
create policy "shifts_select_active"
on public.shifts for select
to authenticated
using (active = true or public.is_admin());

drop policy if exists "shifts_admin_all" on public.shifts;
create policy "shifts_admin_all"
on public.shifts for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "attendance_select_scoped" on public.attendance_records;
create policy "attendance_select_scoped"
on public.attendance_records for select
to authenticated
using (user_id = auth.uid() or public.can_manage_profile(user_id));

drop policy if exists "attendance_insert_self" on public.attendance_records;
create policy "attendance_insert_self"
on public.attendance_records for insert
to authenticated
with check (user_id = auth.uid());

drop policy if exists "attendance_update_scoped" on public.attendance_records;
create policy "attendance_update_scoped"
on public.attendance_records for update
to authenticated
using (user_id = auth.uid() or public.can_manage_profile(user_id))
with check (user_id = auth.uid() or public.can_manage_profile(user_id));

drop policy if exists "attendance_requests_select_scoped" on public.attendance_requests;
create policy "attendance_requests_select_scoped"
on public.attendance_requests for select
to authenticated
using (user_id = auth.uid() or public.can_manage_profile(user_id));

drop policy if exists "attendance_requests_insert_self" on public.attendance_requests;
create policy "attendance_requests_insert_self"
on public.attendance_requests for insert
to authenticated
with check (user_id = auth.uid() and status = 'pending');

drop policy if exists "attendance_requests_update_scoped" on public.attendance_requests;
create policy "attendance_requests_update_scoped"
on public.attendance_requests for update
to authenticated
using (
  (user_id = auth.uid() and status = 'pending')
  or public.can_manage_profile(user_id)
)
with check (
  (user_id = auth.uid() and status = 'pending')
  or public.can_manage_profile(user_id)
);

drop policy if exists "notifications_select_self" on public.notifications;
create policy "notifications_select_self"
on public.notifications for select
to authenticated
using (user_id = auth.uid());

drop policy if exists "notifications_update_self" on public.notifications;
create policy "notifications_update_self"
on public.notifications for update
to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());

drop policy if exists "notifications_admin_insert" on public.notifications;
create policy "notifications_admin_insert"
on public.notifications for insert
to authenticated
with check (public.is_admin() or public.can_manage_profile(user_id));

notify pgrst, 'reload schema';
