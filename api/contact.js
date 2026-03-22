module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
  if (req.method === 'OPTIONS') return res.status(200).end()
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  // Parsear body si viene como string
  let body = req.body
  if (typeof body === 'string') {
    try { body = JSON.parse(body) } catch { body = {} }
  }
  body = body || {}

  const NOTION_TOKEN = process.env.NOTION_TOKEN
  const NOTION_DB_ID = process.env.NOTION_DB_ID

  console.log('Token exists:', !!NOTION_TOKEN)
  console.log('DB ID exists:', !!NOTION_DB_ID)
  console.log('Body:', JSON.stringify(body))

  const { nombre, email, telefono, empresa, tipo_consulta, mensaje } = body

  if (!nombre || !email) {
    return res.status(400).json({ error: 'Nombre y email requeridos', body })
  }

  try {
    const notionBody = {
      parent: { database_id: NOTION_DB_ID },
      properties: {
        'Nombre': {
          title: [{ text: { content: nombre || '' } }]
        },
        'Email': {
          email: email || null
        },
        'Empresa': {
          select: { name: empresa || 'GV Inmobiliaria' }
        },
        'Tipo consulta': {
          select: { name: tipo_consulta || 'Consulta general' }
        },
        'Mensaje': {
          rich_text: [{ text: { content: mensaje || '' } }]
        },
        'Fecha': {
          date: { start: new Date().toISOString().split('T')[0] }
        },
        'Estado': {
          select: { name: 'Nuevo' }
        }
      }
    }

    // Agregar teléfono solo si tiene valor
    if (telefono) {
      notionBody.properties['Tel\u00e9fono'] = { phone_number: telefono }
    }

    console.log('Sending to Notion:', JSON.stringify(notionBody))

    const response = await fetch('https://api.notion.com/v1/pages', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${NOTION_TOKEN}`,
        'Content-Type': 'application/json',
        'Notion-Version': '2022-06-28'
      },
      body: JSON.stringify(notionBody)
    })

    const responseData = await response.json()
    console.log('Notion response status:', response.status)
    console.log('Notion response:', JSON.stringify(responseData))

    if (!response.ok) {
      return res.status(500).json({ error: 'Error Notion', detail: responseData })
    }

    return res.status(200).json({ success: true })

  } catch (error) {
    console.error('Server error:', error.message)
    return res.status(500).json({ error: error.message })
  }
}
