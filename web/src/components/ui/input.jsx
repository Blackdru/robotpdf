import * as React from "react"
import { cn } from "../../lib/utils"

const Input = React.forwardRef(({ className, type, ...props }, ref) => {
  return (
    <input
      type={type}
      className={cn(
        "flex h-12 w-full rounded-2xl border-2 border-grey-700 bg-grey-800 px-4 py-3 text-base text-grey-200 ring-offset-background file:border-0 file:bg-transparent file:text-base file:font-medium placeholder:text-grey-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-grey-500 focus-visible:ring-offset-2 focus-visible:border-grey-500 hover:border-border transition-all duration-300 disabled:cursor-not-allowed disabled:opacity-50",
        className
      )}
      ref={ref}
      {...props}
    />
  )
})
Input.displayName = "Input"

export { Input }