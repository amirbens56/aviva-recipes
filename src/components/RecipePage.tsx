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

export default function RecipePage({ recipe, side, showMode, isAdmin, onRefresh, pageNumber }: RecipePageProps) {
  const [editing, setEditing] = useState(false)
  const [editData, setEditData] = useState<Partial<Recipe>>(recipe)
  const [saving, setSaving] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

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

  // ===== עמוד ימין — תמונת מקור קבועה + תמונות נוספות צפות מתחתיה =====
  if (showMode === 'original') {
    // חישוב אזור "מתחת לתמונה" — תמונת המקור תופסת ~75% מהגובה
    const imageAreaHeight = 360
    const extraImages: FloatingImage[] = (recipe.extra_images || []).map((img: any) => ({
      ...img,
      // ודא שהתמונות מתחילות מתחת לתמונת המקור
      y: Math.max(img.y, imageAreaHeight),
    }))

    return (
      <div
        ref={containerRef}
        className="book-page relative flex flex-col overflow-hidden"
        style={{ minHeight: 520, padding: '20px 16px' }}
      >
        <div style={{ position: 'absolute', bottom: 10, right: 14, color: '#8b4513', fontSize: 11 }}>{pageNumber}</div>

        {/* כפתורי ניהול */}
        {isAdmin && !editing && (
          <div className="absolute top-2 left-2 flex gap-1 z-20">
            <button onClick={() => setEditing(true)} className="px-2 py-1 bg-amber-700 text-white rounded text-xs hover:bg-amber-600">✏️</button>
            <button onClick={() => window.print()} className="px-2 py-1 bg-blue-700 text-white rounded text-xs hover:bg-blue-600">🖨️</button>
            <button onClick={() => setShowDeleteConfirm(true)} className="px-2 py-1 bg-red-700 text-white rounded text-xs hover:bg-red-600">🗑️</button>
          </div>
        )}

        {editing ? (
          <EditForm
            editData={editData}
            setEditData={setEditData}
            onSave={handleSave}
            onCancel={() => setEditing(false)}
            saving={saving}
          />
        ) : (
          <>
            <h2 className="vintage-title text-base mb-1 text-center" style={{ color: '#5c3d2e' }}>{recipe.title}</h2>
            <div className="text-center text-xs mb-1" style={{ color: '#8b4513', fontStyle: 'italic' }}>כתב יד מקורי</div>
            <div style={{ width: 40, height: 1, background: '#b8860b', margin: '0 auto 8px' }} />

            {/* תמונת מקור — קבועה */}
            <div style={{ height: imageAreaHeight, flexShrink: 0 }} className="flex items-center justify-center overflow-hidden">
              {recipe.original_image_url ? (
                <img
                  src={recipe.original_image_url}
                  alt={recipe.title}
                  style={{ maxHeight: imageAreaHeight, maxWidth: '100%', objectFit: 'contain', borderRadius: 4 }}
                  crossOrigin="anonymous"
                  draggable={false}
                />
              ) : (
                <div className="opacity-20 text-center">
                  <div className="vintage-title text-amber-700 text-4xl">✦</div>
                  <div className="text-xs text-amber-600 mt-1">אין תמונה</div>
                </div>
              )}
            </div>

            {/* אזור תמונות נוספות מתחת — גמיש */}
            <div style={{ flex: 1, minHeight: 80, position: 'relative' }}>
              {isAdmin && (
                <ImageUploadButton
                  recipeId={recipe.id}
                  field="extra_images"
                  existingImages={recipe.extra_images || []}
                  defaultY={imageAreaHeight + 10}
                  onRefresh={onRefresh}
                  label="📷 הוסף תמונה מתחת"
                />
              )}
            </div>
          </>
        )}

        {/* תמונות צפות — כל הדף, מתחת לאזור המקור */}
        {!editing && (recipe.extra_images || []).length > 0 && (
          <FloatingImages
            images={recipe.extra_images || []}
            isAdmin={isAdmin}
            recipeId={recipe.id}
            field="extra_images"
            onUpdate={onRefresh}
            containerRef={containerRef}
          />
        )}

        {showDeleteConfirm && (
          <div className="absolute inset-0 bg-amber-50/95 flex flex-col items-center justify-center gap-3 z-30 rounded">
            <p className="text-amber-900 font-medium">למחוק את המתכון?</p>
            <div className="flex gap-3">
              <button onClick={handleDelete} className="px-4 py-2 bg-red-600 text-white rounded text-sm">מחק</button>
              <button onClick={() => setShowDeleteConfirm(false)} className="px-4 py-2 bg-gray-400 text-white rounded text-sm">ביטול</button>
            </div>
          </div>
        )}
      </div>
    )
  }

  // ===== עמוד שמאל — מתכון מודפס צף למעלה + תמונות צפות מתחתיו =====
  // גובה אזור המתכון המודפס (משוער)
  const printedAreaHeight = 280

  return (
    <div
      ref={containerRef}
      className="book-page relative overflow-hidden"
      style={{ minHeight: 520, padding: '20px 16px', fontSize: 13 }}
    >
      <div style={{ position: 'absolute', bottom: 10, left: 14, color: '#8b4513', fontSize: 11 }}>{pageNumber}</div>

      {/* מתכון מודפס — תמיד למעלה */}
      <div style={{ position: 'relative', zIndex: 5 }}>
        <div className="text-center mb-2">
          <h2 className="vintage-title text-lg" style={{ color: '#5c3d2e' }}>{recipe.title}</h2>
          <div style={{ color: '#8b4513', fontSize: 11, marginTop: 2 }}>{recipe.category}</div>
          <div style={{ width: 50, height: 1, background: '#b8860b', margin: '5px auto' }} />
        </div>

        {(recipe.prep_time || recipe.servings) && (
          <div className="flex justify-center gap-4 mb-2 text-xs" style={{ color: '#8b4513' }}>
            {recipe.prep_time && <span>⏱ {recipe.prep_time}</span>}
            {recipe.servings && <span>🍽 {recipe.servings} מנות</span>}
          </div>
        )}

        {recipe.ingredients && (
          <div className="mb-2">
            <h3 className="vintage-title text-xs mb-1" style={{ color: '#8b4513' }}>✦ מרכיבים</h3>
            <div className="recipe-text text-xs" style={{ paddingRight: 6 }}>{recipe.ingredients}</div>
          </div>
        )}

        <div style={{ width: '100%', height: 1, background: 'rgba(139,69,19,0.2)', margin: '5px 0' }} />

        {recipe.instructions && (
          <div className="mb-2">
            <h3 className="vintage-title text-xs mb-1" style={{ color: '#8b4513' }}>✦ הכנה</h3>
            <div className="recipe-text text-xs" style={{ paddingRight: 6 }}>{recipe.instructions}</div>
          </div>
        )}
      </div>

      {/* כפתור הוספת תמונה לאזור מתחת למתכון */}
      {isAdmin && (
        <div style={{ position: 'relative', zIndex: 5, marginTop: 8 }}>
          <ImageUploadButton
            recipeId={recipe.id}
            field="printed_images"
            existingImages={(recipe as any).printed_images || []}
            defaultY={printedAreaHeight + 10}
            onRefresh={onRefresh}
            label="📷 הוסף תמונה מתחת למתכון"
          />
        </div>
      )}

      {/* תמונות צפות — מתחת למתכון */}
      {((recipe as any).printed_images || []).length > 0 && (
        <FloatingImages
          images={(recipe as any).printed_images || []}
          isAdmin={isAdmin}
          recipeId={recipe.id}
          field="printed_images"
          onUpdate={onRefresh}
          containerRef={containerRef}
        />
      )}
    </div>
  )
}

// ===== כפתור העלאת תמונה =====
function ImageUploadButton({ recipeId, field, existingImages, defaultY, onRefresh, label }: {
  recipeId: string
  field: 'extra_images' | 'printed_images'
  existingImages: any[]
  defaultY: number
  onRefresh: () => void
  label: string
}) {
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
      const newImg: FloatingImage = {
        url: data.publicUrl,
        x: 20,
        y: defaultY,
        width: 130,
        height: 130,
        rotation: 0,
      }
      await supabase.from('recipes').update({ [field]: [...existingImages, newImg] }).eq('id', recipeId)
      onRefresh()
    }
    setUploading(false)
    if (inputRef.current) inputRef.current.value = ''
  }

  return (
    <>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        onChange={handleUpload}
        className="hidden"
        id={`upload-${field}-${recipeId}`}
      />
      <label
        htmlFor={`upload-${field}-${recipeId}`}
        className="cursor-pointer text-xs text-amber-700 hover:text-amber-900 flex items-center gap-1"
      >
        {uploading ? '⏳ מעלה...' : label}
      </label>
    </>
  )
}

// ===== טופס עריכה =====
function EditForm({ editData, setEditData, onSave, onCancel, saving }: any) {
  return (
    <div className="flex flex-col gap-2 overflow-y-auto flex-1">
      <input className="border border-amber-300 rounded px-2 py-1 text-sm bg-amber-50" value={editData.title || ''} onChange={e => setEditData({ ...editData, title: e.target.value })} placeholder="שם המתכון" />
      <select className="border border-amber-300 rounded px-2 py-1 text-sm bg-amber-50" value={editData.category || ''} onChange={e => setEditData({ ...editData, category: e.target.value })}>
        {['עוגות ומאפים','מרקים','סלטים','בשר ועוף','דגים','ירקות','קטניות','פסטה ואורז','קינוחים','שתייה','ממרחים','אחר'].map(c => <option key={c} value={c}>{c}</option>)}
      </select>
      <div className="flex gap-2">
        <input className="border border-amber-300 rounded px-2 py-1 text-sm bg-amber-50 flex-1" value={editData.prep_time || ''} onChange={e => setEditData({...editData, prep_time: e.target.value})} placeholder="זמן הכנה" />
        <input className="border border-amber-300 rounded px-2 py-1 text-sm bg-amber-50 flex-1" value={editData.servings || ''} onChange={e => setEditData({...editData, servings: e.target.value})} placeholder="מנות" />
      </div>
      <textarea className="border border-amber-300 rounded px-2 py-1 text-sm bg-amber-50" rows={3} value={editData.ingredients || ''} onChange={e => setEditData({ ...editData, ingredients: e.target.value })} placeholder="מרכיבים" />
      <textarea className="border border-amber-300 rounded px-2 py-1 text-sm bg-amber-50" rows={4} value={editData.instructions || ''} onChange={e => setEditData({ ...editData, instructions: e.target.value })} placeholder="הוראות הכנה" />
      <div className="flex gap-2 mt-1">
        <button onClick={onSave} disabled={saving} className="flex-1 bg-amber-700 text-white rounded py-1 text-sm hover:bg-amber-600 disabled:opacity-50">
          {saving ? 'שומר...' : 'שמור'}
        </button>
        <button onClick={onCancel} className="flex-1 bg-gray-400 text-white rounded py-1 text-sm">ביטול</button>
      </div>
    </div>
  )
}
