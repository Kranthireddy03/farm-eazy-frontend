import { useState } from 'react'
import PasswordInput from '../components/PasswordInput'
import { useToast } from '../hooks/useToast'

function ChangePassword() {
  const { showToast } = useToast()
  const [form, setForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  })

  const handleChange = (e) => {
    const { name, value } = e.target
    setForm((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!form.currentPassword || !form.newPassword || !form.confirmPassword) {
      showToast('Please fill all fields', 'warning')
      return
    }
    if (form.newPassword !== form.confirmPassword) {
      showToast('New password and confirm password do not match', 'error')
      return
    }
    showToast('Password change will be available soon', 'info')
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 py-8 px-4">
      <div className="max-w-xl mx-auto bg-white rounded-lg shadow-lg p-6">
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
            className="w-full bg-green-600 text-white font-semibold py-3 rounded-lg hover:bg-green-700 transition"
          >
            Update Password
          </button>
        </form>
      </div>
    </div>
  )
}

export default ChangePassword
