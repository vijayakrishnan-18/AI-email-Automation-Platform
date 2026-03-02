-- ============================================
-- AI Email OS - Database Schema
-- Production-ready PostgreSQL schema with RLS
-- ============================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "vector";

-- ============================================
-- ENUM TYPES
-- ============================================

CREATE TYPE email_category AS ENUM (
  'sales', 'support', 'personal', 'legal',
  'spam', 'newsletter', 'transactional', 'other'
);

CREATE TYPE urgency_level AS ENUM ('low', 'medium', 'high', 'critical');

CREATE TYPE ai_decision_type AS ENUM (
  'AUTO_SEND', 'DRAFT_ONLY', 'NEEDS_APPROVAL', 'ESCALATE', 'NO_ACTION'
);

CREATE TYPE approval_status AS ENUM ('pending', 'approved', 'rejected', 'modified');

CREATE TYPE email_status AS ENUM ('unread', 'read', 'replied', 'archived', 'deleted');

-- ============================================
-- USERS TABLE
-- Extended profile from Supabase Auth
-- ============================================

CREATE TABLE users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL UNIQUE,
  full_name TEXT,
  avatar_url TEXT,
  ai_enabled BOOLEAN NOT NULL DEFAULT false,
  auto_reply_enabled BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_users_email ON users(email);

-- ============================================
-- EMAIL ACCOUNTS TABLE
-- Stores connected email accounts with encrypted tokens
-- ============================================

CREATE TABLE email_accounts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  email_address TEXT NOT NULL,
  provider TEXT NOT NULL DEFAULT 'gmail' CHECK (provider IN ('gmail')),
  access_token_encrypted TEXT NOT NULL,
  refresh_token_encrypted TEXT NOT NULL,
  token_expires_at TIMESTAMPTZ NOT NULL,
  scopes TEXT[] NOT NULL DEFAULT '{}',
  is_active BOOLEAN NOT NULL DEFAULT true,
  last_sync_at TIMESTAMPTZ,
  watch_expiration TIMESTAMPTZ,
  history_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  UNIQUE(user_id, email_address)
);

CREATE INDEX idx_email_accounts_user_id ON email_accounts(user_id);
CREATE INDEX idx_email_accounts_email ON email_accounts(email_address);
CREATE INDEX idx_email_accounts_active ON email_accounts(is_active) WHERE is_active = true;

-- ============================================
-- EMAIL THREADS TABLE
-- ============================================

CREATE TABLE email_threads (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email_account_id UUID NOT NULL REFERENCES email_accounts(id) ON DELETE CASCADE,
  gmail_thread_id TEXT NOT NULL,
  subject TEXT NOT NULL DEFAULT '(No Subject)',
  snippet TEXT,
  last_message_at TIMESTAMPTZ NOT NULL,
  message_count INTEGER NOT NULL DEFAULT 1,
  is_unread BOOLEAN NOT NULL DEFAULT true,
  status email_status NOT NULL DEFAULT 'unread',
  labels TEXT[] NOT NULL DEFAULT '{}',
  participants JSONB NOT NULL DEFAULT '[]',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  UNIQUE(email_account_id, gmail_thread_id)
);

CREATE INDEX idx_threads_account ON email_threads(email_account_id);
CREATE INDEX idx_threads_gmail_id ON email_threads(gmail_thread_id);
CREATE INDEX idx_threads_last_message ON email_threads(last_message_at DESC);
CREATE INDEX idx_threads_unread ON email_threads(is_unread) WHERE is_unread = true;
CREATE INDEX idx_threads_status ON email_threads(status);

-- ============================================
-- EMAILS TABLE
-- Individual email messages within threads
-- ============================================

CREATE TABLE emails (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  thread_id UUID NOT NULL REFERENCES email_threads(id) ON DELETE CASCADE,
  gmail_message_id TEXT NOT NULL UNIQUE,
  from_address TEXT NOT NULL,
  from_name TEXT,
  to_addresses TEXT[] NOT NULL DEFAULT '{}',
  cc_addresses TEXT[] NOT NULL DEFAULT '{}',
  subject TEXT NOT NULL DEFAULT '(No Subject)',
  snippet TEXT,
  body_text TEXT,
  body_html TEXT,
  headers JSONB NOT NULL DEFAULT '{}',
  internal_date TIMESTAMPTZ NOT NULL,
  is_incoming BOOLEAN NOT NULL DEFAULT true,
  attachments JSONB NOT NULL DEFAULT '[]',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_emails_thread ON emails(thread_id);
CREATE INDEX idx_emails_gmail_id ON emails(gmail_message_id);
CREATE INDEX idx_emails_from ON emails(from_address);
CREATE INDEX idx_emails_date ON emails(internal_date DESC);
CREATE INDEX idx_emails_incoming ON emails(is_incoming);

-- ============================================
-- AI CLASSIFICATIONS TABLE
-- ============================================

CREATE TABLE ai_classifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email_id UUID NOT NULL REFERENCES emails(id) ON DELETE CASCADE,
  category email_category NOT NULL,
  urgency urgency_level NOT NULL,
  safe_to_reply BOOLEAN NOT NULL DEFAULT false,
  confidence DECIMAL(3,2) NOT NULL CHECK (confidence >= 0 AND confidence <= 1),
  reasoning TEXT,
  model_used TEXT NOT NULL,
  tokens_used INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  UNIQUE(email_id)
);

CREATE INDEX idx_classifications_email ON ai_classifications(email_id);
CREATE INDEX idx_classifications_category ON ai_classifications(category);
CREATE INDEX idx_classifications_urgency ON ai_classifications(urgency);
CREATE INDEX idx_classifications_confidence ON ai_classifications(confidence);

-- ============================================
-- AI DECISIONS TABLE
-- ============================================

CREATE TABLE ai_decisions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  thread_id UUID NOT NULL REFERENCES email_threads(id) ON DELETE CASCADE,
  email_id UUID NOT NULL REFERENCES emails(id) ON DELETE CASCADE,
  decision ai_decision_type NOT NULL,
  reasoning TEXT,
  confidence DECIMAL(3,2) NOT NULL CHECK (confidence >= 0 AND confidence <= 1),
  rule_id UUID,
  model_used TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_decisions_thread ON ai_decisions(thread_id);
CREATE INDEX idx_decisions_email ON ai_decisions(email_id);
CREATE INDEX idx_decisions_type ON ai_decisions(decision);
CREATE INDEX idx_decisions_rule ON ai_decisions(rule_id);

-- ============================================
-- AI DRAFTS TABLE
-- ============================================

CREATE TABLE ai_drafts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  thread_id UUID NOT NULL REFERENCES email_threads(id) ON DELETE CASCADE,
  email_id UUID NOT NULL REFERENCES emails(id) ON DELETE CASCADE,
  decision_id UUID NOT NULL REFERENCES ai_decisions(id) ON DELETE CASCADE,
  subject TEXT NOT NULL,
  body_text TEXT NOT NULL,
  body_html TEXT,
  tone TEXT NOT NULL DEFAULT 'professional',
  model_used TEXT NOT NULL,
  tokens_used INTEGER NOT NULL DEFAULT 0,
  version INTEGER NOT NULL DEFAULT 1,
  is_sent BOOLEAN NOT NULL DEFAULT false,
  sent_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_drafts_thread ON ai_drafts(thread_id);
CREATE INDEX idx_drafts_email ON ai_drafts(email_id);
CREATE INDEX idx_drafts_decision ON ai_drafts(decision_id);
CREATE INDEX idx_drafts_sent ON ai_drafts(is_sent);

-- ============================================
-- APPROVAL QUEUE TABLE
-- ============================================

CREATE TABLE approval_queue (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  thread_id UUID NOT NULL REFERENCES email_threads(id) ON DELETE CASCADE,
  email_id UUID NOT NULL REFERENCES emails(id) ON DELETE CASCADE,
  draft_id UUID NOT NULL REFERENCES ai_drafts(id) ON DELETE CASCADE,
  decision_id UUID NOT NULL REFERENCES ai_decisions(id) ON DELETE CASCADE,
  status approval_status NOT NULL DEFAULT 'pending',
  reviewed_at TIMESTAMPTZ,
  reviewer_notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_approval_user ON approval_queue(user_id);
CREATE INDEX idx_approval_thread ON approval_queue(thread_id);
CREATE INDEX idx_approval_status ON approval_queue(status);
CREATE INDEX idx_approval_pending ON approval_queue(user_id, status) WHERE status = 'pending';

-- ============================================
-- AI RULES TABLE
-- User-defined rules for AI behavior
-- ============================================

CREATE TABLE ai_rules (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  priority INTEGER NOT NULL DEFAULT 0,
  conditions JSONB NOT NULL DEFAULT '[]',
  action ai_decision_type NOT NULL,
  auto_approve BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_rules_user ON ai_rules(user_id);
CREATE INDEX idx_rules_active ON ai_rules(user_id, is_active) WHERE is_active = true;
CREATE INDEX idx_rules_priority ON ai_rules(user_id, priority DESC);

-- ============================================
-- USER SETTINGS TABLE
-- ============================================

CREATE TABLE user_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE UNIQUE,
  ai_enabled BOOLEAN NOT NULL DEFAULT false,
  auto_reply_enabled BOOLEAN NOT NULL DEFAULT false,
  require_approval_above_confidence DECIMAL(3,2) NOT NULL DEFAULT 0.8,
  default_tone TEXT NOT NULL DEFAULT 'professional',
  signature TEXT,
  working_hours_enabled BOOLEAN NOT NULL DEFAULT false,
  working_hours_start TIME NOT NULL DEFAULT '09:00',
  working_hours_end TIME NOT NULL DEFAULT '17:00',
  timezone TEXT NOT NULL DEFAULT 'UTC',
  notification_email BOOLEAN NOT NULL DEFAULT true,
  notification_push BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_settings_user ON user_settings(user_id);

-- ============================================
-- AUDIT LOGS TABLE
-- Complete audit trail for compliance
-- ============================================

CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id UUID,
  details JSONB NOT NULL DEFAULT '{}',
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_audit_user ON audit_logs(user_id);
CREATE INDEX idx_audit_action ON audit_logs(action);
CREATE INDEX idx_audit_entity ON audit_logs(entity_type, entity_id);
CREATE INDEX idx_audit_created ON audit_logs(created_at DESC);

-- ============================================
-- EMAIL EMBEDDINGS TABLE
-- For semantic search and context building
-- ============================================

CREATE TABLE email_embeddings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email_id UUID NOT NULL REFERENCES emails(id) ON DELETE CASCADE UNIQUE,
  embedding vector(1536),
  model_used TEXT NOT NULL DEFAULT 'text-embedding-3-small',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_embeddings_email ON email_embeddings(email_id);

-- Create HNSW index for vector similarity search
CREATE INDEX idx_embeddings_vector ON email_embeddings
  USING hnsw (embedding vector_cosine_ops);

-- ============================================
-- FUNCTIONS
-- ============================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at trigger to relevant tables
CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_email_accounts_updated_at
  BEFORE UPDATE ON email_accounts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_email_threads_updated_at
  BEFORE UPDATE ON email_threads
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_ai_drafts_updated_at
  BEFORE UPDATE ON ai_drafts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_ai_rules_updated_at
  BEFORE UPDATE ON ai_rules
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_settings_updated_at
  BEFORE UPDATE ON user_settings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to create audit log entry
CREATE OR REPLACE FUNCTION create_audit_log(
  p_user_id UUID,
  p_action TEXT,
  p_entity_type TEXT,
  p_entity_id UUID,
  p_details JSONB DEFAULT '{}'
)
RETURNS UUID AS $$
DECLARE
  v_log_id UUID;
BEGIN
  INSERT INTO audit_logs (user_id, action, entity_type, entity_id, details)
  VALUES (p_user_id, p_action, p_entity_type, p_entity_id, p_details)
  RETURNING id INTO v_log_id;

  RETURN v_log_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get user's email account ID
CREATE OR REPLACE FUNCTION get_user_email_account_ids(p_user_id UUID)
RETURNS SETOF UUID AS $$
BEGIN
  RETURN QUERY
  SELECT id FROM email_accounts WHERE user_id = p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- ROW LEVEL SECURITY POLICIES
-- ============================================

ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_threads ENABLE ROW LEVEL SECURITY;
ALTER TABLE emails ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_classifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_decisions ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_drafts ENABLE ROW LEVEL SECURITY;
ALTER TABLE approval_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_embeddings ENABLE ROW LEVEL SECURITY;

-- Users policies
CREATE POLICY "Users can view own profile"
  ON users FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON users FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON users FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Email accounts policies
CREATE POLICY "Users can view own email accounts"
  ON email_accounts FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert own email accounts"
  ON email_accounts FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own email accounts"
  ON email_accounts FOR UPDATE
  USING (user_id = auth.uid());

CREATE POLICY "Users can delete own email accounts"
  ON email_accounts FOR DELETE
  USING (user_id = auth.uid());

-- Email threads policies
CREATE POLICY "Users can view own threads"
  ON email_threads FOR SELECT
  USING (email_account_id IN (SELECT get_user_email_account_ids(auth.uid())));

CREATE POLICY "Users can update own threads"
  ON email_threads FOR UPDATE
  USING (email_account_id IN (SELECT get_user_email_account_ids(auth.uid())));

-- Service role can insert threads
CREATE POLICY "Service can insert threads"
  ON email_threads FOR INSERT
  WITH CHECK (true);

-- Emails policies
CREATE POLICY "Users can view own emails"
  ON emails FOR SELECT
  USING (
    thread_id IN (
      SELECT id FROM email_threads
      WHERE email_account_id IN (SELECT get_user_email_account_ids(auth.uid()))
    )
  );

CREATE POLICY "Service can insert emails"
  ON emails FOR INSERT
  WITH CHECK (true);

-- AI classifications policies
CREATE POLICY "Users can view own classifications"
  ON ai_classifications FOR SELECT
  USING (
    email_id IN (
      SELECT e.id FROM emails e
      JOIN email_threads t ON e.thread_id = t.id
      WHERE t.email_account_id IN (SELECT get_user_email_account_ids(auth.uid()))
    )
  );

CREATE POLICY "Service can insert classifications"
  ON ai_classifications FOR INSERT
  WITH CHECK (true);

-- AI decisions policies
CREATE POLICY "Users can view own decisions"
  ON ai_decisions FOR SELECT
  USING (
    thread_id IN (
      SELECT id FROM email_threads
      WHERE email_account_id IN (SELECT get_user_email_account_ids(auth.uid()))
    )
  );

CREATE POLICY "Service can insert decisions"
  ON ai_decisions FOR INSERT
  WITH CHECK (true);

-- AI drafts policies
CREATE POLICY "Users can view own drafts"
  ON ai_drafts FOR SELECT
  USING (
    thread_id IN (
      SELECT id FROM email_threads
      WHERE email_account_id IN (SELECT get_user_email_account_ids(auth.uid()))
    )
  );

CREATE POLICY "Users can update own drafts"
  ON ai_drafts FOR UPDATE
  USING (
    thread_id IN (
      SELECT id FROM email_threads
      WHERE email_account_id IN (SELECT get_user_email_account_ids(auth.uid()))
    )
  );

CREATE POLICY "Service can insert drafts"
  ON ai_drafts FOR INSERT
  WITH CHECK (true);

-- Approval queue policies
CREATE POLICY "Users can view own approvals"
  ON approval_queue FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can update own approvals"
  ON approval_queue FOR UPDATE
  USING (user_id = auth.uid());

CREATE POLICY "Service can insert approvals"
  ON approval_queue FOR INSERT
  WITH CHECK (true);

-- AI rules policies
CREATE POLICY "Users can view own rules"
  ON ai_rules FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert own rules"
  ON ai_rules FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own rules"
  ON ai_rules FOR UPDATE
  USING (user_id = auth.uid());

CREATE POLICY "Users can delete own rules"
  ON ai_rules FOR DELETE
  USING (user_id = auth.uid());

-- User settings policies
CREATE POLICY "Users can view own settings"
  ON user_settings FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert own settings"
  ON user_settings FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own settings"
  ON user_settings FOR UPDATE
  USING (user_id = auth.uid());

-- Audit logs policies
CREATE POLICY "Users can view own audit logs"
  ON audit_logs FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Service can insert audit logs"
  ON audit_logs FOR INSERT
  WITH CHECK (true);

-- Email embeddings policies
CREATE POLICY "Users can view own embeddings"
  ON email_embeddings FOR SELECT
  USING (
    email_id IN (
      SELECT e.id FROM emails e
      JOIN email_threads t ON e.thread_id = t.id
      WHERE t.email_account_id IN (SELECT get_user_email_account_ids(auth.uid()))
    )
  );

CREATE POLICY "Service can insert embeddings"
  ON email_embeddings FOR INSERT
  WITH CHECK (true);

-- ============================================
-- VIEWS FOR COMMON QUERIES
-- ============================================

-- Inbox view with all related data
CREATE OR REPLACE VIEW inbox_view AS
SELECT
  t.id AS thread_id,
  t.email_account_id,
  t.gmail_thread_id,
  t.subject,
  t.snippet,
  t.last_message_at,
  t.message_count,
  t.is_unread,
  t.status,
  t.labels,
  t.participants,
  c.category,
  c.urgency,
  c.safe_to_reply,
  c.confidence,
  d.decision AS ai_decision,
  dr.id AS draft_id,
  dr.body_text AS draft_preview,
  a.status AS approval_status
FROM email_threads t
LEFT JOIN LATERAL (
  SELECT * FROM emails
  WHERE thread_id = t.id
  ORDER BY internal_date DESC
  LIMIT 1
) e ON true
LEFT JOIN ai_classifications c ON c.email_id = e.id
LEFT JOIN ai_decisions d ON d.thread_id = t.id AND d.email_id = e.id
LEFT JOIN ai_drafts dr ON dr.thread_id = t.id AND dr.email_id = e.id AND NOT dr.is_sent
LEFT JOIN approval_queue a ON a.thread_id = t.id AND a.status = 'pending'
ORDER BY t.last_message_at DESC;

-- Pending approvals view
CREATE OR REPLACE VIEW pending_approvals_view AS
SELECT
  a.id AS approval_id,
  a.user_id,
  a.status,
  a.created_at AS queued_at,
  t.id AS thread_id,
  t.subject,
  t.snippet,
  t.participants,
  c.category,
  c.urgency,
  c.confidence,
  d.id AS draft_id,
  d.body_text AS draft_body,
  d.tone,
  dec.decision,
  dec.reasoning AS decision_reasoning
FROM approval_queue a
JOIN email_threads t ON a.thread_id = t.id
JOIN emails e ON a.email_id = e.id
JOIN ai_classifications c ON c.email_id = e.id
JOIN ai_drafts d ON a.draft_id = d.id
JOIN ai_decisions dec ON a.decision_id = dec.id
WHERE a.status = 'pending'
ORDER BY
  CASE c.urgency
    WHEN 'critical' THEN 1
    WHEN 'high' THEN 2
    WHEN 'medium' THEN 3
    ELSE 4
  END,
  a.created_at ASC;
