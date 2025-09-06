import { createSlice } from "@reduxjs/toolkit"

const callSlice = createSlice({
  name: "call",
  initialState: {
    currentCall: null,
    incomingCall: null,
    localStream: null,
    remoteStream: null,
    peerConnection: null,
    callStatus: "idle", // idle, calling, ringing, connected, ended
    isVideoEnabled: true,
    isAudioEnabled: true,
    isScreenSharing: false,
  },
  reducers: {
    setCurrentCall: (state, action) => {
      state.currentCall = action.payload
    },
    setIncomingCall: (state, action) => {
      state.incomingCall = action.payload
    },
    setLocalStream: (state, action) => {
      state.localStream = action.payload
    },
    setRemoteStream: (state, action) => {
      state.remoteStream = action.payload
    },
    setPeerConnection: (state, action) => {
      state.peerConnection = action.payload
    },
    setCallStatus: (state, action) => {
      state.callStatus = action.payload
    },
    toggleVideo: (state) => {
      state.isVideoEnabled = !state.isVideoEnabled
    },
    toggleAudio: (state) => {
      state.isAudioEnabled = !state.isAudioEnabled
    },
    setScreenSharing: (state, action) => {
      state.isScreenSharing = action.payload
    },
    clearCall: (state) => {
      if (state.localStream) {
        state.localStream.getTracks().forEach((track) => track.stop())
      }
      if (state.peerConnection) {
        state.peerConnection.close()
      }
      state.currentCall = null
      state.incomingCall = null
      state.localStream = null
      state.remoteStream = null
      state.peerConnection = null
      state.callStatus = "idle"
      state.isVideoEnabled = true
      state.isAudioEnabled = true
      state.isScreenSharing = false
    },
  },
})

export const {
  setCurrentCall,
  setIncomingCall,
  setLocalStream,
  setRemoteStream,
  setPeerConnection,
  setCallStatus,
  toggleVideo,
  toggleAudio,
  setScreenSharing,
  clearCall,
} = callSlice.actions

export default callSlice.reducer
