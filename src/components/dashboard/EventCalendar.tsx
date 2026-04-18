"use client";

import { useState } from "react";
import { Calendar } from "@/components/ui/calendar";
import { MoreHorizontal } from "lucide-react";
import { motion } from "framer-motion";

interface EventCalendarProps {
  events?: {
    id: number | string;
    title: string;
    time: string;
    description: string;
  }[];
}

const defaultEvents = [
  {
    id: 1,
    title: "Lorem ipsum dolor",
    time: "12:00 PM - 02:00 PM",
    description: "Lorem ipsum dolor sit amet, consectetur adipiscing elit.",
  },
  {
    id: 2,
    title: "Lorem ipsum dolor",
    time: "12:00 PM - 02:00 PM",
    description: "Lorem ipsum dolor sit amet, consectetur adipiscing elit.",
  },
  {
    id: 3,
    title: "Lorem ipsum dolor",
    time: "12:00 PM - 02:00 PM",
    description: "Lorem ipsum dolor sit amet, consectetur adipiscing elit.",
  },
];

export const EventCalendar = ({ events = defaultEvents }: EventCalendarProps) => {
  const [value, setValue] = useState<Date | undefined>(new Date());

  return (
    <motion.div 
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.5 }}
      className="bg-white p-4 rounded-xl border border-blue-100 shadow-sm"
    >
      <Calendar
        mode="single"
        selected={value}
        onSelect={setValue}
        className="rounded-md border-none flex justify-center"
      />
      <div className="flex items-center justify-between mt-4">
        <h1 className="text-xl font-semibold my-4">Events</h1>
        <MoreHorizontal className="h-5 w-5 text-gray-400 cursor-pointer" />
      </div>
      <div className="flex flex-col gap-4">
        {events.map((event) => (
          <div
            className="p-5 rounded-md border-2 border-gray-100 border-t-4 odd:border-t-[#2563eb] even:border-t-[#93c5fd]"
            key={event.id}
          >
            <div className="flex items-center justify-between">
              <h1 className="font-semibold text-gray-600">{event.title}</h1>
              <span className="text-gray-300 text-xs">
                {event.time && !event.time.includes("T") ? event.time : new Date(event.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
            <p className="mt-2 text-gray-400 text-sm">{event.description}</p>
          </div>
        ))}
        {events.length === 0 && (
          <p className="text-center text-gray-400 text-sm py-4">No upcoming events</p>
        )}
      </div>
    </motion.div>
  );
};
