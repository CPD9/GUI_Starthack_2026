"use client";

import { LoaderIcon } from "lucide-react";
import { useEffect, useMemo } from "react";
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

  const client = useMemo(
    () =>
      new StreamVideoClient({
      apiKey: process.env.NEXT_PUBLIC_STREAM_VIDEO_API_KEY!,
      user: {
        id: userId,
        name: userName,
        image: userImage,
      },
      tokenProvider: generateToken,
    }),
    [userId, userName, userImage, generateToken]
  );
  useEffect(() => {
    return () => {
      client.disconnectUser();
    };
  }, [client]);

  const call = useMemo<Call>(() => {
    const nextCall = client.call("default", meetingId);
    nextCall.camera.disable();
    nextCall.microphone.disable();
    return nextCall;
  }, [client, meetingId]);

  useEffect(() => {
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
