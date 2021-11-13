import React, { useState,useEffect } from "react";
import { TextField, IconButton, makeStyles } from "@material-ui/core";
import CircularProgress from "@material-ui/core/CircularProgress";
import EditIcon from "@material-ui/icons/Edit";
import SaveIcon from "@material-ui/icons/Save";
import { City } from '../../types';


const CityNotes = ({
  notes,
  city,
}: CityNotesProps) => {

  const classes = useStyles();
  const [state, setState] = useState<{
    notes: string;
    editMode: boolean;
    loading: boolean;
  }>({
    notes: notes,
    editMode: false,
    loading: false,
  });

  useEffect(() => {
    console.log(state);
    if (!state.editMode) {
      setState({
        ...state,
        notes: notes,
      });
    }
  }, [state.editMode]);

  const triggerMode = () => {
    setState({
      ...state,
      editMode: !state.editMode,
    });
  }

  const onButtonTriggered = () => {
    if (state.editMode) {
      // if editMode is true, then the button clicked is the "SAVE" button
      saveNotes();
    } else {
      // trigger local edit mode
      triggerMode();
    }
  }

  const saveNotes = () => {
    // set loading to true and set edit mode to false
    setState({
      ...state,
      loading: true,
    });
    triggerMode();

    // PUT the updated data to DynamoDB through AWS Gateway
    const vars = {
      city: city,
      notes: state.notes,
    };
    const httpOptions = {
      method: "PUT",
      body: JSON.stringify(vars),
    };
    fetch(
      "https://alfxkn3ccg.execute-api.ap-southeast-2.amazonaws.com/prod/citynotes",
      httpOptions
    )
      .then((data) => data.json())
      .then((data) => {
        // set loading to false by entering
        setState({
          ...state,
          loading: false,
        });
      })
      .catch((err) => {
        console.log(err);
        // set loading to false
        setState({
          ...state,
          loading: false,
        });
        // set notes back to its original value
        setState({
          ...state,
          notes: notes,
        });
        alert("Notes update failed");
      });
  }

  return (
    <div style={{ height: "130px" }}>
      {state.loading ? (
        <CircularProgress className={classes.progress} />
      ) : (
        <TextField
          variant={state.editMode ? "outlined" : "filled"}
          fullWidth
          multiline
          rows={5}
          disabled={!state.editMode}
          value={state.notes}
          onChange={(ev) => {
            setState({
              ...state,
              notes: ev.target.value,
            });
          }}
          style={{
            backgroundColor: "#F4A460",
          }}
          InputProps={{
            classes: {
              disabled: classes.notesInputTextDisabled,
            },
            endAdornment: (
              <IconButton
                style={{ bottom: 3, right: 3 }}
                onClick={onButtonTriggered}
              >
                {state.editMode ? <SaveIcon /> : <EditIcon />}
              </IconButton>
            ),
          }}
        />
      )}
    </div>
  );
}

interface CityNotesProps {
  notes: string;
  city: City;
}

const useStyles = makeStyles(theme => ({
  notesInput: {
    color: "red",
  },
  notesInputTextDisabled: {
    color: "black",
    fontSize: "18px",
  },
  progress: {
    margin: theme.spacing(2),
  },
}));

export default CityNotes;
