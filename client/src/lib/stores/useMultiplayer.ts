import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import { io, Socket } from 'socket.io-client';
import { useCharacter } from './useCharacter';
import { useGame } from './useGame';
import { useMMOGame } from './useMMOGame';
import { useAudio } from './useAudio';
import { 
  GameMessage, 
  MessageType, 
  PlayerState,
  Position,
  Character 
} from '@shared/types';

interface OtherPlayer {
  character: Character;
  lastUpdated: number;
}

interface MultiplayerState {
  // Connection state
  socket: Socket | null;
  connected: boolean;
  otherPlayers: Record<string, OtherPlayer>;
  
  // Actions
  connect: () => void;
  disconnect: () => void;
  joinGame: () => void;
  leaveGame: () => void;
  updatePosition: (position: Position, rotation: number, moving: boolean, attacking: boolean) => void;
  sendAttack: (position: Position, rotation: number) => void;
  
  // State queries
  getOtherPlayers: () => Record<string, OtherPlayer>;
  isConnected: () => boolean;
}

export const useMultiplayer = create<MultiplayerState>()(
  subscribeWithSelector((set, get) => ({
    socket: null,
    connected: false,
    otherPlayers: {},
    
    connect: () => {
      // Check if already connected
      if (get().socket) return;
      
      try {
        // Connect to the server
        const socket = io(window.location.origin, {
          transports: ['websocket', 'polling'],
          reconnection: true,
          reconnectionAttempts: 5,
          reconnectionDelay: 1000
        });
        
        // Setup connection handlers
        socket.on('connect', () => {
          console.log('Connected to game server');
          set({ connected: true, socket });
          useMMOGame.getState().setConnected(true);
        });
        
        socket.on('disconnect', () => {
          console.log('Disconnected from game server');
          set({ connected: false });
          useMMOGame.getState().setConnected(false);
        });
        
        // Handle game messages
        socket.on('message', (message: GameMessage) => {
          const { playHit } = useAudio.getState();
          
          switch (message.type) {
            case MessageType.PlayerJoin:
              // Add other player to our list
              console.log('Player joined:', message.player.character.id);
              set((state) => ({
                otherPlayers: {
                  ...state.otherPlayers,
                  [message.player.character.id]: {
                    character: message.player.character,
                    lastUpdated: Date.now()
                  }
                }
              }));
              break;
              
            case MessageType.PlayerLeave:
              // Remove player from our list
              console.log('Player left:', message.playerId);
              set((state) => {
                const newPlayers = { ...state.otherPlayers };
                delete newPlayers[message.playerId];
                return { otherPlayers: newPlayers };
              });
              break;
              
            case MessageType.PlayerUpdate:
              // Update player's position and state
              set((state) => {
                // Only update if we have this player
                if (!state.otherPlayers[message.playerId]) {
                  return state;
                }
                
                // Create a copy of the character with updated position
                const updatedCharacter = {
                  ...state.otherPlayers[message.playerId].character,
                  position: message.position,
                  rotation: message.rotation,
                  moving: message.moving,
                  attacking: message.attacking
                };
                
                return {
                  otherPlayers: {
                    ...state.otherPlayers,
                    [message.playerId]: {
                      character: updatedCharacter,
                      lastUpdated: Date.now()
                    }
                  }
                };
              });
              break;
              
            case MessageType.AttackAction:
              // Visual feedback for other player's attacks
              console.log('Attack action by player:', message.playerId);
              break;
              
            case MessageType.DamagePlayer:
              // Handle incoming damage
              const myPlayerId = useMMOGame.getState().playerId;
              
              if (message.targetId === myPlayerId) {
                // We were hit!
                console.log(`Taking ${message.damage} damage from ${message.attackerId}`);
                useCharacter.getState().takeDamage(message.damage);
                playHit();
              }
              break;
          }
        });
        
        set({ socket });
      } catch (error) {
        console.error('Failed to connect to server:', error);
      }
    },
    
    disconnect: () => {
      const { socket } = get();
      if (socket) {
        socket.disconnect();
        set({ socket: null, connected: false, otherPlayers: {} });
      }
    },
    
    joinGame: () => {
      const { socket } = get();
      const { character } = useCharacter.getState();
      
      if (!socket || !character) return;
      
      // Create player state
      const playerState: PlayerState = {
        character,
        inventory: {
          items: [],
          gold: 0,
          maxSlots: 20
        },
        isAttacking: false
      };
      
      // Send join message
      socket.emit('message', {
        type: MessageType.PlayerJoin,
        player: playerState
      });
      
      console.log('Joined game with character:', character.name);
    },
    
    leaveGame: () => {
      const { socket } = get();
      const myPlayerId = useMMOGame.getState().playerId;
      
      if (!socket) return;
      
      // Send leave message
      socket.emit('message', {
        type: MessageType.PlayerLeave,
        playerId: myPlayerId
      });
      
      // Clear other players
      set({ otherPlayers: {} });
    },
    
    updatePosition: (position, rotation, moving, attacking) => {
      const { socket } = get();
      const myPlayerId = useMMOGame.getState().playerId;
      
      if (!socket || !myPlayerId) return;
      
      // Send position update message
      socket.emit('message', {
        type: MessageType.PlayerUpdate,
        playerId: myPlayerId,
        position,
        rotation,
        moving,
        attacking
      });
    },
    
    sendAttack: (position, rotation) => {
      const { socket } = get();
      const myPlayerId = useMMOGame.getState().playerId;
      
      if (!socket || !myPlayerId) return;
      
      // Send attack message
      socket.emit('message', {
        type: MessageType.AttackAction,
        playerId: myPlayerId,
        position,
        rotation
      });
    },
    
    getOtherPlayers: () => get().otherPlayers,
    
    isConnected: () => get().connected
  }))
);

// Cleanup inactive players every 30 seconds
setInterval(() => {
  const { otherPlayers } = useMultiplayer.getState();
  const now = Date.now();
  const timeout = 10000; // 10 seconds timeout
  
  const updatedPlayers = { ...otherPlayers };
  let changed = false;
  
  for (const playerId in otherPlayers) {
    if (now - otherPlayers[playerId].lastUpdated > timeout) {
      console.log(`Player ${playerId} timed out`);
      delete updatedPlayers[playerId];
      changed = true;
    }
  }
  
  if (changed) {
    useMultiplayer.setState({ otherPlayers: updatedPlayers });
  }
}, 30000);