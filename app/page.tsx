import { AppHeader } from '@/components/tasks/app-header';
import { TasksBoard } from '@/components/tasks/tasks-board';

export default function HomePage() {
  return (
    <div className="flex min-h-full flex-col">
      <AppHeader />
      <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col px-4 py-8 sm:px-6 lg:px-8">
        <TasksBoard />
      </main>
    </div>
  );
}
