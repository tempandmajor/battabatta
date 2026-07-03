-- Local development seed data. Never run against production.
-- Creates confirmed auth users (password: password123) so the full app,
-- including login and RLS-protected flows, works locally and in e2e tests.

-- 1. Auth users ---------------------------------------------------------------

insert into auth.users (
  instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
  confirmation_token, recovery_token, email_change, email_change_token_new
)
values
  ('00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000001', 'authenticated', 'authenticated', 'jordan@example.com', extensions.crypt('password123', extensions.gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{"full_name":"Jordan Tran"}', now(), now(), '', '', '', ''),
  ('00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000002', 'authenticated', 'authenticated', 'sam@example.com', extensions.crypt('password123', extensions.gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{"full_name":"Sam Okafor"}', now(), now(), '', '', '', ''),
  ('00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000003', 'authenticated', 'authenticated', 'maya@example.com', extensions.crypt('password123', extensions.gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{"full_name":"Maya Lindqvist"}', now(), now(), '', '', '', ''),
  ('00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000004', 'authenticated', 'authenticated', 'dev@example.com', extensions.crypt('password123', extensions.gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{"full_name":"Dev Patel"}', now(), now(), '', '', '', ''),
  ('00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000005', 'authenticated', 'authenticated', 'rosa@example.com', extensions.crypt('password123', extensions.gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{"full_name":"Rosa Delgado"}', now(), now(), '', '', '', '')
on conflict (id) do nothing;

insert into auth.identities (id, user_id, provider_id, identity_data, provider, last_sign_in_at, created_at, updated_at)
select gen_random_uuid(), u.id, u.id::text,
  jsonb_build_object('sub', u.id::text, 'email', u.email, 'email_verified', true),
  'email', now(), now(), now()
from auth.users u
where u.id in (
  '00000000-0000-0000-0000-000000000001',
  '00000000-0000-0000-0000-000000000002',
  '00000000-0000-0000-0000-000000000003',
  '00000000-0000-0000-0000-000000000004',
  '00000000-0000-0000-0000-000000000005'
)
on conflict do nothing;

-- 2. Profiles (rows created by the handle_new_user trigger; fill them in) ------

update public.profiles set
  display_name = 'Jordan Tran', handle = 'jordan',
  bio = 'Photography teacher and repair tinkerer. I trade portrait sessions, camera basics, and small household fixes.',
  public_location_label = 'Near Queen Anne, Seattle', location_mode = 'local_and_online',
  is_adult_confirmed = true
where id = '00000000-0000-0000-0000-000000000001';

update public.profiles set
  display_name = 'Sam Okafor', handle = 'sam',
  bio = 'Woodworker and weekend baker. I trade handmade furniture repairs and sourdough starters for garden produce, bike maintenance, or help on moving day.',
  public_location_label = 'Near Ballard, Seattle', location_mode = 'local_and_online',
  is_adult_confirmed = true
where id = '00000000-0000-0000-0000-000000000002';

update public.profiles set
  display_name = 'Maya Lindqvist', handle = 'maya',
  bio = 'Illustrator and printmaker. Trading portrait commissions and linocut prints for photography lessons, film cameras, and interesting produce.',
  public_location_label = 'Near Fremont, Seattle', location_mode = 'local',
  is_adult_confirmed = true
where id = '00000000-0000-0000-0000-000000000003';

update public.profiles set
  display_name = 'Dev Patel', handle = 'dev',
  bio = 'Software engineer by day. I trade website help and Python tutoring for home-cooked meals and climbing partners.',
  public_location_label = 'Near Capitol Hill, Seattle', location_mode = 'local_and_online',
  is_paused = true, is_adult_confirmed = true
where id = '00000000-0000-0000-0000-000000000004';

update public.profiles set
  display_name = 'Rosa Delgado', handle = 'rosa',
  bio = 'Urban gardener with too many tomatoes every August. Trading produce, seedlings, and canning lessons.',
  public_location_label = 'Near Wallingford, Seattle', location_mode = 'local',
  is_adult_confirmed = true
where id = '00000000-0000-0000-0000-000000000005';

update public.profile_private set exact_location = extensions.st_setsrid(extensions.st_makepoint(-122.3570, 47.6370), 4326)::extensions.geography, locality = 'Seattle', region = 'WA', country_code = 'US' where profile_id = '00000000-0000-0000-0000-000000000001';
update public.profile_private set exact_location = extensions.st_setsrid(extensions.st_makepoint(-122.3860, 47.6690), 4326)::extensions.geography, locality = 'Seattle', region = 'WA', country_code = 'US' where profile_id = '00000000-0000-0000-0000-000000000002';
update public.profile_private set exact_location = extensions.st_setsrid(extensions.st_makepoint(-122.3500, 47.6510), 4326)::extensions.geography, locality = 'Seattle', region = 'WA', country_code = 'US' where profile_id = '00000000-0000-0000-0000-000000000003';
update public.profile_private set exact_location = extensions.st_setsrid(extensions.st_makepoint(-122.3170, 47.6250), 4326)::extensions.geography, locality = 'Seattle', region = 'WA', country_code = 'US' where profile_id = '00000000-0000-0000-0000-000000000004';
update public.profile_private set exact_location = extensions.st_setsrid(extensions.st_makepoint(-122.3340, 47.6610), 4326)::extensions.geography, locality = 'Seattle', region = 'WA', country_code = 'US' where profile_id = '00000000-0000-0000-0000-000000000005';

insert into public.profile_interests (profile_id, label) values
  ('00000000-0000-0000-0000-000000000001', 'Illustration'),
  ('00000000-0000-0000-0000-000000000001', 'Garden produce'),
  ('00000000-0000-0000-0000-000000000001', 'Coffee beans'),
  ('00000000-0000-0000-0000-000000000001', 'Houseplants'),
  ('00000000-0000-0000-0000-000000000002', 'Garden produce'),
  ('00000000-0000-0000-0000-000000000002', 'Bike repair'),
  ('00000000-0000-0000-0000-000000000002', 'Houseplants'),
  ('00000000-0000-0000-0000-000000000002', 'Moving help'),
  ('00000000-0000-0000-0000-000000000002', 'Spanish practice'),
  ('00000000-0000-0000-0000-000000000003', 'Photography'),
  ('00000000-0000-0000-0000-000000000003', 'Film cameras'),
  ('00000000-0000-0000-0000-000000000003', 'Framing'),
  ('00000000-0000-0000-0000-000000000003', 'Fresh produce'),
  ('00000000-0000-0000-0000-000000000004', 'Cooking'),
  ('00000000-0000-0000-0000-000000000004', 'Climbing'),
  ('00000000-0000-0000-0000-000000000004', 'Board games'),
  ('00000000-0000-0000-0000-000000000005', 'Woodworking'),
  ('00000000-0000-0000-0000-000000000005', 'Bikes'),
  ('00000000-0000-0000-0000-000000000005', 'Mason jars')
on conflict do nothing;

-- 3. Posts ---------------------------------------------------------------------

insert into public.posts (id, owner_id, kind, category, title, body, what_i_can_give, location_mode, approximate_location_label, location, approval_policy, availability_total, availability_remaining, availability_unit, status)
values
  ('10000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000002', 'offering', 'services', 'Furniture repair for garden produce', 'I can re-glue, refinish, and fix hardware on chairs, tables, and small cabinets. Happy to look at photos first.', null, 'local', 'Near Ballard, Seattle', extensions.st_setsrid(extensions.st_makepoint(-122.3860, 47.6690), 4326)::extensions.geography, 'manual_approval', null, null, null, 'active'),
  ('10000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000005', 'offering', 'goods', 'Weekly surplus produce box', 'Tomatoes, kale, herbs, and whatever else the garden overproduces. Pickup near Wallingford.', null, 'local', 'Near Wallingford, Seattle', extensions.st_setsrid(extensions.st_makepoint(-122.3340, 47.6610), 4326)::extensions.geography, 'manual_approval', null, null, null, 'active'),
  ('10000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000003', 'seeking', 'services', 'Photography lessons wanted', 'Beginner with a mirrorless camera looking for patient lessons on manual settings and composition.', 'Portrait commission or linocut prints', 'local', 'Near Fremont, Seattle', extensions.st_setsrid(extensions.st_makepoint(-122.3500, 47.6510), 4326)::extensions.geography, 'manual_approval', null, null, null, 'active'),
  ('10000000-0000-0000-0000-000000000005', '00000000-0000-0000-0000-000000000003', 'offering', 'goods', 'Botanical linocut prints, A4', 'Limited run of hand-pulled botanical prints. Trades welcome, especially framing help or produce.', null, 'local_and_online', 'Near Fremont, Seattle', extensions.st_setsrid(extensions.st_makepoint(-122.3500, 47.6510), 4326)::extensions.geography, 'manual_approval', null, null, null, 'active'),
  ('10000000-0000-0000-0000-000000000006', '00000000-0000-0000-0000-000000000005', 'seeking', 'goods', 'Looking for a kid-friendly bike', '20-inch wheels for an 8-year-old. Condition matters less than working brakes.', 'Canning lessons or produce boxes', 'local', 'Near Wallingford, Seattle', extensions.st_setsrid(extensions.st_makepoint(-122.3340, 47.6610), 4326)::extensions.geography, 'manual_approval', null, null, null, 'active'),
  ('10000000-0000-0000-0000-000000000007', '00000000-0000-0000-0000-000000000002', 'offering', 'goods', 'Sourdough starter + baking lesson', 'Rye starter, fed and lively, with a one-hour walkthrough of my routine. Bring a jar.', null, 'local', 'Near Ballard, Seattle', extensions.st_setsrid(extensions.st_makepoint(-122.3860, 47.6690), 4326)::extensions.geography, 'manual_approval', null, null, null, 'active'),
  ('10000000-0000-0000-0000-000000000009', '00000000-0000-0000-0000-000000000003', 'seeking', 'goods', 'Seeking a working film camera', '35mm SLR preferred. Trading portrait commissions.', 'Ink or digital portrait commission', 'local_and_online', 'Near Fremont, Seattle', extensions.st_setsrid(extensions.st_makepoint(-122.3500, 47.6510), 4326)::extensions.geography, 'manual_approval', null, null, null, 'active'),
  -- Dev is paused, so these two are hidden from discovery until unpaused (kept for testing that rule).
  ('10000000-0000-0000-0000-000000000004', '00000000-0000-0000-0000-000000000004', 'offering', 'services', 'App developer client openings', 'I can take on a small app build or repair sprint for nonprofits and community projects. Remote-friendly.', null, 'online', 'Online', null, 'manual_approval', 4, 2, 'app developer clients', 'active'),
  ('10000000-0000-0000-0000-000000000008', '00000000-0000-0000-0000-000000000004', 'offering', 'services', 'Python tutoring, 1:1', 'Beginner to intermediate. We can meet at a cafe on Capitol Hill or online.', null, 'local_and_online', 'Near Capitol Hill, Seattle', extensions.st_setsrid(extensions.st_makepoint(-122.3170, 47.6250), 4326)::extensions.geography, 'manual_approval', null, null, null, 'active')
on conflict (id) do nothing;

-- 4. Follows --------------------------------------------------------------------

insert into public.follows (follower_id, followee_id) values
  ('00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000003'),
  ('00000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000001'),
  ('00000000-0000-0000-0000-000000000005', '00000000-0000-0000-0000-000000000002'),
  ('00000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000005')
on conflict do nothing;

-- 5. Offers + messages -----------------------------------------------------------

insert into public.offers (id, post_id, requester_id, recipient_id, offered_item, requested_item, timing, note, status, requires_approval)
values
  ('20000000-0000-0000-0000-000000000001', null, '00000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000001', 'Portrait commission', '2 photography lessons', 'Next two weekends', 'I can share my portfolio first if helpful.', 'pending', true),
  ('20000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000002', 'A Saturday of yard work', 'Custom shelving install', 'Flexible, this month', null, 'interested', true),
  ('20000000-0000-0000-0000-000000000003', '10000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000005', '00000000-0000-0000-0000-000000000001', 'Produce box, 4 weeks', 'Kitchen chair repair', 'Starting next week', null, 'pending', true)
on conflict (id) do nothing;

insert into public.messages (offer_id, sender_id, body, created_at) values
  ('20000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000003', 'Hi Jordan! I saw you offer photography lessons. Would you trade two sessions for an ink portrait? I can share my portfolio.', now() - interval '2 hours'),
  ('20000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', 'Hey Maya, I love your linocut work. Two lessons sounds fair. Weekends work best for me.', now() - interval '90 minutes'),
  ('20000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000003', 'Perfect. I sent a formal offer above so we have the details in one place.', now() - interval '1 hour'),
  ('20000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000001', 'Hi Sam, I need two shelves in my hallway. I can offer a full Saturday of yard work.', now() - interval '1 day'),
  ('20000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000002', 'That works. I marked the offer as interested. Send me the shelf measurements when you can.', now() - interval '23 hours'),
  ('20000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000005', 'Four weeks of produce boxes for fixing two wobbly kitchen chairs. Interested?', now() - interval '3 days');
