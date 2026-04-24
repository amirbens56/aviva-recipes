'use client'

import { useState } from 'react'

interface Props {
  onLogin: () => void
  onClose: () => void
}

export default function AdminLogin({ onLogin, onClose }: Props) {
  const [password, setPassword] = useState('')
  const [error, setError] = useState(false)

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (password === process.env.NEXT_PUBLIC_ADMIN_PASSWORD || password === 'aviva2024') {
      onLogin()
    } else {
      setError(true)
      setPassword('')
    }
  }

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50" dir="rtl">
      <div className="book-page rounded-sm p-8 w-full" style={{ maxWidth: 320 }}>
        <div className="flex justify-between items-center mb-4">
          <h2 className="vintage-title text-xl" style={{ color: '#5c3d2e' }}>כניסת מנהל</h2>
          <button onClick={onClose} style={{ color: '#8b4513' }}>✕</button>
        </div>
        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <input
            type="password"
            value={password}
            onChange={e => { setPassword(e.target.value); setError(false) }}
            placeholder="סיסמה"
            className="border border-amber-300 rounded px-3 py-2 text-sm bg-amber-50"
            autoFocus
          />
          {error && <p className="text-red-600 text-sm">סיסמה שגויה</p>}
          <button
            type="submit"
            className="py-2 bg-amber-800 text-white rounded hover:bg-amber-700 text-sm font-medium"
          >
            כניסה
          </button>
        </form>
      </div>
    </div>
  )
}
