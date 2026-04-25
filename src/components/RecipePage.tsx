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
  const [uploadingExtra, setUploadingExtra] = useState(false)
  const extraInputRef = useRef<HTMLInputElement>(null)

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

  async function handleExtraImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploadingExtra(true)
    const ext = file.name.split('.').pop()
    const path = `extra/${recipe.id}/${Date.now()}.${ext}`
    const { error } = await supabase.storage.from('recipe-images').upload(path, file)
    if (!error) {
      const { data } = supabase.storage.from('recipe-images').getPublicUrl(path)
      const existing = recipe.extra_images || []
      const newImage = { url: data.publicUrl, x: 10, y: 10, width: 150, height: 150, rotation: 0 }
      await supabase.from('recipes').update({ extra_images: [...existing, newImage] }).eq('id', recipe.id)
      onRefresh()
    }
    setUploadingExtra(false)
    if (extraInputRef.current) extraInputRef.current.value = ''
  }

  // עמוד ימין — תמיד מציג תמונת מקור
  if (showMode === 'original') {
    return (
      <div className="book-page relative h-full flex flex-col" style={{ minHeight: 500, padding: '24px 20px' }}>
        <div style={{ position: 'absolute', bottom: 12, right: 16, color: '#8b4513', fontSize: 11 }}>{pageNumber}</div>

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
            <h2 className="vintage-title text-lg mb-1 text-center" style={{ color: '#5c3d2e' }}>{recipe.title}</h2>
            <div className="text-center text-xs mb-2" style={{ color: '#8b4513', fontStyle: 'italic' }}>כתב יד מקורי</div>
            <div style={{ width: 40, height: 1, background: '#b8860b', margin: '0 auto 12px' }} />

            {recipe.original_image_url ? (
              <div className="flex-1 flex items-center justify-center overflow-hidden">
                <img
                  src={recipe.original_image_url}
                  alt={recipe.title}
                  className="w-full object-contain rounded"
                  style={{ maxHeight: 370 }}
                  crossOrigin="anonymous"
                />
              </div>
            ) : (
              <div className="flex-1 flex items-center justify-center opacity-20">
                <span className="vintage-title text-amber-700 text-4xl">✦</span>
              </div>
            )}

            {recipe.extra_images && recipe.extra_images.length > 0 && (
              <ExtraImagesLayer
                images={recipe.extra_images}
                isAdmin={isAdmin}
                recipeId={recipe.id}
                onUpdate={onRefresh}
              />
            )}

            {isAdmin && (
              <div className="mt-2">
                <input ref={extraInputRef} type="file" accept="image/*" onChange={handleExtraImageUpload} className="hidden" id={`extra-orig-${recipe.id}`} />
                <label htmlFor={`extra-orig-${recipe.id}`} className="cursor-pointer text-xs text-amber-700 hover:text-amber-900">
                  {uploadingExtra ? '⏳ מעלה...' : '📷 הוסף תמונה לעמוד'}
                </label>
              </div>
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

  // עמוד שמאל — תמיד מציג מתכון מודפס
  return (
    <div className="book-page relative h-full flex flex-col" style={{ minHeight: 500, padding: '24px 20px', fontSize: 13 }}>
      <div style={{ position: 'absolute', bottom: 12, left: 16, color: '#8b4513', fontSize: 11 }}>{pageNumber}</div>

      <div className="flex-1 overflow-y-auto">
        <div className="text-center mb-3">
          <h2 className="vintage-title text-xl" style={{ color: '#5c3d2e' }}>{recipe.title}</h2>
          <div style={{ color: '#8b4513', fontSize: 11, marginTop: 2 }}>{recipe.category}</div>
          <div style={{ width: 60, height: 1, background: '#b8860b', margin: '6px auto' }} />
        </div>

        {(recipe.prep_time || recipe.servings) && (
          <div className="flex justify-center gap-4 mb-3 text-xs" style={{ color: '#8b4513' }}>
            {recipe.prep_time && <span>⏱ {recipe.prep_time}</span>}
            {recipe.servings && <span>🍽 {recipe.servings} מנות</span>}
          </div>
        )}

        {recipe.ingredients && (
          <div className="mb-3">
            <h3 className="vintage-title text-sm mb-1" style={{ color: '#8b4513' }}>✦ מרכיבים</h3>
            <div className="recipe-text text-xs" style={{ paddingRight: 8 }}>{recipe.ingredients}</div>
          </div>
        )}

        <div style={{ width: '100%', height: 1, background: 'rgba(139,69,19,0.2)', margin: '8px 0' }} />

        {recipe.instructions && (
          <div className="mb-3">
            <h3 className="vintage-title text-sm mb-1" style={{ color: '#8b4513' }}>✦ הכנה</h3>
            <div className="recipe-text text-xs" style={{ paddingRight: 8 }}>{recipe.instructions}</div>
          </div>
        )}

        {/* תמונות נוספות מתחת למודפס */}
        {recipe.extra_images && recipe.extra_images.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-2 justify-center">
            {recipe.extra_images.map((img: any, idx: number) => (
              <img
                key={idx}
                src={img.url}
                alt=""
                className="rounded object-cover"
                style={{ width: img.width || 120, height: img.height || 120, transform: `rotate(${img.rotation || 0}deg)` }}
                crossOrigin="anonymous"
              />
            ))}
          </div>
        )}

        {/* הוסף תמונה לעמוד מודפס */}
        {isAdmin && (
          <PrintedExtraUpload recipeId={recipe.id} existingImages={recipe.extra_images || []} onRefresh={onRefresh} />
        )}
      </div>
    </div>
  )
}

function EditForm({ editData, setEditData, onSave, onCancel, saving, recipeId, existingImages, onRefresh }: any) {
  const [uploadingExtra, setUploadingExtra] = useState(false)
  const extraRef = useRef<HTMLInputElement>(null)

  async function handleExtraUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploadingExtra(true)
    const ext = file.name.split('.').pop()
    const path = `extra/${recipeId}/${Date.now()}.${ext}`
    const { error } = await supabase.storage.from('recipe-images').upload(path, file)
    if (!error) {
      const { data } = supabase.storage.from('recipe-images').getPublicUrl(path)
      const newImage = { url: data.publicUrl, x: 10, y: 10, width: 150, height: 150, rotation: 0 }
      await supabase.from('recipes').update({ extra_images: [...existingImages, newImage] }).eq('id', recipeId)
      onRefresh()
    }
    setUploadingExtra(false)
    if (extraRef.current) extraRef.current.value = ''
  }

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

      <div className="border border-amber-200 rounded p-2 bg-amber-50/50">
        <p className="text-xs text-amber-700 mb-1 font-medium">הוסף תמונות נוספות לעמוד:</p>
        <input ref={extraRef} type="file" accept="image/*" onChange={handleExtraUpload} className="hidden" id={`edit-extra-${recipeId}`} />
        <label htmlFor={`edit-extra-${recipeId}`} className="cursor-pointer inline-block px-3 py-1 bg-amber-700 text-white rounded text-xs hover:bg-amber-600">
          {uploadingExtra ? '⏳ מעלה...' : '📷 העלה תמונה'}
        </label>
        {existingImages.length > 0 && (
          <span className="text-xs text-amber-600 mr-2">{existingImages.length} תמונות קיימות</span>
        )}
      </div>

      <div className="flex gap-2">
        <button onClick={onSave} disabled={saving} className="flex-1 bg-amber-700 text-white rounded py-1 text-sm hover:bg-amber-600 disabled:opacity-50">
          {saving ? 'שומר...' : 'שמור'}
        </button>
        <button onClick={onCancel} className="flex-1 bg-gray-400 text-white rounded py-1 text-sm">ביטול</button>
      </div>
    </div>
  )
}

function PrintedExtraUpload({ recipeId, existingImages, onRefresh }: any) {
  const [uploading, setUploading] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    const ext = file.name.split('.').pop()
    const path = `extra/${recipeId}/${Date.now()}.${ext}`
    const { error } = await supabase.storage.from('recipe-images').upload(path, file)
    if (!error) {
      const { data } = supabase.storage.from('recipe-images').getPublicUrl(path)
      const newImg = { url: data.publicUrl, x: 0, y: 0, width: 120, height: 120, rotation: 0 }
      await supabase.from('recipes').update({ extra_images: [...existingImages, newImg] }).eq('id', recipeId)
      onRefresh()
    }
    setUploading(false)
    if (inputRef.current) inputRef.current.value = ''
  }

  return (
    <div className="mt-2 text-center">
      <input ref={inputRef} type="file" accept="image/*" onChange={handleUpload} className="hidden" id={`printed-extra-${recipeId}`} />
      <label htmlFor={`printed-extra-${recipeId}`} className="cursor-pointer text-xs text-amber-700 hover:text-amber-900">
        {uploading ? '⏳ מעלה...' : '📷 הוסף תמונה מתחת למתכון'}
      </label>
    </div>
  )
}
