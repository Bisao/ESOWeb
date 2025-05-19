import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import { GamePhase } from '@shared/types';

interface MMOGameState {
  // Game state
  gamePhase: GamePhase;
  playerId: string | null;
  hostId: string | null;
  connected: boolean;
  inventoryOpen: boolean;
  statsOpen: boolean;
  cameraMode: 'first' | 'third';
  
  // Auth state
  loggedIn: boolean;
  username: string | null;
  
  // Actions
  setGamePhase: (phase: GamePhase) => void;
  setPlayerId: (id: string | null) => void;
  setHostId: (id: string | null) => void;
  setConnected: (connected: boolean) => void;
  toggleInventory: () => void;
  toggleStats: () => void;
  switchCamera: () => void;
  
  // Auth actions
  setLoggedIn: (loggedIn: boolean) => void;
  setUsername: (username: string | null) => void;
  logout: () => void;
}

export const useMMOGame = create<MMOGameState>()(
  subscribeWithSelector((set) => ({
    // Game state
    gamePhase: GamePhase.Lobby,
    playerId: null,
    hostId: null,
    connected: false,
    inventoryOpen: false,
    statsOpen: false,
    cameraMode: 'third',
    
    // Auth state
    loggedIn: false,
    username: null,
    
    // Game actions
    setGamePhase: (phase) => set({ gamePhase: phase }),
    setPlayerId: (id) => set({ playerId: id }),
    setHostId: (id) => set({ hostId: id }),
    setConnected: (connected) => set({ connected }),
    
    toggleInventory: () => set((state) => {
      // Só pode abrir o inventário durante o jogo
      if (state.gamePhase !== GamePhase.Playing && !state.inventoryOpen) {
        return state;
      }
      
      // Atualiza a fase do jogo
      const newPhase = state.inventoryOpen 
        ? GamePhase.Playing 
        : GamePhase.Inventory;
      
      return { 
        inventoryOpen: !state.inventoryOpen,
        gamePhase: newPhase,
        // Fecha o painel de stats se estiver aberto
        statsOpen: false
      };
    }),
    
    toggleStats: () => set((state) => {
      // Só pode abrir as stats durante o jogo
      if (state.gamePhase !== GamePhase.Playing && !state.statsOpen) {
        return state;
      }
      
      // Atualiza a fase do jogo
      const newPhase = state.statsOpen 
        ? GamePhase.Playing 
        : GamePhase.Stats;
      
      return { 
        statsOpen: !state.statsOpen,
        gamePhase: newPhase,
        // Fecha o inventário se estiver aberto
        inventoryOpen: false
      };
    }),
    
    switchCamera: () => set((state) => ({
      cameraMode: state.cameraMode === 'first' ? 'third' : 'first'
    })),
    
    // Auth actions
    setLoggedIn: (loggedIn) => set({ loggedIn }),
    setUsername: (username) => set({ username }),
    logout: () => set({ 
      loggedIn: false, 
      username: null,
      gamePhase: GamePhase.Lobby,
      playerId: null,
      inventoryOpen: false,
      statsOpen: false
    })
  }))
);
