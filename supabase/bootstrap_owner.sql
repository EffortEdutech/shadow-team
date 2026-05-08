-- Shadow Team owner bootstrap
-- Run this once in Supabase SQL Editor after creating the first Auth user.
--
-- First owner:
--   id: b453a7b1-ce9a-433d-823b-e21abb19b7c9
--   email: kamalabdlatif@gmail.com

update auth.users
set raw_app_meta_data =
  coalesce(raw_app_meta_data, '{}'::jsonb) ||
  jsonb_build_object('shadow_team_role', 'owner')
where id = 'b453a7b1-ce9a-433d-823b-e21abb19b7c9'
  and email = 'kamalabdlatif@gmail.com';

select
  id,
  email,
  raw_app_meta_data ->> 'shadow_team_role' as shadow_team_role
from auth.users
where id = 'b453a7b1-ce9a-433d-823b-e21abb19b7c9';

