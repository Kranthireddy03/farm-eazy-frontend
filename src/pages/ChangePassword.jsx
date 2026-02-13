import { useState } from 'react'
import PasswordInput from '../components/PasswordInput'
import { useToast } from '../hooks/useToast'
import apiClient from '../services/apiClient'
import { useLoader } from '../context/LoaderContext'

function ChangePassword() {
  const { showToast } = useToast()
  const { show, hide } = useLoader()
  const [form, setForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  })

  const handleChange = (e) => {
    const { name, value } = e.target
    setForm((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    show()
    if (!form.currentPassword || !form.newPassword || !form.confirmPassword) {
      showToast('Please fill all fields', 'warning')
      return
    }
    if (form.newPassword !== form.confirmPassword) {
      showToast('New password and confirm password do not match', 'error')
      return
    }
    try {
      const response = await apiClient.post('/auth/change-password', {
        currentPassword: form.currentPassword,
        newPassword: form.newPassword
      })
      showToast('Password changed successfully! Confirmation email sent.', 'success')
      setForm({ currentPassword: '', newPassword: '', confirmPassword: '' })
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'Password change failed. Please try again.'
      showToast(errorMessage, 'error')
    } finally {
      hide()
    }
  }

  return (
    <div className="max-w-xl mx-auto">
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">Change Password</h1>
        <p className="text-sm text-gray-600 mb-6">Update your account password securely.</p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <PasswordInput
            label="Current Password"
            name="currentPassword"
            value={form.currentPassword}
            onChange={handleChange}
            placeholder="Enter current password"
            required
            autoComplete="current-password"
          />
          <PasswordInput
            label="New Password"
            name="newPassword"
            value={form.newPassword}
            onChange={handleChange}
            placeholder="Enter new password"
            required
            autoComplete="new-password"
          />
          <PasswordInput
            label="Confirm New Password"
            name="confirmPassword"
            value={form.confirmPassword}
            onChange={handleChange}
            placeholder="Confirm new password"
            required
            autoComplete="new-password"
          />
          <button
            type="submit"
            className="w-full bg-green-600 text-white font-semibold py-3 rounded-lg hover:bg-green-700 transition flex items-center justify-center gap-2 disabled:opacity-60"
            disabled={loading}
          >
            {loading ? 'Updating...' : 'Update Password'}
          </button>
        </form>
      </div>
    </div>
  )
}

export default ChangePassword
