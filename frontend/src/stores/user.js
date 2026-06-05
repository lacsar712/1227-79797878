import { computed } from 'vue';
import { useStore } from 'vuex';
import { authApi } from '@/api';
import { MEMBER_LEVELS, getLevelProgress, calculateMemberPrice } from '@/utils/memberLevels';

export const userModule = {
  namespaced: true,
  state: () => ({
    token: localStorage.getItem('token') || '',
    user: null,
    memberLevels: MEMBER_LEVELS
  }),
  getters: {
    isLoggedIn(state) {
      return !!state.token;
    },
    memberLevel(state) {
      if (!state.user) return null;
      return state.user.member_level || null;
    },
    memberProgress(state) {
      if (!state.user) return null;
      return state.user.member_progress || null;
    },
    totalSpent(state) {
      if (!state.user) return 0;
      return parseFloat(state.user.total_spent || 0);
    },
    memberDiscount(state) {
      if (!state.user?.member_level) return 1.0;
      return state.user.member_level.discount || 1.0;
    }
  },
  mutations: {
    SET_TOKEN(state, token) {
      state.token = token;
    },
    SET_USER(state, user) {
      state.user = user;
    },
    UPDATE_MEMBER_PROGRESS(state, progress) {
      if (state.user) {
        state.user = {
          ...state.user,
          member_level: progress.currentLevel,
          member_progress: progress,
          total_spent: progress.totalSpent
        };
      }
    }
  },
  actions: {
    async fetchUser({ state, commit }) {
      if (!state.token) return null;
      try {
        const user = await authApi.getMe();
        commit('SET_USER', user);
        return user;
      } catch {
        commit('SET_TOKEN', '');
        commit('SET_USER', null);
        localStorage.removeItem('token');
        return null;
      }
    },
    async fetchMemberLevels({ state, commit }) {
      if (!state.token) return null;
      try {
        const data = await authApi.getMemberLevels();
        commit('UPDATE_MEMBER_PROGRESS', data.current);
        return data;
      } catch (e) {
        return null;
      }
    },
    setAuth({ commit }, { token, user }) {
      commit('SET_TOKEN', token);
      commit('SET_USER', user);
      if (token) localStorage.setItem('token', token);
      else localStorage.removeItem('token');
    },
    updateMemberProgress({ commit }, totalSpent) {
      const progress = getLevelProgress(totalSpent);
      commit('UPDATE_MEMBER_PROGRESS', progress);
    },
    logout({ commit }) {
      commit('SET_TOKEN', '');
      commit('SET_USER', null);
      localStorage.removeItem('token');
    }
  }
};

export function useUserStore() {
  const store = useStore();

  const token = computed(() => store.state.user.token);
  const user = computed(() => store.state.user.user);
  const isLoggedIn = computed(() => store.getters['user/isLoggedIn']);
  const memberLevel = computed(() => store.getters['user/memberLevel']);
  const memberProgress = computed(() => store.getters['user/memberProgress']);
  const totalSpent = computed(() => store.getters['user/totalSpent']);
  const memberDiscount = computed(() => store.getters['user/memberDiscount']);
  const memberLevels = computed(() => store.state.user.memberLevels);

  const fetchUser = () => store.dispatch('user/fetchUser');
  const fetchMemberLevels = () => store.dispatch('user/fetchMemberLevels');
  const setAuth = (tok, u) => store.dispatch('user/setAuth', { token: tok, user: u });
  const updateMemberProgress = (totalSpent) => store.dispatch('user/updateMemberProgress', totalSpent);
  const logout = () => store.dispatch('user/logout');

  const getMemberPrice = (price) => {
    if (!isLoggedIn.value || !memberDiscount.value) return null;
    return calculateMemberPrice(parseFloat(price), memberDiscount.value);
  };

  return {
    token,
    user,
    isLoggedIn,
    memberLevel,
    memberProgress,
    totalSpent,
    memberDiscount,
    memberLevels,
    fetchUser,
    fetchMemberLevels,
    setAuth,
    updateMemberProgress,
    logout,
    getMemberPrice
  };
}

