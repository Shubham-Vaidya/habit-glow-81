CREATE TABLE public.habits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  name TEXT NOT NULL CHECK (char_length(trim(name)) BETWEEN 1 AND 120),
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.habits TO authenticated;
GRANT ALL ON public.habits TO service_role;

ALTER TABLE public.habits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own habits"
  ON public.habits
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE TABLE public.habit_completions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  habit_id UUID NOT NULL REFERENCES public.habits(id) ON DELETE CASCADE,
  completion_date DATE NOT NULL,
  completed BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (habit_id, completion_date)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.habit_completions TO authenticated;
GRANT ALL ON public.habit_completions TO service_role;

ALTER TABLE public.habit_completions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage completions for their own habits"
  ON public.habit_completions
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.habits
      WHERE public.habits.id = habit_completions.habit_id
        AND public.habits.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.habits
      WHERE public.habits.id = habit_completions.habit_id
        AND public.habits.user_id = auth.uid()
    )
  );

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER update_habits_updated_at
  BEFORE UPDATE ON public.habits
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_habit_completions_updated_at
  BEFORE UPDATE ON public.habit_completions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX habits_user_id_created_at_idx ON public.habits (user_id, created_at);
CREATE INDEX habit_completions_habit_id_date_idx ON public.habit_completions (habit_id, completion_date);