import { broadcast, createUsername } from './utils'

import { WebSocketServer } from 'ws'

// --- Config ---

const PORT = 3000
const KEEP_ALIVE_TIME = 5000 // in ms
const DEFAULT_USERNAME = 'Anonymous'
export const USERNAME_REGEX = /^username:([a-zA-Z0-9]+)?$/

// --- Create Socket ---

const wss = new WebSocketServer({ port: PORT })
// This is to ensure there are no repeat usernames
export const names = new Set()

wss.on('listening', () => {
  console.log(`Listening on port ${PORT}`)
})

wss.on('connection', ws => {
  let username = DEFAULT_USERNAME
  let isAlive = true

  const numberOfClients = wss.clients.size

  ws.on('error', err => {
    console.error(err)
    names.delete(username)
    ws.terminate()
  })

  const interval = setInterval(() => {
    // Send the ping as early as possible since we will be waiting for the "pong"
    ws.ping()

    // Disconnect user and cleanup
    if (!isAlive) {
      const leaveMessage = `${username} has left! ${numberOfClients} ${
        numberOfClients === 1 ? 'User' : 'Users'
      } Online.`

      names.delete(username)

      console.log(leaveMessage)
      broadcast(wss, leaveMessage)

      ws.terminate()
      clearInterval(interval)
    }

    // Assume the connection isn't alive, this should be overwritten by the "pong"
    isAlive = false
  }, KEEP_ALIVE_TIME)

  ws.on('pong', () => {
    isAlive = true
  })

  // I chose to use guard clauses to keep from doing excessive nesting
  ws.on('message', data => {
    try {
      console.log(`Received ${data} from ${username}`)

      const sData = data.toString()

      if (sData.trim() === '') return

      if (sData.startsWith('username:')) {
        const newUsername = createUsername(ws, sData)

        if (newUsername) {
          broadcast(wss, `${username} has changed their username to ${newUsername}.`)
          names.delete(username)
          username = newUsername
        }

        return
      }

      ws.on('close', () => {
        isAlive = false
        console.log(`${username} has disconnected!`)
      })

      broadcast(wss, `${username}: ${sData}`, { includeSelf: false, ws })
      ws.send(`${username} (You): ${sData}`)
    } catch (err) {
      console.error(err)
      ws.send('An error occurred on the server. Please try again.')
    }
  })

  const joinMessage = `${username} has joined! ${numberOfClients} ${
    numberOfClients === 1 ? 'User' : 'Users'
  } Online.`

  console.log(joinMessage)
  broadcast(wss, joinMessage)
})
