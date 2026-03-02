// ============================================
// Core Domain Types for AI Email OS
// ============================================

export type EmailCategory =
  | 'sales'
  | 'support'
  | 'personal'
  | 'legal'
  | 'spam'
  | 'newsletter'
  | 'transactional'
  | 'other';

export type Urgency = 'low' | 'medium' | 'high' | 'critical';

export type AIDecisionType =
  | 'AUTO_SEND'
  | 'DRAFT_ONLY'
  | 'NEEDS_APPROVAL'
  | 'ESCALATE'
  | 'NO_ACTION';

export type ApprovalStatus =
  | 'pending'
  | 'approved'
  | 'rejected'
  | 'modified';

export type EmailStatus =
  | 'unread'
  | 'read'
  | 'replied'
  | 'archived'
  | 'deleted';

// ============================================
// Database Entity Types
// ============================================

export interface User {
  id: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
  ai_enabled: boolean;
  auto_reply_enabled: boolean;
  created_at: string;
  updated_at: string;
}

export interface EmailAccount {
  id: string;
  user_id: string;
  email_address: string;
  provider: 'gmail';
  access_token_encrypted: string;
  refresh_token_encrypted: string;
  token_expires_at: string;
  scopes: string[];
  is_active: boolean;
  last_sync_at: string | null;
  watch_expiration: string | null;
  history_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface EmailThread {
  id: string;
  email_account_id: string;
  gmail_thread_id: string;
  subject: string;
  snippet: string;
  last_message_at: string;
  message_count: number;
  is_unread: boolean;
  labels: string[];
  participants: EmailParticipant[];
  created_at: string;
  updated_at: string;
}

export interface EmailParticipant {
  email: string;
  name: string | null;
  type: 'from' | 'to' | 'cc' | 'bcc';
}

export interface Email {
  id: string;
  thread_id: string;
  gmail_message_id: string;
  from_address: string;
  from_name: string | null;
  to_addresses: string[];
  cc_addresses: string[];
  subject: string;
  snippet: string;
  body_text: string | null;
  body_html: string | null;
  headers: Record<string, string>;
  internal_date: string;
  is_incoming: boolean;
  attachments: EmailAttachment[];
  created_at: string;
}

export interface EmailAttachment {
  id: string;
  filename: string;
  mime_type: string;
  size: number;
}

export interface AIClassification {
  id: string;
  email_id: string;
  category: EmailCategory;
  urgency: Urgency;
  safe_to_reply: boolean;
  confidence: number;
  reasoning: string;
  model_used: string;
  tokens_used: number;
  created_at: string;
}

export interface AIDecision {
  id: string;
  thread_id: string;
  email_id: string;
  decision: AIDecisionType;
  reasoning: string;
  confidence: number;
  rule_id: string | null;
  model_used: string;
  created_at: string;
}

export interface AIDraft {
  id: string;
  thread_id: string;
  email_id: string;
  decision_id: string;
  subject: string;
  body_text: string;
  body_html: string | null;
  tone: string;
  model_used: string;
  tokens_used: number;
  version: number;
  is_sent: boolean;
  sent_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface ApprovalQueueItem {
  id: string;
  user_id: string;
  thread_id: string;
  email_id: string;
  draft_id: string;
  decision_id: string;
  status: ApprovalStatus;
  reviewed_at: string | null;
  reviewer_notes: string | null;
  created_at: string;
}

export interface AIRule {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  is_active: boolean;
  priority: number;
  conditions: AIRuleCondition[];
  action: AIDecisionType;
  auto_approve: boolean;
  created_at: string;
  updated_at: string;
}

export interface AIRuleCondition {
  field: 'category' | 'urgency' | 'sender' | 'subject' | 'confidence';
  operator: 'equals' | 'contains' | 'greater_than' | 'less_than' | 'in';
  value: string | number | string[];
}

export interface AuditLog {
  id: string;
  user_id: string;
  action: string;
  entity_type: string;
  entity_id: string;
  details: Record<string, unknown>;
  ip_address: string | null;
  user_agent: string | null;
  created_at: string;
}

export interface UserSettings {
  id: string;
  user_id: string;
  ai_enabled: boolean;
  auto_reply_enabled: boolean;
  require_approval_above_confidence: number;
  default_tone: string;
  signature: string | null;
  working_hours_enabled: boolean;
  working_hours_start: string;
  working_hours_end: string;
  timezone: string;
  notification_email: boolean;
  notification_push: boolean;
  created_at: string;
  updated_at: string;
}

// ============================================
// API Request/Response Types
// ============================================

export interface ClassificationResult {
  category: EmailCategory;
  urgency: Urgency;
  safe_to_reply: boolean;
  confidence: number;
  reasoning: string;
}

export interface DraftGenerationResult {
  subject: string;
  body_text: string;
  body_html: string | null;
  tone: string;
  tokens_used: number;
}

export interface DecisionResult {
  decision: AIDecisionType;
  reasoning: string;
  confidence: number;
  matched_rule_id: string | null;
}

export interface ThreadWithDetails extends EmailThread {
  emails: Email[];
  classification: AIClassification | null;
  decision: AIDecision | null;
  draft: AIDraft | null;
  approval: ApprovalQueueItem | null;
}

export interface InboxStats {
  total: number;
  unread: number;
  pending_approval: number;
  auto_replied: number;
  by_category: Record<EmailCategory, number>;
}

// ============================================
// Gmail API Types
// ============================================

export interface GmailTokens {
  access_token: string;
  refresh_token: string;
  expiry_date: number;
  scope: string;
  token_type: string;
}

export interface GmailPushNotification {
  message: {
    data: string;
    messageId: string;
    publishTime: string;
  };
  subscription: string;
}

export interface GmailHistoryEvent {
  historyId: string;
  messagesAdded?: Array<{ message: { id: string; threadId: string } }>;
  messagesDeleted?: Array<{ message: { id: string; threadId: string } }>;
  labelsAdded?: Array<{ message: { id: string }; labelIds: string[] }>;
  labelsRemoved?: Array<{ message: { id: string }; labelIds: string[] }>;
}

// ============================================
// Component Props Types
// ============================================

export interface EmailListItemProps {
  thread: EmailThread;
  classification: AIClassification | null;
  isSelected: boolean;
  onClick: () => void;
}

export interface EmailViewerProps {
  thread: ThreadWithDetails;
  onApprove: (draftId: string) => void;
  onReject: (draftId: string) => void;
  onEdit: (draftId: string, content: string) => void;
}

export interface ApprovalCardProps {
  item: ApprovalQueueItem & {
    thread: EmailThread;
    draft: AIDraft;
    classification: AIClassification;
  };
  onApprove: () => void;
  onReject: () => void;
  onEdit: () => void;
}

export interface RuleBuilderProps {
  rule?: AIRule;
  onSave: (rule: Omit<AIRule, 'id' | 'created_at' | 'updated_at'>) => void;
  onCancel: () => void;
}
