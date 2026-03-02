export interface EmailTemplate {
  id: string;
  name: string;
  category: string;
  description: string;
  subject: string;
  body: string;
  variables: string[]; // Placeholders that user should fill
}

export const EMAIL_TEMPLATES: EmailTemplate[] = [
  // Welcome & Onboarding
  {
    id: 'welcome-new-user',
    name: 'Welcome New User',
    category: 'Onboarding',
    description: 'Welcome a new user/customer to your platform',
    subject: 'Welcome to {{company_name}}!',
    body: `Hi {{name}},

Welcome to {{company_name}}! We're thrilled to have you on board.

Here's what you can do next:
• Explore our features
• Complete your profile
• Check out our getting started guide

If you have any questions, feel free to reach out to our support team.

Best regards,
{{sender_name}}`,
    variables: ['name', 'company_name', 'sender_name'],
  },
  {
    id: 'onboarding-followup',
    name: 'Onboarding Follow-up',
    category: 'Onboarding',
    description: 'Follow up with new users after signup',
    subject: 'How is your experience with {{company_name}}?',
    body: `Hi {{name}},

It's been a few days since you joined {{company_name}}, and I wanted to check in.

How has your experience been so far? Is there anything I can help you with?

I'm here if you need any assistance getting started.

Best,
{{sender_name}}`,
    variables: ['name', 'company_name', 'sender_name'],
  },

  // Sales & Business
  {
    id: 'sales-intro',
    name: 'Sales Introduction',
    category: 'Sales',
    description: 'Introduce yourself and your product/service',
    subject: 'Quick intro - {{company_name}}',
    body: `Hi {{name}},

I came across {{their_company}} and thought our {{product_service}} might be a great fit for your team.

{{value_proposition}}

Would you be open to a quick 15-minute call this week to explore this further?

Best regards,
{{sender_name}}`,
    variables: ['name', 'their_company', 'company_name', 'product_service', 'value_proposition', 'sender_name'],
  },
  {
    id: 'sales-followup',
    name: 'Sales Follow-up',
    category: 'Sales',
    description: 'Follow up on a previous sales conversation',
    subject: 'Following up on our conversation',
    body: `Hi {{name}},

I wanted to follow up on our recent conversation about {{topic}}.

Have you had a chance to think about {{next_step}}?

I'm happy to answer any questions or schedule another call if that would be helpful.

Looking forward to hearing from you.

Best,
{{sender_name}}`,
    variables: ['name', 'topic', 'next_step', 'sender_name'],
  },
  {
    id: 'proposal-send',
    name: 'Send Proposal',
    category: 'Sales',
    description: 'Send a business proposal',
    subject: 'Proposal for {{project_name}}',
    body: `Hi {{name}},

Thank you for the opportunity to submit this proposal for {{project_name}}.

Please find attached our detailed proposal covering:
• Scope of work
• Timeline
• Pricing

I'm available to discuss any questions you might have.

Best regards,
{{sender_name}}`,
    variables: ['name', 'project_name', 'sender_name'],
  },

  // Customer Support
  {
    id: 'support-acknowledgment',
    name: 'Support Ticket Acknowledgment',
    category: 'Support',
    description: 'Acknowledge receipt of a support request',
    subject: 'Re: {{ticket_subject}} [Ticket #{{ticket_id}}]',
    body: `Hi {{name}},

Thank you for reaching out. We've received your support request and a member of our team is looking into it.

Your ticket number is #{{ticket_id}}. You can expect a response within {{response_time}}.

In the meantime, you might find our help center useful: {{help_center_url}}

Best,
{{sender_name}}
Customer Support Team`,
    variables: ['name', 'ticket_subject', 'ticket_id', 'response_time', 'help_center_url', 'sender_name'],
  },
  {
    id: 'support-resolution',
    name: 'Issue Resolved',
    category: 'Support',
    description: 'Notify customer that their issue is resolved',
    subject: 'Your issue has been resolved [Ticket #{{ticket_id}}]',
    body: `Hi {{name}},

Great news! We've resolved the issue you reported.

{{resolution_details}}

Please let us know if you experience any further problems or have questions.

Thank you for your patience!

Best,
{{sender_name}}`,
    variables: ['name', 'ticket_id', 'resolution_details', 'sender_name'],
  },

  // Orders & Transactions
  {
    id: 'order-confirmation',
    name: 'Order Confirmation',
    category: 'Orders',
    description: 'Confirm a customer order',
    subject: 'Order Confirmed - #{{order_id}}',
    body: `Hi {{name}},

Thank you for your order! Here are the details:

Order #: {{order_id}}
Items: {{order_items}}
Total: {{order_total}}

Expected delivery: {{delivery_date}}

Track your order: {{tracking_url}}

Questions? Reply to this email or contact us.

Thank you for shopping with us!

Best,
{{sender_name}}`,
    variables: ['name', 'order_id', 'order_items', 'order_total', 'delivery_date', 'tracking_url', 'sender_name'],
  },
  {
    id: 'shipping-notification',
    name: 'Shipping Notification',
    category: 'Orders',
    description: 'Notify customer that order has shipped',
    subject: 'Your order #{{order_id}} has shipped!',
    body: `Hi {{name}},

Exciting news - your order is on its way!

Order #: {{order_id}}
Carrier: {{carrier}}
Tracking #: {{tracking_number}}
Track here: {{tracking_url}}

Estimated arrival: {{estimated_arrival}}

Best,
{{sender_name}}`,
    variables: ['name', 'order_id', 'carrier', 'tracking_number', 'tracking_url', 'estimated_arrival', 'sender_name'],
  },
  {
    id: 'payment-receipt',
    name: 'Payment Receipt',
    category: 'Orders',
    description: 'Send payment confirmation receipt',
    subject: 'Payment Receipt - {{invoice_number}}',
    body: `Hi {{name}},

Thank you for your payment. Here's your receipt:

Invoice #: {{invoice_number}}
Amount: {{amount}}
Date: {{payment_date}}
Payment Method: {{payment_method}}

This receipt serves as confirmation of your payment.

Best,
{{sender_name}}`,
    variables: ['name', 'invoice_number', 'amount', 'payment_date', 'payment_method', 'sender_name'],
  },

  // Meeting & Scheduling
  {
    id: 'meeting-request',
    name: 'Meeting Request',
    category: 'Meetings',
    description: 'Request a meeting',
    subject: 'Meeting Request: {{meeting_topic}}',
    body: `Hi {{name}},

I'd like to schedule a meeting to discuss {{meeting_topic}}.

Would any of these times work for you?
{{available_times}}

The meeting should take about {{duration}}.

Let me know what works best for you.

Best,
{{sender_name}}`,
    variables: ['name', 'meeting_topic', 'available_times', 'duration', 'sender_name'],
  },
  {
    id: 'meeting-confirmation',
    name: 'Meeting Confirmation',
    category: 'Meetings',
    description: 'Confirm a scheduled meeting',
    subject: 'Confirmed: {{meeting_topic}} - {{meeting_date}}',
    body: `Hi {{name}},

This is to confirm our meeting:

Topic: {{meeting_topic}}
Date: {{meeting_date}}
Time: {{meeting_time}}
Location/Link: {{meeting_location}}

Agenda:
{{agenda}}

Looking forward to our discussion!

Best,
{{sender_name}}`,
    variables: ['name', 'meeting_topic', 'meeting_date', 'meeting_time', 'meeting_location', 'agenda', 'sender_name'],
  },
  {
    id: 'meeting-reschedule',
    name: 'Reschedule Meeting',
    category: 'Meetings',
    description: 'Request to reschedule a meeting',
    subject: 'Request to Reschedule: {{meeting_topic}}',
    body: `Hi {{name}},

I apologize, but I need to reschedule our meeting originally planned for {{original_date}}.

Would any of these alternative times work?
{{new_times}}

I'm sorry for any inconvenience this may cause.

Best,
{{sender_name}}`,
    variables: ['name', 'meeting_topic', 'original_date', 'new_times', 'sender_name'],
  },

  // Thank You & Appreciation
  {
    id: 'thank-you-purchase',
    name: 'Thank You for Purchase',
    category: 'Thank You',
    description: 'Thank customer for their purchase',
    subject: 'Thank you for your purchase!',
    body: `Hi {{name}},

Thank you so much for your recent purchase of {{product}}!

We truly appreciate your business and hope you love your new {{product}}.

If you have any questions or need assistance, don't hesitate to reach out.

We'd also love to hear your feedback when you get a chance!

Best,
{{sender_name}}`,
    variables: ['name', 'product', 'sender_name'],
  },
  {
    id: 'thank-you-meeting',
    name: 'Thank You for Meeting',
    category: 'Thank You',
    description: 'Thank someone after a meeting',
    subject: 'Great meeting today!',
    body: `Hi {{name}},

Thank you for taking the time to meet with me today.

I really enjoyed our discussion about {{topic}} and I'm excited about {{next_steps}}.

As discussed, I will {{action_items}}.

Looking forward to our continued collaboration!

Best,
{{sender_name}}`,
    variables: ['name', 'topic', 'next_steps', 'action_items', 'sender_name'],
  },
  {
    id: 'thank-you-referral',
    name: 'Thank You for Referral',
    category: 'Thank You',
    description: 'Thank someone for a referral',
    subject: 'Thank you for the referral!',
    body: `Hi {{name}},

I wanted to personally thank you for referring {{referred_person}} to us.

Referrals from satisfied customers like you mean the world to us!

As a token of our appreciation, {{reward_details}}.

Thank you again for your trust and support.

Best,
{{sender_name}}`,
    variables: ['name', 'referred_person', 'reward_details', 'sender_name'],
  },

  // Feedback & Reviews
  {
    id: 'feedback-request',
    name: 'Request Feedback',
    category: 'Feedback',
    description: 'Ask for customer feedback',
    subject: 'We\'d love your feedback!',
    body: `Hi {{name}},

We hope you're enjoying {{product_service}}!

Your feedback helps us improve. Would you mind taking a quick {{survey_duration}} survey?

{{survey_link}}

As a thank you, {{incentive}}.

Best,
{{sender_name}}`,
    variables: ['name', 'product_service', 'survey_duration', 'survey_link', 'incentive', 'sender_name'],
  },
  {
    id: 'review-request',
    name: 'Request Review',
    category: 'Feedback',
    description: 'Ask customer to leave a review',
    subject: 'How did we do?',
    body: `Hi {{name}},

Thank you for choosing {{company_name}}!

If you had a great experience, we'd really appreciate if you could share it with others by leaving a review:

{{review_link}}

Your review helps other customers make informed decisions and helps us grow!

Thank you so much!

Best,
{{sender_name}}`,
    variables: ['name', 'company_name', 'review_link', 'sender_name'],
  },

  // Reminders & Notifications
  {
    id: 'payment-reminder',
    name: 'Payment Reminder',
    category: 'Reminders',
    description: 'Remind about upcoming or overdue payment',
    subject: 'Payment Reminder - Invoice #{{invoice_number}}',
    body: `Hi {{name}},

This is a friendly reminder that invoice #{{invoice_number}} for {{amount}} is due on {{due_date}}.

You can make your payment here: {{payment_link}}

If you've already made this payment, please disregard this message.

Questions about your invoice? Just reply to this email.

Best,
{{sender_name}}`,
    variables: ['name', 'invoice_number', 'amount', 'due_date', 'payment_link', 'sender_name'],
  },
  {
    id: 'renewal-reminder',
    name: 'Subscription Renewal',
    category: 'Reminders',
    description: 'Remind about upcoming subscription renewal',
    subject: 'Your {{product}} subscription renews soon',
    body: `Hi {{name}},

Just a heads up - your {{product}} subscription will renew on {{renewal_date}}.

Renewal amount: {{amount}}
Payment method: {{payment_method}}

No action needed if you wish to continue. To manage your subscription: {{manage_link}}

Best,
{{sender_name}}`,
    variables: ['name', 'product', 'renewal_date', 'amount', 'payment_method', 'manage_link', 'sender_name'],
  },

  // Apologies
  {
    id: 'apology-delay',
    name: 'Apology for Delay',
    category: 'Apologies',
    description: 'Apologize for a delayed order or response',
    subject: 'We apologize for the delay',
    body: `Hi {{name}},

I sincerely apologize for the delay with {{issue}}.

{{explanation}}

We're working hard to resolve this, and {{resolution_timeline}}.

To make up for this inconvenience, {{compensation}}.

Thank you for your patience and understanding.

Best,
{{sender_name}}`,
    variables: ['name', 'issue', 'explanation', 'resolution_timeline', 'compensation', 'sender_name'],
  },
  {
    id: 'apology-mistake',
    name: 'Apology for Mistake',
    category: 'Apologies',
    description: 'Apologize for an error or mistake',
    subject: 'Our apologies - We made a mistake',
    body: `Hi {{name}},

I want to personally apologize for {{mistake}}.

This isn't the experience we want for our customers, and we're taking steps to ensure it doesn't happen again.

To make things right, {{resolution}}.

Thank you for bringing this to our attention.

Sincerely,
{{sender_name}}`,
    variables: ['name', 'mistake', 'resolution', 'sender_name'],
  },

  // General
  {
    id: 'introduction',
    name: 'Self Introduction',
    category: 'General',
    description: 'Introduce yourself to someone new',
    subject: 'Nice to meet you - {{sender_name}}',
    body: `Hi {{name}},

I'm {{sender_name}}, {{your_role}} at {{company_name}}.

{{introduction_context}}

I'd love to {{purpose}}.

Would you be open to {{call_to_action}}?

Best,
{{sender_name}}`,
    variables: ['name', 'sender_name', 'your_role', 'company_name', 'introduction_context', 'purpose', 'call_to_action'],
  },
  {
    id: 'update-announcement',
    name: 'Update/Announcement',
    category: 'General',
    description: 'Share an update or announcement',
    subject: '{{announcement_title}}',
    body: `Hi {{name}},

I'm excited to share some news with you!

{{announcement_details}}

What this means for you:
{{impact}}

{{call_to_action}}

Best,
{{sender_name}}`,
    variables: ['name', 'announcement_title', 'announcement_details', 'impact', 'call_to_action', 'sender_name'],
  },
];

export const TEMPLATE_CATEGORIES = [
  'All',
  'Onboarding',
  'Sales',
  'Support',
  'Orders',
  'Meetings',
  'Thank You',
  'Feedback',
  'Reminders',
  'Apologies',
  'General',
];

export function getTemplatesByCategory(category: string): EmailTemplate[] {
  if (category === 'All') {
    return EMAIL_TEMPLATES;
  }
  return EMAIL_TEMPLATES.filter((t) => t.category === category);
}

export function getTemplateById(id: string): EmailTemplate | undefined {
  return EMAIL_TEMPLATES.find((t) => t.id === id);
}
