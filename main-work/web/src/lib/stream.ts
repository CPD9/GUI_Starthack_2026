import { StreamChat } from "stream-chat";

let streamClient: StreamChat | null = null;

export const getStreamServerClient = () => {
  if (streamClient) {
    return streamClient;
  }

  const apiKey = process.env.NEXT_PUBLIC_STREAM_API_KEY;
  const apiSecret = process.env.STREAM_API_SECRET;

  if (!apiKey || !apiSecret) {
    throw new Error(
      "Stream credentials are missing. Set NEXT_PUBLIC_STREAM_API_KEY and STREAM_API_SECRET."
    );
  }

  streamClient = StreamChat.getInstance(apiKey, apiSecret);
  return streamClient;
};
