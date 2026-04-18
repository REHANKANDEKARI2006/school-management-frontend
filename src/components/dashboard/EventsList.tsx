"use client";

import { motion } from "framer-motion";
import { Calendar, Clock, MapPin } from "lucide-react";

interface EventsListProps {
  events?: {
    id: number | string;
    title: string;
    time: string;
    description: string;
    location?: string;
  }[];
}

const defaultEvents = [
  {
    id: 1,
    title: "Annual Science Fair",
    time: "10:00 AM - 04:00 PM",
    location: "Main Auditorium",
    description: "Students showcase their innovative science projects.",
  },
  {
    id: 2,
    title: "Teacher Training Workshop",
    time: "02:00 PM - 05:00 PM",
    location: "Conference Hall",
    description: "New digital LMS tools training session.",
  },
];

export const EventsList = ({ events = defaultEvents }: EventsListProps) => {
  return (
    <motion.div 
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.5, delay: 0.1 }}
      className="bg-white p-6 rounded-3xl border border-blue-50 shadow-sm hover:shadow-xl hover:shadow-blue-500/5 transition-all"
    >
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-black font-headline text-slate-800">Events</h2>
      </div>
      
      <div className="flex flex-col gap-5">
        {events.map((event, idx) => (
          <motion.div
            key={`${event.id}-${idx}`}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 + idx * 0.1 }}
            className="group relative pl-4 border-l-4 border-l-blue-500 hover:bg-slate-50 p-4 rounded-2xl transition-all"
          >
            <div className="flex items-center justify-between mb-1">
              <h3 className="font-bold text-slate-800 group-hover:text-blue-600 transition-colors">{event.title}</h3>
            </div>
            
            <div className="flex flex-wrap gap-3 mt-2">
               <div className="flex items-center text-[10px] font-bold text-slate-400 bg-white px-2 py-1 rounded-lg border border-slate-100">
                  <Clock size={12} className="mr-1.5 text-blue-400" />
                  {event.time && !event.time.includes("T") ? event.time : new Date(event.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
               </div>
               {event.location && (
                  <div className="flex items-center text-[10px] font-bold text-slate-400 bg-white px-2 py-1 rounded-lg border border-slate-100">
                     <MapPin size={12} className="mr-1.5 text-blue-400" />
                     {event.location}
                  </div>
               )}
            </div>
          </motion.div>
        ))}
        {events.length === 0 && (
          <div className="text-center py-8">
             <Calendar size={32} className="mx-auto text-slate-200 mb-2" />
             <p className="text-slate-400 text-sm font-bold">No upcoming events</p>
          </div>
        )}
      </div>
    </motion.div>
  );
};
