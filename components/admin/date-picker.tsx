"use client";

import { CalendarIcon, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn, formatDate } from "@/lib/utils";

export function DatePicker({
  value,
  onChange,
}: {
  value: Date | undefined;
  onChange: (date: Date | undefined) => void;
}) {
  return (
    <div className="grid grid-cols-[minmax(0,1fr)_auto] gap-2">
      <Popover>
        <PopoverTrigger asChild>
          <Button
            type="button"
            variant="outline"
            className={cn("justify-start rounded-xl bg-white px-4 text-left font-medium", !value && "text-muted-foreground")}
          >
            <CalendarIcon className="h-4 w-4" />
            {value ? formatDate(value) : "Pick date"}
          </Button>
        </PopoverTrigger>
        <PopoverContent align="start" className="w-auto p-3">
          <Calendar mode="single" selected={value} onSelect={onChange} />
        </PopoverContent>
      </Popover>
      <Button
        type="button"
        variant="outline"
        size="icon"
        aria-label="Clear date"
        className="rounded-xl"
        onClick={() => onChange(undefined)}
      >
        <X className="h-4 w-4 text-red-500" />
      </Button>
    </div>
  );
}
