import React from 'react';
import { connect } from "react-redux";
import PropTypes from 'prop-types';
import deburr from 'lodash/deburr';
import keycode from 'keycode';
import Downshift from 'downshift';
import { withStyles } from '@material-ui/core/styles';
import TextField from '@material-ui/core/TextField';
import Paper from '@material-ui/core/Paper';
import MenuItem from '@material-ui/core/MenuItem';
import Chip from '@material-ui/core/Chip';
import { removeItem } from "../../redux/actions";

let suggestions = [];
let focused = true;

/**
 * Renders the inout to type the search term.
 * 
 * @param {*} inputProps 
 */
function renderInput(inputProps) {
  const { InputProps, classes, ref, ...other } = inputProps;

  return (
    <TextField
      autoFocus
      inputRef={focusUsernameInputField}
      InputProps={{
        inputRef: ref,
        classes: {
          root: classes.inputRoot,
          input: classes.inputInput,
        },
        ...InputProps,
      }}
      {...other}
    />
  );
}

const focusUsernameInputField = (input) => {
  if (input && focused) {
    input.focused();
  }
}

/**
 * Renders the suggestions according to the added search text. 
 * 
 * @param {*} param0 
 */
function renderSuggestion({ suggestion, index, itemProps, highlightedIndex, selectedItem }) {
  // set the first suggestion as highlighted
  //highlightedIndex = highlightedIndex ? highlightedIndex : 0;

  //console.log(suggestion);
  const isHighlighted = highlightedIndex === index;
  //console.log(isHighlighted);
  const isSelected = (selectedItem || '').indexOf(suggestion.label) > -1;
  //console.log(isHighlighted, index);
  return (
    <MenuItem
      {...itemProps}
      key={suggestion.id}
      selected={isHighlighted}
      component="div"
      style={{
        fontWeight: isSelected ? 500 : 400,
      }}
      value={suggestion.id}
    >
      {suggestion.label}
    </MenuItem>
  );
}

renderSuggestion.propTypes = {
  highlightedIndex: PropTypes.number,
  index: PropTypes.number,
  itemProps: PropTypes.object,
  selectedItem: PropTypes.string,
  suggestion: PropTypes.shape({ label: PropTypes.string }).isRequired,
};

/**
 * Handles search value typing.
 * 
 * @param {*} value 
 */
function getSuggestions(value) {
  const inputValue = deburr(value.trim()).toLowerCase();
  const inputLength = inputValue.length;
  let count = 0;

  return inputLength === 0
    ? []
    : suggestions.filter(suggestion => {
      const keep =
        //count < 5 && suggestion.label.slice(0, inputLength).toLowerCase() === inputValue;
        count < 5 && suggestion.label.toLowerCase().includes(inputValue);

      if (keep) {
        count += 1;
      }

      return keep;
    });
}

/**
 * Handles the selection of the item from the suggestions.
 */
class DownshiftMultiple extends React.Component {
  constructor(props) {
    super(props);
    suggestions = props.suggestions.map(item => {
      return { label: item.product, id: item.id };
    })
  }
  state = {
    inputValue: '',
    selectedItem: [],
  };

  /**
   * Added logic to synchronize object deletion.
   * 
   * @param {*} prevProps 
   * @param {*} prevState 
   * @param {*} snapshot 
   */
  componentDidUpdate(prevProps, prevState, snapshot) {
    console.log(prevProps, prevState);
    // Check whether a selected item has been deleted without using the delete option of this component.
    // If so it is required to update the 'selectedItem' array
    if (prevProps.selectedItemObjects.length !== this.props.selectedItemObjects.length) {
      const { selectedItem } = this.state;
      // Check whether there has been a deletetion, if so modify the 'selectedItem' array
      const deletedItems = prevProps.selectedItemObjects.filter((item) => {
        return this.props.selectedItemObjects.indexOf(item) === -1;
      });

      let currentStateInputValues = [...selectedItem];
      // The objects in the 'deletedItems' array should be removed from the 'selectedItem' array
      deletedItems.map(item => {
        const index = currentStateInputValues.indexOf(item.product + '#' + item.id);
        if (index !== -1) {
          // remove the deleted item 
          currentStateInputValues.splice(index, 1);
          this.setState({
            selectedItem: currentStateInputValues,
          });
        }
        return true;

      });

    }
  }

  /**
   * Handles key down functionality for selection.
   */
  handleKeyDown = event => {

    const { inputValue, selectedItem } = this.state;
    if (selectedItem.length && !inputValue.length && keycode(event) === 'backspace') {
      this.setState({
        selectedItem: selectedItem.slice(0, selectedItem.length - 1),
      });

      const deletedItem = selectedItem[selectedItem.length - 1];
      const id = deletedItem.split("#")[1];
      const deletedItemObj = this.props.selectedItemObjects.filter(itemObj => {
        return itemObj.id === id;
      })
      // remove the object from the props.SelectedItemObjects
      this.props.removeItem(deletedItemObj[0]);

    }
  };

  /**
   * Handles input change event.
   */
  handleInputChange = event => {
    this.setState({ inputValue: event.target.value });
  };

  /**
   * Sets the selected item in the global state.
   */
  handleChange = item => {
    let { selectedItem } = this.state;

    if (selectedItem.indexOf(item) === -1) {
      selectedItem = [...selectedItem, item];
    }

    this.setState({
      inputValue: '',
      selectedItem,
    });

    // Call the props function.
    this.props.handlePredefinedItemSelection(item);
  };

  /**
   * Handles deletion of the selected item.
   */
  handleDelete = item => () => {
    this.setState(state => {
      const selectedItem = [...state.selectedItem];
      selectedItem.splice(selectedItem.indexOf(item), 1);
      return { selectedItem };
    });

    // Get the object by querying from the suggestions list.
    const selectedItemObject = this.props.suggestions.filter(itemObj => {
      return itemObj.id === item.split('#')[1];
    });
    this.props.removeItem(selectedItemObject[0]);
  };

  /**
   * Renders the component.
   */
  render() {
    const { classes } = this.props;
    const { inputValue, selectedItem } = this.state;

    return (
      <Downshift
        id="downshift-multiple"
        inputValue={inputValue}
        onChange={this.handleChange}
        selectedItem={selectedItem}
      >
        {({
          getInputProps,
          getItemProps,
          isOpen,
          inputValue: inputValue2,
          selectedItem: selectedItem2,
          highlightedIndex,
        }) => (
            <div className={classes.container}>
              {renderInput({
                fullWidth: true,
                classes,
                InputProps: getInputProps({
                  startAdornment: selectedItem.map(item => (
                    <Chip
                      key={item}
                      tabIndex={-1}
                      label={item.split('#')[0]}
                      className={classes.chip}
                      onDelete={this.handleDelete(item)}
                    />
                  )),
                  onChange: this.handleInputChange,
                  onKeyDown: this.handleKeyDown,
                  placeholder: 'Start typing to select...',
                }),
              })}
              {isOpen ? (
                <Paper className={classes.paper} square>
                  {getSuggestions(inputValue2).map((suggestion, index) =>
                    renderSuggestion({
                      suggestion,
                      index,
                      itemProps: getItemProps({ item: suggestion.label + '#' + suggestion.id, }),
                      highlightedIndex,
                      selectedItem: selectedItem2,
                    }),
                  )}
                </Paper>
              ) : null}
            </div>
          )}
      </Downshift>
    );
  }
}

DownshiftMultiple.propTypes = {
  classes: PropTypes.object.isRequired,
};

const styles = theme => ({
  root: {
    flexGrow: 1,
  },
  container: {
    flexGrow: 1,
    position: 'relative',
  },
  paper: {
    position: 'absolute',
    zIndex: 1,
    marginTop: theme.spacing.unit,
    left: 0,
    right: 0,
  },
  chip: {
    margin: `${theme.spacing.unit / 2}px ${theme.spacing.unit / 4}px`,
  },
  inputRoot: {
    flexWrap: 'wrap',
  },
  inputInput: {
    width: 'auto',
    flexGrow: 1,
  },
  divider: {
    height: theme.spacing.unit * 2,
  },
});


function SearchableSelect(props) {
  const { classes } = props;

  return (
    <div className={classes.root}>
      <div className={classes.divider} />
      <DownshiftMultiple
        removeItem={props.removeItem}
        tabPressed={props.tabPressed}
        classes={classes}
        suggestions={props.suggestions}
        selectedItemObjects={props.selectedItemObjects}
        handlePredefinedItemSelection={props.handlePredefinedItemSelection} />
      <div className={classes.divider} />

    </div>
  );
}

SearchableSelect.propTypes = {
  classes: PropTypes.object.isRequired,
};

const mapStateToProps = state => {
  return { selectedItemObjects: state.calculator.selectedItemObjects }
}

export default connect(mapStateToProps, { removeItem })(withStyles(styles)(SearchableSelect));