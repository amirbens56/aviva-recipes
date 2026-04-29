import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export async function POST(req: NextRequest) {
  try {
    const { imageBase64, mediaType } = await req.json()

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
                media_type: mediaType || 'image/jpeg',
                data: imageBase64,
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
