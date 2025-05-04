"use client"

import * as React from "react"
import {
  add,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  getDay,
  isEqual,
  isSameDay,
  isSameMonth,
  isToday,
  parse,
  startOfToday,
  startOfWeek,
} from "date-fns"
import {
  ChevronLeftIcon,
  ChevronRightIcon,
} from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useMediaQuery } from "@/hooks/use-media-query"

interface Event {
  id: number
  name: string
  time: string
  datetime: string
}

interface CalendarData {
  day: Date
  events: Event[]
}

interface ImprovedCalendarProps {
  data: CalendarData[]
  onDaySelect?: (day: Date) => void
  className?: string
}

const colStartClasses = [
  "",
  "col-start-2",
  "col-start-3",
  "col-start-4",
  "col-start-5",
  "col-start-6",
  "col-start-7",
]

export function ImprovedCalendar({ data, onDaySelect, className }: ImprovedCalendarProps) {
  const today = startOfToday()
  const [selectedDay, setSelectedDay] = React.useState(today)
  const [currentMonth, setCurrentMonth] = React.useState(
    format(today, "MMM-yyyy"),
  )
  const firstDayCurrentMonth = parse(currentMonth, "MMM-yyyy", new Date())
  const isDesktop = useMediaQuery("(min-width: 768px)")

  // Check if we're in dark mode - we'll use this for theming
  const prefersDarkMode = useMediaQuery("(prefers-color-scheme: dark)")
  const isDarkMode = typeof document !== 'undefined'
    ? document.documentElement.classList.contains('dark')
    : prefersDarkMode

  const days = eachDayOfInterval({
    start: startOfWeek(firstDayCurrentMonth, { weekStartsOn: 0 }),
    end: endOfWeek(endOfMonth(firstDayCurrentMonth), { weekStartsOn: 0 }),
  })

  function previousMonth() {
    const firstDayNextMonth = add(firstDayCurrentMonth, { months: -1 })
    setCurrentMonth(format(firstDayNextMonth, "MMM-yyyy"))
  }

  function nextMonth() {
    const firstDayNextMonth = add(firstDayCurrentMonth, { months: 1 })
    setCurrentMonth(format(firstDayNextMonth, "MMM-yyyy"))
  }

  function goToToday() {
    setCurrentMonth(format(today, "MMM-yyyy"))
    setSelectedDay(today)
    if (onDaySelect) {
      onDaySelect(today)
    }
  }

  // Handle day selection with custom callback
  function handleDayClick(day: Date) {
    setSelectedDay(day)
    // Call the custom handler if provided
    if (onDaySelect) {
      onDaySelect(day)
    }
  }

  return (
    <div className={cn("flex flex-1 flex-col", className)}>
      {/* Calendar Header */}
      <div className={cn(
        "flex flex-col space-y-4 p-4 md:flex-row md:items-center md:justify-between md:space-y-0 lg:flex-none",
        isDarkMode ? "bg-white/5" : "bg-background/5"
      )}>
        <div className="flex flex-auto">
          <div className="flex items-center gap-4">
            <div className={cn(
              "hidden w-20 flex-col items-center justify-center rounded-lg border p-0.5 md:flex shadow-sm",
              isDarkMode ? "bg-white/10 border-white/20" : "bg-background/10 border-background/20"
            )}>
              <h1 className="p-1 text-xs uppercase font-bold text-muted-foreground">
                {format(today, "MMM")}
              </h1>
              <div className={cn(
                "flex w-full items-center justify-center rounded-lg border p-0.5 text-lg font-bold",
                isDarkMode ? "bg-white/5 border-white/10" : "bg-background/5 border-background/10"
              )}>
                <span className={isDarkMode ? "text-white" : "text-foreground"}>
                  {format(today, "d")}
                </span>
              </div>
            </div>
            <div className="flex flex-col">
              <h2 className="text-lg font-bold text-foreground">
                {format(firstDayCurrentMonth, "MMMM, yyyy")}
              </h2>
              <p className="text-sm text-muted-foreground">
                {format(firstDayCurrentMonth, "MMM d, yyyy")} -{" "}
                {format(endOfMonth(firstDayCurrentMonth), "MMM d, yyyy")}
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={goToToday}
            className="rounded-lg border shadow-sm"
          >
            Today
          </Button>
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="icon"
              onClick={previousMonth}
              className="rounded-lg border shadow-sm"
            >
              <ChevronLeftIcon className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={nextMonth}
              className="rounded-lg border shadow-sm"
            >
              <ChevronRightIcon className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="flex-1 flex flex-col">
        {/* Week Days Header */}
        <div className={cn(
          "grid grid-cols-7 border text-center text-xs font-semibold leading-6",
          isDarkMode ? "bg-white/10" : "bg-background/10"
        )}>
          <div className="border-r py-3.5 uppercase tracking-wider font-bold text-muted-foreground">Sun</div>
          <div className="border-r py-3.5 uppercase tracking-wider font-bold text-muted-foreground">Mon</div>
          <div className="border-r py-3.5 uppercase tracking-wider font-bold text-muted-foreground">Tue</div>
          <div className="border-r py-3.5 uppercase tracking-wider font-bold text-muted-foreground">Wed</div>
          <div className="border-r py-3.5 uppercase tracking-wider font-bold text-muted-foreground">Thu</div>
          <div className="border-r py-3.5 uppercase tracking-wider font-bold text-muted-foreground">Fri</div>
          <div className="py-3.5 uppercase tracking-wider font-bold text-muted-foreground">Sat</div>
        </div>

        {/* Calendar Days */}
        <div className="flex-1 grid grid-cols-7 auto-rows-fr border-x">
          {days.map((day, dayIdx) => {
            // Check if the day has events
            const hasEvents = data.some(event => isSameDay(event.day, day));
            const eventsForDay = data.filter(event => isSameDay(event.day, day));
            const eventCount = eventsForDay.length > 0 
              ? eventsForDay.reduce((count, event) => count + event.events.length, 0)
              : 0;
            
            return (
              <div
                key={dayIdx}
                onClick={() => handleDayClick(day)}
                className={cn(
                  dayIdx === 0 && colStartClasses[getDay(day)],
                  "relative border-b border-r cursor-pointer",
                  !isSameMonth(day, firstDayCurrentMonth) && "bg-muted/30 text-muted-foreground",
                  (isEqual(day, selectedDay) || isToday(day)) && "font-semibold",
                  isEqual(day, selectedDay) && isDarkMode && "bg-white/10",
                  isEqual(day, selectedDay) && !isDarkMode && "bg-background/10",
                  isToday(day) && !isEqual(day, selectedDay) && "bg-muted/20",
                  hasEvents && !isEqual(day, selectedDay) && isDarkMode && "bg-white/5",
                  hasEvents && !isEqual(day, selectedDay) && !isDarkMode && "bg-background/5",
                  "hover:bg-muted/50 transition-colors duration-200"
                )}
              >
                <div className="flex flex-col h-full p-2">
                  <header className="flex items-center justify-between">
                    <time 
                      dateTime={format(day, "yyyy-MM-dd")}
                      className={cn(
                        "flex h-8 w-8 items-center justify-center rounded-full",
                        isEqual(day, selectedDay) && isDarkMode && "bg-white text-background",
                        isEqual(day, selectedDay) && !isDarkMode && "bg-background text-white",
                        isToday(day) && !isEqual(day, selectedDay) && isDarkMode && "border border-white/50 text-white",
                        isToday(day) && !isEqual(day, selectedDay) && !isDarkMode && "border border-background/50 text-foreground",
                        !isEqual(day, selectedDay) && !isToday(day) && isSameMonth(day, firstDayCurrentMonth) && isDarkMode && "text-white",
                        !isEqual(day, selectedDay) && !isToday(day) && isSameMonth(day, firstDayCurrentMonth) && !isDarkMode && "text-foreground"
                      )}
                    >
                      {format(day, "d")}
                    </time>
                    {eventCount > 0 && (
                      <Badge 
                        className={cn(
                          "text-xs h-5 px-1.5",
                          isDarkMode 
                            ? "bg-white text-background" 
                            : "bg-background text-white"
                        )}
                      >
                        {eventCount}
                      </Badge>
                    )}
                  </header>
                  
                  {/* Event indicators */}
                  <div className="mt-auto">
                    {eventsForDay.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-1">
                        {eventsForDay.flatMap(date => 
                          date.events.slice(0, 3).map((event, idx) => (
                            <div
                              key={`${event.id}-${idx}`}
                              className={cn(
                                "h-1.5 flex-1 rounded-sm",
                                event.time.toLowerCase().includes('fixed')
                                  ? isDarkMode
                                    ? "bg-white/70"
                                    : "bg-background/70"
                                  : isDarkMode
                                    ? "bg-white/40"
                                    : "bg-background/40"
                              )}
                              title={`${event.name} - ${event.time}`}
                            />
                          ))
                        )}
                        {eventsForDay.reduce((count, event) => count + event.events.length, 0) > 3 && (
                          <div className="text-xs text-muted-foreground ml-1">
                            +{eventsForDay.reduce((count, event) => count + event.events.length, 0) - 3}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
