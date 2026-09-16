import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, Check, Edit3, LoaderCircle, Trash2 } from "lucide-react";
import { useEffect, useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { supabase } from "@/integrations/supabase/client";
import {
  formatToday,
  getHabitMetrics,
  getHistoryWeeks,
  getLocalDateKey,
  monthLabelsForWeeks,
  type Completion,
  type Habit,
} from "@/lib/habit-utils";

export const Route = createFileRoute("/habits/$habitId")({
  head: () => ({
    meta: [
      { title: "Habit history — Tally" },
      { name: "description", content: "Review your habit streaks and daily consistency history." },
      { property: "og:title", content: "Habit history — Tally" },
      { property: "og:description", content: "Review your habit streaks and daily consistency history." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: HabitDetailPage,
});

function HabitDetailPage() {
  const { habitId } = Route.useParams();
  const navigate = useNavigate();
  const [habit, setHabit] = useState<Habit | null>(null);
  const [completions, setCompletions] = useState<Completion[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");

  async function load() {
    setLoading(true);
    const { data: userData } = await supabase.auth.getUser();
    const user = userData.user;
    if (!user) {
      await navigate({ to: "/" });
      return;
    }
    const { data: habitData, error: habitError } = await supabase.from("habits").select("*").eq("id", habitId).eq("user_id", user.id).maybeSingle();
    if (habitError || !habitData) {
      setError(habitError?.message ?? "This habit could not be found.");
      setLoading(false);
      return;
    }
    const nextHabit = habitData as Habit;
    const { data: completionData, error: completionError } = await supabase.from("habit_completions").select("*").eq("habit_id", habitId).order("completion_date", { ascending: true });
    setHabit(nextHabit);
    setName(nextHabit.name);
    setDescription(nextHabit.description ?? "");
    setCompletions((completionData ?? []) as Completion[]);
    setError(completionError?.message ?? null);
    setLoading(false);
  }

  useEffect(() => { void load(); }, [habitId]);

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!habit || !name.trim()) return;
    setSaving(true);
    const { error: saveError } = await supabase.from("habits").update({ name: name.trim(), description: description.trim() || null }).eq("id", habit.id);
    setSaving(false);
    if (saveError) {
      setError(saveError.message);
      return;
    }
    setEditing(false);
    await load();
  }

  async function removeHabit() {
    if (!habit) return;
    setSaving(true);
    const { error: deleteError } = await supabase.from("habits").delete().eq("id", habit.id);
    if (deleteError) {
      setError(deleteError.message);
      setSaving(false);
      return;
    }
    await navigate({ to: "/" });
  }

  if (loading) return <DetailShell><LoaderCircle className="size-6 animate-spin text-brand" /></DetailShell>;
  if (!habit) return <DetailShell><div className="max-w-md text-center"><h1 className="font-display text-2xl font-bold">Habit unavailable</h1><p className="mt-2 text-sm text-muted-foreground">{error}</p><Button asChild className="mt-6 rounded-full bg-ink text-ink-foreground hover:bg-ink/90"><Link to="/">Back to today</Link></Button></div></DetailShell>;

  const metrics = getHabitMetrics(habit, completions);
  const weeks = getHistoryWeeks(52);
  const monthLabels = monthLabelsForWeeks(weeks);
  const completed = new Set(completions.filter((completion) => completion.completed).map((completion) => completion.completion_date));
  const todayDone = completed.has(getLocalDateKey());

  return <DetailShell><div className="w-full max-w-5xl"><div className="flex flex-wrap items-center justify-between gap-3"><Link to="/" className="inline-flex items-center gap-2 text-sm font-semibold text-muted-foreground transition hover:text-brand"><ArrowLeft className="size-4" /> Today</Link><div className="flex items-center gap-2"><Button type="button" variant="outline" className="rounded-full bg-card/60" onClick={() => setEditing((value) => !value)}><Edit3 className="size-4" /> Edit</Button><AlertDialog><AlertDialogTrigger asChild><Button type="button" variant="outline" className="rounded-full bg-card/60 text-destructive hover:bg-destructive/10 hover:text-destructive"><Trash2 className="size-4" /> Delete</Button></AlertDialogTrigger><AlertDialogContent className="rounded-3xl"><AlertDialogHeader><AlertDialogTitle>Delete “{habit.name}”?</AlertDialogTitle><AlertDialogDescription>This removes the habit and all of its saved completion history. This can’t be undone.</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel disabled={saving}>Cancel</AlertDialogCancel><AlertDialogAction disabled={saving} className="bg-destructive text-destructive-foreground hover:bg-destructive/90" onClick={() => void removeHabit()}>Delete habit</AlertDialogAction></AlertDialogFooter></AlertDialogContent></AlertDialog></div></div>
    {editing ? <form className="glass-panel mt-6 space-y-4 p-5 sm:p-6" onSubmit={save}><label className="block text-sm font-medium">Habit name<Input value={name} onChange={(event) => setName(event.target.value)} className="mt-2 h-11 rounded-xl bg-background/60" /></label><label className="block text-sm font-medium">Description <span className="font-normal text-muted-foreground">(optional)</span><Textarea value={description} onChange={(event) => setDescription(event.target.value)} className="mt-2 rounded-xl bg-background/60" /></label>{error && <p className="text-sm text-destructive">{error}</p>}<div className="flex justify-end gap-2"><Button type="button" variant="outline" className="rounded-xl" onClick={() => setEditing(false)}>Cancel</Button><Button type="submit" disabled={saving} className="rounded-xl bg-ink text-ink-foreground hover:bg-ink/90">{saving ? <LoaderCircle className="size-4 animate-spin" /> : "Save changes"}</Button></div></form> : <div className="mt-8"><p className="text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">Habit history</p><div className="mt-2 flex flex-wrap items-end justify-between gap-4"><div><h1 className="font-display text-4xl font-bold tracking-tight sm:text-5xl">{habit.name}</h1>{habit.description && <p className="mt-2 text-sm text-muted-foreground">{habit.description}</p>}</div><span className={`rounded-full px-3 py-2 text-sm font-semibold ${todayDone ? "bg-success/15 text-success-strong" : "bg-secondary text-muted-foreground"}`}>{todayDone ? "Done today" : "Not done today"}</span></div></div>}
    {error && !editing && <p className="mt-5 rounded-xl border border-destructive/25 bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p>}
    <div className="mt-7 grid grid-cols-2 gap-3 sm:grid-cols-4"><Stat label="Current streak" value={metrics.currentStreak} /><Stat label="Longest streak" value={metrics.longestStreak} /><Stat label="Completed days" value={metrics.totalCompleted} /><Stat label="Completion" value={`${metrics.completionPercentage}%`} /></div>
    <section className="glass-panel mt-5 overflow-hidden p-5 sm:p-6"><div className="flex flex-wrap items-center justify-between gap-2"><div><h2 className="font-display text-lg font-bold">Last 12 months</h2><p className="mt-1 text-xs text-muted-foreground">Each square is one day · green means complete</p></div><span className="inline-flex items-center gap-2 text-xs text-muted-foreground"><span className="size-3 rounded-[3px] bg-heatmap-empty" /> not done <span className="ml-2 size-3 rounded-[3px] bg-brand" /> done</span></div><div className="mt-5 overflow-x-auto pb-2"><div className="relative min-w-[690px] pt-5"><div className="absolute left-0 right-0 top-0 h-4 text-[10px] text-muted-foreground">{monthLabels.map((month) => <span key={`${month.label}-${month.index}`} className="absolute" style={{ left: `${(month.index / weeks.length) * 100}%` }}>{month.label}</span>)}</div><div className="flex gap-1"><div className="grid grid-rows-7 gap-1 pr-2 pt-0 text-[9px] leading-3 text-muted-foreground"><span /> <span>Mon</span><span /> <span>Wed</span><span /> <span>Fri</span><span /></div><div className="flex gap-1">{weeks.map((week) => <div key={week[0]} className="grid grid-rows-7 gap-1">{week.map((key) => <span key={key} title={`${key}${completed.has(key) ? " · completed" : ""}`} className={`size-3 rounded-[3px] sm:size-[13px] ${completed.has(key) ? "bg-brand" : "bg-heatmap-empty"}`} />)}</div>)}</div></div></div></div></section>
    <p className="mt-6 text-center text-xs text-muted-foreground">Updated for {formatToday()} · your local date is used for each check-in</p>
  </div></DetailShell>;
}

function Stat({ label, value }: { label: string; value: string | number }) { return <div className="glass-panel p-4"><p className="font-display text-2xl font-bold">{value}</p><p className="mt-1 text-xs text-muted-foreground">{label}</p></div>; }
function DetailShell({ children }: { children: React.ReactNode }) { return <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-background px-4 py-8 text-foreground sm:px-6"><div className="pointer-events-none fixed inset-0"><div className="absolute -right-24 -top-40 size-96 rounded-full bg-brand/18 blur-3xl" /><div className="absolute -left-24 top-1/3 size-80 rounded-full bg-accent/14 blur-3xl" /></div><div className="relative flex w-full justify-center">{children}</div></main>; }