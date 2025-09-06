import { configureStore } from "@reduxjs/toolkit"
import authSlice from "./slices/authSlice"
import socketSlice from "./slices/socketSlice"
import skillsSlice from "./slices/skillsSlice"
import exchangesSlice from "./slices/exchangesSlice"
import notificationsSlice from "./slices/notificationsSlice"
import chatbotSlice from "./slices/chatbotSlice"
import callSlice from "./slices/callSlice"

export const store = configureStore({
  reducer: {
    auth: authSlice,
    socket: socketSlice,
    skills: skillsSlice,
    exchanges: exchangesSlice,
    notifications: notificationsSlice,
    chatbot: chatbotSlice,
    call: callSlice,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ["socket/setSocket"],
        ignoredPaths: ["socket.socket"],
      },
    }),
})
