import { useInventory } from '@/lib/stores/useInventory';
import { ItemType } from '@shared/types';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useMMOGame } from '@/lib/stores/useMMOGame';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useCharacter } from '@/lib/stores/useCharacter';
import { Badge } from '@/components/ui/badge';

export function InventoryPanel() {
  const { 
    inventory, 
    selectedItemIndex, 
    selectItem, 
    removeItem, 
    useItem, 
    equipItem, 
    unequipItem,
    getEquippedItems 
  } = useInventory();
  const { toggleInventory } = useMMOGame();
  const { character, equippedWeapon, equippedArmor, equippedHelmet } = useCharacter();
  
  // Get selected item
  const selectedItem = selectedItemIndex !== null ? inventory.items[selectedItemIndex] : null;
  
  // Get equipped items
  const equippedItems = getEquippedItems();
  
  // Verificar se o item selecionado está equipado
  const isItemEquipped = selectedItem && (
    equippedWeapon === selectedItem.id ||
    equippedArmor === selectedItem.id ||
    equippedHelmet === selectedItem.id
  );
  
  // Determinar o slot do item selecionado
  const getItemSlot = (item) => {
    if (!item) return null;
    
    if (item.type === ItemType.Weapon) return 'weapon';
    if (item.type === ItemType.Armor) {
      if (item.name.toLowerCase().includes('helmet') || 
          item.name.toLowerCase().includes('cap') || 
          item.name.toLowerCase().includes('hood')) {
        return 'helmet';
      }
      return 'armor';
    }
    return null;
  };
  
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black/50 pointer-events-auto">
      <Card className="w-full max-w-3xl h-4/5 flex flex-col">
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Inventário</CardTitle>
              <CardDescription>
                Itens: {inventory.items.length}/{inventory.maxSlots} | Ouro: {inventory.gold}
              </CardDescription>
            </div>
            <Button variant="ghost" onClick={toggleInventory}>
              Fechar
            </Button>
          </div>
        </CardHeader>
        
        <CardContent className="flex-1 overflow-hidden">
          <div className="grid grid-cols-[3fr_2fr] gap-4 h-full">
            {/* Items grid */}
            <div className="bg-muted/20 rounded-lg p-2 h-full">
              <ScrollArea className="h-full">
                <div className="grid grid-cols-5 gap-2">
                  {inventory.items.map((item, index) => {
                    // Verificar se este item está equipado
                    const isEquipped = 
                      item.id === equippedWeapon || 
                      item.id === equippedArmor || 
                      item.id === equippedHelmet;
                    
                    return (
                      <div
                        key={`${item.id}-${index}`}
                        className={`w-full aspect-square rounded border border-border p-1 cursor-pointer relative ${
                          selectedItemIndex === index ? 'bg-accent border-primary' : 'hover:bg-accent/50'
                        } ${isEquipped ? 'ring-2 ring-primary' : ''}`}
                        onClick={() => selectItem(index)}
                      >
                        <div className="flex flex-col items-center justify-center h-full">
                          {/* Item icon - using colored squares for simplicity */}
                          <div 
                            className="w-8 h-8 rounded"
                            style={{ 
                              backgroundColor: getItemColor(item.type),
                              border: '1px solid ' + getBorderColor(item.type)
                            }}
                          />
                          <span className="text-xs mt-1 truncate w-full text-center">
                            {item.name}
                          </span>
                          
                          {/* Indicador de item equipado */}
                          {isEquipped && (
                            <Badge variant="outline" className="absolute top-0 right-0 text-[8px] px-1 py-0">
                              E
                            </Badge>
                          )}
                        </div>
                      </div>
                    );
                  })}
                  
                  {/* Empty slots */}
                  {Array.from({ length: inventory.maxSlots - inventory.items.length }).map((_, index) => (
                    <div
                      key={`empty-${index}`}
                      className="w-full aspect-square rounded border border-border/50 p-1 bg-background/30"
                    />
                  ))}
                </div>
              </ScrollArea>
            </div>
            
            {/* Item details */}
            <div className="bg-muted/20 rounded-lg p-4 flex flex-col">
              {selectedItem ? (
                <>
                  <div className="text-lg font-bold">{selectedItem.name}</div>
                  <div className="text-sm text-muted-foreground capitalize">{selectedItem.type}</div>
                  
                  {isItemEquipped && (
                    <Badge className="mt-1 self-start">Equipado</Badge>
                  )}
                  
                  <Separator className="my-3" />
                  
                  <div className="text-sm">{selectedItem.description}</div>
                  
                  {selectedItem.stats && (
                    <div className="mt-4">
                      <h4 className="text-sm font-semibold mb-2">Atributos:</h4>
                      <div className="space-y-1 text-sm">
                        {Object.entries(selectedItem.stats).map(([stat, value]) => (
                          <div key={stat} className="flex justify-between">
                            <span className="capitalize">{translateStat(stat)}:</span>
                            <span className={Number(value) > 0 ? 'text-green-500' : 'text-red-500'}>
                              {Number(value) > 0 ? '+' : ''}{value}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  <div className="mt-3 text-sm">
                    <div className="flex justify-between">
                      <span>Valor:</span>
                      <span>{selectedItem.value} ouro</span>
                    </div>
                  </div>
                  
                  <div className="mt-auto pt-4 space-x-2">
                    {selectedItem.type === ItemType.Potion && (
                      <Button 
                        variant="default" 
                        size="sm" 
                        className="w-full"
                        onClick={() => {
                          if (selectedItemIndex !== null) {
                            useItem(selectedItemIndex);
                          }
                        }}
                      >
                        Usar
                      </Button>
                    )}
                    
                    {(selectedItem.type === ItemType.Weapon || selectedItem.type === ItemType.Armor) && (
                      isItemEquipped ? (
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="w-full"
                          onClick={() => {
                            const slot = getItemSlot(selectedItem);
                            if (slot) {
                              unequipItem(slot);
                            }
                          }}
                        >
                          Desequipar
                        </Button>
                      ) : (
                        <Button 
                          variant="default" 
                          size="sm" 
                          className="w-full"
                          onClick={() => {
                            if (selectedItemIndex !== null) {
                              equipItem(selectedItemIndex);
                            }
                          }}
                        >
                          Equipar
                        </Button>
                      )
                    )}
                    
                    <Button 
                      variant="destructive" 
                      size="sm" 
                      className="w-full mt-2"
                      onClick={() => {
                        if (selectedItemIndex !== null) {
                          // Verificar se o item está equipado antes de descartar
                          if (isItemEquipped) {
                            const slot = getItemSlot(selectedItem);
                            if (slot) {
                              unequipItem(slot);
                            }
                          }
                          removeItem(selectedItemIndex);
                        }
                      }}
                    >
                      Descartar
                    </Button>
                  </div>
                </>
              ) : (
                <div className="flex items-center justify-center h-full text-muted-foreground">
                  Selecione um item para ver detalhes
                </div>
              )}
            </div>
          </div>
        </CardContent>
        
        <CardFooter className="border-t pt-4">
          <div className="w-full grid grid-cols-3 gap-4">
            <div className="bg-muted/20 p-2 rounded-lg">
              <h3 className="text-sm font-semibold mb-1">Arma</h3>
              <div className="flex items-center space-x-2">
                {equippedItems.weapon ? (
                  <>
                    <div 
                      className="w-6 h-6 rounded"
                      style={{ 
                        backgroundColor: getItemColor(ItemType.Weapon),
                        border: '1px solid ' + getBorderColor(ItemType.Weapon)
                      }}
                    />
                    <span className="text-xs">{equippedItems.weapon.name}</span>
                  </>
                ) : (
                  <span className="text-xs text-muted-foreground">Nenhuma arma equipada</span>
                )}
              </div>
            </div>
            
            <div className="bg-muted/20 p-2 rounded-lg">
              <h3 className="text-sm font-semibold mb-1">Armadura</h3>
              <div className="flex items-center space-x-2">
                {equippedItems.armor ? (
                  <>
                    <div 
                      className="w-6 h-6 rounded"
                      style={{ 
                        backgroundColor: getItemColor(ItemType.Armor),
                        border: '1px solid ' + getBorderColor(ItemType.Armor)
                      }}
                    />
                    <span className="text-xs">{equippedItems.armor.name}</span>
                  </>
                ) : (
                  <span className="text-xs text-muted-foreground">Nenhuma armadura equipada</span>
                )}
              </div>
            </div>
            
            <div className="bg-muted/20 p-2 rounded-lg">
              <h3 className="text-sm font-semibold mb-1">Capacete</h3>
              <div className="flex items-center space-x-2">
                {equippedItems.helmet ? (
                  <>
                    <div 
                      className="w-6 h-6 rounded"
                      style={{ 
                        backgroundColor: getItemColor(ItemType.Armor),
                        border: '1px solid ' + getBorderColor(ItemType.Armor)
                      }}
                    />
                    <span className="text-xs">{equippedItems.helmet.name}</span>
                  </>
                ) : (
                  <span className="text-xs text-muted-foreground">Nenhum capacete equipado</span>
                )}
              </div>
            </div>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}

// Helper function to get color for item type
function getItemColor(type: ItemType): string {
  switch (type) {
    case ItemType.Weapon:
      return '#ffcccc';
    case ItemType.Armor:
      return '#ccccff';
    case ItemType.Potion:
      return '#ccffcc';
    case ItemType.Quest:
      return '#ffccff';
    default:
      return '#cccccc';
  }
}

// Helper function to get border color for item type
function getBorderColor(type: ItemType): string {
  switch (type) {
    case ItemType.Weapon:
      return '#ff5555';
    case ItemType.Armor:
      return '#5555ff';
    case ItemType.Potion:
      return '#55ff55';
    case ItemType.Quest:
      return '#ff55ff';
    default:
      return '#aaaaaa';
  }
}

// Traduzir nomes de atributos para português
function translateStat(stat: string): string {
  const translations = {
    'health': 'Vida',
    'maxHealth': 'Vida Máxima',
    'mana': 'Mana',
    'maxMana': 'Mana Máxima',
    'strength': 'Força',
    'intelligence': 'Inteligência',
    'dexterity': 'Destreza',
    'level': 'Nível',
    'experience': 'Experiência'
  };
  
  return translations[stat] || stat;
}
