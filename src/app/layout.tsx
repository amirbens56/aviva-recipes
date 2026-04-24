import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'ספר המתכונים של אביבה',
  description: 'ספר מתכונים משפחתי',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="he" dir="rtl">
      <body>{children}</body>
    </html>
  )
}
