'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Sparkles,
  Send,
  Loader2,
  Edit2,
  RotateCcw,
  Wand2,
  CheckCircle,
  AlertCircle,
  FileText,
  ChevronRight,
  Mic,
  MicOff,
} from 'lucide-react';
import {
  TEMPLATE_CATEGORIES,
  getTemplatesByCategory,
  type EmailTemplate,
} from '@/lib/email-templates';
import { useVoiceInput } from '@/hooks/use-voice-input';

interface GeneratedDraft {
  to: string;
  subject: string;
  body: string;
  tone: string;
}

interface LoadedDraft {
  id: string;
  gmail_draft_id: string;
  to: string;
  subject: string;
  body: string;
  thread_id?: string;
}

export default function ComposePage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const draftId = searchParams.get('draft');

  // AI Compose state
  const [instructions, setInstructions] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [draft, setDraft] = useState<GeneratedDraft | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editedDraft, setEditedDraft] = useState<GeneratedDraft | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Loaded draft state (when editing existing draft)
  const [loadedDraft, setLoadedDraft] = useState<LoadedDraft | null>(null);
  const [isLoadingDraft, setIsLoadingDraft] = useState(false);
  const [draftTo, setDraftTo] = useState('');
  const [draftSubject, setDraftSubject] = useState('');
  const [draftBody, setDraftBody] = useState('');

  // Template state
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedTemplate, setSelectedTemplate] = useState<EmailTemplate | null>(null);
  const [templateTo, setTemplateTo] = useState('');
  const [templateCustomizations, setTemplateCustomizations] = useState('');

  // Voice input state
  const [activeVoiceField, setActiveVoiceField] = useState<'instructions' | 'template' | null>(null);

  // Voice input for main instructions
  const instructionsVoice = useVoiceInput({
    onResult: (transcript) => {
      setInstructions((prev) => prev + (prev ? ' ' : '') + transcript);
    },
    onError: (error) => {
      setError(error);
      setActiveVoiceField(null);
    },
  });

  // Voice input for template customizations
  const templateVoice = useVoiceInput({
    onResult: (transcript) => {
      setTemplateCustomizations((prev) => prev + (prev ? ' ' : '') + transcript);
    },
    onError: (error) => {
      setError(error);
      setActiveVoiceField(null);
    },
  });

  // Update active field when listening state changes
  useEffect(() => {
    if (!instructionsVoice.isListening && activeVoiceField === 'instructions') {
      setActiveVoiceField(null);
    }
    if (!templateVoice.isListening && activeVoiceField === 'template') {
      setActiveVoiceField(null);
    }
  }, [instructionsVoice.isListening, templateVoice.isListening, activeVoiceField]);

  // Load draft when draftId is present in URL
  useEffect(() => {
    if (!draftId) return;

    const loadDraft = async () => {
      setIsLoadingDraft(true);
      setError(null);

      try {
        const response = await fetch(`/api/folders/draft/${draftId}`);
        const result = await response.json();

        if (!response.ok) {
          throw new Error(result.error || 'Failed to load draft');
        }

        const draftData = result.data?.draft;
        if (draftData) {
          setLoadedDraft({
            id: draftData.id,
            gmail_draft_id: draftData.gmail_draft_id,
            to: draftData.to,
            subject: draftData.subject,
            body: draftData.body,
            thread_id: draftData.thread_id,
          });
          setDraftTo(draftData.to || '');
          setDraftSubject(draftData.subject || '');
          setDraftBody(draftData.body || '');
        }
      } catch (err) {
        console.error('Error loading draft:', err);
        setError(err instanceof Error ? err.message : 'Failed to load draft');
      } finally {
        setIsLoadingDraft(false);
      }
    };

    loadDraft();
  }, [draftId]);

  const handleInstructionsVoiceToggle = () => {
    if (instructionsVoice.isListening) {
      instructionsVoice.stopListening();
      setActiveVoiceField(null);
    } else {
      // Stop template voice if active
      if (templateVoice.isListening) {
        templateVoice.stopListening();
      }
      setActiveVoiceField('instructions');
      instructionsVoice.startListening();
    }
  };

  const handleTemplateVoiceToggle = () => {
    if (templateVoice.isListening) {
      templateVoice.stopListening();
      setActiveVoiceField(null);
    } else {
      // Stop instructions voice if active
      if (instructionsVoice.isListening) {
        instructionsVoice.stopListening();
      }
      setActiveVoiceField('template');
      templateVoice.startListening();
    }
  };

  const handleGenerate = async () => {
    if (!instructions.trim()) return;

    setIsGenerating(true);
    setError(null);
    setSuccess(null);
    setDraft(null);

    try {
      const response = await fetch('/api/compose', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ instructions }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to generate email');
      }

      setDraft(data.data.draft);
      setEditedDraft(data.data.draft);
    } catch (err) {
      console.error('Generate error:', err);
      setError(err instanceof Error ? err.message : 'Failed to generate email');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleGenerateFromTemplate = async () => {
    if (!selectedTemplate || !templateTo.trim()) return;

    setIsGenerating(true);
    setError(null);
    setSuccess(null);
    setDraft(null);

    const templateInstructions = `Use this email template and customize it:

Template Name: ${selectedTemplate.name}
Template Subject: ${selectedTemplate.subject}
Template Body:
${selectedTemplate.body}

Send to: ${templateTo}

${templateCustomizations ? `Customization instructions: ${templateCustomizations}` : 'Fill in the template variables appropriately based on context.'}

Generate a complete, ready-to-send email based on this template.`;

    try {
      const response = await fetch('/api/compose', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ instructions: templateInstructions }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to generate email');
      }

      setDraft(data.data.draft);
      setEditedDraft(data.data.draft);
    } catch (err) {
      console.error('Generate error:', err);
      setError(err instanceof Error ? err.message : 'Failed to generate email');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSend = async () => {
    const emailToSend = isEditing ? editedDraft : draft;
    if (!emailToSend) return;

    setIsSending(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch('/api/compose', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(emailToSend),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to send email');
      }

      setSuccess(`Email sent successfully to ${emailToSend.to}!`);
      // Reset form after successful send
      setInstructions('');
      setDraft(null);
      setEditedDraft(null);
      setIsEditing(false);
      setSelectedTemplate(null);
      setTemplateTo('');
      setTemplateCustomizations('');
    } catch (err) {
      console.error('Send error:', err);
      setError(err instanceof Error ? err.message : 'Failed to send email');
    } finally {
      setIsSending(false);
    }
  };

  const handleReset = () => {
    setDraft(null);
    setEditedDraft(null);
    setIsEditing(false);
    setError(null);
    setSuccess(null);
  };

  // Handle sending the loaded draft
  const handleSendLoadedDraft = async () => {
    if (!loadedDraft) return;

    setIsSending(true);
    setError(null);
    setSuccess(null);

    try {
      // Send the draft using Gmail API
      const response = await fetch('/api/folders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          draftId: loadedDraft.gmail_draft_id,
          action: 'send-draft',
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to send draft');
      }

      setSuccess(`Email sent successfully to ${draftTo}!`);
      // Clear draft state and redirect
      setLoadedDraft(null);
      setDraftTo('');
      setDraftSubject('');
      setDraftBody('');
      router.push('/drafts');
    } catch (err) {
      console.error('Send error:', err);
      setError(err instanceof Error ? err.message : 'Failed to send draft');
    } finally {
      setIsSending(false);
    }
  };

  // Handle discarding draft editing and going back
  const handleDiscardDraft = () => {
    setLoadedDraft(null);
    setDraftTo('');
    setDraftSubject('');
    setDraftBody('');
    router.push('/drafts');
  };

  const handleSelectTemplate = (template: EmailTemplate) => {
    setSelectedTemplate(template);
    setTemplateTo('');
    setTemplateCustomizations('');
    setDraft(null);
    setError(null);
    setSuccess(null);
  };

  const getToneColor = (tone: string) => {
    switch (tone) {
      case 'professional':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'friendly':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'formal':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200';
      case 'casual':
        return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      Onboarding: 'bg-blue-100 text-blue-800',
      Sales: 'bg-green-100 text-green-800',
      Support: 'bg-yellow-100 text-yellow-800',
      Orders: 'bg-purple-100 text-purple-800',
      Meetings: 'bg-pink-100 text-pink-800',
      'Thank You': 'bg-emerald-100 text-emerald-800',
      Feedback: 'bg-cyan-100 text-cyan-800',
      Reminders: 'bg-orange-100 text-orange-800',
      Apologies: 'bg-red-100 text-red-800',
      General: 'bg-gray-100 text-gray-800',
    };
    return colors[category] || 'bg-gray-100 text-gray-800';
  };

  const filteredTemplates = getTemplatesByCategory(selectedCategory);

  return (
    <DashboardLayout title="AI Compose">
      <div className="mx-auto max-w-5xl p-6 space-y-6">
        {/* Error Message */}
        {error && (
          <Card className="border-red-200 bg-red-50 dark:border-red-900 dark:bg-red-950/50">
            <CardContent className="flex items-center gap-2 p-4">
              <AlertCircle className="h-5 w-5 text-red-600" />
              <p className="text-red-600">{error}</p>
            </CardContent>
          </Card>
        )}

        {/* Success Message */}
        {success && (
          <Card className="border-green-200 bg-green-50 dark:border-green-900 dark:bg-green-950/50">
            <CardContent className="flex items-center gap-2 p-4">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <p className="text-green-600">{success}</p>
            </CardContent>
          </Card>
        )}

        {/* Loading Draft State */}
        {isLoadingDraft && (
          <Card>
            <CardContent className="flex items-center justify-center p-8">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              <span className="ml-2 text-muted-foreground">Loading draft...</span>
            </CardContent>
          </Card>
        )}

        {/* Edit Draft Mode - Show when a draft is loaded */}
        {loadedDraft && !isLoadingDraft && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Edit2 className="h-5 w-5" />
                Edit Draft
              </CardTitle>
              <CardDescription>
                Review and send your draft email
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium">To</label>
                <Input
                  value={draftTo}
                  onChange={(e) => setDraftTo(e.target.value)}
                  placeholder="recipient@example.com"
                  className="mt-1"
                  type="email"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Subject</label>
                <Input
                  value={draftSubject}
                  onChange={(e) => setDraftSubject(e.target.value)}
                  placeholder="Email subject"
                  className="mt-1"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Message</label>
                <Textarea
                  value={draftBody}
                  onChange={(e) => setDraftBody(e.target.value)}
                  placeholder="Email content..."
                  className="mt-1 min-h-[250px]"
                />
              </div>
              <div className="flex gap-2 pt-2">
                <Button
                  onClick={handleSendLoadedDraft}
                  disabled={isSending || !draftTo.trim()}
                  className="flex-1 bg-green-600 hover:bg-green-700"
                >
                  {isSending ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="mr-2 h-4 w-4" />
                  )}
                  {isSending ? 'Sending...' : 'Send Email'}
                </Button>
                <Button variant="outline" onClick={handleDiscardDraft}>
                  <RotateCcw className="mr-2 h-4 w-4" />
                  Back to Drafts
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Main Tabs - Only show when not editing a draft */}
        {!loadedDraft && !isLoadingDraft && (
        <Tabs defaultValue="ai-compose" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="ai-compose" className="flex items-center gap-2">
              <Wand2 className="h-4 w-4" />
              AI Compose
            </TabsTrigger>
            <TabsTrigger value="templates" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Templates
            </TabsTrigger>
          </TabsList>

          {/* AI Compose Tab */}
          <TabsContent value="ai-compose" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Wand2 className="h-5 w-5" />
                  Compose with AI
                </CardTitle>
                <CardDescription>
                  Just tell me what to write and who to send it to
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="relative">
                  <Textarea
                    value={instructions}
                    onChange={(e) => setInstructions(e.target.value)}
                    placeholder={`Just provide the email address and your message context. Examples:

• Send to john@example.com - thank him for attending yesterday's meeting
• Email sarah@company.com asking if she's free for lunch next week
• Write to support@vendor.com - my order #12345 hasn't arrived yet
• Send birthday wishes to friend@gmail.com
• Email boss@work.com requesting time off next Friday

💡 Tip: Click the microphone button to speak instead of typing!`}
                    className={`min-h-[180px] pr-14 ${instructionsVoice.isListening ? 'border-red-500 ring-2 ring-red-200' : ''}`}
                    disabled={isGenerating}
                  />
                  {/* Voice Input Button */}
                  {instructionsVoice.isSupported && (
                    <Button
                      type="button"
                      variant={instructionsVoice.isListening ? 'destructive' : 'outline'}
                      size="icon"
                      className={`absolute right-2 top-2 ${instructionsVoice.isListening ? 'animate-pulse' : ''}`}
                      onClick={handleInstructionsVoiceToggle}
                      disabled={isGenerating}
                    >
                      {instructionsVoice.isListening ? (
                        <MicOff className="h-4 w-4" />
                      ) : (
                        <Mic className="h-4 w-4" />
                      )}
                    </Button>
                  )}
                </div>
                {/* Voice Status */}
                {instructionsVoice.isListening && (
                  <div className="flex items-center gap-2 text-sm text-red-600">
                    <span className="relative flex h-3 w-3">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
                    </span>
                    Listening... Speak now
                  </div>
                )}
                <div className="flex gap-2">
                  <Button
                    onClick={handleGenerate}
                    disabled={isGenerating || !instructions.trim()}
                    className="flex-1"
                  >
                    {isGenerating ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Sparkles className="mr-2 h-4 w-4" />
                    )}
                    {isGenerating ? 'Generating...' : 'Generate Email'}
                  </Button>
                  {draft && (
                    <Button variant="outline" onClick={handleReset}>
                      <RotateCcw className="mr-2 h-4 w-4" />
                      Start Over
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Templates Tab */}
          <TabsContent value="templates" className="space-y-6">
            {!selectedTemplate ? (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    Email Templates
                  </CardTitle>
                  <CardDescription>
                    Choose a template and let AI customize it for you
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Category Filter */}
                  <div className="flex flex-wrap gap-2">
                    {TEMPLATE_CATEGORIES.map((category) => (
                      <Button
                        key={category}
                        variant={selectedCategory === category ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setSelectedCategory(category)}
                      >
                        {category}
                      </Button>
                    ))}
                  </div>

                  {/* Template List */}
                  <ScrollArea className="h-[400px]">
                    <div className="grid gap-3">
                      {filteredTemplates.map((template) => (
                        <Card
                          key={template.id}
                          className="cursor-pointer hover:border-primary transition-colors"
                          onClick={() => handleSelectTemplate(template)}
                        >
                          <CardContent className="p-4">
                            <div className="flex items-start justify-between">
                              <div className="space-y-1">
                                <div className="flex items-center gap-2">
                                  <h4 className="font-medium">{template.name}</h4>
                                  <Badge
                                    variant="secondary"
                                    className={getCategoryColor(template.category)}
                                  >
                                    {template.category}
                                  </Badge>
                                </div>
                                <p className="text-sm text-muted-foreground">
                                  {template.description}
                                </p>
                                <p className="text-xs text-muted-foreground mt-2">
                                  <strong>Subject:</strong> {template.subject}
                                </p>
                              </div>
                              <ChevronRight className="h-5 w-5 text-muted-foreground" />
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        {selectedTemplate.name}
                        <Badge className={getCategoryColor(selectedTemplate.category)}>
                          {selectedTemplate.category}
                        </Badge>
                      </CardTitle>
                      <CardDescription>{selectedTemplate.description}</CardDescription>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setSelectedTemplate(null)}
                    >
                      <RotateCcw className="mr-1 h-4 w-4" />
                      Choose Different
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Template Preview */}
                  <div className="rounded-md border bg-muted/50 p-4 space-y-2">
                    <p className="text-sm">
                      <strong>Subject:</strong> {selectedTemplate.subject}
                    </p>
                    <div className="text-sm whitespace-pre-wrap text-muted-foreground">
                      {selectedTemplate.body}
                    </div>
                    <div className="flex flex-wrap gap-1 mt-2">
                      <span className="text-xs text-muted-foreground">Variables:</span>
                      {selectedTemplate.variables.map((v) => (
                        <Badge key={v} variant="outline" className="text-xs">
                          {`{{${v}}}`}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  {/* Recipient */}
                  <div>
                    <label className="text-sm font-medium">Send to (email address)</label>
                    <Input
                      value={templateTo}
                      onChange={(e) => setTemplateTo(e.target.value)}
                      placeholder="recipient@example.com"
                      className="mt-1"
                      type="email"
                    />
                  </div>

                  {/* Customizations */}
                  <div>
                    <label className="text-sm font-medium">
                      Customization Instructions (optional)
                    </label>
                    <div className="relative mt-1">
                      <Textarea
                        value={templateCustomizations}
                        onChange={(e) => setTemplateCustomizations(e.target.value)}
                        placeholder={`Tell AI how to customize this template. Examples:
• Name is John, company is Acme Corp, my name is Sarah
• Order ID is #12345, delivery date is next Monday
• Make it more casual and friendly
• Add details about our meeting yesterday

💡 Tip: Click the microphone to speak your customizations!`}
                        className={`min-h-[120px] pr-14 ${templateVoice.isListening ? 'border-red-500 ring-2 ring-red-200' : ''}`}
                      />
                      {/* Voice Input Button */}
                      {templateVoice.isSupported && (
                        <Button
                          type="button"
                          variant={templateVoice.isListening ? 'destructive' : 'outline'}
                          size="icon"
                          className={`absolute right-2 top-2 ${templateVoice.isListening ? 'animate-pulse' : ''}`}
                          onClick={handleTemplateVoiceToggle}
                        >
                          {templateVoice.isListening ? (
                            <MicOff className="h-4 w-4" />
                          ) : (
                            <Mic className="h-4 w-4" />
                          )}
                        </Button>
                      )}
                    </div>
                    {/* Voice Status */}
                    {templateVoice.isListening && (
                      <div className="flex items-center gap-2 text-sm text-red-600 mt-2">
                        <span className="relative flex h-3 w-3">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
                        </span>
                        Listening... Speak now
                      </div>
                    )}
                  </div>

                  {/* Generate Button */}
                  <Button
                    onClick={handleGenerateFromTemplate}
                    disabled={isGenerating || !templateTo.trim()}
                    className="w-full"
                  >
                    {isGenerating ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Sparkles className="mr-2 h-4 w-4" />
                    )}
                    {isGenerating ? 'Generating...' : 'Generate from Template'}
                  </Button>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
        )}

        {/* Generated Draft Preview */}
        {draft && (
          <Card className="border-blue-200 bg-blue-50 dark:border-blue-900 dark:bg-blue-950/50">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Sparkles className="h-4 w-4" />
                  AI Generated Email
                </CardTitle>
                <div className="flex items-center gap-2">
                  <Badge className={getToneColor(draft.tone)}>{draft.tone}</Badge>
                  {!isEditing ? (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setIsEditing(true)}
                    >
                      <Edit2 className="mr-1 h-4 w-4" />
                      Edit
                    </Button>
                  ) : (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setEditedDraft(draft);
                        setIsEditing(false);
                      }}
                    >
                      <RotateCcw className="mr-1 h-4 w-4" />
                      Reset
                    </Button>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {isEditing ? (
                <>
                  <div>
                    <label className="text-xs text-muted-foreground">To</label>
                    <Input
                      value={editedDraft?.to || ''}
                      onChange={(e) =>
                        setEditedDraft((prev) =>
                          prev ? { ...prev, to: e.target.value } : null
                        )
                      }
                      className="bg-background"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground">Subject</label>
                    <Input
                      value={editedDraft?.subject || ''}
                      onChange={(e) =>
                        setEditedDraft((prev) =>
                          prev ? { ...prev, subject: e.target.value } : null
                        )
                      }
                      className="bg-background"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground">Body</label>
                    <Textarea
                      value={editedDraft?.body || ''}
                      onChange={(e) =>
                        setEditedDraft((prev) =>
                          prev ? { ...prev, body: e.target.value } : null
                        )
                      }
                      className="min-h-[200px] bg-background"
                    />
                  </div>
                </>
              ) : (
                <>
                  <div>
                    <label className="text-xs text-muted-foreground">To</label>
                    <p className="text-sm font-medium">{draft.to}</p>
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground">Subject</label>
                    <p className="text-sm font-medium">{draft.subject}</p>
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground">Body</label>
                    <div className="mt-1 whitespace-pre-wrap rounded-md bg-background p-3 text-sm">
                      {draft.body}
                    </div>
                  </div>
                </>
              )}

              {/* Send Button */}
              <div className="flex gap-2 pt-2">
                <Button
                  onClick={handleSend}
                  disabled={isSending}
                  className="flex-1 bg-green-600 hover:bg-green-700"
                >
                  {isSending ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="mr-2 h-4 w-4" />
                  )}
                  {isSending ? 'Sending...' : 'Send Email'}
                </Button>
                <Button variant="outline" onClick={handleReset}>
                  <RotateCcw className="mr-2 h-4 w-4" />
                  Discard
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}
