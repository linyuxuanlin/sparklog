import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { NotesStore, AuthStore } from '@/types'

// 笔记状态管理
export const useNotesStore = create<NotesStore>((set) => ({
  notes: [],
  isLoading: false,
  error: null,
  hasMoreNotes: true,
  searchQuery: '',
  selectedTags: [],
  
  setNotes: (notes) => set({ notes }),
  setLoading: (isLoading) => set({ isLoading }),
  setError: (error) => set({ error }),
  setSearchQuery: (searchQuery) => set({ searchQuery }),
  setSelectedTags: (selectedTags) => set({ selectedTags }),
  
  addNote: (note) => set((state) => ({ 
    notes: [note, ...state.notes] 
  })),
  
  updateNote: (sha, updatedNote) => set((state) => ({
    notes: state.notes.map(note => 
      note.sha === sha ? { ...note, ...updatedNote } : note
    )
  })),
  
  deleteNote: (sha) => set((state) => ({
    notes: state.notes.filter(note => note.sha !== sha)
  })),
}))

// 认证状态管理
export const useAuthStore = create<AuthStore>()(
  persist(
    (set) => ({
      isLoggedIn: false,
      token: null,
      
      setAuth: (token) => set({ 
        isLoggedIn: true, 
        token 
      }),
      
      logout: () => set({ 
        isLoggedIn: false, 
        token: null 
      }),
    }),
    {
      name: 'sparklog-auth',
    }
  )
)