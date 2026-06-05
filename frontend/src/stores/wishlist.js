import { computed } from 'vue';
import { useStore } from 'vuex';
import { wishlistApi } from '@/api';

export const wishlistModule = {
  namespaced: true,
  state: () => ({
    wishlists: [],
    currentWishlist: null
  }),
  getters: {},
  mutations: {
    SET_WISHLISTS(state, wishlists) {
      state.wishlists = wishlists;
    },
    SET_CURRENT(state, wishlist) {
      state.currentWishlist = wishlist;
    },
    ADD_WISHLIST(state, wishlist) {
      state.wishlists = [wishlist, ...state.wishlists];
    },
    UPDATE_WISHLIST(state, { id, data }) {
      state.wishlists = state.wishlists.map((w) =>
        w.id === id ? { ...w, ...data } : w
      );
    },
    REMOVE_WISHLIST(state, id) {
      state.wishlists = state.wishlists.filter((w) => w.id !== id);
    }
  },
  actions: {
    async fetchWishlists({ commit }) {
      try {
        const data = await wishlistApi.list();
        commit('SET_WISHLISTS', data);
        return data;
      } catch {
        commit('SET_WISHLISTS', []);
        return [];
      }
    },
    async fetchDetail({ commit }, id) {
      try {
        const data = await wishlistApi.detail(id);
        commit('SET_CURRENT', data);
        return data;
      } catch {
        commit('SET_CURRENT', null);
        return null;
      }
    },
    async create({ commit, dispatch }, name) {
      const result = await wishlistApi.create(name);
      await dispatch('fetchWishlists');
      return result;
    },
    async update({ commit }, { id, name }) {
      const result = await wishlistApi.update(id, name);
      commit('UPDATE_WISHLIST', { id, data: { name } });
      return result;
    },
    async remove({ commit }, id) {
      await wishlistApi.remove(id);
      commit('REMOVE_WISHLIST', id);
    },
    async addItem({ dispatch }, { wishlistId, productId }) {
      const result = await wishlistApi.addItem(wishlistId, productId);
      await dispatch('fetchWishlists');
      return result;
    },
    async removeItem({ dispatch }, { wishlistId, itemId }) {
      await wishlistApi.removeItem(wishlistId, itemId);
      await dispatch('fetchWishlists');
    },
    async share({ dispatch }, id) {
      const result = await wishlistApi.share(id);
      await dispatch('fetchWishlists');
      return result;
    },
    async unshare({ dispatch }, id) {
      await wishlistApi.unshare(id);
      await dispatch('fetchWishlists');
    }
  }
};

export function useWishlistStore() {
  const store = useStore();

  const wishlists = computed(() => store.state.wishlist.wishlists);
  const currentWishlist = computed(() => store.state.wishlist.currentWishlist);

  const fetchWishlists = () => store.dispatch('wishlist/fetchWishlists');
  const fetchDetail = (id) => store.dispatch('wishlist/fetchDetail', id);
  const create = (name) => store.dispatch('wishlist/create', name);
  const update = (id, name) => store.dispatch('wishlist/update', { id, name });
  const remove = (id) => store.dispatch('wishlist/remove', id);
  const addItem = (wishlistId, productId) =>
    store.dispatch('wishlist/addItem', { wishlistId, productId });
  const removeItem = (wishlistId, itemId) =>
    store.dispatch('wishlist/removeItem', { wishlistId, itemId });
  const share = (id) => store.dispatch('wishlist/share', id);
  const unshare = (id) => store.dispatch('wishlist/unshare', id);

  return {
    wishlists,
    currentWishlist,
    fetchWishlists,
    fetchDetail,
    create,
    update,
    remove,
    addItem,
    removeItem,
    share,
    unshare
  };
}
