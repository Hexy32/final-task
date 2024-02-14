using System.Net.WebSockets;
using System.Text;

string webSocketUri = "ws://localhost:3000";

using (var client = new ClientWebSocket())
{
    client.Options.KeepAliveInterval = TimeSpan.FromSeconds(30);

    await client.ConnectAsync(new Uri(webSocketUri), CancellationToken.None);


    // Start a continuous receive loop in a separate task
    _ = Task.Run(async () =>
   {
       var receiveBuffer = new byte[1024];
       while (client.State == WebSocketState.Open)
       {
           var result = await client.ReceiveAsync(
               new ArraySegment<byte>(receiveBuffer), CancellationToken.None);

           Console.WriteLine(result.MessageType);
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
   });

    // Keep console alive
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
