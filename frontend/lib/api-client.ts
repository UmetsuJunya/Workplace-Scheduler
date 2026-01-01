/**
 * API Client for Workplace Scheduler Backend
 */

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

class ApiError extends Error {
  constructor(
    message: string,
    public statusCode: number,
    public response?: any
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

class ApiClient {
  private baseUrl: string;
  private token: string | null = null;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
    // Load token from localStorage if available
    if (typeof window !== 'undefined') {
      this.token = localStorage.getItem('access_token');
    }
  }

  setToken(token: string | null) {
    this.token = token;
    if (typeof window !== 'undefined') {
      if (token) {
        localStorage.setItem('access_token', token);
      } else {
        localStorage.removeItem('access_token');
      }
    }
  }

  getToken(): string | null {
    return this.token;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    // Always get the latest token from localStorage
    const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : this.token;

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new ApiError(
        error.message || `HTTP Error: ${response.status}`,
        response.status,
        error
      );
    }

    // Handle 204 No Content responses (e.g., DELETE operations)
    if (response.status === 204) {
      return undefined as T;
    }

    return response.json();
  }

  // Auth endpoints
  async login(emailOrName: string, password: string) {
    const data = await this.request<{ access_token: string; user: any }>(
      '/auth/login',
      {
        method: 'POST',
        body: JSON.stringify({ email: emailOrName, password }),
      }
    );
    this.setToken(data.access_token);
    return data;
  }

  async register(name: string, email: string, password: string) {
    const data = await this.request<{ access_token: string; user: any }>(
      '/auth/register',
      {
        method: 'POST',
        body: JSON.stringify({ name, email, password }),
      }
    );
    this.setToken(data.access_token);
    return data;
  }

  logout() {
    this.setToken(null);
  }

  async canRegister() {
    return this.request<{ canRegister: boolean }>('/auth/can-register');
  }

  // Users endpoints
  async getUsers() {
    return this.request<any[]>('/users');
  }

  async getUser(id: string) {
    return this.request<any>(`/users/${id}`);
  }

  async createUser(data: { name: string; email?: string }) {
    return this.request<any>('/users', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateUser(id: string, data: { name?: string; email?: string }) {
    return this.request<any>(`/users/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  async deleteUser(id: string) {
    return this.request<void>(`/users/${id}`, {
      method: 'DELETE',
    });
  }

  // Projects endpoints
  async getProjects() {
    return this.request<any[]>('/projects');
  }

  async getProject(id: string) {
    return this.request<any>(`/projects/${id}`);
  }

  async createProject(data: { name: string; userIds: string[] }) {
    return this.request<any>('/projects', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateProject(id: string, data: { name?: string; userIds?: string[] }) {
    return this.request<any>(`/projects/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  async deleteProject(id: string) {
    return this.request<void>(`/projects/${id}`, {
      method: 'DELETE',
    });
  }

  // Schedules endpoints
  async getSchedules(startDate?: string, endDate?: string) {
    const params = new URLSearchParams();
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);
    const query = params.toString() ? `?${params.toString()}` : '';
    return this.request<any[]>(`/schedules${query}`);
  }

  async getSchedulesByUser(userId: string) {
    return this.request<any[]>(`/schedules/user/${userId}`);
  }

  async createSchedule(data: {
    userId: string;
    date: string;
    am?: string;
    pm?: string;
    note?: string;
  }) {
    return this.request<any>('/schedules', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async bulkCreateSchedules(schedules: Array<{
    userId: string;
    date: string;
    am?: string;
    pm?: string;
    note?: string;
  }>) {
    return this.request<any[]>('/schedules/bulk', {
      method: 'POST',
      body: JSON.stringify(schedules),
    });
  }

  async updateSchedule(id: string, data: {
    am?: string;
    pm?: string;
    note?: string;
  }) {
    return this.request<any>(`/schedules/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  async deleteSchedule(id: string) {
    return this.request<void>(`/schedules/${id}`, {
      method: 'DELETE',
    });
  }

  // Location Presets endpoints
  async getLocationPresets() {
    return this.request<any[]>('/location-presets');
  }

  async createLocationPreset(data: { name: string; color?: string; order?: number }) {
    return this.request<any>('/location-presets', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateLocationPreset(id: string, data: { name?: string; color?: string; order?: number }) {
    return this.request<any>(`/location-presets/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  async deleteLocationPreset(id: string) {
    return this.request<void>(`/location-presets/${id}`, {
      method: 'DELETE',
    });
  }

  async reorderLocationPresets(ids: string[]) {
    return this.request<any[]>('/location-presets/reorder', {
      method: 'POST',
      body: JSON.stringify({ ids }),
    });
  }
}

// Export singleton instance
export const apiClient = new ApiClient(API_URL);
export { ApiError };
export type { ApiClient };
