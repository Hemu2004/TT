"use client"

import { useState, useEffect, useRef } from "react"
import { useSelector } from "react-redux"
import { Phone, PhoneOff, Mic, MicOff, Video, VideoOff, Monitor } from "lucide-react"
import { Button } from "./ui/button"
import { Card } from "./ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar"
import { toast } from "sonner"

const VideoCall = ({ callId, isIncoming, caller, onEnd }) => {
  const { socket } = useSelector((state) => state.socket)
  const { user } = useSelector((state) => state.auth)

  const [callState, setCallState] = useState(isIncoming ? "incoming" : "connecting")
  const [isMuted, setIsMuted] = useState(false)
  const [isVideoOff, setIsVideoOff] = useState(false)
  const [isScreenSharing, setIsScreenSharing] = useState(false)

  const localVideoRef = useRef(null)
  const remoteVideoRef = useRef(null)
  const peerConnectionRef = useRef(null)
  const localStreamRef = useRef(null)

  useEffect(() => {
    if (socket && callId) {
      socket.on("call:offer", handleOffer)
      socket.on("call:answer", handleAnswer)
      socket.on("call:ice", handleIceCandidate)
      socket.on("call:ended", handleCallEnded)

      return () => {
        socket.off("call:offer", handleOffer)
        socket.off("call:answer", handleAnswer)
        socket.off("call:ice", handleIceCandidate)
        socket.off("call:ended", handleCallEnded)
      }
    }
  }, [socket, callId])

  useEffect(() => {
    if (callState === "accepted" || callState === "connecting") {
      initializeWebRTC()
    }

    return () => {
      cleanup()
    }
  }, [callState])

  const initializeWebRTC = async () => {
    try {
      // Get user media
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      })

      localStreamRef.current = stream
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream
      }

      // Create peer connection
      const peerConnection = new RTCPeerConnection({
        iceServers: [{ urls: "stun:stun.l.google.com:19302" }, { urls: "stun:stun1.l.google.com:19302" }],
      })

      peerConnectionRef.current = peerConnection

      // Add local stream to peer connection
      stream.getTracks().forEach((track) => {
        peerConnection.addTrack(track, stream)
      })

      // Handle remote stream
      peerConnection.ontrack = (event) => {
        if (remoteVideoRef.current) {
          remoteVideoRef.current.srcObject = event.streams[0]
        }
      }

      // Handle ICE candidates
      peerConnection.onicecandidate = (event) => {
        if (event.candidate && socket) {
          socket.emit("call:ice", {
            callId,
            targetUserId: caller?.id || user.id,
            candidate: event.candidate,
          })
        }
      }

      // If not incoming call, create offer
      if (!isIncoming) {
        const offer = await peerConnection.createOffer()
        await peerConnection.setLocalDescription(offer)

        socket.emit("call:offer", {
          callId,
          targetUserId: caller.id,
          sdp: offer,
        })
      }
    } catch (error) {
      console.error("Error initializing WebRTC:", error)
      toast.error("Failed to access camera/microphone")
      endCall()
    }
  }

  const handleOffer = async (data) => {
    if (data.callId !== callId) return

    try {
      const peerConnection = peerConnectionRef.current
      await peerConnection.setRemoteDescription(data.sdp)

      const answer = await peerConnection.createAnswer()
      await peerConnection.setLocalDescription(answer)

      socket.emit("call:answer", {
        callId,
        targetUserId: data.fromUserId,
        sdp: answer,
      })

      setCallState("connected")
    } catch (error) {
      console.error("Error handling offer:", error)
    }
  }

  const handleAnswer = async (data) => {
    if (data.callId !== callId) return

    try {
      await peerConnectionRef.current.setRemoteDescription(data.sdp)
      setCallState("connected")
    } catch (error) {
      console.error("Error handling answer:", error)
    }
  }

  const handleIceCandidate = async (data) => {
    if (data.callId !== callId) return

    try {
      await peerConnectionRef.current.addIceCandidate(data.candidate)
    } catch (error) {
      console.error("Error handling ICE candidate:", error)
    }
  }

  const handleCallEnded = () => {
    cleanup()
    onEnd()
  }

  const acceptCall = () => {
    setCallState("accepted")
  }

  const declineCall = () => {
    if (socket) {
      socket.emit("call:decline", { callId })
    }
    onEnd()
  }

  const endCall = () => {
    if (socket) {
      socket.emit("call:end", { callId })
    }
    cleanup()
    onEnd()
  }

  const toggleMute = () => {
    if (localStreamRef.current) {
      const audioTrack = localStreamRef.current.getAudioTracks()[0]
      if (audioTrack) {
        audioTrack.enabled = isMuted
        setIsMuted(!isMuted)
      }
    }
  }

  const toggleVideo = () => {
    if (localStreamRef.current) {
      const videoTrack = localStreamRef.current.getVideoTracks()[0]
      if (videoTrack) {
        videoTrack.enabled = isVideoOff
        setIsVideoOff(!isVideoOff)
      }
    }
  }

  const toggleScreenShare = async () => {
    try {
      if (!isScreenSharing) {
        const screenStream = await navigator.mediaDevices.getDisplayMedia({
          video: true,
          audio: true,
        })

        const videoTrack = screenStream.getVideoTracks()[0]
        const sender = peerConnectionRef.current.getSenders().find((s) => s.track && s.track.kind === "video")

        if (sender) {
          await sender.replaceTrack(videoTrack)
        }

        videoTrack.onended = () => {
          setIsScreenSharing(false)
          // Switch back to camera
          if (localStreamRef.current) {
            const cameraTrack = localStreamRef.current.getVideoTracks()[0]
            if (sender && cameraTrack) {
              sender.replaceTrack(cameraTrack)
            }
          }
        }

        setIsScreenSharing(true)
      } else {
        // Switch back to camera
        if (localStreamRef.current) {
          const cameraTrack = localStreamRef.current.getVideoTracks()[0]
          const sender = peerConnectionRef.current.getSenders().find((s) => s.track && s.track.kind === "video")

          if (sender && cameraTrack) {
            await sender.replaceTrack(cameraTrack)
          }
        }
        setIsScreenSharing(false)
      }
    } catch (error) {
      console.error("Error toggling screen share:", error)
      toast.error("Failed to share screen")
    }
  }

  const cleanup = () => {
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => track.stop())
    }
    if (peerConnectionRef.current) {
      peerConnectionRef.current.close()
    }
  }

  if (callState === "incoming") {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <Card className="p-6 text-center max-w-sm mx-4">
          <Avatar className="h-20 w-20 mx-auto mb-4">
            <AvatarImage src={caller?.avatarUrl || "/placeholder.svg"} />
            <AvatarFallback className="text-2xl">{caller?.name?.charAt(0)}</AvatarFallback>
          </Avatar>

          <h3 className="text-lg font-semibold mb-2">{caller?.name}</h3>
          <p className="text-gray-600 mb-6">Incoming video call...</p>

          <div className="flex space-x-4 justify-center">
            <Button onClick={declineCall} variant="destructive" size="lg" className="rounded-full p-4">
              <PhoneOff className="h-6 w-6" />
            </Button>
            <Button
              onClick={acceptCall}
              variant="default"
              size="lg"
              className="rounded-full p-4 bg-green-600 hover:bg-green-700"
            >
              <Phone className="h-6 w-6" />
            </Button>
          </div>
        </Card>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 bg-black z-50 flex flex-col">
      {/* Remote video */}
      <div className="flex-1 relative">
        <video ref={remoteVideoRef} autoPlay playsInline className="w-full h-full object-cover" />

        {/* Local video */}
        <div className="absolute top-4 right-4 w-32 h-24 bg-gray-800 rounded-lg overflow-hidden">
          <video ref={localVideoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
        </div>

        {/* Call status */}
        {callState !== "connected" && (
          <div className="absolute top-4 left-4 bg-black bg-opacity-50 text-white px-3 py-1 rounded">
            {callState === "connecting" ? "Connecting..." : "Ringing..."}
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="bg-black bg-opacity-80 p-4">
        <div className="flex justify-center space-x-4">
          <Button
            onClick={toggleMute}
            variant={isMuted ? "destructive" : "secondary"}
            size="lg"
            className="rounded-full p-4"
          >
            {isMuted ? <MicOff className="h-6 w-6" /> : <Mic className="h-6 w-6" />}
          </Button>

          <Button
            onClick={toggleVideo}
            variant={isVideoOff ? "destructive" : "secondary"}
            size="lg"
            className="rounded-full p-4"
          >
            {isVideoOff ? <VideoOff className="h-6 w-6" /> : <Video className="h-6 w-6" />}
          </Button>

          <Button
            onClick={toggleScreenShare}
            variant={isScreenSharing ? "default" : "secondary"}
            size="lg"
            className="rounded-full p-4"
          >
            <Monitor className="h-6 w-6" />
          </Button>

          <Button onClick={endCall} variant="destructive" size="lg" className="rounded-full p-4">
            <PhoneOff className="h-6 w-6" />
          </Button>
        </div>
      </div>
    </div>
  )
}

export default VideoCall
