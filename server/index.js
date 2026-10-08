// Local server entry — runs the Express app on a port (npm run server / npm start).
import { createApp } from './app.js'

const PORT = process.env.PORT || 8787
createApp().listen(PORT, process.env.HOST || '127.0.0.1', () =>
  console.log(`Windesign OS API → http://localhost:${PORT}  (Turso connected)`)
)
