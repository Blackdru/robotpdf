import * as React from "react"
import { cn } from "../../lib/utils"

const Textarea = React.forwardRef(({ className, ...props }, ref) => {
  return (
    <textarea
      className={cn(
        "flex min-h-[120px] w-full rounded-2xl border-2 border-grey-700 bg-grey-800 px-4 py-3 text-base text-grey-200 ring-offset-background placeholder:text-grey-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-grey-500 focus-visible:ring-offset-2 focus-visible:border-grey-500 hover:border-border transition-all duration-300 disabled:cursor-not-allowed disabled:opacity-50 resize-none",
        className
      )}
      ref={ref}
      {...props}
    />
  )
})
Textarea.displayName = "Textarea"

export { Textarea }