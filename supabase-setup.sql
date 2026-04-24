-- הרץ את זה ב-Supabase SQL Editor

-- יצירת טבלת מתכונים
CREATE TABLE IF NOT EXISTS recipes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  category TEXT DEFAULT 'אחר',
  ingredients TEXT,
  instructions TEXT,
  prep_time TEXT,
  servings TEXT,
  original_image_url TEXT,
  extra_images JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- הרשאות קריאה לכולם
ALTER TABLE recipes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "קריאה לכולם" ON recipes
  FOR SELECT USING (true);

CREATE POLICY "כתיבה מכל מקום" ON recipes
  FOR ALL USING (true);
