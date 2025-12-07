// Frontend helper to call the server-side Razorpay proxy.
// Usage: import { createRazorpayPreference } from '../api/razorpay'
export async function createRazorpayPreference(payload) {
  const res = await fetch('/api/razorpay/preferences', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  })

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'unknown' }))
    throw new Error(err?.error?.message || JSON.stringify(err) || 'Request failed')
  }

  return await res.json()
}
