import WebSocket from 'ws'
import express from 'express'

const app = express()
const port = 3000

// Create a WebSocket server on top of the HTTP server
const wss = new WebSocket.Server({
  server: app.listen(port, () => {
    console.log(`WebSocket server listening on port ${port}`)
  }),
})

// Handle client connections
wss.on('connection', ws => {
  console.log('Client connected')

  // Handle incoming messages
  ws.on('message', message => {
    console.log(`Received message: ${message}`)

    // Broadcast the message to all connected clients (optional)
    wss.clients.forEach(client => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(message)
      }
    })
  })

  // Handle client disconnection (optional)
  ws.on('close', () => {
    console.log('Client disconnected')
  })
})
