import React, { useState } from "react";
import { makeStyles } from '@material-ui/core';
import { TextField } from '@material-ui/core';
import { 
  PostcodeData,
  PostcodeOption,
  DeliveryZone,
} from '../../types';

const PostcodeAutocomplete = ({
  suggestions,
  label,
  select,
}: PostcodeAutocompleteProps) => {
  const classes = useStyles();
  const [state, setState] = useState<{
    activeSuggestion: number;
    filteredSuggestions: PostcodeOption[];
    showSuggestions: boolean;
    userInput: string;
    zone: DeliveryZone;
  }>({
    activeSuggestion: 0,
    filteredSuggestions: [],
    showSuggestions: false,
    userInput: "",
    zone: 1,
  });

  const onChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const userInput = event.currentTarget.value;
  
    const filteredSuggestions = suggestions.filter(
      suggestion =>
        suggestion.label.toLowerCase().indexOf(userInput.toLowerCase()) > -1
    );
  
    setState({
      activeSuggestion: 0,
      filteredSuggestions,
      showSuggestions: true,
      userInput: event.currentTarget.value,
      zone: undefined,
    });
  };

  const onClick = (event: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
    const selectedSuggestion = suggestions.filter(suggestion => suggestion.value.hint === event.currentTarget.innerText)[0];

    setState({
      ...state,
      activeSuggestion: 0,
      filteredSuggestions: [],
      showSuggestions: false,
      userInput: event.currentTarget.innerText,
    });
    
    select(selectedSuggestion.value);
  };

  const onKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    const { activeSuggestion, filteredSuggestions } = state;
    
    if (event.key === 'Enter') {
      setState({
        ...state,
        activeSuggestion: 0,
        filteredSuggestions: [],
        showSuggestions: false,
        userInput: filteredSuggestions[activeSuggestion].label,
      });
      select(filteredSuggestions[activeSuggestion].value);
    } 
    else if (event.key === 'ArrowUp') {
      if (activeSuggestion === 0) {
        return;
      }
      setState({
        ...state,
        activeSuggestion: activeSuggestion - 1,
      });
    }
    else if (event.key === 'ArrowDown') {
      if (activeSuggestion - 1 === filteredSuggestions.length) {
        return;
      }
      setState({
        ...state,
        activeSuggestion: activeSuggestion + 1,
      });
    }
  };

  const SuggestionsListComponent = () => {
    if (state.showSuggestions && state.userInput) {
      if (state.filteredSuggestions.length) {
        const n = 20;
        const trimmedSuggestions = state.filteredSuggestions.length > n 
          ? state.filteredSuggestions.slice(0,n)
          : state.filteredSuggestions;
        return (
          <ul className={classes.suggestions}>
            {trimmedSuggestions.map((suggestion, index) => {
              let classObj;
    
              // Flag the active suggestion with a class
              if (index === state.activeSuggestion) {
                classObj = classes.suggestionActive;
              }
              return (
                <div 
                  className={`${classObj} ${classes.ttSuggestion}`} 
                  key={suggestion.label}
                  // name={JSON.stringify(suggestion)}
                  onClick={onClick}>
                  {suggestion.label}
                </div>
              );
            })}
          </ul>
        );
      } else {
        return (
          <div className={classes.noSuggestions}>
            <em>No suggestions available.</em>
          </div>
        );
      }
    } else {
      return null;
    }
  }


  
  return (
    <React.Fragment>
      <TextField
        onChange={onChange}
        onKeyDown={onKeyDown}
        value={state.userInput}
        variant="outlined"
        label={label}
        style = {{width: '95%'}}
      />
      <SuggestionsListComponent />
    </React.Fragment>
  );
};

interface PostcodeAutocompleteProps {
  suggestions: PostcodeOption[];
  // selectedPostcode?: PostcodeData;
  label: string;
  select: (newSelection: PostcodeData) => void;
}

// ============================================================================
// Styles
// ============================================================================

const useStyles = makeStyles(theme => ({
  root: {
    marginTop: '30px',
    width: '50%',
    textAlign: 'center',
    display: 'inline-block',
  },
  suggestions: {
    border: '1px solid #999',
    borderTopWidth: 0,
    listStyle: 'none',
    marginTop: 0,
    maxHeight: '143px',
    overflowY: 'auto',
    paddingLeft: 0,
    width: 'calc(300px + 1rem)',
    '& div': {
      '&:hover': {
        color: 'black',
        backgroundColor: 'rgba(0, 0, 0, 0.26)',
        cursor: 'pointer',
        fontWeight: 700,
      }
    }
  },
  suggestionActive: {
    backgroundColor: 'rgba(0, 0, 0, 0.26)',
    cursor: 'pointer',
    fontWeight: 700,
  },
  noSuggestions: {
    color: '#999',
    padding: '0.5rem',
  },
  ttSuggestion: {
    color: 'black',
    fontSize: '16px',
    fontFamily: 'museo-sans',
    padding: '5px 0',
    width: '100%',
  },
  zoneResultContent: {
    backgroundColor: 'black',
    borderRadius: '25px',
    color: 'white',
    fontFamily: '"museo-sans", sans-serif',
    fontSize: '12px',
    textTransform: 'uppercase',
    padding: '9px 15px',
    position: 'relative',
    textAlign: 'center',
    fontWeight: 700,
    marginTop: '20px',
  },
  result: {
    fontSize: 22,
  }
}));

// ============================================================================
// Export Default
// ============================================================================

export default PostcodeAutocomplete;