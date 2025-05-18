import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import { Character, CharacterClass, CharacterStats, DEFAULT_STATS, Position } from '@shared/types';
import { useMMOGame } from './useMMOGame';

// Define the types for the character state
interface CharacterState {
  // Character data
  character: Character | null;
  
  // Character actions
  createCharacter: (name: string, characterClass: CharacterClass) => void;
  updatePosition: (position: Position) => void;
  updateRotation: (rotation: number) => void;
  setMoving: (moving: boolean) => void;
  setAttacking: (attacking: boolean) => void;
  takeDamage: (amount: number) => void;
  gainExperience: (amount: number) => void;
  levelUp: () => void;

  // Attack cooldown logic
  canAttack: () => boolean;
}

export const useCharacter = create<CharacterState>()(
  subscribeWithSelector((set, get) => ({
    character: null,
    
    // Character creation
    createCharacter: (name, characterClass) => {
      const playerId = useMMOGame.getState().playerId;
      
      const newCharacter: Character = {
        id: playerId,
        name,
        class: characterClass,
        stats: { ...DEFAULT_STATS[characterClass] },
        position: { x: 0, y: 0, z: 0 },
        rotation: 0,
        moving: false,
        attacking: false,
        lastAttack: 0,
      };
      
      set({ character: newCharacter });
      useMMOGame.getState().setGamePhase('playing');
    },
    
    // Update position
    updatePosition: (position) => {
      set((state) => ({
        character: state.character 
          ? { ...state.character, position }
          : null
      }));
    },
    
    // Update rotation
    updateRotation: (rotation) => {
      set((state) => ({
        character: state.character 
          ? { ...state.character, rotation }
          : null
      }));
    },
    
    // Set moving state
    setMoving: (moving) => {
      set((state) => ({
        character: state.character 
          ? { ...state.character, moving }
          : null
      }));
    },
    
    // Set attacking state
    setAttacking: (attacking) => {
      const now = Date.now();
      
      set((state) => {
        if (!state.character) return { character: null };
        
        // Only update if attacking is true and cooldown is over
        if (attacking && !get().canAttack()) {
          return { character: state.character };
        }
        
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
        if (!state.character) return { character: null };
        
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
    
    // Gain experience
    gainExperience: (amount) => {
      set((state) => {
        if (!state.character) return { character: null };
        
        const newExperience = state.character.stats.experience + amount;
        const experienceToLevel = state.character.stats.level * 100;
        
        // Check if we should level up
        if (newExperience >= experienceToLevel) {
          get().levelUp();
          return state;
        }
        
        return {
          character: {
            ...state.character,
            stats: {
              ...state.character.stats,
              experience: newExperience
            }
          }
        };
      });
    },
    
    // Level up
    levelUp: () => {
      set((state) => {
        if (!state.character) return { character: null };
        
        // Calculate stats increase based on class
        const statIncrease = {
          [CharacterClass.Warrior]: {
            maxHealth: 15,
            maxMana: 5,
            strength: 3,
            intelligence: 1,
            dexterity: 2
          },
          [CharacterClass.Mage]: {
            maxHealth: 8,
            maxMana: 15,
            strength: 1,
            intelligence: 3,
            dexterity: 2
          },
          [CharacterClass.Archer]: {
            maxHealth: 10,
            maxMana: 8,
            strength: 2,
            intelligence: 2,
            dexterity: 3
          }
        };
        
        const classIncrease = statIncrease[state.character.class];
        const newLevel = state.character.stats.level + 1;
        const newExperience = 0;
        
        return {
          character: {
            ...state.character,
            stats: {
              ...state.character.stats,
              maxHealth: state.character.stats.maxHealth + classIncrease.maxHealth,
              health: state.character.stats.maxHealth + classIncrease.maxHealth, // Heal to full on level up
              maxMana: state.character.stats.maxMana + classIncrease.maxMana,
              mana: state.character.stats.maxMana + classIncrease.maxMana, // Restore mana on level up
              strength: state.character.stats.strength + classIncrease.strength,
              intelligence: state.character.stats.intelligence + classIncrease.intelligence,
              dexterity: state.character.stats.dexterity + classIncrease.dexterity,
              level: newLevel,
              experience: newExperience
            }
          }
        };
      });
    },
    
    // Check if the character can attack (cooldown)
    canAttack: () => {
      const character = get().character;
      if (!character) return false;
      
      const now = Date.now();
      const cooldownTime = 1000; // 1 second cooldown
      
      return now - character.lastAttack > cooldownTime;
    }
  }))
);
