import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

type StatCardVariant = 'primary' | 'accent' | 'success' | 'warning' | 'danger';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  variant: StatCardVariant;
}

const iconContainerVariants: Record<StatCardVariant, string> = {
  primary: 'bg-primary-50 text-primary-700 border-primary-100',
  accent: 'bg-accent-50 text-accent-700 border-accent-100',
  success: 'bg-success-bg text-success border-success/20',
  warning: 'bg-warning-bg text-warning border-warning/20',
  danger: 'bg-danger-bg text-danger border-danger/20',
};

export function StatCard({ title, value, icon: Icon, variant }: StatCardProps) {
  return (
    <div className="card p-5 rounded-2xl flex items-center space-x-4 transition-all duration-300 hover:-translate-y-0.5 hover:border-primary-200 group cursor-pointer">
      <div
        className={cn(
          'p-3 rounded-xl transition-all duration-300 group-hover:scale-105 border',
          iconContainerVariants[variant]
        )}
      >
        <Icon className="w-5 h-5 transition-transform duration-300 group-hover:rotate-3" />
      </div>
      <div className="space-y-0.5">
        <p className="text-[10px] text-ink-soft font-bold uppercase tracking-wider">
          {title}
        </p>
        <h4 className="text-xl sm:text-2xl font-extrabold text-ink tracking-tight">
          {value}
        </h4>
      </div>
    </div>
  );
}
