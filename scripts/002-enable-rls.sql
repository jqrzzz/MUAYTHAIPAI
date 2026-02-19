-- Row Level Security (RLS) Policies
-- Run this after creating tables

-- ============================================
-- ENABLE RLS ON ALL TABLES
-- ============================================
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE org_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE services ENABLE ROW LEVEL SECURITY;
ALTER TABLE time_slots ENABLE ROW LEVEL SECURITY;
ALTER TABLE trainer_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE certificates ENABLE ROW LEVEL SECURITY;
ALTER TABLE org_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;

-- ============================================
-- HELPER FUNCTIONS
-- ============================================

-- Check if user is a member of an organization
CREATE OR REPLACE FUNCTION is_org_member(org_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM org_members 
    WHERE org_members.org_id = $1 
    AND org_members.user_id = auth.uid()
    AND org_members.status = 'active'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Check if user has a specific role in an organization
CREATE OR REPLACE FUNCTION has_org_role(org_id UUID, required_roles TEXT[])
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM org_members 
    WHERE org_members.org_id = $1 
    AND org_members.user_id = auth.uid()
    AND org_members.role = ANY(required_roles)
    AND org_members.status = 'active'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Check if user is platform admin
CREATE OR REPLACE FUNCTION is_platform_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM users 
    WHERE users.id = auth.uid() 
    AND users.is_platform_admin = TRUE
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- ORGANIZATIONS POLICIES
-- ============================================

-- Anyone can view active organizations (public gym listing)
CREATE POLICY "Public can view active organizations"
  ON organizations FOR SELECT
  USING (status = 'active');

-- Owners and admins can update their organization
CREATE POLICY "Owners and admins can update organization"
  ON organizations FOR UPDATE
  USING (has_org_role(id, ARRAY['owner', 'admin']));

-- Platform admins can do everything
CREATE POLICY "Platform admins full access to organizations"
  ON organizations FOR ALL
  USING (is_platform_admin());

-- ============================================
-- USERS POLICIES
-- ============================================

-- Users can view their own profile
CREATE POLICY "Users can view own profile"
  ON users FOR SELECT
  USING (auth.uid() = id);

-- Users can update their own profile
CREATE POLICY "Users can update own profile"
  ON users FOR UPDATE
  USING (auth.uid() = id);

-- Users can insert their own profile (on signup)
CREATE POLICY "Users can insert own profile"
  ON users FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Org members can view other members in same org
CREATE POLICY "Org members can view each other"
  ON users FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM org_members om1
      JOIN org_members om2 ON om1.org_id = om2.org_id
      WHERE om1.user_id = auth.uid()
      AND om2.user_id = users.id
    )
  );

-- ============================================
-- ORG_MEMBERS POLICIES
-- ============================================

-- Members can view other members in their org
CREATE POLICY "Members can view org members"
  ON org_members FOR SELECT
  USING (is_org_member(org_id));

-- Owners and admins can manage members
CREATE POLICY "Owners and admins can insert members"
  ON org_members FOR INSERT
  WITH CHECK (has_org_role(org_id, ARRAY['owner', 'admin']));

CREATE POLICY "Owners and admins can update members"
  ON org_members FOR UPDATE
  USING (has_org_role(org_id, ARRAY['owner', 'admin']));

CREATE POLICY "Owners can delete members"
  ON org_members FOR DELETE
  USING (has_org_role(org_id, ARRAY['owner']));

-- ============================================
-- SERVICES POLICIES
-- ============================================

-- Anyone can view active services (public)
CREATE POLICY "Public can view active services"
  ON services FOR SELECT
  USING (is_active = TRUE);

-- Owners and admins can manage services
CREATE POLICY "Owners and admins can insert services"
  ON services FOR INSERT
  WITH CHECK (has_org_role(org_id, ARRAY['owner', 'admin']));

CREATE POLICY "Owners and admins can update services"
  ON services FOR UPDATE
  USING (has_org_role(org_id, ARRAY['owner', 'admin']));

CREATE POLICY "Owners and admins can delete services"
  ON services FOR DELETE
  USING (has_org_role(org_id, ARRAY['owner', 'admin']));

-- ============================================
-- TIME_SLOTS POLICIES
-- ============================================

-- Anyone can view active time slots (for booking)
CREATE POLICY "Public can view active time slots"
  ON time_slots FOR SELECT
  USING (is_active = TRUE);

-- Owners and admins can manage time slots
CREATE POLICY "Owners and admins can manage time slots"
  ON time_slots FOR ALL
  USING (has_org_role(org_id, ARRAY['owner', 'admin']));

-- ============================================
-- TRAINER_PROFILES POLICIES
-- ============================================

-- Anyone can view trainer profiles (public)
CREATE POLICY "Public can view trainer profiles"
  ON trainer_profiles FOR SELECT
  USING (TRUE);

-- Trainers can update their own profile
CREATE POLICY "Trainers can update own profile"
  ON trainer_profiles FOR UPDATE
  USING (user_id = auth.uid());

-- Owners and admins can manage all trainer profiles
CREATE POLICY "Owners and admins can manage trainer profiles"
  ON trainer_profiles FOR ALL
  USING (has_org_role(org_id, ARRAY['owner', 'admin']));

-- ============================================
-- BOOKINGS POLICIES
-- ============================================

-- Users can view their own bookings
CREATE POLICY "Users can view own bookings"
  ON bookings FOR SELECT
  USING (user_id = auth.uid() OR guest_email = (SELECT email FROM users WHERE id = auth.uid()));

-- Staff can view all bookings in their org
CREATE POLICY "Staff can view org bookings"
  ON bookings FOR SELECT
  USING (has_org_role(org_id, ARRAY['owner', 'admin', 'trainer']));

-- Anyone can create a booking (guest or logged in)
CREATE POLICY "Anyone can create bookings"
  ON bookings FOR INSERT
  WITH CHECK (TRUE);

-- Staff can update bookings
CREATE POLICY "Staff can update bookings"
  ON bookings FOR UPDATE
  USING (has_org_role(org_id, ARRAY['owner', 'admin', 'trainer']));

-- Owners can delete bookings
CREATE POLICY "Owners can delete bookings"
  ON bookings FOR DELETE
  USING (has_org_role(org_id, ARRAY['owner']));

-- ============================================
-- PAYMENTS POLICIES
-- ============================================

-- Users can view their own payments
CREATE POLICY "Users can view own payments"
  ON payments FOR SELECT
  USING (user_id = auth.uid());

-- Staff can view org payments
CREATE POLICY "Staff can view org payments"
  ON payments FOR SELECT
  USING (has_org_role(org_id, ARRAY['owner', 'admin']));

-- System can insert payments (via service role)
CREATE POLICY "Insert payments"
  ON payments FOR INSERT
  WITH CHECK (TRUE);

-- ============================================
-- CERTIFICATES POLICIES
-- ============================================

-- Users can view their own certificates
CREATE POLICY "Users can view own certificates"
  ON certificates FOR SELECT
  USING (user_id = auth.uid());

-- Staff can view and manage org certificates
CREATE POLICY "Staff can manage org certificates"
  ON certificates FOR ALL
  USING (has_org_role(org_id, ARRAY['owner', 'admin', 'trainer']));

-- ============================================
-- ORG_SETTINGS POLICIES
-- ============================================

-- Members can view their org settings
CREATE POLICY "Members can view org settings"
  ON org_settings FOR SELECT
  USING (is_org_member(org_id));

-- Owners and admins can update settings
CREATE POLICY "Owners and admins can update settings"
  ON org_settings FOR UPDATE
  USING (has_org_role(org_id, ARRAY['owner', 'admin']));

CREATE POLICY "Owners and admins can insert settings"
  ON org_settings FOR INSERT
  WITH CHECK (has_org_role(org_id, ARRAY['owner', 'admin']));

-- ============================================
-- ACTIVITY_LOGS POLICIES
-- ============================================

-- Staff can view org activity logs
CREATE POLICY "Staff can view org activity logs"
  ON activity_logs FOR SELECT
  USING (has_org_role(org_id, ARRAY['owner', 'admin']));

-- Anyone can insert activity logs
CREATE POLICY "Insert activity logs"
  ON activity_logs FOR INSERT
  WITH CHECK (TRUE);
