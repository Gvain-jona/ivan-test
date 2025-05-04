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
  PlusCircleIcon,
  SearchIcon,
} from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
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

interface FullScreenCalendarProps {
  data: CalendarData[]
  onDaySelect?: (day: Date) => void
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

export function FullScreenCalendar({ data, onDaySelect }: FullScreenCalendarProps) {
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
    start: startOfWeek(firstDayCurrentMonth),
    end: endOfWeek(endOfMonth(firstDayCurrentMonth)),
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
    <div className="flex flex-1 flex-col">
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
                <span>{format(today, "d")}</span>
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

        <div className="flex flex-col items-center gap-4 md:flex-row md:gap-6">
          {/* Search button removed */}

          <div className={cn(
            "inline-flex w-full -space-x-px rounded-lg shadow-sm md:w-auto rtl:space-x-reverse",
            isDarkMode ? "shadow-white/5" : "shadow-black/5"
          )}>
            <Button
              onClick={previousMonth}
              className={cn(
                "rounded-none shadow-none first:rounded-s-lg last:rounded-e-lg focus-visible:z-10 transition-all duration-200",
                isDarkMode ? "hover:bg-white/10" : "hover:bg-background/10"
              )}
              variant="outline"
              size="icon"
              aria-label="Navigate to previous month"
            >
              <ChevronLeftIcon size={16} strokeWidth={2} aria-hidden="true" />
            </Button>
            <Button
              onClick={goToToday}
              className={cn(
                "w-full rounded-none shadow-none first:rounded-s-lg last:rounded-e-lg focus-visible:z-10 md:w-auto font-medium transition-all duration-200",
                isDarkMode ? "hover:bg-white/10" : "hover:bg-background/10"
              )}
              variant="outline"
            >
              Today
            </Button>
            <Button
              onClick={nextMonth}
              className={cn(
                "rounded-none shadow-none first:rounded-s-lg last:rounded-e-lg focus-visible:z-10 transition-all duration-200",
                isDarkMode ? "hover:bg-white/10" : "hover:bg-background/10"
              )}
              variant="outline"
              size="icon"
              aria-label="Navigate to next month"
            >
              <ChevronRightIcon size={16} strokeWidth={2} aria-hidden="true" />
            </Button>
          </div>

          {/* Removed New Event button */}
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="lg:flex lg:flex-auto lg:flex-col">
        {/* Week Days Header */}
        <div className={cn(
          "grid grid-cols-7 border text-center text-xs font-semibold leading-6 lg:flex-none",
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
        <div className="flex text-xs leading-6 lg:flex-auto">
          <div className="hidden w-full border-x lg:grid lg:grid-cols-7 lg:grid-rows-5">
            {days.map((day, dayIdx) =>
              !isDesktop ? (
                <button
                  onClick={() => handleDayClick(day)}
                  key={dayIdx}
                  type="button"
                  className={cn(
                    isEqual(day, selectedDay) &&
                      isDarkMode
                        ? "text-white"
                        : "text-background",
                    !isEqual(day, selectedDay) &&
                      !isToday(day) &&
                      isSameMonth(day, firstDayCurrentMonth) &&
                      "text-foreground",
                    !isEqual(day, selectedDay) &&
                      !isToday(day) &&
                      !isSameMonth(day, firstDayCurrentMonth) &&
                      "text-muted-foreground",
                    (isEqual(day, selectedDay) || isToday(day)) &&
                      "font-semibold",
                    "flex h-14 flex-col border-b border-r px-3 py-2 hover:bg-muted/50 focus:z-10",
                  )}
                >
                  <time
                    dateTime={format(day, "yyyy-MM-dd")}
                    className={cn(
                      "ml-auto flex size-6 items-center justify-center rounded-full",
                      isEqual(day, selectedDay) &&
                        isToday(day) &&
                        isDarkMode
                          ? "bg-white text-background font-semibold"
                          : "bg-background text-white font-semibold",
                      isEqual(day, selectedDay) &&
                        !isToday(day) &&
                        isDarkMode
                          ? "bg-white text-background font-semibold"
                          : "bg-background text-white font-semibold",
                      isToday(day) && !isEqual(day, selectedDay) &&
                        isDarkMode
                          ? "border-2 border-white/70 text-white font-bold"
                          : "border-2 border-background/70 text-background font-bold",
                    )}
                  >
                    {format(day, "d")}
                  </time>
                  {data.filter((date) => isSameDay(date.day, day)).length >
                    0 && (
                    <div>
                      {data
                        .filter((date) => isSameDay(date.day, day))
                        .map((date) => (
                          <div
                            key={date.day.toString()}
                            className="-mx-0.5 mt-auto flex flex-wrap-reverse"
                          >
                            {date.events.map((event) => (
                              <span
                                key={event.id}
                                className={cn(
                                  "mx-0.5 mt-1 h-2 w-2 rounded-full shadow-sm transition-transform duration-200 hover:scale-125",
                                  event.time.toLowerCase().includes('fixed')
                                    ? isDarkMode
                                      ? "bg-white ring-1 ring-white/30"
                                      : "bg-background ring-1 ring-background/30"
                                    : isDarkMode
                                      ? "bg-muted-foreground ring-1 ring-white/20"
                                      : "bg-muted-foreground ring-1 ring-background/20"
                                )}
                                title={`${event.name} - ${event.time}`}
                              />
                            ))}
                          </div>
                        ))}
                    </div>
                  )}
                </button>
              ) : (
                <div
                  key={dayIdx}
                  onClick={() => handleDayClick(day)}
                  className={cn(
                    dayIdx === 0 && colStartClasses[getDay(day)],
                    !isEqual(day, selectedDay) &&
                      !isToday(day) &&
                      !isSameMonth(day, firstDayCurrentMonth) &&
                      "bg-muted/30 text-muted-foreground",
                    "relative flex flex-col border-b border-r hover:bg-muted/50 focus:z-10 transition-colors duration-200",
                    data.filter((event) => isSameDay(event.day, day)).length > 0 &&
                      isDarkMode
                        ? "bg-white/5"
                        : data.filter((event) => isSameDay(event.day, day)).length > 0
                          ? "bg-background/5"
                          : "",
                  )}
                >
                  <header className="flex items-center justify-between p-2.5">
                    <button
                      type="button"
                      className={cn(
                        isEqual(day, selectedDay) && "text-background",
                        !isEqual(day, selectedDay) &&
                          !isToday(day) &&
                          isSameMonth(day, firstDayCurrentMonth) &&
                          "text-foreground",
                        !isEqual(day, selectedDay) &&
                          !isToday(day) &&
                          !isSameMonth(day, firstDayCurrentMonth) &&
                          "text-muted-foreground",
                        isEqual(day, selectedDay) &&
                          isToday(day) &&
                          isDarkMode
                            ? "border-none bg-white text-background"
                            : "border-none bg-background text-white",
                        isEqual(day, selectedDay) &&
                          !isToday(day) &&
                          isDarkMode
                            ? "bg-white text-background"
                            : "bg-background text-white",
                        isToday(day) && !isEqual(day, selectedDay) &&
                          isDarkMode
                            ? "border-2 border-white/70 text-white font-bold"
                            : "border-2 border-background/70 text-background font-bold",
                        (isEqual(day, selectedDay) || isToday(day)) &&
                          "font-semibold",
                        "flex h-8 w-8 items-center justify-center rounded-full text-xs hover:border transition-all duration-200 shadow-sm",
                      )}
                    >
                      <time dateTime={format(day, "yyyy-MM-dd")}>
                        {format(day, "d")}
                      </time>
                    </button>
                  </header>
                  <div className="flex-1 p-2.5">
                    {data
                      .filter((event) => isSameDay(event.day, day))
                      .map((day) => (
                        <div key={day.day.toString()} className="space-y-1.5">
                          {day.events.slice(0, 1).map((event) => (
                            <div
                              key={event.id}
                              className={cn(
                                "flex flex-col items-start gap-1 rounded-lg border p-2 text-xs leading-tight shadow-sm transition-all duration-200 hover:shadow-md hover:translate-y-[-1px]",
                                event.time.toLowerCase().includes('fixed')
                                  ? isDarkMode
                                    ? "bg-white/10 border-white/20"
                                    : "bg-background/10 border-background/20"
                                  : isDarkMode
                                    ? "bg-muted/50 border-border/50"
                                    : "bg-muted/30 border-border/30"
                              )}
                            >
                              <p className="font-medium leading-none">
                                {event.name}
                              </p>
                              <div className="flex items-center justify-between w-full">
                                <p className="leading-none text-muted-foreground">
                                  {event.time}
                                </p>
                                <Badge
                                  variant="outline"
                                  className={cn(
                                    "text-[10px] h-4 px-1.5 font-medium shadow-sm",
                                    event.time.toLowerCase().includes('fixed')
                                      ? isDarkMode
                                        ? "bg-white/10 text-white border-white/20"
                                        : "bg-background/10 text-background border-background/20"
                                      : isDarkMode
                                        ? "bg-muted/50 text-muted-foreground border-border/50"
                                        : "bg-muted/30 text-muted-foreground border-border/30"
                                  )}
                                >
                                  {event.time.toLowerCase().includes('fixed') ? 'Fixed' : 'Variable'}
                                </Badge>
                              </div>
                            </div>
                          ))}
                          {day.events.length > 1 && (
                            <div className="text-xs text-muted-foreground">
                              + {day.events.length - 1} more
                            </div>
                          )}
                        </div>
                      ))}
                  </div>
                </div>
              ),
            )}
          </div>

          <div className="isolate grid w-full grid-cols-7 grid-rows-5 border-x lg:hidden">
            {days.map((day, dayIdx) => (
              <button
                onClick={() => handleDayClick(day)}
                key={dayIdx}
                type="button"
                className={cn(
                  isEqual(day, selectedDay) &&
                    isDarkMode
                      ? "text-white"
                      : "text-background",
                  !isEqual(day, selectedDay) &&
                    !isToday(day) &&
                    isSameMonth(day, firstDayCurrentMonth) &&
                    "text-foreground",
                  !isEqual(day, selectedDay) &&
                    !isToday(day) &&
                    !isSameMonth(day, firstDayCurrentMonth) &&
                    "text-muted-foreground",
                  (isEqual(day, selectedDay) || isToday(day)) &&
                    "font-semibold",
                  "flex h-14 flex-col border-b border-r px-3 py-2 hover:bg-muted/50 focus:z-10",
                )}
              >
                <time
                  dateTime={format(day, "yyyy-MM-dd")}
                  className={cn(
                    "ml-auto flex size-6 items-center justify-center rounded-full",
                    isEqual(day, selectedDay) &&
                      isToday(day) &&
                      isDarkMode
                        ? "bg-white text-background font-semibold"
                        : "bg-background text-white font-semibold",
                    isEqual(day, selectedDay) &&
                      !isToday(day) &&
                      isDarkMode
                        ? "bg-white text-background font-semibold"
                        : "bg-background text-white font-semibold",
                    isToday(day) && !isEqual(day, selectedDay) &&
                      isDarkMode
                        ? "border-2 border-white/70 text-white font-bold"
                        : "border-2 border-background/70 text-background font-bold",
                  )}
                >
                  {format(day, "d")}
                </time>
                {data.filter((date) => isSameDay(date.day, day)).length > 0 && (
                  <div>
                    {data
                      .filter((date) => isSameDay(date.day, day))
                      .map((date) => (
                        <div
                          key={date.day.toString()}
                          className="-mx-0.5 mt-auto flex flex-wrap-reverse"
                        >
                          {date.events.map((event) => (
                            <span
                              key={event.id}
                              className={cn(
                                "mx-0.5 mt-1 h-2 w-2 rounded-full shadow-sm transition-transform duration-200 hover:scale-125",
                                event.time.toLowerCase().includes('fixed')
                                  ? isDarkMode
                                    ? "bg-white ring-1 ring-white/30"
                                    : "bg-background ring-1 ring-background/30"
                                  : isDarkMode
                                    ? "bg-muted-foreground ring-1 ring-white/20"
                                    : "bg-muted-foreground ring-1 ring-background/20"
                              )}
                              title={`${event.name} - ${event.time}`}
                            />
                          ))}
                        </div>
                      ))}
                  </div>
                )}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
