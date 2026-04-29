import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import sharp from 'sharp'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export async function POST(req: NextRequest) {
  try {
    const { imageUrl } = await req.json()
    if (!imageUrl) throw new Error('No image URL provided')

    // הורדת התמונה
    const imgResponse = await fetch(imageUrl)
    if (!imgResponse.ok) throw new Error(`HTTP ${imgResponse.status}`)
    const arrayBuffer = await imgResponse.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)
    console.log(`Image fetched: ${buffer.length} bytes`)

    // כיווץ ל-1200px מקסימום, JPEG איכות 85
    const compressed = await sharp(buffer)
      .resize(1200, 1200, { fit: 'inside', withoutEnlargement: true })
      .jpeg({ quality: 85 })
      .toBuffer()
    
    console.log(`Compressed: ${compressed.length} bytes`)
    const base64Data = compressed.toString('base64')

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
                media_type: 'image/jpeg',
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
