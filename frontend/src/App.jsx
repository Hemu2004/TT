"use client"

import { useEffect } from "react"
import { Routes, Route, Navigate } from "react-router-dom"
import { useDispatch, useSelector } from "react-redux"
import { checkAuth } from "./store/slices/authSlice"
import { initializeSocket } from "./store/slices/socketSlice"

// Layout
import Layout from "./components/Layout"
import ProtectedRoute from "./components/ProtectedRoute"

// Pages
import Home from "./pages/Home"
import Login from "./pages/Login"
import Register from "./pages/Register"
import Dashboard from "./pages/Dashboard"
import Skills from "./pages/Skills"
import Discover from "./pages/Discover"
import Exchange from "./pages/Exchange"
import Notifications from "./pages/Notifications"
import Settings from "./pages/Settings"
import AdminDashboard from "./pages/admin/Dashboard"
import Exchanges from "./pages/Exchanges" // New import for Exchanges page

// Components
import ChatbotWidget from "./components/ChatbotWidget"
import VideoCallModal from "./components/VideoCallModal"

function App() {
  const dispatch = useDispatch()
  const { user, isAuthenticated, loading } = useSelector((state) => state.auth)

  useEffect(() => {
    dispatch(checkAuth())
  }, [dispatch])

  useEffect(() => {
    if (isAuthenticated && user) {
      dispatch(initializeSocket())
    }
  }, [dispatch, isAuthenticated, user])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<Home />} />
        <Route path="/login" element={isAuthenticated ? <Navigate to="/dashboard" /> : <Login />} />
        <Route path="/register" element={isAuthenticated ? <Navigate to="/dashboard" /> : <Register />} />

        {/* Protected Routes */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Layout>
                <Dashboard />
              </Layout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/skills"
          element={
            <ProtectedRoute>
              <Layout>
                <Skills />
              </Layout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/discover"
          element={
            <ProtectedRoute>
              <Layout>
                <Discover />
              </Layout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/exchange/:id"
          element={
            <ProtectedRoute>
              <Layout>
                <Exchange />
              </Layout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/exchanges"
          element={
            <ProtectedRoute>
              <Layout>
                <Exchanges />
              </Layout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/notifications"
          element={
            <ProtectedRoute>
              <Layout>
                <Notifications />
              </Layout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/settings"
          element={
            <ProtectedRoute>
              <Layout>
                <Settings />
              </Layout>
            </ProtectedRoute>
          }
        />

        {/* Admin Routes */}
        <Route
          path="/admin"
          element={
            <ProtectedRoute adminOnly>
              <Layout>
                <AdminDashboard />
              </Layout>
            </ProtectedRoute>
          }
        />

        {/* Catch all */}
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>

      {/* Global Components */}
      <ChatbotWidget />
      <VideoCallModal />
    </div>
  )
}

export default App
