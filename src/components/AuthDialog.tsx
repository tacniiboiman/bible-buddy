import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
} from "@/components/ui/dialog";
import { LogIn, LogOut, User, Cloud } from "lucide-react";

interface AuthDialogProps {
  user: { id: string; email?: string } | null;
  onAuthChange: () => void;
}

export function AuthDialog({ user, onAuthChange }: AuthDialogProps) {
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSignUp, setIsSignUp] = useState(false);
  const [isReset, setIsReset] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");

    if (isReset) {
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      if (resetError) {
        setError(resetError.message);
      } else {
        setSuccess("Check your email for the reset link!");
        setIsReset(false);
      }
    } else {
      const { error: authError } = isSignUp
        ? await supabase.auth.signUp({ email, password })
        : await supabase.auth.signInWithPassword({ email, password });

      if (authError) {
        setError(authError.message);
      } else {
        setOpen(false);
        setEmail("");
        setPassword("");
        onAuthChange();
      }
    }
    setLoading(false);
  }

  async function handleSignOut() {
    await supabase.auth.signOut();
    onAuthChange();
  }

  if (user) {
    return (
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-1.5 rounded-full bg-accent px-3 py-1.5 text-xs text-accent-foreground">
          <Cloud className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">{user.email}</span>
        </div>
        <Button variant="ghost" size="icon" onClick={handleSignOut} title="Sign out">
          <LogOut className="h-4 w-4" />
        </Button>
      </div>
    );
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <LogIn className="h-4 w-4" />
          <span className="hidden sm:inline">Sign in to sync</span>
          <span className="sm:hidden">Sync</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle className="font-serif text-xl">
            {isReset ? "Reset Password" : isSignUp ? "Create Account" : "Sign In"}
          </DialogTitle>
          <DialogDescription>
            {isReset
              ? "We'll send a password recovery link to your email."
              : isSignUp
              ? "Create an account to sync verses across devices."
              : "Sign in to access your verses on any device."}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-3">
          {success && <p className="text-xs text-green-600 font-medium">{success}</p>}
          <Input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          {!isReset && (
            <Input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
            />
          )}
          {error && <p className="text-xs text-destructive">{error}</p>}
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Loading..." : isReset ? "Send Reset Link" : isSignUp ? "Sign Up" : "Sign In"}
          </Button>
          
          <div className="flex flex-col gap-2">
            {!isReset && !isSignUp && (
              <button
                type="button"
                onClick={() => {
                  setIsReset(true);
                  setError("");
                }}
                className="w-full text-center text-xs text-muted-foreground hover:underline"
              >
                Forgot Password?
              </button>
            )}
            
            <button
              type="button"
              onClick={() => {
                if (isReset) {
                  setIsReset(false);
                } else {
                  setIsSignUp(!isSignUp);
                }
                setError("");
              }}
              className="w-full text-center text-xs text-muted-foreground hover:underline"
            >
              {isReset 
                ? "Back to Sign In" 
                : isSignUp 
                ? "Already have an account? Sign in" 
                : "Don't have an account? Sign up"}
            </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

