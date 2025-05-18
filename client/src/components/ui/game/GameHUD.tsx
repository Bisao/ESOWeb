import { useState, useEffect } from 'react';
import { CharacterClass, GamePhase } from '@shared/types';
import { useCharacter } from '@/lib/stores/useCharacter';
import { useMMOGame } from '@/lib/stores/useMMOGame';
import { useMultiplayer } from '@/lib/stores/useMultiplayer';
import { useAudio } from '@/lib/stores/useAudio';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { InventoryPanel } from './InventoryPanel';
import { CharacterStats } from './CharacterStats';

export function GameHUD() {
  const { character } = useCharacter();
  const { gamePhase, toggleInventory, toggleStats, toggleDebug, switchCamera, showDebug } = useMMOGame();
  const { otherPlayers } = useMultiplayer();
  const { isMuted, toggleMute } = useAudio();
  
  // Don't render HUD if character doesn't exist
  if (!character) return null;
  
  // Get health and mana percentages
  const healthPercent = (character.stats.health / character.stats.maxHealth) * 100;
  const manaPercent = (character.stats.mana / character.stats.maxMana) * 100;
  
  return (
    <div className="fixed inset-0 pointer-events-none">
      {/* Main game UI */}
      <div className="absolute bottom-0 left-0 right-0 p-4">
        <div className="flex items-end justify-between">
          {/* Character stats bar */}
          <div className="w-1/3 space-y-2">
            {/* Health bar */}
            <div className="space-y-1">
              <div className="flex justify-between text-sm">
                <span>Health</span>
                <span>{character.stats.health}/{character.stats.maxHealth}</span>
              </div>
              <Progress value={healthPercent} className="h-4 bg-gray-700">
                <div 
                  className="h-full bg-red-600" 
                  style={{ width: `${healthPercent}%` }}
                />
              </Progress>
            </div>
            
            {/* Mana bar */}
            <div className="space-y-1">
              <div className="flex justify-between text-sm">
                <span>Mana</span>
                <span>{character.stats.mana}/{character.stats.maxMana}</span>
              </div>
              <Progress value={manaPercent} className="h-4 bg-gray-700">
                <div 
                  className="h-full bg-blue-600" 
                  style={{ width: `${manaPercent}%` }}
                />
              </Progress>
            </div>
            
            {/* Level and XP */}
            <div className="flex justify-between text-sm">
              <span>Level {character.stats.level}</span>
              <span>XP: {character.stats.experience}/{character.stats.level * 100}</span>
            </div>
          </div>
          
          {/* Action buttons */}
          <div className="space-x-2 pointer-events-auto">
            <Button onClick={toggleInventory} variant="secondary" size="sm">
              Inventory (I)
            </Button>
            <Button onClick={toggleStats} variant="secondary" size="sm">
              Character (C)
            </Button>
          </div>
        </div>
      </div>
      
      {/* Current players display */}
      <div className="absolute top-0 right-0 p-4 bg-black/50 rounded-bl">
        <h3 className="text-white text-sm mb-1">Players Online: {Object.keys(otherPlayers).length + 1}</h3>
        <ul className="text-xs text-white">
          <li>{character.name} (You)</li>
          {Object.values(otherPlayers).map(player => (
            <li key={player.id}>{player.name}</li>
          ))}
        </ul>
      </div>
      
      {/* Debug toggle */}
      <div className="absolute top-0 left-0 p-2 pointer-events-auto">
        <Button onClick={toggleDebug} variant="outline" size="sm">
          {showDebug ? 'Hide Debug' : 'Show Debug'}
        </Button>
      </div>
      
      {/* Sound toggle */}
      <div className="absolute top-0 left-24 p-2 pointer-events-auto">
        <Button onClick={toggleMute} variant="outline" size="sm">
          {isMuted ? 'Unmute' : 'Mute'}
        </Button>
      </div>
      
      {/* Camera toggle */}
      <div className="absolute top-0 left-[8rem] p-2 pointer-events-auto">
        <Button onClick={switchCamera} variant="outline" size="sm">
          Switch Camera (V)
        </Button>
      </div>
      
      {/* Controls help */}
      <div className="absolute bottom-28 right-4 p-4 bg-black/70 rounded text-white text-sm">
        <h3 className="font-bold mb-2">Controls</h3>
        <ul className="space-y-1">
          <li>WASD / Arrows: Move</li>
          <li>F: Attack</li>
          <li>I: Toggle Inventory</li>
          <li>C: Toggle Character Stats</li>
          <li>V: Switch Camera</li>
        </ul>
      </div>
      
      {/* Class indicator */}
      <div className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-black/50 px-4 py-1 rounded">
        <span className="text-sm text-white">
          {character.name} - Level {character.stats.level} {character.class.charAt(0).toUpperCase() + character.class.slice(1)}
        </span>
      </div>
      
      {/* Render panels based on game phase */}
      {gamePhase === GamePhase.Inventory && <InventoryPanel />}
      {gamePhase === GamePhase.Stats && <CharacterStats />}
    </div>
  );
}
import { useCharacter } from '@/lib/stores/useCharacter';
import { useMMOGame } from '@/lib/stores/useMMOGame';

export function GameHUD() {
  const { character } = useCharacter();
  const { playersOnline } = useMMOGame();

  return (
    <div className="absolute top-0 left-0 p-4 text-white">
      <div className="bg-black/50 p-2 rounded">
        <div>Players Online: {playersOnline}</div>
        <div>HP: {character.stats.health}</div>
      </div>
    </div>
  );
}
