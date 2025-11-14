import { Resident } from '@/types/resident';

const STORAGE_KEY = 'election_field_residents';

export const saveToStorage = (residents: Resident[]) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(residents));
  } catch (error) {
    console.error('Failed to save to storage:', error);
  }
};

export const loadFromStorage = (): Resident[] => {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error('Failed to load from storage:', error);
    return [];
  }
};

export const clearStorage = () => {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (error) {
    console.error('Failed to clear storage:', error);
  }
};
