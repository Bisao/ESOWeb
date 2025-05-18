import React, { useState, useEffect } from 'react';
import { CharacterClass, GamePhase, DEFAULT_STATS } from '@shared/types';
import { useCharacter } from '@/lib/stores/useCharacter';
import { useMMOGame } from '@/lib/stores/useMMOGame';
import { useMultiplayer } from '@/lib/stores/useMultiplayer';
import { useAudio } from '@/lib/stores/useAudio';

export function CharacterCreation() {
  const [name, setName] = useState('');
  const [selectedClass, setSelectedClass] = useState<CharacterClass | null>(null);
  const [error, setError] = useState('');
  
  const { createCharacter } = useCharacter();
  const { setGamePhase, setSelectedClass: setGameSelectedClass, playerId } = useMMOGame();
  const { connect } = useMultiplayer();
  const { playSuccess } = useAudio();
  
  // Connect to server when component mounts
  useEffect(() => {
    connect();
  }, [connect]);
  
  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setName(e.target.value);
  };
  
  const handleClassSelect = (characterClass: CharacterClass) => {
    setSelectedClass(characterClass);
    setGameSelectedClass(characterClass);
  };
  
  const handleSubmit = () => {
    // Validate name
    if (name.trim().length < 3) {
      setError('Nome deve ter pelo menos 3 caracteres');
      return;
    }
    
    // Validate class selection
    if (!selectedClass) {
      setError('Selecione uma classe');
      return;
    }
    
    // Create character
    createCharacter(
      name, 
      selectedClass,
      playerId,
      DEFAULT_STATS[selectedClass]
    );
    
    // Play success sound
    playSuccess();
    
    // Set game phase to playing
    setGamePhase(GamePhase.Playing);
  };
  
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black/80 z-10">
      <div className="bg-gray-900 p-8 rounded-lg shadow-lg max-w-md w-full text-white border border-gray-700">
        <h1 className="text-3xl font-bold mb-6 text-center text-amber-400">Criação de Personagem</h1>
        
        {/* Name input */}
        <div className="mb-6">
          <label className="block mb-2 font-semibold">Nome do Personagem</label>
          <input
            type="text"
            value={name}
            onChange={handleNameChange}
            className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded text-white focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
            placeholder="Digite o nome do seu personagem"
          />
        </div>
        
        {/* Class selection */}
        <div className="mb-6">
          <label className="block mb-2 font-semibold">Classe</label>
          <div className="grid grid-cols-3 gap-4">
            <ClassOption
              characterClass={CharacterClass.Warrior}
              name="Guerreiro"
              description="Especialista em combate corpo a corpo"
              selected={selectedClass === CharacterClass.Warrior}
              onSelect={handleClassSelect}
              stats={DEFAULT_STATS[CharacterClass.Warrior]}
            />
            <ClassOption
              characterClass={CharacterClass.Mage}
              name="Mago"
              description="Mestre das artes arcanas"
              selected={selectedClass === CharacterClass.Mage}
              onSelect={handleClassSelect}
              stats={DEFAULT_STATS[CharacterClass.Mage]}
            />
            <ClassOption
              characterClass={CharacterClass.Archer}
              name="Arqueiro"
              description="Especialista em ataques à distância"
              selected={selectedClass === CharacterClass.Archer}
              onSelect={handleClassSelect}
              stats={DEFAULT_STATS[CharacterClass.Archer]}
            />
          </div>
        </div>
        
        {/* Error message */}
        {error && (
          <div className="mb-4 text-red-500 text-center">
            {error}
          </div>
        )}
        
        {/* Submit button */}
        <button
          onClick={handleSubmit}
          className="w-full py-3 bg-amber-500 rounded font-bold text-black hover:bg-amber-600 transition-colors"
        >
          Criar Personagem
        </button>
      </div>
    </div>
  );
}

interface ClassOptionProps {
  characterClass: CharacterClass;
  name: string;
  description: string;
  selected: boolean;
  onSelect: (characterClass: CharacterClass) => void;
  stats: any;
}

function ClassOption({ characterClass, name, description, selected, onSelect, stats }: ClassOptionProps) {
  // Color for each class
  const colors = {
    [CharacterClass.Warrior]: 'from-red-900 to-red-700',
    [CharacterClass.Mage]: 'from-blue-900 to-blue-700',
    [CharacterClass.Archer]: 'from-green-900 to-green-700',
  };
  
  // Hover effect
  const hoverColors = {
    [CharacterClass.Warrior]: 'hover:from-red-800 hover:to-red-600',
    [CharacterClass.Mage]: 'hover:from-blue-800 hover:to-blue-600',
    [CharacterClass.Archer]: 'hover:from-green-800 hover:to-green-600',
  };
  
  // Selected style
  const selectedStyle = selected ? 'ring-4 ring-yellow-500 ring-opacity-80 transform scale-105' : '';
  
  return (
    <div
      className={`cursor-pointer rounded-lg overflow-hidden transition-all duration-200 ${selectedStyle}`}
      onClick={() => onSelect(characterClass)}
    >
      <div className={`bg-gradient-to-br ${colors[characterClass]} ${hoverColors[characterClass]} p-4 h-full flex flex-col`}>
        <h3 className="text-xl font-bold mb-2">{name}</h3>
        <p className="text-sm text-gray-200 mb-3">{description}</p>
        
        {/* Stats preview */}
        <div className="mt-auto text-xs space-y-1">
          <div className="flex justify-between">
            <span>Força:</span>
            <span>{stats.strength}</span>
          </div>
          <div className="flex justify-between">
            <span>Inteligência:</span>
            <span>{stats.intelligence}</span>
          </div>
          <div className="flex justify-between">
            <span>Destreza:</span>
            <span>{stats.dexterity}</span>
          </div>
        </div>
      </div>
    </div>
  );
}