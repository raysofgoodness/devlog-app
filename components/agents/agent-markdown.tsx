interface AgentMarkdownProps {
  content: string;
}

export function AgentMarkdown({ content }: AgentMarkdownProps) {
  return (
    <div className="max-h-[min(50vh,28rem)] overflow-y-auto rounded-lg border bg-muted/30 p-4">
      <pre className="font-sans text-sm leading-relaxed whitespace-pre-wrap text-foreground">
        {content}
      </pre>
    </div>
  );
}
