"use client"

import { useState, useEffect } from "react"
import { useSelector } from "react-redux"
import VideoCall from "./VideoCall"

const VideoCallModal = () => {
  const { socket } = useSelector((state) => state.socket)
  const [activeCall, setActiveCall] = useState(null)

  useEffect(() => {
    if (socket) {
      socket.on("call:incoming", handleIncomingCall)
      socket.on("call:initiated", handleCallInitiated)

      return () => {
        socket.off("call:incoming", handleIncomingCall)
        socket.off("call:initiated", handleCallInitiated)
      }
    }
  }, [socket])

  const handleIncomingCall = (data) => {
    setActiveCall({
      ...data,
      isIncoming: true,
    })
  }

  const handleCallInitiated = (data) => {
    setActiveCall({
      ...data,
      isIncoming: false,
    })
  }

  const handleCallEnd = () => {
    setActiveCall(null)
  }

  if (!activeCall) return null

  return (
    <VideoCall
      callId={activeCall.callId}
      isIncoming={activeCall.isIncoming}
      caller={activeCall.caller}
      onEnd={handleCallEnd}
    />
  )
}

export default VideoCallModal
