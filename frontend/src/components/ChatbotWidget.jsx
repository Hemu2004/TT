"use client"

import { useState, useRef, useEffect } from "react"
import { useSelector, useDispatch } from "react-redux"
import { MessageCircle, X, Send, Bot } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { sendMessage, clearMessages } from "../store/slices/chatbotSlice"

const ChatbotWidget = () => {
  const dispatch = useDispatch()
  const { socket } = useSelector((state) => state.socket)
  const { messages, isOpen } = useSelector((state) => state.chatbot)
  const [isWidgetOpen, setIsWidgetOpen] = useState(false)
  const [inputMessage, setInputMessage] = useState("")
  const [isTyping, setIsTyping] = useState(false)
  const messagesEndRef = useRef(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  useEffect(() => {
    if (socket) {
      socket.on("chatbot:response", (data) => {
        dispatch(
          sendMessage({
            type: "bot",
            content: data.message,
            timestamp: new Date(data.timestamp),
          }),
        )
        setIsTyping(false)
      })

      return () => {
        socket.off("chatbot:response")
      }
    }
  }, [socket, dispatch])

  const handleSendMessage = () => {
    if (!inputMessage.trim() || !socket) return

    // Add user message
    dispatch(
      sendMessage({
        type: "user",
        content: inputMessage,
        timestamp: new Date(),
      }),
    )

    // Send to chatbot service
    socket.emit("chatbot:message", { message: inputMessage })
    setIsTyping(true)
    setInputMessage("")
  }

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  const quickActions = [
    "How to get started?",
    "How to add skills?",
    "How does matching work?",
    "How to start a video call?",
    "Safety tips",
  ]

  return (
    <>
      {/* Widget Toggle Button */}
      <motion.button
        onClick={() => setIsWidgetOpen(!isWidgetOpen)}
        className="fixed bottom-6 right-6 z-50 bg-primary-600 hover:bg-primary-700 text-white p-4 rounded-full shadow-lg transition-colors"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        {isWidgetOpen ? <X className="h-6 w-6" /> : <MessageCircle className="h-6 w-6" />}
      </motion.button>

      {/* Chat Widget */}
      <AnimatePresence>
        {isWidgetOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="fixed bottom-24 right-6 z-40 w-80 h-96 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 flex flex-col"
          >
            {/* Header */}
            <div className="bg-primary-600 text-white p-4 rounded-t-lg flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Bot className="h-5 w-5" />
                <span className="font-medium">TalentTrade Assistant</span>
              </div>
              <button onClick={() => dispatch(clearMessages())} className="text-primary-200 hover:text-white text-sm">
                Clear
              </button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {messages.length === 0 && (
                <div className="text-center text-gray-500 dark:text-gray-400">
                  <Bot className="h-8 w-8 mx-auto mb-2 text-primary-400" />
                  <p className="text-sm">Hi! I'm here to help you navigate TalentTrade. Ask me anything!</p>
                  <div className="mt-3 space-y-1">
                    {quickActions.slice(0, 3).map((action, index) => (
                      <button
                        key={index}
                        onClick={() => setInputMessage(action)}
                        className="block w-full text-xs text-primary-600 hover:text-primary-700 dark:text-primary-400 p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700"
                      >
                        {action}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {messages.map((message, index) => (
                <div key={index} className={`flex ${message.type === "user" ? "justify-end" : "justify-start"}`}>
                  <div
                    className={`max-w-xs px-3 py-2 rounded-lg text-sm ${
                      message.type === "user"
                        ? "bg-primary-600 text-white"
                        : "bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white"
                    }`}
                  >
                    <div className="flex items-start space-x-2">
                      {message.type === "bot" && (
                        <Bot className="h-4 w-4 mt-0.5 text-primary-600 dark:text-primary-400" />
                      )}
                      <div className="whitespace-pre-wrap">{message.content}</div>
                    </div>
                  </div>
                </div>
              ))}

              {isTyping && (
                <div className="flex justify-start">
                  <div className="bg-gray-100 dark:bg-gray-700 px-3 py-2 rounded-lg">
                    <div className="flex items-center space-x-1">
                      <Bot className="h-4 w-4 text-primary-600 dark:text-primary-400" />
                      <div className="flex space-x-1">
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                        <div
                          className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                          style={{ animationDelay: "0.1s" }}
                        ></div>
                        <div
                          className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                          style={{ animationDelay: "0.2s" }}
                        ></div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="border-t border-gray-200 dark:border-gray-700 p-4">
              <div className="flex space-x-2">
                <input
                  type="text"
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Ask me anything..."
                  className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-gray-700 dark:text-white"
                />
                <button
                  onClick={handleSendMessage}
                  disabled={!inputMessage.trim()}
                  className="px-3 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Send className="h-4 w-4" />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}

export default ChatbotWidget
