import React, { useState, useReducer, useEffect } from 'react';
import axios from 'axios';
import { 
  makeStyles,
  Typography,
  Grid,
  Divider,
  InputLabel,
  FormControl,
  Button,
  CircularProgress,
  Snackbar,
  IconButton,
} from '@material-ui/core';

// Icons
import AddIcon from '@material-ui/icons/AddCircle';
import CalculateButton from '@material-ui/icons/OfflineBolt';
import CopyIcon from '@material-ui/icons/FileCopy';

// Other components
import CustomItemDialog from './CustomItemDialog';
// import SearchableSelect2 from './SearchableSelect2';
// import SelectedItemsList from './SelectedItemsList';
// import ResultsContainer from './ResultsContainer';

// Types
import {
  CalculatorPredefinedItem,
  CalculatorItem,
  CalculatorCustomItem,
  CalculatorCustomItemInput,
  StorageCalculatorState,
  CalculatorItemOption,
} from '../../types';

import {
  storageCalculatorReducer,
} from './reducer';

import prepareObjectForCalculation from './prepareObjectForCalculation';
import copy from 'copy-to-clipboard';

const API_URL = 'https://0gvhj0sl8b.execute-api.ap-southeast-2.amazonaws.com/prod/';

let keysPressed: Record<string, boolean> = {};

/**
 * Component handling the calculation interface and it's functionality.
 */
const Calculator = () => {

  const classes = useStyles();

  // Set the initial state
  const [showDialog, setShowDialog] = useState<boolean>(false);
  const [success, setSuccess] = useState<boolean>(false);
  const [openSnackbar, setOpenSnackbar] = useState<boolean>(false);
  const [vertical, setVertical] = useState<"bottom" | "top">("top");
  const [horizontal, setHorizontal] = useState<"left" | "right" | "center">("right");
  const [preDefinedItems, setPreDefinedItems] = useState<CalculatorPredefinedItem[]>([]);
  const [state, dispatch] = useReducer(storageCalculatorReducer, storageCalculatorInitialState);

  /** 
   * Set the custom item dialog state to Opened.
   */
  const handleDialogClickOpen = () => {
    setShowDialog(true);
  };

  /** 
   * Set the custom item dialog state to Closed.
   */
  const handleDialogClose = () => {
    setShowDialog(false);
    // Reset the key listeners
    keysPressed = {};
  };

  /**
   * Finds an item by ID from the predefined items list.
   */
  const getItemById = (id: string) => {
    return preDefinedItems.filter((item) => {
      return item.id === id;
    })[0];
  }

  /**
   * Handles the Alt + C press handling to open the custom item adding dialog box.
   */
  const altCClickFunction = (event: KeyboardEvent): any => {
    // Set the array if Alt key (18) or C key (67)
    if (event.key === 'alt' || event.key === 'c') {
      keysPressed[event.key] = true;
    }
    // Close the dialog if the Esc key is pressed
    if (event.key === 'esc') {
      handleDialogClose();
    }
  }

  /**
   * Opens the custom item adding dialog if both Alt and C keys are pressed.
   */
  const showPopUpOnKeyPress = () => {
    if (keysPressed['c'] && keysPressed['alt']) {
      handleDialogClickOpen();
    }
  }

  /**
   * Adds the selected item into the selected items list.
   */
  // handlePredefinedItemSelection = name => {
  //   const selectedItem = this.getItemById(name.split('#')[1]);
  //   this.props.addPredefinedItem(selectedItem);
  // }
  const handlePredefinedItemSelection = (itemsArray: CalculatorItemOption[]) => {
    let currentItems: CalculatorPredefinedItem[] = [];
    if (itemsArray.length) {
      currentItems = itemsArray.map(item => {
        return getItemById(item.value);
      });
    }
    dispatch({
      type: 'UPDATE_PREDEFINED_ITEMS',
      items: currentItems,
    });
  };

  /**
   * Calls the API for calculation with selected items and quantities.
   */
  const handleCalculationRequest = () => {
    // Set the global state before sending for calculation.
    dispatch({
      type: 'SEND_FOR_CALCULATION',
    });

    // Call the API and send data for calculation.
    prepareObjectForCalculation(state.selectedItemObjects)
      .then(preparedDataForCalculation => {
        if (preparedDataForCalculation) {
          axios.post(API_URL, preparedDataForCalculation).then(res => {
            dispatch({
              type: 'CALCULATION_RESPONSE_RECEIVED',
              payload: res,
            })
          }).catch(err => {
            console.log(err);
          });
        }
      });
  }

  /**
   * Handles adding a custom item.
   */
  const handleAddItem = (item: CalculatorCustomItemInput) => {
    const randomNo = generateRandomNumber();
    const selectedItem: CalculatorCustomItem = {
      id: 'CUSTOMITEM#' + randomNo,
      depth: item.depth,
      height: item.height,
      width: item.width,
      predefined: false,
      flippable: item.flippable,
      product: item.product ? item.product : 'Custom Item',
      quantity: item.quantity,
      restriction: item.flippable ? 'Can be flipped' : undefined,
    };
    handleDialogClose();
    dispatch({
      type: 'ADD_CUSTOM_ITEM',
      item: selectedItem,
    });
  }

  /**
   * Generates a random number.
   */
  const generateRandomNumber = () => {
    const min = 10000;
    const max = 11000;
    return Math.floor(min + Math.random() * (max - min));
  }

  /**
   * Validates data before submitting for calculation.
   */
  const checkDataReadyForCalculation = () => {
    if (state.selectedItemObjects.length > 0) {
      // Check whether all the required parameters are set is set for each object.
      const incompleteObjects = state.selectedItemObjects.filter(item => {
        return item.quantity === 0 || item.quantity === undefined || !item.quantity;
      })
      return incompleteObjects.length === 0;
    }
  }

  /**
   * Copies the calculated items list to the clipboard
   */
  const copySelectedItems = () => {
    let itemsToCopy = '';

    // Prepare the string
    for (let selectedItem of state.selectedItemObjects) {
      const itemDimensions = selectedItem.width + ' cm(W) x ' + selectedItem.height + ' cm(H) x ' + selectedItem.depth + ' cm(D)';
      itemsToCopy += selectedItem.quantity + ' x ' + selectedItem.product + ' | Dimensions: ' + itemDimensions + ' \n';
    }

    if (copy(itemsToCopy)) {
      // Show the notification
      setOpenSnackbar(true);
    };

    // Close the snackbar after 2 seconds
    setTimeout(
      () => { handleCloseSnackbar() },
      2000
    );
  }

  /**
   * Handles closing of snackbar
   */
  const handleCloseSnackbar = () => {
    setOpenSnackbar(false);
  }

  /** 
   * Load the items from the database using the API endpint as soon as the component is mounted.
   */
   useEffect(() => {
    // Get items list from the API endpoint
    axios.get(API_URL + 'items').then(res => {
      let modifiedItems: CalculatorPredefinedItem[] = [];
      if (res.data.length > 0) {
        // add the quantity parameter
        modifiedItems = res.data.map((item: CalculatorPredefinedItem) => {
          return { ...item, quantity: undefined, predefined: true };
        })
      }
      // Add the loaded items to the state
      setPreDefinedItems(modifiedItems);
    });
    // Setup listeners for Alt + C keyup, tab and key down functionality
    document.addEventListener("keydown", altCClickFunction, false);
    document.addEventListener("keyup", showPopUpOnKeyPress, false);
  }, []);

  /**
   * Renders the component.
   */
  return (
    <div className={classes.root}>
      <Typography variant="h4">Storage Calculator</Typography><br />
      <Divider />
      {preDefinedItems.length > 0 ?
        <div>
          <Grid container spacing={8}>
            <Grid item xs={12} sm={7}>
              <br />
              <Typography variant="subtitle1" >Add items</Typography>
              <Grid container spacing={0}>
                <Grid item xs={12} sm={6}>
                  <FormControl className={classes.formControl}>
                    <InputLabel className={classes.itemSearchTitle}>Pre-defined Items</InputLabel>
                    {/* <SearchableSelect2
                      suggestions={preDefinedItems}
                      tabIndex={0}
                      className={classes.searchableSelect}
                      handlePredefinedItemSelection={(selected: CalculatorItemOption[]) => handlePredefinedItemSelection(selected)}
                    /> */}
                  </FormControl>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Button
                    tabIndex={3}
                    variant="contained"
                    color="secondary"
                    className={classes.button}
                    onClick={handleDialogClickOpen}
                  >
                    Add Custom Item
                    <AddIcon className={classes.rightIcon}>send</AddIcon>
                  </Button>
                  <br />
                  <Typography variant="caption" gutterBottom align="center">
                    ALT + C
              </Typography>
                </Grid>
              </Grid>
              <Grid container spacing={0} className={classes.selectedItemsContainer}>
                <Grid item xs={12} sm={12}>
                  {/* <SelectedItemsList classes={classes} /> */}
                </Grid>
              </Grid>

            </Grid>

            <Grid item xs={12} sm={5}>
              <div className={classes.wrapper}>
                <Button
                  variant="contained"
                  color="primary"
                  className={classes.calculateBtn}
                  disabled={!checkDataReadyForCalculation() || state.sentForCalculation}
                  onClick={handleCalculationRequest}>
                  Calculate
                  <CalculateButton className={classes.rightIcon}></CalculateButton>
                </Button>
                {state.sentForCalculation && <CircularProgress size={24} className={classes.buttonProgress} thickness={5} />}
              </div>
              {
                state.selectedItemObjects.length > 0 && state.calculationData.cubeiq ?
                  <div>
                    <IconButton
                      className={classes.button}
                      aria-label="Copy"
                      onClick={copySelectedItems}>
                      <CopyIcon />
                    </IconButton>
                    {/* <ResultsContainer results={state.calculationData} /> */}
                  </div>
                  : false
              }
              <div>

              </div>

            </Grid>

          </Grid>
          <CustomItemDialog
            open={showDialog}
            handleAddCustomItem={(item) => handleAddItem(item)}
            handleClose={handleDialogClose} 
          />
          <Snackbar
            anchorOrigin={{ vertical, horizontal }}
            open={openSnackbar}
            onClose={handleCloseSnackbar}
            ContentProps={{
              'aria-describedby': 'message-id',
            }}
            message={<span id="message-id">Items copied!</span>}
          />
        </div>
        : <CircularProgress />
      }
    </div >
  );
}

// ============================================================================
// Helpers
// ============================================================================

const storageCalculatorInitialState = {
  calculationData: undefined,
  lastAddedItem: undefined,
  selectedItemObjects: [],
  sentForCalculation: false,
};

// ============================================================================
// Styles
// ============================================================================

const useStyles = makeStyles((theme) => ({
  root: {
    flexGrow: 1,
  },
  wrapper: {
    margin: theme.spacing(1),
    position: 'relative',
  },
  formControl: {
    margin: theme.spacing(1),
    width: 300
  },
  button: {
    margin: theme.spacing(1),
  },
  calculateBtn: {
    marginTop: 45
  },
  leftIcon: {
    marginRight: theme.spacing(1),
  },
  rightIcon: {
    marginLeft: theme.spacing(1),
  },
  iconSmall: {
    fontSize: 20,
  },
  textField: {
    marginLeft: theme.spacing(1),
    marginRight: theme.spacing(1),
    width: 200,
  },
  card: {
    marginTop: 20
  },
  itemSearchTitle: {
    marginTop: -20,
    fontSize: 12
  },
  searchableSelect: {
    paddingTop: 20
  },
  buttonProgress: {
    color: theme.palette.secondary.main,
    position: 'absolute',
    top: '50%',
    left: '50%',
    marginTop: 10,
    marginLeft: -12,
  },
  selectedItemsContainer: {
    paddingTop: 30
  }
}));

// ============================================================================
// Export Default
// ============================================================================

export default Calculator;