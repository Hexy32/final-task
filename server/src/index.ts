import { WebSocketServer } from 'ws'
import { broadcast, setUsername } from './utils'

const PORT = 3000
const DEFAULT_USERNAME = 'Anonymous'
export const USERNAME_REGEX = /^username:([a-zA-Z0-9]+)?$/

const wss = new WebSocketServer({ port: PORT })
export const names = new Set()

wss.on('listening', () => {
  console.log(`Listening on port ${PORT}`)
})

wss.on('connection', ws => {
  let username = DEFAULT_USERNAME
  console.log('Connected to client')

  ws.on('error', console.error)

  ws.on('message', data => {
    console.log(`Received ${data} from ${username}`)

    const sterilizedData = data.toString()

    if (sterilizedData.trim() === '') return

    if (sterilizedData.startsWith('username:')) {
      const newUsername = setUsername(ws, sterilizedData)

      if (newUsername) {
        broadcast(wss, `${username} has changed their username to ${newUsername}.`)
        username = newUsername
      }

      return
    }

    ws.on('close', () => {
      console.log(`${username} has disconnected!`)
    })

    ws.on('ping', () => {
      console.log('ping')
    })

    broadcast(wss, `${username}: ${sterilizedData}`, { includeSelf: false, ws })
  })

  const numberOfClients = wss.clients.size

  broadcast(
    wss,
    `${username} has joined! ${numberOfClients} ${numberOfClients === 1 ? 'User' : 'Users'} Online.`
  )
})
