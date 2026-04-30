import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  icon: LucideIcon;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}

export function EmptyState({ icon: Icon, title, description, action, className }: Props) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center rounded-2xl border border-dashed border-border/70 bg-muted/30 px-4 py-16 text-center",
        className,
      )}
    >
      <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-background shadow-soft">
        <Icon className="h-8 w-8 text-muted-foreground" strokeWidth={1.5} />
      </div>
      <h3 className="mb-1 text-lg font-semibold tracking-tight">{title}</h3>
      {description && (
        <p className="mb-6 max-w-sm text-sm text-muted-foreground">{description}</p>
      )}
      {action}
    </div>
  );
}
