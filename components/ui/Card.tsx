import React from 'react'

interface CardProps {
  children: React.ReactNode
  className?: string
}

export const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className, children }, ref) => {
    return (
      <div
        ref={ref}
        className={`bg-[#161b22] border border-[#30363d] rounded-lg p-6 text-[#e6edf3] ${className || ''}`}
      >
        {children}
      </div>
    )
  }
)

Card.displayName = 'Card'

export const CardHeader = React.forwardRef<
  HTMLDivElement,
  CardProps
>(({ className, children }, ref) => (
  <div ref={ref} className={`mb-4 ${className || ''}`}>
    {children}
  </div>
))
CardHeader.displayName = 'CardHeader'

export const CardTitle = React.forwardRef<
  HTMLHeadingElement,
  CardProps & { as?: 'h1' | 'h2' | 'h3' }
>(({ className, children, as = 'h2' }, ref) => {
  // JSX can't type a ref through a dynamically-chosen intrinsic tag (h1/h2/h3
  // all resolve to HTMLHeadingElement at runtime, but the tag variable's type
  // is just `string` to JSX) — React.createElement sidesteps that cleanly.
  return React.createElement(
    as,
    { ref, className: `text-xl font-bold font-syne ${className || ''}` },
    children
  )
})
CardTitle.displayName = 'CardTitle'

export const CardContent = React.forwardRef<
  HTMLDivElement,
  CardProps
>(({ className, children }, ref) => (
  <div ref={ref} className={className}>
    {children}
  </div>
))
CardContent.displayName = 'CardContent'

export const CardFooter = React.forwardRef<
  HTMLDivElement,
  CardProps
>(({ className, children }, ref) => (
  <div ref={ref} className={`mt-4 flex gap-2 ${className || ''}`}>
    {children}
  </div>
))
CardFooter.displayName = 'CardFooter'
