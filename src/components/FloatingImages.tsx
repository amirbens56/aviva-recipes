'use client'

import { useState, useRef } from 'react'
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
  topOffset: number // גובה האזור שמעליו — תמונות לא יכנסו לשם
}

export default function FloatingImages({ images, isAdmin, recipeId, field, onUpdate, topOffset }: FloatingImagesProps) {
  const [localImages, setLocalImages] = useState<FloatingImage[]>(images)
  const [selected, setSelected] = useState<number | null>(null)
  const [isDragging, setIsDragging] = useState(false)

  async function saveImages(imgs: FloatingImage[]) {
    await supabase.from('recipes').update({ [field]: imgs }).eq('id', recipeId)
    onUpdate()
  }

  function startDrag(e: React.MouseEvent, idx: number) {
    if (!isAdmin) return
    // אם לוחצים על כפתור — לא מתחילים גרירה
    const target = e.target as HTMLElement
    if (target.closest('.img-control-btn')) return

    e.preventDefault()
    e.stopPropagation()
    setIsDragging(true)

    const startX = e.clientX
    const startY = e.clientY
    const origX = localImages[idx].x
    const origY = localImages[idx].y

    function onMove(ev: MouseEvent) {
      const newY = Math.max(topOffset, origY + ev.clientY - startY)
      setLocalImages(prev => {
        const updated = [...prev]
        updated[idx] = { ...updated[idx], x: origX + ev.clientX - startX, y: newY }
        return updated
      })
    }

    function onUp() {
      document.removeEventListener('mousemove', onMove)
      document.removeEventListener('mouseup', onUp)
      setIsDragging(false)
      setLocalImages(prev => { saveImages([...prev]); return prev })
    }

    document.addEventListener('mousemove', onMove)
    document.addEventListener('mouseup', onUp)
  }

  function startResize(e: React.MouseEvent, idx: number) {
    e.preventDefault()
    e.stopPropagation()

    const startX = e.clientX
    const origW = localImages[idx].width
    const origH = localImages[idx].height
    const aspect = origH / origW

    function onMove(ev: MouseEvent) {
      const newW = Math.max(50, origW + (ev.clientX - startX))
      setLocalImages(prev => {
        const updated = [...prev]
        updated[idx] = { ...updated[idx], width: newW, height: newW * aspect }
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

  function rotate(e: React.MouseEvent, idx: number, delta: number) {
    e.preventDefault()
    e.stopPropagation()
    const updated = [...localImages]
    updated[idx] = { ...updated[idx], rotation: (updated[idx].rotation || 0) + delta }
    setLocalImages(updated)
    saveImages(updated)
  }

  function removeImg(e: React.MouseEvent, idx: number) {
    e.preventDefault()
    e.stopPropagation()
    const updated = localImages.filter((_, i) => i !== idx)
    setLocalImages(updated)
    setSelected(null)
    saveImages(updated)
  }

  function selectImg(e: React.MouseEvent, idx: number) {
    e.stopPropagation()
    if (isAdmin) setSelected(selected === idx ? null : idx)
  }

  if (localImages.length === 0) return null

  return (
    <div
      className="absolute inset-0 pointer-events-none"
      style={{ zIndex: 10 }}
      onClick={() => setSelected(null)}
    >
      {localImages.map((img, idx) => {
        const isSelected = selected === idx && isAdmin
        return (
          <div
            key={idx}
            style={{
              position: 'absolute',
              left: img.x,
              top: img.y,
              width: img.width,
              height: img.height,
              transform: `rotate(${img.rotation || 0}deg)`,
              transformOrigin: 'center center',
              pointerEvents: isAdmin ? 'auto' : 'none',
              cursor: isAdmin ? (isDragging ? 'grabbing' : 'grab') : 'default',
              outline: isSelected ? '2px dashed #b8860b' : '2px solid transparent',
              borderRadius: 4,
              userSelect: 'none',
            }}
            onMouseDown={e => startDrag(e, idx)}
            onClick={e => selectImg(e, idx)}
          >
            <img
              src={img.url}
              alt=""
              style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 3, display: 'block', pointerEvents: 'none' }}
              crossOrigin="anonymous"
              draggable={false}
            />

            {/* כפתורי שליטה — מוצגים כשנבחרת, לא מפעילים גרירה */}
            {isSelected && (
              <>
                {/* סרגל כלים — מחוץ לתמונה למעלה */}
                <div
                  className="img-control-btn"
                  style={{
                    position: 'absolute',
                    top: -36,
                    left: '50%',
                    transform: 'translateX(-50%)',
                    display: 'flex',
                    gap: 4,
                    background: 'rgba(100,50,5,0.95)',
                    borderRadius: 6,
                    padding: '3px 6px',
                    zIndex: 30,
                    pointerEvents: 'auto',
                    whiteSpace: 'nowrap',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.4)',
                  }}
                  onMouseDown={e => e.stopPropagation()}
                >
                  <button
                    className="img-control-btn"
                    onMouseDown={e => e.stopPropagation()}
                    onClick={e => rotate(e, idx, -15)}
                    style={{ background: '#8b5e3c', color: 'white', border: 'none', borderRadius: 4, padding: '2px 7px', cursor: 'pointer', fontSize: 14 }}
                    title="סובב שמאל"
                  >↺</button>
                  <button
                    className="img-control-btn"
                    onMouseDown={e => e.stopPropagation()}
                    onClick={e => rotate(e, idx, 15)}
                    style={{ background: '#8b5e3c', color: 'white', border: 'none', borderRadius: 4, padding: '2px 7px', cursor: 'pointer', fontSize: 14 }}
                    title="סובב ימין"
                  >↻</button>
                  <button
                    className="img-control-btn"
                    onMouseDown={e => e.stopPropagation()}
                    onClick={e => removeImg(e, idx)}
                    style={{ background: '#b91c1c', color: 'white', border: 'none', borderRadius: 4, padding: '2px 7px', cursor: 'pointer', fontSize: 14 }}
                    title="מחק"
                  >✕</button>
                </div>

                {/* ידית שינוי גודל — פינה ימין תחתון */}
                <div
                  className="img-control-btn"
                  onMouseDown={e => startResize(e, idx)}
                  onClick={e => e.stopPropagation()}
                  style={{
                    position: 'absolute',
                    bottom: -8,
                    right: -8,
                    width: 18,
                    height: 18,
                    background: '#b8860b',
                    borderRadius: '50%',
                    cursor: 'se-resize',
                    pointerEvents: 'auto',
                    border: '2px solid white',
                    zIndex: 30,
                    boxShadow: '0 1px 4px rgba(0,0,0,0.3)',
                  }}
                />
              </>
            )}
          </div>
        )
      })}
    </div>
  )
}
