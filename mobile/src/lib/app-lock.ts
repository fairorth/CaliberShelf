import AsyncStorage from "@react-native-async-storage/async-storage"
import * as LocalAuthentication from "expo-local-authentication"

/**
 * The optional Face ID lock. OFF by default — the sign-in itself already
 * persists, so this guards the collection only from someone holding the
 * phone. A per-device preference, so it lives on the device.
 */
const KEY = "tenten.faceIdLock"

/** Lock again only after the app has been away this long. */
export const RELOCK_AFTER_MS = 60_000

export async function isLockEnabled(): Promise<boolean> {
  try {
    return (await AsyncStorage.getItem(KEY)) === "on"
  } catch {
    return false
  }
}

export async function setLockEnabled(on: boolean): Promise<void> {
  await AsyncStorage.setItem(KEY, on ? "on" : "off")
}

/** Whether this phone can do biometrics at all (hardware + something enrolled). */
export async function canUseBiometrics(): Promise<boolean> {
  const [hardware, enrolled] = await Promise.all([
    LocalAuthentication.hasHardwareAsync(),
    LocalAuthentication.isEnrolledAsync(),
  ])
  return hardware && enrolled
}

/** Face ID (falling back to the passcode, as iOS does). */
export async function unlock(promptMessage = "Unlock TenTen"): Promise<boolean> {
  const result = await LocalAuthentication.authenticateAsync({ promptMessage })
  return result.success
}
