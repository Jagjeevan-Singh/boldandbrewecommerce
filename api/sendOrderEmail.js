export default async function sendOrderEmail(req, res) {
  console.log('Mock email sent');
  res.status(200).json({ success: true, message: 'Mock email sent' });
}
