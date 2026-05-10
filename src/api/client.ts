import axios from 'axios';

const client = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  withCredentials: true,
});

// Attach the access token to every request
client.interceptors.request.use((config) => {
  const token = sessionStorage.getItem('accessToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// On 401 responses (expired access token), attempt a silent refresh then
// retry the original request once. If the refresh itself fails (expired or
// missing refresh-token cookie) the error propagates and AuthContext logs
// the user out.
let refreshing: Promise<string> | null = null;

client.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config;

    // Only retry on 401, only once, and skip the refresh endpoint itself
    // to prevent infinite loops.
    if (
      error.response?.status !== 401 ||
      original._retried ||
      original.url?.includes('/auth/refresh')
    ) {
      return Promise.reject(error);
    }

    original._retried = true;

    // Deduplicate concurrent refresh calls — if multiple requests 401 at the
    // same time, only one refresh round-trip is made.
    if (!refreshing) {
      refreshing = client
        .post<{ data: { accessToken: string } }>('/api/v1/auth/refresh')
        .then(({ data }) => {
          const token = data.data.accessToken;
          sessionStorage.setItem('accessToken', token);
          return token;
        })
        .finally(() => {
          refreshing = null;
        });
    }

    try {
      const newToken = await refreshing;
      original.headers.Authorization = `Bearer ${newToken}`;
      return client(original);
    } catch {
      // Refresh failed — clear the stale token and let the caller handle it
      sessionStorage.removeItem('accessToken');
      return Promise.reject(error);
    }
  }
);

export default client;
