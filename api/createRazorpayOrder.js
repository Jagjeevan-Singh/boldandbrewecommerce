// Minimal stub to keep Vercel build happy without server-only dependencies.
export default async function handler(req, res) {
	if (req.method === 'OPTIONS') {
		res.setHeader('Access-Control-Allow-Origin', '*');
		res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
		res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
		return res.status(204).end();
	}

	res.setHeader('Access-Control-Allow-Origin', '*');
	return res.status(501).json({
		error: 'Disabled on this deployment',
		message: 'Server-side order creation is not enabled here.'
	});
}