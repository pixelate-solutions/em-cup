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
      className={cn("w-fit p-0", className)}
      classNames={{
        months: "flex flex-col",
        month: "space-y-3",
        month_caption: "relative z-0 flex h-10 items-center justify-center px-10",
        caption_label: "pointer-events-none text-base font-bold",
        nav: "absolute inset-x-3 top-0 z-10 flex h-10 items-center justify-between",
        button_previous: cn(buttonVariants({ variant: "outline", size: "icon" }), "relative z-20 h-8 w-8 rounded-xl bg-white p-0 opacity-80 hover:opacity-100"),
        button_next: cn(buttonVariants({ variant: "outline", size: "icon" }), "relative z-20 h-8 w-8 rounded-xl bg-white p-0 opacity-80 hover:opacity-100"),
        month_grid: "mx-auto w-auto border-collapse",
        weekdays: "flex justify-center",
        weekday: "flex h-9 w-9 items-center justify-center rounded-full text-[0.8rem] font-medium text-muted-foreground",
        week: "mt-1 flex justify-center",
        day: "h-9 w-9 rounded-xl p-0 text-center text-sm",
        day_button: cn(buttonVariants({ variant: "ghost", size: "icon" }), "h-9 w-9 rounded-xl p-0 font-normal aria-selected:opacity-100"),
        selected: "[&_button]:bg-primary [&_button]:text-primary-foreground [&_button:hover]:bg-primary [&_button:hover]:text-primary-foreground [&_button:focus]:bg-primary [&_button:focus]:text-primary-foreground",
        today: "[&_button]:bg-accent [&_button]:text-accent-foreground",
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
