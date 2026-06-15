// Vercel Serverless Function — all /api/* requests are routed here (see vercel.json).
// The Express app is a valid (req, res) handler.
import { createApp } from '../server/app.js'

export default createApp()
