import { Server } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import { 
  GameMessage, 
  MessageType, 
  Character,
  CharacterClass,
  Position
} from '@shared/types';
import { addPlayer, removePlayer, getPlayers, updatePlayer, getPlayer } from './players';

// Map to store player IDs by socket ID
const playerSocketMap = new Map<string, string>();
// Store host player ID
let hostPlayerId: string | null = null;

export function setupGameServer(httpServer: Server) {
  // Initialize Socket.io server
  const io = new SocketIOServer(httpServer, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST']
    },
    pingTimeout: 60000,
    pingInterval: 25000
  });
  
  console.log('Game server initialized');
  
  // Socket.io connection handler
  io.on('connection', (socket) => {
    console.log(`Player connected: ${socket.id}`);
    
    // Handle game messages
    socket.on('message', (message: GameMessage) => {
      switch (message.type) {
        case MessageType.PlayerJoin:
          // Store mapping between socket ID and player ID
          const playerId = message.player.character.id;
          playerSocketMap.set(socket.id, playerId);
          console.log(`Mapped socket ${socket.id} to player ${playerId}`);
          
          // Set first player as host
          if (!hostPlayerId) {
            hostPlayerId = playerId;
            console.log(`Player ${playerId} is now the host`);
          }
          
          // Add player to our list
          addPlayer(message.player);
          
          // Notify all clients about the host
          io.emit('message', {
            type: MessageType.HostUpdate,
            hostId: hostPlayerId
          });
          
          // Send current players to new player
          const players = getPlayers();
          for (const playerId in players) {
            if (playerId !== message.player.character.id) {
              socket.emit('message', {
                type: MessageType.PlayerJoin,
                player: players[playerId]
              });
            }
          }
          
          // Broadcast new player to all others
          socket.broadcast.emit('message', message);
          
          // Log total player count
          console.log(`Total players: ${Object.keys(players).length}`);
          break;
          
        case MessageType.PlayerUpdate:
          // Update player's state
          updatePlayer(
            message.playerId,
            message.position,
            message.rotation,
            message.moving,
            message.attacking
          );
          
          // Broadcast to all other clients
          socket.broadcast.emit('message', message);
          break;
          
        case MessageType.AttackAction:
          // Process attack
          processAttack(io, message.playerId, message.position, message.rotation);
          
          // Broadcast attack to all clients including sender
          io.emit('message', message);
          break;
      }
    });
    
    // Handle disconnection
    socket.on('disconnect', () => {
      console.log(`Player disconnected: ${socket.id}`);
      
      // Get player ID from socket
      const playerId = playerSocketMap.get(socket.id);
      if (playerId) {
        // Check if disconnecting player is host
        if (playerId === hostPlayerId) {
          // Find next player to be host
          const players = getPlayers();
          const playerIds = Object.keys(players);
          const nextHost = playerIds.find(id => id !== playerId);
          hostPlayerId = nextHost || null;
          
          // Notify about new host
          if (hostPlayerId) {
            console.log(`New host is player ${hostPlayerId}`);
            io.emit('message', {
              type: MessageType.HostUpdate,
              hostId: hostPlayerId
            });
          }
        }
        
        // Remove player from the game
        removePlayer(playerId);
        playerSocketMap.delete(socket.id);
        
        // Notify all other clients
        io.emit('message', {
          type: MessageType.PlayerLeave,
          playerId
        });
        
        console.log(`Player ${playerId} removed from game`);
        console.log(`Total players: ${Object.keys(getPlayers()).length}`);
      }
    });
  });
  
  // Start the heartbeat to check for inactive players
  setInterval(() => {
    // In a real implementation, this would check last activity time
    // and remove inactive players
    console.log(`Active players: ${Object.keys(getPlayers()).length}`);
  }, 60000); // Check every minute
  
  return io;
}

// Process attack - check for hits and apply damage
function processAttack(io: SocketIOServer, attackerId: string, position: Position, rotation: number) {
  console.log(`Processing attack from player ${attackerId}`);
  // Get the attacker
  const attacker = getPlayer(attackerId);
  if (!attacker) {
    console.log(`Player ${attackerId} not found`);
    return;
  }
  console.log(`Current players in game: ${Object.keys(getPlayers()).length}`);
  
  // Get all players
  const players = getPlayers();
  
  // Calculate attack range based on class
  const attackRange = getAttackRange(attacker.character.class);
  
  // Check for hits on other players
  for (const playerId in players) {
    // Skip self
    if (playerId === attackerId) continue;
    
    const target = players[playerId].character;
    
    // Calculate distance between attacker and target
    const dx = target.position.x - position.x;
    const dz = target.position.z - position.z;
    const distance = Math.sqrt(dx * dx + dz * dz);
    
    // Check if target is within range
    if (distance <= attackRange) {
      // Check if target is in attack direction (in front of attacker)
      const attackDirectionX = Math.sin(rotation);
      const attackDirectionZ = Math.cos(rotation);
      
      // Dot product to check if target is in front
      const dotProduct = dx * attackDirectionX + dz * attackDirectionZ;
      
      // If dot product is positive, target is in front
      if (dotProduct > 0) {
        // Calculate damage based on attacker's stats
        const damage = calculateDamage(attacker.character);
        
        console.log(`Player ${attackerId} hit player ${playerId} for ${damage} damage`);
        
        // Send damage message to all clients
        io.emit('message', {
          type: MessageType.DamagePlayer,
          targetId: playerId,
          damage,
          attackerId
        });
      }
    }
  }
}

// Get attack range based on character class
function getAttackRange(characterClass: CharacterClass): number {
  switch (characterClass) {
    case CharacterClass.Warrior:
      return 2; // Short range
    case CharacterClass.Mage:
      return 8; // Long range
    case CharacterClass.Archer:
      return 10; // Longest range
    default:
      return 3;
  }
}

// Calculate damage based on character stats
function calculateDamage(character: Character): number {
  switch (character.class) {
    case CharacterClass.Warrior:
      return 10 + Math.floor(character.stats.strength * 0.8);
    case CharacterClass.Mage:
      return 5 + Math.floor(character.stats.intelligence * 0.9);
    case CharacterClass.Archer:
      return 7 + Math.floor(character.stats.dexterity * 0.8);
    default:
      return 5;
  }
}
