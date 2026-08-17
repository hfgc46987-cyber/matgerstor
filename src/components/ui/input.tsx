import { forwardRef, type InputHTMLAttributes, type ReactNode } from 'react'
import { cn } from '@/lib/utils'

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  error?: string
  icon?: ReactNode
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, error, icon, ...props }, ref) => {
    return (
      <div className="w-full">
        <div className="relative">
          {icon && (
            <div className="pointer-events-none absolute inset-y-0 start-3 flex items-center text-gray-400">
              {icon}
            </div>
          )}
          <input
            ref={ref}
            className={cn(
              'h-10 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm text-gray-900 shadow-sm transition placeholder:text-gray-400 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/30 disabled:cursor-not-allowed disabled:bg-gray-50 disabled:text-gray-500',
              icon && 'ps-10',
              error && 'border-red-400 focus:border-red-500 focus:ring-red-500/30',
              className,
            )}
            {...props}
          />
        </div>
        {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
      </div>
    )
  },
)
Input.displayName = 'Input'

export { Input }
