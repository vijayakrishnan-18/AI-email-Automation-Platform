'use client';

import Link from 'next/link';
import { useState } from 'react';
import {
  Mail,
  Sparkles,
  Shield,
  Zap,
  Brain,
  ArrowRight,
  Star,
  Menu,
  X,
  ChevronDown,
  MessageSquare,
  Filter,
  Lock,
  Globe,
  Inbox,
  Send,
  FileEdit,
  Settings,
  Moon,
  Sun,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

export default function LandingPage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isDark, setIsDark] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const features = [
    {
      icon: Brain,
      title: 'Automated Inbox Triage',
      description: 'Leveraging machine learning to prioritize correspondence based on intent, urgency, and sentiment for streamlined triage.',
    },
    {
      icon: Sparkles,
      title: 'Contextual Draft Generation',
      description: 'AI-driven drafting that mirrors your unique communication style, allowing for rapid review and one-click dispatch.',
    },
    {
      icon: Shield,
      title: 'Regulated Response Protocols',
      description: 'Establish governance for sensitive communications, ensuring AI-generated drafts meet your standards before final approval.',
    },
    {
      icon: Zap,
      title: 'High-Volume Throughput',
      description: 'Optimize operational efficiency by processing vast email volumes instantly, reclaiming up to 80% of administrative time.',
    },
    {
      icon: Filter,
      title: 'Granular Logic Configuration',
      description: 'Define bespoke automation parameters based on specific senders, classifications, or keywords to suit your workflow.',
    },
    {
      icon: Lock,
      title: 'Tier-1 Data Protection',
      description: 'Built with industry-standard encryption and OAuth 2.0; we operate on a zero-retention policy for your raw email data.',
    },
  ];

  const howItWorks = [
    {
      step: 1,
      title: 'Securely Connect Your Gmail',
      description: 'Authenticate your Gmail account through a secure OAuth connection. No passwords are stored or accessed.',
      icon: Mail,
    },
    {
      step: 2,
      title: 'AI Analyzes Your Inbox',
      description: 'The AI evaluates incoming emails, categorizing them by topic, urgency, and determining the most appropriate response strategy.',
      icon: Brain,
    },
    {
      step: 3,
      title: 'Customize Your Preferences',
      description: 'Configure automation rules, approval workflows, and AI behavior to match your communication preferences.',
      icon: Settings,
    },
    {
      step: 4,
      title: 'Stay Focused and Productive',
      description: 'Routine emails are handled automatically while you concentrate on high-priority tasks and review important messages when needed.',
      icon: Sparkles,
    },
  ];


  const testimonials = [
    {
      name: 'Angelo Seby',
      role: 'Startup Founder',
      company: 'TechFlow',
      content: 'AI Email Automation platforms cut my email time from 3 hours to 30 minutes daily. The auto-classification alone is worth it.',
      rating: 5,
    },
    {
      name: 'Anaswara KU',
      role: 'CEO',
      company: 'GrowthCo',
      content: 'The approval workflow for legal emails gives me peace of mind. AI drafts are spot-on 90% of the time.',
      rating: 5,
    },
    {
      name: 'Emily Watson',
      role: 'Product Manager',
      company: 'InnovateLabs',
      content: 'Finally, an AI email tool that actually understands context. My team productivity increased by 40%.',
      rating: 5,
    },
  ];

  const faqs = [
    {
      question: 'Is my email data safe?',
      answer: 'Absolutely. We use OAuth 2.0 for Gmail authentication — we never see or store your password. Email content is processed in real-time and not stored on our servers. All data transmission uses bank-grade encryption.',
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
      answer: 'Yes! Our Individual plan is completely free and includes 100 emails per month. The Professional plan also has a 14-day free trial with full features.',
    },
    {
      question: 'How do I cancel my subscription?',
      answer: 'You can cancel anytime from your account settings. No questions asked, no hidden fees. Your data is deleted within 30 days of cancellation.',
    },
  ];

  const stats = [
    { value: '10M+', label: 'Emails Classified' },
    { value: '50K+', label: 'Productive Users' },
    { value: '80%', label: 'Reduced Inbox Time' },
    { value: '99.9%', label: 'Service Uptime' },
  ];

  const dk = isDark;

  // ── Centralised theme tokens ──────────────────────────────────────────
  const t = {
    text:       dk ? '#F0F9FF' : '#0F172A',   // headings / bold labels
    muted:      dk ? '#94A3B8' : '#475569',   // body paragraphs
    subtle:     dk ? '#64748B' : '#64748B',   // tiny meta text (same both)
    medium:     dk ? '#CBD5E1' : '#334155',   // list items / secondary text
    faint:      dk ? '#64748B' : '#94A3B8',   // footer / copyright
    sectionBg:  dk ? 'rgba(30,41,59,0.4)'  : 'rgba(224,242,254,0.4)',
    statsBorder:dk ? '1px solid rgba(148,163,184,0.15)' : '1px solid rgba(186,230,253,0.5)',
    footerBg:   dk ? 'rgba(15,23,42,0.85)' : 'rgba(240,249,255,0.8)',
    iconBg:     dk ? 'linear-gradient(135deg,rgba(56,189,248,0.15),rgba(6,182,212,0.15))' : 'linear-gradient(135deg,rgba(14,165,233,0.15),rgba(6,182,212,0.15))',
    iconBorder: dk ? '1px solid rgba(56,189,248,0.2)'  : '1px solid rgba(14,165,233,0.2)',
    projectBg:  dk ? 'linear-gradient(135deg, rgba(56,189,248,0.1), rgba(6,182,212,0.1))' : 'linear-gradient(135deg, rgba(14,165,233,0.1), rgba(6,182,212,0.1))',
    projectBorder: dk ? '1.5px solid rgba(56,189,248,0.25)' : '1.5px solid rgba(14,165,233,0.25)',
    avatarBg:   dk ? 'linear-gradient(135deg,rgba(56,189,248,0.2),rgba(6,182,212,0.2))' : 'linear-gradient(135deg,rgba(14,165,233,0.2),rgba(6,182,212,0.2))',
    emailItemBg:dk ? 'rgba(30,41,59,0.7)'  : 'rgba(240,249,255,0.7)',
    emailItemBorder: dk ? '1px solid rgba(148,163,184,0.2)' : '1px solid rgba(186,230,253,0.4)',
  };
  // ─────────────────────────────────────────────────────────────────────

  return (
    <div
      className={dk ? 'dark-mode' : ''}
      style={{
        minHeight: '100vh',
        background: dk
          ? 'linear-gradient(180deg, #0F172A 0%, #1E293B 55%, #0C4A6E 100%)'
          : 'linear-gradient(180deg, #F0F9FF 0%, #E0F2FE 50%, #BAE6FD 100%)',
        color: dk ? '#F0F9FF' : '#0F172A',
        fontFamily: 'inherit',
        transition: 'background 0.4s ease, color 0.4s ease',
      }}
    >
      <style>{`
        /* Dark mode overrides */
        .dark-mode .nav-ocean {
          background: rgba(15,23,42,0.92);
          border-bottom-color: rgba(148,163,184,0.15);
        }
        .dark-mode .card-ocean {
          background: rgba(30,41,59,0.85);
          border-color: rgba(148,163,184,0.18);
        }
        .dark-mode .card-ocean:hover {
          border-color: #38BDF8;
          box-shadow: 0 12px 36px rgba(56,189,248,0.18);
        }
        .dark-mode .card-popular {
          background: rgba(30,41,59,0.95);
          border-color: #38BDF8;
        }
        .dark-mode .stat-block {
          background: rgba(30,41,59,0.6);
          border-color: rgba(148,163,184,0.15);
        }
        .dark-mode .faq-card {
          background: rgba(30,41,59,0.7);
          border-color: rgba(148,163,184,0.2);
        }
        .dark-mode .faq-card:hover {
          border-color: #38BDF8;
        }
        .dark-mode .nav-link { color: #94A3B8; }
        .dark-mode .nav-link:hover { color: #38BDF8; }
        .dark-mode .btn-ghost-ocean {
          background: rgba(30,41,59,0.8);
          color: #38BDF8;
          border-color: #38BDF8;
        }
        .dark-mode .btn-ghost-ocean:hover {
          background: rgba(56,189,248,0.14);
        }
        .dark-mode .hero-mockup {
          background: rgba(15,23,42,0.9);
          border-color: rgba(148,163,184,0.2);
        }
        .dark-mode .badge-pill {
          background: rgba(56,189,248,0.15);
          border-color: rgba(56,189,248,0.3);
          color: #38BDF8;
        }
        .dark-mode .step-circle {
          background: rgba(56,189,248,0.1);
          border-color: rgba(56,189,248,0.2);
        }
        /* Smooth transitions */
        .nav-ocean, .card-ocean, .stat-block, .faq-card, .btn-ghost-ocean, .hero-mockup, .badge-pill {
          transition: background 0.4s ease, border-color 0.4s ease, color 0.4s ease;
        }
        .hover-lift {
          transition: transform 0.3s ease-out, box-shadow 0.3s ease-out;
        }
        .hover-lift:hover {
          transform: translateY(-4px);
          box-shadow: 0 12px 32px rgba(14, 165, 233, 0.18);
        }
        .hover-lift-btn {
          transition: transform 0.3s ease-out, box-shadow 0.3s ease-out, filter 0.3s ease-out;
        }
        .hover-lift-btn:hover {
          transform: translateY(-4px);
          box-shadow: 0 8px 24px rgba(14, 165, 233, 0.3);
          filter: brightness(1.08);
        }
        .hover-lift-ghost {
          transition: transform 0.3s ease-out, box-shadow 0.3s ease-out;
        }
        .hover-lift-ghost:hover {
          transform: translateY(-4px);
          box-shadow: 0 8px 24px rgba(14, 165, 233, 0.15);
        }
        .card-ocean {
          background: rgba(255,255,255,0.72);
          border: 1.5px solid rgba(186, 230, 253, 0.7);
          border-radius: 16px;
          backdrop-filter: blur(8px);
          transition: transform 0.3s ease-out, box-shadow 0.3s ease-out, border-color 0.3s ease-out;
        }
        .card-ocean:hover {
          transform: translateY(-4px);
          box-shadow: 0 12px 36px rgba(6, 182, 212, 0.18);
          border-color: #0EA5E9;
        }
        .card-popular {
          background: rgba(255,255,255,0.92);
          border: 2px solid #0EA5E9;
          box-shadow: 0 8px 32px rgba(14, 165, 233, 0.22);
          border-radius: 16px;
          transition: transform 0.3s ease-out, box-shadow 0.3s ease-out;
        }
        .card-popular:hover {
          transform: translateY(-6px);
          box-shadow: 0 20px 48px rgba(6, 182, 212, 0.32);
        }
        .nav-link {
          font-size: 0.875rem;
          color: ${t.medium};
          text-decoration: none;
          transition: color 0.2s, transform 0.2s;
          display: inline-block;
        }
        .nav-link:hover {
          color: #0EA5E9;
          transform: translateY(-2px);
        }
        .stat-block {
          text-align: center;
          padding: 1.5rem 1rem;
          background: rgba(255,255,255,0.6);
          border-radius: 12px;
          border: ${t.emailItemBorder};
          transition: transform 0.3s ease-out, box-shadow 0.3s ease-out;
        }
        .stat-block:hover {
          transform: translateY(-4px);
          box-shadow: 0 8px 24px rgba(14,165,233,0.14);
        }
        .gradient-text {
          background: linear-gradient(135deg, #0EA5E9 0%, #06B6D4 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }
        .btn-primary-ocean {
          background: linear-gradient(135deg, #0EA5E9 0%, #06B6D4 100%);
          color: white;
          border: none;
          border-radius: 10px;
          padding: 0.75rem 2rem;
          font-size: 1.05rem;
          font-weight: 600;
          cursor: pointer;
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          transition: transform 0.3s ease-out, box-shadow 0.3s ease-out, filter 0.3s ease-out;
        }
        .btn-primary-ocean:hover {
          transform: translateY(-4px);
          box-shadow: 0 10px 28px rgba(14,165,233,0.38);
          filter: brightness(1.1);
        }
        .btn-ghost-ocean {
          background: rgba(255,255,255,0.7);
          color: #0EA5E9;
          border: 1.5px solid #0EA5E9;
          border-radius: 10px;
          padding: 0.75rem 2rem;
          font-size: 1.05rem;
          font-weight: 600;
          cursor: pointer;
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          text-decoration: none;
          transition: transform 0.3s ease-out, box-shadow 0.3s ease-out, background 0.2s;
        }
        .btn-ghost-ocean:hover {
          transform: translateY(-4px);
          box-shadow: 0 8px 20px rgba(14,165,233,0.18);
          background: rgba(14,165,233,0.08);
        }
        .hero-mockup {
          border-radius: 18px;
          overflow: hidden;
          border: 1.5px solid rgba(186,230,253,0.8);
          box-shadow: 0 20px 60px rgba(14,165,233,0.12);
          background: rgba(255,255,255,0.85);
          transition: transform 0.3s ease-out, box-shadow 0.3s ease-out;
        }
        .hero-mockup:hover {
          transform: translateY(-6px);
          box-shadow: 0 32px 80px rgba(6,182,212,0.22);
        }
        .nav-ocean {
          position: fixed;
          top: 0; left: 0; right: 0;
          z-index: 50;
          background: ${t.footerBg};
          backdrop-filter: blur(16px);
          border-bottom: 1px solid rgba(186,230,253,0.6);
        }
        .section-muted {
          background: rgba(224,242,254,0.5);
        }
        .faq-card {
          background: rgba(255,255,255,0.75);
          border: 1.5px solid rgba(186,230,253,0.7);
          border-radius: 12px;
          cursor: pointer;
          transition: box-shadow 0.3s ease-out, border-color 0.3s ease-out;
        }
        .faq-card:hover {
          box-shadow: 0 6px 20px rgba(14,165,233,0.12);
          border-color: #0EA5E9;
        }
        .cta-section {
          background: linear-gradient(135deg, #0EA5E9 0%, #06B6D4 100%);
          color: white;
        }
        .step-circle {
          width: 96px; height: 96px;
          border-radius: 50%;
          background: rgba(14,165,233,0.12);
          display: flex; align-items: center; justify-content: center;
          border: 2px solid rgba(14,165,233,0.2);
        }
        .step-num {
          position: absolute;
          top: -8px; right: -8px;
          width: 32px; height: 32px;
          border-radius: 50%;
          background: linear-gradient(135deg, #0EA5E9, #06B6D4);
          display: flex; align-items: center; justify-content: center;
          color: white;
          font-weight: 700;
          font-size: 0.85rem;
        }
        .badge-pill {
          display: inline-flex;
          align-items: center;
          gap: 0.25rem;
          background: rgba(14,165,233,0.12);
          color: #0EA5E9;
          border: 1px solid rgba(14,165,233,0.25);
          border-radius: 99px;
          padding: 0.3rem 0.85rem;
          font-size: 0.82rem;
          font-weight: 600;
          margin-bottom: 1rem;
        }
        .email-tag {
          display: inline-block;
          padding: 0.15rem 0.6rem;
          border-radius: 6px;
          font-size: 0.72rem;
          font-weight: 600;
        }
      `}</style>

      {/* Navigation */}
      <nav className="nav-ocean">
        <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '0 1.5rem' }}>
          <div style={{ display: 'flex', height: '64px', alignItems: 'center', justifyContent: 'space-between' }}>
            {/* Logo */}
            <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', textDecoration: 'none' }}>
              <div style={{
                width: '36px', height: '36px', borderRadius: '10px',
                background: 'linear-gradient(135deg, #0EA5E9, #06B6D4)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <Mail style={{ width: '18px', height: '18px', color: 'white' }} />
              </div>
              <span style={{ fontSize: '1.2rem', fontWeight: 800, color: t.text }}>SmartDraft</span>
            </Link>

            {/* Desktop Nav */}
            <div style={{ display: 'flex', gap: '2rem', alignItems: 'center' }} className="hidden md:flex">
              <a href="#features" className="nav-link">Features</a>
              <a href="#how-it-works" className="nav-link">Workflows</a>
              <a href="#about" className="nav-link">About</a>
              <a href="#faq" className="nav-link">Support</a>
            </div>

            {/* CTA Buttons + Theme Toggle */}
            <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }} className="hidden md:flex">
              {/* Theme Toggle */}
              <button
                onClick={() => setIsDark(!isDark)}
                title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
                style={{
                  width: '38px', height: '38px', borderRadius: '10px',
                  background: dk ? 'rgba(56,189,248,0.15)' : 'rgba(14,165,233,0.1)',
                  border: `1.5px solid ${dk ? 'rgba(56,189,248,0.35)' : 'rgba(14,165,233,0.25)'}`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  flexShrink: 0,
                }}
                onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px) rotate(15deg)'; }}
                onMouseLeave={e => { e.currentTarget.style.transform = 'none'; }}
              >
                {isDark
                  ? <Sun style={{ width: '17px', height: '17px', color: '#FBBF24' }} />
                  : <Moon style={{ width: '17px', height: '17px', color: '#0EA5E9' }} />
                }
              </button>
              <Link href="/login" style={{ textDecoration: 'none' }}>
                <button className="btn-ghost-ocean" style={{ padding: '0.5rem 1.25rem', fontSize: '0.9rem' }}>
                  Sign In
                </button>
              </Link>
              <Link href="/login" style={{ textDecoration: 'none' }}>
                <button className="btn-primary-ocean" style={{ padding: '0.5rem 1.25rem', fontSize: '0.9rem' }}>
                  Create Free Account
                </button>
              </Link>
            </div>

            {/* Mobile toggle */}
            <button
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: t.text }}
              className="md:hidden"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X style={{ width: '24px', height: '24px' }} /> : <Menu style={{ width: '24px', height: '24px' }} />}
            </button>
          </div>
        </div>

        {mobileMenuOpen && (
          <div style={{
            background: dk ? 'rgba(15,23,42,0.97)' : 'rgba(240,249,255,0.97)',
            borderTop: '1px solid rgba(186,230,253,0.6)', padding: '1rem 1.5rem'
          }}>
            {['#features|Features', '#how-it-works|Workflows', '#about|About', '#faq|Support'].map(item => {
              const [href, label] = item.split('|');
              return (
                <a key={href} href={href} style={{ display: 'block', padding: '0.5rem 0', color: dk ? '#94A3B8' : '#334155', textDecoration: 'none', fontWeight: 500 }} onClick={() => setMobileMenuOpen(false)}>
                  {label}
                </a>
              );
            })}
            <div style={{ marginTop: '1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {/* Dark toggle in mobile menu */}
              <button
                onClick={() => setIsDark(!isDark)}
                style={{
                  display: 'flex', alignItems: 'center', gap: '0.5rem',
                  background: dk ? 'rgba(56,189,248,0.12)' : 'rgba(14,165,233,0.08)',
                  border: t.projectBorder,
                  borderRadius: '10px', padding: '0.5rem 1rem',
                  cursor: 'pointer', color: dk ? '#38BDF8' : '#0EA5E9',
                  fontWeight: 600, fontSize: '0.875rem',
                }}
              >
                {isDark
                  ? <><Sun style={{ width: '16px', height: '16px', color: '#FBBF24' }} /> Switch to Light Mode</>
                  : <><Moon style={{ width: '16px', height: '16px' }} /> Switch to Dark Mode</>
                }
              </button>
              <Link href="/login"><button className="btn-ghost-ocean" style={{ width: '100%', justifyContent: 'center' }}>Sign In</button></Link>
              <Link href="/login"><button className="btn-primary-ocean" style={{ width: '100%', justifyContent: 'center' }}>Create Free Account</button></Link>
            </div>
          </div>
        )}
      </nav>

      {/* Hero Section */}
      <section style={{ paddingTop: '8rem', paddingBottom: '5rem', paddingLeft: '1.5rem', paddingRight: '1.5rem' }}>
        <div style={{ maxWidth: '1280px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center' }}>
            <div className="badge-pill">
              <Sparkles style={{ width: '13px', height: '13px' }} />
              ✨ Intelligent Email Orchestration
            </div>
            <h1 style={{ fontSize: 'clamp(2.5rem, 7vw, 4.5rem)', fontWeight: 900, lineHeight: 1.1, letterSpacing: '-0.02em', color: t.text, marginBottom: '1.5rem' }}>
              Your Inbox,{' '}
              <span className="gradient-text">Revolutionized<br />by Agentic AI</span>
            </h1>
            <p style={{ maxWidth: '640px', margin: '0 auto 2.5rem', fontSize: '1.15rem', lineHeight: 1.7, color: t.muted }}>
              Stop drowning in correspondence. Automate routine triage, prioritization, and response drafting while maintaining perfect oversight and governance.
            </p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', justifyContent: 'center', alignItems: 'center' }}>
              <Link href="/login" style={{ textDecoration: 'none' }}>
                <button className="btn-primary-ocean" style={{ fontSize: '1.05rem', padding: '0.85rem 2.2rem' }}>
                  Start Your Free Trial <ArrowRight style={{ width: '18px', height: '18px' }} />
                </button>
              </Link>
            </div>
            <p style={{ marginTop: '1rem', fontSize: '0.82rem', color: '#64748B' }}>
              No credit card required · Free plan available · Cancel anytime
            </p>
          </div>

        </div>
      </section>

      {/* Features Section */}
      <section id="features" style={{ padding: '5rem 1.5rem' }}>
        <div style={{ maxWidth: '1280px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '3.5rem' }}>
            <div className="badge-pill"><Sparkles style={{ width: '13px', height: '13px' }} />Features</div>
            <h2 style={{ fontSize: 'clamp(1.8rem,4vw,2.5rem)', fontWeight: 800, color: t.text, marginBottom: '0.75rem' }}>
              Everything You Need to <span className="gradient-text">Conquer Your Inbox</span>
            </h2>
            <p style={{ fontSize: '1.05rem', color: t.muted, maxWidth: '540px', margin: '0 auto' }}>
              Powerful AI features that work together to save you hours every week
            </p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(280px,1fr))', gap: '1.5rem' }}>
            {features.map((feature, i) => (
              <div key={i} className="card-ocean" style={{ padding: '1.75rem' }}>
                <div style={{
                  width: '48px', height: '48px', borderRadius: '12px',
                  background: t.iconBg,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  marginBottom: '1rem', border: t.iconBorder,
                }}>
                  <feature.icon style={{ width: '22px', height: '22px', color: '#0EA5E9' }} />
                </div>
                <h3 style={{ fontSize: '1rem', fontWeight: 700, color: t.text, marginBottom: '0.5rem' }}>{feature.title}</h3>
                <p style={{ fontSize: '0.9rem', color: t.muted, lineHeight: 1.65 }}>{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" style={{ padding: '5rem 1.5rem', background: t.sectionBg }}>
        <div style={{ maxWidth: '1280px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '3.5rem' }}>
            <div className="badge-pill">Workflows</div>
            <h2 style={{ fontSize: 'clamp(1.8rem,4vw,2.5rem)', fontWeight: 800, color: t.text, marginBottom: '0.75rem' }}>
              Get Started in Minutes
            </h2>
            <p style={{ fontSize: '1.05rem', color: t.muted, maxWidth: '480px', margin: '0 auto' }}>
              Simple setup, powerful results. No technical skills required.
            </p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(200px,1fr))', gap: '2rem' }}>
            {howItWorks.map((step, i) => (
              <div key={i} style={{ textAlign: 'center', position: 'relative' }}>
                {i < howItWorks.length - 1 && (
                  <div style={{ display: 'none' }} className="lg:block" />
                )}
                <div style={{ display: 'inline-flex', position: 'relative' }}>
                  <div className="step-circle">
                    <step.icon style={{ width: '36px', height: '36px', color: '#0EA5E9' }} />
                  </div>
                  <div className="step-num">{step.step}</div>
                </div>
                <h3 style={{ marginTop: '1.5rem', fontSize: '1rem', fontWeight: 700, color: t.text, marginBottom: '0.4rem' }}>{step.title}</h3>
                <p style={{ fontSize: '0.875rem', color: t.muted, lineHeight: 1.65 }}>{step.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* About Section */}
      <section id="about" style={{ padding: '5rem 1.5rem' }}>
        <div style={{ maxWidth: '900px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
            <div className="badge-pill">About This Project</div>
            <h2 style={{ fontSize: 'clamp(1.8rem,4vw,2.5rem)', fontWeight: 800, color: t.text, marginBottom: '0.75rem' }}>
              Built with Passion, <span className="gradient-text">Powered by AI</span>
            </h2>
            <p style={{ fontSize: '1.05rem', color: t.muted, maxWidth: '580px', margin: '0 auto' }}>
              This platform is the culmination of academic research, real-world engineering, and a deep belief that AI can transform everyday productivity.
            </p>
          </div>

          {/* Creator Card */}
          <div className="card-ocean" style={{ padding: '2.5rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1.5rem', maxWidth: '560px', margin: '0 auto' }}>
            {/* Avatar */}
            <div style={{
              width: '88px', height: '88px', borderRadius: '50%',
              background: 'linear-gradient(135deg, #0EA5E9, #06B6D4)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '2.2rem', fontWeight: 900, color: 'white',
              boxShadow: '0 8px 24px rgba(14,165,233,0.3)',
              border: '3px solid rgba(255,255,255,0.8)',
            }}>
              V
            </div>

            {/* Info */}
            <div style={{ textAlign: 'center' }}>
              <h3 style={{ fontSize: '1.4rem', fontWeight: 800, color: t.text, marginBottom: '0.25rem' }}>
                Vijayakrishnan SR
              </h3>
              <p style={{ fontSize: '0.95rem', color: '#0EA5E9', fontWeight: 600, marginBottom: '0.5rem' }}>
                AI &amp; Machine Learning Student
              </p>
              <p style={{ fontSize: '0.9rem', color: '#64748B', lineHeight: 1.6 }}>
                Bharata Mata College
              </p>
            </div>

            {/* Project Badge */}
            <div style={{
              background: t.projectBg,
              border: t.projectBorder,
              borderRadius: '12px', padding: '1rem 1.5rem', textAlign: 'center', width: '100%',
            }}>
              <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#0EA5E9', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.35rem' }}>
                🎓 Final Year Project
              </div>
              <p style={{ fontSize: '0.875rem', color: t.muted, lineHeight: 1.65, margin: 0 }}>
                <strong style={{ color: t.text }}>AI Email Automation Platform</strong> — An agentic AI system that classifies, drafts, and manages email correspondence autonomously, with human-in-the-loop governance and Llama 3.3 70B (Groq) as the AI core.
              </p>
            </div>

            {/* Social Links */}
            <div style={{ display: 'flex', gap: '0.85rem', flexWrap: 'wrap', justifyContent: 'center' }}>
              {/* LinkedIn */}
              <a
                href="https://linkedin.com/in/YOUR_LINKEDIN_USERNAME"  /* 🔗 Replace with your LinkedIn URL */
                target="_blank"
                rel="noopener noreferrer"
                className="hover-lift"
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: '0.45rem',
                  background: 'rgba(14,165,233,0.08)', border: '1.5px solid rgba(14,165,233,0.3)',
                  borderRadius: '10px', padding: '0.5rem 1.1rem',
                  fontSize: '0.85rem', fontWeight: 600, color: '#0EA5E9', textDecoration: 'none',
                  transition: 'all 0.3s ease-out',
                }}
                onMouseEnter={e => { e.currentTarget.style.background = 'rgba(14,165,233,0.18)'; }}
                onMouseLeave={e => { e.currentTarget.style.background = 'rgba(14,165,233,0.08)'; }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                </svg>
                LinkedIn
              </a>

              {/* Instagram */}
              <a
                href="https://instagram.com/YOUR_INSTAGRAM_HANDLE"  /* 📸 Replace with your Instagram URL */
                target="_blank"
                rel="noopener noreferrer"
                className="hover-lift"
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: '0.45rem',
                  background: 'rgba(6,182,212,0.08)', border: '1.5px solid rgba(6,182,212,0.3)',
                  borderRadius: '10px', padding: '0.5rem 1.1rem',
                  fontSize: '0.85rem', fontWeight: 600, color: '#06B6D4', textDecoration: 'none',
                  transition: 'all 0.3s ease-out',
                }}
                onMouseEnter={e => { e.currentTarget.style.background = 'rgba(6,182,212,0.18)'; }}
                onMouseLeave={e => { e.currentTarget.style.background = 'rgba(6,182,212,0.08)'; }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/>
                </svg>
                Instagram
              </a>

              {/* GitHub */}
              <a
                href="https://github.com/YOUR_GITHUB_USERNAME"  /* 💻 Replace with your GitHub URL */
                target="_blank"
                rel="noopener noreferrer"
                className="hover-lift"
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: '0.45rem',
                  background: 'rgba(15,23,42,0.06)', border: '1.5px solid rgba(15,23,42,0.2)',
                  borderRadius: '10px', padding: '0.5rem 1.1rem',
                  fontSize: '0.85rem', fontWeight: 600, color: t.text, textDecoration: 'none',
                  transition: 'all 0.3s ease-out',
                }}
                onMouseEnter={e => { e.currentTarget.style.background = 'rgba(15,23,42,0.14)'; }}
                onMouseLeave={e => { e.currentTarget.style.background = 'rgba(15,23,42,0.06)'; }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12"/>
                </svg>
                GitHub
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section style={{ padding: '5rem 1.5rem', background: t.sectionBg }}>
        <div style={{ maxWidth: '1280px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '3.5rem' }}>
            <div className="badge-pill">Testimonials</div>
            <h2 style={{ fontSize: 'clamp(1.8rem,4vw,2.5rem)', fontWeight: 800, color: t.text, marginBottom: '0.75rem' }}>
              Validated by <span className="gradient-text">Productivity Leaders</span>
            </h2>
            <p style={{ fontSize: '1.05rem', color: t.muted, maxWidth: '480px', margin: '0 auto' }}>
              See what professionals say about AI Email Automation Platform
            </p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(280px,1fr))', gap: '1.5rem' }}>
            {testimonials.map((tm, i) => (
              <div key={i} className="card-ocean" style={{ padding: '1.75rem' }}>
                <div style={{ display: 'flex', gap: '3px', marginBottom: '0.75rem' }}>
                  {[...Array(tm.rating)].map((_, j) => (
                    <Star key={j} style={{ width: '18px', height: '18px', fill: '#FBBF24', color: '#FBBF24' }} />
                  ))}
                </div>
                <p style={{ fontSize: '0.9rem', color: t.muted, lineHeight: 1.7, marginBottom: '1.25rem' }}>"{tm.content}"</p>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <div style={{
                    width: '40px', height: '40px', borderRadius: '50%',
                    background: t.avatarBg,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontWeight: 700, color: '#0EA5E9', fontSize: '0.95rem',
                    border: '2px solid rgba(14,165,233,0.25)',
                  }}>
                    {tm.name[0]}
                  </div>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '0.9rem', color: t.text }}>{tm.name}</div>
                    <div style={{ fontSize: '0.78rem', color: t.subtle }}>{tm.role} at {tm.company}</div>
                  </div>
                </div>
              </div>

            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" style={{ padding: '5rem 1.5rem' }}>
        <div style={{ maxWidth: '740px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '3.5rem' }}>
            <div className="badge-pill">Support</div>
            <h2 style={{ fontSize: 'clamp(1.8rem,4vw,2.5rem)', fontWeight: 800, color: t.text, marginBottom: '0.75rem' }}>
              Frequently Asked Questions
            </h2>
            <p style={{ fontSize: '1.05rem', color: t.muted }}>Got questions? We've got answers.</p>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
            {faqs.map((faq, i) => (
              <div key={i} className="faq-card" onClick={() => setOpenFaq(openFaq === i ? null : i)}>
                <div style={{ padding: '1rem 1.25rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem' }}>
                  <span style={{ fontWeight: 600, fontSize: '0.95rem', color: t.text }}>{faq.question}</span>
                  <ChevronDown style={{
                    width: '18px', height: '18px', color: '#0EA5E9', flexShrink: 0,
                    transform: openFaq === i ? 'rotate(180deg)' : 'none',
                    transition: 'transform 0.3s',
                  }} />
                </div>
                {openFaq === i && (
                  <div style={{ padding: '0 1.25rem 1rem', color: t.muted, fontSize: '0.9rem', lineHeight: 1.7 }}>
                    {faq.answer}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="cta-section" style={{ padding: '5rem 1.5rem' }}>
        <div style={{ maxWidth: '900px', margin: '0 auto', textAlign: 'center' }}>
          <h2 style={{ fontSize: 'clamp(1.8rem,4vw,2.5rem)', fontWeight: 800, marginBottom: '1rem' }}>
            Ready to Transform Your Inbox?
          </h2>
          <p style={{ fontSize: '1.1rem', opacity: 0.9, marginBottom: '2rem', maxWidth: '560px', margin: '0 auto 2rem' }}>
            Join thousands of professionals who save hours every week with AI Email Automation Platform.
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', justifyContent: 'center' }}>
            <Link href="/login" style={{ textDecoration: 'none' }}>
              <button style={{
                background: 'white', color: '#0EA5E9', border: 'none',
                borderRadius: '10px', padding: '0.85rem 2.2rem',
                fontSize: '1.05rem', fontWeight: 700, cursor: 'pointer',
                display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
                transition: 'transform 0.3s, box-shadow 0.3s',
              }} className="hover-lift">
                Create Free Account <ArrowRight style={{ width: '18px', height: '18px' }} />
              </button>
            </Link>
            <Link href="/login" style={{ textDecoration: 'none' }}>
              <button style={{
                background: 'transparent', color: 'white',
                border: '2px solid rgba(255,255,255,0.7)',
                borderRadius: '10px', padding: '0.85rem 2.2rem',
                fontSize: '1.05rem', fontWeight: 700, cursor: 'pointer',
                transition: 'transform 0.3s, box-shadow 0.3s, background 0.2s',
              }} className="hover-lift">
                Sign In
              </button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer style={{ borderTop: '1px solid rgba(186,230,253,0.6)', padding: '3rem 1.5rem', background: t.footerBg }}>
        <div style={{ maxWidth: '1280px', margin: '0 auto' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(160px,1fr))', gap: '2rem', marginBottom: '2.5rem' }}>
            <div>
              <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', textDecoration: 'none', marginBottom: '0.75rem' }}>
                <div style={{
                  width: '32px', height: '32px', borderRadius: '8px',
                  background: 'linear-gradient(135deg,#0EA5E9,#06B6D4)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <Mail style={{ width: '16px', height: '16px', color: 'white' }} />
                </div>
                <span style={{ fontWeight: 800, color: t.text }}>SmartDraft</span>
              </Link>
              <p style={{ fontSize: '0.83rem', color: '#64748B', lineHeight: 1.6 }}>
                The AI-powered email client that helps you work smarter, not harder.
              </p>
            </div>
            {[
              { title: 'Product', links: ['Features', 'Pricing', 'Integrations', 'Changelog'] },
              { title: 'Company', links: ['About', 'Blog', 'Careers', 'Contact'] },
              { title: 'Legal', links: ['Privacy Policy', 'Terms of Service', 'Cookie Policy', 'GDPR'] },
            ].map(col => (
              <div key={col.title}>
                <h4 style={{ fontWeight: 700, fontSize: '0.9rem', color: t.text, marginBottom: '0.75rem' }}>{col.title}</h4>
                <ul style={{ listStyle: 'none', padding: 0, display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                  {col.links.map(link => (
                    <li key={link}>
                      <a href="#" style={{ fontSize: '0.83rem', color: '#64748B', textDecoration: 'none', transition: 'color 0.2s' }}
                        onMouseEnter={e => (e.currentTarget.style.color = '#0EA5E9')}
                        onMouseLeave={e => (e.currentTarget.style.color = '#64748B')}>{link}</a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          <div style={{ borderTop: '1px solid rgba(186,230,253,0.5)', paddingTop: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
            <p style={{ fontSize: '0.82rem', color: t.faint }}>© {new Date().getFullYear()} SmartDraft. All rights reserved.</p>
            <div style={{ display: 'flex', gap: '1rem' }}>
              {[Globe, MessageSquare].map((Icon, i) => (
                <a key={i} href="#" style={{ color: t.faint, transition: 'color 0.2s' }}
                  onMouseEnter={e => (e.currentTarget.style.color = '#0EA5E9')}
                  onMouseLeave={e => (e.currentTarget.style.color = '#94A3B8')}>
                  <Icon style={{ width: '20px', height: '20px' }} />
                </a>
              ))}
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
