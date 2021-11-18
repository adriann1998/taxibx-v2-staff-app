import React, { useState } from "react";
import { TextField, IconButton, makeStyles } from "@material-ui/core";
import CircularProgress from "@material-ui/core/CircularProgress";
import EditIcon from "@material-ui/icons/Edit";
import SaveIcon from "@material-ui/icons/Save";
import { City } from '../../types';


const CityNotes = ({
  notes,
  city,
  handleNotesChange,
}: CityNotesProps) => {

  const classes = useStyles();
  const [loading, setLoading] = useState<boolean>(false);
  const [editMode, setEditMode] = useState<boolean>(false);

  const triggerMode = () => {
    setEditMode(!editMode);
  }

  const onButtonTriggered = () => {
    if (editMode) {
      // if editMode is true, then the button clicked is the "SAVE" button
      saveNotes();
    } else {
      // trigger local edit mode
      triggerMode();
    }
  }

  const saveNotes = () => {
    // set loading to true and set edit mode to false
    setLoading(true);
    triggerMode();

    // PUT the updated data to DynamoDB through AWS Gateway
    const vars = {
      city: city,
      notes: notes,
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
        setLoading(false);
      })
      .catch((err) => {
        console.log(err);
        // set loading to false
        setLoading(false);
        alert("Notes update failed");
      });
  }

  return (
    <div style={{ height: "130px" }}>
      {loading ? (
        <CircularProgress className={classes.progress} />
      ) : (
        <TextField
          variant={editMode ? "outlined" : "filled"}
          fullWidth
          multiline
          rows={5}
          disabled={!editMode}
          value={notes}
          onChange={handleNotesChange}
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
                {editMode ? <SaveIcon /> : <EditIcon />}
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
  handleNotesChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
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
