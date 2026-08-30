import apiClient from './apiClient'
import { unwrapApiData } from '../utils/apiResponse'

const DEFAULT_POSTAL = '500001'
const DEFAULT_PHONE = '9876543210'

function sanitizePhone(phone) {
  const digits = String(phone || '').replace(/\D/g, '')
  return digits.length === 10 ? digits : DEFAULT_PHONE
}

function sanitizePostal(postalCode) {
  const digits = String(postalCode || '').replace(/\D/g, '')
  return digits.length === 6 ? digits : DEFAULT_POSTAL
}

function buildAddressLine(label, city) {
  const base = String(label || '').trim()
  if (base.length >= 5) return base.slice(0, 255)
  const withCity = `${base || 'Map location'}, ${city || 'India'}`.trim()
  if (withCity.length >= 5) return withCity.slice(0, 255)
  return 'Selected map location'
}

/**
 * Backend effective location requires a saved address as current.
 * Map/GPS coords are persisted by creating an address and PATCH /addresses/current.
 */
export async function persistCoordsAsCurrentAddress(coordsPayload, profile = {}) {
  const latitude = Number(coordsPayload.latitude)
  const longitude = Number(coordsPayload.longitude)
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
    throw new Error('Invalid coordinates')
  }

  const city = String(coordsPayload.city || 'Hyderabad').slice(0, 50)
  const state = String(coordsPayload.state || 'Telangana').slice(0, 50)
  const postalCode = sanitizePostal(coordsPayload.postalCode)

  const addressDto = {
    fullName: String(profile?.username || profile?.email?.split('@')[0] || 'Farm User').slice(0, 100),
    phoneNumber: sanitizePhone(profile?.phone),
    email: profile?.email || undefined,
    addressLine1: buildAddressLine(coordsPayload.label, city),
    addressLine2: coordsPayload.addressLine2 || '',
    city,
    state,
    postalCode,
    country: 'India',
    label: coordsPayload.label?.slice(0, 80) || 'Map selection',
    latitude,
    longitude,
    isDefault: false,
  }

  const createResponse = await apiClient.post('/addresses', addressDto)
  const created = unwrapApiData(createResponse?.data) || createResponse?.data
  const addressId = Number(created?.id)
  if (!addressId) {
    throw new Error('Address was not created')
  }

  await apiClient.patch('/addresses/current', { addressId })

  return {
    type: 'address',
    id: addressId,
    label: addressDto.addressLine1,
    latitude,
    longitude,
    address: created,
  }
}
