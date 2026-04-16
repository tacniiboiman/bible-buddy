CREATE TABLE public.verses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  reference TEXT NOT NULL,
  text TEXT NOT NULL,
  tags TEXT[] NOT NULL DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.verses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own verses"
  ON public.verses FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own verses"
  ON public.verses FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own verses"
  ON public.verses FOR DELETE
  USING (auth.uid() = user_id);

CREATE INDEX idx_verses_user_id ON public.verses(user_id);
CREATE INDEX idx_verses_tags ON public.verses USING GIN(tags);