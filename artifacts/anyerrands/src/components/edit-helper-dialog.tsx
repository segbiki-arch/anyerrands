import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  useUpdateHelper,
  getGetHelperQueryKey,
  getListHelpersQueryKey,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Pencil, MapPin, X } from "lucide-react";

const formSchema = z.object({
  location: z.string().min(3, "Location is required"),
  bio: z.string().min(10, "Please write a short bio (min 10 chars)"),
  skills: z.array(z.string()).min(1, "Add at least one skill"),
  available: z.boolean(),
});

type FormValues = z.infer<typeof formSchema>;

interface EditHelperDialogProps {
  helper: {
    id: number;
    location: string;
    bio: string;
    skills: string[];
    available: boolean;
  };
}

export function EditHelperDialog({ helper }: EditHelperDialogProps) {
  const [open, setOpen] = useState(false);
  const [skillInput, setSkillInput] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const updateHelper = useUpdateHelper();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      location: helper.location,
      bio: helper.bio,
      skills: helper.skills,
      available: helper.available,
    },
  });

  // Reset the form to the latest profile values whenever the dialog opens.
  const handleOpenChange = (next: boolean) => {
    if (next) {
      form.reset({
        location: helper.location,
        bio: helper.bio,
        skills: helper.skills,
        available: helper.available,
      });
      setSkillInput("");
    }
    setOpen(next);
  };

  const addSkill = () => {
    if (!skillInput.trim()) return;
    const current = form.getValues("skills");
    if (!current.includes(skillInput.trim())) {
      form.setValue("skills", [...current, skillInput.trim()], { shouldValidate: true });
    }
    setSkillInput("");
  };

  const removeSkill = (skill: string) => {
    const current = form.getValues("skills");
    form.setValue("skills", current.filter((s) => s !== skill), { shouldValidate: true });
  };

  function onSubmit(values: FormValues) {
    updateHelper.mutate(
      { id: helper.id, data: values },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getGetHelperQueryKey(helper.id) });
          queryClient.invalidateQueries({ queryKey: getListHelpersQueryKey() });
          toast({ title: "Profile updated", description: "Your changes have been saved." });
          setOpen(false);
        },
        onError: () => {
          toast({
            variant: "destructive",
            title: "Couldn't save changes",
            description: "Something went wrong. Please try again.",
          });
        },
      },
    );
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="rounded-full gap-2" data-testid="btn-edit-profile">
          <Pencil className="w-3.5 h-3.5" /> Edit profile
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit your profile</DialogTitle>
          <DialogDescription>Update your details if you wrote something wrong. Your name stays tied to your account.</DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="bio"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>About Me</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Hi! I love helping neighbours with..."
                      className="min-h-[120px] resize-none"
                      {...field}
                      data-testid="input-edit-bio"
                    />
                  </FormControl>
                  <FormDescription>A short intro helps build trust with your neighbours.</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="location"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Neighbourhood / Town</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input placeholder="e.g., Nenagh, Roscrea, Thurles..." className="pl-9" {...field} data-testid="input-edit-location" />
                    </div>
                  </FormControl>
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
                      onChange={(e) => setSkillInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          addSkill();
                        }
                      }}
                      placeholder="e.g., Plumbing, Dog walking..."
                      data-testid="input-edit-skill"
                    />
                    <Button type="button" onClick={addSkill} variant="secondary">Add</Button>
                  </div>
                  {field.value.length > 0 && (
                    <div className="flex flex-wrap gap-2 p-4 bg-muted/30 rounded-lg border border-border/50">
                      {field.value.map((skill) => (
                        <Badge key={skill} className="px-3 py-1 text-sm bg-primary/10 text-primary hover:bg-primary/20 border-0">
                          {skill}
                          <button type="button" onClick={() => removeSkill(skill)} className="ml-2 hover:bg-primary/20 rounded-full p-0.5">
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
                    <FormDescription>Toggle off if you're taking a break from errands</FormDescription>
                  </div>
                  <FormControl>
                    <Switch checked={field.value} onCheckedChange={field.onChange} data-testid="switch-edit-available" />
                  </FormControl>
                </FormItem>
              )}
            />

            <DialogFooter className="gap-2 sm:gap-0">
              <Button type="button" variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
              <Button type="submit" className="rounded-full" disabled={updateHelper.isPending} data-testid="btn-save-profile">
                {updateHelper.isPending ? "Saving..." : "Save changes"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
