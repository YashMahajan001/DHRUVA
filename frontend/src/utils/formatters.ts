export function formatDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  return `${String(h).padStart(2, '0')}h ${String(m).padStart(2, '0')}m ${String(s).padStart(2, '0')}s`;
}

export function formatShortDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  return `${String(h).padStart(2, '0')}h ${String(m).padStart(2, '0')}m`;
}

export function formatNumber(val: number, decimals = 1): string {
  return Number.isFinite(val) ? val.toFixed(decimals) : '0.0';
}

export function getHealthStatusColor(status: string): {
  bg: string;
  text: string;
  border: string;
  glow: string;
} {
  switch (status) {
    case 'NOMINAL':
    case 'NORMAL':
      return {
        bg: 'bg-emerald-500/10',
        text: 'text-emerald-400',
        border: 'border-emerald-500/30',
        glow: 'shadow-[0_0_8px_rgba(16,185,129,0.3)]'
      };
    case 'WATCH':
    case 'ADVISORY':
      return {
        bg: 'bg-amber-500/10',
        text: 'text-amber-400',
        border: 'border-amber-500/30',
        glow: 'shadow-[0_0_8px_rgba(245,158,11,0.3)]'
      };
    case 'WARNING':
      return {
        bg: 'bg-orange-500/15',
        text: 'text-orange-400',
        border: 'border-orange-500/40',
        glow: 'shadow-[0_0_12px_rgba(249,115,22,0.4)]'
      };
    case 'CRITICAL':
      return {
        bg: 'bg-red-500/20',
        text: 'text-red-400',
        border: 'border-red-500/50',
        glow: 'shadow-[0_0_14px_rgba(239,68,68,0.5)]'
      };
    default:
      return {
        bg: 'bg-primary/10',
        text: 'text-primary',
        border: 'border-primary/30',
        glow: 'shadow-[0_0_8px_rgba(0,240,255,0.25)]'
      };
  }
}
