import { createSlice } from "@reduxjs/toolkit"

const chatbotSlice = createSlice({
  name: "chatbot",
  initialState: {
    messages: [],
    isOpen: false,
  },
  reducers: {
    sendMessage: (state, action) => {
      state.messages.push(action.payload)
    },
    clearMessages: (state) => {
      state.messages = []
    },
    toggleWidget: (state) => {
      state.isOpen = !state.isOpen
    },
  },
})

export const { sendMessage, clearMessages, toggleWidget } = chatbotSlice.actions
export default chatbotSlice.reducer
