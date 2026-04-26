'use client'

import { useState, useRef, useCallback } from 'react'
import { supabase } from '@/lib/supabase'

export type FloatingImage = {
  url: string
  x: number
  y: number
  width: number
  height: number
  rotation: number
}

interface FloatingImagesProps {
  images: FloatingImage[]
  isAdmin: boolean
  recipeId: string
  field: 'extra_images' | 'printed_images'
  onUpdate: () => void
  containerRef: React.RefObject<HTMLDivElement>
}

export default function FloatingImages({ images, isAdmin, recipeId, field, onUpdate, containerRef }: FloatingImagesProps) {
  const [localImages, setLocalImages] = useState<FloatingImage[]>(images)
  const [selected, setSelected] = useState<number | null>(null)

  async function saveImages(imgs: FloatingImage[]) {
    await supabase.from('recipes').update({ [field]: imgs }).eq('id', recipeId)
    onUpdate()
  }

  // ===== גרירה =====
  function startDrag(e: React.MouseEvent, idx: number) {
    if (!isAdmin) return
    e.preventDefault()
    e.stopPropagation()
    setSelected(idx)

    const startX = e.clientX
    const startY = e.clientY
    const origX = localImages[idx].x
    const origY = localImages[idx].y

    function onMove(ev: MouseEvent) {
      const dx = ev.clientX - startX
      const dy = ev.clientY - startY
      setLocalImages(prev => {
        const updated = [...prev]
        updated[idx] = { ...updated[idx], x: origX + dx, y: origY + dy }
        return updated
      })
    }

    function onUp() {
      document.removeEventListener('mousemove', onMove)
      document.removeEventListener('mouseup', onUp)
      setLocalImages(prev => { saveImages([...prev]); return prev })
    }

    document.addEventListener('mousemove', onMove)
    document.addEventListener('mouseup', onUp)
  }

  // ===== שינוי גודל בגרירת פינה =====
  function startResize(e: React.MouseEvent, idx: number) {
    e.preventDefault()
    e.stopPropagation()

    const startX = e.clientX
    const startY = e.clientY
    const origW = localImages[idx].width
    const origH = localImages[idx].height
    const aspect = origW / origH

    function onMove(ev: MouseEvent) {
      const dx = ev.clientX - startX
      const dy = ev.clientY - startY
      const delta = (Math.abs(dx) > Math.abs(dy) ? dx : dy)
      const newW = Math.max(50, origW + delta)
      const newH = Math.max(50, newW / aspect)
      setLocalImages(prev => {
        const updated = [...prev]
        updated[idx] = { ...updated[idx], width: newW, height: newH }
        return updated
      })
    }

    function onUp() {
      document.removeEventListener('mousemove', onMove)
      document.removeEventListener('mouseup', onUp)
      setLocalImages(prev => { saveImages([...prev]); return prev })
    }

    document.addEventListener('mousemove', onMove)
    document.addEventListener('mouseup', onUp)
  }

  // ===== סיבוב =====
  function rotate(idx: number, delta: number) {
    const updated = [...localImages]
    updated[idx] = { ...updated[idx], rotation: (updated[idx].rotation || 0) + delta }
    setLocalImages(updated)
    saveImages(updated)
  }

  async function removeImage(idx: number) {
    const updated = localImages.filter((_, i) => i !== idx)
    setLocalImages(updated)
    setSelected(null)
    await saveImages(updated)
  }

  if (localImages.length === 0) return null

  return (
    <div
      className="absolute inset-0 pointer-events-none"
      style={{ zIndex: 15 }}
      onClick={() => setSelected(null)}
    >
      {localImages.map((img, idx) => (
        <div
          key={idx}
          style={{
            position: 'absolute',
            left: img.x,
            top: img.y,
            width: img.width,
            height: img.height,
            transform: `rotate(${img.rotation || 0}deg)`,
            pointerEvents: isAdmin ? 'auto' : 'none',
            cursor: isAdmin ? 'move' : 'default',
            outline: selected === idx && isAdmin ? '2px dashed #b8860b' : '2px solid transparent',
            borderRadius: 4,
            userSelect: 'none',
            transformOrigin: 'center center',
          }}
          onMouseDown={e => startDrag(e, idx)}
          onClick={e => { e.stopPropagation(); isAdmin && setSelected(idx) }}
        >
          <img
            src={img.url}
            alt=""
            style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 3, display: 'block' }}
            crossOrigin="anonymous"
            draggable={false}
          />

          {/* כלים — מוצגים רק כשנבחר */}
          {isAdmin && selected === idx && (
            <>
              {/* סרגל כלים עליון */}
              <div
                className="absolute flex gap-1 rounded px-1 py-0.5"
                style={{
                  top: -32,
                  right: 0,
                  background: 'rgba(120,60,10,0.92)',
                  pointerEvents: 'auto',
                  whiteSpace: 'nowrap',
                  zIndex: 20,
                }}
                onMouseDown={e => e.stopPropagation()}
              >
                <button
                  onClick={e => { e.stopPropagation(); rotate(idx, -15) }}
                  className="text-white text-xs px-1.5 py-0.5 rounded hover:bg-amber-600"
                  title="סובב שמאל"
                >↺</button>
                <button
                  onClick={e => { e.stopPropagation(); rotate(idx, 15) }}
                  className="text-white text-xs px-1.5 py-0.5 rounded hover:bg-amber-600"
                  title="סובב ימין"
                >↻</button>
                <button
                  onClick={e => { e.stopPropagation(); removeImage(idx) }}
                  className="bg-red-600 text-white text-xs px-1.5 py-0.5 rounded hover:bg-red-700"
                  title="מחק"
                >✕</button>
              </div>

              {/* ידית שינוי גודל — פינה ימין תחתון */}
              <div
                onMouseDown={e => startResize(e, idx)}
                onClick={e => e.stopPropagation()}
                style={{
                  position: 'absolute',
                  bottom: -7,
                  right: -7,
                  width: 16,
                  height: 16,
                  background: '#b8860b',
                  borderRadius: '50%',
                  cursor: 'se-resize',
                  pointerEvents: 'auto',
                  border: '2px solid white',
                  zIndex: 20,
                }}
              />
            </>
          )}
        </div>
      ))}
    </div>
  )
}
