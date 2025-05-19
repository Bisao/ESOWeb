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
// Map to store socket IDs by player ID (para comunicação bidirecional eficiente)
const socketPlayerMap = new Map<string, string>();
// Store host player ID
interface GameLobby {
  id: string;
  hostName: string;
  players: Set<string>;
  maxPlayers: number;
  createdAt: number;
  lastActivity: number;
}

const lobbies = new Map<string, GameLobby>();
let hostPlayerId: string | null = null;

// Configurações do servidor
const SERVER_CONFIG = {
  // Tempo máximo de inatividade para um lobby (em ms)
  LOBBY_TIMEOUT: 30 * 60 * 1000, // 30 minutos
  // Intervalo para verificar lobbies inativos (em ms)
  CLEANUP_INTERVAL: 5 * 60 * 1000, // 5 minutos
  // Limite de taxa de mensagens por segundo por jogador
  MESSAGE_RATE_LIMIT: 20,
  // Intervalo para verificar jogadores inativos (em ms)
  PLAYER_HEARTBEAT_INTERVAL: 60 * 1000, // 1 minuto
  // Tempo máximo de inatividade para um jogador (em ms)
  PLAYER_TIMEOUT: 5 * 60 * 1000, // 5 minutos
};

// Rastreamento de taxa de mensagens por jogador
const messageRates = new Map<string, { count: number, lastReset: number }>();

// Validação de dados
function isValidPosition(pos: Position): boolean {
  if (!pos || typeof pos !== 'object') return false;
  if (typeof pos.x !== 'number' || typeof pos.y !== 'number' || typeof pos.z !== 'number') return false;
  
  // Verificar limites do mundo (ajuste conforme necessário)
  const worldLimit = 1000;
  return Math.abs(pos.x) <= worldLimit && 
         Math.abs(pos.y) <= worldLimit && 
         Math.abs(pos.z) <= worldLimit;
}

function isValidRotation(rotation: number): boolean {
  return typeof rotation === 'number' && !isNaN(rotation) && isFinite(rotation);
}

function createLobby(hostName: string): GameLobby {
  const id = Math.random().toString(36).substring(7);
  const now = Date.now();
  const lobby = {
    id,
    hostName,
    players: new Set<string>(),
    maxPlayers: 20, // Limite padrão de jogadores
    createdAt: now,
    lastActivity: now
  };
  lobbies.set(id, lobby);
  return lobby;
}

function removeLobby(id: string) {
  lobbies.delete(id);
}

function joinLobby(lobbyId: string, playerId: string): boolean {
  const lobby = lobbies.get(lobbyId);
  if (!lobby) return false;
  
  // Verificar se o lobby está cheio
  if (lobby.players.size >= lobby.maxPlayers) return false;
  
  lobby.players.add(playerId);
  lobby.lastActivity = Date.now();
  return true;
}

function leaveLobby(lobbyId: string, playerId: string) {
  const lobby = lobbies.get(lobbyId);
  if (!lobby) return;
  
  lobby.players.delete(playerId);
  lobby.lastActivity = Date.now();
  
  if (lobby.players.size === 0) {
    removeLobby(lobbyId);
  }
}

// Limpar lobbies inativos
function cleanupInactiveLobbies() {
  const now = Date.now();
  for (const [id, lobby] of lobbies.entries()) {
    if (now - lobby.lastActivity > SERVER_CONFIG.LOBBY_TIMEOUT) {
      console.log(`Removendo lobby inativo: ${id}`);
      removeLobby(id);
    }
  }
}

// Verificar taxa de mensagens
function checkMessageRate(socketId: string): boolean {
  const now = Date.now();
  
  if (!messageRates.has(socketId)) {
    messageRates.set(socketId, { count: 1, lastReset: now });
    return true;
  }
  
  const rate = messageRates.get(socketId)!;
  
  // Resetar contador a cada segundo
  if (now - rate.lastReset > 1000) {
    rate.count = 1;
    rate.lastReset = now;
    return true;
  }
  
  // Verificar limite
  if (rate.count >= SERVER_CONFIG.MESSAGE_RATE_LIMIT) {
    console.warn(`Taxa de mensagens excedida para socket ${socketId}`);
    return false;
  }
  
  // Incrementar contador
  rate.count++;
  return true;
}

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
  
  // Iniciar limpeza periódica de lobbies inativos
  setInterval(cleanupInactiveLobbies, SERVER_CONFIG.CLEANUP_INTERVAL);
  
  // Socket.io connection handler
  io.on('connection', (socket) => {
    console.log(`Player connected: ${socket.id}`);

    // Gerenciamento de lobbies
    socket.on('get-lobbies', () => {
      const now = Date.now();
      const lobbyList = Array.from(lobbies.values())
        .filter(lobby => now - lobby.lastActivity < SERVER_CONFIG.LOBBY_TIMEOUT)
        .map(lobby => ({
          id: lobby.id,
          hostName: lobby.hostName,
          playerCount: lobby.players.size,
          maxPlayers: lobby.maxPlayers,
          createdAt: lobby.createdAt
        }));
      socket.emit('lobbies', lobbyList);
    });

    socket.on('create-lobby', (data: { name: string, hostName: string, maxPlayers?: number }) => {
      if (!data || !data.hostName) {
        socket.emit('error', { message: 'Dados inválidos para criação de lobby' });
        return;
      }
      
      const lobby = createLobby(data.hostName);
      
      // Definir limite personalizado de jogadores, se fornecido
      if (data.maxPlayers && typeof data.maxPlayers === 'number' && data.maxPlayers > 0) {
        lobby.maxPlayers = Math.min(data.maxPlayers, 50); // Limitar a 50 jogadores
      }
      
      joinLobby(lobby.id, socket.id);
      socket.join(lobby.id);
      
      // Notificar o criador
      socket.emit('lobby-created', {
        id: lobby.id,
        hostName: lobby.hostName,
        maxPlayers: lobby.maxPlayers
      });
      
      // Atualizar lista de lobbies para todos
      io.emit('lobbies-updated', Array.from(lobbies.values()).map(l => ({
        id: l.id,
        hostName: l.hostName,
        playerCount: l.players.size,
        maxPlayers: l.maxPlayers
      })));
    });

    socket.on('join-lobby', (data: { lobbyId: string }) => {
      if (!data || !data.lobbyId) {
        socket.emit('error', { message: 'ID de lobby inválido' });
        return;
      }
      
      if (joinLobby(data.lobbyId, socket.id)) {
        socket.join(data.lobbyId);
        
        // Notificar o jogador
        socket.emit('lobby-joined', { lobbyId: data.lobbyId });
        
        // Notificar outros jogadores no lobby
        socket.to(data.lobbyId).emit('player-joined-lobby', { socketId: socket.id });
        
        // Atualizar lista de lobbies para todos
        io.emit('lobbies-updated', Array.from(lobbies.values()).map(l => ({
          id: l.id,
          hostName: l.hostName,
          playerCount: l.players.size,
          maxPlayers: l.maxPlayers
        })));
      } else {
        socket.emit('error', { message: 'Não foi possível entrar no lobby (cheio ou inexistente)' });
      }
    });
    
    // Handle game messages
    socket.on('message', (message: GameMessage) => {
      // Verificar taxa de mensagens
      if (!checkMessageRate(socket.id)) {
        socket.emit('error', { message: 'Taxa de mensagens excedida. Tente novamente em breve.' });
        return;
      }
      
      switch (message.type) {
        case MessageType.PlayerJoin:
          // Validar dados do jogador
          if (!message.player || !message.player.character || !message.player.character.id) {
            socket.emit('error', { message: 'Dados de jogador inválidos' });
            return;
          }
          
          // Store mapping between socket ID and player ID
          const playerId = message.player.character.id;
          playerSocketMap.set(socket.id, playerId);
          socketPlayerMap.set(playerId, socket.id);
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
          for (const pid in players) {
            if (pid !== message.player.character.id) {
              socket.emit('message', {
                type: MessageType.PlayerJoin,
                player: players[pid]
              });
            }
          }
          
          // Broadcast new player to all others
          socket.broadcast.emit('message', message);
          
          // Log total player count
          console.log(`Total players: ${Object.keys(players).length}`);
          break;
          
        case MessageType.PlayerUpdate:
          // Validar dados
          if (!message.playerId || !isValidPosition(message.position) || !isValidRotation(message.rotation)) {
            console.warn(`Dados inválidos de atualização de jogador de ${socket.id}`);
            return;
          }
          
          // Verificar se o socket está autorizado para este jogador
          const authorizedPlayerId = playerSocketMap.get(socket.id);
          if (authorizedPlayerId !== message.playerId) {
            console.warn(`Socket ${socket.id} tentou atualizar jogador não autorizado ${message.playerId}`);
            return;
          }
          
          // Update player's state
          updatePlayer(
            message.playerId,
            message.position,
            message.rotation,
            message.moving,
            message.attacking
          );
          
          // Otimizar broadcast - enviar apenas para jogadores próximos
          const updatedPlayer = getPlayer(message.playerId);
          if (!updatedPlayer) return;
          
          // Encontrar jogadores próximos (dentro de um raio)
          const nearbyPlayers = findNearbyPlayers(message.playerId, message.position, 50);
          
          // Broadcast apenas para jogadores próximos
          for (const nearbyId of nearbyPlayers) {
            const nearbySocketId = socketPlayerMap.get(nearbyId);
            if (nearbySocketId && nearbySocketId !== socket.id) {
              io.to(nearbySocketId).emit('message', message);
            }
          }
          break;
          
        case MessageType.AttackAction:
          // Validar dados
          if (!message.playerId || !isValidPosition(message.position) || !isValidRotation(message.rotation)) {
            console.warn(`Dados inválidos de ataque de ${socket.id}`);
            return;
          }
          
          // Verificar se o socket está autorizado para este jogador
          const attackerPlayerId = playerSocketMap.get(socket.id);
          if (attackerPlayerId !== message.playerId) {
            console.warn(`Socket ${socket.id} tentou atacar como jogador não autorizado ${message.playerId}`);
            return;
          }
          
          // Process attack
          processAttack(io, message.playerId, message.position, message.rotation);
          
          // Broadcast attack to nearby players
          const nearbyForAttack = findNearbyPlayers(message.playerId, message.position, 50);
          
          for (const nearbyId of nearbyForAttack) {
            const nearbySocketId = socketPlayerMap.get(nearbyId);
            if (nearbySocketId) {
              io.to(nearbySocketId).emit('message', message);
            }
          }
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
        socketPlayerMap.delete(playerId);
        
        // Limpar rastreamento de taxa de mensagens
        messageRates.delete(socket.id);
        
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
    const now = Date.now();
    const players = getPlayers();
    
    for (const playerId in players) {
      const player = players[playerId];
      
      // Verificar última atividade (implementar lastActivity em players.ts)
      if (player.lastActivity && now - player.lastActivity > SERVER_CONFIG.PLAYER_TIMEOUT) {
        console.log(`Removendo jogador inativo: ${playerId}`);
        
        // Obter socket ID
        const socketId = socketPlayerMap.get(playerId);
        
        // Remover jogador
        removePlayer(playerId);
        
        // Limpar mapeamentos
        if (socketId) {
          playerSocketMap.delete(socketId);
          messageRates.delete(socketId);
        }
        socketPlayerMap.delete(playerId);
        
        // Notificar outros jogadores
        io.emit('message', {
          type: MessageType.PlayerLeave,
          playerId
        });
      }
    }
    
    console.log(`Active players: ${Object.keys(getPlayers()).length}`);
  }, SERVER_CONFIG.PLAYER_HEARTBEAT_INTERVAL);
  
  return io;
}

// Encontrar jogadores próximos (para otimizar broadcasts)
function findNearbyPlayers(playerId: string, position: Position, radius: number): string[] {
  const players = getPlayers();
  const nearbyPlayers: string[] = [];
  
  for (const pid in players) {
    // Ignorar o próprio jogador
    if (pid === playerId) continue;
    
    const otherPlayer = players[pid];
    const otherPos = otherPlayer.character.position;
    
    // Calcular distância
    const dx = otherPos.x - position.x;
    const dz = otherPos.z - position.z;
    const distance = Math.sqrt(dx * dx + dz * dz);
    
    // Verificar se está dentro do raio
    if (distance <= radius) {
      nearbyPlayers.push(pid);
    }
  }
  
  return nearbyPlayers;
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
        
        // Obter socket ID do alvo
        const targetSocketId = socketPlayerMap.get(playerId);
        
        // Enviar mensagem de dano para o alvo e o atacante
        if (targetSocketId) {
          io.to(targetSocketId).emit('message', {
            type: MessageType.DamagePlayer,
            targetId: playerId,
            damage,
            attackerId
          });
        }
        
        // Enviar também para o atacante
        const attackerSocketId = socketPlayerMap.get(attackerId);
        if (attackerSocketId) {
          io.to(attackerSocketId).emit('message', {
            type: MessageType.DamagePlayer,
            targetId: playerId,
            damage,
            attackerId
          });
        }
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
