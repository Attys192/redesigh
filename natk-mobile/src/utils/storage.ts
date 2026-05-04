/**
 * AsyncStorage Utility
 * Handles persistent storage for user preferences
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { UserRole } from '../types';

const STORAGE_KEYS = {
  USER_ROLE: '@natk:userRole',
  SELECTED_GROUP: '@natk:selectedGroup',
  TEACHER_NAME: '@natk:teacherName',
  ONBOARDING_COMPLETED: '@natk:onboardingCompleted',
} as const;

// ============================================================================
// User Role
// ============================================================================

export const saveUserRole = async (role: UserRole): Promise<void> => {
  await AsyncStorage.setItem(STORAGE_KEYS.USER_ROLE, role);
};

export const getUserRole = async (): Promise<UserRole | null> => {
  const role = await AsyncStorage.getItem(STORAGE_KEYS.USER_ROLE);
  return role as UserRole | null;
};

// ============================================================================
// Selected Group (for students)
// ============================================================================

export const saveSelectedGroup = async (group: string): Promise<void> => {
  await AsyncStorage.setItem(STORAGE_KEYS.SELECTED_GROUP, group);
};

export const getSelectedGroup = async (): Promise<string | null> => {
  return await AsyncStorage.getItem(STORAGE_KEYS.SELECTED_GROUP);
};

export const clearSelectedGroup = async (): Promise<void> => {
  await AsyncStorage.removeItem(STORAGE_KEYS.SELECTED_GROUP);
};

// ============================================================================
// Teacher Name (for teachers)
// ============================================================================

export const saveTeacherName = async (name: string): Promise<void> => {
  await AsyncStorage.setItem(STORAGE_KEYS.TEACHER_NAME, name);
};

export const getTeacherName = async (): Promise<string | null> => {
  return await AsyncStorage.getItem(STORAGE_KEYS.TEACHER_NAME);
};

// ============================================================================
// Onboarding Status
// ============================================================================

export const setOnboardingCompleted = async (completed: boolean): Promise<void> => {
  await AsyncStorage.setItem(STORAGE_KEYS.ONBOARDING_COMPLETED, String(completed));
};

export const isOnboardingCompleted = async (): Promise<boolean> => {
  const value = await AsyncStorage.getItem(STORAGE_KEYS.ONBOARDING_COMPLETED);
  return value === 'true';
};

// ============================================================================
// Clear All Data
// ============================================================================

export const clearAllStorage = async (): Promise<void> => {
  await AsyncStorage.multiRemove([
    STORAGE_KEYS.USER_ROLE,
    STORAGE_KEYS.SELECTED_GROUP,
    STORAGE_KEYS.TEACHER_NAME,
    STORAGE_KEYS.ONBOARDING_COMPLETED,
  ]);
};

export default STORAGE_KEYS;
