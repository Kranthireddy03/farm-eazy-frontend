import UserProfileService from './UserProfileService';
import { STORAGE_KEYS } from '../config/api';

/**
 * Maps backend EffectiveLocationDto to frontend selection payload.
 */
export function effectiveLocationToSelection(effectiveLocation) {
  if (!effectiveLocation?.present) return null;

  if (effectiveLocation.addressId != null) {
    return {
      type: 'address',
      id: Number(effectiveLocation.addressId),
      label: effectiveLocation.label || buildLabelFromEffective(effectiveLocation),
      latitude: effectiveLocation.latitude != null ? Number(effectiveLocation.latitude) : null,
      longitude: effectiveLocation.longitude != null ? Number(effectiveLocation.longitude) : null,
    };
  }

  if (effectiveLocation.latitude != null && effectiveLocation.longitude != null) {
    return {
      type: 'coords',
      latitude: Number(effectiveLocation.latitude),
      longitude: Number(effectiveLocation.longitude),
      label: effectiveLocation.label || buildLabelFromEffective(effectiveLocation),
    };
  }

  return null;
}

function buildLabelFromEffective(effectiveLocation) {
  const parts = [
    effectiveLocation.label,
    effectiveLocation.city,
    effectiveLocation.state,
    effectiveLocation.postalCode,
  ].filter(Boolean);
  return parts.join(', ') || 'Selected location';
}

export function persistProfileToStorage(profile) {
  if (!profile) return;

  if (profile.id != null) {
    localStorage.setItem(STORAGE_KEYS.USER_ID, String(profile.id));
  }
  if (profile.email) {
    localStorage.setItem(STORAGE_KEYS.USER_EMAIL, profile.email);
  }
  if (profile.username) {
    localStorage.setItem(STORAGE_KEYS.USER_USERNAME, profile.username);
    localStorage.setItem(STORAGE_KEYS.USER_FULLNAME, profile.username);
  }
  if (profile.phone) {
    localStorage.setItem(STORAGE_KEYS.USER_PHONE, profile.phone);
  }
  if (profile.roles) {
    localStorage.setItem(STORAGE_KEYS.USER_ROLES, JSON.stringify(profile.roles));
  } else {
    localStorage.setItem(STORAGE_KEYS.USER_ROLES, JSON.stringify(['USER']));
  }
  localStorage.setItem(
    STORAGE_KEYS.USER_PROFILE_COMPLETION_REQUIRED,
    profile.profileCompleted === false ? 'true' : 'false'
  );
}

/**
 * Restore session profile from GET /api/users/me (canonical source of truth).
 */
export async function loadSessionProfile() {
  const profile = await UserProfileService.getMe();
  persistProfileToStorage(profile);
  const effectiveLocation = profile?.effectiveLocation || null;
  const selection = effectiveLocationToSelection(effectiveLocation);
  return {
    profile,
    effectiveLocation,
    hasEffectiveLocation: Boolean(effectiveLocation?.present),
    locationSelection: selection,
  };
}
