import { useState } from 'react';
import { CharacterClass, DEFAULT_STATS } from '@shared/types';
import { useCharacter } from '@/lib/stores/useCharacter';
import { useMMOGame } from '@/lib/stores/useMMOGame';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export function CharacterCreation() {
  const [name, setName] = useState('');
  const [selectedClass, setSelectedClass] = useState<CharacterClass | null>(null);
  const [nameError, setNameError] = useState('');
  
  const { createCharacter } = useCharacter();
  const { setPlayerName } = useMMOGame();
  
  // Handle character creation
  const handleCreate = () => {
    // Validate name
    if (!name.trim()) {
      setNameError('Please enter a character name');
      return;
    }
    
    if (name.length < 3 || name.length > 16) {
      setNameError('Name must be between 3 and 16 characters');
      return;
    }
    
    // Validate class selection
    if (!selectedClass) {
      return;
    }
    
    // Create character
    setPlayerName(name);
    createCharacter(name, selectedClass);
  };
  
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-70">
      <Card className="w-full max-w-3xl bg-card/95 backdrop-blur-sm">
        <CardHeader className="text-center">
          <CardTitle className="text-3xl">Create Your Character</CardTitle>
          <CardDescription>
            Choose your name and class to begin your adventure
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          <div className="space-y-6">
            {/* Character name input */}
            <div className="space-y-2">
              <label htmlFor="name" className="text-lg font-medium">
                Character Name
              </label>
              <Input
                id="name"
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  setNameError('');
                }}
                placeholder="Enter character name"
                className="bg-background/50"
                maxLength={16}
              />
              {nameError && (
                <p className="text-sm text-red-500">{nameError}</p>
              )}
            </div>
            
            {/* Class selection */}
            <div className="space-y-2">
              <h3 className="text-lg font-medium">Choose Class</h3>
              
              <Tabs defaultValue="warrior" onValueChange={(v) => setSelectedClass(v as CharacterClass)}>
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value={CharacterClass.Warrior}>Warrior</TabsTrigger>
                  <TabsTrigger value={CharacterClass.Mage}>Mage</TabsTrigger>
                  <TabsTrigger value={CharacterClass.Archer}>Archer</TabsTrigger>
                </TabsList>
                
                <TabsContent value={CharacterClass.Warrior} className="mt-4">
                  <ClassCard
                    name="Warrior"
                    description="Masters of close combat, warriors excel at absorbing and dealing physical damage."
                    stats={DEFAULT_STATS[CharacterClass.Warrior]}
                    color="#ff5555"
                  />
                </TabsContent>
                
                <TabsContent value={CharacterClass.Mage} className="mt-4">
                  <ClassCard
                    name="Mage"
                    description="Powerful spellcasters who harness arcane energies to vanquish foes from afar."
                    stats={DEFAULT_STATS[CharacterClass.Mage]}
                    color="#5555ff"
                  />
                </TabsContent>
                
                <TabsContent value={CharacterClass.Archer} className="mt-4">
                  <ClassCard
                    name="Archer"
                    description="Swift and deadly marksmen who excel at picking off enemies with precision shots."
                    stats={DEFAULT_STATS[CharacterClass.Archer]}
                    color="#55ff55"
                  />
                </TabsContent>
              </Tabs>
            </div>
          </div>
        </CardContent>
        
        <CardFooter>
          <Button 
            onClick={handleCreate} 
            className="w-full"
            disabled={!name.trim() || !selectedClass}
          >
            Create Character
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}

// Component to display class information and stats
function ClassCard({ name, description, stats, color }: any) {
  return (
    <div className="p-6 border rounded-lg flex gap-6" style={{ borderColor: color }}>
      <div className="w-24 h-24 rounded-lg flex items-center justify-center" style={{ backgroundColor: color }}>
        <div className="text-2xl font-bold text-white">
          {name.charAt(0)}
        </div>
      </div>
      
      <div className="flex-1 space-y-4">
        <div>
          <h3 className="text-xl font-bold">{name}</h3>
          <p className="text-sm text-muted-foreground">{description}</p>
        </div>
        
        <div className="grid grid-cols-2 gap-2 text-sm">
          <StatRow label="Health" value={stats.health} />
          <StatRow label="Mana" value={stats.mana} />
          <StatRow label="Strength" value={stats.strength} />
          <StatRow label="Intelligence" value={stats.intelligence} />
          <StatRow label="Dexterity" value={stats.dexterity} />
        </div>
      </div>
    </div>
  );
}

// Component to display a stat row
function StatRow({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex justify-between">
      <span>{label}:</span>
      <span className="font-medium">{value}</span>
    </div>
  );
}
