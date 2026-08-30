import React, { useState } from 'react'
import apiClient from '../../services/apiClient'

export default function ChangeContact({ type, currentValue, onSuccess }) {
  const [step, setStep] = useState(1)
  const [oldOtp, setOldOtp] = useState('')
  const [newOtp, setNewOtp] = useState('')
  const [newValue, setNewValue] = useState('')
  const [message, setMessage] = useState('')
  const [messageType, setMessageType] = useState('info')
  const [loading, setLoading] = useState(false)

  const isEmail = type === 'email';

  const normalizeNewValue = (value) => {
    if (!value) return ''
    return isEmail ? value.trim().toLowerCase() : value.replace(/\D/g, '').trim()
  }

  const getErrorMessage = (error, fallback) => {
    const payload = error?.response?.data
    if (typeof payload === 'string' && payload.trim()) return payload
    if (typeof payload?.message === 'string' && payload.message.trim()) return payload.message
    if (typeof error?.message === 'string' && error.message.trim()) return error.message
    return fallback
  }

  const validateNewValue = () => {
    const candidate = normalizeNewValue(newValue)
    if (!candidate) {
      setMessage(`Please enter a new ${type}.`)
      setMessageType('error')
      return null
    }

    if (isEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(candidate)) {
      setMessage('Please enter a valid email address.')
      setMessageType('error')
      return null
    }

    if (!isEmail && !/^[0-9]{10}$/.test(candidate)) {
      setMessage('Please enter a valid 10-digit phone number.')
      setMessageType('error')
      return null
    }

    if (currentValue && candidate === normalizeNewValue(currentValue)) {
      setMessage(`New ${type} cannot be the same as current ${type}.`)
      setMessageType('error')
      return null
    }

    return candidate
  }

  const requestOld = async () => {
    const normalizedValue = validateNewValue()
    if (!normalizedValue) return

    setLoading(true)
    setMessage('')
    setMessageType('info')
    try {
      const payload = isEmail ? { newEmail: normalizedValue } : { newPhone: normalizedValue }
      const res = await apiClient.post(`/account/request-${type}-change`, payload)
      setMessage(res.data?.message || res.data || 'OTP sent to old contact')
      setMessageType('success')
      setStep(2)
    } catch (error) {
      setMessage(getErrorMessage(error, 'Failed to request OTP'))
      setMessageType('error')
    } finally {
      setLoading(false)
    }
  }

  const verifyOld = async () => {
    const normalizedValue = validateNewValue()
    if (!normalizedValue) return
    if (!oldOtp.trim()) {
      setMessage('Please enter the OTP sent to your current contact.')
      setMessageType('error')
      return
    }

    setLoading(true)
    setMessage('')
    setMessageType('info')
    try {
      const payload = isEmail
        ? { newEmail: normalizedValue, oldOtp: oldOtp.trim() }
        : { newPhone: normalizedValue, oldOtp: oldOtp.trim() }
      const res = await apiClient.post(`/account/verify-${type}-change-old`, payload)
      setMessage(res.data?.message || res.data || 'Old verified')
      setMessageType('success')
      setStep(3)
    } catch (error) {
      setMessage(getErrorMessage(error, 'Failed to verify old OTP'))
      setMessageType('error')
    } finally {
      setLoading(false)
    }
  }

  const requestNew = async () => {
    const normalizedValue = validateNewValue()
    if (!normalizedValue) return

    setLoading(true)
    setMessage('')
    setMessageType('info')
    try {
      const payload = isEmail ? { newEmail: normalizedValue } : { newPhone: normalizedValue }
      const res = await apiClient.post(`/account/request-${type}-change-new`, payload)
      setMessage(res.data?.message || res.data || 'OTP sent to new contact')
      setMessageType('success')
      setStep(4)
    } catch (error) {
      setMessage(getErrorMessage(error, 'Failed to request OTP to new contact'))
      setMessageType('error')
    } finally {
      setLoading(false)
    }
  }

  const confirm = async () => {
    const normalizedValue = validateNewValue()
    if (!normalizedValue) return
    if (!oldOtp.trim() || !newOtp.trim()) {
      setMessage('Please enter both OTPs to confirm this change.')
      setMessageType('error')
      return
    }

    setLoading(true)
    setMessage('')
    setMessageType('info')
    try {
      const payload = isEmail
        ? { newEmail: normalizedValue, oldOtp: oldOtp.trim(), newOtp: newOtp.trim() }
        : { newPhone: normalizedValue, oldOtp: oldOtp.trim(), newOtp: newOtp.trim() }
      const res = await apiClient.post(`/account/confirm-${type}-change`, payload)
      setMessage(res.data?.message || res.data || 'Updated successfully')
      setMessageType('success')
      setStep(1)
      setOldOtp('')
      setNewOtp('')
      setNewValue('')
      onSuccess && onSuccess()
    } catch (error) {
      setMessage(getErrorMessage(error, 'Failed to confirm change'))
      setMessageType('error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-4 rounded bg-white dark:bg-gray-800">
      <h3 className="text-lg font-semibold text-foreground dark:text-gray-100">Change {type}</h3>
      <div className="mt-3">
        <p className="text-sm text-muted-foreground dark:text-muted-foreground">
          The first OTP will be sent to your current {isEmail ? 'email' : 'phone'}: <span className="font-semibold">{currentValue || 'not set'}</span>
        </p>
        <label className="mt-3 block text-sm text-muted-foreground dark:text-gray-200">New {type}</label>
        <input
          className="mt-1 block w-full p-2 border rounded bg-white dark:bg-gray-900 dark:text-gray-100"
          placeholder={isEmail ? 'Enter new email address' : 'Enter new phone number'}
          value={newValue}
          onChange={e => setNewValue(e.target.value)}
        />
      </div>

      {step >= 2 && (
        <div className="mt-3">
          <label className="block text-sm text-muted-foreground dark:text-gray-200">Old OTP</label>
          <input className="mt-1 block w-full p-2 border rounded bg-white dark:bg-gray-900 dark:text-gray-100" value={oldOtp} onChange={e => setOldOtp(e.target.value)} />
        </div>
      )}

      {step >= 4 && (
        <div className="mt-3">
          <label className="block text-sm text-muted-foreground dark:text-gray-200">New OTP</label>
          <input className="mt-1 block w-full p-2 border rounded bg-white dark:bg-gray-900 dark:text-gray-100" value={newOtp} onChange={e => setNewOtp(e.target.value)} />
        </div>
      )}

      <div className="mt-4 flex gap-2">
        {step === 1 && <button type="button" disabled={loading} className="px-4 py-2 bg-blue-600 disabled:opacity-60 text-white rounded" onClick={requestOld}>Send OTP to old</button>}
        {step === 2 && <button type="button" disabled={loading} className="px-4 py-2 bg-yellow-600 disabled:opacity-60 text-white rounded" onClick={verifyOld}>Verify Old OTP</button>}
        {step === 3 && <button type="button" disabled={loading} className="px-4 py-2 bg-blue-600 disabled:opacity-60 text-white rounded" onClick={requestNew}>Send OTP to new</button>}
        {step === 4 && <button type="button" disabled={loading} className="px-4 py-2 bg-green-600 disabled:opacity-60 text-white rounded" onClick={confirm}>Confirm Change</button>}
      </div>

      {message && (
        <p
          className={`mt-3 text-sm ${
            messageType === 'error'
              ? 'text-red-600 dark:text-red-400'
              : messageType === 'success'
                ? 'text-green-700 dark:text-green-400'
                : 'text-muted-foreground dark:text-muted-foreground'
          }`}
        >
          {message}
        </p>
      )}
    </div>
  );
}
