import { forwardRef, type SelectHTMLAttributes } from 'react'
import { ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  error?: string
}

const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, error, children, ...props }, ref) => {
    return (
      <div className="w-full">
        <div className="relative">
          <select
            ref={ref}
            className={cn(
              'h-10 w-full appearance-none rounded-lg border border-gray-300 bg-white px-3 pe-9 text-sm text-gray-900 shadow-sm transition focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/30 disabled:cursor-not-allowed disabled:bg-gray-50',
              error && 'border-red-400',
              className,
            )}
            {...props}
          >
            {children}
          </select>
          <ChevronDown className="pointer-events-none absolute end-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
        </div>
        {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
      </div>
    )
  },
)
Select.displayName = 'Select'

export { Select }
