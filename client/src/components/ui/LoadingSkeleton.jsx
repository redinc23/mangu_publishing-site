import clsx from 'clsx';

export function LoadingSkeleton({ className, variant = 'text', count = 1 }) {
  const variants = {
    text: 'h-4 rounded',
    title: 'h-8 rounded',
    avatar: 'h-12 w-12 rounded-full',
    button: 'h-10 rounded-lg',
    card: 'h-64 rounded-xl',
    thumbnail: 'h-48 rounded-lg'
  };

  return (
    <>
      {Array.from({ length: count }).map((_, index) => (
        <div
          key={index}
          className={clsx(
            'animate-shimmer bg-gradient-to-r from-neutral-200 via-neutral-100 to-neutral-200',
            'bg-[length:200%_100%]',
            variants[variant],
            className
          )}
        />
      ))}
    </>
  );
}

export function BookCardSkeleton() {
  return (
    <div className="bg-white rounded-xl shadow-sm p-6 space-y-4">
      <LoadingSkeleton variant="thumbnail" />
      <LoadingSkeleton variant="title" />
      <LoadingSkeleton variant="text" count={2} />
      <LoadingSkeleton variant="button" />
    </div>
  );
}

export function TableSkeleton({ rows = 5, columns = 4 }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <div key={rowIndex} className="flex gap-4">
          {Array.from({ length: columns }).map((_, colIndex) => (
            <LoadingSkeleton key={colIndex} className="flex-1" />
          ))}
        </div>
      ))}
    </div>
  );
}

export default LoadingSkeleton;
