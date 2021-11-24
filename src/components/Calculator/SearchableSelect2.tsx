import React, { useState, useEffect } from 'react';

import { connect } from "react-redux";
import PropTypes from 'prop-types';
import classNames from 'classnames';
import Select from 'react-select';
import {
  makeStyles,
  Typography,
  NoSsr,
  TextField,
  Paper,
  Chip,
  MenuItem,
} from '@material-ui/core';
import { useTheme } from '@material-ui/core/styles';
import CancelIcon from '@material-ui/icons/Cancel';
import { emphasize } from '@material-ui/core/styles/colorManipulator';

import {
  StorageCalculatorState,
  CalculatorPredefinedItem,
  CalculatorItemOption,
} from '../../types';

const suggestions = [];

const NoOptionsMessage = (props: any) => {
  return (
    <Typography
      key={"tb-cal-1"}
      color="textSecondary"
      className={props.selectProps.classes.noOptionsMessage}
      {...props.innerProps}
    >
      {props.children}
    </Typography>
  );
}

// const inputComponent = ({ inputRef, ...props }) => {
//   return <div ref={inputRef} {...props} key={'l'} />;
// }

const Control = (props: any) => {
  console.log(props);
  return (
    <TextField
      key={'k'}
      fullWidth
      InputProps={{
        // inputComponent,
        inputProps: {
          className: props.selectProps.classes.input,
          inputRef: props.innerRef,
          children: props.children,
          ...props.innerProps,
        },
      }}
      {...props.selectProps.textFieldProps}
    />
  );
}

const Option = (props: any) => {
  return (
    <MenuItem
      key={props.data.id}
      buttonRef={props.innerRef}
      selected={props.isFocused}
      component="div"
      style={{
        fontWeight: props.isSelected ? 500 : 400,
      }}
      {...props.innerProps}
    >
      {props.children}
    </MenuItem>
  );
}

const Placeholder = (props: any) => {
  return (
    <Typography
      key={'s'}
      color="textSecondary"
      className={props.selectProps.classes.placeholder}
      {...props.innerProps}
    >
      {props.children}
    </Typography>
  );
}

const SingleValue = (props: any) => {
  return (
    <Typography className={props.selectProps.classes.singleValue} {...props.innerProps} key={props.data.id}>
      {props.children}
    </Typography>
  );
}

const ValueContainer = (props: any) => {
  return (
    <div className={props.selectProps.classes.valueContainer} key="tb123">{props.children}</div>
  );
}

const MultiValue = (props: any) => {
  return (
    <Chip
      key={props.data.id}
      tabIndex={-1}
      label={props.children}
      className={classNames(props.selectProps.classes.chip, {
        [props.selectProps.classes.chipFocused]: props.isFocused,
      })}
      // onDelete={handleDelete(props.data.id)}
      deleteIcon={<CancelIcon {...props.removeProps} />}
    />
  );
}

const Menu = (props: any) => {
  return (
    <Paper square className={props.selectProps.classes.paper} {...props.innerProps} key={'w'}>
      {props.children}
    </Paper>
  );
};

// const handleDelete = () => {

// }

const components = {
  Control,
  Menu,
  MultiValue,
  NoOptionsMessage,
  Option,
  Placeholder,
  SingleValue,
  ValueContainer,
};

const SearchableSelect2 = ({
  state,
  suggestions,
  handlePredefinedItemSelection,
}: SearchableSelect2Props) => {
  
  const classes = useStyles();
  const theme = useTheme();

  const [multi, setMulti] = useState<CalculatorItemOption[]>([]);

  const suggestionsFiltered = suggestions.map(item => {
    return { label: item.product, value: item.id };
  });

  useEffect(() => {
    // Check whether there has been a deletetion, if so modify the 'selectedItem' array
    const deletedItems = state.selectedItemObjects.filter((item) => {
      return state.selectedItemObjects.indexOf(item) === -1;
    });
    const currentStateInputValues = multi && multi.length ? [...multi] : [];
    // The objects in the 'deletedItems' array should be removed from the 'selectedItem' array
    if (currentStateInputValues.length) {
      deletedItems.map(item => {
        const index = currentStateInputValues.findIndex(stateItem => {
          return stateItem.value === item.id;
        });
        if (index !== -1) {
          // remove the deleted item 
          currentStateInputValues.splice(index, 1);
          setMulti(currentStateInputValues);
        }
        return true;

      });
    }
  }, [state.selectedItemObjects]);

  const handleMultiChange = (value: any)  => {
    setMulti(value);
    if (value && value.length) {
      handlePredefinedItemSelection(value);
    } else {
      handlePredefinedItemSelection([]);
    }
  };

  return (
    <div className={classes.root} key="tb-cal-select-1">
      <NoSsr key="tb-cal-select-2">
      <Select
        key="tb-cal-select-3"
        name="colors"
        options={suggestionsFiltered}
        value={multi}
        onChange={handleMultiChange}
        placeholder='Start typing to select...'
        isMulti
        className="basic-multi-select"
        classNamePrefix="select"
      />
        {/* <Select
          key="tb-cal-select-3"
          // classes={classes}
          styles={{
            input: base => ({
              ...base,
              color: theme.palette.text.primary,
              '& input': {
                font: 'inherit',
              },
            }),
          }}
          // textFieldProps={{
          //   label: '',

          // }}
          options={suggestionsFiltered}
          components={components}
          value={multi}
          onChange={handleMultiChange}
          placeholder='Start typing to select...'
          isMulti
        /> */}
      </NoSsr>
    </div>
  );
};

interface SearchableSelect2Props {
  state: StorageCalculatorState;
  suggestions: CalculatorPredefinedItem[];
  handlePredefinedItemSelection: (selected: CalculatorItemOption[]) => void;
};

// ============================================================================
// Styles
// ============================================================================

const useStyles = makeStyles((theme) => ({
  root: {
    flexGrow: 1,
    height: 'auto',
    paddingTop: 20
  },
  input: {
    display: 'flex',
    padding: 0,
  },
  valueContainer: {
    display: 'flex',
    flexWrap: 'wrap',
    flex: 1,
    alignItems: 'center',
  },
  chip: {
    margin: `${theme.spacing(0.5)}px ${theme.spacing(0.25)}px`,
  },
  chipFocused: {
    backgroundColor: emphasize(
      theme.palette.type === 'light' ? theme.palette.grey[300] : theme.palette.grey[700],
      0.08,
    ),
  },
  noOptionsMessage: {
    padding: `${theme.spacing(1)}px ${theme.spacing(2)}px`,
  },
  singleValue: {
    fontSize: 16,
  },
  placeholder: {
    position: 'absolute',
    left: 2,
    fontSize: 16,
  },
  paper: {
    position: 'absolute',
    zIndex: 1,
    marginTop: theme.spacing(1),
    left: 0,
    right: 0,
  },
  divider: {
    height: theme.spacing(2),
  },
}));

// ============================================================================
// Export Default
// ============================================================================

export default SearchableSelect2;
