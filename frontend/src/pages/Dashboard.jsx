"use client"

import { useEffect, useState } from "react"
import { useSelector } from "react-redux"
import { Link } from "react-router-dom"
import { Users, MessageSquare, Star, TrendingUp, Plus, ArrowRight } from "lucide-react"
import api from "../lib/api"

const Dashboard = () => {
  const { user } = useSelector((state) => state.auth)
  const [stats, setStats] = useState({
    totalSkills: 0,
    activeExchanges: 0,
    completedExchanges: 0,
    matchScore: 0,
  })
  const [recentExchanges, setRecentExchanges] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const [exchangesRes] = await Promise.all([api.get("/exchanges")])

        const exchanges = exchangesRes.data
        setRecentExchanges(exchanges.slice(0, 3))

        setStats({
          totalSkills: user?.skills?.length || 0,
          activeExchanges: exchanges.filter((e) => e.status === "active").length,
          completedExchanges: exchanges.filter((e) => e.status === "completed").length,
          matchScore: Math.floor(Math.random() * 40) + 60, // Mock score
        })
      } catch (error) {
        console.error("Error fetching dashboard data:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchDashboardData()
  }, [user])

  const statCards = [
    {
      title: "My Skills",
      value: stats.totalSkills,
      icon: Star,
      color: "bg-blue-500",
      link: "/skills",
    },
    {
      title: "Active Exchanges",
      value: stats.activeExchanges,
      icon: MessageSquare,
      color: "bg-green-500",
      link: "/exchanges",
    },
    {
      title: "Completed",
      value: stats.completedExchanges,
      icon: Users,
      color: "bg-purple-500",
    },
    {
      title: "Match Score",
      value: `${stats.matchScore}%`,
      icon: TrendingUp,
      color: "bg-orange-500",
    },
  ]

  if (loading) {
    return (
      <div className="animate-pulse">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow h-32"></div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-primary-500 to-blue-600 rounded-lg p-6 text-white">
        <h1 className="text-2xl font-bold mb-2">Welcome back, {user?.name}! 👋</h1>
        <p className="text-primary-100 mb-4">
          Ready to continue your learning journey? Check out your recent activity and discover new opportunities.
        </p>
        <div className="flex flex-wrap gap-3">
          <Link
            to="/discover"
            className="inline-flex items-center px-4 py-2 bg-white text-primary-600 rounded-md hover:bg-gray-100 transition-colors"
          >
            <Users className="h-4 w-4 mr-2" />
            Find Matches
          </Link>
          <Link
            to="/skills"
            className="inline-flex items-center px-4 py-2 bg-primary-400 text-white rounded-md hover:bg-primary-300 transition-colors"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Skills
          </Link>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat, index) => {
          const Icon = stat.icon
          return (
            <div key={index} className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className={`${stat.color} p-3 rounded-lg`}>
                  <Icon className="h-6 w-6 text-white" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">{stat.title}</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">{stat.value}</p>
                </div>
              </div>
              {stat.link && (
                <Link
                  to={stat.link}
                  className="mt-4 inline-flex items-center text-sm text-primary-600 hover:text-primary-500"
                >
                  View details
                  <ArrowRight className="ml-1 h-4 w-4" />
                </Link>
              )}
            </div>
          )
        })}
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Recent Exchanges */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Recent Exchanges</h2>
              <Link to="/exchanges" className="text-sm text-primary-600 hover:text-primary-500">
                View all
              </Link>
            </div>
          </div>
          <div className="p-6">
            {recentExchanges.length > 0 ? (
              <div className="space-y-4">
                {recentExchanges.map((exchange) => {
                  const otherUser = exchange.userA._id === user._id ? exchange.userB : exchange.userA
                  return (
                    <div key={exchange._id} className="flex items-center space-x-4">
                      <img
                        className="h-10 w-10 rounded-full"
                        src={
                          otherUser.avatarUrl ||
                          `https://ui-avatars.com/api/?name=${otherUser.name}&background=3b82f6&color=fff`
                        }
                        alt={otherUser.name}
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{otherUser.name}</p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {exchange.status === "active" ? "Active exchange" : "Pending response"}
                        </p>
                      </div>
                      <div className="flex items-center">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            exchange.status === "active"
                              ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                              : "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
                          }`}
                        >
                          {exchange.status}
                        </span>
                      </div>
                    </div>
                  )
                })}
              </div>
            ) : (
              <div className="text-center py-8">
                <MessageSquare className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">No exchanges yet</h3>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  Start by discovering potential matches and sending exchange requests.
                </p>
                <div className="mt-6">
                  <Link
                    to="/discover"
                    className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Find Matches
                  </Link>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Quick Actions</h2>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              <Link
                to="/skills"
                className="flex items-center p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                <div className="bg-blue-100 dark:bg-blue-900 p-2 rounded-lg">
                  <Star className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-900 dark:text-white">Manage Skills</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Add or update your skills and expertise</p>
                </div>
                <ArrowRight className="ml-auto h-5 w-5 text-gray-400" />
              </Link>

              <Link
                to="/discover"
                className="flex items-center p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                <div className="bg-green-100 dark:bg-green-900 p-2 rounded-lg">
                  <Users className="h-5 w-5 text-green-600 dark:text-green-400" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-900 dark:text-white">Discover Matches</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Find people to exchange skills with</p>
                </div>
                <ArrowRight className="ml-auto h-5 w-5 text-gray-400" />
              </Link>

              <Link
                to="/settings"
                className="flex items-center p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                <div className="bg-purple-100 dark:bg-purple-900 p-2 rounded-lg">
                  <TrendingUp className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-900 dark:text-white">Update Profile</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Complete your profile for better matches</p>
                </div>
                <ArrowRight className="ml-auto h-5 w-5 text-gray-400" />
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Profile Completion */}
      {(!user?.bio || !user?.location?.city || user?.skills?.length === 0) && (
        <div className="bg-yellow-50 dark:bg-yellow-900 border border-yellow-200 dark:border-yellow-700 rounded-lg p-6">
          <div className="flex">
            <div className="flex-shrink-0">
              <TrendingUp className="h-5 w-5 text-yellow-400" />
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
                Complete your profile to get better matches
              </h3>
              <div className="mt-2 text-sm text-yellow-700 dark:text-yellow-300">
                <ul className="list-disc pl-5 space-y-1">
                  {!user?.bio && <li>Add a bio to tell others about yourself</li>}
                  {!user?.location?.city && <li>Add your location for local matches</li>}
                  {user?.skills?.length === 0 && <li>Add your skills and expertise</li>}
                </ul>
              </div>
              <div className="mt-4">
                <Link
                  to="/settings"
                  className="text-sm font-medium text-yellow-800 dark:text-yellow-200 hover:text-yellow-600 dark:hover:text-yellow-100"
                >
                  Complete profile →
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Dashboard
