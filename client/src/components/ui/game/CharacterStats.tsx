import { useCharacter } from '@/lib/stores/useCharacter';
import { useMMOGame } from '@/lib/stores/useMMOGame';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { CharacterClass } from '@shared/types';

export function CharacterStats() {
  const { character } = useCharacter();
  const { toggleStats } = useMMOGame();
  
  if (!character) return null;
  
  // Experience to next level
  const experienceRequired = character.stats.level * 100;
  const experiencePercent = (character.stats.experience / experienceRequired) * 100;
  
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black/50 pointer-events-auto">
      <Card className="w-full max-w-2xl">
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Character</CardTitle>
              <CardDescription>
                {character.name} - Level {character.stats.level} {formatClassName(character.class)}
              </CardDescription>
            </div>
            <Button variant="ghost" onClick={toggleStats}>
              Close
            </Button>
          </div>
        </CardHeader>
        
        <CardContent>
          <div className="grid grid-cols-[1fr_2fr] gap-6">
            {/* Character visualization */}
            <div className="aspect-square bg-muted/20 rounded-lg flex items-center justify-center">
              {/* Simple character icon based on class */}
              <div 
                className="w-24 h-24 rounded-full flex items-center justify-center text-4xl font-bold"
                style={{ backgroundColor: getClassColor(character.class) }}
              >
                {character.class.charAt(0).toUpperCase()}
              </div>
            </div>
            
            {/* Character stats */}
            <div className="space-y-4">
              {/* Main stats */}
              <div className="space-y-2">
                <h3 className="text-lg font-semibold">Attributes</h3>
                
                <div className="grid grid-cols-2 gap-x-4 gap-y-2">
                  <StatRow label="Strength" value={character.stats.strength} />
                  <StatRow label="Intelligence" value={character.stats.intelligence} />
                  <StatRow label="Dexterity" value={character.stats.dexterity} />
                </div>
              </div>
              
              <Separator />
              
              {/* Health and mana */}
              <div className="space-y-2">
                <h3 className="text-lg font-semibold">Resources</h3>
                
                {/* Health */}
                <div className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <span>Health</span>
                    <span>{character.stats.health}/{character.stats.maxHealth}</span>
                  </div>
                  <Progress 
                    value={(character.stats.health / character.stats.maxHealth) * 100} 
                    className="h-2"
                  />
                </div>
                
                {/* Mana */}
                <div className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <span>Mana</span>
                    <span>{character.stats.mana}/{character.stats.maxMana}</span>
                  </div>
                  <Progress 
                    value={(character.stats.mana / character.stats.maxMana) * 100} 
                    className="h-2"
                  />
                </div>
              </div>
              
              <Separator />
              
              {/* Experience */}
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Experience</span>
                  <span>{character.stats.experience}/{experienceRequired}</span>
                </div>
                <Progress value={experiencePercent} className="h-2" />
                <p className="text-xs text-muted-foreground">
                  {Math.floor(experienceRequired - character.stats.experience)} XP needed for level {character.stats.level + 1}
                </p>
              </div>
              
              {/* Class bonuses */}
              <div className="bg-muted/20 p-3 rounded-lg">
                <h3 className="text-sm font-semibold mb-2">Class Abilities:</h3>
                <p className="text-xs">
                  {getClassDescription(character.class)}
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Helper components and functions

function StatRow({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex justify-between">
      <span className="text-sm">{label}:</span>
      <span className="font-medium">{value}</span>
    </div>
  );
}

function formatClassName(characterClass: CharacterClass): string {
  return characterClass.charAt(0).toUpperCase() + characterClass.slice(1);
}

function getClassColor(characterClass: CharacterClass): string {
  switch (characterClass) {
    case CharacterClass.Warrior:
      return '#ff5555';
    case CharacterClass.Mage:
      return '#5555ff';
    case CharacterClass.Archer:
      return '#55ff55';
    default:
      return '#cccccc';
  }
}

function getClassDescription(characterClass: CharacterClass): string {
  switch (characterClass) {
    case CharacterClass.Warrior:
      return "Warriors excel in close combat with powerful melee attacks and superior physical defense. They gain bonus health and strength with each level.";
    case CharacterClass.Mage:
      return "Mages harness arcane energies to cast devastating spells from a distance. They have enhanced mana reserves and intelligence growth.";
    case CharacterClass.Archer:
      return "Archers are experts at ranged combat, using bows to strike enemies with precision. They benefit from increased dexterity and attack speed.";
    default:
      return "";
  }
}
