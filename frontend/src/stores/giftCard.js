import { computed } from 'vue';
import { useStore } from 'vuex';
import { giftCardApi } from '@/api';

export const giftCardModule = {
  namespaced: true,
  state: () => ({
    cards: [],
    totalBalance: '0.00',
    denominations: [],
    loading: false
  }),
  getters: {
    availableCards(state) {
      return state.cards.filter((c) => c.status === 'bound' && parseFloat(c.balance) > 0);
    },
    totalAvailableBalance(_state, getters) {
      return getters.availableCards
        .reduce((sum, card) => sum + (parseFloat(card.balance) || 0), 0)
        .toFixed(2);
    }
  },
  mutations: {
    SET_CARDS(state, cards) {
      state.cards = cards;
    },
    SET_TOTAL_BALANCE(state, balance) {
      state.totalBalance = balance;
    },
    SET_DENOMINATIONS(state, denominations) {
      state.denominations = denominations;
    },
    SET_LOADING(state, loading) {
      state.loading = loading;
    },
    ADD_CARD(state, card) {
      state.cards.unshift(card);
      state.totalBalance = (parseFloat(state.totalBalance) + parseFloat(card.balance)).toFixed(2);
    },
    UPDATE_CARD(state, card) {
      const idx = state.cards.findIndex((c) => c.id === card.id);
      if (idx >= 0) {
        state.cards.splice(idx, 1, card);
      }
    }
  },
  actions: {
    async fetchDenominations({ commit }) {
      try {
        const data = await giftCardApi.getDenominations();
        commit('SET_DENOMINATIONS', data);
        return data;
      } catch {
        return [];
      }
    },
    async fetchMyCards({ commit }) {
      try {
        commit('SET_LOADING', true);
        const data = await giftCardApi.getMyCards();
        commit('SET_CARDS', data.list || []);
        commit('SET_TOTAL_BALANCE', data.total_balance || '0.00');
        return data;
      } catch {
        commit('SET_CARDS', []);
        commit('SET_TOTAL_BALANCE', '0.00');
        return { list: [], total_balance: '0.00' };
      } finally {
        commit('SET_LOADING', false);
      }
    },
    async fetchAvailableCards({ commit }) {
      try {
        const data = await giftCardApi.getAvailableCards();
        return data;
      } catch {
        return { list: [], total_balance: '0.00' };
      }
    },
    async purchase({ commit }, amount) {
      const card = await giftCardApi.purchase(amount);
      return card;
    },
    async bind({ commit }, cardNo) {
      const card = await giftCardApi.bind(cardNo);
      commit('ADD_CARD', card);
      return card;
    }
  }
};

export function useGiftCardStore() {
  const store = useStore();

  const cards = computed(() => store.state.giftCard.cards);
  const totalBalance = computed(() => store.state.giftCard.totalBalance);
  const denominations = computed(() => store.state.giftCard.denominations);
  const loading = computed(() => store.state.giftCard.loading);
  const availableCards = computed(() => store.getters['giftCard/availableCards']);
  const totalAvailableBalance = computed(() => store.getters['giftCard/totalAvailableBalance']);

  const fetchDenominations = () => store.dispatch('giftCard/fetchDenominations');
  const fetchMyCards = () => store.dispatch('giftCard/fetchMyCards');
  const fetchAvailableCards = () => store.dispatch('giftCard/fetchAvailableCards');
  const purchase = (amount) => store.dispatch('giftCard/purchase', amount);
  const bind = (cardNo) => store.dispatch('giftCard/bind', cardNo);

  return {
    cards,
    totalBalance,
    denominations,
    loading,
    availableCards,
    totalAvailableBalance,
    fetchDenominations,
    fetchMyCards,
    fetchAvailableCards,
    purchase,
    bind
  };
}
