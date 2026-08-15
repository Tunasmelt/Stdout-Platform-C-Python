import React from 'react'

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline'
  size?: 'sm' | 'md' | 'lg'
  children: React.ReactNode
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'primary', size = 'md', className, ...props }, ref) => {
    const baseStyles = 'font-medium transition-colors rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2'
    
    const variantStyles = {
      primary: 'bg-[#f78166] text-[#0d1117] hover:bg-[#e8634a] focus:ring-[#f78166]',
      secondary: 'bg-[#161b22] text-[#e6edf3] hover:bg-[#21262d] focus:ring-[#f78166]',
      outline: 'border border-[#30363d] text-[#e6edf3] hover:bg-[#161b22] focus:ring-[#f78166]',
    }

    const sizeStyles = {
      sm: 'px-3 py-1.5 text-sm',
      md: 'px-4 py-2 text-base',
      lg: 'px-6 py-3 text-lg',
    }

    return (
      <button
        ref={ref}
        className={`${baseStyles} ${variantStyles[variant]} ${sizeStyles[size]} ${className || ''}`}
        {...props}
      />
    )
  }
)

Button.displayName = 'Button'
