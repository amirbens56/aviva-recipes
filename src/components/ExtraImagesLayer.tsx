'use client'

import { useState, useRef, useCallback } from 'react'
import { supabase, ExtraImage } from '@/lib/supabase'

interface ExtraImagesLayerProps {
  images: ExtraImage[]
  isAdmin: boolean
  recipeId: string
  onUpdate: () => void
}

export default function ExtraImagesLayer({ images, isAdmin, recipeId, onUpdate }: ExtraImagesLayerProps) {
  const [localImages, setLocalImages] = useState<ExtraImage[]>(images)
  const [selected, setSelected] = useState<number | null>(null)
  const dragRef = useRef<{ startX: number; startY: number; origX: number; origY: number } | null>(null)

  async function saveImages(imgs: ExtraImage[]) {
    await supabase.from('recipes').update({ extra_images: imgs }).eq('id', recipeId)
    onUpdate()
  }

  function startDrag(e: React.MouseEvent, idx: number) {
    if (!isAdmin) return
    e.preventDefault()
    setSelected(idx)
    dragRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      origX: localImages[idx].x,
      origY: localImages[idx].y,
    }

    function onMove(e: MouseEvent) {
      if (!dragRef.current) return
      const dx = e.clientX - dragRef.current.startX
      const dy = e.clientY - dragRef.current.startY
      setLocalImages(prev => {
        const updated = [...prev]
        updated[idx] = { ...updated[idx], x: dragRef.current!.origX + dx, y: dragRef.current!.origY + dy }
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

  function resize(idx: number, delta: number) {
    const updated = [...localImages]
    updated[idx] = {
      ...updated[idx],
      width: Math.max(50, updated[idx].width + delta),
      height: Math.max(50, updated[idx].height + delta),
    }
    setLocalImages(updated)
    saveImages(updated)
  }

  async function removeImage(idx: number) {
    const updated = localImages.filter((_, i) => i !== idx)
    setLocalImages(updated)
    await saveImages(updated)
  }

  return (
    <div className="absolute inset-0 pointer-events-none" style={{ zIndex: 10 }}>
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
            overflow: 'visible',
          }}
          onMouseDown={e => startDrag(e, idx)}
          onClick={() => isAdmin && setSelected(idx)}
        >
          <img
            src={img.url}
            alt=""
            style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 3, display: 'block' }}
            crossOrigin="anonymous"
            draggable={false}
          />

          {/* Controls */}
          {isAdmin && selected === idx && (
            <div
              className="absolute flex gap-1"
              style={{ top: -28, right: 0, pointerEvents: 'auto' }}
              onMouseDown={e => e.stopPropagation()}
            >
              <button onClick={() => rotate(idx, -15)} className="bg-amber-700 text-white text-xs px-1 rounded">↺</button>
              <button onClick={() => rotate(idx, 15)} className="bg-amber-700 text-white text-xs px-1 rounded">↻</button>
              <button onClick={() => resize(idx, -20)} className="bg-amber-700 text-white text-xs px-1 rounded">−</button>
              <button onClick={() => resize(idx, 20)} className="bg-amber-700 text-white text-xs px-1 rounded">+</button>
              <button onClick={() => removeImage(idx)} className="bg-red-600 text-white text-xs px-1 rounded">✕</button>
            </div>
          )}
        </div>
      ))}
    </div>
  )
}
