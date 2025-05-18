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

export function setupGameServer(httpServer: Server) {
  // Initialize Socket.io server
  const io = new SocketIOServer(httpServer, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST']
    }
  });
  
  console.log('Game server initialized');
  
  // Socket.io connection handler
  io.on('connection', (socket) => {
    console.log(`Player connected: ${socket.id}`);
    
    // Handle game messages
    socket.on('message', (message: GameMessage) => {
      switch (message.type) {
        case MessageType.PlayerJoin:
          // Add player to our list
          addPlayer(message.player);
          
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
          processAttack(message.playerId, message.position, message.rotation);
          
          // Broadcast attack to all clients including sender
          io.emit('message', message);
          break;
      }
    });
    
    // Handle disconnection
    socket.on('disconnect', () => {
      console.log(`Player disconnected: ${socket.id}`);
      
      // Find player by socket ID and remove from our list
      // This would require storing socket IDs with players
      // For simplicity, we'll assume disconnect is handled client-side
    });
  });
  
  // Process attack - check for hits and apply damage
  function processAttack(attackerId: string, position: Position, rotation: number) {
    // Get the attacker
    const attacker = getPlayer(attackerId);
    if (!attacker) return;
    
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
  
  return io;
}
