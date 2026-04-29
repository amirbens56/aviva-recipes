import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { imageUrl, imageBase64, mediaType } = body

    let base64Data: string
    let mimeType: 'image/jpeg' | 'image/png' | 'image/gif' | 'image/webp' = 'image/jpeg'

    if (imageUrl) {
      // הורדת תמונה מ-URL
      const imgResponse = await fetch(imageUrl)
      if (!imgResponse.ok) throw new Error(`HTTP ${imgResponse.status}`)
      const arrayBuffer = await imgResponse.arrayBuffer()
      if (!arrayBuffer || arrayBuffer.byteLength === 0) throw new Error('Empty image buffer')
      base64Data = Buffer.from(arrayBuffer).toString('base64')
      const ct = imgResponse.headers.get('content-type') || 'image/jpeg'
      if (ct.includes('png')) mimeType = 'image/png'
      else if (ct.includes('webp')) mimeType = 'image/webp'
      console.log(`Image fetched: ${arrayBuffer.byteLength} bytes, type: ${mimeType}`)
    } else if (imageBase64) {
      // base64 ישיר
      base64Data = imageBase64
      if (mediaType?.includes('png')) mimeType = 'image/png'
    } else {
      throw new Error('No image provided')
    }

    if (!base64Data || base64Data.length === 0) throw new Error('Empty base64 data')

    const response = await client.messages.create({
      model: 'claude-sonnet-4-5',
      max_tokens: 2000,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'image',
              source: {
                type: 'base64',
                media_type: mimeType,
                data: base64Data,
              },
            },
            {
              type: 'text',
              text: `סרוק את תמונת המתכון הכתוב בכתב יד וחלץ את המידע הבא בפורמט JSON בלבד (ללא טקסט נוסף).

חוקים חשובים:
1. העתק את הטקסט כפי שהוא כתוב — אל תוסיף, אל תמציא, אל תשלים מידע חסר.
2. אם שדה לא ברור או לא קיים — השאר ריק לחלוטין ("").
3. אל תנחש — רק מה שכתוב בתמונה.

{
  "title": "שם המתכון כפי שכתוב",
  "category": "קטגוריה (בחר מתוך: עוגות ומאפים, מרקים, סלטים, בשר ועוף, דגים, ירקות, קטניות, פסטה ואורז, קינוחים, שתייה, ממרחים, אחר) — אם לא ברור השאר ריק",
  "ingredients": "רשימת המרכיבים כפי שכתובים",
  "instructions": "הוראות הכנה כפי שכתובות",
  "prep_time": "זמן הכנה אם כתוב, אחרת ריק",
  "servings": "מספר מנות אם כתוב, אחרת ריק"
}

ענה ב-JSON בלבד.`,
            },
          ],
        },
      ],
    })

    const text = response.content[0].type === 'text' ? response.content[0].text : ''
    const clean = text.replace(/```json|```/g, '').trim()
    const parsed = JSON.parse(clean)

    return NextResponse.json({ success: true, recipe: parsed })
  } catch (error) {
    console.error('OCR error:', error)
    return NextResponse.json({ success: false, error: 'שגיאה בסריקה' }, { status: 500 })
  }
}
