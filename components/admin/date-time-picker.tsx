"use client";

import { useMemo, useState } from "react";
import { CalendarIcon, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn, formatDate } from "@/lib/utils";

export function DateTimePicker({
  name,
  defaultValue,
}: {
  name: string;
  defaultValue: Date | string | null;
}) {
  const initialDate = defaultValue ? new Date(defaultValue) : undefined;
  const [date, setDate] = useState<Date | undefined>(initialDate);
  const [time, setTime] = useState(() => {
    if (!initialDate) return "";
    return initialDate.toTimeString().slice(0, 5);
  });

  const value = useMemo(() => {
    if (!date) return "";
    const [hours = "12", minutes = "00"] = time.split(":");
    const next = new Date(date);
    next.setHours(Number(hours), Number(minutes), 0, 0);
    return toLocalDateTimeValue(next);
  }, [date, time]);

  return (
    <div className="grid gap-2 sm:grid-cols-[1fr_120px_auto]">
      <input type="hidden" name={name} value={value} />
      <Popover>
        <PopoverTrigger asChild>
          <Button
            type="button"
            variant="outline"
            className={cn("justify-start px-4 text-left font-medium", !date && "text-muted-foreground")}
          >
            <CalendarIcon className="h-4 w-4" />
            {date ? formatDate(date) : "Pick date"}
          </Button>
        </PopoverTrigger>
        <PopoverContent align="start">
          <Calendar mode="single" selected={date} onSelect={setDate} />
        </PopoverContent>
      </Popover>
      <Input
        aria-label="Scheduled time"
        type="time"
        value={time}
        onChange={(event) => setTime(event.target.value)}
        disabled={!date}
      />
      <Button
        type="button"
        variant="ghost"
        size="icon"
        aria-label="Clear scheduled date"
        onClick={() => {
          setDate(undefined);
          setTime("");
        }}
      >
        <X className="h-4 w-4" />
      </Button>
    </div>
  );
}

function toLocalDateTimeValue(date: Date) {
  const offset = date.getTimezoneOffset();
  const local = new Date(date.getTime() - offset * 60_000);
  return local.toISOString().slice(0, 16);
}
