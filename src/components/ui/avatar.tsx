import { cn, getInitials } from '@/lib/utils'

export function Avatar({
  name,
  url,
  size = 'md',
  className,
}: {
  name?: string | null
  url?: string | null
  size?: 'xs' | 'sm' | 'md' | 'lg'
  className?: string
}) {
  const sizes = {
    xs: 'h-6 w-6 text-[10px]',
    sm: 'h-8 w-8 text-xs',
    md: 'h-10 w-10 text-sm',
    lg: 'h-14 w-14 text-lg',
  }

  return (
    <div
      className={cn(
        'relative inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-primary-100 font-semibold text-primary-700',
        sizes[size],
        className,
      )}
    >
      {url ? (
        <img src={url} alt={name ?? ''} className="h-full w-full object-cover" />
      ) : (
        getInitials(name)
      )}
    </div>
  )
}
