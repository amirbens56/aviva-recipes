'use client'

import { useState, useRef } from 'react'
import { Recipe, supabase } from '@/lib/supabase'
import ExtraImagesLayer from './ExtraImagesLayer'
import jsPDF from 'jspdf'
import html2canvas from 'html2canvas'

interface RecipePageProps {
  recipe: Recipe
  side: 'left' | 'right'
  isAdmin: boolean
  onRefresh: () => void
  pageNumber: number
  printMode?: boolean
}

export default function RecipePage({ recipe, side, isAdmin, onRefresh, pageNumber, printMode }: RecipePageProps) {
  const [showOriginal, setShowOriginal] = useState(true)
  const [editing, setEditing] = useState(false)
  const [editData, setEditData] = useState<Partial<Recipe>>(recipe)
  const [saving, setSaving] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const pageRef = useRef<HTMLDivElement>(null)

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

  async function handlePrint() {
    if (!pageRef.current) return
    const canvas = await html2canvas(pageRef.current, { scale: 2, useCORS: true })
    const imgData = canvas.toDataURL('image/png')
    const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
    const w = pdf.internal.pageSize.getWidth()
    const h = (canvas.height * w) / canvas.width
    pdf.addImage(imgData, 'PNG', 0, 0, w, h)
    pdf.save(`${recipe.title}.pdf`)
  }

  return (
    <div
      ref={pageRef}
      className="book-page relative h-full flex flex-col"
      style={{ minHeight: 500, padding: '24px 20px', fontSize: 13 }}
    >
      {/* Page number */}
      <div
        style={{
          position: 'absolute',
          bottom: 12,
          [side === 'right' ? 'right' : 'left']: 16,
          color: '#8b4513',
          fontSize: 11,
          fontFamily: 'Frank Ruhl Libre, serif',
        }}
      >
        {pageNumber}
      </div>

      {/* Admin controls */}
      {isAdmin && !printMode && (
        <div className="absolute top-2 left-2 flex gap-1 z-20">
          <button
            onClick={() => setEditing(!editing)}
            className="px-2 py-1 bg-amber-700 text-white rounded text-xs hover:bg-amber-600"
          >
            ✏️
          </button>
          <button
            onClick={handlePrint}
            className="px-2 py-1 bg-blue-700 text-white rounded text-xs hover:bg-blue-600"
          >
            🖨️
          </button>
          <button
            onClick={() => setShowDeleteConfirm(true)}
            className="px-2 py-1 bg-red-700 text-white rounded text-xs hover:bg-red-600"
          >
            🗑️
          </button>
        </div>
      )}

      {editing ? (
        <div className="flex flex-col gap-2 overflow-y-auto flex-1">
          <input
            className="border border-amber-300 rounded px-2 py-1 text-sm bg-amber-50"
            value={editData.title || ''}
            onChange={e => setEditData({ ...editData, title: e.target.value })}
            placeholder="שם המתכון"
          />
          <select
            className="border border-amber-300 rounded px-2 py-1 text-sm bg-amber-50"
            value={editData.category || ''}
            onChange={e => setEditData({ ...editData, category: e.target.value })}
          >
            {['עוגות ומאפים','מרקים','סלטים','בשר ועוף','דגים','ירקות','קטניות','פסטה ואורז','קינוחים','שתייה','ממרחים','אחר'].map(c => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
          <div className="flex gap-2">
            <input className="border border-amber-300 rounded px-2 py-1 text-sm bg-amber-50 flex-1" value={editData.prep_time || ''} onChange={e => setEditData({...editData, prep_time: e.target.value})} placeholder="זמן הכנה" />
            <input className="border border-amber-300 rounded px-2 py-1 text-sm bg-amber-50 flex-1" value={editData.servings || ''} onChange={e => setEditData({...editData, servings: e.target.value})} placeholder="מנות" />
          </div>
          <textarea
            className="border border-amber-300 rounded px-2 py-1 text-sm bg-amber-50 flex-1"
            rows={4}
            value={editData.ingredients || ''}
            onChange={e => setEditData({ ...editData, ingredients: e.target.value })}
            placeholder="מרכיבים"
          />
          <textarea
            className="border border-amber-300 rounded px-2 py-1 text-sm bg-amber-50 flex-1"
            rows={5}
            value={editData.instructions || ''}
            onChange={e => setEditData({ ...editData, instructions: e.target.value })}
            placeholder="הוראות הכנה"
          />
          <div className="flex gap-2">
            <button onClick={handleSave} disabled={saving} className="flex-1 bg-amber-700 text-white rounded py-1 text-sm hover:bg-amber-600 disabled:opacity-50">
              {saving ? 'שומר...' : 'שמור'}
            </button>
            <button onClick={() => setEditing(false)} className="flex-1 bg-gray-400 text-white rounded py-1 text-sm hover:bg-gray-500">
              ביטול
            </button>
          </div>
        </div>
      ) : (
        <>
          {/* View toggle */}
          {recipe.original_image_url && !printMode && (
            <div className="flex gap-1 mb-3 justify-center">
              <button
                onClick={() => setShowOriginal(true)}
                className={`px-3 py-1 text-xs rounded-full transition-all ${showOriginal ? 'bg-amber-700 text-white' : 'bg-amber-100 text-amber-700'}`}
              >
                מקור
              </button>
              <button
                onClick={() => setShowOriginal(false)}
                className={`px-3 py-1 text-xs rounded-full transition-all ${!showOriginal ? 'bg-amber-700 text-white' : 'bg-amber-100 text-amber-700'}`}
              >
                מודפס
              </button>
            </div>
          )}

          {showOriginal && recipe.original_image_url ? (
            /* Original handwritten image */
            <div className="flex-1 flex flex-col">
              <h2 className="vintage-title text-lg mb-2 text-center" style={{ color: '#5c3d2e' }}>
                {recipe.title}
              </h2>
              <div className="flex-1 relative overflow-hidden rounded" style={{ minHeight: 300 }}>
                <img
                  src={recipe.original_image_url}
                  alt={recipe.title}
                  className="w-full h-full object-contain"
                  style={{ maxHeight: 380 }}
                  crossOrigin="anonymous"
                />
              </div>
            </div>
          ) : (
            /* Printed recipe */
            <div className="flex-1 overflow-y-auto">
              {/* Title */}
              <div className="text-center mb-3">
                <h2 className="vintage-title text-xl" style={{ color: '#5c3d2e' }}>{recipe.title}</h2>
                <div style={{ color: '#8b4513', fontSize: 11, marginTop: 2 }}>{recipe.category}</div>
                <div style={{ width: 60, height: 1, background: '#b8860b', margin: '6px auto' }} />
              </div>

              {/* Meta */}
              {(recipe.prep_time || recipe.servings) && (
                <div className="flex justify-center gap-4 mb-3 text-xs" style={{ color: '#8b4513' }}>
                  {recipe.prep_time && <span>⏱ {recipe.prep_time}</span>}
                  {recipe.servings && <span>🍽 {recipe.servings} מנות</span>}
                </div>
              )}

              {/* Ingredients */}
              {recipe.ingredients && (
                <div className="mb-3">
                  <h3 className="vintage-title text-sm mb-1" style={{ color: '#8b4513' }}>✦ מרכיבים</h3>
                  <div className="recipe-text text-xs" style={{ paddingRight: 8 }}>
                    {recipe.ingredients}
                  </div>
                </div>
              )}

              <div style={{ width: '100%', height: 1, background: 'rgba(139,69,19,0.2)', margin: '8px 0' }} />

              {/* Instructions */}
              {recipe.instructions && (
                <div className="mb-3">
                  <h3 className="vintage-title text-sm mb-1" style={{ color: '#8b4513' }}>✦ הכנה</h3>
                  <div className="recipe-text text-xs" style={{ paddingRight: 8 }}>
                    {recipe.instructions}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Extra images layer */}
          {recipe.extra_images && recipe.extra_images.length > 0 && (
            <ExtraImagesLayer
              images={recipe.extra_images}
              isAdmin={isAdmin}
              recipeId={recipe.id}
              onUpdate={onRefresh}
            />
          )}

          {/* Add extra image button */}
          {isAdmin && !printMode && (
            <ExtraImageUpload recipeId={recipe.id} onUpdate={onRefresh} existingImages={recipe.extra_images || []} />
          )}
        </>
      )}

      {/* Delete confirm */}
      {showDeleteConfirm && (
        <div className="absolute inset-0 bg-amber-50/95 flex flex-col items-center justify-center gap-3 z-30 rounded">
          <p className="text-amber-900 font-medium">למחוק את המתכון?</p>
          <div className="flex gap-3">
            <button onClick={handleDelete} className="px-4 py-2 bg-red-600 text-white rounded text-sm hover:bg-red-700">מחק</button>
            <button onClick={() => setShowDeleteConfirm(false)} className="px-4 py-2 bg-gray-400 text-white rounded text-sm">ביטול</button>
          </div>
        </div>
      )}
    </div>
  )
}

function ExtraImageUpload({ recipeId, onUpdate, existingImages }: { recipeId: string, onUpdate: () => void, existingImages: any[] }) {
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
      const newImage = { url: data.publicUrl, x: 10, y: 10, width: 150, height: 150, rotation: 0 }
      await supabase.from('recipes').update({ extra_images: [...existingImages, newImage] }).eq('id', recipeId)
      onUpdate()
    }
    setUploading(false)
    if (inputRef.current) inputRef.current.value = ''
  }

  return (
    <div className="mt-2">
      <input ref={inputRef} type="file" accept="image/*" onChange={handleUpload} className="hidden" id={`extra-${recipeId}`} />
      <label
        htmlFor={`extra-${recipeId}`}
        className="cursor-pointer text-xs text-amber-700 hover:text-amber-900 flex items-center gap-1"
      >
        {uploading ? '⏳ מעלה...' : '📷 הוסף תמונה'}
      </label>
    </div>
  )
}
