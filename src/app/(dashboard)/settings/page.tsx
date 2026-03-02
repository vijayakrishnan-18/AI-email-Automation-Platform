'use client';

import { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Loader2, Save, Mail, AlertTriangle, CheckCircle } from 'lucide-react';

interface Settings {
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
}

interface EmailAccount {
  id: string;
  email_address: string;
  is_active: boolean;
  last_sync_at: string | null;
}

const TONES = [
  { value: 'professional', label: 'Professional' },
  { value: 'friendly', label: 'Friendly' },
  { value: 'formal', label: 'Formal' },
  { value: 'casual', label: 'Casual' },
];

const TIMEZONES = [
  'UTC',
  'America/New_York',
  'America/Chicago',
  'America/Denver',
  'America/Los_Angeles',
  'Europe/London',
  'Europe/Paris',
  'Asia/Tokyo',
  'Asia/Singapore',
  'Australia/Sydney',
];

export default function SettingsPage() {
  const [settings, setSettings] = useState<Settings | null>(null);
  const [emailAccounts, setEmailAccounts] = useState<EmailAccount[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/settings');
      const { data } = await response.json();

      if (data?.settings) {
        setSettings(data.settings);
      }
      if (data?.emailAccounts) {
        setEmailAccounts(data.emailAccounts);
      }
    } catch (error) {
      console.error('Error fetching settings:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    if (!settings) return;

    setIsSaving(true);
    setSaveSuccess(false);

    try {
      const response = await fetch('/api/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      });

      if (response.ok) {
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 3000);
      }
    } catch (error) {
      console.error('Error saving settings:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const updateSetting = <K extends keyof Settings>(key: K, value: Settings[K]) => {
    setSettings((prev) => (prev ? { ...prev, [key]: value } : null));
  };

  if (isLoading || !settings) {
    return (
      <DashboardLayout title="Settings">
        <div className="flex h-full items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Settings">
      <div className="mx-auto max-w-3xl p-6">
        {/* Connected Accounts */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5" />
              Connected Email Accounts
            </CardTitle>
            <CardDescription>
              Manage your connected Gmail accounts.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {emailAccounts.map((account) => (
                <div
                  key={account.id}
                  className="flex items-center justify-between rounded-md border p-3"
                >
                  <div>
                    <p className="font-medium">{account.email_address}</p>
                    {account.last_sync_at && (
                      <p className="text-xs text-muted-foreground">
                        Last synced:{' '}
                        {new Date(account.last_sync_at).toLocaleString()}
                      </p>
                    )}
                  </div>
                  {account.is_active ? (
                    <CheckCircle className="h-5 w-5 text-green-500" />
                  ) : (
                    <AlertTriangle className="h-5 w-5 text-yellow-500" />
                  )}
                </div>
              ))}
              <Button
                variant="outline"
                onClick={() => (window.location.href = '/connect-email')}
              >
                <Mail className="mr-2 h-4 w-4" />
                Connect Another Account
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* AI Settings */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>AI Settings</CardTitle>
            <CardDescription>
              Configure how the AI handles your emails.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* AI Enabled */}
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Enable AI Processing</p>
                <p className="text-sm text-muted-foreground">
                  Allow AI to classify and draft replies for incoming emails.
                </p>
              </div>
              <Switch
                checked={settings.ai_enabled}
                onCheckedChange={(checked) => updateSetting('ai_enabled', checked)}
              />
            </div>

            <Separator />

            {/* Auto Reply */}
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Auto-Reply (Dangerous)</p>
                <p className="text-sm text-muted-foreground">
                  Allow AI to automatically send replies without approval.
                  <span className="ml-1 font-medium text-destructive">
                    Use with extreme caution.
                  </span>
                </p>
              </div>
              <Switch
                checked={settings.auto_reply_enabled}
                onCheckedChange={(checked) =>
                  updateSetting('auto_reply_enabled', checked)
                }
                disabled={!settings.ai_enabled}
              />
            </div>

            <Separator />

            {/* Confidence Threshold */}
            <div className="space-y-2">
              <label className="font-medium">
                Require Approval Above Confidence
              </label>
              <p className="text-sm text-muted-foreground">
                Emails with AI confidence above this threshold will require manual
                approval. Lower = more approvals.
              </p>
              <div className="flex items-center gap-4">
                <Input
                  type="number"
                  min={0}
                  max={1}
                  step={0.05}
                  value={settings.require_approval_above_confidence}
                  onChange={(e) =>
                    updateSetting(
                      'require_approval_above_confidence',
                      parseFloat(e.target.value) || 0.8
                    )
                  }
                  className="w-24"
                  disabled={!settings.ai_enabled}
                />
                <span className="text-sm text-muted-foreground">
                  ({Math.round(settings.require_approval_above_confidence * 100)}%)
                </span>
              </div>
            </div>

            <Separator />

            {/* Default Tone */}
            <div className="space-y-2">
              <label className="font-medium">Default Reply Tone</label>
              <Select
                value={settings.default_tone}
                onValueChange={(value) => updateSetting('default_tone', value)}
                disabled={!settings.ai_enabled}
              >
                <SelectTrigger className="w-48">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TONES.map((tone) => (
                    <SelectItem key={tone.value} value={tone.value}>
                      {tone.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Separator />

            {/* Email Signature */}
            <div className="space-y-2">
              <label className="font-medium">Email Signature</label>
              <p className="text-sm text-muted-foreground">
                This will be appended to all AI-generated replies.
              </p>
              <Textarea
                value={settings.signature || ''}
                onChange={(e) =>
                  updateSetting('signature', e.target.value || null)
                }
                placeholder="Best regards,&#10;Your Name"
                rows={4}
                disabled={!settings.ai_enabled}
              />
            </div>
          </CardContent>
        </Card>

        {/* Working Hours */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Working Hours</CardTitle>
            <CardDescription>
              Set your working hours for email processing.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Enable Working Hours</p>
                <p className="text-sm text-muted-foreground">
                  Only process emails during your working hours.
                </p>
              </div>
              <Switch
                checked={settings.working_hours_enabled}
                onCheckedChange={(checked) =>
                  updateSetting('working_hours_enabled', checked)
                }
              />
            </div>

            {settings.working_hours_enabled && (
              <>
                <Separator />
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Start Time</label>
                    <Input
                      type="time"
                      value={settings.working_hours_start}
                      onChange={(e) =>
                        updateSetting('working_hours_start', e.target.value)
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">End Time</label>
                    <Input
                      type="time"
                      value={settings.working_hours_end}
                      onChange={(e) =>
                        updateSetting('working_hours_end', e.target.value)
                      }
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Timezone</label>
                  <Select
                    value={settings.timezone}
                    onValueChange={(value) => updateSetting('timezone', value)}
                  >
                    <SelectTrigger className="w-64">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {TIMEZONES.map((tz) => (
                        <SelectItem key={tz} value={tz}>
                          {tz}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Save Button */}
        <div className="flex items-center justify-end gap-4">
          {saveSuccess && (
            <span className="flex items-center gap-2 text-sm text-green-600">
              <CheckCircle className="h-4 w-4" />
              Settings saved
            </span>
          )}
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Save className="mr-2 h-4 w-4" />
            )}
            Save Settings
          </Button>
        </div>
      </div>
    </DashboardLayout>
  );
}
