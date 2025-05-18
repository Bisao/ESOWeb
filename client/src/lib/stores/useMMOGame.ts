import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import { GamePhase, CharacterClass } from '@shared/types';
import * as THREE from 'three';
import { v4 as uuidv4 } from 'uuid';

// Define the types for the game state
interface MMOGameState {
  playerId: string;
  playerName: string;
  gamePhase: GamePhase;
  selectedClass: CharacterClass | null;
  isConnected: boolean;
  cameraType: 'thirdPerson' | 'firstPerson';
  showDebug: boolean;
  
  // Actions
  setPlayerId: (id: string) => void;
  setPlayerName: (name: string) => void;
  setGamePhase: (phase: GamePhase) => void;
  setSelectedClass: (characterClass: CharacterClass) => void;
  toggleInventory: () => void;
  toggleStats: () => void;
  toggleDebug: () => void;
  switchCamera: () => void;
  setConnected: (connected: boolean) => void;
}

export const useMMOGame = create<MMOGameState>()(
  subscribeWithSelector((set) => ({
    playerId: uuidv4(), // Generate a unique ID for this player
    playerName: '',
    gamePhase: GamePhase.CharacterCreation,
    selectedClass: null,
    isConnected: false,
    cameraType: 'thirdPerson',
    showDebug: false,
    
    // Actions
    setPlayerId: (id) => set({ playerId: id }),
    setPlayerName: (name) => set({ playerName: name }),
    setGamePhase: (phase) => set({ gamePhase: phase }),
    setSelectedClass: (characterClass) => set({ selectedClass: characterClass }),
    toggleInventory: () => set((state) => ({
      gamePhase: state.gamePhase === GamePhase.Inventory 
        ? GamePhase.Playing 
        : GamePhase.Inventory
    })),
    toggleStats: () => set((state) => ({
      gamePhase: state.gamePhase === GamePhase.Stats 
        ? GamePhase.Playing 
        : GamePhase.Stats
    })),
    toggleDebug: () => set((state) => ({ showDebug: !state.showDebug })),
    switchCamera: () => set((state) => ({
      cameraType: state.cameraType === 'thirdPerson' ? 'firstPerson' : 'thirdPerson'
    })),
    setConnected: (connected) => set({ isConnected: connected }),
  }))
);
