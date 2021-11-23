import {
  StorageCalculatorState,
  CalculatorPredefinedItem,
  CalculatorCustomItem,
} from '../../types';

export type StorageCalculatorAction =
  | UpdatePredefinedItemsAction
  | SendForCalculationAction
  | AddCustomItemAction
  | CalculationResponseReceivedAction


export const storageCalculatorReducer = (
  state: StorageCalculatorState,
  action: StorageCalculatorAction
): typeof state => {
  switch (action.type) {
    case 'UPDATE_PREDEFINED_ITEMS':
      return updatePredefinedItems(action.items, state);
    case 'SEND_FOR_CALCULATION':
      return { 
        ...state,
        calculationData: {},
        sentForCalculation: true,
      };
    case 'ADD_CUSTOM_ITEM':
      return insertItem(action.item, state);
    case 'CALCULATION_RESPONSE_RECEIVED':
      return { 
        ...state,
        calculationData: action.payload.data,
        sentForCalculation: false,
      }
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

// ============================================================================
// Reducer Functions
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