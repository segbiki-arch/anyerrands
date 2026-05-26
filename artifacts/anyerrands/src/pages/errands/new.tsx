import { useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useCreateErrand, useListCategories, getListErrandsQueryKey, getGetErrandStatsQueryKey, getGetRecentErrandsQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Send, MapPin, DollarSign, Clock } from "lucide-react";

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
    <div className="max-w-3xl mx-auto p-6 md:p-8 py-12">
      <div className="mb-8">
        <h1 className="text-4xl font-serif font-bold tracking-tight">Ask for help</h1>
        <p className="text-lg text-muted-foreground mt-2">Create a new errand post so neighbors can lend a hand.</p>
      </div>

      <Card className="border-border/60 shadow-sm overflow-hidden">
        <div className="h-2 bg-primary w-full"></div>
        <CardContent className="p-6 md:p-8">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
              
              <div className="space-y-6">
                <div className="flex items-center gap-2 pb-2 border-b border-border/40">
                  <span className="font-semibold text-lg">The Basics</span>
                </div>
                
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-base">What do you need help with?</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., Pick up groceries from Trader Joe's" className="text-lg py-6" {...field} data-testid="input-title" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="category"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Category</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger data-testid="select-category">
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
                    name="requesterLocation"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Location</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                            <Input placeholder="e.g., 123 Main St or 'Downtown'" className="pl-9" {...field} data-testid="input-location" />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Details</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Provide any details the helper might need to know..." 
                          className="min-h-[120px] resize-none"
                          {...field} 
                          data-testid="input-description"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="space-y-6 pt-6">
                <div className="flex items-center gap-2 pb-2 border-b border-border/40">
                  <span className="font-semibold text-lg">Optional Details</span>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="budgetAmount"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Budget ($)</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                            <Input type="number" placeholder="0.00" className="pl-9" {...field} value={field.value ?? ""} data-testid="input-budget" />
                          </div>
                        </FormControl>
                        <FormDescription>Leave blank if volunteer/unpaid</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

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
                </div>
              </div>

              <div className="space-y-6 pt-6">
                <div className="flex items-center gap-2 pb-2 border-b border-border/40">
                  <span className="font-semibold text-lg">About You</span>
                </div>
                
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
              </div>

              <div className="pt-6">
                <Button 
                  type="submit" 
                  size="lg" 
                  className="w-full md:w-auto text-lg px-8 rounded-full" 
                  disabled={createErrand.isPending}
                  data-testid="btn-submit-errand"
                >
                  {createErrand.isPending ? (
                    "Posting..."
                  ) : (
                    <>
                      Post Errand <Send className="ml-2 w-4 h-4" />
                    </>
                  )}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}