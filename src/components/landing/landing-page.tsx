'use client';

import Link from 'next/link';
import { useState } from 'react';
import {
  Mail,
  Sparkles,
  Shield,
  Zap,
  Brain,
  Clock,
  CheckCircle,
  ArrowRight,
  Star,
  Menu,
  X,
  ChevronDown,
  MessageSquare,
  Filter,
  Bell,
  BarChart3,
  Lock,
  Globe,
  Users,
  Inbox,
  Send,
  FileEdit,
  Settings,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export default function LandingPage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const features = [
    {
      icon: Brain,
      title: 'AI-Powered Classification',
      description: 'Automatically categorize emails by type, urgency, and sentiment. Never miss important messages again.',
    },
    {
      icon: Sparkles,
      title: 'Smart Auto-Replies',
      description: 'Let AI draft contextual responses that match your tone. Review and send with one click.',
    },
    {
      icon: Shield,
      title: 'Approval Workflows',
      description: 'Set rules for sensitive emails. AI drafts responses, you maintain full control before sending.',
    },
    {
      icon: Zap,
      title: 'Lightning Fast',
      description: 'Process hundreds of emails in seconds. Reduce inbox management time by up to 80%.',
    },
    {
      icon: Filter,
      title: 'Custom AI Rules',
      description: 'Create personalized rules based on sender, category, or keywords. Your inbox, your rules.',
    },
    {
      icon: Lock,
      title: 'Enterprise Security',
      description: 'Bank-grade encryption, OAuth 2.0, and no email data stored on our servers.',
    },
  ];

  const howItWorks = [
    {
      step: 1,
      title: 'Connect Your Gmail',
      description: 'Secure OAuth connection - we never see your password. Takes less than 30 seconds.',
      icon: Mail,
    },
    {
      step: 2,
      title: 'AI Analyzes Your Inbox',
      description: 'Our AI classifies emails by category, urgency, and determines the best response strategy.',
      icon: Brain,
    },
    {
      step: 3,
      title: 'Set Your Preferences',
      description: 'Configure auto-reply rules, approval workflows, and customize AI behavior to your needs.',
      icon: Settings,
    },
    {
      step: 4,
      title: 'Relax & Stay Productive',
      description: 'AI handles routine emails while you focus on what matters. Review important items at your pace.',
      icon: Sparkles,
    },
  ];

  const pricing = [
    {
      name: 'Starter',
      price: '$0',
      period: 'forever',
      description: 'Perfect for trying out AI email management',
      features: [
        'Up to 100 emails/month',
        'Basic AI classification',
        'Manual replies only',
        'Email support',
      ],
      cta: 'Get Started Free',
      popular: false,
    },
    {
      name: 'Pro',
      price: '$19',
      period: 'per month',
      description: 'For professionals who value their time',
      features: [
        'Unlimited emails',
        'Advanced AI classification',
        'Smart auto-replies',
        'Custom AI rules',
        'Approval workflows',
        'Priority support',
        'Analytics dashboard',
      ],
      cta: 'Start Free Trial',
      popular: true,
    },
    {
      name: 'Enterprise',
      price: 'Custom',
      period: 'contact us',
      description: 'For teams and organizations',
      features: [
        'Everything in Pro',
        'Multiple email accounts',
        'Team collaboration',
        'Custom AI training',
        'API access',
        'Dedicated support',
        'SLA guarantee',
        'SSO & SAML',
      ],
      cta: 'Contact Sales',
      popular: false,
    },
  ];

  const testimonials = [
    {
      name: 'Sarah Chen',
      role: 'Startup Founder',
      company: 'TechFlow',
      image: null,
      content: 'AI Email OS cut my email time from 3 hours to 30 minutes daily. The auto-classification alone is worth it.',
      rating: 5,
    },
    {
      name: 'Michael Roberts',
      role: 'Sales Director',
      company: 'GrowthCo',
      image: null,
      content: 'The approval workflow for legal emails gives me peace of mind. AI drafts are spot-on 90% of the time.',
      rating: 5,
    },
    {
      name: 'Emily Watson',
      role: 'Product Manager',
      company: 'InnovateLabs',
      image: null,
      content: 'Finally, an AI email tool that actually understands context. My team productivity increased by 40%.',
      rating: 5,
    },
  ];

  const faqs = [
    {
      question: 'Is my email data safe?',
      answer: 'Absolutely. We use OAuth 2.0 for Gmail authentication - we never see or store your password. Email content is processed in real-time and not stored on our servers. All data transmission uses bank-grade encryption.',
    },
    {
      question: 'Can the AI send emails without my approval?',
      answer: 'Only if you configure it to do so. By default, all AI-generated replies require your approval. You can set up custom rules for specific types of emails, but you always have an "AI Kill Switch" to disable auto-sending instantly.',
    },
    {
      question: 'What email providers are supported?',
      answer: 'Currently, we support Gmail and Google Workspace accounts. Outlook and other providers are coming soon.',
    },
    {
      question: 'How accurate is the AI classification?',
      answer: 'Our AI achieves 95%+ accuracy on email classification. It learns from your email patterns and improves over time. You can also create custom rules to fine-tune the behavior.',
    },
    {
      question: 'Can I try it before committing?',
      answer: 'Yes! Our Starter plan is completely free and includes 100 emails per month. The Pro plan also has a 14-day free trial with full features.',
    },
    {
      question: 'How do I cancel my subscription?',
      answer: 'You can cancel anytime from your account settings. No questions asked, no hidden fees. Your data is deleted within 30 days of cancellation.',
    },
  ];

  const stats = [
    { value: '10M+', label: 'Emails Processed' },
    { value: '50K+', label: 'Happy Users' },
    { value: '80%', label: 'Time Saved' },
    { value: '99.9%', label: 'Uptime' },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 border-b bg-background/80 backdrop-blur-md">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary">
                <Mail className="h-5 w-5 text-primary-foreground" />
              </div>
              <span className="text-xl font-bold">AI Email OS</span>
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden md:flex md:items-center md:gap-8">
              <a href="#features" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                Features
              </a>
              <a href="#how-it-works" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                How It Works
              </a>
              <a href="#pricing" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                Pricing
              </a>
              <a href="#faq" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                FAQ
              </a>
            </div>

            {/* CTA Buttons */}
            <div className="hidden md:flex md:items-center md:gap-4">
              <Link href="/login">
                <Button variant="ghost">Sign In</Button>
              </Link>
              <Link href="/login">
                <Button>Get Started Free</Button>
              </Link>
            </div>

            {/* Mobile Menu Button */}
            <button
              className="md:hidden"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? (
                <X className="h-6 w-6" />
              ) : (
                <Menu className="h-6 w-6" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t bg-background">
            <div className="space-y-1 px-4 py-4">
              <a
                href="#features"
                className="block py-2 text-muted-foreground hover:text-foreground"
                onClick={() => setMobileMenuOpen(false)}
              >
                Features
              </a>
              <a
                href="#how-it-works"
                className="block py-2 text-muted-foreground hover:text-foreground"
                onClick={() => setMobileMenuOpen(false)}
              >
                How It Works
              </a>
              <a
                href="#pricing"
                className="block py-2 text-muted-foreground hover:text-foreground"
                onClick={() => setMobileMenuOpen(false)}
              >
                Pricing
              </a>
              <a
                href="#faq"
                className="block py-2 text-muted-foreground hover:text-foreground"
                onClick={() => setMobileMenuOpen(false)}
              >
                FAQ
              </a>
              <div className="pt-4 space-y-2">
                <Link href="/login" className="block">
                  <Button variant="outline" className="w-full">Sign In</Button>
                </Link>
                <Link href="/login" className="block">
                  <Button className="w-full">Get Started Free</Button>
                </Link>
              </div>
            </div>
          </div>
        )}
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="text-center">
            <Badge variant="secondary" className="mb-4">
              <Sparkles className="mr-1 h-3 w-3" />
              Powered by Advanced AI
            </Badge>
            <h1 className="text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl lg:text-7xl">
              Your Inbox,{' '}
              <span className="bg-gradient-to-r from-blue-500 to-purple-600 bg-clip-text text-transparent">
                Supercharged
              </span>
              <br />
              with AI
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground sm:text-xl">
              Stop drowning in emails. Let AI classify, prioritize, and draft replies for you.
              Stay in control with smart approval workflows.
            </p>
            <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link href="/login">
                <Button size="lg" className="w-full sm:w-auto text-lg px-8">
                  Start Free Trial
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <a href="#how-it-works">
                <Button variant="outline" size="lg" className="w-full sm:w-auto text-lg px-8">
                  See How It Works
                </Button>
              </a>
            </div>
            <p className="mt-4 text-sm text-muted-foreground">
              No credit card required • Free plan available • Cancel anytime
            </p>
          </div>

          {/* Hero Image/Preview */}
          <div className="mt-16 relative">
            <div className="absolute inset-0 bg-gradient-to-t from-background to-transparent z-10 pointer-events-none h-32 bottom-0 top-auto" />
            <div className="rounded-xl border bg-card shadow-2xl overflow-hidden">
              {/* Mock Dashboard */}
              <div className="bg-muted/50 px-4 py-3 border-b flex items-center gap-2">
                <div className="flex gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-red-500" />
                  <div className="w-3 h-3 rounded-full bg-yellow-500" />
                  <div className="w-3 h-3 rounded-full bg-green-500" />
                </div>
                <div className="flex-1 text-center text-sm text-muted-foreground">
                  AI Email OS - Dashboard
                </div>
              </div>
              <div className="flex">
                {/* Sidebar Mock */}
                <div className="w-16 border-r bg-muted/30 p-3 hidden sm:block">
                  <div className="space-y-4">
                    <div className="w-10 h-10 rounded-lg bg-primary flex items-center justify-center">
                      <Mail className="h-5 w-5 text-primary-foreground" />
                    </div>
                    <div className="space-y-2">
                      <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center">
                        <Inbox className="h-5 w-5 text-muted-foreground" />
                      </div>
                      <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center">
                        <Send className="h-5 w-5 text-muted-foreground" />
                      </div>
                      <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center">
                        <FileEdit className="h-5 w-5 text-muted-foreground" />
                      </div>
                      <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center">
                        <Sparkles className="h-5 w-5 text-muted-foreground" />
                      </div>
                    </div>
                  </div>
                </div>
                {/* Main Content Mock */}
                <div className="flex-1 p-4 sm:p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-lg font-semibold">Inbox</h3>
                    <Badge variant="secondary" className="bg-green-500/10 text-green-500">
                      <Sparkles className="mr-1 h-3 w-3" />
                      AI Active
                    </Badge>
                  </div>
                  {/* Email Items Mock */}
                  <div className="space-y-3">
                    {[
                      { from: 'Legal Team', subject: 'Contract Review Required', badge: 'Legal', badgeColor: 'bg-red-500/10 text-red-500', status: 'Needs Approval' },
                      { from: 'Customer Support', subject: 'Re: Order #12345', badge: 'Support', badgeColor: 'bg-orange-500/10 text-orange-500', status: 'Auto-replied' },
                      { from: 'Newsletter', subject: 'Weekly AI Digest', badge: 'Newsletter', badgeColor: 'bg-green-500/10 text-green-500', status: 'Archived' },
                      { from: 'Sales Lead', subject: 'Partnership Opportunity', badge: 'Sales', badgeColor: 'bg-blue-500/10 text-blue-500', status: 'Draft Ready' },
                    ].map((email, i) => (
                      <div key={i} className="flex items-center gap-4 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors">
                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                          <span className="text-sm font-medium">{email.from[0]}</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-medium truncate">{email.from}</span>
                            <Badge variant="secondary" className={`text-xs ${email.badgeColor}`}>
                              {email.badge}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground truncate">{email.subject}</p>
                        </div>
                        <Badge variant="outline" className="flex-shrink-0 hidden sm:flex">
                          {email.status}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-12 border-y bg-muted/30">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
            {stats.map((stat, i) => (
              <div key={i} className="text-center">
                <div className="text-3xl font-bold sm:text-4xl">{stat.value}</div>
                <div className="mt-1 text-sm text-muted-foreground">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="text-center mb-16">
            <Badge variant="secondary" className="mb-4">Features</Badge>
            <h2 className="text-3xl font-bold sm:text-4xl">
              Everything You Need to Conquer Your Inbox
            </h2>
            <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
              Powerful AI features that work together to save you hours every week
            </p>
          </div>
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            {features.map((feature, i) => (
              <Card key={i} className="border-2 hover:border-primary/50 transition-colors">
                <CardHeader>
                  <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                    <feature.icon className="h-6 w-6 text-primary" />
                  </div>
                  <CardTitle>{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-base">
                    {feature.description}
                  </CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="py-20 px-4 sm:px-6 lg:px-8 bg-muted/30">
        <div className="mx-auto max-w-7xl">
          <div className="text-center mb-16">
            <Badge variant="secondary" className="mb-4">How It Works</Badge>
            <h2 className="text-3xl font-bold sm:text-4xl">
              Get Started in Minutes
            </h2>
            <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
              Simple setup, powerful results. No technical skills required.
            </p>
          </div>
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
            {howItWorks.map((step, i) => (
              <div key={i} className="relative">
                {i < howItWorks.length - 1 && (
                  <div className="hidden lg:block absolute top-12 left-full w-full h-0.5 bg-border -translate-x-1/2" />
                )}
                <div className="text-center">
                  <div className="relative inline-flex">
                    <div className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center">
                      <step.icon className="h-10 w-10 text-primary" />
                    </div>
                    <div className="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-bold">
                      {step.step}
                    </div>
                  </div>
                  <h3 className="mt-6 text-xl font-semibold">{step.title}</h3>
                  <p className="mt-2 text-muted-foreground">{step.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="text-center mb-16">
            <Badge variant="secondary" className="mb-4">Pricing</Badge>
            <h2 className="text-3xl font-bold sm:text-4xl">
              Simple, Transparent Pricing
            </h2>
            <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
              Start free, upgrade when you're ready. No hidden fees.
            </p>
          </div>
          <div className="grid gap-8 md:grid-cols-3 max-w-5xl mx-auto">
            {pricing.map((plan, i) => (
              <Card
                key={i}
                className={`relative ${plan.popular ? 'border-primary shadow-lg scale-105' : ''}`}
              >
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                    <Badge className="bg-primary">Most Popular</Badge>
                  </div>
                )}
                <CardHeader className="text-center pb-4">
                  <CardTitle className="text-2xl">{plan.name}</CardTitle>
                  <CardDescription>{plan.description}</CardDescription>
                  <div className="mt-4">
                    <span className="text-4xl font-bold">{plan.price}</span>
                    <span className="text-muted-foreground ml-2">/{plan.period}</span>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <ul className="space-y-3">
                    {plan.features.map((feature, j) => (
                      <li key={j} className="flex items-center gap-2">
                        <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0" />
                        <span className="text-sm">{feature}</span>
                      </li>
                    ))}
                  </ul>
                  <Link href="/login" className="block">
                    <Button
                      className="w-full mt-6"
                      variant={plan.popular ? 'default' : 'outline'}
                    >
                      {plan.cta}
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-muted/30">
        <div className="mx-auto max-w-7xl">
          <div className="text-center mb-16">
            <Badge variant="secondary" className="mb-4">Testimonials</Badge>
            <h2 className="text-3xl font-bold sm:text-4xl">
              Loved by Professionals Everywhere
            </h2>
            <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
              See what our users have to say about AI Email OS
            </p>
          </div>
          <div className="grid gap-8 md:grid-cols-3">
            {testimonials.map((testimonial, i) => (
              <Card key={i} className="bg-card">
                <CardContent className="pt-6">
                  <div className="flex gap-1 mb-4">
                    {[...Array(testimonial.rating)].map((_, j) => (
                      <Star key={j} className="h-5 w-5 fill-yellow-500 text-yellow-500" />
                    ))}
                  </div>
                  <p className="text-muted-foreground mb-6">"{testimonial.content}"</p>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <span className="font-medium">{testimonial.name[0]}</span>
                    </div>
                    <div>
                      <div className="font-medium">{testimonial.name}</div>
                      <div className="text-sm text-muted-foreground">
                        {testimonial.role} at {testimonial.company}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section id="faq" className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl">
          <div className="text-center mb-16">
            <Badge variant="secondary" className="mb-4">FAQ</Badge>
            <h2 className="text-3xl font-bold sm:text-4xl">
              Frequently Asked Questions
            </h2>
            <p className="mt-4 text-lg text-muted-foreground">
              Got questions? We've got answers.
            </p>
          </div>
          <div className="space-y-4">
            {faqs.map((faq, i) => (
              <Card
                key={i}
                className="cursor-pointer"
                onClick={() => setOpenFaq(openFaq === i ? null : i)}
              >
                <CardHeader className="py-4">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base font-medium">{faq.question}</CardTitle>
                    <ChevronDown
                      className={`h-5 w-5 text-muted-foreground transition-transform ${
                        openFaq === i ? 'rotate-180' : ''
                      }`}
                    />
                  </div>
                </CardHeader>
                {openFaq === i && (
                  <CardContent className="pt-0 pb-4">
                    <p className="text-muted-foreground">{faq.answer}</p>
                  </CardContent>
                )}
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-primary text-primary-foreground">
        <div className="mx-auto max-w-4xl text-center">
          <h2 className="text-3xl font-bold sm:text-4xl">
            Ready to Transform Your Inbox?
          </h2>
          <p className="mt-4 text-lg opacity-90">
            Join thousands of professionals who save hours every week with AI Email OS.
          </p>
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/login">
              <Button size="lg" variant="secondary" className="w-full sm:w-auto text-lg px-8">
                Get Started Free
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <Link href="/login">
              <Button
                size="lg"
                variant="outline"
                className="w-full sm:w-auto text-lg px-8 bg-transparent border-primary-foreground text-primary-foreground hover:bg-primary-foreground hover:text-primary"
              >
                Sign In
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-12 px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="grid gap-8 md:grid-cols-4">
            {/* Brand */}
            <div className="md:col-span-1">
              <Link href="/" className="flex items-center gap-2">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary">
                  <Mail className="h-5 w-5 text-primary-foreground" />
                </div>
                <span className="text-xl font-bold">AI Email OS</span>
              </Link>
              <p className="mt-4 text-sm text-muted-foreground">
                The AI-powered email client that helps you work smarter, not harder.
              </p>
            </div>

            {/* Product Links */}
            <div>
              <h4 className="font-semibold mb-4">Product</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="#features" className="hover:text-foreground">Features</a></li>
                <li><a href="#pricing" className="hover:text-foreground">Pricing</a></li>
                <li><a href="#" className="hover:text-foreground">Integrations</a></li>
                <li><a href="#" className="hover:text-foreground">Changelog</a></li>
              </ul>
            </div>

            {/* Company Links */}
            <div>
              <h4 className="font-semibold mb-4">Company</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="#" className="hover:text-foreground">About</a></li>
                <li><a href="#" className="hover:text-foreground">Blog</a></li>
                <li><a href="#" className="hover:text-foreground">Careers</a></li>
                <li><a href="#" className="hover:text-foreground">Contact</a></li>
              </ul>
            </div>

            {/* Legal Links */}
            <div>
              <h4 className="font-semibold mb-4">Legal</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="#" className="hover:text-foreground">Privacy Policy</a></li>
                <li><a href="#" className="hover:text-foreground">Terms of Service</a></li>
                <li><a href="#" className="hover:text-foreground">Cookie Policy</a></li>
                <li><a href="#" className="hover:text-foreground">GDPR</a></li>
              </ul>
            </div>
          </div>

          <div className="mt-12 pt-8 border-t flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-sm text-muted-foreground">
              © {new Date().getFullYear()} AI Email OS. All rights reserved.
            </p>
            <div className="flex items-center gap-4">
              <a href="#" className="text-muted-foreground hover:text-foreground">
                <Globe className="h-5 w-5" />
              </a>
              <a href="#" className="text-muted-foreground hover:text-foreground">
                <MessageSquare className="h-5 w-5" />
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
