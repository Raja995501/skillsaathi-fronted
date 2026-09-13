import apiClient from './axiosClient';

export const searchApi = {
  /**
   * Search users/tutors by category, location, or online preference
   * 
   * @param {Object} params
   * @param {string} [params.city] - City name
   * @param {string} [params.state] - State name
   * @param {number|string} [params.category] - Category ID (e.g. 1, 2)
   * @param {string} [params.online] - Online preference ('ONLINE', 'OFFLINE', 'BOTH')
   * @param {boolean} [params.sortByMatch] - Sort by match score (requires logged-in user)
   * @param {number} [params.page] - Page number (default: 0)
   * @param {number} [params.size] - Page size (default: 20)
   */
  searchUsers: (params = {}) => {
    return apiClient.get('/search/users', { params });
  },

  /**
   * Helper function: Category click par direct call karne ke liye
   * @param {number|string} categoryId 
   */
  getTutorsByCategory: (categoryId, page = 0, size = 20) => {
    return apiClient.get('/search/users', {
      params: {
        category: categoryId,
        page,
        size,
      },
    });
  },

  /**
   * Get specific user profile by ID
   * @param {number|string} id - User ID
   */
  getUserById: (id) => {
    return apiClient.get(`/users/${id}`); // Apne backend user profile endpoint ke mutabiq path check kar lein (jaise /users/{id} ya /api/users/{id})
  },
};