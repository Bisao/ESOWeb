import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import { nanoid } from 'nanoid';
import { Character, CharacterClass, DEFAULT_STATS, Position } from '@shared/types';

interface CharacterState {
  // Character data
  character: Character | null;
  
  // Equipment slots
  equippedWeapon: string | null;
  equippedArmor: string | null;
  equippedHelmet: string | null;
  
  // Actions
  createCharacter: (name: string, characterClass: CharacterClass) => void;
  updatePosition: (position: Position) => void;
  updateRotation: (rotation: number) => void;
  setMoving: (moving: boolean) => void;
  setAttacking: (attacking: boolean) => void;
  takeDamage: (amount: number) => void;
  heal: (amount: number) => void;
  equipItem: (slot: 'weapon' | 'armor' | 'helmet', itemId: string) => void;
  unequipItem: (slot: 'weapon' | 'armor' | 'helmet') => void;
  canAttack: () => boolean;
}

export const useCharacter = create<CharacterState>()(
  subscribeWithSelector((set, get) => ({
    // Character data
    character: null,
    
    // Equipment slots
    equippedWeapon: null,
    equippedArmor: null,
    equippedHelmet: null,
    
    // Create a new character
    createCharacter: (name, characterClass) => {
      const id = nanoid();
      const defaultStats = DEFAULT_STATS[characterClass];
      
      const character: Character = {
        id,
        name,
        class: characterClass,
        stats: { ...defaultStats },
        position: { x: 0, y: 0, z: 0 },
        rotation: 0,
        moving: false,
        attacking: false,
        lastAttack: 0
      };
      
      set({ character });
    },
    
    // Update character position
    updatePosition: (position) => {
      set((state) => {
        if (!state.character) return state;
        
        return {
          character: {
            ...state.character,
            position
          }
        };
      });
    },
    
    // Update character rotation
    updateRotation: (rotation) => {
      set((state) => {
        if (!state.character) return state;
        
        return {
          character: {
            ...state.character,
            rotation
          }
        };
      });
    },
    
    // Set character moving state
    setMoving: (moving) => {
      set((state) => {
        if (!state.character) return state;
        
        return {
          character: {
            ...state.character,
            moving
          }
        };
      });
    },
    
    // Set character attacking state
    setAttacking: (attacking) => {
      set((state) => {
        if (!state.character) return state;
        
        const now = Date.now();
        
        return {
          character: {
            ...state.character,
            attacking,
            lastAttack: attacking ? now : state.character.lastAttack
          }
        };
      });
    },
    
    // Take damage
    takeDamage: (amount) => {
      set((state) => {
        if (!state.character) return state;
        
        const newHealth = Math.max(0, state.character.stats.health - amount);
        
        return {
          character: {
            ...state.character,
            stats: {
              ...state.character.stats,
              health: newHealth
            }
          }
        };
      });
    },
    
    // Heal character
    heal: (amount) => {
      set((state) => {
        if (!state.character) return state;
        
        const newHealth = Math.min(
          state.character.stats.maxHealth,
          state.character.stats.health + amount
        );
        
        return {
          character: {
            ...state.character,
            stats: {
              ...state.character.stats,
              health: newHealth
            }
          }
        };
      });
    },
    
    // Equip item to a slot
    equipItem: (slot, itemId) => {
      set((state) => {
        // Atualizar o slot de equipamento correspondente
        switch (slot) {
          case 'weapon':
            return { equippedWeapon: itemId };
          case 'armor':
            return { equippedArmor: itemId };
          case 'helmet':
            return { equippedHelmet: itemId };
          default:
            return state;
        }
      });
    },
    
    // Unequip item from a slot
    unequipItem: (slot) => {
      set((state) => {
        // Remover o item do slot correspondente
        switch (slot) {
          case 'weapon':
            return { equippedWeapon: null };
          case 'armor':
            return { equippedArmor: null };
          case 'helmet':
            return { equippedHelmet: null };
          default:
            return state;
        }
      });
    },
    
    // Check if character can attack (cooldown)
    canAttack: () => {
      const { character } = get();
      if (!character) return false;
      
      const now = Date.now();
      const cooldown = 500; // 500ms cooldown between attacks
      
      return now - character.lastAttack > cooldown;
    }
  }))
);
