import { useInventory } from '@/lib/stores/useInventory';
import { ItemType } from '@shared/types';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useMMOGame } from '@/lib/stores/useMMOGame';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';

export function InventoryPanel() {
  const { inventory, selectedItemIndex, selectItem, removeItem } = useInventory();
  const { toggleInventory } = useMMOGame();
  
  // Get selected item
  const selectedItem = selectedItemIndex !== null ? inventory.items[selectedItemIndex] : null;
  
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black/50 pointer-events-auto">
      <Card className="w-full max-w-3xl h-4/5 flex flex-col">
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Inventory</CardTitle>
              <CardDescription>
                Items: {inventory.items.length}/{inventory.maxSlots} | Gold: {inventory.gold}
              </CardDescription>
            </div>
            <Button variant="ghost" onClick={toggleInventory}>
              Close
            </Button>
          </div>
        </CardHeader>
        
        <CardContent className="flex-1 overflow-hidden">
          <div className="grid grid-cols-[3fr_2fr] gap-4 h-full">
            {/* Items grid */}
            <div className="bg-muted/20 rounded-lg p-2 h-full">
              <ScrollArea className="h-full">
                <div className="grid grid-cols-5 gap-2">
                  {inventory.items.map((item, index) => (
                    <div
                      key={`${item.id}-${index}`}
                      className={`w-full aspect-square rounded border border-border p-1 cursor-pointer relative ${
                        selectedItemIndex === index ? 'bg-accent border-primary' : 'hover:bg-accent/50'
                      }`}
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
                      </div>
                    </div>
                  ))}
                  
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
                  
                  <Separator className="my-3" />
                  
                  <div className="text-sm">{selectedItem.description}</div>
                  
                  {selectedItem.stats && (
                    <div className="mt-4">
                      <h4 className="text-sm font-semibold mb-2">Stats:</h4>
                      <div className="space-y-1 text-sm">
                        {Object.entries(selectedItem.stats).map(([stat, value]) => (
                          <div key={stat} className="flex justify-between">
                            <span className="capitalize">{stat}:</span>
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
                      <span>Value:</span>
                      <span>{selectedItem.value} gold</span>
                    </div>
                  </div>
                  
                  <div className="mt-auto pt-4 space-x-2">
                    {selectedItem.type === ItemType.Potion && (
                      <Button variant="default" size="sm" className="w-full">
                        Use
                      </Button>
                    )}
                    
                    {(selectedItem.type === ItemType.Weapon || selectedItem.type === ItemType.Armor) && (
                      <Button variant="default" size="sm" className="w-full">
                        Equip
                      </Button>
                    )}
                    
                    <Button 
                      variant="destructive" 
                      size="sm" 
                      className="w-full mt-2"
                      onClick={() => {
                        if (selectedItemIndex !== null) {
                          removeItem(selectedItemIndex);
                        }
                      }}
                    >
                      Drop
                    </Button>
                  </div>
                </>
              ) : (
                <div className="flex items-center justify-center h-full text-muted-foreground">
                  Select an item to view details
                </div>
              )}
            </div>
          </div>
        </CardContent>
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
