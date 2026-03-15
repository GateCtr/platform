'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowRight, Check, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import { z } from 'zod';

// Schéma de validation Zod
const waitlistSchema = z.object({
  email: z
    .string()
    .min(1, 'Email is required')
    .email('Please enter a valid email address'),
  name: z.string().optional(),
  company: z.string().optional(),
  useCase: z.string().optional(),
});


export default function WaitlistPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [company, setCompany] = useState('');
  const [useCase, setUseCase] = useState('');
  const [emailError, setEmailError] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [position, setPosition] = useState<number | null>(null);

  // Validation email en temps réel
  const validateEmail = (value: string) => {
    if (!value) {
      setEmailError('');
      return;
    }
    try {
      waitlistSchema.shape.email.parse(value);
      setEmailError('');
    } catch (err) {
      if (err instanceof z.ZodError) {
        setEmailError(err.issues[0]?.message || 'Invalid email');
      }
    }
  };

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setEmail(value);
    validateEmail(value);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // Validation
    try {
      waitlistSchema.parse({ email, name, company, useCase });
    } catch (err) {
      if (err instanceof z.ZodError) {
        setEmailError(err.issues[0]?.message || 'Invalid email');
        setLoading(false);
        return;
      }
    }

    try {
      const response = await fetch('/api/waitlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, name, company, useCase }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to join waitlist');
      }

      setSuccess(true);
      setPosition(data.position);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background px-4">
        <div className="absolute top-4 right-4">
          <ThemeToggle />
        </div>
        <Card className="max-w-md w-full text-center">
          <CardHeader>
            <div className="w-16 h-16 bg-secondary/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <Check className="w-8 h-8 text-secondary" />
            </div>
            <CardTitle className="text-3xl">You&apos;re on the list</CardTitle>
            <CardDescription className="text-base">
              We&apos;ll notify you when it&apos;s your turn.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {position && (
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-muted rounded-full">
                <span className="text-sm text-muted-foreground">Position</span>
                <span className="text-lg font-semibold text-foreground">#{position}</span>
              </div>
            )}

            <Button
              onClick={() => router.push('/')}
              variant="ghost"
            >
              Back to home
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>
      <Card className="max-w-md w-full">
        <CardHeader className="text-center space-y-2">
          <CardTitle className="text-4xl font-display">GateCtr</CardTitle>
          <CardDescription className="text-base">
            Control your LLM costs with intelligent middleware
          </CardDescription>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-3">
              <Input
                type="email"
                required
                value={email}
                onChange={handleEmailChange}
                placeholder="Email address"
                className={emailError ? 'border-destructive' : ''}
                aria-invalid={!!emailError}
              />
              {emailError && (
                <p className="text-sm text-destructive flex items-center gap-1.5">
                  <AlertCircle className="w-3.5 h-3.5" />
                  {emailError}
                </p>
              )}

              <Input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Full name (optional)"
              />

              <Input
                type="text"
                value={company}
                onChange={(e) => setCompany(e.target.value)}
                placeholder="Company (optional)"
              />

              <Select value={useCase} onValueChange={setUseCase}>
                <SelectTrigger>
                  <SelectValue placeholder="Use case (optional)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectItem value="saas">SaaS Product</SelectItem>
                    <SelectItem value="agent">AI Agent</SelectItem>
                    <SelectItem value="enterprise">Enterprise</SelectItem>
                    <SelectItem value="dev">Development/Testing</SelectItem>
                  </SelectGroup>
                </SelectContent>
              </Select>
            </div>

            {error && (
              <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
                <p className="text-sm text-destructive flex items-center gap-2">
                  <AlertCircle className="w-4 h-4" />
                  {error}
                </p>
              </div>
            )}

            <Button
              type="submit"
              disabled={loading || !!emailError || !email}
              className="w-full group"
              size="lg"
            >
              {loading ? (
                'Joining...'
              ) : (
                <>
                  Join waitlist
                  <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-0.5 transition-transform" />
                </>
              )}
            </Button>

            <p className="text-center text-sm text-muted-foreground pt-2">
              Get notified when we launch
            </p>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
