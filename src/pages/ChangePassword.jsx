import { useState } from 'react'
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

  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 py-8 px-4">
      <div className="max-w-xl mx-auto bg-white rounded-lg shadow-lg p-6">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">Change Password</h1>
        <p className="text-sm text-gray-600 mb-6">Update your account password securely.</p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div style={{ position: 'relative' }}>
            <label className="block text-sm font-medium text-gray-700 mb-1">Current Password</label>
            <input
              type={showCurrent ? "text" : "password"}
              name="currentPassword"
              value={form.currentPassword}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg pr-10"
              placeholder="Enter current password"
            />
            <span
              onClick={() => setShowCurrent((v) => !v)}
              style={{ position: "absolute", right: "12px", top: "38px", cursor: "pointer" }}
            >
              {showCurrent ? (
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 0 0 2.25 12c1.885 3.61 5.514 6 9.75 6 1.563 0 3.05-.322 4.39-.904M6.73 6.73A9.956 9.956 0 0 1 12 6c4.236 0 7.865 2.39 9.75 6a10.478 10.478 0 0 1-2.042 2.88M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 3l18 18" />
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12c1.885-3.61 5.514-6 9.75-6s7.865 2.39 9.75 6c-1.885 3.61-5.514 6-9.75 6s-7.865-2.39-9.75-6Zm7.5 0a2.25 2.25 0 1 0 4.5 0 2.25 2.25 0 0 0-4.5 0Z" />
                </svg>
              )}
            </span>
          </div>
          <div style={{ position: 'relative' }}>
            <label className="block text-sm font-medium text-gray-700 mb-1">New Password</label>
            <input
              type={showNew ? "text" : "password"}
              name="newPassword"
              value={form.newPassword}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg pr-10"
              placeholder="Enter new password"
            />
            <span
              onClick={() => setShowNew((v) => !v)}
              style={{ position: "absolute", right: "12px", top: "38px", cursor: "pointer" }}
            >
              {showNew ? (
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 0 0 2.25 12c1.885 3.61 5.514 6 9.75 6 1.563 0 3.05-.322 4.39-.904M6.73 6.73A9.956 9.956 0 0 1 12 6c4.236 0 7.865 2.39 9.75 6a10.478 10.478 0 0 1-2.042 2.88M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 3l18 18" />
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12c1.885-3.61 5.514-6 9.75-6s7.865 2.39 9.75 6c-1.885 3.61-5.514 6-9.75 6s-7.865-2.39-9.75-6Zm7.5 0a2.25 2.25 0 1 0 4.5 0 2.25 2.25 0 0 0-4.5 0Z" />
                </svg>
              )}
            </span>
          </div>
          <div style={{ position: 'relative' }}>
            <label className="block text-sm font-medium text-gray-700 mb-1">Confirm New Password</label>
            <input
              type={showConfirm ? "text" : "password"}
              name="confirmPassword"
              value={form.confirmPassword}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg pr-10"
              placeholder="Confirm new password"
            />
            <span
              onClick={() => setShowConfirm((v) => !v)}
              style={{ position: "absolute", right: "12px", top: "38px", cursor: "pointer" }}
            >
              {showConfirm ? (
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 0 0 2.25 12c1.885 3.61 5.514 6 9.75 6 1.563 0 3.05-.322 4.39-.904M6.73 6.73A9.956 9.956 0 0 1 12 6c4.236 0 7.865 2.39 9.75 6a10.478 10.478 0 0 1-2.042 2.88M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 3l18 18" />
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12c1.885-3.61 5.514-6 9.75-6s7.865 2.39 9.75 6c-1.885 3.61-5.514 6-9.75 6s-7.865-2.39-9.75-6Zm7.5 0a2.25 2.25 0 1 0 4.5 0 2.25 2.25 0 0 0-4.5 0Z" />
                </svg>
              )}
            </span>
          </div>
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
