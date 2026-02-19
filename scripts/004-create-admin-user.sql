-- ADMIN USER SETUP
-- This script creates your admin account for Wisarut Family Gym

-- Step 1: Create a function that automatically creates user profile when someone signs up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.users (id, email, full_name)
  VALUES (new.id, new.email, new.raw_user_meta_data->>'full_name');
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 2: Create trigger to run the function on signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Step 3: Create a function to make the first user an owner of Wisarut gym
CREATE OR REPLACE FUNCTION public.make_wisarut_owner()
RETURNS trigger AS $$
DECLARE
  wisarut_org_id uuid;
  member_count integer;
BEGIN
  -- Get Wisarut gym ID
  SELECT id INTO wisarut_org_id FROM public.organizations WHERE slug = 'wisarut-family-gym';
  
  -- Check if gym already has an owner
  SELECT COUNT(*) INTO member_count FROM public.org_members WHERE org_id = wisarut_org_id AND role = 'owner';
  
  -- If no owner yet, make this user the owner
  IF member_count = 0 AND wisarut_org_id IS NOT NULL THEN
    INSERT INTO public.org_members (org_id, user_id, role, can_manage_bookings, can_manage_services, can_manage_members, can_view_payments)
    VALUES (wisarut_org_id, new.id, 'owner', true, true, true, true);
  END IF;
  
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 4: Create trigger to make first signup the owner
DROP TRIGGER IF EXISTS on_user_created_make_owner ON public.users;
CREATE TRIGGER on_user_created_make_owner
  AFTER INSERT ON public.users
  FOR EACH ROW EXECUTE FUNCTION public.make_wisarut_owner();
