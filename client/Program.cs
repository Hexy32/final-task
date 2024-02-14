using System.Net.WebSockets;

string webSocketUri = "ws://localhost:3000";

using (var client = new ClientWebSocket())
{
  await client.ConnectAsync(new Uri(webSocketUri), CancellationToken.None);



  // Code to send and receive messages using `client.SendAsync()` and `client.ReceiveAsync()`
}