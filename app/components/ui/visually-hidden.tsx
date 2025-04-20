"use client"

import * as React from "react"

/**
 * VisuallyHidden component
 * Renders content that is visually hidden but still accessible to screen readers
 */
const VisuallyHidden = React.forwardRef<
  HTMLSpanElement,
  React.HTMLAttributes<HTMLSpanElement>
>(({ children, ...props }, ref) => {
  return (
    <span
      ref={ref}
      className="absolute w-px h-px p-0 -m-px overflow-hidden whitespace-nowrap border-0"
      style={{
        clip: "rect(0 0 0 0)",
        clipPath: "inset(50%)",
        pointerEvents: "none",
      }}
      {...props}
    >
      {children}
    </span>
  )
})
VisuallyHidden.displayName = "VisuallyHidden"

export { VisuallyHidden }
