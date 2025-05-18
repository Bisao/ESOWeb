import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import { Inventory, Item, ItemType } from '@shared/types';

// Define the types for the inventory state
interface InventoryState {
  inventory: Inventory;
  selectedItemIndex: number | null;
  
  // Inventory actions
  addItem: (item: Item) => boolean; // Returns false if inventory is full
  removeItem: (index: number) => Item | null;
  useItem: (index: number) => void;
  addGold: (amount: number) => void;
  removeGold: (amount: number) => boolean; // Returns false if not enough gold
  selectItem: (index: number | null) => void;
  dropItem: (index: number) => Item | null;
}

// Create default inventory
const defaultInventory: Inventory = {
  items: [],
  gold: 50,
  maxSlots: 20
};

// Create some starting items for testing
const startingItems: Item[] = [
  {
    id: '1',
    name: 'Rusty Sword',
    type: ItemType.Weapon,
    value: 10,
    description: 'A rusty but serviceable sword.',
    stats: { strength: 5 }
  },
  {
    id: '2',
    name: 'Leather Armor',
    type: ItemType.Armor,
    value: 15,
    description: 'Simple leather armor for basic protection.',
    stats: { maxHealth: 10 }
  },
  {
    id: '3',
    name: 'Health Potion',
    type: ItemType.Potion,
    value: 5,
    description: 'Restores 25 health when consumed.',
  }
];

export const useInventory = create<InventoryState>()(
  subscribeWithSelector((set, get) => ({
    inventory: {
      ...defaultInventory,
      items: [...startingItems]
    },
    selectedItemIndex: null,
    
    // Add an item to inventory if there is space
    addItem: (item) => {
      const success = set((state) => {
        if (state.inventory.items.length >= state.inventory.maxSlots) {
          return { inventory: state.inventory }; // Inventory full
        }
        
        return {
          inventory: {
            ...state.inventory,
            items: [...state.inventory.items, item]
          }
        };
      });
      
      return success;
    },
    
    // Remove an item from inventory at specified index
    removeItem: (index) => {
      let removedItem: Item | null = null;
      
      set((state) => {
        if (index < 0 || index >= state.inventory.items.length) {
          return { inventory: state.inventory };
        }
        
        // Get the item that's being removed
        removedItem = state.inventory.items[index];
        
        // Create a new items array without the removed item
        const newItems = [...state.inventory.items];
        newItems.splice(index, 1);
        
        return {
          inventory: {
            ...state.inventory,
            items: newItems
          },
          // Reset selected item if it was removed
          selectedItemIndex: state.selectedItemIndex === index ? null : state.selectedItemIndex
        };
      });
      
      return removedItem;
    },
    
    // Use an item (potions, etc)
    useItem: (index) => {
      // Implementation depends on item type and game mechanics
      // For potions, this could apply healing
      // For equipment, this could equip the item
    },
    
    // Add gold to inventory
    addGold: (amount) => {
      set((state) => ({
        inventory: {
          ...state.inventory,
          gold: state.inventory.gold + amount
        }
      }));
    },
    
    // Remove gold if there is enough
    removeGold: (amount) => {
      let success = false;
      
      set((state) => {
        if (state.inventory.gold < amount) {
          return { inventory: state.inventory }; // Not enough gold
        }
        
        success = true;
        return {
          inventory: {
            ...state.inventory,
            gold: state.inventory.gold - amount
          }
        };
      });
      
      return success;
    },
    
    // Select an item in the inventory
    selectItem: (index) => {
      set({ selectedItemIndex: index });
    },
    
    // Drop an item (remove from inventory)
    dropItem: (index) => {
      return get().removeItem(index);
    }
  }))
);
