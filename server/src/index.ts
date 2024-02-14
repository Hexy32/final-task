import { broadcast, setUsername } from './utils'

import { WebSocketServer } from 'ws'

const PORT = 3000
const KEEP_ALIVE_TIME = 5000 // in ms
const DEFAULT_USERNAME = 'Anonymous'
export const USERNAME_REGEX = /^username:([a-zA-Z0-9]+)?$/

const wss = new WebSocketServer({ port: PORT })
export const names = new Set()

wss.on('listening', () => {
  console.log(`Listening on port ${PORT}`)
})

wss.on('connection', ws => {
  let username = DEFAULT_USERNAME
  let isAlive = true

  const numberOfClients = wss.clients.size

  ws.on('error', console.error)

  const interval = setInterval(() => {
    ws.ping()

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
    isAlive = false
  }, KEEP_ALIVE_TIME)

  ws.on('pong', () => {
    isAlive = true
  })

  ws.on('message', data => {
    console.log(`Received ${data} from ${username}`)

    const sterilizedData = data.toString()

    if (sterilizedData.trim() === '') return

    if (sterilizedData.startsWith('username:')) {
      const newUsername = setUsername(ws, sterilizedData)

      if (newUsername) {
        broadcast(wss, `${username} has changed their username to ${newUsername}.`)
        names.delete(username)
        username = newUsername
      }

      return
    }

    ws.on('close', () => {
      console.log(`${username} has disconnected!`)
    })

    broadcast(wss, `${username}: ${sterilizedData}`, { includeSelf: false, ws })
    ws.send(`${username} (You): ${sterilizedData}`)
  })

  const joinMessage = `${username} has joined! ${numberOfClients} ${
    numberOfClients === 1 ? 'User' : 'Users'
  } Online.`

  console.log(joinMessage)

  broadcast(wss, joinMessage)
})
