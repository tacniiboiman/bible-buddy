CREATE TABLE public.schedules (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  day_of_week SMALLINT NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6),
  activity TEXT NOT NULL,
  activity_time TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.schedules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own schedules"
  ON public.schedules FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own schedules"
  ON public.schedules FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own schedules"
  ON public.schedules FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own schedules"
  ON public.schedules FOR DELETE
  USING (auth.uid() = user_id);

CREATE INDEX idx_schedules_user_id ON public.schedules(user_id);
CREATE INDEX idx_schedules_day ON public.schedules(day_of_week);
