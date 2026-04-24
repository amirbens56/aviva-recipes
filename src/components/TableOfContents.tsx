'use client'

import { Recipe } from '@/lib/supabase'

interface Props {
  recipes: Recipe[]
  onSelect: (category: string, index: number) => void
}

const CATEGORIES = ['עוגות ומאפים','מרקים','סלטים','בשר ועוף','דגים','ירקות','קטניות','פסטה ואורז','קינוחים','שתייה','ממרחים','אחר']

export default function TableOfContents({ recipes, onSelect }: Props) {
  const grouped = CATEGORIES.reduce((acc, cat) => {
    const items = recipes.filter(r => r.category === cat)
    if (items.length > 0) acc[cat] = items
    return acc
  }, {} as Record<string, Recipe[]>)

  return (
    <div
      className="book-page mx-auto rounded-sm overflow-hidden"
      style={{
        maxWidth: 600,
        minHeight: 500,
        padding: '32px 28px',
        boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
      }}
    >
      <h2 className="vintage-title text-3xl text-center mb-2" style={{ color: '#5c3d2e' }}>
        תוכן עניינים
      </h2>
      <div style={{ width: 80, height: 2, background: '#b8860b', margin: '0 auto 24px' }} />

      {Object.keys(grouped).length === 0 ? (
        <p className="text-center" style={{ color: '#8b4513' }}>אין מתכונים עדיין</p>
      ) : (
        Object.entries(grouped).map(([cat, items]) => (
          <div key={cat} className="mb-5">
            <h3 className="vintage-title text-base mb-2" style={{ color: '#8b4513', borderBottom: '1px solid rgba(139,69,19,0.3)', paddingBottom: 4 }}>
              ✦ {cat}
            </h3>
            {items.map((recipe, i) => {
              const globalIdx = recipes.findIndex(r => r.id === recipe.id)
              return (
                <button
                  key={recipe.id}
                  onClick={() => onSelect(cat, globalIdx)}
                  className="w-full flex justify-between items-center py-1 px-2 hover:bg-amber-100 rounded transition-all text-right"
                >
                  <span style={{ color: '#8b4513', fontSize: 12 }}>{globalIdx + 1}</span>
                  <span style={{ color: '#2c1810', fontSize: 14, fontFamily: 'Frank Ruhl Libre, serif', flex: 1, textAlign: 'right', paddingRight: 8 }}>
                    {recipe.title}
                  </span>
                </button>
              )
            })}
          </div>
        ))
      )}
    </div>
  )
}
