import { Server, WebSocket } from 'ws'
import { USERNAME_REGEX, names } from '.'

/**
 * Attempts to create a username for a WebSocket client. Performs validation and
 * checks for existing usernames.
 *
 * @param ws - The WebSocket client connection.
 * @param data - The raw data string sent by the client, expected format: "username:{desired_username}"
 * @returns The newly made username if successful, otherwise undefined.
 */
export function createUsername(ws: WebSocket, data: string) {
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

/**
 * Broadcasts a message to all connected clients on a WebSocket server.
 *
 * @param wss - The WebSocket server instance (from the 'ws' library).
 * @param message - The message string to be broadcast.
 * @param opts - Optional configuration object:
 *   * `includeSelf`: boolean, whether to include the originating client in the broadcast (defaults to false).
 *   * `ws`: WebSocket, the specific client that initiated the broadcast (used with `includeSelf: false`).
 */
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
