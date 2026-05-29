import { useEffect } from "react";
import { useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useCreateErrand, getListErrandsQueryKey, getGetErrandStatsQueryKey, getGetRecentErrandsQueryKey } from "@workspace/api-client-react";
import { useAuth } from "@workspace/replit-auth-web";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Car, MapPin, Calendar, Users, Euro, Phone, Send, Lock, ArrowRight, Plane } from "lucide-react";

const LIFTS_CATEGORY = "Lifts & Transport";

const formSchema = z.object({
  tripFrom: z.string().min(2, "Tell us where you're starting from"),
  tripTo: z.string().min(2, "Tell us where you need to go"),
  tripWhen: z.string().min(2, "Let helpers know when you need the lift"),
  passengers: z.coerce.number().int().min(1, "At least 1 passenger").max(8, "Max 8 passengers"),
  returnTrip: z.boolean().default(false),
  description: z.string().min(10, "Add a few details (min 10 characters)"),
  requesterName: z.string().min(2, "Name must be at least 2 characters"),
  requesterPhone: z.string().optional(),
  budgetAmount: z.coerce.number().min(0, "Cannot be negative").optional().or(z.literal("").transform(() => undefined)),
});

const POPULAR = ["Limerick", "Limerick Airport (Shannon)", "Thurles", "Borrisokane", "Roscrea", "Nenagh Town"];

export default function NewLiftPage() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const accountName = [user?.firstName, user?.lastName].filter(Boolean).join(" ").trim();
  const createErrand = useCreateErrand();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      tripFrom: "",
      tripTo: "",
      tripWhen: "",
      passengers: 1,
      returnTrip: false,
      description: "",
      requesterName: "",
      requesterPhone: "",
    },
  });

  useEffect(() => {
    if (accountName && !form.getValues("requesterName")) {
      form.setValue("requesterName", accountName);
    }
  }, [accountName, form]);

  function onSubmit(values: z.infer<typeof formSchema>) {
    const title = `Lift: ${values.tripFrom} → ${values.tripTo}${values.returnTrip ? " (return)" : ""}`;
    createErrand.mutate(
      {
        data: {
          title,
          description: values.description,
          category: LIFTS_CATEGORY,
          requesterName: values.requesterName,
          requesterLocation: values.tripFrom,
          requesterPhone: values.requesterPhone,
          budgetAmount: values.budgetAmount,
          tripFrom: values.tripFrom,
          tripTo: values.tripTo,
          tripWhen: values.tripWhen,
          passengers: values.passengers,
          returnTrip: values.returnTrip,
        },
      },
      {
        onSuccess: (newErrand) => {
          queryClient.invalidateQueries({ queryKey: getListErrandsQueryKey() });
          queryClient.invalidateQueries({ queryKey: getGetErrandStatsQueryKey() });
          queryClient.invalidateQueries({ queryKey: getGetRecentErrandsQueryKey() });
          toast({
            title: "Lift requested!",
            description: "Neighbours with cars can now offer you a ride.",
          });
          setLocation(`/errands/${newErrand.id}`);
        },
        onError: () => {
          toast({
            variant: "destructive",
            title: "Couldn't post your lift",
            description: "Something went wrong. Please try again.",
          });
        },
      }
    );
  }

  return (
    <div className="max-w-3xl mx-auto p-6 md:p-8 py-12">
      <div className="mb-8">
        <div className="inline-flex items-center gap-2 rounded-full bg-primary/15 text-foreground px-3 py-1 text-sm font-semibold mb-3">
          <Car className="w-4 h-4" /> Lifts &amp; Transport
        </div>
        <h1 className="text-4xl font-serif font-bold tracking-tight">Request a lift</h1>
        <p className="text-lg text-muted-foreground mt-2">
          No taxi? Few buses? Ask a neighbour with a car for a ride — to the airport, Limerick, Thurles, or any town nearby.
        </p>
      </div>

      <Card className="border-border/60 shadow-sm overflow-hidden">
        <div className="h-2 bg-primary w-full"></div>
        <CardContent className="p-6 md:p-8">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">

              {/* Route */}
              <div className="space-y-6">
                <div className="flex items-center gap-2 pb-2 border-b border-border/40">
                  <span className="font-semibold text-lg">Your journey</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="tripFrom"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-1.5"><MapPin className="w-4 h-4 text-primary" /> Pick-up from</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g., Nenagh Town" {...field} data-testid="input-trip-from" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="tripTo"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-1.5"><ArrowRight className="w-4 h-4 text-primary" /> Drop-off at</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g., Shannon Airport" {...field} data-testid="input-trip-to" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="flex flex-wrap gap-2">
                  <span className="text-xs text-muted-foreground self-center mr-1 flex items-center gap-1"><Plane className="w-3.5 h-3.5" /> Popular:</span>
                  {POPULAR.map((p) => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => form.setValue("tripTo", p, { shouldValidate: true })}
                      className="text-xs px-2.5 py-1 rounded-full border border-border bg-card text-muted-foreground hover:border-primary/50 hover:text-foreground transition-colors"
                    >
                      {p}
                    </button>
                  ))}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="tripWhen"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-1.5"><Calendar className="w-4 h-4 text-primary" /> When</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g., Fri 5 June, 7:30am" {...field} data-testid="input-trip-when" />
                        </FormControl>
                        <FormDescription>Day and time you need to travel</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="passengers"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-1.5"><Users className="w-4 h-4 text-primary" /> Passengers</FormLabel>
                        <FormControl>
                          <Input type="number" min={1} max={8} {...field} data-testid="input-passengers" />
                        </FormControl>
                        <FormDescription>How many people need a seat</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="returnTrip"
                  render={({ field }) => (
                    <FormItem className="flex items-center justify-between rounded-lg border border-border/60 p-4">
                      <div className="space-y-0.5">
                        <FormLabel>Return trip needed</FormLabel>
                        <FormDescription>Turn on if you also need a lift back</FormDescription>
                      </div>
                      <FormControl>
                        <Switch checked={field.value} onCheckedChange={field.onChange} data-testid="switch-return" />
                      </FormControl>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Details</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Anything the driver should know — luggage, mobility needs, flexible timing, etc."
                          className="min-h-[100px] resize-none"
                          {...field}
                          data-testid="input-lift-description"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Contribution + contact */}
              <div className="space-y-6 pt-6">
                <div className="flex items-center gap-2 pb-2 border-b border-border/40">
                  <span className="font-semibold text-lg">Contribution &amp; contact</span>
                </div>

                <FormField
                  control={form.control}
                  name="budgetAmount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Petrol contribution (€)</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Euro className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                          <Input type="number" placeholder="0.00" className="pl-9" {...field} value={field.value ?? ""} data-testid="input-lift-budget" />
                        </div>
                      </FormControl>
                      <FormDescription>Optional — offer something towards fuel. Leave blank for a free/volunteer lift.</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="flex items-start gap-2 rounded-lg bg-primary/5 border border-primary/20 p-3">
                  <Lock className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                  <p className="text-sm text-muted-foreground">
                    Your phone number stays <span className="font-medium text-foreground">private</span> — it's only shared with the driver <span className="font-medium text-foreground">after</span> they offer you the lift.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="requesterName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Your name</FormLabel>
                        <FormControl>
                          <Input placeholder="What should the driver call you?" {...field} data-testid="input-lift-name" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="requesterPhone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-1.5"><Phone className="w-4 h-4 text-muted-foreground" /> Phone</FormLabel>
                        <FormControl>
                          <Input type="tel" placeholder="e.g., 087 123 4567" {...field} data-testid="input-lift-phone" />
                        </FormControl>
                        <FormDescription>Optional — so your driver can coordinate</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              <div className="pt-6">
                <Button
                  type="submit"
                  size="lg"
                  className="w-full md:w-auto text-lg px-8 rounded-full"
                  disabled={createErrand.isPending}
                  data-testid="btn-submit-lift"
                >
                  {createErrand.isPending ? "Posting..." : (<>Request Lift <Send className="ml-2 w-4 h-4" /></>)}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
