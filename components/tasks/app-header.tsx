import { ThemeToggle } from '@/components/theme-toggle';

export function AppHeader() {
  return (
    <header className="border-b bg-card/80 backdrop-blur-sm">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-4 px-4 py-6 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-1">
          <p className="font-mono text-xs uppercase tracking-[0.2em] text-muted-foreground">
            DevLog
          </p>
          <h1 className="font-heading text-2xl font-semibold tracking-tight sm:text-3xl">
            Task tracker
          </h1>
        </div>
        <ThemeToggle />
      </div>
    </header>
  );
}
