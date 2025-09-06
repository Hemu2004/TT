"use client"

import { useState, useEffect } from "react"
import { useSelector } from "react-redux"
import { Users, Star, MapPin, Clock, Send, RefreshCw, Heart, MessageCircle } from "lucide-react"
import api from "../lib/api"
import toast from "react-hot-toast"

const Discover = () => {
  const { user } = useSelector((state) => state.auth)
  const [matches, setMatches] = useState([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [sendingRequest, setSendingRequest] = useState(null)
  const [filters, setFilters] = useState({
    limit: 10,
    excludeIds: [],
  })

  useEffect(() => {
    fetchMatches()
  }, [])

  const fetchMatches = async (refresh = false) => {
    try {
      if (refresh) {
        setRefreshing(true)
      } else {
        setLoading(true)
      }

      const response = await api.post("/matches/preview", filters)
      setMatches(response.data)
    } catch (error) {
      toast.error("Failed to fetch matches")
      console.error("Error fetching matches:", error)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  const sendExchangeRequest = async (targetUser, aOffers, bOffers) => {
    try {
      setSendingRequest(targetUser._id)

      await api.post("/exchanges", {
        targetUserId: targetUser._id,
        aOffers: aOffers || [],
        bOffers: bOffers || [],
      })

      toast.success(`Exchange request sent to ${targetUser.name}!`)

      // Remove this user from current matches
      setMatches(matches.filter((match) => match.user._id !== targetUser._id))

      // Add to exclude list for future requests
      setFilters((prev) => ({
        ...prev,
        excludeIds: [...prev.excludeIds, targetUser._id],
      }))
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to send request")
    } finally {
      setSendingRequest(null)
    }
  }

  const getMatchColor = (percentage) => {
    if (percentage >= 80) return "text-green-600 bg-green-100 dark:bg-green-900 dark:text-green-200"
    if (percentage >= 60) return "text-blue-600 bg-blue-100 dark:bg-blue-900 dark:text-blue-200"
    if (percentage >= 40) return "text-yellow-600 bg-yellow-100 dark:bg-yellow-900 dark:text-yellow-200"
    return "text-gray-600 bg-gray-100 dark:bg-gray-900 dark:text-gray-200"
  }

  const getMatchLabel = (percentage) => {
    if (percentage >= 80) return "Excellent Match"
    if (percentage >= 60) return "Good Match"
    if (percentage >= 40) return "Fair Match"
    return "Potential Match"
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/4 mb-4"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow h-80"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Discover Matches</h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Find people with complementary skills to exchange knowledge with
          </p>
        </div>
        <div className="mt-4 sm:mt-0 flex space-x-3">
          <button
            onClick={() => fetchMatches(true)}
            disabled={refreshing}
            className="inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? "animate-spin" : ""}`} />
            {refreshing ? "Refreshing..." : "Refresh"}
          </button>
        </div>
      </div>

      {/* Profile Completion Warning */}
      {(!user?.skills?.length || !user?.bio) && (
        <div className="bg-yellow-50 dark:bg-yellow-900 border border-yellow-200 dark:border-yellow-700 rounded-lg p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <Users className="h-5 w-5 text-yellow-400" />
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
                Complete your profile for better matches
              </h3>
              <div className="mt-2 text-sm text-yellow-700 dark:text-yellow-300">
                <ul className="list-disc pl-5 space-y-1">
                  {!user?.skills?.length && <li>Add your skills to find relevant matches</li>}
                  {!user?.bio && <li>Add a bio to help others understand your interests</li>}
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Matches Grid */}
      {matches.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {matches.map((match) => (
            <div key={match.user._id} className="bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden">
              {/* Header */}
              <div className="p-6 pb-4">
                <div className="flex items-center space-x-4">
                  <img
                    className="h-16 w-16 rounded-full object-cover"
                    src={
                      match.user.avatarUrl ||
                      `https://ui-avatars.com/api/?name=${match.user.name || "/placeholder.svg"}&background=3b82f6&color=fff&size=64`
                    }
                    alt={match.user.name}
                  />
                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white truncate">{match.user.name}</h3>
                    {match.user.location?.city && (
                      <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                        <MapPin className="h-4 w-4 mr-1" />
                        {match.user.location.city}
                        {match.user.location.country && `, ${match.user.location.country}`}
                      </div>
                    )}
                  </div>
                </div>

                {/* Match Score */}
                <div className="mt-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Match Score</span>
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getMatchColor(match.matchPercentage)}`}
                    >
                      {match.matchPercentage}% • {getMatchLabel(match.matchPercentage)}
                    </span>
                  </div>
                  <div className="mt-2 w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                    <div
                      className="bg-gradient-to-r from-primary-500 to-blue-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${match.matchPercentage}%` }}
                    ></div>
                  </div>
                </div>
              </div>

              {/* Bio */}
              {match.user.bio && (
                <div className="px-6 pb-4">
                  <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-3">{match.user.bio}</p>
                </div>
              )}

              {/* Skills */}
              <div className="px-6 pb-4">
                <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Skills</h4>
                <div className="flex flex-wrap gap-2">
                  {match.user.skills.slice(0, 4).map((skill, index) => (
                    <span
                      key={index}
                      className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-primary-100 text-primary-800 dark:bg-primary-900 dark:text-primary-200"
                    >
                      <Star className="h-3 w-3 mr-1" />
                      {skill.name}
                    </span>
                  ))}
                  {match.user.skills.length > 4 && (
                    <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400">
                      +{match.user.skills.length - 4} more
                    </span>
                  )}
                </div>
              </div>

              {/* Match Reasons */}
              {match.reasons.length > 0 && (
                <div className="px-6 pb-4">
                  <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Why you match</h4>
                  <ul className="text-xs text-gray-600 dark:text-gray-400 space-y-1">
                    {match.reasons.slice(0, 3).map((reason, index) => (
                      <li key={index} className="flex items-center">
                        <Heart className="h-3 w-3 mr-2 text-red-400" />
                        {reason}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Availability */}
              {match.user.availability?.days?.length > 0 && (
                <div className="px-6 pb-4">
                  <div className="flex items-center text-xs text-gray-500 dark:text-gray-400">
                    <Clock className="h-3 w-3 mr-1" />
                    Available: {match.user.availability.days.slice(0, 3).join(", ")}
                    {match.user.availability.days.length > 3 && ` +${match.user.availability.days.length - 3} more`}
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="px-6 py-4 bg-gray-50 dark:bg-gray-700 border-t border-gray-200 dark:border-gray-600">
                <div className="flex space-x-3">
                  <button
                    onClick={() => sendExchangeRequest(match.user)}
                    disabled={sendingRequest === match.user._id}
                    className="flex-1 inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {sendingRequest === match.user._id ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    ) : (
                      <>
                        <Send className="h-4 w-4 mr-2" />
                        Send Request
                      </>
                    )}
                  </button>
                  <button className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-sm font-medium rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500">
                    <MessageCircle className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <Users className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">No matches found</h3>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            {!user?.skills?.length
              ? "Add some skills to your profile to find potential matches."
              : "Try refreshing or complete your profile for better matches."}
          </p>
          <div className="mt-6 flex justify-center space-x-3">
            {!user?.skills?.length ? (
              <button
                onClick={() => (window.location.href = "/skills")}
                className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700"
              >
                <Star className="h-4 w-4 mr-2" />
                Add Skills
              </button>
            ) : (
              <button
                onClick={() => fetchMatches(true)}
                className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh Matches
              </button>
            )}
          </div>
        </div>
      )}

      {/* Load More */}
      {matches.length > 0 && matches.length >= filters.limit && (
        <div className="text-center">
          <button
            onClick={() => {
              setFilters((prev) => ({ ...prev, limit: prev.limit + 10 }))
              fetchMatches()
            }}
            className="inline-flex items-center px-6 py-3 border border-gray-300 dark:border-gray-600 shadow-sm text-sm font-medium rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700"
          >
            Load More Matches
          </button>
        </div>
      )}
    </div>
  )
}

export default Discover
