using System.Net.WebSockets;
using System.Text;

string webSocketUri = "ws://localhost:3000";

using (var client = new ClientWebSocket())
{
    client.Options.KeepAliveInterval = TimeSpan.Zero; // Disable client's built-in KeepAlive

    await client.ConnectAsync(new Uri(webSocketUri), CancellationToken.None);

    // --- Receiving from server ---

    // Start a continuous receive loop in a separate task
    _ = Task.Run(async () =>
   {
       var receiveBuffer = new byte[1024];
       while (client.State == WebSocketState.Open)
       {
           try
           {

               var result = await client.ReceiveAsync(
                   new ArraySegment<byte>(receiveBuffer), CancellationToken.None);

               if (result.MessageType == WebSocketMessageType.Close)
               {
                   Console.WriteLine("Server closed the connection");
                   break;
               }
               else if (result.MessageType == WebSocketMessageType.Text)
               {
                   var message = Encoding.UTF8.GetString(receiveBuffer, 0, result.Count);
                   Console.WriteLine(message);
               }
           }
           catch (WebSocketException ex)
           {
               Console.WriteLine($"WebSocket Error: {ex.Message}");
               Environment.Exit(1);
           }
       }
   });

    // --- Sending to server ---

    Console.WriteLine("Press Enter to send a message, type 'username:{new_username}` to change usernames, or type 'exit' to quit.");
    string? input;

    do
    {
        input = Console.ReadLine();

        if (input != null && input.ToLower() != "exit")
        {
            var messageBytes = Encoding.UTF8.GetBytes(input);
            await client.SendAsync(
                new ArraySegment<byte>(messageBytes),
                WebSocketMessageType.Text,
                true, // End of message
                CancellationToken.None);
        }
    } while (input == null || input.ToLower() != "exit");
}
