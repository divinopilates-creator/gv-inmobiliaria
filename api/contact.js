module.exports = async function handler(req, res) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
  if (req.method === 'OPTIONS') return res.status(200).end()
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const NOTION_TOKEN = process.env.NOTION_TOKEN
  const NOTION_DB_ID = process.env.NOTION_DB_ID

  const { nombre, email, telefono, empresa, tipo_consulta, mensaje } = req.body

  if (!nombre || !email) {
    return res.status(400).json({ error: 'Nombre y email son requeridos' })
  }

  try {
    const response = await fetch('https://api.notion.com/v1/pages', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${NOTION_TOKEN}`,
        'Content-Type': 'application/json',
        'Notion-Version': '2022-06-28'
      },
      body: JSON.stringify({
        parent: { database_id: NOTION_DB_ID },
        properties: {
          'Nombre': {
            title: [{ text: { content: nombre || '' } }]
          },
          'Email': {
            email: email || null
          },
          'Tel\u00e9fono': {
            phone_number: telefono || null
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
      })
    })

    if (!response.ok) {
      const err = await response.json()
      console.error('Notion error:', JSON.stringify(err))
      return res.status(500).json({ error: 'Error Notion', detail: err })
    }

    return res.status(200).json({ success: true })

  } catch (error) {
    console.error('Server error:', error.message)
    return res.status(500).json({ error: error.message })
  }
}
