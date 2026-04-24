import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export type Recipe = {
  id: string
  title: string
  category: string
  ingredients: string
  instructions: string
  prep_time: string
  servings: string
  original_image_url: string
  extra_images: ExtraImage[]
  created_at: string
}

export type ExtraImage = {
  url: string
  x: number
  y: number
  width: number
  height: number
  rotation: number
}
