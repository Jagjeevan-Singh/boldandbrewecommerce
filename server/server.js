import express from 'express'
import fetch from 'node-fetch'
import Razorpay from 'razorpay'
import dotenv from 'dotenv'
import cors from 'cors'
import sendOrderEmail from '../api/sendOrderEmail.js'

dotenv.config()

const app = express()
const PORT = process.env.PORT || 3001

app.use(cors({ origin: true }))
app.use(express.json())

const RAZORPAY_KEY_ID = process.env.RAZORPAY_KEY_ID || process.env.VITE_RAZORPAY_KEY_ID
const RAZORPAY_KEY_SECRET = process.env.RAZORPAY_KEY_SECRET

if (!RAZORPAY_KEY_ID || !RAZORPAY_KEY_SECRET) {
	console.warn('Warning: RAZORPAY_KEY_ID or RAZORPAY_KEY_SECRET is not set. Please add them in .env')
}

app.get('/health', (_req, res) => res.json({ status: 'ok' }))

// Forward Standard Checkout Preferences to Razorpay with Basic Auth
app.post('/api/razorpay/preferences', async (req, res) => {
	try {
		if (!RAZORPAY_KEY_ID || !RAZORPAY_KEY_SECRET) {
			return res.status(500).json({ error: 'Razorpay keys not configured on server' })
		}

		const payload = req.body || {}
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
			return res.status(response.status).json({ error: data })
		}
		return res.status(200).json(data)
	} catch (err) {
		console.error('Error forwarding to Razorpay:', err)
		return res.status(500).json({ error: 'internal_server_error' })
	}
})

// Create order via Razorpay SDK
app.post('/api/razorpay/create-order', async (req, res) => {
	try {
		if (!RAZORPAY_KEY_ID || !RAZORPAY_KEY_SECRET) {
			return res.status(500).json({ error: 'Razorpay keys not configured on server' })
		}
		const { amount = 100, currency = 'INR', receipt = `rcpt_${Date.now()}` } = req.body || {}
		const amtNumber = Number(amount)
		if (!Number.isFinite(amtNumber)) {
			return res.status(400).json({ error: 'invalid_amount' })
		}
		// Razorpay expects amount in paise
		const amountInPaise = Math.round(amtNumber * 100)
		const razorpay = new Razorpay({ key_id: RAZORPAY_KEY_ID, key_secret: RAZORPAY_KEY_SECRET })
		const order = await razorpay.orders.create({ amount: amountInPaise, currency, receipt })
		return res.status(200).json(order)
	} catch (err) {
		console.error('Error creating Razorpay order:', err)
		return res.status(500).json({ error: 'failed_to_create_order', details: err.message })
	}
})

// Send order confirmation email
app.post('/api/send-order-email', async (req, res) => {
	try {
		await sendOrderEmail(req, res)
	} catch (err) {
		console.error('Error in send-order-email route:', err)
		res.status(500).json({ error: 'internal_server_error' })
	}
})

app.listen(PORT, () => {
	console.log(`Razorpay proxy server listening on http://localhost:${PORT}`)
})
