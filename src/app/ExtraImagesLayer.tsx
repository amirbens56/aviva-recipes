'use client'

import { useState, useRef } from 'react'
import { supabase, ExtraImage } from '@/lib/supabase'

interface Props {
  images: ExtraImage[]
  isAdmin: boolean
  recipeId: string
  onUpdate: () => void
}

export default function ExtraImagesLayer({ images, isAdmin, recipeId, onUpdate }: Props) {
  const [localImages, setLocalImages] = useState<ExtraImage[]>(images)
  const [selected, setSelected] = useState<number | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  async function saveImages(imgs: ExtraImage[]) {
    await supabase.from('recipes').update({ extra_images: imgs }).eq('id', recipeId)
    onUpdate()
  }

  function startDrag(e: React.MouseEvent | React.TouchEvent, idx: number) {
    if (!isAdmin) return
    e.preventDefault()
    e.stopPropagation()
    setSelected(idx)

    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY
    const origX = localImages[idx].x
    const origY = localImages[idx].y
    const startX = clientX
    const startY = clientY

    function onMove(e: MouseEvent | TouchEvent) {
      const cx = 'touches' in e ? (e as TouchEvent).touches[0].clientX : (e as MouseEvent).clientX
      const cy = 'touches' in e ? (e as TouchEvent).touches[0].clientY : (e as MouseEvent).clientY
      setLocalImages(prev => {
        const updated = [...prev]
        updated[idx] = { ...updated[idx], x: origX + cx - startX, y: origY + cy - startY }
        return updated
      })
    }

    function onUp() {
      document.removeEventListener('mousemove', onMove)
      document.removeEventListener('mouseup', onUp)
      document.removeEventListener('touchmove', onMove)
      document.removeEventListener('touchend', onUp)
      setLocalImages(prev => { saveImages(prev); return prev })
    }

    document.addEventListener('mousemove', onMove)
    document.addEventListener('mouseup', onUp)
    document.addEventListener('touchmove', onMove, { passive: false })
    document.addEventListener('touchend', onUp)
  }

  function startResize(e: React.MouseEvent, idx: number) {
    e.preventDefault()
    e.stopPropagation()
    const startX = e.clientX
    const startY = e.clientY
    const origW = localImages[idx].width
    const origH = localImages[idx].height

    function onMove(e: MouseEvent) {
      const dx = e.clientX - startX
      const dy = e.clientY - startY
      const delta = (dx + dy) / 2
      setLocalImages(prev => {
        const updated = [...prev]
        updated[idx] = {
          ...updated[idx],
          width: Math.max(50, origW + delta),
          height: Math.max(50, origH + delta),
        }
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

  function rotate(idx: number, delta: number) {
    const updated = [...localImages]
    updated[idx] = { ...updated[idx], rotation: (updated[idx].rotation || 0) + delta }
    setLocalImages(updated)
    saveImages(updated)
  }

  async function removeImage(idx: number) {
    const updated = localImages.filter((_, i) => i !== idx)
    setLocalImages(updated)
    await saveImages(updated)
    setSelected(null)
  }

  if (localImages.length === 0) return null

  return (
    <div
      ref={containerRef}
      className="absolute inset-0 pointer-events-none"
      style={{ zIndex: 10 }}
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
            pointerEvents: 'auto',
            cursor: isAdmin ? 'move' : 'default',
            border: selected === idx && isAdmin ? '2px dashed #b8860b' : '2px solid transparent',
            borderRadius: 4,
            userSelect: 'none',
          }}
          onMouseDown={e => startDrag(e, idx)}
          onTouchStart={e => startDrag(e, idx)}
          onClick={e => { e.stopPropagation(); isAdmin && setSelected(idx) }}
        >
          <img
            src={img.url}
            alt=""
            style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 3, display: 'block' }}
            crossOrigin="anonymous"
            draggable={false}
          />

          {/* כפתורי שליטה */}
          {isAdmin && selected === idx && (
            <>
              {/* סרגל כלים */}
              <div
                className="absolute flex gap-1 bg-amber-900/90 rounded px-1 py-0.5"
                style={{ top: -30, right: 0, pointerEvents: 'auto', whiteSpace: 'nowrap' }}
                onMouseDown={e => e.stopPropagation()}
              >
                <button onClick={() => rotate(idx, -15)} className="bg-amber-700 text-white text-xs px-1.5 py-0.5 rounded hover:bg-amber-600">↺</button>
                <button onClick={() => rotate(idx, 15)} className="bg-amber-700 text-white text-xs px-1.5 py-0.5 rounded hover:bg-amber-600">↻</button>
                <button onClick={() => removeImage(idx)} className="bg-red-600 text-white text-xs px-1.5 py-0.5 rounded hover:bg-red-700">✕</button>
              </div>

              {/* ידית שינוי גודל */}
              <div
                onMouseDown={e => startResize(e, idx)}
                style={{
                  position: 'absolute',
                  bottom: -6,
                  left: -6,
                  width: 14,
                  height: 14,
                  background: '#b8860b',
                  borderRadius: '50%',
                  cursor: 'nwse-resize',
                  pointerEvents: 'auto',
                  border: '2px solid white',
                }}
              />
            </>
          )}
        </div>
      ))}
    </div>
  )
}
