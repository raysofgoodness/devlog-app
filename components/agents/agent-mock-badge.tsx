import { Badge } from '@/components/ui/badge';

interface AgentMockBadgeProps {
  isMock: boolean;
}

export function AgentMockBadge({ isMock }: AgentMockBadgeProps) {
  if (!isMock) {
    return null;
  }

  return (
    <Badge variant="secondary" className="font-mono text-[10px] uppercase">
      Mock LLM
    </Badge>
  );
}
