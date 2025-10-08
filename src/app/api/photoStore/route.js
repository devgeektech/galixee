import { createWithEqualityFn } from "zustand/traditional";

const useStore = createWithEqualityFn((set) => ({
  // State
  albums: [],
  loading: false,
  error: null,

  // Actions
  setAlbums: (albums) => set({ albums }),
  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error }),

  // Album operations
  addAlbum: (album) =>
    set((state) => ({
      albums: [album, ...state.albums],
    })),

  updateAlbum: (albumId, updates) =>
    set((state) => ({
      albums: state.albums.map((album) =>
        album.id === albumId ? { ...album, ...updates } : album
      ),
    })),

  deleteAlbum: (albumId) =>
    set((state) => ({
      albums: state.albums.filter((album) => album.id !== albumId),
    })),

  // Photo operations
  addPhoto: (albumId, photo) =>
    set((state) => ({
      albums: state.albums.map((album) => {
        if (album.id === albumId) {
          return {
            ...album,
            photos: [...(album.photos || []), photo],
          };
        }
        return album;
      }),
    })),

  deletePhoto: (albumId, photoId) =>
    set((state) => ({
      albums: state.albums.map((album) => {
        if (album.id === albumId) {
          return {
            ...album,
            photos: album.photos.filter((photo) => photo.id !== photoId),
          };
        }
        return album;
      }),
    })),

  // Reset store
  reset: () => set({ albums: [], loading: false, error: null }),
}));