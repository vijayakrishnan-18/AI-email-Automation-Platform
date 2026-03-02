// AI Rule Templates - Pre-built rules users can select and activate

export interface RuleTemplate {
  id: string;
  name: string;
  description: string;
  category: 'auto-reply' | 'approval' | 'organization' | 'filtering' | 'vip';
  icon: string; // Lucide icon name
  conditions: Array<{
    field: string;
    operator: 'equals' | 'contains' | 'greater_than' | 'less_than' | 'in';
    value: string | number | string[];
  }>;
  action: 'AUTO_SEND' | 'NEEDS_APPROVAL' | 'DRAFT_ONLY' | 'ESCALATE' | 'NO_ACTION';
  priority: number;
  isPopular?: boolean;
}

export const RULE_TEMPLATES: RuleTemplate[] = [
  // ============================================
  // AUTO-REPLY TEMPLATES
  // ============================================
  {
    id: 'auto-reply-support',
    name: 'Auto-Reply to Support Emails',
    description: 'Automatically send AI-generated replies to support inquiries',
    category: 'auto-reply',
    icon: 'HeadphonesIcon',
    conditions: [
      { field: 'category', operator: 'equals', value: 'support' },
    ],
    action: 'AUTO_SEND',
    priority: 10,
    isPopular: true,
  },
  {
    id: 'auto-reply-transactional',
    name: 'Auto-Reply to Transactional Emails',
    description: 'Automatically respond to order confirmations, receipts, and transactional messages',
    category: 'auto-reply',
    icon: 'ReceiptIcon',
    conditions: [
      { field: 'category', operator: 'equals', value: 'transactional' },
    ],
    action: 'AUTO_SEND',
    priority: 8,
  },
  {
    id: 'auto-reply-gmail',
    name: 'Auto-Reply to Gmail Users',
    description: 'Automatically reply to emails from Gmail addresses',
    category: 'auto-reply',
    icon: 'MailIcon',
    conditions: [
      { field: 'sender_email', operator: 'contains', value: '@gmail.com' },
    ],
    action: 'AUTO_SEND',
    priority: 5,
  },
  {
    id: 'auto-reply-low-urgency',
    name: 'Auto-Reply to Low Urgency Emails',
    description: 'Automatically handle non-urgent emails with AI responses',
    category: 'auto-reply',
    icon: 'ClockIcon',
    conditions: [
      { field: 'urgency', operator: 'equals', value: 'low' },
    ],
    action: 'AUTO_SEND',
    priority: 3,
  },
  {
    id: 'auto-reply-high-confidence',
    name: 'Auto-Reply When AI is Confident',
    description: 'Send replies automatically when AI confidence is above 90%',
    category: 'auto-reply',
    icon: 'SparklesIcon',
    conditions: [
      { field: 'confidence', operator: 'greater_than', value: 0.9 },
    ],
    action: 'AUTO_SEND',
    priority: 7,
    isPopular: true,
  },
  {
    id: 'auto-reply-info-requests',
    name: 'Auto-Reply to Information Requests',
    description: 'Automatically respond to general information inquiries',
    category: 'auto-reply',
    icon: 'InfoIcon',
    conditions: [
      { field: 'subject', operator: 'contains', value: 'information' },
    ],
    action: 'AUTO_SEND',
    priority: 6,
  },
  {
    id: 'auto-reply-thank-you',
    name: 'Auto-Reply to Thank You Emails',
    description: 'Automatically acknowledge thank you messages',
    category: 'auto-reply',
    icon: 'HeartIcon',
    conditions: [
      { field: 'subject', operator: 'contains', value: 'thank' },
    ],
    action: 'AUTO_SEND',
    priority: 4,
  },

  // ============================================
  // APPROVAL REQUIRED TEMPLATES
  // ============================================
  {
    id: 'approve-sales',
    name: 'Require Approval for Sales Emails',
    description: 'Always get approval before responding to sales inquiries',
    category: 'approval',
    icon: 'DollarSignIcon',
    conditions: [
      { field: 'category', operator: 'equals', value: 'sales' },
    ],
    action: 'NEEDS_APPROVAL',
    priority: 15,
    isPopular: true,
  },
  {
    id: 'approve-legal',
    name: 'Require Approval for Legal Emails',
    description: 'Always get approval for any legal-related communication',
    category: 'approval',
    icon: 'ScaleIcon',
    conditions: [
      { field: 'category', operator: 'equals', value: 'legal' },
    ],
    action: 'NEEDS_APPROVAL',
    priority: 20,
    isPopular: true,
  },
  {
    id: 'approve-personal',
    name: 'Require Approval for Personal Emails',
    description: 'Review personal emails before AI sends a response',
    category: 'approval',
    icon: 'UserIcon',
    conditions: [
      { field: 'category', operator: 'equals', value: 'personal' },
    ],
    action: 'NEEDS_APPROVAL',
    priority: 12,
  },
  {
    id: 'approve-high-urgency',
    name: 'Require Approval for Urgent Emails',
    description: 'Get approval for critical and high-urgency messages',
    category: 'approval',
    icon: 'AlertTriangleIcon',
    conditions: [
      { field: 'urgency', operator: 'in', value: ['critical', 'high'] },
    ],
    action: 'NEEDS_APPROVAL',
    priority: 18,
    isPopular: true,
  },
  {
    id: 'approve-low-confidence',
    name: 'Require Approval When AI is Uncertain',
    description: 'Get approval when AI confidence is below 70%',
    category: 'approval',
    icon: 'HelpCircleIcon',
    conditions: [
      { field: 'confidence', operator: 'less_than', value: 0.7 },
    ],
    action: 'NEEDS_APPROVAL',
    priority: 14,
  },
  {
    id: 'approve-complaints',
    name: 'Require Approval for Complaints',
    description: 'Always review before responding to complaint emails',
    category: 'approval',
    icon: 'FrownIcon',
    conditions: [
      { field: 'subject', operator: 'contains', value: 'complaint' },
    ],
    action: 'NEEDS_APPROVAL',
    priority: 17,
  },
  {
    id: 'approve-refund-requests',
    name: 'Require Approval for Refund Requests',
    description: 'Review all refund-related emails before responding',
    category: 'approval',
    icon: 'RotateCcwIcon',
    conditions: [
      { field: 'subject', operator: 'contains', value: 'refund' },
    ],
    action: 'NEEDS_APPROVAL',
    priority: 16,
  },
  {
    id: 'approve-pricing',
    name: 'Require Approval for Pricing Questions',
    description: 'Get approval before discussing pricing or quotes',
    category: 'approval',
    icon: 'TagIcon',
    conditions: [
      { field: 'subject', operator: 'contains', value: 'price' },
    ],
    action: 'NEEDS_APPROVAL',
    priority: 13,
  },

  // ============================================
  // ESCALATION TEMPLATES
  // ============================================
  {
    id: 'escalate-legal-urgent',
    name: 'Escalate Urgent Legal Matters',
    description: 'Immediately flag urgent legal emails for human attention',
    category: 'vip',
    icon: 'AlertOctagonIcon',
    conditions: [
      { field: 'category', operator: 'equals', value: 'legal' },
      { field: 'urgency', operator: 'equals', value: 'critical' },
    ],
    action: 'ESCALATE',
    priority: 25,
  },
  {
    id: 'escalate-vip-domain',
    name: 'Escalate VIP Domain Emails',
    description: 'Escalate emails from important company domains',
    category: 'vip',
    icon: 'StarIcon',
    conditions: [
      { field: 'sender_email', operator: 'contains', value: '@enterprise.com' },
    ],
    action: 'ESCALATE',
    priority: 22,
  },
  {
    id: 'escalate-executive',
    name: 'Escalate Executive Communications',
    description: 'Flag emails with executive titles in subject',
    category: 'vip',
    icon: 'BriefcaseIcon',
    conditions: [
      { field: 'subject', operator: 'contains', value: 'CEO' },
    ],
    action: 'ESCALATE',
    priority: 23,
  },
  {
    id: 'escalate-security',
    name: 'Escalate Security Issues',
    description: 'Immediately flag security-related emails',
    category: 'vip',
    icon: 'ShieldIcon',
    conditions: [
      { field: 'subject', operator: 'contains', value: 'security' },
    ],
    action: 'ESCALATE',
    priority: 24,
  },

  // ============================================
  // FILTERING / NO ACTION TEMPLATES
  // ============================================
  {
    id: 'ignore-newsletters',
    name: 'Ignore Newsletters',
    description: 'Skip AI processing for newsletter emails',
    category: 'filtering',
    icon: 'NewspaperIcon',
    conditions: [
      { field: 'category', operator: 'equals', value: 'newsletter' },
    ],
    action: 'NO_ACTION',
    priority: 5,
    isPopular: true,
  },
  {
    id: 'ignore-spam',
    name: 'Ignore Spam',
    description: 'Skip AI processing for spam emails',
    category: 'filtering',
    icon: 'TrashIcon',
    conditions: [
      { field: 'category', operator: 'equals', value: 'spam' },
    ],
    action: 'NO_ACTION',
    priority: 5,
  },
  {
    id: 'ignore-noreply',
    name: 'Ignore No-Reply Addresses',
    description: 'Skip emails from no-reply addresses',
    category: 'filtering',
    icon: 'BanIcon',
    conditions: [
      { field: 'sender_email', operator: 'contains', value: 'noreply' },
    ],
    action: 'NO_ACTION',
    priority: 6,
  },
  {
    id: 'ignore-donotreply',
    name: 'Ignore Do-Not-Reply Addresses',
    description: 'Skip emails from do-not-reply addresses',
    category: 'filtering',
    icon: 'BanIcon',
    conditions: [
      { field: 'sender_email', operator: 'contains', value: 'do-not-reply' },
    ],
    action: 'NO_ACTION',
    priority: 6,
  },
  {
    id: 'ignore-automated',
    name: 'Ignore Automated Notifications',
    description: 'Skip automated system notifications',
    category: 'filtering',
    icon: 'BotIcon',
    conditions: [
      { field: 'sender_email', operator: 'contains', value: 'notifications@' },
    ],
    action: 'NO_ACTION',
    priority: 4,
  },
  {
    id: 'ignore-calendar',
    name: 'Ignore Calendar Invites',
    description: 'Skip calendar invitation emails',
    category: 'filtering',
    icon: 'CalendarIcon',
    conditions: [
      { field: 'subject', operator: 'contains', value: 'calendar' },
    ],
    action: 'NO_ACTION',
    priority: 4,
  },
  {
    id: 'ignore-unsubscribe',
    name: 'Ignore Unsubscribe Confirmations',
    description: 'Skip unsubscribe confirmation emails',
    category: 'filtering',
    icon: 'MailMinusIcon',
    conditions: [
      { field: 'subject', operator: 'contains', value: 'unsubscribe' },
    ],
    action: 'NO_ACTION',
    priority: 3,
  },

  // ============================================
  // DRAFT ONLY TEMPLATES
  // ============================================
  {
    id: 'draft-medium-urgency',
    name: 'Draft Only for Medium Urgency',
    description: 'Create drafts for medium-urgency emails to review later',
    category: 'organization',
    icon: 'FileTextIcon',
    conditions: [
      { field: 'urgency', operator: 'equals', value: 'medium' },
    ],
    action: 'DRAFT_ONLY',
    priority: 8,
  },
  {
    id: 'draft-other-category',
    name: 'Draft Only for Uncategorized',
    description: 'Create drafts for emails that don\'t fit other categories',
    category: 'organization',
    icon: 'FolderIcon',
    conditions: [
      { field: 'category', operator: 'equals', value: 'other' },
    ],
    action: 'DRAFT_ONLY',
    priority: 5,
  },
  {
    id: 'draft-meeting-requests',
    name: 'Draft Only for Meeting Requests',
    description: 'Create drafts for meeting-related emails',
    category: 'organization',
    icon: 'UsersIcon',
    conditions: [
      { field: 'subject', operator: 'contains', value: 'meeting' },
    ],
    action: 'DRAFT_ONLY',
    priority: 7,
  },
  {
    id: 'draft-feedback',
    name: 'Draft Only for Feedback',
    description: 'Create drafts for feedback emails to review',
    category: 'organization',
    icon: 'MessageSquareIcon',
    conditions: [
      { field: 'subject', operator: 'contains', value: 'feedback' },
    ],
    action: 'DRAFT_ONLY',
    priority: 6,
  },

  // ============================================
  // DOMAIN-SPECIFIC TEMPLATES
  // ============================================
  {
    id: 'auto-reply-outlook',
    name: 'Auto-Reply to Outlook Users',
    description: 'Automatically reply to emails from Outlook addresses',
    category: 'auto-reply',
    icon: 'MailIcon',
    conditions: [
      { field: 'sender_email', operator: 'contains', value: '@outlook.com' },
    ],
    action: 'AUTO_SEND',
    priority: 5,
  },
  {
    id: 'auto-reply-yahoo',
    name: 'Auto-Reply to Yahoo Users',
    description: 'Automatically reply to emails from Yahoo addresses',
    category: 'auto-reply',
    icon: 'MailIcon',
    conditions: [
      { field: 'sender_email', operator: 'contains', value: '@yahoo.com' },
    ],
    action: 'AUTO_SEND',
    priority: 5,
  },
  {
    id: 'approve-edu-domain',
    name: 'Require Approval for Education Emails',
    description: 'Review emails from educational institutions',
    category: 'approval',
    icon: 'GraduationCapIcon',
    conditions: [
      { field: 'sender_email', operator: 'contains', value: '.edu' },
    ],
    action: 'NEEDS_APPROVAL',
    priority: 10,
  },
  {
    id: 'approve-gov-domain',
    name: 'Require Approval for Government Emails',
    description: 'Always review emails from government domains',
    category: 'approval',
    icon: 'BuildingIcon',
    conditions: [
      { field: 'sender_email', operator: 'contains', value: '.gov' },
    ],
    action: 'NEEDS_APPROVAL',
    priority: 18,
  },

  // ============================================
  // SUBJECT-BASED TEMPLATES
  // ============================================
  {
    id: 'approve-urgent-subject',
    name: 'Require Approval for "Urgent" Subjects',
    description: 'Review emails with "urgent" in the subject line',
    category: 'approval',
    icon: 'ZapIcon',
    conditions: [
      { field: 'subject', operator: 'contains', value: 'urgent' },
    ],
    action: 'NEEDS_APPROVAL',
    priority: 15,
  },
  {
    id: 'approve-asap-subject',
    name: 'Require Approval for "ASAP" Subjects',
    description: 'Review emails with "ASAP" in the subject line',
    category: 'approval',
    icon: 'ZapIcon',
    conditions: [
      { field: 'subject', operator: 'contains', value: 'ASAP' },
    ],
    action: 'NEEDS_APPROVAL',
    priority: 15,
  },
  {
    id: 'auto-reply-inquiry',
    name: 'Auto-Reply to Inquiries',
    description: 'Automatically respond to general inquiries',
    category: 'auto-reply',
    icon: 'HelpCircleIcon',
    conditions: [
      { field: 'subject', operator: 'contains', value: 'inquiry' },
    ],
    action: 'AUTO_SEND',
    priority: 7,
  },
  {
    id: 'auto-reply-question',
    name: 'Auto-Reply to Questions',
    description: 'Automatically respond to question emails',
    category: 'auto-reply',
    icon: 'MessageCircleIcon',
    conditions: [
      { field: 'subject', operator: 'contains', value: 'question' },
    ],
    action: 'AUTO_SEND',
    priority: 6,
  },
];

// Get templates by category
export function getTemplatesByCategory(category: RuleTemplate['category']): RuleTemplate[] {
  return RULE_TEMPLATES.filter((t) => t.category === category);
}

// Get popular templates
export function getPopularTemplates(): RuleTemplate[] {
  return RULE_TEMPLATES.filter((t) => t.isPopular);
}

// Get all categories with counts
export function getTemplateCategories(): Array<{
  id: RuleTemplate['category'];
  name: string;
  description: string;
  count: number;
}> {
  return [
    {
      id: 'auto-reply',
      name: 'Auto-Reply',
      description: 'Automatically send AI-generated responses',
      count: RULE_TEMPLATES.filter((t) => t.category === 'auto-reply').length,
    },
    {
      id: 'approval',
      name: 'Require Approval',
      description: 'Always get your approval before sending',
      count: RULE_TEMPLATES.filter((t) => t.category === 'approval').length,
    },
    {
      id: 'organization',
      name: 'Organization',
      description: 'Save as drafts for later review',
      count: RULE_TEMPLATES.filter((t) => t.category === 'organization').length,
    },
    {
      id: 'filtering',
      name: 'Filtering',
      description: 'Skip AI processing for certain emails',
      count: RULE_TEMPLATES.filter((t) => t.category === 'filtering').length,
    },
    {
      id: 'vip',
      name: 'VIP & Escalation',
      description: 'Flag important emails for immediate attention',
      count: RULE_TEMPLATES.filter((t) => t.category === 'vip').length,
    },
  ];
}

// Search templates
export function searchTemplates(query: string): RuleTemplate[] {
  const lowerQuery = query.toLowerCase();
  return RULE_TEMPLATES.filter(
    (t) =>
      t.name.toLowerCase().includes(lowerQuery) ||
      t.description.toLowerCase().includes(lowerQuery)
  );
}
