-- JusticeAI Database Schema

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- Roles enum
CREATE TYPE user_role AS ENUM (
  'admin', 'super_admin', 'police_officer', 'investigating_officer',
  'sho', 'crime_branch', 'prosecutor', 'legal_advisor', 'law_student',
  'judicial_researcher', 'trainer'
);

-- Case status enum
CREATE TYPE case_status AS ENUM (
  'open', 'under_investigation', 'chargesheet_filed', 'closed', 'archived'
);

-- Evidence type enum
CREATE TYPE evidence_type AS ENUM (
  'image', 'video', 'audio', 'document', 'physical', 'digital', 'forensic'
);

-- Users
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  full_name VARCHAR(255) NOT NULL,
  badge_number VARCHAR(100),
  role user_role NOT NULL DEFAULT 'police_officer',
  department VARCHAR(255),
  station VARCHAR(255),
  phone VARCHAR(50),
  avatar_url TEXT,
  is_active BOOLEAN DEFAULT true,
  two_factor_enabled BOOLEAN DEFAULT false,
  two_factor_secret VARCHAR(255),
  last_login TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Cases
CREATE TABLE cases (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  case_number VARCHAR(100) UNIQUE NOT NULL,
  title VARCHAR(500) NOT NULL,
  description TEXT,
  status case_status DEFAULT 'open',
  crime_type VARCHAR(255),
  incident_date TIMESTAMPTZ,
  incident_location TEXT,
  fir_number VARCHAR(100),
  fir_date TIMESTAMPTZ,
  police_station VARCHAR(255),
  assigned_io UUID REFERENCES users(id),
  assigned_sho UUID REFERENCES users(id),
  prosecutor_id UUID REFERENCES users(id),
  priority VARCHAR(50) DEFAULT 'medium',
  tags TEXT[],
  ai_summary TEXT,
  ai_extracted_facts JSONB,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Case members (team)
CREATE TABLE case_members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  case_id UUID REFERENCES cases(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  role VARCHAR(100),
  added_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(case_id, user_id)
);

-- Evidence
CREATE TABLE evidence (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  case_id UUID REFERENCES cases(id) ON DELETE CASCADE,
  evidence_number VARCHAR(100),
  title VARCHAR(500) NOT NULL,
  description TEXT,
  evidence_type evidence_type NOT NULL,
  file_url TEXT,
  file_name VARCHAR(500),
  file_size BIGINT,
  mime_type VARCHAR(100),
  ocr_text TEXT,
  ai_summary TEXT,
  metadata JSONB,
  tags TEXT[],
  chain_of_custody JSONB DEFAULT '[]',
  collected_by UUID REFERENCES users(id),
  collected_at TIMESTAMPTZ,
  location_found TEXT,
  is_verified BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Witnesses
CREATE TABLE witnesses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  case_id UUID REFERENCES cases(id) ON DELETE CASCADE,
  full_name VARCHAR(255) NOT NULL,
  alias VARCHAR(255),
  age INTEGER,
  gender VARCHAR(50),
  address TEXT,
  phone VARCHAR(50),
  email VARCHAR(255),
  occupation VARCHAR(255),
  relationship_to_case TEXT,
  statements JSONB DEFAULT '[]',
  interview_history JSONB DEFAULT '[]',
  court_appearance_status VARCHAR(100),
  protection_required BOOLEAN DEFAULT false,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Victims
CREATE TABLE victims (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  case_id UUID REFERENCES cases(id) ON DELETE CASCADE,
  full_name VARCHAR(255) NOT NULL,
  age INTEGER,
  gender VARCHAR(50),
  address TEXT,
  phone VARCHAR(50),
  email VARCHAR(255),
  injury_description TEXT,
  medical_records JSONB DEFAULT '[]',
  statements JSONB DEFAULT '[]',
  compensation_status VARCHAR(100),
  protection_requests JSONB DEFAULT '[]',
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Suspects / Accused
CREATE TABLE suspects (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  case_id UUID REFERENCES cases(id) ON DELETE CASCADE,
  full_name VARCHAR(255) NOT NULL,
  aliases TEXT[],
  age INTEGER,
  gender VARCHAR(50),
  address TEXT,
  phone VARCHAR(50),
  national_id VARCHAR(100),
  description TEXT,
  arrest_status VARCHAR(100) DEFAULT 'not_arrested',
  arrest_date TIMESTAMPTZ,
  bail_status VARCHAR(100),
  case_history JSONB DEFAULT '[]',
  linked_evidence UUID[],
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Investigation Timeline Events
CREATE TABLE timeline_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  case_id UUID REFERENCES cases(id) ON DELETE CASCADE,
  event_type VARCHAR(100) NOT NULL,
  title VARCHAR(500) NOT NULL,
  description TEXT,
  event_date TIMESTAMPTZ NOT NULL,
  performed_by UUID REFERENCES users(id),
  related_entity_type VARCHAR(100),
  related_entity_id UUID,
  attachments JSONB DEFAULT '[]',
  is_milestone BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Legal Provisions
CREATE TABLE legal_provisions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  act_name VARCHAR(255) NOT NULL,
  section VARCHAR(100) NOT NULL,
  title VARCHAR(500) NOT NULL,
  description TEXT,
  plain_language TEXT,
  typical_evidence TEXT[],
  related_sections TEXT[],
  offense_category VARCHAR(255),
  punishment TEXT,
  is_bailable BOOLEAN,
  is_cognizable BOOLEAN,
  keywords TEXT[],
  embedding_id VARCHAR(255),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Case Legal Provisions (AI Recommendations)
CREATE TABLE case_legal_provisions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  case_id UUID REFERENCES cases(id) ON DELETE CASCADE,
  provision_id UUID REFERENCES legal_provisions(id),
  confidence_score DECIMAL(3,2),
  ai_reasoning TEXT,
  status VARCHAR(50) DEFAULT 'suggested',
  reviewed_by UUID REFERENCES users(id),
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Investigation Checklists
CREATE TABLE checklists (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  case_id UUID REFERENCES cases(id) ON DELETE CASCADE,
  crime_type VARCHAR(255),
  title VARCHAR(500) NOT NULL,
  items JSONB NOT NULL DEFAULT '[]',
  progress INTEGER DEFAULT 0,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Documents (AI Generated)
CREATE TABLE case_documents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  case_id UUID REFERENCES cases(id) ON DELETE CASCADE,
  document_type VARCHAR(100) NOT NULL,
  title VARCHAR(500) NOT NULL,
  content TEXT,
  file_url TEXT,
  version INTEGER DEFAULT 1,
  status VARCHAR(50) DEFAULT 'draft',
  generated_by_ai BOOLEAN DEFAULT false,
  reviewed_by UUID REFERENCES users(id),
  reviewed_at TIMESTAMPTZ,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- AI Chat Sessions
CREATE TABLE ai_chat_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  case_id UUID REFERENCES cases(id) ON DELETE SET NULL,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  title VARCHAR(500),
  messages JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Notifications
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  case_id UUID REFERENCES cases(id) ON DELETE SET NULL,
  type VARCHAR(100) NOT NULL,
  title VARCHAR(500) NOT NULL,
  message TEXT,
  is_read BOOLEAN DEFAULT false,
  action_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Audit Logs
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  action VARCHAR(255) NOT NULL,
  resource_type VARCHAR(100),
  resource_id UUID,
  old_values JSONB,
  new_values JSONB,
  ip_address VARCHAR(45),
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Refresh Tokens
CREATE TABLE refresh_tokens (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  token VARCHAR(500) UNIQUE NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_cases_assigned_io ON cases(assigned_io);
CREATE INDEX idx_cases_status ON cases(status);
CREATE INDEX idx_cases_case_number ON cases(case_number);
CREATE INDEX idx_evidence_case_id ON evidence(case_id);
CREATE INDEX idx_witnesses_case_id ON witnesses(case_id);
CREATE INDEX idx_victims_case_id ON victims(case_id);
CREATE INDEX idx_suspects_case_id ON suspects(case_id);
CREATE INDEX idx_timeline_case_id ON timeline_events(case_id);
CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_unread ON notifications(user_id, is_read);
CREATE INDEX idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX idx_legal_provisions_section ON legal_provisions(section);
CREATE INDEX idx_cases_search ON cases USING GIN(to_tsvector('english', title || ' ' || COALESCE(description, '')));
