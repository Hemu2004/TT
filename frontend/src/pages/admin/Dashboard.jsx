"use client"

import { useState, useEffect } from "react"
import { Users, MessageSquare, Phone, Search, Ban, CheckCircle, AlertTriangle } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../components/ui/card"
import { Button } from "../../components/ui/button"
import { Input } from "../../components/ui/input"
import { Badge } from "../../components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "../../components/ui/avatar"
import { toast } from "sonner"
import api from "../../lib/api"

const AdminDashboard = () => {
  const [metrics, setMetrics] = useState(null)
  const [users, setUsers] = useState([])
  const [searchTerm, setSearchTerm] = useState("")
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState({})

  useEffect(() => {
    fetchMetrics()
    fetchUsers()
  }, [])

  useEffect(() => {
    fetchUsers()
  }, [currentPage, searchTerm])

  const fetchMetrics = async () => {
    try {
      const response = await api.get("/admin/metrics")
      setMetrics(response.data)
    } catch (error) {
      toast.error("Failed to load metrics")
    }
  }

  const fetchUsers = async () => {
    try {
      setLoading(true)
      const response = await api.get("/admin/users", {
        params: {
          page: currentPage,
          limit: 20,
          search: searchTerm || undefined,
        },
      })
      setUsers(response.data.users)
      setTotalPages(response.data.pages)
    } catch (error) {
      toast.error("Failed to load users")
    } finally {
      setLoading(false)
    }
  }

  const handleUserAction = async (userId, action) => {
    try {
      setActionLoading((prev) => ({ ...prev, [userId]: true }))

      const response = await api.put(`/admin/users/${userId}/${action}`)

      // Update user in local state
      setUsers((prev) => prev.map((user) => (user._id === userId ? response.data : user)))

      toast.success(`User ${action === "ban" ? "banned" : "unbanned"} successfully`)
    } catch (error) {
      toast.error(`Failed to ${action} user`)
    } finally {
      setActionLoading((prev) => ({ ...prev, [userId]: false }))
    }
  }

  const handleSearch = (e) => {
    e.preventDefault()
    setCurrentPage(1)
    fetchUsers()
  }

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    })
  }

  const formatLastActive = (date) => {
    const now = new Date()
    const lastActive = new Date(date)
    const diffInHours = Math.floor((now - lastActive) / (1000 * 60 * 60))

    if (diffInHours < 1) return "Active now"
    if (diffInHours < 24) return `${diffInHours}h ago`

    const diffInDays = Math.floor(diffInHours / 24)
    if (diffInDays < 30) return `${diffInDays}d ago`

    return formatDate(date)
  }

  if (!metrics) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
        <p className="text-gray-600 mt-2">Manage users, monitor platform activity, and view analytics</p>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.users.total}</div>
            <p className="text-xs text-muted-foreground">{metrics.users.active} active in last 30 days</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Skill Exchanges</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.exchanges.total}</div>
            <p className="text-xs text-muted-foreground">{metrics.exchanges.active} currently active</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Video Calls</CardTitle>
            <Phone className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.calls.total}</div>
            <p className="text-xs text-muted-foreground">{metrics.calls.completed} completed successfully</p>
          </CardContent>
        </Card>
      </div>

      {/* User Management */}
      <Card>
        <CardHeader>
          <CardTitle>User Management</CardTitle>
          <CardDescription>Search, view, and moderate platform users</CardDescription>
        </CardHeader>
        <CardContent>
          {/* Search */}
          <form onSubmit={handleSearch} className="flex space-x-2 mb-6">
            <Input
              placeholder="Search users by name or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-1"
            />
            <Button type="submit">
              <Search className="h-4 w-4" />
            </Button>
          </form>

          {/* Users Table */}
          <div className="space-y-4">
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
              </div>
            ) : users.length === 0 ? (
              <div className="text-center py-8 text-gray-500">No users found</div>
            ) : (
              users.map((user) => (
                <div key={user._id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center space-x-4">
                    <Avatar className="h-12 w-12">
                      <AvatarImage src={user.avatarUrl || "/placeholder.svg"} />
                      <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
                    </Avatar>

                    <div>
                      <div className="flex items-center space-x-2">
                        <h3 className="font-semibold">{user.name}</h3>
                        {user.role === "admin" && <Badge variant="secondary">Admin</Badge>}
                        {user.flags?.banned && <Badge variant="destructive">Banned</Badge>}
                      </div>
                      <p className="text-sm text-gray-600">{user.email}</p>
                      <div className="flex items-center space-x-4 text-xs text-gray-500 mt-1">
                        <span>Joined {formatDate(user.createdAt)}</span>
                        <span>Last active {formatLastActive(user.lastActive)}</span>
                        <span>{user.skills?.length || 0} skills</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    {user.flags?.verified ? (
                      <CheckCircle className="h-4 w-4 text-green-500" />
                    ) : (
                      <AlertTriangle className="h-4 w-4 text-yellow-500" />
                    )}

                    {user.role !== "admin" && (
                      <Button
                        variant={user.flags?.banned ? "outline" : "destructive"}
                        size="sm"
                        onClick={() => handleUserAction(user._id, user.flags?.banned ? "unban" : "ban")}
                        disabled={actionLoading[user._id]}
                      >
                        {actionLoading[user._id] ? (
                          <div className="animate-spin rounded-full h-3 w-3 border-b border-current"></div>
                        ) : user.flags?.banned ? (
                          <>
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Unban
                          </>
                        ) : (
                          <>
                            <Ban className="h-3 w-3 mr-1" />
                            Ban
                          </>
                        )}
                      </Button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-6">
              <p className="text-sm text-gray-600">
                Page {currentPage} of {totalPages}
              </p>
              <div className="flex space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

export default AdminDashboard
