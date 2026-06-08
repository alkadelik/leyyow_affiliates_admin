/**
 * src/stores/auth.js
 *
 * Admin auth store.
 * Handles login, logout, token persistence, and the /me fetch.
 */
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import api, { clearAuth } from '@/api/axios'

export const useAuthStore = defineStore('auth', () => {
  const user   = ref(null)   // { id, email, full_name, role }
  const loading = ref(false)

  const isAuthenticated = computed(() => !!user.value)
  const isSuperAdmin    = computed(() => user.value?.role === 'super_admin')

  // ── Restore session on app boot ──────────────────────────────────────────
  async function init() {
    const token = localStorage.getItem('access_token')
    if (!token) return
    try {
      await fetchMe()
    } catch {
      clearAuth()
    }
  }

  // ── Login ────────────────────────────────────────────────────────────────
  async function login(email, password) {
    loading.value = true
    try {
      const { data } = await api.post('/adminn/auth/login/', { email, password })
      localStorage.setItem('access_token',  data.access)
      localStorage.setItem('refresh_token', data.refresh)
      user.value = data.user
      return { ok: true }
    } catch (err) {
      const msg = err.response?.data?.detail
        || err.response?.data?.non_field_errors?.[0]
        || 'Login failed. Check your credentials.'
      return { ok: false, error: msg }
    } finally {
      loading.value = false
    }
  }

  // ── Logout ───────────────────────────────────────────────────────────────
  async function logout() {
    try {
      const refresh = localStorage.getItem('refresh_token')
      if (refresh) await api.post('/admin/auth/logout/', { refresh })
    } catch { /* ignore */ } finally {
      clearAuth()
      user.value = null
    }
  }

  // ── Fetch current user ───────────────────────────────────────────────────
  async function fetchMe() {
    const { data } = await api.get('/admin/auth/me/')
    user.value = data
  }

  return { user, loading, isAuthenticated, isSuperAdmin, init, login, logout, fetchMe }
})
