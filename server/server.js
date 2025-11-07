import express from 'express'
import fetch from 'node-fetch'
import dotenv from 'dotenv'
import cors from 'cors'

dotenv.config()

const app = express()
const PORT = process.env.PORT || 3000

app.use(cors())
app.use(express.json())

const RAZORPAY_KEY_ID = process.env.RAZORPAY_KEY_ID
const RAZORPAY_KEY_SECRET = process.env.RAZORPAY_KEY_SECRET

if (!RAZORPAY_KEY_ID || !RAZORPAY_KEY_SECRET) {
  console.warn('Warning: RAZORPAY_KEY_ID or RAZORPAY_KEY_SECRET is not set. Please create a .env with these values.')
}

app.get('/health', (_req, res) => res.json({ status: 'ok' }))

/**
 * POST /api/razorpay/preferences
 * Body: the payload you want to forward to Razorpay (preference object)
 * The server adds Basic Auth using RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET
 */
app.post('/api/razorpay/preferences', async (req, res) => {
  try {
    if (!RAZORPAY_KEY_ID || !RAZORPAY_KEY_SECRET) {
      return res.status(500).json({ error: 'Razorpay keys not configured on server' })
    }

    const payload = req.body || {}

    // Basic auth
    const auth = Buffer.from(`${RAZORPAY_KEY_ID}:${RAZORPAY_KEY_SECRET}`).toString('base64')

    const response = await fetch('https://api.razorpay.com/v2/standard_checkout/preferences', {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${auth}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    })

    const data = await response.json()
    if (!response.ok) {
      // forward error status and body
      return res.status(response.status).json({ error: data })
    }

    return res.status(200).json(data)
  } catch (err) {
    console.error('Error forwarding to Razorpay:', err)
    return res.status(500).json({ error: 'internal_server_error' })
  }
})

app.listen(PORT, () => {
  console.log(`Razorpay proxy server listening on http://localhost:${PORT}`)
})
