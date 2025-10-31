import AsyncStorage from '@react-native-async-storage/async-storage';

export type UserRole = 'profesor' | 'alumno';

const KEY_PREFIX = 'user_role:';
const KEY_LAST_SELECTED = 'last_selected_role';

export async function setUserRole(uid: string, role: UserRole): Promise<void> {
  try {
    await AsyncStorage.setItem(KEY_PREFIX + uid, role);
  } catch (e) {
    // Silently ignore storage errors for now (preventive implementation)
  }
}

export async function getUserRole(uid: string): Promise<UserRole | null> {
  try {
    const value = await AsyncStorage.getItem(KEY_PREFIX + uid);
    if (value === 'alumno' || value === 'profesor') return value;
    return null;
  } catch (e) {
    return null;
  }
}

export async function setLastSelectedRole(role: UserRole): Promise<void> {
  try {
    await AsyncStorage.setItem(KEY_LAST_SELECTED, role);
  } catch (e) {
    // ignore
  }
}

export async function getLastSelectedRole(): Promise<UserRole | null> {
  try {
    const value = await AsyncStorage.getItem(KEY_LAST_SELECTED);
    if (value === 'alumno' || value === 'profesor') return value;
    return null;
  } catch (e) {
    return null;
  }
}