"use client"

import { useState, useEffect, useRef } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { useSelector, useDispatch } from "react-redux"
import { Send, Phone, Video, ArrowLeft, MoreVertical } from "lucide-react"
import { Button } from "../components/ui/button"
import { Input } from "../components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "../components/ui/avatar"
import { Badge } from "../components/ui/badge"
import { Card } from "../components/ui/card"
import { toast } from "sonner"
import api from "../lib/api"

const ExchangeChat = () => {
  const { exchangeId } = useParams()
  const navigate = useNavigate()
  const dispatch = useDispatch()
  const { socket } = useSelector((state) => state.socket)
  const { user } = useSelector((state) => state.auth)

  const [exchange, setExchange] = useState(null)
  const [messages, setMessages] = useState([])
  const [newMessage, setNewMessage] = useState("")
  const [typing, setTyping] = useState(false)
  const [typingUsers, setTypingUsers] = useState([])
  const [loading, setLoading] = useState(true)

  const messagesEndRef = useRef(null)
  const typingTimeoutRef = useRef(null)

  useEffect(() => {
    fetchExchange()
    fetchMessages()
  }, [exchangeId])

  useEffect(() => {
    if (socket && exchangeId) {
      // Join exchange room
      socket.emit("presence:join", { exchangeId })

      // Listen for new messages
      socket.on("message:new", handleNewMessage)
      socket.on("typing:user_typing", handleUserTyping)
      socket.on("typing:user_stopped", handleUserStoppedTyping)

      return () => {
        socket.emit("presence:leave", { exchangeId })
        socket.off("message:new", handleNewMessage)
        socket.off("typing:user_typing", handleUserTyping)
        socket.off("typing:user_stopped", handleUserStoppedTyping)
      }
    }
  }, [socket, exchangeId])

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const fetchExchange = async () => {
    try {
      const response = await api.get(`/exchanges/${exchangeId}`)
      setExchange(response.data)
    } catch (error) {
      toast.error("Failed to load exchange")
      navigate("/exchanges")
    }
  }

  const fetchMessages = async () => {
    try {
      const response = await api.get(`/exchanges/${exchangeId}/messages`)
      setMessages(response.data)
    } catch (error) {
      toast.error("Failed to load messages")
    } finally {
      setLoading(false)
    }
  }

  const handleNewMessage = (message) => {
    setMessages((prev) => [...prev, message])
  }

  const handleUserTyping = (data) => {
    if (data.userId !== user.id) {
      setTypingUsers((prev) => [...prev.filter((u) => u.userId !== data.userId), data])
    }
  }

  const handleUserStoppedTyping = (data) => {
    setTypingUsers((prev) => prev.filter((u) => u.userId !== data.userId))
  }

  const sendMessage = async (e) => {
    e.preventDefault()
    if (!newMessage.trim() || !socket) return

    socket.emit("message:send", {
      exchangeId,
      body: newMessage.trim(),
    })

    setNewMessage("")
    stopTyping()
  }

  const handleTyping = (e) => {
    setNewMessage(e.target.value)

    if (!typing && socket) {
      setTyping(true)
      socket.emit("typing:start", { exchangeId })
    }

    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current)
    }

    // Set new timeout
    typingTimeoutRef.current = setTimeout(() => {
      stopTyping()
    }, 1000)
  }

  const stopTyping = () => {
    if (typing && socket) {
      setTyping(false)
      socket.emit("typing:stop", { exchangeId })
    }
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current)
    }
  }

  const initiateCall = (isVideo = false) => {
    if (!socket || !exchange) return

    const targetUserId = exchange.userA._id === user.id ? exchange.userB._id : exchange.userA._id

    socket.emit("call:initiate", {
      exchangeId,
      targetUserId,
      isVideo,
    })

    toast.success(`${isVideo ? "Video" : "Voice"} call initiated`)
  }

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  const formatTime = (date) => {
    return new Date(date).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
  }

  const formatDate = (date) => {
    const messageDate = new Date(date)
    const today = new Date()
    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)

    if (messageDate.toDateString() === today.toDateString()) {
      return "Today"
    } else if (messageDate.toDateString() === yesterday.toDateString()) {
      return "Yesterday"
    } else {
      return messageDate.toLocaleDateString()
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!exchange) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p>Exchange not found</p>
      </div>
    )
  }

  const otherUser = exchange.userA._id === user.id ? exchange.userB : exchange.userA

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b px-4 py-3 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Button variant="ghost" size="sm" onClick={() => navigate("/exchanges")} className="p-2">
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <Avatar className="h-10 w-10">
            <AvatarImage src={otherUser.avatarUrl || "/placeholder.svg"} />
            <AvatarFallback>{otherUser.name.charAt(0)}</AvatarFallback>
          </Avatar>
          <div>
            <h3 className="font-semibold">{otherUser.name}</h3>
            <p className="text-sm text-gray-500">
              {exchange.userASkill} ↔ {exchange.userBSkill}
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <Button variant="ghost" size="sm" onClick={() => initiateCall(false)} className="p-2">
            <Phone className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="sm" onClick={() => initiateCall(true)} className="p-2">
            <Video className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="sm" className="p-2">
            <MoreVertical className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message, index) => {
          const isOwn = message.fromUser._id === user.id
          const showDate = index === 0 || formatDate(messages[index - 1].createdAt) !== formatDate(message.createdAt)

          return (
            <div key={message._id}>
              {showDate && (
                <div className="text-center my-4">
                  <Badge variant="secondary" className="text-xs">
                    {formatDate(message.createdAt)}
                  </Badge>
                </div>
              )}

              <div className={`flex ${isOwn ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-xs lg:max-w-md ${isOwn ? "order-2" : "order-1"}`}>
                  {!isOwn && (
                    <div className="flex items-center space-x-2 mb-1">
                      <Avatar className="h-6 w-6">
                        <AvatarImage src={message.fromUser.avatarUrl || "/placeholder.svg"} />
                        <AvatarFallback className="text-xs">{message.fromUser.name.charAt(0)}</AvatarFallback>
                      </Avatar>
                      <span className="text-xs text-gray-500">{message.fromUser.name}</span>
                    </div>
                  )}

                  <Card className={`p-3 ${isOwn ? "bg-blue-600 text-white" : "bg-white"}`}>
                    <p className="text-sm">{message.body}</p>
                    <p className={`text-xs mt-1 ${isOwn ? "text-blue-100" : "text-gray-500"}`}>
                      {formatTime(message.createdAt)}
                    </p>
                  </Card>
                </div>
              </div>
            </div>
          )
        })}

        {/* Typing indicator */}
        {typingUsers.length > 0 && (
          <div className="flex justify-start">
            <div className="bg-gray-200 rounded-lg px-4 py-2">
              <div className="flex space-x-1">
                <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce"></div>
                <div
                  className="w-2 h-2 bg-gray-500 rounded-full animate-bounce"
                  style={{ animationDelay: "0.1s" }}
                ></div>
                <div
                  className="w-2 h-2 bg-gray-500 rounded-full animate-bounce"
                  style={{ animationDelay: "0.2s" }}
                ></div>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Message input */}
      <div className="bg-white border-t p-4">
        <form onSubmit={sendMessage} className="flex space-x-2">
          <Input
            value={newMessage}
            onChange={handleTyping}
            placeholder="Type a message..."
            className="flex-1"
            maxLength={1000}
          />
          <Button type="submit" disabled={!newMessage.trim()}>
            <Send className="h-4 w-4" />
          </Button>
        </form>
      </div>
    </div>
  )
}

export default ExchangeChat
