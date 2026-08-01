import { RefreshCw, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

/**
 * SSE connection indicator + last updated text + manual refresh button.
 * Shows a green "Live" dot when SSE is connected,
 * or a muted "Offline" state when disconnected.
 */
export function LeavePageHeader({
  title,
  subtitle,
  sseConnected,
  refreshing,
  lastUpdatedText,
  onRefresh,
  children,
}: {
  title: string;
  subtitle: string;
  sseConnected: boolean;
  refreshing: boolean;
  lastUpdatedText?: string;
  onRefresh: () => void;
  children?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
      <div>
        <div className="flex items-center gap-3">
          <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
            {title}
          </h1>
          {/* SSE Status Indicator */}
          {sseConnected ? (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-200/50 text-[10px] font-bold text-emerald-600 uppercase tracking-wider select-none">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
              </span>
              Live
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-100 border border-slate-200/50 text-[10px] font-bold text-slate-400 uppercase tracking-wider select-none">
              <span className="relative flex h-2 w-2">
                <span className="relative inline-flex rounded-full h-2 w-2 bg-slate-300" />
              </span>
              Offline
            </span>
          )}
        </div>
        <p className="text-muted-foreground mt-1">{subtitle}</p>
      </div>
      <div className="flex items-center gap-3 shrink-0">
        {lastUpdatedText && (
          <span className="text-[11px] font-medium text-slate-400 hidden sm:inline">
            {lastUpdatedText}
          </span>
        )}
        <Button
          variant="outline"
          size="sm"
          onClick={onRefresh}
          disabled={refreshing}
          className="gap-1.5 border-slate-200 rounded-xl text-xs font-bold h-9 px-3"
        >
          {refreshing ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <RefreshCw className="h-3.5 w-3.5" />
          )}
          {refreshing ? "Refreshing…" : "Refresh"}
        </Button>
        {children}
      </div>
    </div>
  );
}
