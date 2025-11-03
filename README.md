# React + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.
## Razorpay server proxy (secure setup)

This project includes a small Express proxy server under `server/` to securely call Razorpay APIs from the server side (so secrets are never exposed to the browser).

Quick steps to get it running locally:

1. Copy `.env.example` to `.env` and set your real keys:

	RAZORPAY_KEY_ID=rzp_test_xxx
	RAZORPAY_KEY_SECRET=your_secret_here

2. Start the server:

	# from project root
	cd server
	npm install
	npm start

3. The server listens on port 4000 by default and exposes:

	- GET /health — simple health check
	- POST /api/razorpay/preferences — forward a preference payload to Razorpay using Basic Auth

Frontend usage (example):

```js
import { createRazorpayPreference } from './api/razorpay'

const payload = { preference: { /* your preference object */ } }
const response = await createRazorpayPreference(payload)
console.log(response)
```

Security notes:

- Do NOT put your `RAZORPAY_KEY_SECRET` into frontend code or in the public repository.
- If you suspect the secret was committed previously, rotate the key in the Razorpay dashboard immediately and remove the secret from git history.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Babel](https://babeljs.io/) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## Expanding the ESLint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.
