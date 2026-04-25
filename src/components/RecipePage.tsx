'use client'

import { useState, useRef } from 'react'
import { Recipe, supabase } from '@/lib/supabase'
import ExtraImagesLayer from './ExtraImagesLayer'

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

  // ===== עמוד ימין — תמונת מקור + תמונות נוספות צפות =====
  if (showMode === 'original') {
    return (
      <div className="book-page relative flex flex-col" style={{ minHeight: 520, padding: '20px 16px' }}>
        <div style={{ position: 'absolute', bottom: 10, right: 14, color: '#8b4513', fontSize: 11 }}>{pageNumber}</div>

        {/* כפתורי ניהול */}
        {isAdmin && !editing && (
          <div className="absolute top-2 left-2 flex gap-1 z-20">
            <button onClick={() => setEditing(true)} className="px-2 py-1 bg-amber-700 text-white rounded text-xs hover:bg-amber-600">✏️ ערוך</button>
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
            recipeId={recipe.id}
            existingImages={recipe.extra_images || []}
            onRefresh={onRefresh}
          />
        ) : (
          <>
            <h2 className="vintage-title text-base mb-1 text-center" style={{ color: '#5c3d2e' }}>{recipe.title}</h2>
            <div className="text-center text-xs mb-2" style={{ color: '#8b4513', fontStyle: 'italic' }}>כתב יד מקורי</div>
            <div style={{ width: 40, height: 1, background: '#b8860b', margin: '0 auto 10px' }} />

            {/* תמונת מקור */}
            <div className="flex-1 flex items-center justify-center overflow-hidden">
              {recipe.original_image_url ? (
                <img
                  src={recipe.original_image_url}
                  alt={recipe.title}
                  className="w-full object-contain rounded"
                  style={{ maxHeight: 360 }}
                  crossOrigin="anonymous"
                />
              ) : (
                <div className="opacity-20 text-center">
                  <div className="vintage-title text-amber-700 text-4xl">✦</div>
                  <div className="text-xs text-amber-600 mt-2">אין תמונה</div>
                </div>
              )}
            </div>

            {/* תמונות נוספות צפות — גרירה + שינוי גודל */}
            {recipe.extra_images && recipe.extra_images.length > 0 && (
              <ExtraImagesLayer
                images={recipe.extra_images}
                isAdmin={isAdmin}
                recipeId={recipe.id}
                onUpdate={onRefresh}
              />
            )}

            {/* כפתור הוספת תמונה לעמוד מקור */}
            {isAdmin && (
              <OriginalImageUpload
                recipeId={recipe.id}
                existingImages={recipe.extra_images || []}
                onRefresh={onRefresh}
              />
            )}
          </>
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

  // ===== עמוד שמאל — מתכון מודפס + תמונות סטטיות מתחת =====
  return (
    <div className="book-page relative flex flex-col" style={{ minHeight: 520, padding: '20px 16px', fontSize: 13 }}>
      <div style={{ position: 'absolute', bottom: 10, left: 14, color: '#8b4513', fontSize: 11 }}>{pageNumber}</div>

      <div className="flex-1 overflow-y-auto">
        {/* כותרת */}
        <div className="text-center mb-3">
          <h2 className="vintage-title text-lg" style={{ color: '#5c3d2e' }}>{recipe.title}</h2>
          <div style={{ color: '#8b4513', fontSize: 11, marginTop: 2 }}>{recipe.category}</div>
          <div style={{ width: 50, height: 1, background: '#b8860b', margin: '5px auto' }} />
        </div>

        {/* מטא */}
        {(recipe.prep_time || recipe.servings) && (
          <div className="flex justify-center gap-4 mb-3 text-xs" style={{ color: '#8b4513' }}>
            {recipe.prep_time && <span>⏱ {recipe.prep_time}</span>}
            {recipe.servings && <span>🍽 {recipe.servings} מנות</span>}
          </div>
        )}

        {/* מרכיבים */}
        {recipe.ingredients && (
          <div className="mb-2">
            <h3 className="vintage-title text-xs mb-1" style={{ color: '#8b4513' }}>✦ מרכיבים</h3>
            <div className="recipe-text text-xs" style={{ paddingRight: 6 }}>{recipe.ingredients}</div>
          </div>
        )}

        <div style={{ width: '100%', height: 1, background: 'rgba(139,69,19,0.2)', margin: '6px 0' }} />

        {/* הוראות */}
        {recipe.instructions && (
          <div className="mb-2">
            <h3 className="vintage-title text-xs mb-1" style={{ color: '#8b4513' }}>✦ הכנה</h3>
            <div className="recipe-text text-xs" style={{ paddingRight: 6 }}>{recipe.instructions}</div>
          </div>
        )}

        {/* תמונות מתחת למתכון — סטטיות, עם שינוי גודל */}
        <PrintedImages
          recipeId={recipe.id}
          images={(recipe as any).printed_images || []}
          isAdmin={isAdmin}
          onRefresh={onRefresh}
        />
      </div>
    </div>
  )
}

// ===== תמונות נוספות לעמוד מקור (צפות) =====
function OriginalImageUpload({ recipeId, existingImages, onRefresh }: any) {
  const [uploading, setUploading] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    const path = `extra/${recipeId}/${Date.now()}.${file.name.split('.').pop()}`
    const { error } = await supabase.storage.from('recipe-images').upload(path, file)
    if (!error) {
      const { data } = supabase.storage.from('recipe-images').getPublicUrl(path)
      const newImg = { url: data.publicUrl, x: 20, y: 20, width: 140, height: 140, rotation: 0 }
      await supabase.from('recipes').update({ extra_images: [...existingImages, newImg] }).eq('id', recipeId)
      onRefresh()
    }
    setUploading(false)
    if (inputRef.current) inputRef.current.value = ''
  }

  return (
    <div className="mt-2 text-center">
      <input ref={inputRef} type="file" accept="image/*" onChange={handleUpload} className="hidden" id={`orig-extra-${recipeId}`} />
      <label htmlFor={`orig-extra-${recipeId}`} className="cursor-pointer text-xs text-amber-700 hover:text-amber-900">
        {uploading ? '⏳ מעלה...' : '📷 הוסף תמונה לעמוד'}
      </label>
    </div>
  )
}

// ===== תמונות לעמוד מודפס (סטטיות מתחת למתכון, עם שינוי גודל) =====
function PrintedImages({ recipeId, images, isAdmin, onRefresh }: any) {
  const [localImages, setLocalImages] = useState<any[]>(images)
  const [uploading, setUploading] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  async function saveImages(imgs: any[]) {
    await supabase.from('recipes').update({ printed_images: imgs }).eq('id', recipeId)
    onRefresh()
  }

  function startResize(e: React.MouseEvent, idx: number) {
    e.preventDefault()
    e.stopPropagation()
    const startX = e.clientX
    const origW = localImages[idx].width || 120
    const origH = localImages[idx].height || 120

    function onMove(ev: MouseEvent) {
      const delta = ev.clientX - startX
      setLocalImages(prev => {
        const updated = [...prev]
        updated[idx] = { ...updated[idx], width: Math.max(60, origW + delta), height: Math.max(60, origH + delta) }
        return updated
      })
    }

    function onUp() {
      document.removeEventListener('mousemove', onMove)
      document.removeEventListener('mouseup', onUp)
      setLocalImages(prev => { saveImages(prev); return prev })
    }

    document.addEventListener('mousemove', onMove)
    document.addEventListener('mouseup', onUp)
  }

  async function removeImage(idx: number) {
    const updated = localImages.filter((_, i) => i !== idx)
    setLocalImages(updated)
    await saveImages(updated)
  }

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    const path = `printed/${recipeId}/${Date.now()}.${file.name.split('.').pop()}`
    const { error } = await supabase.storage.from('recipe-images').upload(path, file)
    if (!error) {
      const { data } = supabase.storage.from('recipe-images').getPublicUrl(path)
      const newImg = { url: data.publicUrl, width: 120, height: 120 }
      const updated = [...localImages, newImg]
      setLocalImages(updated)
      await saveImages(updated)
    }
    setUploading(false)
    if (inputRef.current) inputRef.current.value = ''
  }

  return (
    <div className="mt-3">
      {localImages.length > 0 && (
        <>
          <div style={{ width: '100%', height: 1, background: 'rgba(139,69,19,0.15)', marginBottom: 8 }} />
          <div className="flex flex-wrap gap-2 justify-center">
            {localImages.map((img, idx) => (
              <div key={idx} className="relative inline-block" style={{ width: img.width || 120, height: img.height || 120 }}>
                <img
                  src={img.url}
                  alt=""
                  className="rounded object-cover w-full h-full"
                  crossOrigin="anonymous"
                  draggable={false}
                />
                {isAdmin && (
                  <>
                    {/* מחיקה */}
                    <button
                      onClick={() => removeImage(idx)}
                      className="absolute top-0 right-0 bg-red-600 text-white rounded-full text-xs w-5 h-5 flex items-center justify-center"
                      style={{ transform: 'translate(50%,-50%)' }}
                    >✕</button>
                    {/* שינוי גודל */}
                    <div
                      onMouseDown={e => startResize(e, idx)}
                      className="absolute bottom-0 left-0 bg-amber-600 rounded-full cursor-nwse-resize"
                      style={{ width: 12, height: 12, transform: 'translate(-50%,50%)', border: '2px solid white' }}
                    />
                  </>
                )}
              </div>
            ))}
          </div>
        </>
      )}

      {isAdmin && (
        <div className="mt-2 text-center">
          <input ref={inputRef} type="file" accept="image/*" onChange={handleUpload} className="hidden" id={`printed-img-${recipeId}`} />
          <label htmlFor={`printed-img-${recipeId}`} className="cursor-pointer text-xs text-amber-700 hover:text-amber-900">
            {uploading ? '⏳ מעלה...' : '📷 הוסף תמונה מתחת למתכון'}
          </label>
        </div>
      )}
    </div>
  )
}

// ===== טופס עריכה =====
function EditForm({ editData, setEditData, onSave, onCancel, saving, recipeId, existingImages, onRefresh }: any) {
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
