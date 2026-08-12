function getApiBaseUrl(): string {
  let envUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';
  envUrl = envUrl.replace(/\/+$/, '');
  if (!envUrl.endsWith('/api')) {
    envUrl = `${envUrl}/api`;
  }
  return envUrl;
}

const API_BASE = getApiBaseUrl();

// Vietnamese Accent Normalization & Fuzzy Accent-Insensitive Matching
export function removeVietnameseAccents(str: string): string {
  if (!str) return '';
  return str
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .toLowerCase();
}

export function matchSearch(text: string, query: string): boolean {
  if (!query || !query.trim()) return true;
  if (!text) return false;

  const cleanText = removeVietnameseAccents(text);
  const cleanQuery = removeVietnameseAccents(query.trim());

  // 1. Direct match or no-space match (e.g. "dambaolinh" matches "Đàm Bảo Linh")
  const textNoSpace = cleanText.replace(/\s+/g, '');
  const queryNoSpace = cleanQuery.replace(/\s+/g, '');
  if (textNoSpace.includes(queryNoSpace)) return true;

  // 2. Word-by-word match (e.g. "dam linh" or "dam bao" matches "Đàm Bảo Linh")
  const queryWords = cleanQuery.split(/\s+/).filter(Boolean);
  return queryWords.every((word) => cleanText.includes(word));
}

export async function apiRequest(path: string, options: RequestInit = {}) {
  const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'bypass-tunnel-reminder': 'true',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers as Record<string, string>),
  };

  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers,
    credentials: 'include',
  });

  if (res.status === 401) {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('access_token');
      if (!window.location.pathname.startsWith('/login')) {
        window.location.href = '/login';
      }
    }
  }

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.message || 'Đã có lỗi xảy ra');
  }

  return data;
}

export interface PendingReceipt {
  id: string;
  id_profile: string;
  payer_name: string;
  month: number;
  receipt_date: string;
  amount: number;
  schedule_note: string;
  payment_content: string;
  base64Image: string;
  created_at: string;
  status: 'pending' | 'uploading' | 'failed';
  error?: string;
}

let isSyncing = false;

export const api = {
  // Auth
  login: async (id_system: string, pass: string) => {
    return apiRequest('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ id_system, pass }),
    });
  },

  getMe: async () => {
    return apiRequest('/auth/me');
  },

  logout: async () => {
    try {
      await apiRequest('/auth/logout', { method: 'POST' });
    } catch (e) {
      console.warn('Logout API failed');
    }
  },

  // Students
  getStudents: async () => {
    return apiRequest('/students');
  },

  createStudent: async (studentData: any) => {
    return apiRequest('/students', {
      method: 'POST',
      body: JSON.stringify(studentData),
    });
  },

  updateStudent: async (id: string, studentData: any) => {
    return apiRequest(`/students/${id}`, {
      method: 'PUT',
      body: JSON.stringify(studentData),
    });
  },

  deleteStudent: async (id: string) => {
    return apiRequest(`/students/${id}`, {
      method: 'DELETE',
    });
  },

  // Receipts & Tuition
  getTuitionMatrix: async () => {
    return apiRequest('/receipts/matrix');
  },

  uploadImage: async (base64Image: string) => {
    return apiRequest('/receipts/upload', {
      method: 'POST',
      body: JSON.stringify({ image: base64Image }),
    });
  },

  createReceipt: async (receiptData: any) => {
    return apiRequest('/receipts', {
      method: 'POST',
      body: JSON.stringify(receiptData),
    });
  },

  // Instant LocalStorage Queue Helpers
  getPendingReceipts: (): PendingReceipt[] => {
    if (typeof window === 'undefined') return [];
    try {
      return JSON.parse(localStorage.getItem('pending_receipts') || '[]');
    } catch {
      return [];
    }
  },

  savePendingReceiptLocally: (receiptData: Omit<PendingReceipt, 'id' | 'created_at' | 'status'>): PendingReceipt => {
    const newItem: PendingReceipt = {
      ...receiptData,
      id: 'pending_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
      created_at: new Date().toISOString(),
      status: 'pending',
    };

    if (typeof window !== 'undefined') {
      const existing = api.getPendingReceipts();
      existing.push(newItem);
      localStorage.setItem('pending_receipts', JSON.stringify(existing));
    }

    return newItem;
  },

  removePendingReceiptLocally: (id: string) => {
    if (typeof window === 'undefined') return;
    const existing = api.getPendingReceipts().filter((item) => item.id !== id);
    localStorage.setItem('pending_receipts', JSON.stringify(existing));
  },

  // Sync worker to process pending receipts sequentially with mutex lock
  syncPendingReceipts: async (onProgress?: () => void) => {
    if (typeof window === 'undefined') return;
    if (isSyncing) return; // Prevent concurrent sync loops!

    isSyncing = true;
    try {
      const pendingList = api.getPendingReceipts();
      if (pendingList.length === 0) return;

      for (const item of pendingList) {
        try {
          let imageUrl = '';
          try {
            const uploadRes = await api.uploadImage(item.base64Image);
            imageUrl = (uploadRes && uploadRes.url) ? uploadRes.url : item.base64Image;
          } catch (uploadErr) {
            console.warn('Image upload fallback to base64 for pending receipt:', item.id, uploadErr);
            imageUrl = item.base64Image;
          }

          // Create or update receipt in Postgres database
          await api.createReceipt({
            id_profile: item.id_profile,
            payer_name: item.payer_name,
            month: item.month,
            receipt_date: item.receipt_date,
            amount: item.amount,
            schedule_note: item.schedule_note,
            payment_content: item.payment_content,
            image_url: imageUrl,
          });

          // Remove successfully synced receipt from Local Storage
          api.removePendingReceiptLocally(item.id);
          if (onProgress) onProgress();
        } catch (err: any) {
          console.error('Failed syncing pending receipt:', item.id, err);
        }
      }
    } finally {
      isSyncing = false;
    }
  },
};
