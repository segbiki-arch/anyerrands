import { LogIn, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useAuth } from "@workspace/replit-auth-web";

export function LoginRequired({
  title = "Please log in",
  description = "You need to be logged in to continue.",
}: {
  title?: string;
  description?: string;
}) {
  const { login } = useAuth();
  return (
    <div className="max-w-md mx-auto px-6 py-20">
      <Card className="border-border/60 shadow-sm">
        <CardContent className="p-8 text-center space-y-5">
          <div className="w-14 h-14 rounded-full bg-primary/15 flex items-center justify-center mx-auto">
            <Lock className="w-7 h-7 text-primary" />
          </div>
          <div className="space-y-1.5">
            <h1 className="text-2xl font-serif font-bold">{title}</h1>
            <p className="text-muted-foreground">{description}</p>
          </div>
          <Button onClick={login} size="lg" className="rounded-full gap-2" data-testid="btn-login-required">
            <LogIn className="w-4 h-4" /> Log in
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
