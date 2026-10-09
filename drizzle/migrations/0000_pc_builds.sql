CREATE TABLE public.pc_builds (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), user_id uuid NOT NULL, name text NOT NULL DEFAULT 'PC Build', total numeric NOT NULL DEFAULT 0, build jsonb NOT NULL, created_at timestamptz NOT NULL DEFAULT now());
GRANT SELECT, INSERT, UPDATE, DELETE ON public.pc_builds TO authenticated;
GRANT ALL ON public.pc_builds TO service_role;
ALTER TABLE public.pc_builds ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own builds select" ON public.pc_builds FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "own builds insert" ON public.pc_builds FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own builds update" ON public.pc_builds FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "own builds delete" ON public.pc_builds FOR DELETE TO authenticated USING (auth.uid() = user_id);