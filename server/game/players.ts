import { Position, PlayerState } from '@shared/types';

// Store players by ID
const players: Record<string, PlayerState> = {};

// Add a player to the game
export function addPlayer(player: PlayerState): void {
  players[player.character.id] = player;
  console.log(`Added player: ${player.character.name} (${player.character.id})`);
}

// Remove a player from the game
export function removePlayer(playerId: string): void {
  if (players[playerId]) {
    console.log(`Removed player: ${players[playerId].character.name} (${playerId})`);
    delete players[playerId];
  }
}

// Get a specific player
export function getPlayer(playerId: string): PlayerState | undefined {
  return players[playerId];
}

// Get all players
export function getPlayers(): Record<string, PlayerState> {
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
  }
}
