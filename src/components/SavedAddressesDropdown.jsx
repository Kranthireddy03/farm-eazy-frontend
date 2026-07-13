import React, { useEffect, useState } from 'react'
import apiClient from '../services/apiClient'
import AddressFormModal from './AddressFormModal'

export default function SavedAddressesDropdown({ onSelect }) {
  const [addresses, setAddresses] = useState([])
  const [loading, setLoading] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState(null)

  const fetchAddresses = async () => {
    setLoading(true)
    try {
      const resp = await apiClient.get('/addresses')
      setAddresses(resp.data || [])
    } catch (err) {
      console.error('Failed to load addresses', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchAddresses() }, [])

  const choose = (addr) => {
    try {
      if (onSelect) onSelect(addr)
    } catch (e) { console.error(e) }
  }

  const setDefault = async (addr) => {
    try {
      await apiClient.post(`/addresses/${addr.id}/default`)
      await fetchAddresses()
    } catch (e) { console.error('Failed to set default', e) }
  }

  const remove = async (addr, e) => {
    e.stopPropagation()
    if (!confirm('Delete this address?')) return
    try {
      await apiClient.delete(`/addresses/${addr.id}`)
      await fetchAddresses()
    } catch (err) { console.error('Delete failed', err) }
  }

  const openNew = (e) => { e && e.stopPropagation(); setEditing(null); setShowForm(true) }
  const openEdit = (addr, e) => { e && e.stopPropagation(); setEditing(addr); setShowForm(true) }

  return (
    <div>
      <div className="flex items-center justify-between px-3 mb-2">
        <div className="text-xs text-gray-500">Saved addresses</div>
        <button onClick={openNew} className="text-xs text-blue-600">Add</button>
      </div>
      {loading && <div className="px-4 py-3 text-sm">Loading addresses...</div>}
      {!loading && addresses.length === 0 && <div className="px-4 py-3 text-sm">No saved addresses</div>}
      {!loading && addresses.map(addr => (
        <div key={addr.id} className="flex items-center justify-between gap-3 px-3 py-2 rounded-lg hover:bg-gray-50 cursor-pointer" onClick={() => choose(addr)}>
          <div>
            <div className="text-sm font-medium">{addr.fullName || addr.addressLine1}</div>
            <div className="text-xs text-gray-500 truncate">{addr.addressLine1}{addr.city ? ', ' + addr.city : ''}</div>
          </div>
          <div className="flex items-center gap-2">
            {addr.isDefault && <span className="text-xs text-emerald-600">Default</span>}
            <button onClick={(e) => { e.stopPropagation(); setDefault(addr) }} className="text-xs text-blue-600">Set Default</button>
            <button onClick={(e) => openEdit(addr, e)} className="text-xs text-gray-600">Edit</button>
            <button onClick={(e) => remove(addr, e)} className="text-xs text-red-500">Delete</button>
          </div>
        </div>
      ))}

      {showForm && (
        <AddressFormModal
          address={editing}
          onClose={() => { setShowForm(false); setEditing(null) }}
          onSaved={async () => { setShowForm(false); setEditing(null); await fetchAddresses() }}
        />
      )}
    </div>
  )
}
