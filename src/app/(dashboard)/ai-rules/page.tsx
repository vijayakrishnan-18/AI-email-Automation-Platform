'use client';

import { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Plus,
  Trash2,
  Edit2,
  Loader2,
  Sparkles,
  GripVertical,
  Search,
  Zap,
  Shield,
  FolderOpen,
  Filter,
  Star,
  Mail,
  DollarSign,
  Scale,
  AlertTriangle,
  Clock,
  Newspaper,
  CheckCircle2,
  LayoutTemplate,
} from 'lucide-react';
import { getDecisionColor } from '@/lib/utils';
import {
  RULE_TEMPLATES,
  getTemplatesByCategory,
  getPopularTemplates,
  getTemplateCategories,
  searchTemplates,
  type RuleTemplate,
} from '@/lib/ai-rule-templates';

interface RuleCondition {
  field: string;
  operator: string;
  value: string | number | string[];
}

interface AIRule {
  id: string;
  name: string;
  description: string | null;
  is_active: boolean;
  priority: number;
  conditions: RuleCondition[];
  action: string;
  auto_approve: boolean;
}

const FIELDS = [
  { value: 'category', label: 'Category' },
  { value: 'urgency', label: 'Urgency' },
  { value: 'confidence', label: 'Confidence' },
  { value: 'sender', label: 'Sender Email' },
  { value: 'subject', label: 'Subject' },
];

const OPERATORS = [
  { value: 'equals', label: 'equals' },
  { value: 'contains', label: 'contains' },
  { value: 'greater_than', label: 'greater than' },
  { value: 'less_than', label: 'less than' },
];

const ACTIONS = [
  { value: 'AUTO_SEND', label: 'Auto-Send Reply (No Approval)' },
  { value: 'DRAFT_ONLY', label: 'Save as Draft' },
  { value: 'NEEDS_APPROVAL', label: 'Require Approval' },
  { value: 'ESCALATE', label: 'Escalate' },
  { value: 'NO_ACTION', label: 'No Action' },
];

const CATEGORIES = [
  'sales',
  'support',
  'personal',
  'legal',
  'spam',
  'newsletter',
  'transactional',
  'other',
];

const URGENCIES = ['low', 'medium', 'high', 'critical'];

// Category icon mapping
const categoryIcons: Record<string, React.ReactNode> = {
  'auto-reply': <Zap className="h-4 w-4" />,
  'approval': <Shield className="h-4 w-4" />,
  'organization': <FolderOpen className="h-4 w-4" />,
  'filtering': <Filter className="h-4 w-4" />,
  'vip': <Star className="h-4 w-4" />,
};

// Action color mapping for templates
const actionColors: Record<string, string> = {
  'AUTO_SEND': 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
  'NEEDS_APPROVAL': 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
  'DRAFT_ONLY': 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
  'ESCALATE': 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
  'NO_ACTION': 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200',
};

export default function AIRulesPage() {
  const [rules, setRules] = useState<AIRule[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingRule, setEditingRule] = useState<AIRule | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<'rules' | 'templates'>('rules');
  const [templateCategory, setTemplateCategory] = useState<string>('popular');
  const [templateSearch, setTemplateSearch] = useState('');
  const [activatingTemplate, setActivatingTemplate] = useState<string | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    is_active: true,
    priority: 0,
    conditions: [{ field: 'category', operator: 'equals', value: '' }] as RuleCondition[],
    action: 'NEEDS_APPROVAL',
    auto_approve: false,
  });

  useEffect(() => {
    fetchRules();
  }, []);

  const fetchRules = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/rules');
      const { data } = await response.json();
      setRules(data?.rules || []);
    } catch (error) {
      console.error('Error fetching rules:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      is_active: true,
      priority: 0,
      conditions: [{ field: 'category', operator: 'equals', value: '' }],
      action: 'NEEDS_APPROVAL',
      auto_approve: false,
    });
    setEditingRule(null);
  };

  const openEditDialog = (rule: AIRule) => {
    setEditingRule(rule);
    setFormData({
      name: rule.name,
      description: rule.description || '',
      is_active: rule.is_active,
      priority: rule.priority,
      conditions: rule.conditions,
      action: rule.action,
      auto_approve: rule.auto_approve,
    });
    setIsDialogOpen(true);
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const url = editingRule
        ? `/api/rules?id=${editingRule.id}`
        : '/api/rules';
      const method = editingRule ? 'PATCH' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        fetchRules();
        setIsDialogOpen(false);
        resetForm();
      }
    } catch (error) {
      console.error('Error saving rule:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this rule?')) return;

    try {
      const response = await fetch(`/api/rules?id=${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setRules((prev) => prev.filter((r) => r.id !== id));
      }
    } catch (error) {
      console.error('Error deleting rule:', error);
    }
  };

  const handleToggleActive = async (rule: AIRule) => {
    try {
      const response = await fetch(`/api/rules?id=${rule.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_active: !rule.is_active }),
      });

      if (response.ok) {
        setRules((prev) =>
          prev.map((r) =>
            r.id === rule.id ? { ...r, is_active: !r.is_active } : r
          )
        );
      }
    } catch (error) {
      console.error('Error toggling rule:', error);
    }
  };

  const addCondition = () => {
    setFormData((prev) => ({
      ...prev,
      conditions: [
        ...prev.conditions,
        { field: 'category', operator: 'equals', value: '' },
      ],
    }));
  };

  const removeCondition = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      conditions: prev.conditions.filter((_, i) => i !== index),
    }));
  };

  const updateCondition = (
    index: number,
    field: keyof RuleCondition,
    value: string | number
  ) => {
    setFormData((prev) => ({
      ...prev,
      conditions: prev.conditions.map((c, i) =>
        i === index ? { ...c, [field]: value } : c
      ),
    }));
  };

  // Activate a template - create a new rule from it
  const activateTemplate = async (template: RuleTemplate) => {
    setActivatingTemplate(template.id);
    try {
      const response = await fetch('/api/rules', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: template.name,
          description: template.description,
          is_active: true,
          priority: template.priority,
          conditions: template.conditions,
          action: template.action,
          auto_approve: template.action === 'AUTO_SEND',
        }),
      });

      if (response.ok) {
        await fetchRules();
        setActiveTab('rules');
      }
    } catch (error) {
      console.error('Error activating template:', error);
    } finally {
      setActivatingTemplate(null);
    }
  };

  // Check if a template is already active (similar rule exists)
  const isTemplateActive = (template: RuleTemplate): boolean => {
    return rules.some(
      (rule) =>
        rule.name === template.name ||
        (rule.action === template.action &&
          JSON.stringify(rule.conditions) === JSON.stringify(template.conditions))
    );
  };

  // Get templates to display based on category and search
  const getDisplayTemplates = (): RuleTemplate[] => {
    if (templateSearch) {
      return searchTemplates(templateSearch);
    }
    if (templateCategory === 'popular') {
      return getPopularTemplates();
    }
    return getTemplatesByCategory(templateCategory as RuleTemplate['category']);
  };

  const templateCategories = getTemplateCategories();
  const displayTemplates = getDisplayTemplates();

  return (
    <DashboardLayout title="AI Rules">
      <div className="p-6">
        {/* Tabs for Rules and Templates */}
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'rules' | 'templates')} className="space-y-6">
          <div className="flex items-center justify-between">
            <TabsList>
              <TabsTrigger value="rules" className="gap-2">
                <Sparkles className="h-4 w-4" />
                My Rules ({rules.length})
              </TabsTrigger>
              <TabsTrigger value="templates" className="gap-2">
                <LayoutTemplate className="h-4 w-4" />
                Templates ({RULE_TEMPLATES.length})
              </TabsTrigger>
            </TabsList>

            {activeTab === 'rules' && (
              <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogTrigger asChild>
                  <Button onClick={resetForm}>
                    <Plus className="mr-2 h-4 w-4" />
                    New Rule
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>
                      {editingRule ? 'Edit Rule' : 'Create New Rule'}
                    </DialogTitle>
                    <DialogDescription>
                      Define conditions and actions for automatic email handling.
                    </DialogDescription>
                  </DialogHeader>

                  <div className="space-y-4 py-4">
                    {/* Name */}
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Rule Name</label>
                      <Input
                        value={formData.name}
                        onChange={(e) =>
                          setFormData((prev) => ({ ...prev, name: e.target.value }))
                        }
                        placeholder="e.g., Auto-archive newsletters"
                      />
                    </div>

                    {/* Description */}
                    <div className="space-y-2">
                      <label className="text-sm font-medium">
                        Description (optional)
                      </label>
                      <Textarea
                        value={formData.description}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            description: e.target.value,
                          }))
                        }
                        placeholder="What does this rule do?"
                        rows={2}
                      />
                    </div>

                    {/* Conditions */}
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Conditions</label>
                      <div className="space-y-2">
                        {formData.conditions.map((condition, index) => (
                          <div key={index} className="flex items-center gap-2">
                            <Select
                              value={condition.field}
                              onValueChange={(v) => updateCondition(index, 'field', v)}
                            >
                              <SelectTrigger className="w-32">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {FIELDS.map((f) => (
                                  <SelectItem key={f.value} value={f.value}>
                                    {f.label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>

                            <Select
                              value={condition.operator}
                              onValueChange={(v) =>
                                updateCondition(index, 'operator', v)
                              }
                            >
                              <SelectTrigger className="w-32">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {OPERATORS.map((o) => (
                                  <SelectItem key={o.value} value={o.value}>
                                    {o.label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>

                            {condition.field === 'category' ? (
                              <Select
                                value={condition.value as string}
                                onValueChange={(v) =>
                                  updateCondition(index, 'value', v)
                                }
                              >
                                <SelectTrigger className="flex-1">
                                  <SelectValue placeholder="Select category" />
                                </SelectTrigger>
                                <SelectContent>
                                  {CATEGORIES.map((c) => (
                                    <SelectItem key={c} value={c}>
                                      {c}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            ) : condition.field === 'urgency' ? (
                              <Select
                                value={condition.value as string}
                                onValueChange={(v) =>
                                  updateCondition(index, 'value', v)
                                }
                              >
                                <SelectTrigger className="flex-1">
                                  <SelectValue placeholder="Select urgency" />
                                </SelectTrigger>
                                <SelectContent>
                                  {URGENCIES.map((u) => (
                                    <SelectItem key={u} value={u}>
                                      {u}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            ) : (
                              <Input
                                value={condition.value as string}
                                onChange={(e) =>
                                  updateCondition(index, 'value', e.target.value)
                                }
                                placeholder="Value"
                                className="flex-1"
                              />
                            )}

                            {formData.conditions.length > 1 && (
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => removeCondition(index)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        ))}
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={addCondition}
                        className="mt-2"
                      >
                        <Plus className="mr-2 h-4 w-4" />
                        Add Condition
                      </Button>
                    </div>

                    {/* Action */}
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Action</label>
                      <Select
                        value={formData.action}
                        onValueChange={(v) =>
                          setFormData((prev) => ({ ...prev, action: v }))
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {ACTIONS.map((a) => (
                            <SelectItem key={a.value} value={a.value}>
                              {a.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Priority */}
                    <div className="space-y-2">
                      <label className="text-sm font-medium">
                        Priority (higher = runs first)
                      </label>
                      <Input
                        type="number"
                        min={0}
                        max={100}
                        value={formData.priority}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            priority: parseInt(e.target.value) || 0,
                          }))
                        }
                      />
                    </div>
                  </div>

                  <DialogFooter>
                    <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button onClick={handleSave} disabled={isSaving || !formData.name}>
                      {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      {editingRule ? 'Save Changes' : 'Create Rule'}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            )}
          </div>

          {/* My Rules Tab */}
          <TabsContent value="rules" className="space-y-4">
            {isLoading ? (
              <div className="flex h-64 items-center justify-center">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : rules.length === 0 ? (
              <Card>
                <CardContent className="flex h-64 flex-col items-center justify-center gap-4 text-muted-foreground">
                  <Sparkles className="h-12 w-12" />
                  <div className="text-center">
                    <p className="font-medium">No rules configured</p>
                    <p className="text-sm">Create a custom rule or browse templates to get started</p>
                  </div>
                  <Button variant="outline" onClick={() => setActiveTab('templates')}>
                    <LayoutTemplate className="mr-2 h-4 w-4" />
                    Browse Templates
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3">
                {rules.map((rule) => (
                  <Card
                    key={rule.id}
                    className={!rule.is_active ? 'opacity-60' : ''}
                  >
                    <CardContent className="flex items-center gap-4 p-4">
                      <GripVertical className="h-5 w-5 text-muted-foreground" />

                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h3 className="font-medium">{rule.name}</h3>
                          <Badge className={getDecisionColor(rule.action)}>
                            {rule.action.replace('_', ' ')}
                          </Badge>
                          {!rule.is_active && (
                            <Badge variant="outline">Disabled</Badge>
                          )}
                        </div>
                        {rule.description && (
                          <p className="mt-1 text-sm text-muted-foreground">
                            {rule.description}
                          </p>
                        )}
                        <div className="mt-2 flex flex-wrap gap-2">
                          {rule.conditions.map((c, i) => (
                            <Badge key={i} variant="secondary" className="text-xs">
                              {c.field} {c.operator} {String(c.value)}
                            </Badge>
                          ))}
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <Switch
                          checked={rule.is_active}
                          onCheckedChange={() => handleToggleActive(rule)}
                        />
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => openEditDialog(rule)}
                        >
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(rule.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Templates Tab */}
          <TabsContent value="templates" className="space-y-6">
            {/* Search and Category Filter */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search templates..."
                  value={templateSearch}
                  onChange={(e) => setTemplateSearch(e.target.value)}
                  className="pl-9"
                />
              </div>
              <div className="flex flex-wrap gap-2">
                <Button
                  variant={templateCategory === 'popular' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => {
                    setTemplateCategory('popular');
                    setTemplateSearch('');
                  }}
                >
                  <Star className="mr-1 h-3 w-3" />
                  Popular
                </Button>
                {templateCategories.map((cat) => (
                  <Button
                    key={cat.id}
                    variant={templateCategory === cat.id ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => {
                      setTemplateCategory(cat.id);
                      setTemplateSearch('');
                    }}
                  >
                    {categoryIcons[cat.id]}
                    <span className="ml-1">{cat.name}</span>
                    <Badge variant="secondary" className="ml-1 h-5 px-1.5 text-xs">
                      {cat.count}
                    </Badge>
                  </Button>
                ))}
              </div>
            </div>

            {/* Templates Grid */}
            {displayTemplates.length === 0 ? (
              <Card>
                <CardContent className="flex h-32 items-center justify-center text-muted-foreground">
                  <p>No templates found matching your search</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {displayTemplates.map((template) => {
                  const isActive = isTemplateActive(template);
                  return (
                    <Card
                      key={template.id}
                      className={`transition-all hover:shadow-md ${
                        isActive ? 'border-green-500 bg-green-50 dark:bg-green-950/20' : ''
                      }`}
                    >
                      <CardHeader className="pb-3">
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-2">
                            {categoryIcons[template.category]}
                            <CardTitle className="text-base">{template.name}</CardTitle>
                          </div>
                          {template.isPopular && (
                            <Badge variant="secondary" className="text-xs">
                              <Star className="mr-1 h-3 w-3 fill-yellow-500 text-yellow-500" />
                              Popular
                            </Badge>
                          )}
                        </div>
                        <CardDescription className="text-sm">
                          {template.description}
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        {/* Conditions preview */}
                        <div className="flex flex-wrap gap-1">
                          {template.conditions.map((c, i) => (
                            <Badge key={i} variant="outline" className="text-xs">
                              {c.field} {c.operator} {String(c.value)}
                            </Badge>
                          ))}
                        </div>

                        {/* Action badge */}
                        <div className="flex items-center justify-between">
                          <Badge className={actionColors[template.action]}>
                            {template.action.replace('_', ' ')}
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            Priority: {template.priority}
                          </span>
                        </div>

                        {/* Activate button */}
                        <Button
                          className="w-full"
                          variant={isActive ? 'outline' : 'default'}
                          size="sm"
                          disabled={isActive || activatingTemplate === template.id}
                          onClick={() => activateTemplate(template)}
                        >
                          {activatingTemplate === template.id ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              Activating...
                            </>
                          ) : isActive ? (
                            <>
                              <CheckCircle2 className="mr-2 h-4 w-4 text-green-600" />
                              Already Active
                            </>
                          ) : (
                            <>
                              <Plus className="mr-2 h-4 w-4" />
                              Activate Template
                            </>
                          )}
                        </Button>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
