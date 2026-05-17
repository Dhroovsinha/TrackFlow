"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Target, Eye, EyeOff, ArrowRight, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/toast";

const demoAccounts = [
  { email: "priya.sharma@atomquest.com", password: "demo123", role: "Employee", name: "Priya Sharma" },
  { email: "rajesh.kumar@atomquest.com", password: "demo123", role: "Manager", name: "Rajesh Kumar" },
  { email: "admin@atomquest.com", password: "admin123", role: "Admin", name: "Ananya Patel" },
];

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        toast({
          title: "Login Failed",
          description: "Invalid email or password. Try a demo account below.",
          type: "error",
        });
      } else {
        toast({
          title: "Welcome back!",
          description: "Redirecting to your dashboard...",
          type: "success",
        });
        router.push("/dashboard");
        router.refresh();
      }
    } catch {
      toast({
        title: "Error",
        description: "Something went wrong. Please try again.",
        type: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDemoLogin = async (account: typeof demoAccounts[0]) => {
    setEmail(account.email);
    setPassword(account.password);
    setLoading(true);

    try {
      const result = await signIn("credentials", {
        email: account.email,
        password: account.password,
        redirect: false,
      });

      if (result?.error) {
        toast({
          title: "Login Failed",
          description: "Please run the seed script first: npm run db:seed",
          type: "error",
        });
      } else {
        toast({
          title: `Welcome, ${account.name}!`,
          description: `Logged in as ${account.role}`,
          type: "success",
        });
        router.push("/dashboard");
        router.refresh();
      }
    } catch {
      toast({
        title: "Error",
        description: "Something went wrong. Please try again.",
        type: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left panel - Branding */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-gradient-to-br from-violet-600 via-indigo-600 to-purple-700">
        <div className="absolute inset-0">
          <div className="absolute top-20 left-20 w-72 h-72 bg-white/10 rounded-full blur-3xl" />
          <div className="absolute bottom-20 right-20 w-96 h-96 bg-purple-300/10 rounded-full blur-3xl" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-indigo-300/10 rounded-full blur-2xl" />
        </div>
        <div className="relative z-10 flex flex-col justify-center px-16 text-white">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <div className="flex items-center gap-3 mb-8">
              <div className="w-12 h-12 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                <Target className="w-7 h-7" />
              </div>
              <span className="text-2xl font-bold">TrackFlow</span>
            </div>
            <h1 className="text-5xl font-bold leading-tight mb-6">
              Set Goals.<br />
              Track Progress.<br />
              <span className="text-indigo-200">Achieve More.</span>
            </h1>
            <p className="text-lg text-indigo-100/80 max-w-md">
              Enterprise-grade goal management platform with role-based workflows,
              quarterly tracking, and comprehensive analytics.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="mt-12 grid grid-cols-3 gap-6"
          >
            {[
              { label: "Active Goals", value: "2,847" },
              { label: "Teams", value: "156" },
              { label: "Completion", value: "87%" },
            ].map((stat) => (
              <div key={stat.label} className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
                <p className="text-2xl font-bold">{stat.value}</p>
                <p className="text-sm text-indigo-200">{stat.label}</p>
              </div>
            ))}
          </motion.div>
        </div>
      </div>

      {/* Right panel - Login form */}
      <div className="flex-1 flex items-center justify-center p-8 bg-background">
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6 }}
          className="w-full max-w-md"
        >
          <div className="lg:hidden flex items-center gap-3 mb-8">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <Target className="w-6 h-6 text-primary" />
            </div>
            <span className="text-xl font-bold">TrackFlow</span>
          </div>

          <h2 className="text-3xl font-bold mb-2">Welcome back</h2>
          <p className="text-muted-foreground mb-8">Sign in to your account to continue</p>

          <form onSubmit={handleLogin} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="name@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="h-11"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="h-11 pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
            <Button type="submit" className="w-full h-11" loading={loading} size="lg">
              Sign In
              <ArrowRight className="w-4 h-4 ml-1" />
            </Button>
          </form>

          <div className="mt-10">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-border" />
              </div>
              <div className="relative flex justify-center text-xs">
                <span className="bg-background px-3 text-muted-foreground flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5" />
                  Quick Demo Access
                </span>
              </div>
            </div>

            <div className="mt-5 grid gap-3">
              {demoAccounts.map((account) => (
                <button
                  key={account.email}
                  onClick={() => handleDemoLogin(account)}
                  disabled={loading}
                  className="flex items-center justify-between w-full p-3.5 rounded-xl border border-border/50 bg-card hover:bg-accent/50 transition-all duration-200 group disabled:opacity-50"
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-9 h-9 rounded-lg flex items-center justify-center text-white text-sm font-semibold ${
                      account.role === "Admin" ? "bg-gradient-to-br from-amber-500 to-orange-600" :
                      account.role === "Manager" ? "bg-gradient-to-br from-blue-500 to-indigo-600" :
                      "bg-gradient-to-br from-emerald-500 to-teal-600"
                    }`}>
                      {account.name.split(" ").map(n => n[0]).join("")}
                    </div>
                    <div className="text-left">
                      <p className="text-sm font-medium">{account.name}</p>
                      <p className="text-xs text-muted-foreground">{account.role} • {account.email}</p>
                    </div>
                  </div>
                  <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-foreground transition-colors group-hover:translate-x-0.5 transform duration-200" />
                </button>
              ))}
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
