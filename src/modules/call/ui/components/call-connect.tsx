"use client";

import { LoaderIcon } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import {
  Call,
  CallingState,
  StreamCall,
  StreamVideo,
  StreamVideoClient,
} from "@stream-io/video-react-sdk";

import { useTRPC } from "@/trpc/client";

import "@stream-io/video-react-sdk/dist/css/styles.css";
import { CallUI } from "./call-ui";

interface Props {
  meetingId: string;
  meetingName: string;
  userId: string;
  userName: string;
  userImage: string;
};

export const CallConnect = ({
  meetingId,
  meetingName,
  userId,
  userName,
  userImage,
}: Props) => {
  const trpc = useTRPC();
  const { mutateAsync: generateToken } = useMutation(
    trpc.meetings.generateToken.mutationOptions(),
  );

  const generateTokenRef = useRef(generateToken);
  generateTokenRef.current = generateToken;

  const [client, setClient] = useState<StreamVideoClient | null>(null);

  useEffect(() => {
    let cancelled = false;
    let clientToCleanup: StreamVideoClient | null = null;

    const init = async () => {
      try {
        const token = await generateTokenRef.current();
        if (cancelled) return;

        const tokenProvider = async () => generateTokenRef.current();

        const newClient = new StreamVideoClient({
          apiKey: process.env.NEXT_PUBLIC_STREAM_VIDEO_API_KEY!,
          user: {
            id: userId,
            name: userName,
            image: userImage,
          },
          token,
          tokenProvider,
        });

        clientToCleanup = newClient;

        if (cancelled) {
          newClient.disconnectUser().catch(console.error);
          return;
        }

        setClient(newClient);
      } catch (err) {
        if (!cancelled) console.error("Failed to initialize Stream client", err);
      }
    };

    init();

    return () => {
      cancelled = true;
      if (clientToCleanup) {
        clientToCleanup.disconnectUser().catch(console.error);
      }
      setClient(null);
    };
  }, [userId, userName, userImage]);

  const call = useMemo<Call | null>(() => {
    if (!client) return null;
    const nextCall = client.call("default", meetingId);
    nextCall.camera.disable();
    nextCall.microphone.disable();
    return nextCall;
  }, [client, meetingId]);

  useEffect(() => {
    if (!call) return;
    return () => {
      if (call.state.callingState !== CallingState.LEFT) {
        call.leave();
        call.endCall();
      }
    };
  }, [call]);

  if (!client || !call) {
    return (
      <div className="flex h-screen items-center justify-center bg-radial from-sidebar-accent to-sidebar">
        <LoaderIcon className="size-6 animate-spin text-white" />
      </div>
    );
  }

  return (
    <StreamVideo client={client}>
      <StreamCall call={call}>
        <CallUI meetingName={meetingName} />
      </StreamCall>
    </StreamVideo>
  );
};
