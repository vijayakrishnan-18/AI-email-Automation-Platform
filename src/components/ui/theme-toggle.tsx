"use client";

import { useEffect, useState } from 'react';
import { Sun, Moon } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function ThemeToggle() {
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    // 1. Check if user explicitly set a preference before
    const stored = localStorage.getItem('theme');
    
    // 2. If explicitly dark, respect that
    if (stored === 'dark') {
      document.documentElement.classList.add('dark');
      setIsDark(true);
      return;
    }
    
    // 3. Otherwise (explicitly light, or NO preference set), default to LIGHT
    document.documentElement.classList.remove('dark');
    setIsDark(false);
    
    // We explicitly DO NOT check window.matchMedia('(prefers-color-scheme: dark)')
    // anymore because the user requested Light Mode as the absolute default.
  }, []);

  const toggle = () => {
    const next = !isDark;
    setIsDark(next);
    if (next) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  };

  return (
    <Button variant="ghost" size="icon" onClick={toggle} aria-label="Toggle theme">
      {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
    </Button>
  );
}
