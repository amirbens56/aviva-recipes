'use client'

import { useState, useRef } from 'react'
import { Recipe, supabase } from '@/lib/supabase'
import FloatingImages, { FloatingImage } from './FloatingImages'

interface RecipePageProps {
  recipe: Recipe
  side: 'left' | 'right'
  showMode?: 'original' | 'printed'
  isAdmin: boolean
  onRefresh: () => void
  pageNumber: number
}

const CATEGORIES = ['עוגות ומאפים','מרקים','סלטים','בשר ועוף','דגים','ירקות','קטניות','פסטה ואורז','קינוחים','שתייה','ממרחים','אחר']

export default function RecipePage({ recipe, side, showMode, isAdmin, onRefresh, pageNumber }: RecipePageProps) {
  const [editing, setEditing] = useState(false)
  const [editData, setEditData] = useState<Partial<Recipe>>(recipe)
  const [saving, setSaving] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  async function handleSave() {
    setSaving(true)
    await supabase.from('recipes').update(editData).eq('id', recipe.id)
    setSaving(false)
    setEditing(false)
    onRefresh()
  }

  async function handleDelete() {
    await supabase.from('recipes').delete().eq('id', recipe.id)
    setShowDeleteConfirm(false)
    onRefresh()
  }

  // גובה אזור תמונת מקור / מתכון מודפס — תמונות נוספות מתחת לקו זה
  const ORIGINAL_MIN_Y = 370
  const PRINTED_MIN_Y = 260

  // ===== עמוד ימין — תמונת מקור =====
  if (showMode === 'original') {
    return (
      <div className="book-page relative overflow-hidden" style={{ minHeight: 520, padding: '16px 14px' }}>
        <div style={{ position: 'absolute', bottom: 8, right: 12, color: '#8b4513', fontSize: 11, zIndex: 1 }}>{pageNumber}</div>

        {isAdmin && !editing && (
          <div style={{ position: 'absolute', top: 6, left: 6, display: 'flex', gap: 4, zIndex: 25 }}>
            <button onClick={() => setEditing(true)} style={{ background: '#92400e', color: 'white', border: 'none', borderRadius: 4, padding: '3px 8px', fontSize: 11, cursor: 'pointer' }}>✏️ ערוך</button>
            <button onClick={() => window.print()} style={{ background: '#1d4ed8', color: 'white', border: 'none', borderRadius: 4, padding: '3px 8px', fontSize: 11, cursor: 'pointer' }}>🖨️</button>
            <button onClick={() => setShowDeleteConfirm(true)} style={{ background: '#b91c1c', color: 'white', border: 'none', borderRadius: 4, padding: '3px 8px', fontSize: 11, cursor: 'pointer' }}>🗑️</button>
          </div>
        )}

        {editing ? (
          <EditForm editData={editData} setEditData={setEditData} onSave={handleSave} onCancel={() => setEditing(false)} saving={saving} />
        ) : (
          <>
            {/* כותרת */}
            <div style={{ textAlign: 'center', marginBottom: 8, position: 'relative', zIndex: 2 }}>
              <h2 className="vintage-title" style={{ color: '#5c3d2e', fontSize: 15, margin: 0 }}>{recipe.title}</h2>
              <div style={{ color: '#8b4513', fontSize: 10, fontStyle: 'italic', marginTop: 2 }}>כתב יד מקורי</div>
              <div style={{ width: 40, height: 1, background: '#b8860b', margin: '5px auto 0' }} />
            </div>

            {/* תמונת מקור — גובה קבוע */}
            <div style={{ height: ORIGINAL_MIN_Y - 50, position: 'relative', zIndex: 2 }}>
              {recipe.original_image_url ? (
                <img
                  src={recipe.original_image_url}
                  alt={recipe.title}
                  style={{ width: '100%', height: '100%', objectFit: 'contain', borderRadius: 4 }}
                  crossOrigin="anonymous"
                  draggable={false}
                />
              ) : (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', opacity: 0.2 }}>
                  <span className="vintage-title" style={{ color: '#8b4513', fontSize: 36 }}>✦</span>
                </div>
              )}
            </div>

            {/* כפתור הוספת תמונה */}
            {isAdmin && (
              <div style={{ position: 'relative', zIndex: 2, marginTop: 6, textAlign: 'center' }}>
                <ImageUploadBtn
                  recipeId={recipe.id}
                  field="extra_images"
                  existingImages={recipe.extra_images || []}
                  defaultY={ORIGINAL_MIN_Y}
                  onRefresh={onRefresh}
                  label="📷 הוסף תמונה"
                />
              </div>
            )}

            {/* תמונות צפות — מתחת לתמונת מקור */}
            <FloatingImages
              images={recipe.extra_images || []}
              isAdmin={isAdmin}
              recipeId={recipe.id}
              field="extra_images"
              onUpdate={onRefresh}
              minY={ORIGINAL_MIN_Y}
            />
          </>
        )}

        {showDeleteConfirm && (
          <div style={{ position: 'absolute', inset: 0, background: 'rgba(245,240,232,0.96)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12, zIndex: 40, borderRadius: 4 }}>
            <p style={{ color: '#92400e', fontWeight: 600 }}>למחוק את המתכון?</p>
            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={handleDelete} style={{ background: '#b91c1c', color: 'white', border: 'none', borderRadius: 4, padding: '6px 16px', cursor: 'pointer' }}>מחק</button>
              <button onClick={() => setShowDeleteConfirm(false)} style={{ background: '#9ca3af', color: 'white', border: 'none', borderRadius: 4, padding: '6px 16px', cursor: 'pointer' }}>ביטול</button>
            </div>
          </div>
        )}
      </div>
    )
  }

  // ===== עמוד שמאל — מתכון מודפס =====
  return (
    <div className="book-page relative overflow-hidden" style={{ minHeight: 520, padding: '16px 14px', fontSize: 13 }}>
      <div style={{ position: 'absolute', bottom: 8, left: 12, color: '#8b4513', fontSize: 11, zIndex: 1 }}>{pageNumber}</div>

      {/* מתכון מודפס — תמיד למעלה */}
      <div style={{ position: 'relative', zIndex: 2 }}>
        <div style={{ textAlign: 'center', marginBottom: 8 }}>
          <h2 className="vintage-title" style={{ color: '#5c3d2e', fontSize: 17, margin: 0 }}>{recipe.title}</h2>
          <div style={{ color: '#8b4513', fontSize: 10, marginTop: 2 }}>{recipe.category}</div>
          <div style={{ width: 50, height: 1, background: '#b8860b', margin: '5px auto' }} />
        </div>

        {(recipe.prep_time || recipe.servings) && (
          <div style={{ display: 'flex', justifyContent: 'center', gap: 16, marginBottom: 8, fontSize: 11, color: '#8b4513' }}>
            {recipe.prep_time && <span>⏱ {recipe.prep_time}</span>}
            {recipe.servings && <span>🍽 {recipe.servings} מנות</span>}
          </div>
        )}

        {recipe.ingredients && (
          <div style={{ marginBottom: 6 }}>
            <h3 className="vintage-title" style={{ color: '#8b4513', fontSize: 11, marginBottom: 3 }}>✦ מרכיבים</h3>
            <div className="recipe-text" style={{ fontSize: 11, paddingRight: 6 }}>{recipe.ingredients}</div>
          </div>
        )}

        <div style={{ width: '100%', height: 1, background: 'rgba(139,69,19,0.2)', margin: '5px 0' }} />

        {recipe.instructions && (
          <div style={{ marginBottom: 6 }}>
            <h3 className="vintage-title" style={{ color: '#8b4513', fontSize: 11, marginBottom: 3 }}>✦ הכנה</h3>
            <div className="recipe-text" style={{ fontSize: 11, paddingRight: 6 }}>{recipe.instructions}</div>
          </div>
        )}

        {/* כפתור הוספת תמונה */}
        {isAdmin && (
          <div style={{ marginTop: 6, textAlign: 'center' }}>
            <ImageUploadBtn
              recipeId={recipe.id}
              field="printed_images"
              existingImages={(recipe as any).printed_images || []}
              defaultY={PRINTED_MIN_Y}
              onRefresh={onRefresh}
              label="📷 הוסף תמונה מתחת"
            />
          </div>
        )}
      </div>

      {/* תמונות צפות — מתחת למתכון */}
      <FloatingImages
        images={(recipe as any).printed_images || []}
        isAdmin={isAdmin}
        recipeId={recipe.id}
        field="printed_images"
        onUpdate={onRefresh}
        minY={PRINTED_MIN_Y}
      />
    </div>
  )
}

// ===== כפתור העלאה =====
function ImageUploadBtn({ recipeId, field, existingImages, defaultY, onRefresh, label }: any) {
  const [uploading, setUploading] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    const path = `${field}/${recipeId}/${Date.now()}.${file.name.split('.').pop()}`
    const { error } = await supabase.storage.from('recipe-images').upload(path, file)
    if (!error) {
      const { data } = supabase.storage.from('recipe-images').getPublicUrl(path)
      const newImg: FloatingImage = { url: data.publicUrl, x: 20, y: defaultY + 10, width: 130, height: 130, rotation: 0 }
      await supabase.from('recipes').update({ [field]: [...existingImages, newImg] }).eq('id', recipeId)
      onRefresh()
    }
    setUploading(false)
    if (inputRef.current) inputRef.current.value = ''
  }

  return (
    <>
      <input ref={inputRef} type="file" accept="image/*" onChange={handleUpload} className="hidden" id={`upload-${field}-${recipeId}`} />
      <label htmlFor={`upload-${field}-${recipeId}`} style={{ cursor: 'pointer', fontSize: 11, color: '#92400e' }}>
        {uploading ? '⏳ מעלה...' : label}
      </label>
    </>
  )
}

// ===== טופס עריכה =====
function EditForm({ editData, setEditData, onSave, onCancel, saving }: any) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8, overflowY: 'auto', flex: 1 }}>
      <input className="border border-amber-300 rounded px-2 py-1 text-sm bg-amber-50" value={editData.title || ''} onChange={e => setEditData({ ...editData, title: e.target.value })} placeholder="שם המתכון" />
      <select className="border border-amber-300 rounded px-2 py-1 text-sm bg-amber-50" value={editData.category || ''} onChange={e => setEditData({ ...editData, category: e.target.value })}>
        {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
      </select>
      <div style={{ display: 'flex', gap: 6 }}>
        <input className="border border-amber-300 rounded px-2 py-1 text-sm bg-amber-50" style={{ flex: 1 }} value={editData.prep_time || ''} onChange={e => setEditData({...editData, prep_time: e.target.value})} placeholder="זמן הכנה" />
        <input className="border border-amber-300 rounded px-2 py-1 text-sm bg-amber-50" style={{ flex: 1 }} value={editData.servings || ''} onChange={e => setEditData({...editData, servings: e.target.value})} placeholder="מנות" />
      </div>
      <textarea className="border border-amber-300 rounded px-2 py-1 text-sm bg-amber-50" rows={3} value={editData.ingredients || ''} onChange={e => setEditData({ ...editData, ingredients: e.target.value })} placeholder="מרכיבים" />
      <textarea className="border border-amber-300 rounded px-2 py-1 text-sm bg-amber-50" rows={4} value={editData.instructions || ''} onChange={e => setEditData({ ...editData, instructions: e.target.value })} placeholder="הוראות הכנה" />
      <div style={{ display: 'flex', gap: 6 }}>
        <button onClick={onSave} disabled={saving} className="flex-1 bg-amber-700 text-white rounded py-1 text-sm hover:bg-amber-600 disabled:opacity-50">{saving ? 'שומר...' : 'שמור'}</button>
        <button onClick={onCancel} className="flex-1 bg-gray-400 text-white rounded py-1 text-sm">ביטול</button>
      </div>
    </div>
  )
}
