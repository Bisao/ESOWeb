import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import { io, Socket } from 'socket.io-client';
import { 
  Character, 
  PlayerState, 
  MessageType, 
  GameMessage,
  Position
} from '@shared/types';
import { useMMOGame } from './useMMOGame';
import { useCharacter } from './useCharacter';
import { useInventory } from './useInventory';

// Define the types for the multiplayer state
interface MultiplayerState {
  socket: Socket | null;
  otherPlayers: Record<string, Character>;
  
  // Connection actions
  connect: () => void;
  disconnect: () => void;
  
  // Game actions
  sendPlayerUpdate: () => void;
  sendAttackAction: () => void;
  
  // Other players management
  updateOtherPlayer: (playerId: string, update: Partial<Character>) => void;
  removeOtherPlayer: (playerId: string) => void;
}

export const useMultiplayer = create<MultiplayerState>()(
  subscribeWithSelector((set, get) => ({
    socket: null,
    otherPlayers: {},
    
    // Connect to server
    connect: () => {
      const socket = io('http://localhost:5000', {
        autoConnect: true,
        reconnection: true
      });
      
      // Set socket in state
      set({ socket });
      
      // Set up socket event handlers
      socket.on('connect', () => {
        console.log('Connected to game server');
        useMMOGame.getState().setConnected(true);
        
        // Get player data
        const character = useCharacter.getState().character;
        const inventory = useInventory.getState().inventory;
        
        if (character) {
          // Send player join message
          socket.emit('message', {
            type: MessageType.PlayerJoin,
            player: {
              character,
              inventory,
              isAttacking: false
            }
          });
        }
      });
      
      socket.on('disconnect', () => {
        console.log('Disconnected from game server');
        useMMOGame.getState().setConnected(false);
      });
      
      socket.on('message', (message: GameMessage) => {
        switch (message.type) {
          case MessageType.PlayerJoin:
            // Add new player to our list of other players
            const newPlayerId = message.player.character.id;
            if (newPlayerId !== useMMOGame.getState().playerId) {
              set((state) => ({
                otherPlayers: {
                  ...state.otherPlayers,
                  [newPlayerId]: message.player.character
                }
              }));
            }
            break;
            
          case MessageType.PlayerLeave:
            // Remove player from our list
            get().removeOtherPlayer(message.playerId);
            break;
            
          case MessageType.PlayerUpdate:
            // Update other player's position and state
            if (message.playerId !== useMMOGame.getState().playerId) {
              get().updateOtherPlayer(message.playerId, {
                position: message.position,
                rotation: message.rotation,
                moving: message.moving,
                attacking: message.attacking
              });
            }
            break;
            
          case MessageType.AttackAction:
            // Handle incoming attack action
            if (message.playerId !== useMMOGame.getState().playerId) {
              get().updateOtherPlayer(message.playerId, {
                attacking: true,
                position: message.position,
                rotation: message.rotation
              });
              
              // Reset attacking state after animation time
              setTimeout(() => {
                get().updateOtherPlayer(message.playerId, {
                  attacking: false
                });
              }, 500);
            }
            break;
            
          case MessageType.DamagePlayer:
            // Handle incoming damage
            const { targetId, damage } = message;
            const myPlayerId = useMMOGame.getState().playerId;
            
            if (targetId === myPlayerId) {
              // I took damage
              useCharacter.getState().takeDamage(damage);
            } else {
              // Another player took damage, could animate this
            }
            break;
        }
      });
    },
    
    // Disconnect from server
    disconnect: () => {
      const { socket } = get();
      if (socket) {
        socket.disconnect();
        set({ socket: null, otherPlayers: {} });
      }
    },
    
    // Send player update to server
    sendPlayerUpdate: () => {
      const { socket } = get();
      const character = useCharacter.getState().character;
      
      if (socket && socket.connected && character) {
        socket.emit('message', {
          type: MessageType.PlayerUpdate,
          playerId: character.id,
          position: character.position,
          rotation: character.rotation,
          moving: character.moving,
          attacking: character.attacking
        });
      }
    },
    
    // Send attack action to server
    sendAttackAction: () => {
      const { socket } = get();
      const character = useCharacter.getState().character;
      
      if (socket && socket.connected && character) {
        socket.emit('message', {
          type: MessageType.AttackAction,
          playerId: character.id,
          position: character.position,
          rotation: character.rotation
        });
      }
    },
    
    // Update an other player's data
    updateOtherPlayer: (playerId, update) => {
      set((state) => {
        const player = state.otherPlayers[playerId];
        if (!player) return { otherPlayers: state.otherPlayers };
        
        return {
          otherPlayers: {
            ...state.otherPlayers,
            [playerId]: {
              ...player,
              ...update
            }
          }
        };
      });
    },
    
    // Remove an other player
    removeOtherPlayer: (playerId) => {
      set((state) => {
        const newOtherPlayers = { ...state.otherPlayers };
        delete newOtherPlayers[playerId];
        return { otherPlayers: newOtherPlayers };
      });
    }
  }))
);
