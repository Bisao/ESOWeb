import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import { Inventory, Item, ItemType } from '@shared/types';
import { useCharacter } from './useCharacter';

// Define the types for the inventory state
interface InventoryState {
  inventory: Inventory;
  selectedItemIndex: number | null;
  
  // Inventory actions
  addItem: (item: Item) => boolean; // Returns false if inventory is full
  removeItem: (index: number) => Item | null;
  useItem: (index: number) => void;
  equipItem: (index: number) => void;
  unequipItem: (slot: 'weapon' | 'armor' | 'helmet') => void;
  addGold: (amount: number) => void;
  removeGold: (amount: number) => boolean; // Returns false if not enough gold
  selectItem: (index: number | null) => void;
  dropItem: (index: number) => Item | null;
  getEquippedItems: () => { weapon: Item | null, armor: Item | null, helmet: Item | null };
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
    id: 'weapon_1',
    name: 'Rusty Sword',
    type: ItemType.Weapon,
    value: 10,
    description: 'A rusty but serviceable sword.',
    icon: 'sword_icon.png',
    stats: { strength: 5 }
  },
  {
    id: 'armor_1',
    name: 'Leather Armor',
    type: ItemType.Armor,
    value: 15,
    description: 'Simple leather armor for basic protection.',
    icon: 'armor_icon.png',
    stats: { maxHealth: 10 }
  },
  {
    id: 'potion_1',
    name: 'Health Potion',
    type: ItemType.Potion,
    value: 5,
    description: 'Restores 25 health when consumed.',
    icon: 'potion_icon.png'
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
      let success = false;
      
      set((state) => {
        if (state.inventory.items.length >= state.inventory.maxSlots) {
          return state; // Inventory full
        }
        
        success = true;
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
          return state;
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
      const { inventory } = get();
      if (index < 0 || index >= inventory.items.length) return;
      
      const item = inventory.items[index];
      
      // Verificar o tipo do item
      switch (item.type) {
        case ItemType.Potion:
          // Aplicar efeito da poção (cura)
          if (item.stats?.health) {
            useCharacter.getState().heal(item.stats.health);
          } else {
            // Poção padrão cura 25 de vida
            useCharacter.getState().heal(25);
          }
          
          // Remover a poção do inventário após uso
          get().removeItem(index);
          break;
          
        case ItemType.Weapon:
        case ItemType.Armor:
          // Equipar o item
          get().equipItem(index);
          break;
      }
    },
    
    // Equipar um item
    equipItem: (index) => {
      const { inventory } = get();
      if (index < 0 || index >= inventory.items.length) return;
      
      const item = inventory.items[index];
      const characterState = useCharacter.getState();
      
      // Determinar o slot com base no tipo do item
      let slot: 'weapon' | 'armor' | 'helmet';
      
      switch (item.type) {
        case ItemType.Weapon:
          slot = 'weapon';
          break;
        case ItemType.Armor:
          // Verificar se é um capacete ou armadura pelo nome ou propriedades
          if (item.name.toLowerCase().includes('helmet') || 
              item.name.toLowerCase().includes('cap') || 
              item.name.toLowerCase().includes('hood')) {
            slot = 'helmet';
          } else {
            slot = 'armor';
          }
          break;
        default:
          // Não é um item equipável
          return;
      }
      
      // Desequipar item atual do mesmo slot, se houver
      const currentEquipped = characterState[`equipped${slot.charAt(0).toUpperCase() + slot.slice(1)}`];
      
      // Equipar o novo item
      characterState.equipItem(slot, item.id);
      
      // Atualizar a interface (se necessário)
      console.log(`Equipado ${item.name} no slot ${slot}`);
    },
    
    // Desequipar um item
    unequipItem: (slot) => {
      const characterState = useCharacter.getState();
      
      // Desequipar o item
      characterState.unequipItem(slot);
      
      // Atualizar a interface (se necessário)
      console.log(`Item desequipado do slot ${slot}`);
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
          return state; // Not enough gold
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
    },
    
    // Obter itens equipados
    getEquippedItems: () => {
      const { inventory } = get();
      const characterState = useCharacter.getState();
      
      const equippedWeaponId = characterState.equippedWeapon;
      const equippedArmorId = characterState.equippedArmor;
      const equippedHelmetId = characterState.equippedHelmet;
      
      // Encontrar os itens correspondentes no inventário
      const weapon = inventory.items.find(item => item.id === equippedWeaponId) || null;
      const armor = inventory.items.find(item => item.id === equippedArmorId) || null;
      const helmet = inventory.items.find(item => item.id === equippedHelmetId) || null;
      
      return { weapon, armor, helmet };
    }
  }))
);
