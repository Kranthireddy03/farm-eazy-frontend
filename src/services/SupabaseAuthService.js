/**
 * SUPABASE AUTHENTICATION SERVICE
 * 
 * This file shows how to use Supabase's built-in authentication instead of
 * your custom JWT system.
 * 
 * WHY USE SUPABASE AUTH?
 * ✓ Industry-standard security
 * ✓ Built-in password hashing
 * ✓ Automatic JWT generation
 * ✓ Email verification support
 * ✓ OAuth2 support (Google, GitHub, etc)
 * ✓ No need to manage passwords yourself
 * 
 * INSTALLATION:
 * npm install @supabase/supabase-js
 * 
 * ============================================================================
 */

import { createClient } from '@supabase/supabase-js'
import { STORAGE_KEYS } from '../config/api'

/**
 * Initialize Supabase Client
 * 
 * SUPABASE_URL: Your project URL
 * SUPABASE_ANON_KEY: Anonymous key (safe for client-side)
 * 
 * Get these from: Supabase → Settings → API
 */
const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
)

class SupabaseAuthService {
  /**
   * Register user with Supabase
   * 
   * Supabase automatically:
   * - Hashes password securely
   * - Generates JWT token
   * - Creates user in auth.users table
   * - Sends confirmation email (if enabled)
   * 
   * @param {string} email - User email
   * @param {string} password - User password (min 6 chars)
   * @param {object} metadata - Additional user data (name, phone, etc)
   * @returns {Promise} User object and session
   * 
   * WHAT IS metadata?
   * ├─ fullName: User's full name
   * ├─ username: Unique username
   * ├─ phone: Phone number
   * └─ Other custom fields
   */
  async register(email, password, metadata = {}) {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: metadata, // Stored in user_metadata column
        },
      })

      if (error) {
        throw new Error(error.message)
      }

      // Supabase automatically returns session with JWT token
      if (data.session) {
        // Store token in localStorage
        localStorage.setItem(STORAGE_KEYS.USER_TOKEN, data.session.access_token)
        localStorage.setItem(STORAGE_KEYS.USER_EMAIL, data.user.email)
        localStorage.setItem(STORAGE_KEYS.USER_ID, data.user.id)

        // Store metadata
        if (data.user.user_metadata) {
          localStorage.setItem(
            STORAGE_KEYS.USER_FULLNAME,
            data.user.user_metadata.fullName || ''
          )
          localStorage.setItem(
            STORAGE_KEYS.USER_USERNAME,
            data.user.user_metadata.username || ''
          )
        }
      }

      return {
        token: data.session?.access_token,
        user: data.user,
      }
    } catch (error) {
      console.error('Registration error:', error)
      throw error
    }
  }

  /**
   * Login user with Supabase
   * 
   * Supabase automatically:
   * - Verifies email/password
   * - Generates JWT token
   * - Returns session with token
   * 
   * @param {string} email - User email
   * @param {string} password - User password
   * @returns {Promise} Session with JWT token
   */
  async login(email, password) {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) {
        throw new Error(error.message)
      }

      // Supabase returns session with JWT token
      if (data.session) {
        // Store token in localStorage
        localStorage.setItem(STORAGE_KEYS.USER_TOKEN, data.session.access_token)
        localStorage.setItem(STORAGE_KEYS.USER_EMAIL, data.user.email)
        localStorage.setItem(STORAGE_KEYS.USER_ID, data.user.id)

        // Store metadata
        if (data.user.user_metadata) {
          localStorage.setItem(
            STORAGE_KEYS.USER_FULLNAME,
            data.user.user_metadata.fullName || ''
          )
          localStorage.setItem(
            STORAGE_KEYS.USER_USERNAME,
            data.user.user_metadata.username || ''
          )
        }
      }

      return {
        token: data.session?.access_token,
        user: data.user,
      }
    } catch (error) {
      console.error('Login error:', error)
      throw error
    }
  }

  /**
   * Logout user
   * 
   * Supabase automatically:
   * - Invalidates session
   * - JWT token no longer valid
   * - User must login again
   */
  async logout() {
    try {
      const { error } = await supabase.auth.signOut()

      if (error) {
        throw new Error(error.message)
      }

      // Clear localStorage
      localStorage.removeItem(STORAGE_KEYS.USER_TOKEN)
      localStorage.removeItem(STORAGE_KEYS.USER_EMAIL)
      localStorage.removeItem(STORAGE_KEYS.USER_ID)
      localStorage.removeItem(STORAGE_KEYS.USER_FULLNAME)
      localStorage.removeItem(STORAGE_KEYS.USER_USERNAME)

      return true
    } catch (error) {
      console.error('Logout error:', error)
      throw error
    }
  }

  /**
   * Get current session
   * 
   * Checks if user has valid session with JWT token
   * 
   * @returns {Promise} Current session or null if no session
   */
  async getSession() {
    try {
      const { data, error } = await supabase.auth.getSession()

      if (error) {
        throw new Error(error.message)
      }

      return data.session
    } catch (error) {
      console.error('Get session error:', error)
      return null
    }
  }

  /**
   * Get current user
   * 
   * @returns {Promise} Current user object or null if not logged in
   */
  async getCurrentUser() {
    try {
      const { data, error } = await supabase.auth.getUser()

      if (error) {
        throw new Error(error.message)
      }

      return data.user
    } catch (error) {
      console.error('Get current user error:', error)
      return null
    }
  }

  /**
   * Refresh JWT token
   * 
   * Tokens expire after some time. This refreshes it to continue working.
   * Supabase handles this automatically, but you can call if needed.
   * 
   * @returns {Promise} New session with fresh token
   */
  async refreshSession() {
    try {
      const { data, error } = await supabase.auth.refreshSession()

      if (error) {
        throw new Error(error.message)
      }

      if (data.session) {
        localStorage.setItem(STORAGE_KEYS.USER_TOKEN, data.session.access_token)
      }

      return data.session
    } catch (error) {
      console.error('Refresh session error:', error)
      return null
    }
  }

  /**
   * Send password reset email
   * 
   * User receives email with reset link
   * Clicking link allows them to set new password
   * 
   * @param {string} email - User email
   * @returns {Promise} Success/failure
   */
  async resetPassword(email) {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email)

      if (error) {
        throw new Error(error.message)
      }

      return true
    } catch (error) {
      console.error('Reset password error:', error)
      throw error
    }
  }

  /**
   * Update user metadata
   * 
   * Updates user_metadata (fullName, phone, etc)
   * 
   * @param {object} metadata - Object with fields to update
   * @returns {Promise} Updated user object
   */
  async updateUserMetadata(metadata) {
    try {
      const { data, error } = await supabase.auth.updateUser({
        data: metadata,
      })

      if (error) {
        throw new Error(error.message)
      }

      return data.user
    } catch (error) {
      console.error('Update metadata error:', error)
      throw error
    }
  }

  /**
   * Get JWT token from localStorage
   * 
   * @returns {string|null} JWT token or null
   */
  getToken() {
    return localStorage.getItem(STORAGE_KEYS.USER_TOKEN)
  }

  /**
   * Check if user is logged in
   * 
   * @returns {boolean} True if logged in, false otherwise
   */
  isLoggedIn() {
    const token = this.getToken()
    return !!token
  }
}

/**
 * USAGE EXAMPLES
 * 
 * ============================================================================
 * REGISTRATION
 * ============================================================================
 * 
 * const authService = new SupabaseAuthService()
 * 
 * try {
 *   const result = await authService.register(
 *     'user@example.com',
 *     'Password123!',
 *     {
 *       fullName: 'Rajesh Kumar',
 *       username: 'rajesh123',
 *       phone: '9876543210'
 *     }
 *   )
 *   console.log('User registered:', result.user)
 * } catch (error) {
 *   console.error('Registration failed:', error.message)
 * }
 * 
 * ============================================================================
 * LOGIN
 * ============================================================================
 * 
 * try {
 *   const result = await authService.login(
 *     'user@example.com',
 *     'Password123!'
 *   )
 *   console.log('Login successful, token:', result.token)
 * } catch (error) {
 *   console.error('Login failed:', error.message)
 * }
 * 
 * ============================================================================
 * CHECK IF LOGGED IN
 * ============================================================================
 * 
 * if (authService.isLoggedIn()) {
 *   console.log('User is logged in')
 * } else {
 *   console.log('Please login first')
 * }
 * 
 * ============================================================================
 * GET CURRENT USER
 * ============================================================================
 * 
 * const user = await authService.getCurrentUser()
 * console.log('Current user email:', user.email)
 * 
 * ============================================================================
 * LOGOUT
 * ============================================================================
 * 
 * await authService.logout()
 * console.log('Logged out successfully')
 * 
 * ============================================================================
 * UPDATE USER INFO
 * ============================================================================
 * 
 * await authService.updateUserMetadata({
 *   fullName: 'New Name',
 *   phone: '1234567890'
 * })
 * 
 * ============================================================================
 * 
 * KEY DIFFERENCES FROM YOUR CURRENT SYSTEM:
 * 
 * YOUR CURRENT SYSTEM:
 * - You manage users in database
 * - You hash passwords
 * - You generate JWT tokens
 * - You validate tokens
 * 
 * SUPABASE AUTH SYSTEM:
 * - Supabase manages users (auth.users table)
 * - Supabase hashes passwords automatically
 * - Supabase generates JWT tokens
 * - You validate Supabase JWT tokens in backend
 * 
 * ADVANTAGE: Less code to write and maintain!
 * DISADVANTAGE: Less control over auth process
 * 
 * FOR NOW: Stick with your current system (OPTION 1)
 * LATER: You can migrate to Supabase Auth if needed
 */

export default new SupabaseAuthService()
