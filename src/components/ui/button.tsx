import { forwardRef, type ButtonHTMLAttributes } from 'react'
import { Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' | 'link'
  size?: 'sm' | 'md' | 'lg' | 'icon'
  loading?: boolean
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', loading, disabled, children, ...props }, ref) => {
    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={cn(
          'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500/50 disabled:cursor-not-allowed disabled:opacity-50',
          {
            'bg-primary-600 text-white shadow-sm hover:bg-primary-700 active:bg-primary-800':
              variant === 'primary',
            'bg-gray-900 text-white shadow-sm hover:bg-gray-800': variant === 'secondary',
            'border border-gray-300 bg-white text-gray-700 shadow-sm hover:bg-gray-50 hover:text-gray-900':
              variant === 'outline',
            'text-gray-600 hover:bg-gray-100 hover:text-gray-900': variant === 'ghost',
            'bg-red-600 text-white shadow-sm hover:bg-red-700': variant === 'danger',
            'p-0 font-semibold text-primary-600 hover:text-primary-700 hover:underline':
              variant === 'link',
          },
          {
            'h-8 px-3 text-xs': size === 'sm',
            'h-10 px-4 text-sm': size === 'md',
            'h-11 px-6 text-sm': size === 'lg',
            'h-10 w-10': size === 'icon',
          },
          className,
        )}
        {...props}
      >
        {loading && <Loader2 className="h-4 w-4 animate-spin" />}
        {children}
      </button>
    )
  },
)
Button.displayName = 'Button'

export { Button }
