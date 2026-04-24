'use client'

import { useState, useEffect } from 'react'
import { supabase, Recipe } from '@/lib/supabase'
import BookView from '@/components/BookView'
import TableOfContents from '@/components/TableOfContents'
import AddRecipeModal from '@/components/AddRecipeModal'
import AdminLogin from '@/components/AdminLogin'

export default function Home() {
  const [recipes, setRecipes] = useState<Recipe[]>([])
  const [loading, setLoading] = useState(true)
  const [view, setView] = useState<'book' | 'toc'>('book')
  const [currentPage, setCurrentPage] = useState(0)
  const [showAdd, setShowAdd] = useState(false)
  const [isAdmin, setIsAdmin] = useState(false)
  const [showLogin, setShowLogin] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)

  const categories = [
    'כל המתכונים', 'עוגות ומאפים', 'מרקים', 'סלטים', 'בשר ועוף',
    'דגים', 'ירקות', 'קטניות', 'פסטה ואורז', 'קינוחים', 'שתייה', 'ממרחים', 'אחר'
  ]

  useEffect(() => {
    loadRecipes()
  }, [])

  async function loadRecipes() {
    setLoading(true)
    const { data, error } = await supabase
      .from('recipes')
      .select('*')
      .order('created_at', { ascending: true })
    if (!error && data) setRecipes(data)
    setLoading(false)
  }

  const filteredRecipes = selectedCategory && selectedCategory !== 'כל המתכונים'
    ? recipes.filter(r => r.category === selectedCategory)
    : recipes

  function handleCategorySelect(cat: string, idx: number) {
    setSelectedCategory(cat === 'כל המתכונים' ? null : cat)
    setCurrentPage(idx * 2)
    setView('book')
  }

  return (
    <div className="min-h-screen flex flex-col" dir="rtl">
      {/* Header */}
      <header className="py-4 px-6 flex items-center justify-between" style={{ background: 'rgba(0,0,0,0.3)' }}>
        <div className="flex gap-3 items-center">
          <button
            onClick={() => setView('book')}
            className={`px-4 py-2 rounded text-sm font-medium transition-all ${view === 'book' ? 'bg-amber-700 text-amber-50' : 'text-amber-200 hover:text-amber-50'}`}
          >
            📖 ספר
          </button>
          <button
            onClick={() => setView('toc')}
            className={`px-4 py-2 rounded text-sm font-medium transition-all ${view === 'toc' ? 'bg-amber-700 text-amber-50' : 'text-amber-200 hover:text-amber-50'}`}
          >
            📋 תוכן עניינים
          </button>
        </div>

        <h1 className="vintage-title text-2xl md:text-3xl text-amber-200 text-center">
          ✦ ספר המתכונים של אביבה ✦
        </h1>

        <div className="flex gap-2">
          {isAdmin ? (
            <>
              <button
                onClick={() => setShowAdd(true)}
                className="px-4 py-2 bg-amber-700 hover:bg-amber-600 text-amber-50 rounded text-sm font-medium transition-all"
              >
                + הוסף מתכון
              </button>
              <button
                onClick={() => setIsAdmin(false)}
                className="px-3 py-2 text-amber-400 hover:text-amber-200 text-sm transition-all"
              >
                יציאה
              </button>
            </>
          ) : (
            <button
              onClick={() => setShowLogin(true)}
              className="px-3 py-2 text-amber-400 hover:text-amber-200 text-sm transition-all"
            >
              🔐
            </button>
          )}
        </div>
      </header>

      {/* Category Filter */}
      <div className="overflow-x-auto py-2 px-4" style={{ background: 'rgba(0,0,0,0.2)' }}>
        <div className="flex gap-2 min-w-max">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat === 'כל המתכונים' ? null : cat)}
              className={`px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap transition-all ${
                (cat === 'כל המתכונים' && !selectedCategory) || cat === selectedCategory
                  ? 'bg-amber-700 text-amber-50'
                  : 'bg-amber-900/40 text-amber-300 hover:bg-amber-800/40'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Main Content */}
      <main className="flex-1 p-4 md:p-8">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="text-amber-200 text-xl vintage-title">טוען את הספר...</div>
          </div>
        ) : view === 'book' ? (
          <BookView
            recipes={filteredRecipes}
            currentPage={currentPage}
            setCurrentPage={setCurrentPage}
            isAdmin={isAdmin}
            onRefresh={loadRecipes}
          />
        ) : (
          <TableOfContents
            recipes={filteredRecipes}
            onSelect={handleCategorySelect}
          />
        )}
      </main>

      {showAdd && (
        <AddRecipeModal
          onClose={() => setShowAdd(false)}
          onSaved={() => { setShowAdd(false); loadRecipes() }}
        />
      )}

      {showLogin && (
        <AdminLogin
          onLogin={() => { setIsAdmin(true); setShowLogin(false) }}
          onClose={() => setShowLogin(false)}
        />
      )}
    </div>
  )
}
