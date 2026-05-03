insert into public.departments (name)
values ('الإدارة العامة'), ('الموارد البشرية'), ('التشغيل')
on conflict (name) do nothing;

insert into public.work_locations (name, latitude, longitude, radius_meters, active)
values ('المقر الرئيسي', 26.3365875, 31.8908906, 150, true)
on conflict (name) do update set
  latitude = excluded.latitude,
  longitude = excluded.longitude,
  radius_meters = excluded.radius_meters,
  active = excluded.active;

insert into public.shifts (name, start_time, end_time, grace_minutes, active)
values ('الدوام الصباحي', '09:00', '17:00', 10, true)
on conflict do nothing;
