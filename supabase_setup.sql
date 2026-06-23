-- ============================================================================
-- SQL Setup Script for Komal Creations & Training Center (Supabase Backend)
-- This script initializes tables, indexes, Row Level Security (RLS) policies,
-- automatic triggers for student registration profiles, and mock ledger data.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. CLEANUP (Optional - Use caution in production)
-- ----------------------------------------------------------------------------
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS handle_new_user();
DROP TABLE IF EXISTS profiles;
DROP TABLE IF EXISTS inquiries;
DROP TABLE IF EXISTS certificates;

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ----------------------------------------------------------------------------
-- 2. TABLE CREATION
-- ----------------------------------------------------------------------------

-- Table: inquiries (For student admission leads & guest custom requests)
CREATE TABLE inquiries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    full_name TEXT NOT NULL CHECK (char_length(full_name) >= 2),
    phone_number TEXT NOT NULL CHECK (char_length(phone_number) >= 8),
    age INT CHECK (age > 0 AND age < 120),
    course_interested TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'contacted', 'enrolled', 'cancelled')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Table: certificates (For online ledger verification)
CREATE TABLE certificates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_name TEXT NOT NULL CHECK (char_length(student_name) >= 2),
    father_name TEXT NOT NULL CHECK (char_length(father_name) >= 2),
    roll_number TEXT NOT NULL CHECK (char_length(roll_number) >= 3),
    course_name TEXT NOT NULL,
    passing_year INT NOT NULL CHECK (passing_year BETWEEN 2000 AND 2100),
    grade TEXT NOT NULL CHECK (char_length(grade) > 0),
    verification_code TEXT UNIQUE NOT NULL CHECK (char_length(verification_code) >= 6),
    certificate_image_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Table: profiles (For authenticated student profile data)
-- Links 1-to-1 with Supabase Auth users table
CREATE TABLE profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name TEXT NOT NULL CHECK (char_length(full_name) >= 2),
    father_name TEXT NOT NULL CHECK (char_length(father_name) >= 2),
    residence TEXT NOT NULL CHECK (char_length(residence) >= 3),
    email TEXT UNIQUE NOT NULL,
    phone TEXT NOT NULL CHECK (char_length(phone) >= 8),
    enrolled_course TEXT NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Indexes for performance
CREATE INDEX idx_certificates_verification_code ON certificates(verification_code);
CREATE INDEX idx_profiles_email ON profiles(email);

-- ----------------------------------------------------------------------------
-- 3. ROW LEVEL SECURITY (RLS) POLICIES
-- ----------------------------------------------------------------------------

-- Enable Row Level Security (RLS) on all tables
ALTER TABLE inquiries ENABLE ROW LEVEL SECURITY;
ALTER TABLE certificates ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- --- RLS Policies for 'inquiries' ---
CREATE POLICY "Allow public insert of inquiries" ON inquiries FOR INSERT TO public WITH CHECK (true);
CREATE POLICY "Allow authenticated read of inquiries" ON inquiries FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow authenticated update of inquiries" ON inquiries FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow authenticated delete of inquiries" ON inquiries FOR DELETE TO authenticated USING (true);

-- --- RLS Policies for 'certificates' ---
CREATE POLICY "Allow public read of certificates" ON certificates FOR SELECT TO public USING (true);
CREATE POLICY "Allow authenticated insert of certificates" ON certificates FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Allow authenticated update of certificates" ON certificates FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow authenticated delete of certificates" ON certificates FOR DELETE TO authenticated USING (true);

-- --- RLS Policies for 'profiles' (Student User Portal) ---
-- Policy 1: Allow users to read ONLY their own profile record
CREATE POLICY "Allow students to read own profile" 
ON profiles 
FOR SELECT 
TO authenticated 
USING (auth.uid() = id);

-- Policy 2: Allow users to update ONLY their own profile details
CREATE POLICY "Allow students to update own profile" 
ON profiles 
FOR UPDATE 
TO authenticated 
USING (auth.uid() = id) 
WITH CHECK (auth.uid() = id);

-- ----------------------------------------------------------------------------
-- 4. AUTOMATIC NEW USER PROFILE TRIGGER
-- ----------------------------------------------------------------------------
-- This function runs automatically whenever a new signup is verified in Supabase Auth.
-- It extracts custom fields stored in user metadata and creates a public profile row.
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (
        id, 
        full_name, 
        father_name, 
        residence, 
        email, 
        phone, 
        enrolled_course
    )
    VALUES (
        new.id,
        COALESCE(new.raw_user_meta_data->>'full_name', 'Student Name'),
        COALESCE(new.raw_user_meta_data->>'father_name', 'Father Name'),
        COALESCE(new.raw_user_meta_data->>'residence', 'Residence Location'),
        new.email,
        COALESCE(new.raw_user_meta_data->>'phone', '0000000000'),
        COALESCE(new.raw_user_meta_data->>'enrolled_course', 'Unassigned Course')
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Bind trigger function to auth.users insertions
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ----------------------------------------------------------------------------
-- 5. INSERT DUMMY DATA FOR TESTING
-- ----------------------------------------------------------------------------

-- Insert mock certificates for validation testing
INSERT INTO certificates (
    student_name, 
    father_name, 
    roll_number, 
    course_name, 
    passing_year, 
    grade, 
    verification_code, 
    certificate_image_url
) VALUES 
(
    'Aaradhya Sharma', 
    'Rajesh Sharma', 
    'KCTC-2025-089', 
    'Advance Fashion Designing & Tailoring', 
    2025, 
    'A+', 
    'KCTC-VERIFY-99A',
    'https://images.unsplash.com/photo-1589330694653-ded6df53f6ee?auto=format&fit=crop&q=80&w=800'
),
(
    'Priya Patel', 
    'Vijay Patel', 
    'KCTC-2026-012', 
    'Embroidery & Hand Crafting Masterclass', 
    2026, 
    'A', 
    'KCTC-VERIFY-12B',
    'https://images.unsplash.com/photo-1606240724602-5b21f896eae8?auto=format&fit=crop&q=80&w=800'
);

-- Insert a mock inquiry
INSERT INTO inquiries (
    full_name, 
    phone_number, 
    age, 
    course_interested, 
    status
) VALUES (
    'Sneha Sen', 
    '+91 98765 43210', 
    22, 
    'Basic Tailoring Course (3 Months)', 
    'new'
);

-- ----------------------------------------------------------------------------
-- 6. ADMIN DASHBOARD EXTRAS - Add fees_paid and notes to profiles
-- Run this block ONLY if you already ran the original setup script above.
-- If you are fresh-running, the profiles table above already includes all columns.
-- ----------------------------------------------------------------------------

-- Add fee tracking columns to profiles table
ALTER TABLE profiles 
    ADD COLUMN IF NOT EXISTS fees_paid BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN IF NOT EXISTS fees_amount NUMERIC(10,2) DEFAULT 0,
    ADD COLUMN IF NOT EXISTS admin_notes TEXT DEFAULT '',
    ADD COLUMN IF NOT EXISTS enrollment_date TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now());

-- Admin can do everything on profiles
CREATE POLICY "Admin full control on profiles" 
ON profiles 
FOR ALL 
TO authenticated 
USING (true) 
WITH CHECK (true);

-- Admin can do everything on inquiries (already exists for select/update/delete, but this covers all)
DROP POLICY IF EXISTS "Allow authenticated read of inquiries" ON inquiries;
DROP POLICY IF EXISTS "Allow authenticated update of inquiries" ON inquiries;
DROP POLICY IF EXISTS "Allow authenticated delete of inquiries" ON inquiries;
CREATE POLICY "Admin full control on inquiries" ON inquiries FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- View: admin_students (joins auth.users with profiles for email_confirmed_at)
CREATE OR REPLACE VIEW admin_students AS
SELECT 
    p.id,
    p.full_name,
    p.father_name,
    p.residence,
    p.email,
    p.phone,
    p.enrolled_course,
    p.fees_paid,
    p.fees_amount,
    p.admin_notes,
    p.enrollment_date,
    p.updated_at,
    u.email_confirmed_at,
    CASE WHEN u.email_confirmed_at IS NOT NULL THEN 'Verified' ELSE 'Pending' END AS email_status
FROM public.profiles p
LEFT JOIN auth.users u ON p.id = u.id;

-- Grant select on the view to authenticated role
GRANT SELECT ON admin_students TO authenticated;
