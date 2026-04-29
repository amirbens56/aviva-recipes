import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export async function POST(req: NextRequest) {
  try {
    const { imageBase64, mediaType } = await req.json()
    if (!imageBase64) throw new Error('No image data')
    
    console.log(`base64 length: ${imageBase64.length}`)

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
              media_type: (mediaType || 'image/jpeg') as 'image/jpeg' | 'image/png' | 'image/gif' | 'image/webp',
              data: imageBase64,
            },
          },
          {
            type: 'text',
            text: `סרוק את תמונת המתכון הכתוב בכתב יד וחלץ את המידע בפורמט JSON בלבד.
חוקים: העתק בדיוק מה שכתוב, אל תמציא, אם לא ברור — ריק.
{
  "title": "שם המתכון",
  "category": "קטגוריה מתוך: עוגות ומאפים, מרקים, סלטים, בשר ועוף, דגים, ירקות, קטניות, פסטה ואורז, קינוחים, שתייה, ממרחים, אחר",
  "ingredients": "מרכיבים",
  "instructions": "הוראות",
  "prep_time": "זמן הכנה",
  "servings": "מנות"
}
ענה JSON בלבד.`,
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
