import React, { useState } from 'react';
import { 
  makeStyles,
  TextField,
  IconButton,
  ExpansionPanel,
  AccordionDetails,
  ExpansionPanelSummary,
  Typography
} from '@material-ui/core';

// Icons
import DeleteIcon from '@material-ui/icons/Delete';
import ExpandMoreIcon from '@material-ui/icons/ExpandMore';

import {
  StorageCalculatorState,
  CalculatorItem,
} from '../../types';

/**
 * Renders a list item for the selected object.
 */
const CustomListItem = ({
  key,
  item,
  itemDimensions,
  handleQuantityChange,
  handleDeleteItem,
  handleChange,
  expanded,
}: CustomListItemProps) => {

  console.log(expanded);
  console.log(item);

  const classes =  useStyles();

  /** 
   * Generates a random number.
   */
  const generateRandomNumber = () => {
    const min = 10000;
    const max = 11000;
    return Math.floor(min + Math.random() * (max - min));
  }

  /**
   * Renders the component.
   */
  return (

    <ExpansionPanel
      expanded={expanded === item.id}
      onChange={(event) => handleChange(item.id)}>
      <ExpansionPanelSummary expandIcon={<ExpandMoreIcon />} tabIndex={4}>

        <Typography className={classes.heading}>{item.product}</Typography>
        <Typography className={classes.secondaryHeading}>{'Dimensions: ' + itemDimensions}</Typography>
        &nbsp;
        <Typography className={classes.secondaryHeading2}>
          <strong>{'Quantity: ' + (item.quantity ? item.quantity : 0)}</strong>
        </Typography>

      </ExpansionPanelSummary>
      <AccordionDetails>
        <TextField
          key={"selectedItem" + item.id}
          label="Quantity"
          value={item.quantity}
          onChange={(event) => handleQuantityChange(item, event)}
          type="number"
          className={classes.textField}
          margin="normal"
          InputLabelProps={{
            shrink: true,
          }}
          inputProps={{ min: 1 }}
        />
        <IconButton
          aria-label="Delete"
          className={classes.button}
          key={item.id + generateRandomNumber()}
          onClick={() => handleDeleteItem(item)}>
          <DeleteIcon />
        </IconButton>
      </AccordionDetails>
    </ExpansionPanel>
  );
};

interface CustomListItemProps {
  key: string;
  item: CalculatorItem;
  itemDimensions: string;
  handleQuantityChange: (item: CalculatorItem, event: React.ChangeEvent<HTMLTextAreaElement | HTMLInputElement>) => void;
  handleDeleteItem: (item: CalculatorItem) => void;
  handleChange: (panel: string) => void;
  expanded?: string;
};

// ============================================================================
// Styles
// ============================================================================

const useStyles = makeStyles((theme) => ({
  root: {
    width: '100%',
  },
  heading: {
    fontSize: theme.typography.pxToRem(15),
    flexBasis: '33.33%',
    flexShrink: 0,
  },
  secondaryHeading: {
    fontSize: theme.typography.pxToRem(15),
    color: theme.palette.text.secondary,
  },
  secondaryHeading2: {
    fontSize: theme.typography.pxToRem(15),
    color: theme.palette.secondary.main,
  },
  chip: {
    margin: theme.spacing(1),
  },
  textField: {
    marginLeft: theme.spacing(1),
    marginRight: theme.spacing(1),
    width: 200,
  },
  button: {
    margin: theme.spacing(1),
  },
}));

// ============================================================================
// Export Default
// ============================================================================

export default CustomListItem;