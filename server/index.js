// Local server entry — runs the Express app on a port (npm run server / npm start).
import { createApp } from './app.js'

const PORT = process.env.PORT || 8787
createApp().listen(PORT, () =>
  console.log(`Windesign OS API → http://localhost:${PORT}  (Turso connected)`)
)
