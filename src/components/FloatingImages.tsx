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
  minY: number // תמונות לא יכנסו מעל קו זה
}

export default function FloatingImages({ images, isAdmin, recipeId, field, onUpdate, minY }: FloatingImagesProps) {
  const [localImages, setLocalImages] = useState<FloatingImage[]>(images)
  const [selected, setSelected] = useState<number | null>(null)
  const dragTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const isDraggingRef = useRef(false)

  async function saveImages(imgs: FloatingImage[]) {
    await supabase.from('recipes').update({ [field]: imgs }).eq('id', recipeId)
    onUpdate()
  }

  function handleImageMouseDown(e: React.MouseEvent, idx: number) {
    if (!isAdmin) return

    const startX = e.clientX
    const startY = e.clientY
    const origX = localImages[idx].x
    const origY = localImages[idx].y
    isDraggingRef.current = false

    // מתחילים גרירה רק אחרי 150ms
    dragTimer.current = setTimeout(() => {
      isDraggingRef.current = true

      function onMove(ev: MouseEvent) {
        if (!isDraggingRef.current) return
        const newY = Math.max(minY, origY + ev.clientY - startY)
        setLocalImages(prev => {
          const updated = [...prev]
          updated[idx] = { ...updated[idx], x: origX + ev.clientX - startX, y: newY }
          return updated
        })
      }

      function onUp() {
        document.removeEventListener('mousemove', onMove)
        document.removeEventListener('mouseup', onUp)
        isDraggingRef.current = false
        setLocalImages(prev => { saveImages([...prev]); return prev })
      }

      document.addEventListener('mousemove', onMove)
      document.addEventListener('mouseup', onUp)
    }, 150)

    function onEarlyUp() {
      // לחיצה קצרה = בחירה (לא גרירה)
      if (dragTimer.current) clearTimeout(dragTimer.current)
      document.removeEventListener('mouseup', onEarlyUp)
      if (!isDraggingRef.current) {
        setSelected(prev => prev === idx ? null : idx)
      }
    }

    document.addEventListener('mouseup', onEarlyUp)
  }

  function startResize(e: React.MouseEvent, idx: number) {
    e.preventDefault()
    e.stopPropagation()
    const startX = e.clientX
    const origW = localImages[idx].width
    const origH = localImages[idx].height
    const aspect = origH > 0 ? origH / origW : 1

    function onMove(ev: MouseEvent) {
      const newW = Math.max(50, origW + (ev.clientX - startX))
      setLocalImages(prev => {
        const updated = [...prev]
        updated[idx] = { ...updated[idx], width: newW, height: Math.max(50, newW * aspect) }
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

  function handleRotate(e: React.MouseEvent, idx: number, delta: number) {
    e.preventDefault()
    e.stopPropagation()
    setLocalImages(prev => {
      const updated = [...prev]
      updated[idx] = { ...updated[idx], rotation: (updated[idx].rotation || 0) + delta }
      saveImages(updated)
      return updated
    })
  }

  function handleDelete(e: React.MouseEvent, idx: number) {
    e.preventDefault()
    e.stopPropagation()
    const updated = localImages.filter((_, i) => i !== idx)
    setLocalImages(updated)
    setSelected(null)
    saveImages(updated)
  }

  if (localImages.length === 0) return null

  return (
    <div
      style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 10 }}
      onClick={() => setSelected(null)}
    >
      {localImages.map((img, idx) => {
        const isSel = selected === idx && isAdmin
        return (
          <div
            key={idx}
            style={{
              position: 'absolute',
              left: img.x,
              top: Math.max(minY, img.y),
              width: img.width,
              height: img.height,
              transform: `rotate(${img.rotation || 0}deg)`,
              transformOrigin: 'center center',
              pointerEvents: isAdmin ? 'auto' : 'none',
              cursor: isAdmin ? 'grab' : 'default',
              outline: isSel ? '2px dashed #b8860b' : '1px solid transparent',
              borderRadius: 4,
              userSelect: 'none',
              zIndex: isSel ? 20 : 10,
            }}
            onMouseDown={e => handleImageMouseDown(e, idx)}
            onClick={e => e.stopPropagation()}
          >
            <img
              src={img.url}
              alt=""
              style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 3, display: 'block' }}
              crossOrigin="anonymous"
              draggable={false}
            />

            {/* כפתורים — מוצגים רק כשהתמונה נבחרה */}
            {isSel && (
              <>
                {/* סרגל כלים מעל התמונה */}
                <div
                  style={{
                    position: 'absolute',
                    top: -38,
                    left: '50%',
                    transform: 'translateX(-50%)',
                    display: 'flex',
                    gap: 3,
                    background: 'rgba(80,40,5,0.95)',
                    borderRadius: 6,
                    padding: '4px 6px',
                    zIndex: 30,
                    pointerEvents: 'auto',
                    whiteSpace: 'nowrap',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.5)',
                  }}
                  onMouseDown={e => { e.preventDefault(); e.stopPropagation() }}
                  onClick={e => e.stopPropagation()}
                >
                  <button
                    onMouseDown={e => { e.preventDefault(); e.stopPropagation() }}
                    onClick={e => handleRotate(e, idx, -15)}
                    style={{ background: '#7a4a20', color: 'white', border: 'none', borderRadius: 4, padding: '3px 8px', cursor: 'pointer', fontSize: 15, lineHeight: 1 }}
                  >↺</button>
                  <button
                    onMouseDown={e => { e.preventDefault(); e.stopPropagation() }}
                    onClick={e => handleRotate(e, idx, 15)}
                    style={{ background: '#7a4a20', color: 'white', border: 'none', borderRadius: 4, padding: '3px 8px', cursor: 'pointer', fontSize: 15, lineHeight: 1 }}
                  >↻</button>
                  <button
                    onMouseDown={e => { e.preventDefault(); e.stopPropagation() }}
                    onClick={e => handleDelete(e, idx)}
                    style={{ background: '#b91c1c', color: 'white', border: 'none', borderRadius: 4, padding: '3px 8px', cursor: 'pointer', fontSize: 13, lineHeight: 1 }}
                  >✕ מחק</button>
                </div>

                {/* ידית שינוי גודל — פינה ימין תחתון */}
                <div
                  onMouseDown={e => startResize(e, idx)}
                  onClick={e => e.stopPropagation()}
                  style={{
                    position: 'absolute',
                    bottom: -8,
                    right: -8,
                    width: 20,
                    height: 20,
                    background: '#b8860b',
                    borderRadius: '50%',
                    cursor: 'se-resize',
                    pointerEvents: 'auto',
                    border: '2px solid white',
                    zIndex: 30,
                    boxShadow: '0 1px 4px rgba(0,0,0,0.4)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 10,
                    color: 'white',
                  }}
                >↘</div>
              </>
            )}
          </div>
        )
      })}
    </div>
  )
}
