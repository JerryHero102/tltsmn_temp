function getApiBaseUrl(): string {
  if (typeof window !== 'undefined') {
    return '/api';
  }
  let envUrl = process.env.NEXT_PUBLIC_API_URL || 'https://api.thieulamtaysonmiennam.id.vn/api';
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

export async function apiRequest(path: string, options: RequestInit = {}, isRetry = false): Promise<any> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'bypass-tunnel-reminder': 'true',
    ...(options.headers as Record<string, string>),
  };

  const controller = new AbortController();
  const timeoutMs = options.method === 'POST' ? 12000 : 8000;
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch(`${API_BASE}${path}`, {
      ...options,
      headers,
      credentials: 'include',
      signal: options.signal || controller.signal,
    });
    clearTimeout(timeoutId);

    if (res.status === 401) {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('access_token');
        if (!window.location.pathname.startsWith('/login')) {
          window.location.href = '/login';
        }
      }
      throw new Error('Chưa đăng nhập hoặc phiên làm việc đã hết hạn');
    }

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      throw new Error(errorData.message || `Yêu cầu thất bại (${res.status})`);
    }

    return res.json();
  } catch (err: any) {
    clearTimeout(timeoutId);
    if ((err.name === 'AbortError' || err.name === 'TypeError' || err.message?.includes('fetch')) && !isRetry) {
      return apiRequest(path, options, true);
    }
    if (err.name === 'AbortError') {
      throw new Error('Kết nối tới máy chủ quá thời gian (Timeout). Vui lòng thử lại.');
    }
    throw err;
  }
}

export const api = {
  // Authentication
  login: async (id_system: string, password: string) => {
    return apiRequest('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ id_system, password }),
    });
  },

  logout: async () => {
    return apiRequest('/auth/logout', {
      method: 'POST',
    });
  },

  getMe: async () => {
    return apiRequest('/auth/me', {
      method: 'GET',
    });
  },

  // Students
  getStudents: async () => {
    return apiRequest('/students', {
      method: 'GET',
    });
  },

  getStudentById: async (id: string) => {
    return apiRequest(`/students/${id}`, {
      method: 'GET',
    });
  },

  createStudent: async (data: any) => {
    return apiRequest('/students', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  updateStudent: async (id: string, data: any) => {
    return apiRequest(`/students/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  deleteStudent: async (id: string) => {
    return apiRequest(`/students/${id}`, {
      method: 'DELETE',
    });
  },

  // Receipts & Matrix
  getReceipts: async (params: { month?: number; year?: number; student_id?: string } = {}) => {
    const query = new URLSearchParams();
    if (params.month) query.append('month', params.month.toString());
    if (params.year) query.append('year', params.year.toString());
    if (params.student_id) query.append('student_id', params.student_id);

    return apiRequest(`/receipts?${query.toString()}`, {
      method: 'GET',
    });
  },

  getTuitionMatrix: async (year?: number) => {
    const query = year ? `?year=${year}` : '';
    return apiRequest(`/receipts/matrix${query}`, {
      method: 'GET',
    });
  },

  createReceipt: async (receiptData: {
    id_profile: string;
    payer_name: string;
    month: number;
    receipt_date: string;
    amount: number;
    schedule_note?: string;
    payment_content?: string;
    image_url?: string;
    base64Image?: string;
  }) => {
    const payload = {
      ...receiptData,
      image_url: receiptData.image_url || receiptData.base64Image,
      base64Image: receiptData.base64Image || receiptData.image_url,
    };
    return apiRequest('/receipts', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  // Client-side Local Storage Fallback & Offline Queue
  savePendingReceiptLocally: (receipt: any) => {
    if (typeof window === 'undefined') return;
    const existing = JSON.parse(localStorage.getItem('pending_receipts') || '[]');
    existing.push({
      ...receipt,
      local_id: `local_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      created_at: new Date().toISOString(),
    });
    localStorage.setItem('pending_receipts', JSON.stringify(existing));
  },

  getPendingReceiptsLocally: (): any[] => {
    if (typeof window === 'undefined') return [];
    return JSON.parse(localStorage.getItem('pending_receipts') || '[]');
  },

  clearPendingReceiptLocally: (localId: string) => {
    if (typeof window === 'undefined') return;
    const existing = JSON.parse(localStorage.getItem('pending_receipts') || '[]');
    const updated = existing.filter((item: any) => item.local_id !== localId);
    localStorage.setItem('pending_receipts', JSON.stringify(updated));
  },

  syncPendingReceipts: async (onProgress?: () => void) => {
    if (typeof window === 'undefined') return;
    const pending = api.getPendingReceiptsLocally();
    if (pending.length === 0) return;

    for (const item of pending) {
      try {
        await api.createReceipt(item);
        api.clearPendingReceiptLocally(item.local_id);
        if (onProgress) onProgress();
      } catch (err) {
        console.error('Lỗi khi đồng bộ biên lai từ Local Storage:', err);
      }
    }
  },
};
