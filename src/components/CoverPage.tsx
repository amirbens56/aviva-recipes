'use client'

interface CoverPageProps {
  totalRecipes: number
  onOpen: () => void
}

export default function CoverPage({ totalRecipes, onOpen }: CoverPageProps) {
  return (
    <div
      className="book-page w-full flex flex-col items-center justify-center cursor-pointer select-none"
      style={{
        minHeight: 500,
        background: 'linear-gradient(135deg, #f5f0e8 0%, #e8d5b7 50%, #f5f0e8 100%)',
        border: '8px solid #8b4513',
        boxShadow: 'inset 0 0 40px rgba(139,69,19,0.2)',
        position: 'relative',
        overflow: 'hidden',
      }}
      onClick={onOpen}
    >
      {/* Decorative corners */}
      <div style={{ position: 'absolute', top: 12, right: 12, fontSize: 28, color: '#b8860b' }}>✦</div>
      <div style={{ position: 'absolute', top: 12, left: 12, fontSize: 28, color: '#b8860b' }}>✦</div>
      <div style={{ position: 'absolute', bottom: 12, right: 12, fontSize: 28, color: '#b8860b' }}>✦</div>
      <div style={{ position: 'absolute', bottom: 12, left: 12, fontSize: 28, color: '#b8860b' }}>✦</div>

      {/* Border frame */}
      <div style={{
        position: 'absolute', inset: 20,
        border: '2px solid #b8860b',
        pointerEvents: 'none',
      }} />

      <div className="text-center px-8 z-10">
        <div style={{ fontSize: 48, marginBottom: 8 }}>🍴</div>
        <h1 className="vintage-title text-5xl mb-3" style={{ color: '#5c3d2e', lineHeight: 1.2 }}>
          מתכונים של
        </h1>
        <h2 className="vintage-title text-3xl mb-6" style={{ color: '#8b4513' }}>
          סבתא אביבה
        </h2>
        <div style={{ width: 80, height: 2, background: '#b8860b', margin: '0 auto 20px' }} />
        <p style={{ color: '#8b4513', fontFamily: 'Frank Ruhl Libre, serif', fontSize: 16 }}>
          {totalRecipes} מתכונים מסורתיים
        </p>
        <p style={{ color: '#b8860b', fontSize: 13, marginTop: 24, fontStyle: 'italic' }}>
          לחץ לפתיחת הספר
        </p>
      </div>
    </div>
  )
}
