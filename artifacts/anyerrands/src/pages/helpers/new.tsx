import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useCreateHelper, getListHelpersQueryKey } from "@workspace/api-client-react";
import { useAuth } from "@workspace/replit-auth-web";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Send, MapPin, X, LogIn, UserPlus } from "lucide-react";

const formSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  location: z.string().min(3, "Location is required"),
  bio: z.string().min(10, "Please write a short bio (min 10 chars)"),
  skills: z.array(z.string()).min(1, "Add at least one skill"),
  available: z.boolean().default(true),
});

export default function NewHelperPage() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user, isLoading: authLoading, isAuthenticated, login } = useAuth();

  const accountName = [user?.firstName, user?.lastName].filter(Boolean).join(" ").trim();

  const [skillInput, setSkillInput] = useState("");
  const createHelper = useCreateHelper();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      location: "",
      bio: "",
      skills: [],
      available: true,
    },
  });

  useEffect(() => {
    if (accountName) form.setValue("name", accountName);
  }, [accountName, form]);

  const addSkill = () => {
    if (!skillInput.trim()) return;
    const current = form.getValues("skills");
    if (!current.includes(skillInput.trim())) {
      form.setValue("skills", [...current, skillInput.trim()]);
    }
    setSkillInput("");
  };

  const removeSkill = (skill: string) => {
    const current = form.getValues("skills");
    form.setValue("skills", current.filter(s => s !== skill));
  };

  function onSubmit(values: z.infer<typeof formSchema>) {
    createHelper.mutate(
      { data: values },
      {
        onSuccess: (newHelper) => {
          queryClient.invalidateQueries({ queryKey: getListHelpersQueryKey() });
          
          toast({
            title: "Welcome to the community!",
            description: "Your helper profile has been created.",
          });
          setLocation(`/helpers/${newHelper.id}`);
        },
        onError: () => {
          toast({
            variant: "destructive",
            title: "Failed to create profile",
            description: "Something went wrong. Please try again.",
          });
        }
      }
    );
  }

  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="max-w-md mx-auto px-6 py-20 text-center">
        <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-6">
          <UserPlus className="w-8 h-8 text-primary" />
        </div>
        <h2 className="text-2xl font-serif font-bold mb-2">Log in to become a helper</h2>
        <p className="text-muted-foreground mb-8">
          Your helper profile is linked to your account, so only you can manage it and your bank payout details. Please log in to continue.
        </p>
        <Button size="lg" className="rounded-full" onClick={login} data-testid="btn-login-helper">
          <LogIn className="w-4 h-4 mr-2" />
          Log in to continue
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto p-6 md:p-8 py-12">
      <div className="mb-8">
        <h1 className="text-4xl font-serif font-bold tracking-tight">Become a Helper</h1>
        <p className="text-lg text-muted-foreground mt-2">Set up a profile so neighbors know how you can help.</p>
      </div>

      <Card className="border-border/60 shadow-sm overflow-hidden">
        <div className="h-2 bg-secondary w-full"></div>
        <CardContent className="p-6 md:p-8">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Full Name</FormLabel>
                      <FormControl>
                        <Input placeholder="John Doe" {...field} disabled readOnly data-testid="input-helper-name" />
                      </FormControl>
                      <FormDescription>From your account — keeps your profile tied to you.</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="location"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Neighborhood / City</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                          <Input placeholder="e.g., Nenagh, Roscrea, Thurles..." className="pl-9" {...field} data-testid="input-helper-location" />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="bio"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>About You</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Hi! I'm John. I love fixing things around the house and walking dogs..." 
                        className="min-h-[120px] resize-none"
                        {...field} 
                        data-testid="input-helper-bio"
                      />
                    </FormControl>
                    <FormDescription>A short intro helps build trust with your neighbors.</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="skills"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Your Skills</FormLabel>
                    <div className="flex gap-2 mb-3">
                      <Input 
                        value={skillInput}
                        onChange={e => setSkillInput(e.target.value)}
                        onKeyDown={e => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            addSkill();
                          }
                        }}
                        placeholder="e.g., Plumbing, Dog walking, Grocery shopping..."
                        data-testid="input-skill"
                      />
                      <Button type="button" onClick={addSkill} variant="secondary">Add</Button>
                    </div>
                    
                    {field.value.length > 0 && (
                      <div className="flex flex-wrap gap-2 p-4 bg-muted/30 rounded-lg border border-border/50">
                        {field.value.map(skill => (
                          <Badge key={skill} className="px-3 py-1 text-sm bg-primary/10 text-primary hover:bg-primary/20 border-0">
                            {skill}
                            <button 
                              type="button" 
                              onClick={() => removeSkill(skill)}
                              className="ml-2 hover:bg-primary/20 rounded-full p-0.5"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </Badge>
                        ))}
                      </div>
                    )}
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="available"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border border-border/50 p-4 bg-card">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">I am currently available</FormLabel>
                      <FormDescription>
                        Toggle off if you're taking a break from errands
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        data-testid="switch-available"
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              <div className="pt-4">
                <Button 
                  type="submit" 
                  size="lg" 
                  className="w-full md:w-auto px-8 rounded-full" 
                  disabled={createHelper.isPending}
                  data-testid="btn-submit-helper"
                >
                  {createHelper.isPending ? "Creating profile..." : "Join as Helper"}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}