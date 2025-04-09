import * as React from "react"

import { cn } from "@/lib/utils"

const Card = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "rounded-xl border border-border/40 bg-card text-card-foreground shadow-sm transition-all duration-200 hover:shadow-md hover:border-border/60",
      "relative overflow-hidden backdrop-blur-sm",
      className
    )}
    {...props}
  />
))
Card.displayName = "Card"

const CardHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex flex-col space-y-1.5 p-6 pb-4", className)}
    {...props}
  />
))
CardHeader.displayName = "CardHeader"

const CardTitle = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("text-lg font-semibold leading-none tracking-tight", className)}
    {...props}
  />
))
CardTitle.displayName = "CardTitle"

const CardDescription = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("text-sm text-muted-foreground", className)}
    {...props}
  />
))
CardDescription.displayName = "CardDescription"

const CardContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("p-6 pt-2", className)} {...props} />
))
CardContent.displayName = "CardContent"

const CardFooter = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex items-center p-6 pt-0 gap-2", className)}
    {...props}
  />
))
CardFooter.displayName = "CardFooter"

// New component for card with accent gradient
const GradientCard = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & { accentColor?: string }
>(({ className, accentColor = "from-primary/20 to-primary/5", ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "rounded-xl border border-border/40 bg-card text-card-foreground shadow-sm transition-all duration-200 hover:shadow-md",
      "relative overflow-hidden",
      className
    )}
    {...props}
  >
    <div className={cn("absolute inset-0 bg-gradient-to-br opacity-30", accentColor)} style={{ zIndex: 0 }} />
    <div className="relative z-10 h-full">{props.children}</div>
  </div>
))
GradientCard.displayName = "GradientCard"

// New component for cards with stat values (for analytics)
const StatCard = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & {
    title: string;
    value: string | number;
    icon?: React.ReactNode;
    trend?: {
      value: number;
      label?: string;
      isPositive?: boolean;
    };
  }
>(({ className, title, value, icon, trend, ...props }, ref) => (
  <Card
    ref={ref}
    className={cn("overflow-hidden", className)}
    {...props}
  >
    <CardHeader className="flex flex-row items-center justify-between pb-2">
      <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
      {icon && <div className="h-5 w-5 text-muted-foreground/70">{icon}</div>}
    </CardHeader>
    <CardContent className="p-6 pt-0">
      <div className="text-2xl font-bold">{value}</div>
      {trend && (
        <div className="mt-1 flex items-center text-xs">
          <span
            className={cn(
              "mr-1 rounded-sm px-1 py-0.5",
              trend.isPositive 
                ? "bg-green-500/20 text-green-500" 
                : "bg-red-500/20 text-red-500"
            )}
          >
            {trend.isPositive ? "+" : "-"}{Math.abs(trend.value)}%
          </span>
          {trend.label && <span className="text-muted-foreground">{trend.label}</span>}
        </div>
      )}
    </CardContent>
  </Card>
))
StatCard.displayName = "StatCard"

export { 
  Card, 
  CardHeader, 
  CardFooter, 
  CardTitle, 
  CardDescription, 
  CardContent, 
  GradientCard,
  StatCard 
}
