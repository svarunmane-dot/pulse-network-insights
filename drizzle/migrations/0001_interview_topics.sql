ALTER TABLE public.practice_questions ADD COLUMN IF NOT EXISTS topic text, ADD COLUMN IF NOT EXISTS topic_order smallint;
CREATE INDEX IF NOT EXISTS practice_questions_cat_topic_idx ON public.practice_questions (category, topic_order);
CREATE OR REPLACE FUNCTION public.get_interview_exam(_per_topic integer DEFAULT 5)
RETURNS SETOF public.practice_questions
LANGUAGE sql
SET search_path TO 'public'
AS $$
  SELECT id, category, question_text, options, correct_option, explanation, created_at, topic, topic_order
  FROM (
    SELECT q.*, row_number() OVER (PARTITION BY topic_order ORDER BY random()) AS rn
    FROM public.practice_questions q
    WHERE category = 'Interview' AND topic_order IS NOT NULL
  ) s
  WHERE rn <= LEAST(GREATEST(_per_topic,1),20)
  ORDER BY topic_order, random();
$$;
GRANT EXECUTE ON FUNCTION public.get_interview_exam(integer) TO anon, authenticated;