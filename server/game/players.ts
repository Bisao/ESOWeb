import { Position, PlayerState } from '@shared/types';

// Store players by ID
const players: Record<string, PlayerState & { lastActivity: number }> = {};

// Add a player to the game
export function addPlayer(player: PlayerState): void {
  players[player.character.id] = {
    ...player,
    lastActivity: Date.now()
  };
  console.log(`Player ${player.character.id} added. Total players: ${Object.keys(players).length}`);
}

// Remove a player from the game
export function removePlayer(playerId: string): void {
  if (players[playerId]) {
    console.log(`Removed player: ${players[playerId].character.name} (${playerId})`);
    delete players[playerId];
  }
}

// Get a specific player
export function getPlayer(playerId: string): (PlayerState & { lastActivity: number }) | undefined {
  return players[playerId];
}

// Get all players
export function getPlayers(): Record<string, PlayerState & { lastActivity: number }> {
  return { ...players };
}

// Update player state
export function updatePlayer(
  playerId: string,
  position: Position,
  rotation: number,
  moving: boolean,
  attacking: boolean
): void {
  const player = players[playerId];

  if (player) {
    // Update position
    player.character.position = position;

    // Update rotation
    player.character.rotation = rotation;

    // Update state
    player.character.moving = moving;
    player.character.attacking = attacking;
    
    // Update last activity timestamp
    player.lastActivity = Date.now();
  }
}

// Update player's last activity timestamp
export function updatePlayerActivity(playerId: string): void {
  if (players[playerId]) {
    players[playerId].lastActivity = Date.now();
  }
}

// Check if a player has been inactive for too long
export function isPlayerInactive(playerId: string, timeout: number): boolean {
  const player = players[playerId];
  if (!player) return true;
  
  const now = Date.now();
  return now - player.lastActivity > timeout;
}
