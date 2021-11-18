import React, { useState, useEffect, useRef } from "react";
import {
  makeStyles,
  Grid,
  CircularProgress,
  Tooltip,
  FormControl,
  FormGroup,
  FormControlLabel,
  Checkbox,
  TextField,
  Button,
  Select,
  Input,
  InputLabel,
  InputAdornment,
  Typography,
  Snackbar,
  IconButton,
} from "@material-ui/core";
import DangerIcon from "@material-ui/icons/NotificationsActive";
import TrailerIcon from "@material-ui/icons/Warning";
import WOSIcon from "@material-ui/icons/AccessTime";
import SDPIcon from "@material-ui/icons/LocalShipping";
import ClientsIcon from "@material-ui/icons/Group";
import AddIcon from "@material-ui/icons/Add";
import CloseIcon from "@material-ui/icons/Close";
import DeleteIcon from "@material-ui/icons/DeleteForever";
import SaveIcon from "@material-ui/icons/Save";
import classNames from "classnames";
import IncreaseDecreaseIcon from "@material-ui/icons/Exposure";
import { authContext } from "../../adalConfig";
import axios from "axios";
import moment from "moment";
import cuid from "cuid";
import {
  DateAndTrailerLimitData,
  SiteData,
  SiteID,
  UserModData,
} from '../../types';

export default function DayStatComponent({
  dateAndTrailerLimits,
  day,
  site,
  executeOnce,
  userMods,
  userEditingTruckNorrisData,
  setUserEditingTruckNorrisData,
}: DayStatComponentProps) {

  return (
    <div>
      {site}
    </div>
  );
};

interface DayStatComponentProps {
  dateAndTrailerLimits?: DateAndTrailerLimitData;
  day: SiteData;
  site: SiteID;
  executeOnce: () => void;
  userMods: UserModData[];
  userEditingTruckNorrisData: boolean;
  setUserEditingTruckNorrisData: React.Dispatch<React.SetStateAction<boolean>>;
};
