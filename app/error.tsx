'use client';

import { useEffect } from 'react';

import { AppHeader } from '@/components/tasks/app-header';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

interface ErrorPageProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function ErrorPage({ error, reset }: ErrorPageProps) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-svh flex-1 flex-col bg-background">
      <AppHeader />
      <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col px-4 py-8 sm:px-6 lg:px-8">
        <Card className="border-destructive/40">
          <CardHeader>
            <CardTitle>Something went wrong</CardTitle>
            <CardDescription>
              {error.message || 'An unexpected error occurred. Try again.'}
            </CardDescription>
          </CardHeader>
          <CardFooter>
            <Button onClick={reset}>Try again</Button>
          </CardFooter>
        </Card>
      </main>
    </div>
  );
}
