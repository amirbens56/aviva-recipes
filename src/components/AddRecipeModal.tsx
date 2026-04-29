'use client'

import { useState, useRef } from 'react'
import { supabase } from '@/lib/supabase'

interface Props {
  onClose: () => void
  onSaved: () => void
}

const CATEGORIES = ['עוגות ומאפים','מרקים','סלטים','בשר ועוף','דגים','ירקות','קטניות','פסטה ואורז','קינוחים','שתייה','ממרחים','אחר']

export default function AddRecipeModal({ onClose, onSaved }: Props) {
  const [step, setStep] = useState<'upload' | 'edit' | 'saving'>('upload')
  const [scanning, setScanning] = useState(false)
  const [scanError, setScanError] = useState('')
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [form, setForm] = useState({
    title: '', category: 'אחר', ingredients: '', instructions: '', prep_time: '', servings: '',
  })
  const fileRef = useRef<HTMLInputElement>(null)
  const cameraRef = useRef<HTMLInputElement>(null)

  function onFileSelected(file: File) {
    setSelectedFile(file)
    setScanError('')
    const url = URL.createObjectURL(file)
    setPreviewUrl(url)
  }

  async function handleScan() {
    if (!selectedFile) return
    setScanning(true)
    setScanError('')

    try {
      // קריאת הקובץ כ-ArrayBuffer ישירות
      // כיווץ דרך canvas
      const blob = await compressToJpeg(selectedFile, 1400)
      const compressedArray = await blob.arrayBuffer()
      const uint8 = new Uint8Array(compressedArray)
      let binary = ''
      uint8.forEach(b => { binary += String.fromCharCode(b) })
      const base64 = btoa(binary)

      console.log('Sending scan, base64 length:', base64.length)

      const res = await fetch('/api/scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageBase64: base64, mediaType: 'image/jpeg' }),
      })

      const data = await res.json()
      if (data.success && data.recipe) {
        setForm({
          title: data.recipe.title || '',
          category: data.recipe.category || 'אחר',
          ingredients: data.recipe.ingredients || '',
          instructions: data.recipe.instructions || '',
          prep_time: data.recipe.prep_time || '',
          servings: data.recipe.servings || '',
        })
        setStep('edit')
      } else {
        setScanError('שגיאה בסריקה — נסה שנית או הזן ידנית')
      }
    } catch (e) {
      console.error(e)
      setScanError('שגיאה בסריקה')
    }
    setScanning(false)
  }

  function compressToJpeg(file: File, maxSize: number): Promise<Blob> {
    return new Promise((resolve, reject) => {
      const img = new Image()
      const objectUrl = URL.createObjectURL(file)
      img.onload = () => {
        URL.revokeObjectURL(objectUrl)
        let w = img.naturalWidth
        let h = img.naturalHeight
        if (w > maxSize || h > maxSize) {
          if (w > h) { h = Math.round(h * maxSize / w); w = maxSize }
          else { w = Math.round(w * maxSize / h); h = maxSize }
        }
        const canvas = document.createElement('canvas')
        canvas.width = w
        canvas.height = h
        const ctx = canvas.getContext('2d')
        if (!ctx) { reject(new Error('Canvas context failed')); return }
        ctx.drawImage(img, 0, 0, w, h)
        canvas.toBlob(
          (blob) => { blob ? resolve(blob) : reject(new Error('toBlob failed')) },
          'image/jpeg',
          0.88
        )
      }
      img.onerror = () => { URL.revokeObjectURL(objectUrl); reject(new Error('Image load failed')) }
      img.src = objectUrl
    })
  }

  async function handleSave() {
    setStep('saving')
    let originalImageUrl = ''

    if (selectedFile) {
      const ext = selectedFile.name.split('.').pop() || 'jpg'
      const path = `originals/${Date.now()}.${ext}`
      const { error } = await supabase.storage.from('recipe-images').upload(path, selectedFile)
      if (!error) {
        const { data } = supabase.storage.from('recipe-images').getPublicUrl(path)
        originalImageUrl = data.publicUrl
      }
    }

    await supabase.from('recipes').insert({
      ...form,
      original_image_url: originalImageUrl,
      extra_images: [],
      printed_images: [],
    })

    onSaved()
  }

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4" dir="rtl">
      <div className="book-page rounded-sm w-full overflow-y-auto" style={{ maxWidth: 520, maxHeight: '90vh', padding: '28px 24px' }}>

        <div className="flex justify-between items-center mb-4">
          <h2 className="vintage-title text-2xl" style={{ color: '#5c3d2e' }}>הוספת מתכון</h2>
          <button onClick={onClose} style={{ color: '#8b4513', fontSize: 20 }}>✕</button>
        </div>
        <div style={{ width: 60, height: 1, background: '#b8860b', marginBottom: 20 }} />

        {/* שלב 1 — בחירת תמונה */}
        {step === 'upload' && (
          <div className="flex flex-col gap-4">
            <p style={{ color: '#5c3d2e', fontSize: 14 }}>העלה תמונה של המתכון הכתוב בכתב יד:</p>

            <input ref={cameraRef} type="file" accept="image/*" capture="environment"
              onChange={e => e.target.files?.[0] && onFileSelected(e.target.files[0])}
              className="hidden" id="camera-input" />
            <input ref={fileRef} type="file" accept="image/*"
              onChange={e => e.target.files?.[0] && onFileSelected(e.target.files[0])}
              className="hidden" id="file-input" />

            <div className="flex gap-3">
              <label htmlFor="camera-input" className="flex-1 py-3 bg-amber-700 text-white rounded text-center cursor-pointer hover:bg-amber-600 text-sm">
                📷 צלם עכשיו
              </label>
              <label htmlFor="file-input" className="flex-1 py-3 bg-amber-100 text-amber-800 rounded text-center cursor-pointer hover:bg-amber-200 text-sm border border-amber-300">
                🖼 מהגלריה
              </label>
            </div>

            {previewUrl && (
              <div className="flex flex-col gap-3">
                <img src={previewUrl} alt="תצוגה מקדימה" className="w-full rounded"
                  style={{ maxHeight: 250, objectFit: 'contain', background: '#f5f0e8' }} />
                {scanError && <p style={{ color: '#b91c1c', fontSize: 13 }}>{scanError}</p>}
                <button onClick={handleScan} disabled={scanning}
                  className="py-3 bg-amber-800 text-white rounded hover:bg-amber-700 disabled:opacity-50 font-medium">
                  {scanning ? '⏳ סורק...' : '🔍 סרוק וחלץ מתכון'}
                </button>
                <button onClick={() => setStep('edit')} className="py-2 text-amber-700 text-sm hover:text-amber-900">
                  הזן ידנית ←
                </button>
              </div>
            )}
          </div>
        )}

        {/* שלב 2 — עריכה */}
        {step === 'edit' && (
          <div className="flex flex-col gap-3">
            {previewUrl && (
              <img src={previewUrl} alt="מקור" className="w-full rounded mb-1"
                style={{ maxHeight: 120, objectFit: 'contain', background: '#f5f0e8' }} />
            )}
            <input className="border border-amber-300 rounded px-3 py-2 text-sm bg-amber-50"
              value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="שם המתכון *" />
            <select className="border border-amber-300 rounded px-3 py-2 text-sm bg-amber-50"
              value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}>
              {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
            <div className="flex gap-2">
              <input className="border border-amber-300 rounded px-3 py-2 text-sm bg-amber-50 flex-1"
                value={form.prep_time} onChange={e => setForm({ ...form, prep_time: e.target.value })} placeholder="זמן הכנה" />
              <input className="border border-amber-300 rounded px-3 py-2 text-sm bg-amber-50 flex-1"
                value={form.servings} onChange={e => setForm({ ...form, servings: e.target.value })} placeholder="מנות" />
            </div>
            <textarea className="border border-amber-300 rounded px-3 py-2 text-sm bg-amber-50" rows={4}
              value={form.ingredients} onChange={e => setForm({ ...form, ingredients: e.target.value })} placeholder="מרכיבים" />
            <textarea className="border border-amber-300 rounded px-3 py-2 text-sm bg-amber-50" rows={5}
              value={form.instructions} onChange={e => setForm({ ...form, instructions: e.target.value })} placeholder="הוראות הכנה" />
            <div className="flex gap-2 mt-1">
              <button onClick={handleSave} disabled={!form.title}
                className="flex-1 py-3 bg-amber-800 text-white rounded hover:bg-amber-700 disabled:opacity-50 font-medium">
                שמור מתכון ✦
              </button>
              <button onClick={() => setStep('upload')} className="px-4 py-3 bg-amber-100 text-amber-800 rounded hover:bg-amber-200 text-sm">
                חזור
              </button>
            </div>
          </div>
        )}

        {step === 'saving' && (
          <div className="flex items-center justify-center py-12">
            <div className="text-amber-800 text-lg vintage-title">שומר מתכון...</div>
          </div>
        )}
      </div>
    </div>
  )
}
