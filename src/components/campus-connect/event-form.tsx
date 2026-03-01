import * as React from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { CalendarIcon, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { getEventStatuses } from "@/lib/api/events";
import { useToast } from "@/hooks/use-toast";

const eventSchema = z.object({
  event_id: z.number().optional(),
  event_name: z.string().min(1, "Event name is required"),
  description: z.string().min(1, "Description is required"),
  event_date: z.date({ required_error: "A date is required." }),
  venue: z.string().min(1, "Venue is required"),
  event_status_id: z.string().min(1, "Status is required"),
});

export type Event = z.infer<typeof eventSchema>;

interface EventFormProps {
  onSubmit: (data: Event) => void;
  event?: any;
  loading?: boolean;
}

export function EventForm({ onSubmit, event, loading }: EventFormProps) {
  const { toast } = useToast();
  const [statuses, setStatuses] = React.useState<any[]>([]);
  const [dropdownLoading, setDropdownLoading] = React.useState(true);

  React.useEffect(() => {
    const fetchStatuses = async () => {
      try {
        const data = await getEventStatuses();
        setStatuses(data || []);
      } catch {
        toast({ title: "Error", description: "Failed to load event statuses", variant: "destructive" });
      } finally {
        setDropdownLoading(false);
      }
    };
    fetchStatuses();
  }, [toast]);

  const form = useForm<Event>({
    resolver: zodResolver(eventSchema),
    defaultValues: event ? {
      ...event,
      event_date: new Date(event.event_date),
      event_status_id: String(event.event_status_id)
    } : {
      event_name: "",
      description: "",
      event_date: new Date(),
      venue: "",
      event_status_id: "",
    },
  });

  const handleSubmit = (values: Event) => {
    onSubmit(values);
  };

  if (dropdownLoading) {
    return (
      <div className="flex justify-center items-center py-10">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="event_name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Event Name</FormLabel>
              <FormControl>
                <Input placeholder="e.g. Annual Science Fair" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description</FormLabel>
              <FormControl>
                <Textarea placeholder="A short description of the event." {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="venue"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Venue</FormLabel>
              <FormControl>
                <Input placeholder="e.g. School Auditorium" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="event_date"
          render={({ field }) => (
            <FormItem className="flex flex-col">
              <FormLabel>Date</FormLabel>
              <Popover>
                <PopoverTrigger asChild>
                  <FormControl>
                    <Button
                      variant={"outline"}
                      className={cn(
                        "w-full pl-3 text-left font-normal",
                        !field.value && "text-muted-foreground"
                      )}
                    >
                      {field.value ? (
                        format(field.value, "PPP")
                      ) : (
                        <span>Pick a date</span>
                      )}
                      <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                    </Button>
                  </FormControl>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={field.value}
                    onSelect={field.onChange}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="event_status_id"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Status</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select event status" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {statuses.map((status) => (
                    <SelectItem key={status.event_status_id} value={String(status.event_status_id)}>
                      {status.event_status_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" className="w-full" disabled={loading}>
          {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {event ? "Update Event" : "Create Event"}
        </Button>
      </form>
    </Form>
  );
}
