'use client'

import { useState, useRef } from 'react'
import { Recipe } from '@/lib/supabase'
import RecipePage from './RecipePage'
import CoverPage from './CoverPage'

interface BookViewProps {
  recipes: Recipe[]
  currentPage: number
  setCurrentPage: (p: number) => void
  isAdmin: boolean
  onRefresh: () => void
}

export default function BookView({ recipes, currentPage, setCurrentPage, isAdmin, onRefresh }: BookViewProps) {
  const [flipping, setFlipping] = useState(false)
  const [flipDir, setFlipDir] = useState<'left' | 'right'>('left')

  // Page 0 = cover, then recipes in pairs
  const totalPages = recipes.length + 1 // +1 for cover

  function goNext() {
    if (flipping || currentPage >= totalPages - 1) return
    setFlipDir('left')
    setFlipping(true)
    setTimeout(() => {
      setCurrentPage(Math.min(currentPage + 2, totalPages - 1))
      setFlipping(false)
    }, 500)
  }

  function goPrev() {
    if (flipping || currentPage <= 0) return
    setFlipDir('right')
    setFlipping(true)
    setTimeout(() => {
      setCurrentPage(Math.max(currentPage - 2, 0))
      setFlipping(false)
    }, 500)
  }

  function getLeftPage() {
    if (currentPage === 0) return null // cover takes full width
    const idx = currentPage - 1
    return idx < recipes.length ? recipes[idx] : null
  }

  function getRightPage() {
    if (currentPage === 0) return null
    const idx = currentPage
    return idx < recipes.length ? recipes[idx] : null
  }

  const isCover = currentPage === 0

  return (
    <div className="flex flex-col items-center gap-4">
      {/* Book */}
      <div
        className="relative flex items-stretch rounded-sm"
        style={{
          boxShadow: '0 20px 60px rgba(0,0,0,0.6), 0 8px 20px rgba(0,0,0,0.4)',
          maxWidth: isCover ? 500 : 900,
          width: '100%',
          minHeight: 500,
        }}
      >
        {isCover ? (
          <CoverPage totalRecipes={recipes.length} onOpen={goNext} />
        ) : (
          <>
            {/* עמוד ימין — תמונת מקור כתב יד */}
            <div
              className={`book-page page-shadow-right flex-1 overflow-hidden transition-transform duration-500 ${flipping && flipDir === 'left' ? 'flip-left' : ''}`}
              style={{ minHeight: 500 }}
            >
              {getRightPage() ? (
                <RecipePage
                  recipe={getRightPage()!}
                  side="right"
                  showMode="original"
                  isAdmin={isAdmin}
                  onRefresh={onRefresh}
                  pageNumber={currentPage}
                />
              ) : (
                <div className="flex items-center justify-center h-full opacity-30">
                  <span className="vintage-title text-amber-700 text-2xl">✦</span>
                </div>
              )}
            </div>

            {/* Spine */}
            <div className="book-spine w-4 flex-shrink-0" />

            {/* עמוד שמאל — מתכון מודפס */}
            <div
              className={`book-page page-shadow-left flex-1 overflow-hidden transition-transform duration-500 ${flipping && flipDir === 'right' ? 'flip-right' : ''}`}
              style={{ minHeight: 500 }}
            >
              {getLeftPage() ? (
                <RecipePage
                  recipe={getLeftPage()!}
                  side="left"
                  showMode="printed"
                  isAdmin={isAdmin}
                  onRefresh={onRefresh}
                  pageNumber={currentPage + 1}
                />
              ) : (
                <div className="flex items-center justify-center h-full text-amber-700 opacity-30">
                  <span className="vintage-title text-2xl">✦</span>
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {/* Navigation */}
      <div className="flex items-center gap-6 mt-2">
        <button
          onClick={goPrev}
          disabled={currentPage === 0 || flipping}
          className="px-6 py-2 bg-amber-800/60 hover:bg-amber-700/60 disabled:opacity-30 text-amber-100 rounded transition-all text-sm"
        >
          ← הקודם
        </button>

        <span className="text-amber-300 text-sm">
          {currentPage === 0 ? 'עטיפה' : `עמוד ${currentPage} מתוך ${recipes.length}`}
        </span>

        <button
          onClick={goNext}
          disabled={(currentPage >= recipes.length) || flipping}
          className="px-6 py-2 bg-amber-800/60 hover:bg-amber-700/60 disabled:opacity-30 text-amber-100 rounded transition-all text-sm"
        >
          הבא →
        </button>
      </div>
    </div>
  )
}
