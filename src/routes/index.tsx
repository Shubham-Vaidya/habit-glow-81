import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { ArrowRight, Check, ChevronRight, LoaderCircle, LogOut, Plus, Sparkles, X } from "lucide-react";
import { lovable } from "@/integrations/lovable";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  formatToday,
  getHabitMetrics,
  getHistoryWeeks,
  getInitials,
  getLocalDateKey,
  type Completion,
  type Habit,
} from "@/lib/habit-utils";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Tally — Habit tracker" },
      { name: "description", content: "A calm, simple habit tracker that keeps your streaks and history in sync." },
      { property: "og:title", content: "Tally — Habit tracker" },
      { property: "og:description", content: "Build consistency with a simple daily habit tracker." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: HomePage,
});

type AuthMode = "login" | "signup";

function HomePage() {
  const [sessionEmail, setSessionEmail] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [authLoading, setAuthLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    void supabase.auth.getUser().then(({ data }) => {
      if (!mounted) return;
      setUserId(data.user?.id ?? null);
      setSessionEmail(data.user?.email ?? null);
      setAuthLoading(false);
    });
    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      setUserId(session?.user.id ?? null);
      setSessionEmail(session?.user.email ?? null);
      setAuthLoading(false);
    });
    return () => {
      mounted = false;
      data.subscription.unsubscribe();
    };
  }, []);

  if (authLoading) {
    return <LoadingScreen />;
  }

  return userId && sessionEmail ? <Dashboard userId={userId} email={sessionEmail} /> : <AuthScreen />;
}

function LoadingScreen() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-background">
      <LoaderCircle className="size-6 animate-spin text-brand" aria-label="Loading" />
    </main>
  );
}

function AuthScreen() {
  const [mode, setMode] = useState<AuthMode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);
    const result = mode === "login"
      ? await supabase.auth.signInWithPassword({ email, password })
      : await supabase.auth.signUp({ email, password, options: { emailRedirectTo: window.location.origin } });
    setLoading(false);
    if (result.error) {
      setError(result.error.message);
    } else if (mode === "signup" && !result.data.session) {
      setMessage("Check your email to confirm your account, then come back to Tally.");
    }
  }

  async function signInWithGoogle() {
    setLoading(true);
    setError(null);
    const result = await lovable.auth.signInWithOAuth("google", { redirect_uri: window.location.origin });
    if (result.error) setError(result.error.message);
    setLoading(false);
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-background text-foreground">
      <AmbientBackground />
      <div className="relative mx-auto grid min-h-screen max-w-6xl items-center gap-12 px-5 py-10 sm:px-8 lg:grid-cols-[1.1fr_0.9fr] lg:gap-20 lg:py-16">
        <section className="max-w-xl">
          <BrandMark />
          <p className="mt-12 text-xs font-semibold uppercase tracking-[0.24em] text-muted-foreground">A little consistency, every day</p>
          <h1 className="mt-4 font-display text-5xl font-bold leading-[0.98] tracking-tight sm:text-7xl">Make the good days easier to repeat.</h1>
          <p className="mt-6 max-w-md text-base leading-7 text-muted-foreground sm:text-lg">Tally keeps the daily check-in simple, shows your real streaks, and remembers every day across your devices.</p>
          <div className="mt-9 flex flex-wrap gap-3 text-sm text-muted-foreground">
            <span className="inline-flex items-center gap-2 rounded-full border border-border/70 bg-card/60 px-3 py-2"><Check className="size-4 text-brand" /> One tap to mark a day</span>
            <span className="inline-flex items-center gap-2 rounded-full border border-border/70 bg-card/60 px-3 py-2"><Sparkles className="size-4 text-accent" /> History that stays with you</span>
          </div>
        </section>
        <section className="glass-panel w-full max-w-md justify-self-center p-6 sm:p-8">
          <div className="mb-7 flex items-center gap-2 rounded-full bg-secondary p-1 text-sm">
            <button type="button" className={`flex-1 rounded-full px-3 py-2 font-semibold transition ${mode === "login" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground"}`} onClick={() => setMode("login")}>Log in</button>
            <button type="button" className={`flex-1 rounded-full px-3 py-2 font-semibold transition ${mode === "signup" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground"}`} onClick={() => setMode("signup")}>Sign up</button>
          </div>
          <div>
            <h2 className="font-display text-2xl font-bold tracking-tight">{mode === "login" ? "Welcome back" : "Start your streak"}</h2>
            <p className="mt-1 text-sm text-muted-foreground">{mode === "login" ? "Pick up where you left off." : "Create a private space for your habits."}</p>
          </div>
          <form className="mt-6 space-y-4" onSubmit={submit}>
            <label className="block text-sm font-medium">Email<input required type="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@example.com" className="mt-2 flex h-11 w-full rounded-xl border border-input bg-background/70 px-3 py-2 text-base shadow-sm outline-none transition focus-visible:ring-2 focus-visible:ring-ring" /></label>
            <label className="block text-sm font-medium">Password<input required minLength={6} type="password" autoComplete={mode === "login" ? "current-password" : "new-password"} value={password} onChange={(event) => setPassword(event.target.value)} placeholder="At least 6 characters" className="mt-2 flex h-11 w-full rounded-xl border border-input bg-background/70 px-3 py-2 text-base shadow-sm outline-none transition focus-visible:ring-2 focus-visible:ring-ring" /></label>
            {error && <p className="rounded-xl border border-destructive/25 bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p>}
            {message && <p className="rounded-xl border border-brand/25 bg-brand/10 px-3 py-2 text-sm text-brand-strong">{message}</p>}
            <Button disabled={loading} className="h-12 w-full rounded-xl bg-ink text-ink-foreground shadow-lg shadow-ink/20 hover:bg-ink/90">{loading ? <LoaderCircle className="size-4 animate-spin" /> : mode === "login" ? "Log in" : "Create account"}</Button>
          </form>
          <div className="my-5 flex items-center gap-3 text-xs text-muted-foreground"><span className="h-px flex-1 bg-border" /> or <span className="h-px flex-1 bg-border" /></div>
          <Button type="button" variant="outline" disabled={loading} className="h-12 w-full rounded-xl bg-card/60" onClick={() => void signInWithGoogle()}><span className="grid size-5 place-items-center rounded-full bg-foreground text-[10px] font-bold text-background">G</span> Continue with Google</Button>
        </section>
      </div>
    </main>
  );
}

function Dashboard({ userId, email }: { userId: string; email: string }) {
  const [habits, setHabits] = useState<Habit[]>([]);
  const [completions, setCompletions] = useState<Completion[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Habit | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const today = getLocalDateKey();

  async function loadHabits() {
    setLoading(true);
    const { data: habitRows, error: habitsError } = await supabase.from("habits").select("*").eq("user_id", userId).order("created_at", { ascending: true });
    if (habitsError) {
      setNotice(habitsError.message);
      setLoading(false);
      return;
    }
    const rows = (habitRows ?? []) as Habit[];
    setHabits(rows);
    if (rows.length === 0) {
      setCompletions([]);
      setLoading(false);
      return;
    }
    const { data: completionRows, error: completionsError } = await supabase.from("habit_completions").select("*").in("habit_id", rows.map((habit) => habit.id));
    if (completionsError) setNotice(completionsError.message);
    setCompletions((completionRows ?? []) as Completion[]);
    setLoading(false);
  }

  useEffect(() => { void loadHabits(); }, [userId]);

  async function toggleCompletion(habit: Habit) {
    const current = completions.find((completion) => completion.habit_id === habit.id && completion.completion_date === today);
    setSaving(habit.id);
    const result = current
      ? await supabase.from("habit_completions").upsert({ id: current.id, habit_id: habit.id, completion_date: today, completed: !current.completed })
      : await supabase.from("habit_completions").insert({ habit_id: habit.id, completion_date: today, completed: true });
    if (result.error) setNotice(result.error.message);
    await loadHabits();
    setSaving(null);
  }

  async function signOut() {
    await supabase.auth.signOut();
  }

  const completedToday = habits.filter((habit) => completions.some((completion) => completion.habit_id === habit.id && completion.completion_date === today && completion.completed)).length;

  return (
    <main className="relative min-h-screen overflow-hidden bg-background text-foreground">
      <AmbientBackground />
      <div className="relative mx-auto max-w-6xl px-4 py-5 sm:px-6 lg:px-8 lg:py-8">
        <header className="flex items-center justify-between gap-4">
          <BrandMark />
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="hidden rounded-full border border-border/70 bg-card/60 px-4 py-2 text-sm font-medium text-muted-foreground backdrop-blur-md sm:block">{formatToday()}</div>
            <Button type="button" variant="outline" size="sm" className="hidden rounded-full bg-card/50 sm:inline-flex" onClick={() => void signOut()}><LogOut className="size-3.5" /> Log out</Button>
            <div className="grid size-10 place-items-center rounded-full bg-gradient-to-br from-brand to-accent font-display text-sm font-bold text-primary-foreground" title={email}>{getInitials(email)}</div>
          </div>
        </header>

        <section className="mt-10 flex items-end justify-between gap-4 sm:mt-14">
          <div><p className="text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">{formatToday()}</p><h1 className="mt-2 font-display text-4xl font-bold tracking-tight sm:text-5xl">Today</h1><p className="mt-2 text-sm text-muted-foreground">{completedToday} of {habits.length} {habits.length === 1 ? "habit" : "habits"} complete</p></div>
          <Button type="button" className="rounded-full bg-ink px-4 py-3 text-sm text-ink-foreground shadow-lg shadow-ink/20 hover:bg-ink/90 sm:px-5" onClick={() => { setEditing(null); setDialogOpen(true); }}><Plus className="size-4" /> <span className="hidden sm:inline">Add Habit</span><span className="sm:hidden">Add</span></Button>
        </section>

        {notice && <div className="mt-6 flex items-center justify-between rounded-2xl border border-destructive/25 bg-destructive/10 px-4 py-3 text-sm text-destructive"><span>{notice}</span><button type="button" onClick={() => setNotice(null)} aria-label="Dismiss"><X className="size-4" /></button></div>}
        {loading ? <div className="mt-8 flex justify-center py-20"><LoaderCircle className="size-6 animate-spin text-brand" /></div> : habits.length === 0 ? <EmptyState onAdd={() => setDialogOpen(true)} /> : <section className="mt-7 grid grid-cols-1 gap-4 sm:gap-5 md:grid-cols-2">{habits.map((habit) => <HabitCard key={habit.id} habit={habit} completions={completions} saving={saving === habit.id} onToggle={() => void toggleCompletion(habit)} onEdit={() => { setEditing(habit); setDialogOpen(true); }} />)}</section>}
        <p className="mt-8 pb-6 text-center text-xs text-muted-foreground">Your dates follow your device’s local calendar · history syncs across devices</p>
      </div>
      <HabitDialog open={dialogOpen} onOpenChange={setDialogOpen} userId={userId} editing={editing} onSaved={() => void loadHabits()} />
    </main>
  );
}

function HabitCard({ habit, completions, saving, onToggle, onEdit }: { habit: Habit; completions: Completion[]; saving: boolean; onToggle: () => void; onEdit: () => void }) {
  const metrics = getHabitMetrics(habit, completions.filter((completion) => completion.habit_id === habit.id));
  const todayDone = completions.some((completion) => completion.habit_id === habit.id && completion.completion_date === getLocalDateKey() && completion.completed);
  const previewDays = getHistoryWeeks(4).flat().slice(-21);
  const doneSet = new Set(completions.filter((completion) => completion.habit_id === habit.id && completion.completed).map((completion) => completion.completion_date));
  return <article className={`glass-panel p-5 transition hover:-translate-y-0.5 hover:shadow-xl hover:shadow-ink/10 ${todayDone ? "ring-1 ring-accent/30" : ""}`}>
    <div className="flex items-start justify-between gap-3"><Link to="/habits/$habitId" params={{ habitId: habit.id }} className="min-w-0 flex-1" onClick={onEdit}><h2 className="truncate font-display text-lg font-semibold tracking-tight hover:text-brand">{habit.name}</h2>{habit.description && <p className="mt-0.5 line-clamp-1 text-xs text-muted-foreground">{habit.description}</p>}</Link><span className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-semibold ${todayDone ? "bg-success/15 text-success-strong" : metrics.currentStreak ? "bg-brand/15 text-brand-strong" : "bg-secondary text-muted-foreground"}`}>{todayDone ? "Done today" : metrics.currentStreak ? `${metrics.currentStreak}-day streak` : "Not done"}</span></div>
    <div className="mt-5"><div className="flex flex-wrap gap-[3px]">{previewDays.map((key) => <span key={key} title={key} className={`size-3 rounded-[3px] ${doneSet.has(key) ? "bg-brand/80" : "bg-heatmap-empty"}`} />)}</div><div className="mt-4 grid grid-cols-3 gap-2 text-center"><Metric label="Streak" value={metrics.currentStreak} /><Metric label="Longest" value={metrics.longestStreak} /><Metric label="Done" value={`${metrics.completionPercentage}%`} /></div></div>
    <Button type="button" disabled={saving} className={`mt-5 h-14 w-full rounded-2xl text-base shadow-lg transition active:scale-[0.98] ${todayDone ? "bg-success text-success-foreground shadow-success/20 hover:bg-success/90" : "bg-brand text-brand-foreground shadow-brand/25 hover:bg-brand/90"}`} onClick={onToggle}>{saving ? <LoaderCircle className="size-5 animate-spin" /> : todayDone ? <><Check className="size-5" /> Completed · tap to undo</> : <><span className="grid size-5 place-items-center rounded-full border border-current text-xs"><Plus className="size-3" /></span> Mark done today</>}</Button>
    <div className="mt-3 flex justify-end"><Link to="/habits/$habitId" params={{ habitId: habit.id }} className="inline-flex items-center gap-1 text-xs font-semibold text-muted-foreground transition hover:text-brand">View history <ArrowRight className="size-3.5" /></Link></div>
  </article>;
}

function Metric({ label, value }: { label: string; value: string | number }) { return <div><p className="font-display text-lg font-bold leading-none">{value}</p><p className="mt-1 text-[10px] uppercase tracking-wide text-muted-foreground">{label}</p></div>; }

function EmptyState({ onAdd }: { onAdd: () => void }) { return <section className="glass-panel mt-8 flex flex-col items-center justify-center px-6 py-16 text-center"><div className="grid size-14 place-items-center rounded-2xl bg-brand/12 text-brand"><Sparkles className="size-6" /></div><h2 className="mt-5 font-display text-2xl font-bold">Start with one small habit</h2><p className="mt-2 max-w-sm text-sm leading-6 text-muted-foreground">Add something you want to make easier to repeat. Your first day starts now.</p><Button type="button" className="mt-6 rounded-full bg-ink text-ink-foreground hover:bg-ink/90" onClick={onAdd}><Plus className="size-4" /> Add your first habit</Button></section>; }

function HabitDialog({ open, onOpenChange, userId, editing, onSaved }: { open: boolean; onOpenChange: (open: boolean) => void; userId: string; editing: Habit | null; onSaved: () => void }) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => { setName(editing?.name ?? ""); setDescription(editing?.description ?? ""); setError(null); }, [editing, open]);
  async function save(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!name.trim()) return setError("Give this habit a name first.");
    setSaving(true); setError(null);
    const result = editing ? await supabase.from("habits").update({ name: name.trim(), description: description.trim() || null }).eq("id", editing.id).eq("user_id", userId) : await supabase.from("habits").insert({ user_id: userId, name: name.trim(), description: description.trim() || null });
    setSaving(false);
    if (result.error) return setError(result.error.message);
    onOpenChange(false); onSaved();
  }
  return <Dialog open={open} onOpenChange={onOpenChange}><DialogContent className="rounded-3xl border-border/70 bg-card/95 p-6 backdrop-blur-xl sm:max-w-md"><DialogHeader><DialogTitle className="font-display text-2xl">{editing ? "Edit habit" : "Add a habit"}</DialogTitle><DialogDescription>{editing ? "Keep the wording clear and motivating." : "Choose one small action you can repeat."}</DialogDescription></DialogHeader><form className="space-y-4" onSubmit={save}><label className="block text-sm font-medium">Habit name<Input autoFocus value={name} onChange={(event) => setName(event.target.value)} placeholder="Read 20 pages" className="mt-2 h-11 rounded-xl bg-background/60" /></label><label className="block text-sm font-medium">Description <span className="font-normal text-muted-foreground">(optional)</span><Textarea value={description} onChange={(event) => setDescription(event.target.value)} placeholder="A little context helps future you." className="mt-2 rounded-xl bg-background/60" /></label>{error && <p className="text-sm text-destructive">{error}</p>}<DialogFooter><Button type="button" variant="outline" className="rounded-xl" onClick={() => onOpenChange(false)}>Cancel</Button><Button type="submit" disabled={saving} className="rounded-xl bg-ink text-ink-foreground hover:bg-ink/90">{saving ? <LoaderCircle className="size-4 animate-spin" /> : editing ? "Save changes" : "Add habit"}</Button></DialogFooter></form></DialogContent></Dialog>;
}

function BrandMark() { return <Link to="/" className="inline-flex items-center gap-3"><span className="grid size-10 place-items-center rounded-xl bg-ink font-display text-lg font-bold text-ink-foreground shadow-lg shadow-ink/20">T</span><span><span className="block font-display text-lg font-bold leading-none tracking-tight">Tally</span><span className="mt-1 block text-[11px] font-medium uppercase tracking-[0.18em] text-muted-foreground">Habit tracker</span></span></Link>; }
function AmbientBackground() { return <div className="pointer-events-none fixed inset-0 overflow-hidden"><div className="absolute -right-24 -top-40 size-96 rounded-full bg-brand/18 blur-3xl" /><div className="absolute -left-24 top-1/3 size-80 rounded-full bg-accent/14 blur-3xl" /><div className="absolute bottom-0 right-1/4 size-72 rounded-full bg-sky/18 blur-3xl" /><div className="absolute -right-20 top-10 h-[420px] w-40 rotate-[24deg] border-l border-card/50 bg-gradient-to-b from-brand/8 to-accent/8 backdrop-blur-[2px]" /></div>; }