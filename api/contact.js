module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS, GET')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
  if (req.method === 'OPTIONS') return res.status(200).end()

  const NOTION_TOKEN = process.env.NOTION_TOKEN
  const NOTION_DB_ID = process.env.NOTION_DB_ID

  // GET: retorna las propiedades reales de la base de datos
  if (req.method === 'GET') {
    const r = await fetch(`https://api.notion.com/v1/databases/${NOTION_DB_ID}`, {
      headers: {
        'Authorization': `Bearer ${NOTION_TOKEN}`,
        'Notion-Version': '2022-06-28'
      }
    })
    const data = await r.json()
    const props = Object.keys(data.properties || {})
    return res.status(200).json({ properties: props, raw: data.properties })
  }

  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  let body = req.body
  if (typeof body === 'string') {
    try { body = JSON.parse(body) } catch { body = {} }
  }
  body = body || {}

  const { nombre, email, telefono, empresa, tipo_consulta, mensaje } = body

  if (!nombre || !email) {
    return res.status(400).json({ error: 'Nombre y email requeridos' })
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
        'Telefono': {
          phone_number: telefono || null
        },
        'Empresa': {
          select: { name: empresa || 'GV Inmobiliaria' }
        },
        'Tipo de consulta': {
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
    console.log('Notion status:', response.status)
    console.log('Notion response:', JSON.stringify(responseData))

    if (!response.ok) {
      return res.status(500).json({ error: 'Error Notion', detail: responseData })
    }

    return res.status(200).json({ success: true })

  } catch (error) {
    console.error('Error:', error.message)
    return res.status(500).json({ error: error.message })
  }
}
