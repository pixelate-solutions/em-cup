"use client";

import * as React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { DayPicker } from "react-day-picker";

import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export type CalendarProps = React.ComponentProps<typeof DayPicker>;

function Calendar({ className, classNames, showOutsideDays = true, ...props }: CalendarProps) {
  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      className={cn("p-1", className)}
      classNames={{
        months: "flex flex-col gap-4",
        month: "space-y-4",
        month_caption: "flex justify-center pt-1 relative items-center",
        caption_label: "text-sm font-semibold",
        nav: "absolute inset-x-1 top-1 flex items-center justify-between",
        button_previous: cn(buttonVariants({ variant: "outline", size: "icon" }), "h-8 w-8 bg-white/70 p-0 opacity-70 hover:opacity-100"),
        button_next: cn(buttonVariants({ variant: "outline", size: "icon" }), "h-8 w-8 bg-white/70 p-0 opacity-70 hover:opacity-100"),
        month_grid: "w-full border-collapse space-y-1",
        weekdays: "flex",
        weekday: "w-9 rounded-full text-[0.8rem] font-medium text-muted-foreground",
        week: "mt-2 flex w-full",
        day: "h-9 w-9 p-0 text-center text-sm",
        day_button: cn(buttonVariants({ variant: "ghost", size: "icon" }), "h-9 w-9 rounded-full p-0 font-normal aria-selected:opacity-100"),
        selected: "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground",
        today: "bg-accent text-accent-foreground",
        outside: "text-muted-foreground opacity-45",
        disabled: "text-muted-foreground opacity-45",
        range_middle: "aria-selected:bg-accent aria-selected:text-accent-foreground",
        hidden: "invisible",
        ...classNames,
      }}
      components={{
        Chevron: ({ orientation }) =>
          orientation === "left" ? <ChevronLeft className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />,
      }}
      {...props}
    />
  );
}
Calendar.displayName = "Calendar";

export { Calendar };
