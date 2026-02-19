-- Muay Thai Gym Platform Database Schema
-- Version: 1.0.0
-- Run this script first to create all tables

-- ============================================
-- 1. ORGANIZATIONS (Gyms)
-- ============================================
CREATE TABLE organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  logo_url TEXT,
  cover_image_url TEXT,
  
  -- Location
  country TEXT DEFAULT 'Thailand',
  province TEXT,
  city TEXT,
  address TEXT,
  google_maps_url TEXT,
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  timezone TEXT DEFAULT 'Asia/Bangkok',
  
  -- Contact
  email TEXT,
  phone TEXT,
  whatsapp TEXT,
  instagram TEXT,
  facebook TEXT,
  website TEXT,
  
  -- Stripe (for multi-gym payments later)
  stripe_account_id TEXT,
  stripe_onboarded BOOLEAN DEFAULT FALSE,
  
  -- Status
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'suspended', 'pending')),
  verified BOOLEAN DEFAULT FALSE,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 2. USERS (All People)
-- ============================================
CREATE TABLE users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  display_name TEXT,
  avatar_url TEXT,
  phone TEXT,
  
  -- Profile
  nationality TEXT,
  date_of_birth DATE,
  bio TEXT,
  
  -- Preferences
  preferred_language TEXT DEFAULT 'en',
  notification_email BOOLEAN DEFAULT TRUE,
  notification_sms BOOLEAN DEFAULT FALSE,
  notification_whatsapp BOOLEAN DEFAULT FALSE,
  
  -- Platform-level
  is_platform_admin BOOLEAN DEFAULT FALSE,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 3. ORGANIZATION MEMBERS (User-Gym Relationship)
-- ============================================
CREATE TABLE org_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  
  role TEXT NOT NULL CHECK (role IN ('owner', 'admin', 'trainer', 'student')),
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'suspended', 'pending')),
  
  -- Permissions (can override role defaults)
  can_manage_bookings BOOLEAN DEFAULT FALSE,
  can_manage_services BOOLEAN DEFAULT FALSE,
  can_manage_members BOOLEAN DEFAULT FALSE,
  can_view_payments BOOLEAN DEFAULT FALSE,
  
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(org_id, user_id)
);

CREATE INDEX idx_org_members_org ON org_members(org_id);
CREATE INDEX idx_org_members_user ON org_members(user_id);

-- ============================================
-- 4. SERVICES (What Gyms Offer)
-- ============================================
CREATE TABLE services (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  
  name TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL CHECK (category IN ('training', 'certificate', 'membership', 'accommodation')),
  
  -- Pricing
  price_thb INTEGER NOT NULL,
  price_usd INTEGER,
  currency TEXT DEFAULT 'THB',
  
  -- Duration
  duration_minutes INTEGER,
  duration_days INTEGER,
  
  -- Scheduling
  requires_time_slot BOOLEAN DEFAULT TRUE,
  max_capacity INTEGER,
  
  -- Display
  display_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  is_featured BOOLEAN DEFAULT FALSE,
  
  -- Metadata (flexible)
  metadata JSONB DEFAULT '{}',
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_services_org ON services(org_id);
CREATE INDEX idx_services_category ON services(category);

-- ============================================
-- 5. TIME SLOTS (Availability)
-- ============================================
CREATE TABLE time_slots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  service_id UUID REFERENCES services(id) ON DELETE CASCADE,
  
  day_of_week INTEGER CHECK (day_of_week >= 0 AND day_of_week <= 6),
  start_time TIME NOT NULL,
  end_time TIME,
  
  max_bookings INTEGER DEFAULT 1,
  is_active BOOLEAN DEFAULT TRUE,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_time_slots_org ON time_slots(org_id);
CREATE INDEX idx_time_slots_service ON time_slots(service_id);

-- ============================================
-- 6. TRAINER PROFILES (Public-Facing)
-- ============================================
CREATE TABLE trainer_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  
  -- Public info
  display_name TEXT NOT NULL,
  title TEXT,
  bio TEXT,
  specialties TEXT[],
  
  -- Media
  photo_url TEXT,
  video_url TEXT,
  
  -- Fight record (for Ock Ock integration)
  fight_record_wins INTEGER DEFAULT 0,
  fight_record_losses INTEGER DEFAULT 0,
  fight_record_draws INTEGER DEFAULT 0,
  years_experience INTEGER,
  
  -- Availability
  is_available BOOLEAN DEFAULT TRUE,
  availability_note TEXT,
  
  -- Display
  display_order INTEGER DEFAULT 0,
  is_featured BOOLEAN DEFAULT FALSE,
  
  -- Ock Ock integration (future)
  ock_ock_id TEXT,
  open_to_fights BOOLEAN DEFAULT FALSE,
  open_to_events BOOLEAN DEFAULT FALSE,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(org_id, user_id)
);

CREATE INDEX idx_trainer_profiles_org ON trainer_profiles(org_id);

-- ============================================
-- 7. BOOKINGS
-- ============================================
CREATE TABLE bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  service_id UUID NOT NULL REFERENCES services(id),
  
  -- Who booked
  user_id UUID REFERENCES users(id),
  guest_name TEXT,
  guest_email TEXT,
  guest_phone TEXT,
  
  -- Trainer (optional)
  trainer_id UUID REFERENCES trainer_profiles(id),
  
  -- When
  booking_date DATE NOT NULL,
  booking_time TIME,
  
  -- Status
  status TEXT DEFAULT 'confirmed' CHECK (status IN ('pending', 'confirmed', 'completed', 'cancelled', 'no_show')),
  
  -- Payment
  payment_status TEXT DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'refunded', 'failed')),
  payment_method TEXT CHECK (payment_method IN ('stripe', 'cash', 'transfer')),
  payment_amount_thb INTEGER,
  stripe_payment_intent_id TEXT,
  
  -- Notes
  customer_notes TEXT,
  staff_notes TEXT,
  
  -- Metadata
  metadata JSONB DEFAULT '{}',
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_bookings_org ON bookings(org_id);
CREATE INDEX idx_bookings_date ON bookings(booking_date);
CREATE INDEX idx_bookings_user ON bookings(user_id);
CREATE INDEX idx_bookings_status ON bookings(status);
CREATE INDEX idx_bookings_service ON bookings(service_id);

-- ============================================
-- 8. PAYMENTS
-- ============================================
CREATE TABLE payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  booking_id UUID REFERENCES bookings(id),
  user_id UUID REFERENCES users(id),
  
  -- Amount
  amount_thb INTEGER NOT NULL,
  amount_usd INTEGER,
  currency TEXT DEFAULT 'THB',
  
  -- Stripe
  stripe_payment_intent_id TEXT,
  stripe_charge_id TEXT,
  stripe_receipt_url TEXT,
  
  -- Status
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'succeeded', 'failed', 'refunded')),
  payment_method TEXT,
  
  -- Metadata
  description TEXT,
  metadata JSONB DEFAULT '{}',
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_payments_org ON payments(org_id);
CREATE INDEX idx_payments_booking ON payments(booking_id);
CREATE INDEX idx_payments_stripe ON payments(stripe_payment_intent_id);

-- ============================================
-- 9. CERTIFICATES
-- ============================================
CREATE TABLE certificates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  
  -- Certificate type
  level TEXT NOT NULL,
  level_number INTEGER,
  
  -- Issuance
  issued_by UUID REFERENCES trainer_profiles(id),
  issued_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Verification
  certificate_number TEXT UNIQUE,
  verification_url TEXT,
  certificate_pdf_url TEXT,
  
  -- Status
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'revoked')),
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_certificates_org ON certificates(org_id);
CREATE INDEX idx_certificates_user ON certificates(user_id);

-- ============================================
-- 10. ORGANIZATION SETTINGS
-- ============================================
CREATE TABLE org_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID UNIQUE NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  
  -- Booking settings
  booking_advance_days INTEGER DEFAULT 1,
  booking_max_days_ahead INTEGER DEFAULT 60,
  allow_guest_bookings BOOLEAN DEFAULT TRUE,
  require_payment_upfront BOOLEAN DEFAULT FALSE,
  
  -- Notifications
  notify_on_booking_email BOOLEAN DEFAULT TRUE,
  notify_on_booking_sms BOOLEAN DEFAULT FALSE,
  notify_on_booking_whatsapp BOOLEAN DEFAULT FALSE,
  notification_email TEXT,
  notification_phone TEXT,
  
  -- Display
  show_prices BOOLEAN DEFAULT TRUE,
  show_trainer_selection BOOLEAN DEFAULT TRUE,
  
  -- Operating hours
  operating_hours JSONB DEFAULT '{}',
  
  -- Custom fields
  custom_settings JSONB DEFAULT '{}',
  
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 11. ACTIVITY LOGS (AI-Ready)
-- ============================================
CREATE TABLE activity_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id),
  
  -- What happened
  action TEXT NOT NULL,
  entity_type TEXT,
  entity_id UUID,
  
  -- Details
  details JSONB DEFAULT '{}',
  
  -- Context
  ip_address INET,
  user_agent TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_activity_logs_created ON activity_logs(created_at DESC);
CREATE INDEX idx_activity_logs_org ON activity_logs(org_id);
CREATE INDEX idx_activity_logs_action ON activity_logs(action);

-- ============================================
-- UPDATE TIMESTAMP TRIGGER
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger to tables with updated_at
CREATE TRIGGER update_organizations_updated_at BEFORE UPDATE ON organizations FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_services_updated_at BEFORE UPDATE ON services FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_trainer_profiles_updated_at BEFORE UPDATE ON trainer_profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_bookings_updated_at BEFORE UPDATE ON bookings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_org_settings_updated_at BEFORE UPDATE ON org_settings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
