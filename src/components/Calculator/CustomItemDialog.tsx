import React, { useState } from 'react';
import {
  Button,
  TextField,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Grid,
  Typography,
  Checkbox,
  FormControlLabel,
} from '@material-ui/core';

// Types
import {
  CalculatorCustomItemInput,
} from '../../types';


const CustomItemDialog = ({
  open,
  handleAddCustomItem,
  handleClose,
}: CustomItemDialogProps) => {
  
  const [state, setState] = useState<CalculatorCustomItemInput>(initialState);

  /**
   * Handles adding items. 
   */
  const handleAddItem = () => {
    handleAddCustomItem(state);
    setState(initialState);
  }

  /**
   * Handles selction of checkbox
   */
  const handleCheckBoxChange = (name: keyof CalculatorCustomItemInput) => (event: React.ChangeEvent<HTMLInputElement>) => {
    setState({ 
      ...state,
      [name]: event.target.checked,
    });
  };

  /**
   * Handles quantity changes in the the dimension inputs.
   */
  const handleQuantityChange = (name: keyof CalculatorCustomItemInput) => (event: React.ChangeEvent<HTMLInputElement>) => {
    setState({
      ...state,
      [name]: event.target.value,
    });
  }

  /**
   * Set the dialog box to the closed state.
   */
  const handleCloseDialog = () => {
    handleClose();
    setState(initialState);
  }

  /**
   * Renders the dialog box.
   */
  return (
    <div>
      <Dialog
        open={open}
        onClose={handleClose}
        aria-labelledby="form-dialog-title"
      >
        <DialogTitle id="form-dialog-title">Add Custom Item</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Please add the dimensions of the custom item.
            <Typography variant="caption" gutterBottom align="center">
              ( Use Tab to move down and Shift + Tab to move up in the form inputs )
            </Typography>
          </DialogContentText>

          <Grid container spacing={3}>
            <Grid item xs={8}>
              <TextField
                onChange={handleQuantityChange('product')}
                autoFocus
                margin="dense"
                id="name"
                label="Name (optional)"
                type="text"
                fullWidth
                value={state.product}
              />
            </Grid>
            <Grid item xs={4}>

            </Grid>
          </Grid>
          <Grid container spacing={3}>
            <Grid item xs={8}>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={state.flippable}
                    onChange={handleCheckBoxChange('flippable')}
                    value="flippable"
                    color="secondary"
                  />
                }
                label="Flippable"
              />

            </Grid>
            <Grid item xs={4}>

            </Grid>
          </Grid>


          <Grid container spacing={3}>
            <Grid item xs={8}>
              <TextField
                onChange={handleQuantityChange('width')}
                margin="dense"
                id="width"
                label="Width (cm)"
                type="number"
                fullWidth
                value={state.width}
                inputProps={{ min: 1 }}
              />
            </Grid>
            <Grid item xs={4}>

            </Grid>
          </Grid>

          <Grid container spacing={3}>
            <Grid item xs={8}>
              <TextField
                onChange={handleQuantityChange('height')}
                margin="dense"
                id="height"
                label="Height (cm)"
                type="number"
                fullWidth
                value={state.height}
                inputProps={{ min: 1 }}
              />
            </Grid>
            <Grid item xs={4}>

            </Grid>
          </Grid>

          <Grid container spacing={3}>
            <Grid item xs={8}>
              <TextField
                onChange={handleQuantityChange('depth')}
                margin="dense"
                id="depth"
                label="Depth (cm)"
                type="number"
                fullWidth
                value={state.depth}
                inputProps={{ min: 1 }}
              />
            </Grid>
            <Grid item xs={4}>

            </Grid>
          </Grid>

          <Grid container spacing={3}>
            <Grid item xs={8}>
              <TextField
                onChange={handleQuantityChange('quantity')}
                margin="dense"
                id="quantity"
                label="Quantity"
                type="number"
                fullWidth
                value={state.quantity}
                inputProps={{ min: 1 }}
              />
            </Grid>
            <Grid item xs={4}>

            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button
            disabled={state.height <= 0 || state.width <= 0 || state.depth <= 0 || state.quantity <= 0}
            variant="contained"
            onClick={handleAddItem}
            color="primary">
            Add
          </Button>
          <Button
            onClick={handleClose}
            color="secondary">
            Cancel
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
}

interface CustomItemDialogProps {
  open: boolean;
  handleAddCustomItem: (item: CalculatorCustomItemInput) => void;
  handleClose: () => void;
};

// ============================================================================
// Helpers
// ============================================================================

const initialState = {
  product: '',
  width: 0,
  height: 0,
  depth: 0,
  quantity: 0,
  flippable: true,
};

// ============================================================================
// Export Default
// ============================================================================

export default CustomItemDialog