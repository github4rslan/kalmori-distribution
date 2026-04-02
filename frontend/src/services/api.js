import axios from 'axios';

const BASE_URL = process.env.REACT_APP_BACKEND_URL || '';

class ApiService {
  token = null;

  get headers() {
    const h = {};
    if (this.token) h['Authorization'] = `Bearer ${this.token}`;
    return h;
  }

  setToken(token) {
    this.token = token;
  }

  // Auth
  async login(email, password) {
    const response = await axios.post(`${BASE_URL}/api/auth/login`, { email, password });
    return response.data;
  }

  async register(email, password, artist_name, user_role, legal_name, country, recaptcha_token, state, town, post_code) {
    const response = await axios.post(`${BASE_URL}/api/auth/register`, {
      email, password, artist_name,
      user_role: user_role || 'artist',
      legal_name: legal_name || '',
      country: country || '',
      state: state || '',
      town: town || '',
      post_code: post_code || '',
      recaptcha_token: recaptcha_token || null
    });
    return response.data;
  }

  async getMe() {
    const response = await axios.get(`${BASE_URL}/api/auth/me`, { headers: this.headers });
    return response.data;
  }

  // Artists
  async getArtists() {
    const response = await axios.get(`${BASE_URL}/api/artists`);
    return response.data;
  }

  async getArtist(id) {
    const response = await axios.get(`${BASE_URL}/api/artists/${id}`);
    return response.data;
  }

  async updateArtist(id, data) {
    const response = await axios.put(`${BASE_URL}/api/artists/${id}`, data, { headers: this.headers });
    return response.data;
  }

  async updateProfile(data) {
    const response = await axios.put(`${BASE_URL}/api/artists/profile`, data, { headers: this.headers });
    return response.data;
  }

  // Releases
  async getReleases(artistId, genre) {
    const params = new URLSearchParams();
    if (artistId) params.append('artist_id', artistId);
    if (genre) params.append('genre', genre);
    const response = await axios.get(`${BASE_URL}/api/releases?${params.toString()}`, { headers: this.headers });
    return response.data;
  }

  async getRelease(id) {
    const response = await axios.get(`${BASE_URL}/api/releases/${id}`, { headers: this.headers });
    return response.data;
  }

  async createRelease(data) {
    const response = await axios.post(`${BASE_URL}/api/releases`, data, { headers: this.headers });
    return response.data;
  }

  async deleteRelease(id) {
    const response = await axios.delete(`${BASE_URL}/api/releases/${id}`, { headers: this.headers });
    return response.data;
  }

  async submitForDistribution(releaseId) {
    const response = await axios.post(`${BASE_URL}/api/releases/${releaseId}/submit-distribution`, {}, { headers: this.headers });
    return response.data;
  }

  // Tracks
  async getTracks(releaseId) {
    const params = releaseId ? `?release_id=${releaseId}` : '';
    const response = await axios.get(`${BASE_URL}/api/tracks${params}`, { headers: this.headers });
    return response.data;
  }

  async getTrack(id) {
    const response = await axios.get(`${BASE_URL}/api/tracks/${id}`, { headers: this.headers });
    return response.data;
  }

  async createTrack(data) {
    const response = await axios.post(`${BASE_URL}/api/tracks`, data, { headers: this.headers });
    return response.data;
  }

  async deleteTrack(id) {
    const response = await axios.delete(`${BASE_URL}/api/tracks/${id}`, { headers: this.headers });
    return response.data;
  }

  async uploadAudio(trackId, audioBase64, filename = 'track.mp3') {
    const response = await axios.post(`${BASE_URL}/api/tracks/${trackId}/upload-audio-base64`, {
      audio_data: audioBase64, filename
    }, { headers: { ...this.headers, 'Content-Type': 'application/json' }, timeout: 120000 });
    return response.data;
  }

  async uploadAudioFile(trackId, file) {
    const formData = new FormData();
    formData.append('file', file);
    const response = await axios.post(`${BASE_URL}/api/tracks/${trackId}/upload-audio`, formData, {
      headers: { ...this.headers, 'Content-Type': 'multipart/form-data' }, timeout: 120000
    });
    return response.data;
  }

  getStreamUrl(trackId) {
    return `${BASE_URL}/api/tracks/${trackId}/stream`;
  }

  // Cover Art Upload
  async uploadCoverArt(releaseId, file) {
    const formData = new FormData();
    formData.append('file', file);
    const response = await axios.post(`${BASE_URL}/api/releases/${releaseId}/upload-cover`, formData, {
      headers: { ...this.headers, 'Content-Type': 'multipart/form-data' }
    });
    return response.data;
  }

  getCoverArtUrl(releaseId) {
    return `${BASE_URL}/api/releases/${releaseId}/cover`;
  }

  // Wallet & Payments
  async getWallet() {
    const response = await axios.get(`${BASE_URL}/api/wallet`, { headers: this.headers });
    return response.data;
  }

  async getKalmoriWallet() {
    const response = await axios.get(`${BASE_URL}/api/kalmori-wallet`, { headers: this.headers });
    return response.data;
  }

  async addEarnings(amount) {
    const response = await axios.post(`${BASE_URL}/api/wallet/add-earnings?amount=${amount}`, {}, { headers: this.headers });
    return response.data;
  }

  async getPaymentMethods() {
    const response = await axios.get(`${BASE_URL}/api/payment-methods`, { headers: this.headers });
    return response.data;
  }

  async addPaymentMethod(data) {
    const response = await axios.post(`${BASE_URL}/api/payment-methods`, data, { headers: this.headers });
    return response.data;
  }

  async deletePaymentMethod(id) {
    const response = await axios.delete(`${BASE_URL}/api/payment-methods/${id}`, { headers: this.headers });
    return response.data;
  }

  async requestWithdrawal(amount, paymentMethodId) {
    const response = await axios.post(`${BASE_URL}/api/kalmori-withdrawals`, {
      amount, payment_method_id: paymentMethodId
    }, { headers: this.headers });
    return response.data;
  }

  async getWithdrawals() {
    const response = await axios.get(`${BASE_URL}/api/kalmori-withdrawals`, { headers: this.headers });
    return response.data;
  }

  // Notifications
  async getNotifications() {
    const response = await axios.get(`${BASE_URL}/api/notifications`, { headers: this.headers });
    return response.data;
  }

  async markNotificationRead(id) {
    const response = await axios.put(`${BASE_URL}/api/notifications/${id}/read`, {}, { headers: this.headers });
    return response.data;
  }

  async markAllNotificationsRead() {
    const response = await axios.put(`${BASE_URL}/api/notifications/read-all`, {}, { headers: this.headers });
    return response.data;
  }

  async getUnreadCount() {
    const response = await axios.get(`${BASE_URL}/api/notifications/unread-count`, { headers: this.headers });
    return response.data;
  }

  // Theme
  async getTheme() {
    const response = await axios.get(`${BASE_URL}/api/theme`, { headers: this.headers });
    return response.data;
  }

  async updateTheme(theme) {
    const response = await axios.put(`${BASE_URL}/api/theme`, theme, { headers: this.headers });
    return response.data;
  }

  // Analytics
  async getChartData(days = 7) {
    const response = await axios.get(`${BASE_URL}/api/analytics/chart-data?days=${days}`, { headers: this.headers });
    return response.data;
  }

  async getPlatformBreakdown() {
    const response = await axios.get(`${BASE_URL}/api/analytics/platform-breakdown`, { headers: this.headers });
    return response.data;
  }

  async getAnalytics() {
    const response = await axios.get(`${BASE_URL}/api/analytics/overview`, { headers: this.headers });
    return response.data;
  }

  // Social/Followers
  async followArtist(artistId) {
    const response = await axios.post(`${BASE_URL}/api/artists/${artistId}/follow`, {}, { headers: this.headers });
    return response.data;
  }

  async unfollowArtist(artistId) {
    const response = await axios.delete(`${BASE_URL}/api/artists/${artistId}/follow`, { headers: this.headers });
    return response.data;
  }

  async isFollowing(artistId) {
    const response = await axios.get(`${BASE_URL}/api/artists/${artistId}/is-following`, { headers: this.headers });
    return response.data;
  }

  async getFollowerCount(artistId) {
    const response = await axios.get(`${BASE_URL}/api/artists/${artistId}/follower-count`);
    return response.data;
  }

  // Payment/Checkout
  async createCheckoutSession(releaseId, originUrl) {
    const response = await axios.post(`${BASE_URL}/api/payments/checkout`, {
      release_id: releaseId, origin_url: originUrl
    }, { headers: this.headers });
    return response.data;
  }

  async getPaymentStatus(sessionId) {
    const response = await axios.get(`${BASE_URL}/api/payments/status/${sessionId}`, { headers: this.headers });
    return response.data;
  }

  // Distribution
  async getDistributionStatus(releaseId) {
    const response = await axios.get(`${BASE_URL}/api/releases/${releaseId}/distribution-status`, { headers: this.headers });
    return response.data;
  }

  // Credits
  async purchaseCredits(packageId, credits, price) {
    const response = await axios.post(`${BASE_URL}/api/credits/purchase`, {
      package_id: packageId, credits, price
    }, { headers: this.headers });
    return response.data;
  }

  async purchaseCreditsWithWallet(packageId, credits, price) {
    const response = await axios.post(`${BASE_URL}/api/credits/purchase-with-wallet`, {
      package_id: packageId, credits, price
    }, { headers: this.headers });
    return response.data;
  }

  async getCredits() {
    const response = await axios.get(`${BASE_URL}/api/credits`, { headers: this.headers });
    return response.data;
  }

  // CMS
  async getCmsSlides() {
    const response = await axios.get(`${BASE_URL}/api/cms/slides`);
    return response.data;
  }

  async getCmsPricing() {
    const response = await axios.get(`${BASE_URL}/api/cms/pricing`);
    return response.data;
  }

  async getCmsLegal(pageId) {
    const response = await axios.get(`${BASE_URL}/api/cms/legal/${pageId}`);
    return response.data;
  }

  async getCmsPages() {
    const response = await axios.get(`${BASE_URL}/api/cms/pages`);
    return response.data;
  }

  async getCmsPage(pageId) {
    const response = await axios.get(`${BASE_URL}/api/cms/page/${pageId}`);
    return response.data;
  }

  async getCmsInstrumentals() {
    const response = await axios.get(`${BASE_URL}/api/cms/instrumentals`);
    return response.data;
  }

  // Testimonials
  async getTestimonials() {
    const response = await axios.get(`${BASE_URL}/api/testimonials`);
    return response.data;
  }

  async createTestimonial(data) {
    const response = await axios.post(`${BASE_URL}/api/testimonials`, data, { headers: this.headers });
    return response.data;
  }

  // Orders
  async createPromotionOrder(data) {
    const response = await axios.post(`${BASE_URL}/api/orders/promotion-service`, data);
    return response.data;
  }

  async createInstrumentalRequest(data) {
    const response = await axios.post(`${BASE_URL}/api/orders/instrumental-request`, data);
    return response.data;
  }

  // Subscription Plans
  async getSubscriptionPlans() {
    const response = await axios.get(`${BASE_URL}/api/subscriptions/plans`);
    return response.data;
  }

  // Admin
  async getAdminDashboard() {
    const response = await axios.get(`${BASE_URL}/api/admin/dashboard`, { headers: this.headers });
    return response.data;
  }

  async getAdminSubmissions() {
    const response = await axios.get(`${BASE_URL}/api/admin/submissions`, { headers: this.headers });
    return response.data;
  }

  async getAdminUsers() {
    const response = await axios.get(`${BASE_URL}/api/admin/users`, { headers: this.headers });
    return response.data;
  }

  async reviewSubmission(releaseId, data) {
    const response = await axios.put(`${BASE_URL}/api/admin/submissions/${releaseId}/review`, data, { headers: this.headers });
    return response.data;
  }
}

export const api = new ApiService();
export default api;
