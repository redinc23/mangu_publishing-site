import clsx from 'clsx';
import { FileQuestion } from 'lucide-react';
import Button from './Button';

export function EmptyState({
  icon: Icon = FileQuestion,
  title = 'No data found',
  description,
  action,
  actionLabel,
  className
}) {
  return (
    <div className={clsx('flex flex-col items-center justify-center py-12 px-4', className)}>
      <div className="flex items-center justify-center w-16 h-16 rounded-full bg-neutral-100 mb-4">
        <Icon className="w-8 h-8 text-neutral-400" />
      </div>
      <h3 className="text-lg font-semibold text-neutral-900 mb-2">{title}</h3>
      {description && <p className="text-sm text-neutral-500 text-center max-w-md mb-6">{description}</p>}
      {action && actionLabel && (
        <Button onClick={action} variant="primary">
          {actionLabel}
        </Button>
      )}
    </div>
  );
}

export default EmptyState;
