import React, { useState, useEffect } from "react";
import {
  List,
  Typography,
} from '@material-ui/core';
import CustomListItem from "./CustomListItem";
import {
  StorageCalculatorState,
  CalculatorItem,
} from '../../types';

import {
  StorageCalculatorAction,
} from './lib/reducer';

/**
 * Responsible for loading the selected items list.
 */
const SelectedItemsList = ({
  state,
  dispatch,
}: SelectedItemsListProps) => {

  const [expanded, setExpanded] = useState<string>();

  /**
   * Handles the expansion change of a selected item.
   */
  const handleExpansionChange = (panel: string) => {
    setExpanded(expanded === panel ? undefined : panel);
  };

  /**
   * Call the reducer to handle quantity change.
   */
  const handleQuantityChange = (item: CalculatorItem, event: React.ChangeEvent<HTMLTextAreaElement | HTMLInputElement>) => {
    dispatch({
      type: "CHANGE_QUANTITY",
      id: item.id,
      quantity: parseInt(event.target.value),
    });
  }

  /**
   * Calls the reducer to handle item deletion.
   * 
   * @param {*} item 
   */
  const handleDeleteItem = (item: CalculatorItem) => {
    dispatch({
      type: 'REMOVE_ITEM',
      item: item,
    });
  }

  /**
   * Renders the selected items in the body for adding quantities.
   */
  const renderSelectedItems = () => {
    let list = state.selectedItemObjects.length ? state.selectedItemObjects.map((item, index) => {
      const itemDimensions = item.width + ' cm(W) x ' + item.height + ' cm(H) x ' + item.depth + ' cm(D)';
      return (
        <CustomListItem
          key={item.id}
          item={item}
          itemDimensions={itemDimensions}
          handleQuantityChange={(item: CalculatorItem, event: React.ChangeEvent<HTMLTextAreaElement | HTMLInputElement>) => handleQuantityChange(item, event)}
          handleDeleteItem={(item: CalculatorItem) => handleDeleteItem(item)}
          handleChange={(panel: string) => handleExpansionChange(panel)}
          expanded={expanded} 
        />
      );
    })
      : <Typography variant="caption" gutterBottom align="center">
        Please start adding items
        </Typography>;

    return (
      <List component="nav">
        {list}
      </List>
    );
  }

  /** 
   * Renders the component.
   */
  return (
    renderSelectedItems()
  );
};

interface SelectedItemsListProps {
  state: StorageCalculatorState;
  dispatch: React.Dispatch<StorageCalculatorAction>;
};

// ============================================================================
// Export Default
// ============================================================================

export default SelectedItemsList;

