import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export async function POST(req: NextRequest) {
  try {
    const { imageBase64, mediaType, imageUrl } = await req.json()

    let base64Data = imageBase64
    let mimeType: 'image/jpeg' | 'image/png' | 'image/gif' | 'image/webp' = 'image/jpeg'

    if (imageUrl && !imageBase64) {
      const imgResponse = await fetch(imageUrl)
      if (!imgResponse.ok) throw new Error(`HTTP ${imgResponse.status}`)
      const arrayBuffer = await imgResponse.arrayBuffer()
      base64Data = Buffer.from(arrayBuffer).toString('base64')
      const ct = imgResponse.headers.get('content-type') || 'image/jpeg'
      if (ct.includes('png')) mimeType = 'image/png'
    }

    if (!base64Data) throw new Error('No image data')
    if (mediaType?.includes('png')) mimeType = 'image/png'

    console.log(`base64 length: ${base64Data.length}`)

    const response = await client.messages.create({
      model: 'claude-opus-4-5',
      max_tokens: 2000,
      messages: [{
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
            text: `אתה מומחה בקריאת כתב יד עברי ישן ובחילוץ מתכונים.

המשימה: קרא את תמונת המתכון הכתוב בכתב יד עברי וחלץ את המידע.

כללים מחמירים:
- העתק את הטקסט בדיוק כפי שכתוב — אין להמציא, אין להוסיף, אין להשלים
- אם מילה לא ברורה — כתוב אותה כפי שנראית, גם אם לא מושלמת
- אם שדה לא קיים בתמונה — השאר ריק ""
- אין לכתוב מתכון מהזיכרון שלך — רק מה שכתוב בתמונה

החזר JSON בלבד, ללא טקסט נוסף:
{
  "title": "שם המתכון כפי שכתוב בכותרת",
  "category": "בחר מתוך: עוגות ומאפים / מרקים / סלטים / בשר ועוף / דגים / ירקות / קטניות / פסטה ואורז / קינוחים / שתייה / ממרחים / אחר",
  "ingredients": "רשימת המרכיבים כפי שכתובים, שורה לכל מרכיב",
  "instructions": "הוראות ההכנה כפי שכתובות",
  "prep_time": "זמן הכנה אם כתוב, אחרת ריק",
  "servings": "מספר מנות אם כתוב, אחרת ריק"
}`,
          },
        ],
      }],
    })

    const text = response.content[0].type === 'text' ? response.content[0].text : ''
    const parsed = JSON.parse(text.replace(/```json|```/g, '').trim())
    return NextResponse.json({ success: true, recipe: parsed })
  } catch (error) {
    console.error('OCR error:', error)
    return NextResponse.json({ success: false, error: 'שגיאה בסריקה' }, { status: 500 })
  }
}
