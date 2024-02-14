import { Server, WebSocket } from 'ws'
import { USERNAME_REGEX, names } from '.'

export function setUsername(ws: WebSocket, data: string) {
  if (!USERNAME_REGEX.test(data)) {
    ws.send('Invalid username! Username must be alphanumeric.')
    return
  }

  const newUsername = data.split(':')[1]

  if (names.has(newUsername)) {
    ws.send("Username is taken! Try again by typing 'username:{new_username}'.")
  } else {
    names.add(newUsername)
    return newUsername
  }
}

export function broadcast(
  wss: Server<typeof WebSocket>,
  message: string,
  opts?: { includeSelf: false; ws: WebSocket } | { includeSelf: true }
) {
  wss.clients.forEach(function each(client) {
    // Return early to not broadcast to self.
    if (opts && !opts.includeSelf && client === opts.ws) return

    if (client.readyState === WebSocket.OPEN) {
      client.send(message)
    }
  })
}
