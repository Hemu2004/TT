"use client"

import { useState, useEffect } from "react"
import { useSelector } from "react-redux"
import { Link } from "react-router-dom"
import { MessageSquare, Clock, CheckCircle, XCircle, Users, Calendar } from "lucide-react"
import api from "../lib/api"
import toast from "react-hot-toast"

const Exchanges = () => {
  const { user } = useSelector((state) => state.auth)
  const [exchanges, setExchanges] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState("all")

  useEffect(() => {
    fetchExchanges()
  }, [])

  const fetchExchanges = async () => {
    try {
      setLoading(true)
      const response = await api.get("/exchanges")
      setExchanges(response.data)
    } catch (error) {
      toast.error("Failed to fetch exchanges")
      console.error("Error fetching exchanges:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleExchangeAction = async (exchangeId, action) => {
    try {
      await api.put(`/exchanges/${exchangeId}/${action}`)
      toast.success(`Exchange ${action}ed successfully`)
      fetchExchanges()
    } catch (error) {
      toast.error(error.response?.data?.message || `Failed to ${action} exchange`)
    }
  }

  const getStatusColor = (status) => {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
      case "active":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
      case "completed":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
      case "declined":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200"
    }
  }

  const getStatusIcon = (status) => {
    switch (status) {
      case "pending":
        return <Clock className="h-4 w-4" />
      case "active":
        return <MessageSquare className="h-4 w-4" />
      case "completed":
        return <CheckCircle className="h-4 w-4" />
      case "declined":
        return <XCircle className="h-4 w-4" />
      default:
        return <Clock className="h-4 w-4" />
    }
  }

  const filteredExchanges = exchanges.filter((exchange) => {
    if (filter === "all") return true
    return exchange.status === filter
  })

  const filters = [
    { key: "all", label: "All", count: exchanges.length },
    { key: "pending", label: "Pending", count: exchanges.filter((e) => e.status === "pending").length },
    { key: "active", label: "Active", count: exchanges.filter((e) => e.status === "active").length },
    { key: "completed", label: "Completed", count: exchanges.filter((e) => e.status === "completed").length },
  ]

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/4 mb-4"></div>
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow h-32"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">My Exchanges</h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Manage your skill exchange conversations and requests
        </p>
      </div>

      {/* Filters */}
      <div className="border-b border-gray-200 dark:border-gray-700">
        <nav className="-mb-px flex space-x-8">
          {filters.map((filterOption) => (
            <button
              key={filterOption.key}
              onClick={() => setFilter(filterOption.key)}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                filter === filterOption.key
                  ? "border-primary-500 text-primary-600 dark:text-primary-400"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300"
              }`}
            >
              {filterOption.label}
              {filterOption.count > 0 && (
                <span
                  className={`ml-2 py-0.5 px-2 rounded-full text-xs ${
                    filter === filterOption.key
                      ? "bg-primary-100 text-primary-600 dark:bg-primary-900 dark:text-primary-400"
                      : "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400"
                  }`}
                >
                  {filterOption.count}
                </span>
              )}
            </button>
          ))}
        </nav>
      </div>

      {/* Exchanges List */}
      {filteredExchanges.length > 0 ? (
        <div className="space-y-4">
          {filteredExchanges.map((exchange) => {
            const otherUser = exchange.userA._id === user._id ? exchange.userB : exchange.userA
            const isRecipient = exchange.userB._id === user._id

            return (
              <div key={exchange._id} className="bg-white dark:bg-gray-800 rounded-lg shadow">
                <div className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <img
                        className="h-12 w-12 rounded-full"
                        src={
                          otherUser.avatarUrl ||
                          `https://ui-avatars.com/api/?name=${otherUser.name || "/placeholder.svg"}&background=3b82f6&color=fff`
                        }
                        alt={otherUser.name}
                      />
                      <div>
                        <h3 className="text-lg font-medium text-gray-900 dark:text-white">{otherUser.name}</h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {isRecipient ? "Sent you a request" : "You sent a request"}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center space-x-3">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(exchange.status)}`}
                      >
                        {getStatusIcon(exchange.status)}
                        <span className="ml-1 capitalize">{exchange.status}</span>
                      </span>

                      {exchange.status === "active" && (
                        <Link
                          to={`/exchange/${exchange._id}`}
                          className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700"
                        >
                          <MessageSquare className="h-4 w-4 mr-1" />
                          Chat
                        </Link>
                      )}
                    </div>
                  </div>

                  {/* Skills Exchange Info */}
                  <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        {isRecipient ? `${otherUser.name} offers` : "You offer"}
                      </h4>
                      <div className="flex flex-wrap gap-2">
                        {(isRecipient ? exchange.aOffers : exchange.aOffers).map((skill, index) => (
                          <span
                            key={index}
                            className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
                          >
                            {skill}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div>
                      <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        {isRecipient ? "You would teach" : `${otherUser.name} would teach`}
                      </h4>
                      <div className="flex flex-wrap gap-2">
                        {(isRecipient ? exchange.bOffers : exchange.bOffers).map((skill, index) => (
                          <span
                            key={index}
                            className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                          >
                            {skill}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Actions for pending requests */}
                  {exchange.status === "pending" && isRecipient && (
                    <div className="mt-4 flex space-x-3">
                      <button
                        onClick={() => handleExchangeAction(exchange._id, "accept")}
                        className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700"
                      >
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Accept
                      </button>
                      <button
                        onClick={() => handleExchangeAction(exchange._id, "decline")}
                        className="inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 text-sm font-medium rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700"
                      >
                        <XCircle className="h-4 w-4 mr-2" />
                        Decline
                      </button>
                    </div>
                  )}

                  {/* Metadata */}
                  <div className="mt-4 flex items-center text-xs text-gray-500 dark:text-gray-400">
                    <Calendar className="h-4 w-4 mr-1" />
                    {exchange.status === "pending" ? "Requested" : "Last activity"}:{" "}
                    {new Date(exchange.lastActivityAt || exchange.createdAt).toLocaleDateString()}
                    {exchange.messagesCount > 0 && (
                      <>
                        <span className="mx-2">•</span>
                        <MessageSquare className="h-4 w-4 mr-1" />
                        {exchange.messagesCount} message{exchange.messagesCount !== 1 ? "s" : ""}
                      </>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      ) : (
        <div className="text-center py-12">
          <MessageSquare className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">
            {filter === "all" ? "No exchanges yet" : `No ${filter} exchanges`}
          </h3>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            {filter === "all"
              ? "Start by discovering potential matches and sending exchange requests."
              : `You don't have any ${filter} exchanges at the moment.`}
          </p>
          {filter === "all" && (
            <div className="mt-6">
              <Link
                to="/discover"
                className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700"
              >
                <Users className="h-4 w-4 mr-2" />
                Find Matches
              </Link>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default Exchanges
