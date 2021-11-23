import React, { PureComponent } from 'react';
import { withStyles } from '@material-ui/core/styles';
import TextField from '@material-ui/core/TextField';
import DeleteIcon from '@material-ui/icons/Delete';
import IconButton from '@material-ui/core/IconButton';
import ExpansionPanel from '@material-ui/core/ExpansionPanel';
import ExpansionPanelDetails from '@material-ui/core/ExpansionPanelDetails';
import ExpansionPanelSummary from '@material-ui/core/ExpansionPanelSummary';
import Typography from '@material-ui/core/Typography';
import ExpandMoreIcon from '@material-ui/icons/ExpandMore';

// Custom styles
const styles = theme => ({
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
    margin: theme.spacing.unit,
  },
});

/**
 * Renders a list item for the selected object.
 */
class CustomListItem extends PureComponent {
  /** 
   * Generates a random number.
   */
  generateRandomNumber = () => {
    const min = 10000;
    const max = 11000;
    return Math.floor(min + Math.random() * (max - min));
  }

  /**
   * Renders the component.
   */
  render() {
    const { classes, state } = this.props;
    return (

      <ExpansionPanel
        expanded={state.expanded === this.props.item.id}
        onChange={this.props.handleChange(this.props.item.id)}>
        <ExpansionPanelSummary expandIcon={<ExpandMoreIcon />} tabIndex={4}>

          <Typography className={classes.heading}>{this.props.item.product}</Typography>
          <Typography className={classes.secondaryHeading}>{'Dimensions: ' + this.props.itemDimensions}</Typography>
          &nbsp;
          <Typography className={classes.secondaryHeading2}>
            <strong>{'Quantity: ' + (this.props.item.quantity ? this.props.item.quantity : 0)}</strong>
          </Typography>

        </ExpansionPanelSummary>
        <ExpansionPanelDetails>
          <TextField
            key={"selectedItem" + this.props.item.id}
            label="Quantity"
            value={this.props.item.quantity}
            onChange={this.props.handleQuantityChange(this.props.item)}
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
            key={this.props.item.name + this.generateRandomNumber()}
            onClick={() => this.props.handleDeleteItem(this.props.item)}>
            <DeleteIcon />
          </IconButton>
        </ExpansionPanelDetails>
      </ExpansionPanel>

    );
  }
}

export default withStyles(styles)(CustomListItem);