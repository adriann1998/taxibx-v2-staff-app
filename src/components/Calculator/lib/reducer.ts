import {
  StorageCalculatorState,
  CalculatorPredefinedItem,
  CalculatorCustomItem,
  CalculatorItem,
} from '../../../types';

export type StorageCalculatorAction =
  | UpdatePredefinedItemsAction
  | SendForCalculationAction
  | AddCustomItemAction
  | CalculationResponseReceivedAction
  | RemoveItemAction
  | ChangQuantityAction


export const storageCalculatorReducer = (
  state: StorageCalculatorState,
  action: StorageCalculatorAction
): typeof state => {
  switch (action.type) {
    case 'UPDATE_PREDEFINED_ITEMS': {
      return updatePredefinedItems(action.items, state);
    };
    case 'SEND_FOR_CALCULATION': {
      return { 
        ...state,
        calculationData: {},
        sentForCalculation: true,
      };
    };
    case 'ADD_CUSTOM_ITEM': {
      return insertItem(action.item, state);
    };
    case 'CALCULATION_RESPONSE_RECEIVED': {
      return { 
        ...state,
        calculationData: action.payload.data,
        sentForCalculation: false,
      };
    };
    case 'REMOVE_ITEM': {
      const item = action.item;
      //console.log('item delete request received', item);
      const currentItems = [...state.selectedItemObjects];
      const updatedList = currentItems.length > 0 ? currentItems.filter(listItem => {
        return listItem.id !== item.id;
      }) : [];
      return {
        ...state,
        calculationData: {},
        selectedItemObjects: updatedList,
      };
    };
    case 'CHANGE_QUANTITY': {
      const id = action.id;
      const quantity = action.quantity
      //console.log('item quantity change request received', id, quantity);
      const item = getItem(id, state);
      if (item) {
        // Item exists, change the item quantity and return the state with the modified value.
        item.quantity = quantity;
        const otherItems = getOtherItems(id, state)
        return { 
          ...state,
          calculationData: {},
          selectedItemObjects: [...otherItems, item],
          lastAddedItem: item,
        };
      } else {
        console.warn(`item with id ${id} does not exist - please let IT team know :)`);
        return state;
      };
    };
  }
}

export type UpdatePredefinedItemsAction = {
  type: 'UPDATE_PREDEFINED_ITEMS';
  items: CalculatorPredefinedItem[];
};

export type SendForCalculationAction = {
  type: 'SEND_FOR_CALCULATION';
}

export type AddCustomItemAction = {
  type: 'ADD_CUSTOM_ITEM';
  item: CalculatorCustomItem;
};

export type CalculationResponseReceivedAction = {
  type: 'CALCULATION_RESPONSE_RECEIVED';
  payload: {
    data: any;
  }
};

export type RemoveItemAction = {
  type: 'REMOVE_ITEM';
  item: CalculatorItem;
};

export type ChangQuantityAction = {
  type: 'CHANGE_QUANTITY';
  id: string;
  quantity: number;
};

// ============================================================================
// Reducer Functions/Helpers
// ============================================================================

const updatePredefinedItems = (
  items: CalculatorPredefinedItem[],
  state: StorageCalculatorState,
): typeof state => {
  // remove all the predefined items and add the new ones.
  const currentItemObjects = [...state.selectedItemObjects];
  let newObjectsBeforeUpdate = currentItemObjects.filter(itemObject => {
    return !itemObject.predefined
  })
  // Set the default quantity to 1 if not exists for predefined items
  items = items.map(item => {
    if (item.predefined) {
      item.quantity = !item.quantity ? 1 : item.quantity;
    }
    return item;
  })

  if (items.length) {
    const lastAddedItem = items.pop();
    if (!lastAddedItem) throw new Error('lastAddedItem is undefined');
    return { ...state, selectedItemObjects: [lastAddedItem, ...items, ...newObjectsBeforeUpdate], calculationData: {}, lastAddedItem: lastAddedItem }
  } else {
    return { ...state, selectedItemObjects: [...newObjectsBeforeUpdate], calculationData: {}, lastAddedItem: newObjectsBeforeUpdate[newObjectsBeforeUpdate.length - 1] }
  }
};

/**
 * Handles inserting items for both custom and pre-defined scenarios.
 * 
 * @param {*} item 
 * @param {*} state 
 */
const insertItem = (
  item: CalculatorCustomItem,
  state: StorageCalculatorState,
): typeof state => {
  // Set the default quantity to 1
  item.quantity = !item.quantity ? 1 : item.quantity;
  // insert the item if it doesn't exist
  return state.selectedItemObjects.indexOf(item) === -1 ?
    { ...state, selectedItemObjects: [item, ...state.selectedItemObjects], calculationData: {}, lastAddedItem: item }
    : state;
};

/**
 * Gets an item of a given id if exists.
 * 
 * @param {*} id 
 * @param {*} state 
 */
const getItem = (id: string, state: StorageCalculatorState) => {
  return state.selectedItemObjects.filter(item => {
    return item.id === id;
  })[0];
};

/**
 * Gets all the items other than the item having provided id.
 * 
 * @param {*} id 
 * @param {*} state 
 */
const getOtherItems = (id: string, state: StorageCalculatorState) => {
  return state.selectedItemObjects.filter(item => {
    return item.id !== id;
  });
}
