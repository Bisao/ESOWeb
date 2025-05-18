// Types shared between client and server

// Character class types
export enum CharacterClass {
  Warrior = "warrior",
  Mage = "mage",
  Archer = "archer"
}

// Character stats
export interface CharacterStats {
  health: number;
  maxHealth: number;
  mana: number;
  maxMana: number;
  strength: number;
  intelligence: number;
  dexterity: number;
  level: number;
  experience: number;
}

// Default stats for each class
export const DEFAULT_STATS: Record<CharacterClass, CharacterStats> = {
  [CharacterClass.Warrior]: {
    health: 120,
    maxHealth: 120,
    mana: 50,
    maxMana: 50,
    strength: 15,
    intelligence: 5,
    dexterity: 10,
    level: 1,
    experience: 0
  },
  [CharacterClass.Mage]: {
    health: 80,
    maxHealth: 80,
    mana: 120,
    maxMana: 120,
    strength: 5,
    intelligence: 15,
    dexterity: 10,
    level: 1,
    experience: 0
  },
  [CharacterClass.Archer]: {
    health: 100,
    maxHealth: 100,
    mana: 80,
    maxMana: 80,
    strength: 10,
    intelligence: 10,
    dexterity: 15,
    level: 1,
    experience: 0
  }
};

// Player character
export interface Character {
  id: string;
  name: string;
  class: CharacterClass;
  stats: CharacterStats;
  position: Position;
  rotation: number; // y-axis rotation in radians
  moving: boolean;
  attacking: boolean;
  lastAttack: number;
}

// Position in 3D space
export interface Position {
  x: number;
  y: number;
  z: number;
}

// Item types
export enum ItemType {
  Weapon = "weapon",
  Armor = "armor",
  Potion = "potion",
  Quest = "quest"
}

// Item interface
export interface Item {
  id: string;
  name: string;
  type: ItemType;
  value: number;
  description: string;
  icon?: string;
  stats?: Partial<CharacterStats>;
}

// Inventory
export interface Inventory {
  items: Item[];
  gold: number;
  maxSlots: number;
}

// Game phase
export enum GamePhase {
  Lobby = "lobby",
  CharacterCreation = "characterCreation",
  Playing = "playing",
  Inventory = "inventory",
  Stats = "stats"
}

// Player state
export interface PlayerState {
  character: Character;
  inventory: Inventory;
  isAttacking: boolean;
}

// Server-client message types
export enum MessageType {
  PlayerJoin = "player-join",
  PlayerLeave = "player-leave",
  PlayerUpdate = "player-update",
  AttackAction = "attack-action",
  DamagePlayer = "damage-player",
  HostUpdate = "host-update"
}

// Messages
export interface PlayerJoinMessage {
  type: MessageType.PlayerJoin;
  player: PlayerState;
}

export interface PlayerLeaveMessage {
  type: MessageType.PlayerLeave;
  playerId: string;
}

export interface PlayerUpdateMessage {
  type: MessageType.PlayerUpdate;
  playerId: string;
  position: Position;
  rotation: number;
  moving: boolean;
  attacking: boolean;
}

export interface AttackActionMessage {
  type: MessageType.AttackAction;
  playerId: string;
  position: Position;
  rotation: number;
}

export interface DamagePlayerMessage {
  type: MessageType.DamagePlayer;
  targetId: string;
  damage: number;
  attackerId: string;
}

export interface HostUpdateMessage {
  type: MessageType.HostUpdate;
  hostId: string | null;
}

export type GameMessage = 
  | PlayerJoinMessage
  | PlayerLeaveMessage
  | PlayerUpdateMessage
  | AttackActionMessage
  | DamagePlayerMessage
  | HostUpdateMessage;
