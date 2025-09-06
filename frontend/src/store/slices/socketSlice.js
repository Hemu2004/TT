import { createSlice } from "@reduxjs/toolkit"
import { io } from "socket.io-client"

const socketSlice = createSlice({
  name: "socket",
  initialState: {
    socket: null,
    connected: false,
    onlineUsers: [],
  },
  reducers: {
    setSocket: (state, action) => {
      state.socket = action.payload
    },
    setConnected: (state, action) => {
      state.connected = action.payload
    },
    addOnlineUser: (state, action) => {
      const { userId, name } = action.payload
      if (!state.onlineUsers.find((user) => user.userId === userId)) {
        state.onlineUsers.push({ userId, name })
      }
    },
    removeOnlineUser: (state, action) => {
      state.onlineUsers = state.onlineUsers.filter((user) => user.userId !== action.payload.userId)
    },
    clearSocket: (state) => {
      if (state.socket) {
        state.socket.disconnect()
      }
      state.socket = null
      state.connected = false
      state.onlineUsers = []
    },
  },
})

export const { setSocket, setConnected, addOnlineUser, removeOnlineUser, clearSocket } = socketSlice.actions

// Thunk to initialize socket
export const initializeSocket = () => (dispatch, getState) => {
  const { auth } = getState()

  if (!auth.token || !auth.user) return

  const socket = io(import.meta.env.VITE_SOCKET_URL || "http://localhost:5000", {
    auth: {
      token: auth.token,
    },
  })

  socket.on("connect", () => {
    console.log("Socket connected")
    dispatch(setConnected(true))
  })

  socket.on("disconnect", () => {
    console.log("Socket disconnected")
    dispatch(setConnected(false))
  })

  socket.on("user:online", (data) => {
    dispatch(addOnlineUser(data))
  })

  socket.on("user:offline", (data) => {
    dispatch(removeOnlineUser(data))
  })

  dispatch(setSocket(socket))
}

export default socketSlice.reducer
