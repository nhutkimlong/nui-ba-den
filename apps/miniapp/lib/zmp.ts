'use client';

/**
 * Thin wrapper over zmp-sdk/apis. Each helper:
 *  - returns null/undefined silently when SDK is unavailable (running outside Zalo)
 *  - never throws to callers
 *  - asks for permission only at call site, not on app boot
 */

type SdkApis = any;

async function loadSdk(): Promise<SdkApis | null> {
  if (typeof window === 'undefined') return null;
  try {
    return await import('zmp-sdk/apis');
  } catch {
    return null;
  }
}

export async function isInsideZalo(): Promise<boolean> {
  const sdk = await loadSdk();
  return !!sdk?.getAccessToken;
}

export interface ZmpUserInfo {
  id?: string;
  name?: string;
  avatar?: string | null;
}

export async function getZmpUserInfo(): Promise<ZmpUserInfo | null> {
  const sdk = await loadSdk();
  if (!sdk?.getUserInfo) return null;
  try {
    const { userInfo } = await sdk.getUserInfo({ avatarType: 'normal' });
    if (!userInfo) return null;
    return {
      id: userInfo.id,
      name: userInfo.name,
      avatar: userInfo.avatar ?? null,
    };
  } catch {
    return null;
  }
}

export interface ZmpCoords {
  latitude: number;
  longitude: number;
  accuracy?: number;
}

/** Best-effort location via ZMP; falls back to navigator.geolocation when outside Zalo. */
export async function getZmpLocation(timeoutMs = 8000): Promise<ZmpCoords | null> {
  const sdk = await loadSdk();
  if (sdk?.getLocation) {
    try {
      const r = await sdk.getLocation({});
      const lat = parseFloat(r?.latitude ?? r?.lat);
      const lng = parseFloat(r?.longitude ?? r?.lng);
      if (Number.isFinite(lat) && Number.isFinite(lng)) {
        return { latitude: lat, longitude: lng };
      }
    } catch {
      // fall through
    }
  }
  if (typeof navigator !== 'undefined' && 'geolocation' in navigator) {
    return new Promise((resolve) => {
      navigator.geolocation.getCurrentPosition(
        (pos) =>
          resolve({
            latitude: pos.coords.latitude,
            longitude: pos.coords.longitude,
            accuracy: pos.coords.accuracy,
          }),
        () => resolve(null),
        { enableHighAccuracy: true, timeout: timeoutMs },
      );
    });
  }
  return null;
}

/**
 * Asks Zalo for the user's phone number. Requires the OA to be approved for
 * `scope.userPhonenumber`. Returns the encrypted token; backend must decrypt
 * via Zalo Graph (server side) — we only forward.
 */
export async function getZmpPhoneToken(): Promise<string | null> {
  const sdk = await loadSdk();
  if (!sdk?.getPhoneNumber) return null;
  try {
    const r = await sdk.getPhoneNumber({});
    return r?.token ?? r?.number ?? null;
  } catch {
    return null;
  }
}

/** Applies brand color to native nav bar inside Zalo. No-op outside. */
export async function applyNavBarColor(hex: string | undefined | null) {
  if (!hex) return;
  const sdk = await loadSdk();
  if (!sdk?.setNavigationBarColor) return;
  try {
    await sdk.setNavigationBarColor({ color: hex, textStyle: 'light' });
  } catch {
    // no-op
  }
}

/** Set native nav bar title (Zalo only). */
export async function setNavBarTitle(title: string) {
  const sdk = await loadSdk();
  if (!sdk?.setNavigationBarTitle) return;
  try {
    await sdk.setNavigationBarTitle({ title });
  } catch {
    // no-op
  }
}
