import { useEffect } from "react";
import { useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useCreateErrand, useListCategories, getListErrandsQueryKey, getGetErrandStatsQueryKey, getGetRecentErrandsQueryKey } from "@workspace/api-client-react";
import { useAuth } from "@workspace/replit-auth-web";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Send, MapPin, Euro, ChevronDown, Clock } from "lucide-react";
import { useState } from "react";

const formSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters").max(100, "Title is too long"),
  description: z.string().min(10, "Description must be at least 10 characters"),
  category: z.string().min(1, "Please select a category"),
  requesterName: z.string().min(2, "Name must be at least 2 characters"),
  requesterLocation: z.string().min(3, "Location is required"),
  estimatedDuration: z.string().optional(),
  budgetAmount: z.coerce.number().min(0, "Budget cannot be negative").optional().or(z.literal("").transform(() => undefined)),
});

export default function NewErrandPage() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { data: categories } = useListCategories();
  const { user } = useAuth();
  
  const [isOptionalOpen, setIsOptionalOpen] = useState(false);

  const accountName = [user?.firstName, user?.lastName].filter(Boolean).join(" ").trim();

  const createErrand = useCreateErrand();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      description: "",
      category: "",
      requesterName: "",
      requesterLocation: "",
      estimatedDuration: "",
    },
  });

  useEffect(() => {
    if (accountName && !form.getValues("requesterName")) {
      form.setValue("requesterName", accountName);
    }
  }, [accountName, form]);

  function onSubmit(values: z.infer<typeof formSchema>) {
    createErrand.mutate(
      { data: values },
      {
        onSuccess: (newErrand) => {
          queryClient.invalidateQueries({ queryKey: getListErrandsQueryKey() });
          queryClient.invalidateQueries({ queryKey: getGetErrandStatsQueryKey() });
          queryClient.invalidateQueries({ queryKey: getGetRecentErrandsQueryKey() });
          
          toast({
            title: "Errand posted successfully!",
            description: "Your neighbors can now see your request.",
          });
          setLocation(`/errands/${newErrand.id}`);
        },
        onError: () => {
          toast({
            variant: "destructive",
            title: "Failed to post errand",
            description: "Something went wrong. Please try again.",
          });
        }
      }
    );
  }

  return (
    <div className="max-w-2xl mx-auto p-6 py-12">
      <div className="mb-8 text-center">
        <h1 className="text-4xl font-serif font-bold tracking-tight">Need a hand?</h1>
        <p className="text-lg text-muted-foreground mt-2">Post in seconds. A neighbour will pick it up.</p>
      </div>

      <Card className="border-border/60 shadow-lg rounded-3xl overflow-hidden">
        <CardContent className="p-6 md:p-8">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              
              <FormField
                control={form.control}
                name="category"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-base font-semibold">What type of help do you need?</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger className="h-12 text-lg rounded-xl bg-muted/20" data-testid="select-category">
                          <SelectValue placeholder="Select a category" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {categories?.map(c => (
                          <SelectItem key={c.id} value={c.name}>{c.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-base font-semibold">Short title</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Pick up groceries from Dunnes" className="h-12 text-lg rounded-xl bg-muted/20" {...field} data-testid="input-title" />
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
                    <FormLabel className="text-base font-semibold">Description</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Details..." 
                        className="min-h-[100px] resize-none rounded-xl bg-muted/20"
                        {...field} 
                        data-testid="input-description"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="budgetAmount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-base font-semibold">Budget (€)</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Euro className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                          <Input type="number" placeholder="Optional" className="h-12 pl-9 rounded-xl bg-muted/20" {...field} value={field.value ?? ""} data-testid="input-budget" />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="requesterLocation"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-base font-semibold">Town / Area</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                          <Input placeholder="e.g., Nenagh" className="h-12 pl-9 rounded-xl bg-muted/20" {...field} data-testid="input-location" />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <Collapsible
                open={isOptionalOpen}
                onOpenChange={setIsOptionalOpen}
                className="w-full border rounded-xl p-4 bg-muted/5"
              >
                <CollapsibleTrigger asChild>
                  <Button variant="ghost" className="w-full flex justify-between p-0 hover:bg-transparent h-auto">
                    <span className="font-semibold text-muted-foreground">Add more details (optional)</span>
                    <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform ${isOptionalOpen ? 'rotate-180' : ''}`} />
                  </Button>
                </CollapsibleTrigger>
                <CollapsibleContent className="space-y-4 pt-4">
                  <FormField
                    control={form.control}
                    name="estimatedDuration"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Estimated Duration</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                            <Input placeholder="e.g., 1-2 hours" className="pl-9" {...field} data-testid="input-duration" />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="requesterName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Your Name</FormLabel>
                        <FormControl>
                          <Input placeholder="What should helpers call you?" {...field} data-testid="input-name" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CollapsibleContent>
              </Collapsible>

              <Button 
                type="submit" 
                size="lg" 
                className="w-full h-14 text-lg rounded-full font-bold shadow-md hover:scale-[1.02] transition-transform" 
                disabled={createErrand.isPending}
                data-testid="btn-submit-errand"
              >
                {createErrand.isPending ? "Posting..." : <><Send className="mr-2 w-5 h-5" /> Post Request</>}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}