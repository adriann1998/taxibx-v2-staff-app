import React, { useState, useEffect, useMemo, useRef, useCallback } from "react";
import {
  makeStyles,
  Grid,
  CircularProgress,
  Tooltip,
  FormControlLabel,
  Checkbox,
  TextField,
  Button,
  Select,
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
  DayOfTheWeek,
  SiteData,
  SiteID,
  UserModData,
  UserModValue,
} from '../../types';

const DayStatComponent = ({
  dateAndTrailerLimits,
  day,
  site,
  executeOnce,
  userMods,
  userEditingTruckNorrisData,
  setUserEditingTruckNorrisData,
}: DayStatComponentProps) => {

  const classes = useStyles();

  //@ts-ignore
  const user: string = authContext._user.profile.unique_name;
  //@ts-ignore
  const ip: string = authContext._user.profile.ipaddr;
  
  // Constant variables
  const currentTime = moment().valueOf();
  const clientsCount: number = day.data && day.data.customers && day.data.customers.length ? day.data.customers.length : 0;
  const userSumMoves = (userMods && userMods.values && userMods.values.length)
    ? userMods.values.filter(entry => entry.ttl >= moment().valueOf()).reduce((acc: number, entry: any) => acc + entry.del + entry.rtn, 0)
    : 0;
  const moves = day.data.pickup + day.data.delivery + userSumMoves;
  const initialLimits: {upper: number, lower: number} = 
    (userMods.limits && userMods.limits[0].upper && userMods.limits[0].lower)
      ? {upper: parseInt(userMods.limits[0].upper), lower: parseInt(userMods.limits[0].lower)}
      : (day.limits && day.limits.length)
      ? {upper: day.limits[0][day.dateBroken[0].toLowerCase()].max, lower: day.limits[0][day.dateBroken[0].toLowerCase()].min}
      : {upper: 0, lower: 0}

  const initialState = {
    arrowRef: null,
    movesMessage: userMods.message && userMods.message[0].message ? userMods.message[0].message : "",
    ttl: 10,
    del: 0,
    rtn: 0,
    am: 0,
    pm: 0,
    trl: 0,
    infoMessageForDay: "",
  };

  const [openDialog, setOpenDialog] = useState<boolean>(false);
  const [holidayDescription, setHolidayDescription] = useState<string>("");
  const [holiday, setHoliday] = useState<boolean>(false);
  const [snackbarMessage, setSnackbarMessage] = useState<string>();
  const [editComponent, setEditComponent] = useState<string>("");
  const [color, setColor] = useState<string>("#ffffff");
  const [infoMessage, setInfoMessage] = useState<string>("");
  const [userChangedValues, setUserChangedValues] = useState({
    am: userMods.values ? userMods.values.filter(val => val.ttl > currentTime && val.am > 0).reduce((acc, val) => acc + val.am, 0) : 0,
    pm: userMods.values ? userMods.values.filter(val => val.ttl > currentTime && val.pm > 0).reduce((acc, val) => acc + val.pm, 0) : 0,
    trl: userMods.values ? userMods.values.filter(val => val.ttl > currentTime && val.trl > 0).reduce((acc, val) => acc + val.trl, 0) : 0,
    del: userMods.values ? userMods.values.filter(val => val.ttl > currentTime && val.del > 0).reduce((acc, val) => acc + val.del, 0) : 0,
    rtn: userMods.values ? userMods.values.filter(val => val.ttl > currentTime && val.rtn > 0).reduce((acc, val) => acc + val.rtn, 0) : 0,
    any: userMods.values ? userMods.values.filter(val => val.ttl > currentTime).reduce((acc, val) => acc + (val.rtn + val.del - (val.am + val.pm)), 0) : 0,
  });
  const [showDFWarning, setShowDFWarning] = useState((
    day.limits &&
      day.limits[0][day.dateBroken[0].toLowerCase()].max &&
      day.data &&
      day.data.dfCount &&
      (day.dateBroken[0] === "Fri" || day.dateBroken[0] === "Sat") &&
      day.data.dfCount / day.limits[0][day.dateBroken[0].toLowerCase() as DayOfTheWeek].max > 0.3)
    ? true
    : false
  );
  const [deletingMoveValues, setDeletingMoveValues] = useState<boolean>(false);
  const [activeReservations, setActiveReservations] = useState<UserModValue[]>(
    userMods?.values ? userMods.values.filter((value) => value.ttl >= moment().valueOf() ? true : false) : []
  );
  const [hasUserLockedData, setHasUserLockedData] = useState<boolean>(false);
  const [upperLimit, setUpperLimit] = useState<number>(0);
  const [lowerLimit, setLowerLimit] = useState<number>(0);

  const [changing, setChanging] = useState<{
    holiday: boolean;
    message: boolean;
    limits: boolean;
    moveValues: boolean;
    infoMessage: boolean;
  }>({
    holiday: false,
    message: false,
    limits: false,
    moveValues: false,
    infoMessage: false,
  });
  const [state, setState] = useState<{
    arrowRef: any | null;
    movesMessage: string;
    ttl: number;
    del: number;
    rtn: number;
    am: number;
    pm: number;
    trl: number;
    infoMessageForDay: string;
  }>(initialState);

  const isDayClosed = holiday || holidayDescription !== "";

  /**
   * Apply initial state
   */
  useEffect(() => {
    // Set Holiday
    if (
      userMods &&
      userMods.holiday &&
      userMods.holiday.length &&
      userMods.holiday[0].holiday
    ) {
      setHoliday(true);
      setHolidayDescription(userMods.holiday[0].holidayDescription);
    } else if (
      userMods &&
      userMods.holiday &&
      userMods.holiday.length &&
      !userMods.holiday[0].holiday
    ) {
      setHoliday(false);
      setHolidayDescription("");
    } else if (day.holiday && typeof day.holiday !== 'boolean' && day.holiday.description) {
      setHoliday(true);
      setHolidayDescription(day.holiday.description);
    }
  }, []);

  /**
   * Change hasUserLockedData value whenever activeReservations changes
   */
  useEffect(() => {
    setHasUserLockedData(activeReservations.filter(entry => entry.user === user).length !== 0);
  }, [activeReservations]);

  /**
   * Re-calculate states whenever userMods or day change
   */
  useEffect(() => {
    // only edit if the component is not being edited
    if (editComponent !== "limits") {
      setUpperLimit(initialLimits.upper);
      setLowerLimit(initialLimits.lower);
    };
  }, [userMods, day]);

  /**
   * Change card color whenever the state changes or moves changes
   */
  useEffect(() => {
    let color = "#ffffff"; // more than 2/3 of upper limit and less than lower limit
    // Get the max limit for the day
    if (day && day.dateBroken[0].toLowerCase() !== "sun") {
      // Check whether user edited data exists, if so, consider them as limits

      if (moves <= Math.round((upperLimit * 2) / 3)) {
        // healthy
        color = "#8BC34A";
      };
      if (moves >= lowerLimit && moves < upperLimit) {
        // warning
        color = "#FF9800";
      };
      if (moves >= upperLimit) {
        // danger
        color = "#F44336";
      };
    };
    setColor(color);
  }, [upperLimit, lowerLimit]);

  /**
   * Sets the info message to be displayed in the Moves box
   */
  useEffect(() => {
    let message = "";
    //console.log(this.state.holiday);
    if (holiday) {
      message = holidayDescription;
    } else if (
      day.data &&
      day.data.customMessage &&
      day.data.customMessage !== ""
    ) {
      message = day.data.customMessage.toUpperCase();
    } else if (
      userMods &&
      userMods.holiday &&
      userMods.holiday.length &&
      userMods.holiday[0].holiday
    ) {
      message =
        userMods.holiday[0].holidayDescription !== null ||
        userMods.holiday[0].holidayDescription !== ""
          ? userMods.holiday[0].holidayDescription.toUpperCase()
          : "CLOSED";
    } else if (
      userMods &&
      userMods.message &&
      userMods.message.length &&
      userMods.message[0].message
    ) {
      message =
        (userMods.message[0].message !== null ||
          userMods.message[0].message !== "") &&
        userMods.message[0].message !== "N/A"
          ? userMods.message[0].message.toUpperCase()
          : "";
    };
    setInfoMessage(message);
  }, [holiday, userMods]);

  const hideAdjustmentDialog = useCallback(() => {
    setEditComponent("");
    setOpenDialog(false);
    setUserEditingTruckNorrisData(false);
    setState(initialState);
    setLowerLimit(initialLimits.lower);
    setUpperLimit(initialLimits.upper);
  }, []);

  const handleLimitChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    setState({ 
      ...state,
      [event.target.id]: event.target.value,
    });
  }, []);

  const handleSnackClose = useCallback(() => {
    setSnackbarMessage(undefined);
  }, []);

  const sendDataToApi = (data: any) => {
    // Add user data and time
    data.did = cuid();
    data.ip = ip;
    data.user = user;
    data.time = moment().format("YYYY-MM-DD HH:mm:ss");
    data.date = day.date;
    data.site = site;

    // Retrieve calculation data
    axiosInstance
      .post("/", data)
      .then((response) => {
        //console.log(response);
        data = null;
        setSnackbarMessage("Data saved successfully!");
        setChanging({
          ...changing,
          holiday: false,
          message: false,
          limits: false,
          moveValues: false,
          infoMessage: false,
        })
        setUserEditingTruckNorrisData(false);
        hideAdjustmentDialog();
        // show success message
        setTimeout(() => handleSnackClose(), 1000);
        executeOnce();
      })
      .catch((error) => {
        console.log(error);
      });
  };

  const calculatePercentage = (prop: "time" | "delivery") => {
    const initialPercentageValues ={
      pickup: "0%",
      delivery: "0%",
      am: "0%",
      pm: "0%",
      any: "0%",
    }
    let percentage: {
      pickup: string;
      delivery: string;
      am: string;
      pm: string;
      any: string;
    } = initialPercentageValues;
    let total = 0;
    let calData = { ...day.data };
    const userData = userChangedValues;
    switch (prop) {
      case "delivery":
        // If there are user added data, add them to the values before processing
        if (calData) {
          calData.pickup =
            calData.pickup && calData.pickup > 0
              ? calData.pickup + userData.rtn
              : userData.rtn;
          calData.delivery =
            calData.delivery && calData.delivery > 0
              ? calData.delivery + userData.rtn
              : userData.rtn;
        }
        if (
          calData &&
          calData.pickup &&
          calData.pickup > 0 &&
          calData.delivery &&
          calData.delivery > 0
        ) {
          total = calData.pickup + calData.delivery;
          const pickupPercentage = Math.round((calData.pickup * 100) / total);
          percentage.pickup = pickupPercentage.toString() + "%";
          percentage.delivery = (100 - pickupPercentage).toString() + "%";
        } else {
          if (calData && calData.pickup && calData.pickup > 0) {
            percentage.pickup = "100%";
            percentage.delivery = "0%";
          }
          if (calData && calData.delivery && calData.delivery > 0) {
            percentage.pickup = "0%";
            percentage.delivery = "100%";
          }
        }
        break;
      case "time":
        // If there are user added data, add them to the values before processing
        if (calData) {
          calData.am =
            calData.am && calData.am > 0
              ? calData.am + userData.am
              : userData.am;
          calData.pm =
            calData.pm && calData.pm > 0
              ? calData.pm + userData.pm
              : userData.pm;
          calData.anytime =
            calData.anytime && calData.anytime > 0
              ? calData.anytime + userData.any
              : userData.any;
        }
        // When all data is set
        if (
          calData &&
          calData.am &&
          calData.am > 0 &&
          calData.pm &&
          calData.pm > 0 &&
          calData.anytime &&
          calData.anytime > 0
        ) {
          total = calData.am + calData.pm + calData.anytime;
          const percentageAM = Math.round((calData.am * 100) / total);
          const percentagePM = Math.round((calData.pm * 100) / total);
          percentage.am = percentageAM.toString() + "%";
          percentage.pm = percentagePM.toString() + "%";
          percentage.any =
            (100 - (percentageAM + percentagePM)).toString() + "%";
        }
        // AM & anytime only
        else if (
          calData &&
          calData.am &&
          calData.am > 0 &&
          !calData.pm &&
          calData.anytime &&
          calData.anytime > 0
        ) {
          total = calData.am + calData.anytime;
          const percentageAM = Math.round((calData.am * 100) / total);
          percentage.am = percentageAM.toString() + "%";
          percentage.any = (100 - percentageAM).toString() + "%";
        }
        // anytime & PM only
        else if (
          calData &&
          !calData.am &&
          calData.pm &&
          calData.pm > 0 &&
          calData.anytime &&
          calData.anytime > 0
        ) {
          total = calData.pm + calData.anytime;
          const percentagePM = Math.round((calData.pm * 100) / total);
          percentage.pm = percentagePM.toString() + "%";
          percentage.any = (100 - percentagePM).toString() + "%";
        }
        // AM & PM only
        else if (
          calData &&
          calData.am &&
          calData.am > 0 &&
          calData.pm &&
          calData.pm > 0 &&
          !calData.anytime
        ) {
          total = calData.am + calData.pm;
          const percentageAM = Math.round((calData.am * 100) / total);
          percentage.am = percentageAM.toString() + "%";
          percentage.pm = (100 - percentageAM).toString() + "%";
        } else {
          // only 1
          if (calData && calData.am && calData.am > 0) {
            percentage.am = "100%";
            percentage.pm = "0%";
            percentage.any = "0%";
          }
          if (calData && calData.pm && calData.pm > 0) {
            percentage.am = "0%";
            percentage.pm = "100%";
            percentage.any = "0%";
          }
          if (calData && calData.anytime && calData.anytime > 0) {
            percentage.am = "0%";
            percentage.pm = "0%";
            percentage.any = "100%";
          }
        }
        break;
      default:
        percentage = initialPercentageValues;
    }
    return percentage;
  };

  /**
   * Gets the Zone 3 suburbs list
   */
   const generateZone3n4List = (zone: 3 | 4) => {
    let zoneList = [];
    if (
      day.data &&
      ((zone === 3 && day.data.zone3) || (zone === 4 && day.data.zone4))
    ) {
      let processed: {[key: string]: number} = {};
      if (zone === 3) {
        processed = getZone3n4ProcessedArray(day.data.zone3);
      }
      if (zone === 4) {
        processed = getZone3n4ProcessedArray(day.data.zone4);
      }

      if (Object.keys(processed).length > 0) {
        for (let suburb in processed) {
          zoneList.push(
            <span key={suburb + processed[suburb]}>
              {suburb + ": " + processed[suburb]} <br />
            </span>
          );
        }
      }
    }
    return zoneList;
  };

  return day.dateBroken[0] !== "Sun" ? (
    <div
      className={classes.root}
      style={
        hasUserLockedData ||
        (isDayClosed && day.dateBroken[0].toLowerCase() !== "sun")
          ? {
              flexGrow: 1,
              background: "#808080",
              padding: 10,
              margin: 10,
              borderRadius: 5,
              minHeight: 121,
            }
          : {
              flexGrow: 1,
              background: "#595959",
              padding: 10,
              margin: 10,
              borderRadius: 5,
            }
      }
    >
      <Grid container spacing={GRID_SPACING}>
        {userMods &&
        userMods.infoMsg &&
        userMods.infoMsg.length ? (
          <Tooltip
            placement="top"
            title={
              <React.Fragment>
                <div className={classes.tooltipText2}>
                  {
                    // loop through the info messages and display all of them
                    userMods.infoMsg.map((msg) => {
                      return (
                        <div
                          key={msg.did}
                          className={classes.infoMsgContainer}
                        >
                          {msg.message} -{" "}
                          <span className={classes.userDetails}>
                            By: {msg.user.split("@")[0].toUpperCase()}&nbsp;
                            On:{" "}
                            {moment(msg.time).format("DD/MM/YYYY hh:mm:ss A")}
                          </span>
                        </div>
                      );
                    })
                  }
                </div>
              </React.Fragment>
            }
            classes={{ popper: classes.arrowPopper }}
            PopperProps={{
              popperOptions: {
                modifiers: {
                  arrow: {
                    enabled: Boolean(state.arrowRef),
                    element: state.arrowRef,
                  },
                },
              },
            }}
          >
            <Grid
              item
              xs={12}
              sm={2}
              onClick={() => {
                setUserEditingTruckNorrisData(true);
                setEditComponent("date");
                setOpenDialog(true);
              }}
            >
              <div className={classes.dayComponent}>
                <div className={classes.spacer}></div>
                <span className={classes.day} style={{ color: "#FF9800" }}>
                  {day.dateBroken[0]}
                </span>
                <br />
                <span className={classes.date} style={{ color: "#FF9800" }}>
                  {day.dateBroken[1]}
                </span>
                <br />
                <span className={classes.month} style={{ color: "#FF9800" }}>
                  {day.dateBroken[2]}
                </span>
              </div>
            </Grid>
          </Tooltip>
        ) : (
          <Grid
            item
            xs={4}
            sm={2}
            onClick={() => {
              setUserEditingTruckNorrisData(true);
              setEditComponent("date");
              setOpenDialog(true);
            }}
          >
            <div className={classes.dayComponent}>
              <div className={classes.spacer}></div>
              <span className={classes.day}>{day.dateBroken[0]}</span>
              <br />
              <span className={classes.date}>{day.dateBroken[1]}</span>
              <br />
              <span className={classes.month}>{day.dateBroken[2]}</span>
            </div>
          </Grid>
        )}

        {
          <Grid
            item
            xs={4}
            sm={3}
            onClick={() => {
              setUserEditingTruckNorrisData(true);
              setEditComponent("moves");
              setOpenDialog(true);
            }}
          >
            <Grid
              container
              spacing={0}
              className={classes.dayComponent}
              style={{
                background: color,
                color: color !== "#ffffff" ? "white" : "black",
              }}
            >
              <Grid item xs={12} sm={12}>
                <div
                  style={{
                    fontSize: 10,
                    fontWeight: "bold",
                    color: color !== "#ffffff" ? "white" : "#595959",
                  }}
                >
                  {!isDayClosed &&
                  day.dateBroken[0].toLowerCase() !== "sun"
                    ? infoMessage.toUpperCase()
                    : null}
                </div>
              </Grid>

              <Grid item xs={12} sm={12}>
                <span className={classes.date}>
                  {moves}
                </span>{" "}
                <br />
                <span
                  style={{
                    fontSize: 12,
                    color: color !== "#ffffff" ? "white" : "#595959",
                  }}
                >
                  Moves
                </span>
              </Grid>
            </Grid>
          </Grid>
        }
        {
          <Grid item xs={4} sm={2}>
            <div
              className={classes.dayComponent}
              onClick={() => {
                setUserEditingTruckNorrisData(true);
                setEditComponent("limits");
                setOpenDialog(true);
              }}
            >
              {!isDayClosed &&
              day.dateBroken[0].toLowerCase() !== "sun" ? (
                <div>
                  <div className={classes.lowerText}>Lower</div>
                  <div className={classes.lowerValue}>
                    {userMods &&
                    userMods.limits &&
                    userMods.limits[0].lower &&
                    parseInt(userMods.limits[0].lower) > 0
                      ? userMods.limits[0].lower
                      : day.limits[0][day.dateBroken[0].toLowerCase() as DayOfTheWeek].min}
                  </div>
                  <div className={classes.upperValue}>
                    {userMods &&
                    userMods.limits &&
                    userMods.limits[0].upper &&
                    parseInt(userMods.limits[0].upper) > 0
                      ? userMods.limits[0].upper
                      : day.limits[0][day.dateBroken[0].toLowerCase()].max}
                  </div>
                  <div className={classes.upperText}>Upper</div>
                </div>
              ) : (
                <strong>{infoMessage.toUpperCase()}</strong>
              )}
            </div>
          </Grid>
        }
        {document.body.clientWidth > 375 ? (
          //!this.isDayClosed() ?
          <Grid item xs={12} sm={5}>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={12}>
                <div className={classes.timeSpreadContainer}>
                  <div>
                    {day.data && day.data.am && day.data.am > 0 ? (
                      <Tooltip
                        placement="top"
                        title={
                          <React.Fragment>
                            <span className={classes.tooltipText}>
                              <strong>
                                AM: &nbsp;
                                {day.data && day.data.am && day.data.am > 0
                                  ? day.data.am +  userChangedValues.am
                                  : userChangedValues.am}
                              </strong>
                            </span>
                            <span
                              className={classes.arrowArrow}
                              ref={state.arrowRef}
                            />
                          </React.Fragment>
                        }
                        classes={{ popper: classes.arrowPopper }}
                        PopperProps={{
                          popperOptions: {
                            modifiers: {
                              arrow: {
                                enabled: Boolean(state.arrowRef),
                                element: state.arrowRef,
                              },
                            },
                          },
                        }}
                      >
                        <div
                          className={classes.warning}
                          style={{
                            float: "left",
                            overflow: "hidden",
                            width: calculatePercentage("time").am,
                            borderTopLeftRadius: 3,
                            borderBottomLeftRadius: 3,
                            borderTopRightRadius:
                              calculatePercentage("time").am === "100%"
                                ? 3
                                : 0,
                            borderBottomRightRadius:
                              calculatePercentage("time").am === "100%"
                                ? 3
                                : 0,
                          }}
                        >
                          <div style={{ padding: 5 }}>AM</div>
                        </div>
                      </Tooltip>
                    ) : (
                      null
                    )}
                    {day.data && day.data.anytime && day.data.anytime > 0 ? (
                      <Tooltip
                        placement="top"
                        title={
                          <React.Fragment>
                            <span className={classes.tooltipText}>
                              <strong>
                                ANY:&nbsp;
                                {day.data &&
                                day.data.anytime &&
                                day.data.anytime > 0
                                  ? day.data.anytime + userChangedValues.any
                                  : userChangedValues.any}
                              </strong>
                            </span>
                            <span
                              className={classes.arrowArrow}
                              ref={state.arrowRef}
                            />
                          </React.Fragment>
                        }
                        classes={{ popper: classes.arrowPopper }}
                        PopperProps={{
                          popperOptions: {
                            modifiers: {
                              arrow: {
                                enabled: Boolean(state.arrowRef),
                                element: state.arrowRef,
                              },
                            },
                          },
                        }}
                      >
                        <div
                          className={classes.healthy}
                          style={{
                            float: "left",
                            overflow: "hidden",
                            width: calculatePercentage("time").any,
                            borderTopLeftRadius:
                              calculatePercentage("time").any ===
                                "100%" || !calculatePercentage("time").am
                                ? 3
                                : 0,
                            borderBottomLeftRadius:
                              calculatePercentage("time").any ===
                                "100%" || !calculatePercentage("time").am
                                ? 3
                                : 0,
                            borderTopRightRadius:
                              calculatePercentage("time").any ===
                                "100%" ||
                              calculatePercentage("time").pm === "0%"
                                ? 3
                                : 0,
                            borderBottomRightRadius:
                              calculatePercentage("time").any ===
                                "100%" ||
                              calculatePercentage("time").pm === "0%"
                                ? 3
                                : 0,
                          }}
                        >
                          <div style={{ padding: 5 }}>ANY</div>
                        </div>
                      </Tooltip>
                    ) : (
                      null
                    )}
                    {day.data && day.data.pm && day.data.pm > 0 ? (
                      <Tooltip
                        placement="top"
                        title={
                          <React.Fragment>
                            <span className={classes.tooltipText}>
                              <strong>
                                PM: &nbsp;
                                {day.data && day.data.pm && day.data.pm > 0
                                  ? day.data.pm + userChangedValues.pm
                                  : userChangedValues.pm}
                              </strong>
                            </span>
                            <span
                              className={classes.arrowArrow}
                              ref={state.arrowRef}
                            />
                          </React.Fragment>
                        }
                        classes={{ popper: classes.arrowPopper }}
                        PopperProps={{
                          popperOptions: {
                            modifiers: {
                              arrow: {
                                enabled: Boolean(state.arrowRef),
                                element: state.arrowRef,
                              },
                            },
                          },
                        }}
                      >
                        <div
                          className={classes.warning}
                          style={{
                            float: "left",
                            overflow: "hidden",
                            width: calculatePercentage("time").pm,
                            borderTopRightRadius: 3,
                            borderBottomRightRadius: 3,
                            borderTopLeftRadius:
                              calculatePercentage("time").pm === "100%"
                                ? 3
                                : 0,
                            borderBottomLeftRadius:
                              calculatePercentage("time").pm === "100%"
                                ? 3
                                : 0,
                          }}
                        >
                          <div style={{ padding: 5 }}>PM</div>
                        </div>
                      </Tooltip>
                    ) : (
                      null
                    )}
                  </div>
                </div>
              </Grid>
              <Grid item xs={12} sm={12}>
                <div className={classes.timeSpreadContainer}>
                  <div>
                    {day.data &&
                    day.data.delivery &&
                    day.data.delivery > 0 ? (
                      <Tooltip
                        placement="bottom"
                        title={
                          <React.Fragment>
                            <span className={classes.tooltipText}>
                              <strong>
                                DEL:&nbsp;
                                {day.data &&
                                day.data.delivery &&
                                day.data.delivery > 0
                                  ? day.data.delivery + userChangedValues.del
                                  : userChangedValues.del}
                              </strong>
                            </span>
                            <span
                              className={classes.arrowArrow}
                              ref={state.arrowRef}
                            />
                          </React.Fragment>
                        }
                        classes={{ popper: classes.arrowPopper }}
                        PopperProps={{
                          popperOptions: {
                            modifiers: {
                              arrow: {
                                enabled: Boolean(state.arrowRef),
                                element: state.arrowRef,
                              },
                            },
                          },
                        }}
                      >
                        <div
                          className={classes.healthy}
                          style={{
                            float: "left",
                            //padding: 5,
                            overflow: "hidden",
                            width: calculatePercentage("delivery")
                              .delivery,
                            borderTopLeftRadius: 3,
                            borderBottomLeftRadius: 3,
                            borderTopRightRadius:
                              calculatePercentage("delivery")
                                .delivery === "100%"
                                ? 3
                                : 0,
                            borderBottomRightRadius:
                              calculatePercentage("delivery")
                                .delivery === "100%"
                                ? 3
                                : 0,
                          }}
                        >
                          <div style={{ padding: 5 }}>DEL</div>
                        </div>
                      </Tooltip>
                    ) : (
                      null
                    )}

                    {day.data && day.data.pickup && day.data.pickup > 0 ? (
                      <Tooltip
                        placement="bottom"
                        title={
                          <React.Fragment>
                            <span className={classes.tooltipText}>
                              <strong>
                                RET:&nbsp;
                                {day.data &&
                                day.data.pickup &&
                                day.data.pickup > 0
                                  ? day.data.pickup + userChangedValues.rtn
                                  : userChangedValues.rtn}
                              </strong>
                            </span>
                            <span
                              className={classes.arrowArrow}
                              ref={state.arrowRef}
                            />
                          </React.Fragment>
                        }
                        classes={{ popper: classes.arrowPopper }}
                        PopperProps={{
                          popperOptions: {
                            modifiers: {
                              arrow: {
                                enabled: Boolean(state.arrowRef),
                                element: state.arrowRef,
                              },
                            },
                          },
                        }}
                      >
                        <div
                          className={classes.danger}
                          style={{
                            float: "left",
                            //padding: 5,
                            overflow: "hidden",
                            width: calculatePercentage("delivery")
                              .pickup,
                            borderTopRightRadius: 3,
                            borderBottomRightRadius: 3,
                            borderTopLeftRadius:
                              calculatePercentage("delivery").pickup ===
                              "100%"
                                ? 3
                                : 0,
                            borderBottomLeftRadius:
                              calculatePercentage("delivery").pickup ===
                              "100%"
                                ? 3
                                : 0,
                          }}
                        >
                          <div style={{ padding: 5 }}>RTN</div>
                        </div>
                      </Tooltip>
                    ) : (
                      null
                    )}
                  </div>
                </div>
              </Grid>
              <Grid item xs={12} sm={12} className={classes.metadata}>
                <Grid container spacing={2}>
                  {generateZone3n4List(3).length > 0 ||
                  generateZone3n4List(4).length > 0 ? (
                    <Grid item xs={2} sm={2}>
                      <Tooltip
                        placement="top"
                        title={
                          <React.Fragment>
                            <span className={classes.tooltipText}>
                              {generateZone3n4List(3).length > 0 ? (
                                <React.Fragment>
                                  <div style={{ color: "yellow" }}>
                                    <strong>
                                      <i>Zone 3:</i>
                                    </strong>
                                  </div>
                                  <div>{generateZone3n4List(3)}</div>
                                </React.Fragment>
                              ) : (
                                ""
                              )}
                              {generateZone3n4List(4).length > 0 ? (
                                <React.Fragment>
                                  <br />
                                  <div style={{ color: "yellow" }}>
                                    <strong>
                                      <i>Zone 4:</i>
                                    </strong>
                                  </div>
                                  <div>{generateZone3n4List(4)}</div>
                                </React.Fragment>
                              ) : (
                                ""
                              )}
                            </span>
                            <span
                              className={classes.arrowArrow}
                              ref={state.arrowRef}
                            />
                          </React.Fragment>
                        }
                        classes={{ popper: classes.arrowPopper }}
                        PopperProps={{
                          popperOptions: {
                            modifiers: {
                              arrow: {
                                enabled: Boolean(state.arrowRef),
                                element: state.arrowRef,
                              },
                            },
                          },
                        }}
                      >
                        <DangerIcon className={classes.icon} />
                      </Tooltip>
                    </Grid>
                  ) : (
                    null
                  )}

                  {dateAndTrailerLimits &&
                  day.data &&
                  day.data.trailers &&
                  day.data.trailers > 0 &&
                  day.data.trailers + userChangedValues.trl >=
                    Math.round((dateAndTrailerLimits.trailers * 2) / 3) ? (
                    <Grid item xs={2} sm={2}>
                      <Tooltip
                        placement="top"
                        title={
                          <React.Fragment>
                            <span className={classes.tooltipText}>
                              <strong>Check Trailers</strong>
                            </span>
                            <span
                              className={classes.arrowArrow}
                              ref={state.arrowRef}
                            />
                          </React.Fragment>
                        }
                        classes={{ popper: classes.arrowPopper }}
                        PopperProps={{
                          popperOptions: {
                            modifiers: {
                              arrow: {
                                enabled: Boolean(state.arrowRef),
                                element: state.arrowRef,
                              },
                            },
                          },
                        }}
                      >
                        {day.data.trailers + userChangedValues.trl >=
                        Math.round(
                          (dateAndTrailerLimits.trailers * 2) / 3
                        ) ? (
                          <TrailerIcon
                            style={{
                              color:
                                day.data.trailers + userChangedValues.trl >=
                                dateAndTrailerLimits.trailers
                                  ? "red"
                                  : "white",
                            }}
                            className={classes.icon}
                          />
                        ) : (
                          <span></span>
                        )}
                      </Tooltip>
                    </Grid>
                  ) : (
                    null
                  )}
                  {day.data && day.data.wos && day.data.wos >= 3 ? (
                    <Grid item xs={2} sm={2}>
                      <Tooltip
                        placement="top"
                        title={
                          <React.Fragment>
                            <span className={classes.tooltipText}>
                              <strong>Check WOS</strong>
                            </span>
                            <span
                              className={classes.arrowArrow}
                              ref={state.arrowRef}
                            />
                          </React.Fragment>
                        }
                        classes={{ popper: classes.arrowPopper }}
                        PopperProps={{
                          popperOptions: {
                            modifiers: {
                              arrow: {
                                enabled: Boolean(state.arrowRef),
                                element: state.arrowRef,
                              },
                            },
                          },
                        }}
                      >
                        <WOSIcon className={classes.icon} />
                      </Tooltip>
                    </Grid>
                  ) : (
                    null
                  )}
                  {(day.dateBroken[0] === "Sat" &&
                    day.data &&
                    day.data.sdp &&
                    day.data.sdp >= 2) ||
                  (day.dateBroken[0] !== "Sat" &&
                    day.data &&
                    day.data.sdp &&
                    day.data.sdp >= 3) ? (
                    <Grid item xs={2} sm={2}>
                      <Tooltip
                        placement="top"
                        title={
                          <React.Fragment>
                            <span className={classes.tooltipText}>
                              <strong>Check SDP</strong>
                            </span>
                            <span
                              className={classes.arrowArrow}
                              ref={state.arrowRef}
                            />
                          </React.Fragment>
                        }
                        classes={{ popper: classes.arrowPopper }}
                        PopperProps={{
                          popperOptions: {
                            modifiers: {
                              arrow: {
                                enabled: Boolean(state.arrowRef),
                                element: state.arrowRef,
                              },
                            },
                          },
                        }}
                      >
                        <SDPIcon className={classes.icon} />
                      </Tooltip>
                    </Grid>
                  ) : (
                    null
                  )}
                  {clientsCount > 0 ? (
                    <Grid item xs={2} sm={2}>
                      <Tooltip
                        placement="top"
                        title={
                          <React.Fragment>
                            <span className={classes.tooltipText}>
                              <strong>
                                {clientsCount === 1
                                  ? clientsCount + " Customer"
                                  : clientsCount + " Customers"}
                              </strong>
                            </span>
                            <span
                              className={classes.arrowArrow}
                              ref={state.arrowRef}
                            />
                          </React.Fragment>
                        }
                        classes={{ popper: classes.arrowPopper }}
                        PopperProps={{
                          popperOptions: {
                            modifiers: {
                              arrow: {
                                enabled: Boolean(state.arrowRef),
                                element: state.arrowRef,
                              },
                            },
                          },
                        }}
                      >
                        <ClientsIcon className={classes.icon} />
                      </Tooltip>
                    </Grid>
                  ) : (
                    null
                  )}

                  <Grid item xs={2} sm={2}>
                    {(!openDialog ||
                      editComponent !== "del") &&
                    !isDayClosed &&
                    day.dateBroken[0].toLowerCase() !== "sun" ? (
                      <AddIcon
                        className={classes.icon}
                        onClick={() => {
                          setUserEditingTruckNorrisData(true);
                          setEditComponent("del");
                          setOpenDialog(true);
                          }}
                      />
                    ) : (
                      null
                    )}
                  </Grid>
                  <Grid item xs={2} sm={2}></Grid>
                </Grid>
              </Grid>
              <Grid item xs={12} sm={12} className={classes.dftext}>
                {showDFWarning ? "NO MORE DF" : ""}
              </Grid>
            </Grid>
          </Grid>
        ) : (
          ""
        )}
        {openDialog ? (
          <Grid item xs={12} sm={12} className={classes.adjustmentContainer}>
            <Grid container spacing={2}>
              <Grid item xs={11} sm={11}>
                {editComponent === "del"
                  ? (changing.moveValues ? (
                      <CircularProgress className={classes.progress} />
                    ) : (
                      <div>
                        <br />
                        <Grid container spacing={2} className={classes.adjustmentControls}>
                          <Grid item xs={12} sm={12}>
                            <Grid container spacing={0}>
                              <Grid item xs={4} sm={4}>
                                <div className={classes.delText}>DEL</div>
                              </Grid>
                              <Grid item xs={8} sm={8}>
                                <TextField
                                  type="number"
                                  id="del"
                                  onChange={(event) =>
                                    setState({ 
                                      ...state,
                                      del: parseInt(event.target.value),
                                    })
                                  }
                                  InputProps={{
                                    endAdornment: (
                                      <InputAdornment position="end">
                                        <IncreaseDecreaseIcon />
                                      </InputAdornment>
                                    )
                                  }}
                                />
                              </Grid>
                            </Grid>
                          </Grid>
                          <Grid item xs={12} sm={12}>
                            <Grid container spacing={0}>
                              <Grid item xs={4} sm={4}>
                                <div className={classes.delText}>RTN</div>
                              </Grid>
                              <Grid item xs={8} sm={8}>
                                <TextField
                                  type="number"
                                  id="rtn"
                                  onChange={(event) =>
                                    setState({ 
                                      ...state,
                                      rtn: parseInt(event.target.value),
                                    })
                                  }
                                  InputProps={{
                                    endAdornment: (
                                      <InputAdornment position="end">
                                        <IncreaseDecreaseIcon />
                                      </InputAdornment>
                                    )
                                  }}
                                />
                              </Grid>
                            </Grid>
                          </Grid>
                          <Grid item xs={12} sm={12}>
                            <div
                              style={{
                                maxWidth: 500,
                                marginLeft: 12,
                                marginTop: 12,
                                marginBottom: 8,
                                background: "#ffdd33",
                                height: 2,
                              }}
                            ></div>
                          </Grid>
                          <Grid item xs={12} sm={12}>
                            <Grid container spacing={0}>
                              <Grid item xs={4} sm={4}>
                                <div className={classes.delText}>AM</div>
                              </Grid>
                              <Grid item xs={8} sm={8}>
                                <TextField
                                  type="number"
                                  id="am"
                                  onChange={(event) =>
                                    setState({ 
                                      ...state,
                                      am: parseInt(event.target.value),
                                    })
                                  }
                                  InputProps={{
                                    endAdornment: (
                                    <InputAdornment position="end">
                                      <IncreaseDecreaseIcon />
                                    </InputAdornment>
                                    )
                                  }}
                                />
                              </Grid>
                            </Grid>
                          </Grid>
                          <Grid item xs={12} sm={12}>
                            <Grid container spacing={0}>
                              <Grid item xs={4} sm={4}>
                                <div className={classes.delText}>PM</div>
                              </Grid>
                              <Grid item xs={8} sm={8}>
                                <TextField
                                  type="number"
                                  id="pm"
                                  onChange={(event) =>
                                    setState({ 
                                      ...state,
                                      pm: parseInt(event.target.value),
                                    })
                                  }
                                  InputProps={{
                                    endAdornment: (
                                      <InputAdornment position="end">
                                        <IncreaseDecreaseIcon />
                                      </InputAdornment>
                                    )
                                  }}
                                />
                              </Grid>
                            </Grid>
                          </Grid>
                          <Grid item xs={12} sm={12}>
                            <div
                              style={{
                                maxWidth: 500,
                                marginLeft: 12,
                                marginTop: 12,
                                marginBottom: 8,
                                background: "#ffdd33",
                                height: 2,
                              }}
                            ></div>
                          </Grid>
                
                          <Grid item xs={12} sm={12}>
                            <Grid container spacing={0}>
                              <Grid item xs={4} sm={4}>
                                <div className={classes.delText}>TRL</div>
                              </Grid>
                              <Grid item xs={8} sm={8}>
                                <TextField
                                  type="number"
                                  id="tlr"
                                  onChange={(event) =>
                                    setState({ 
                                      ...state,
                                      trl: parseInt(event.target.value),
                                    })
                                  }
                                  InputProps={{
                                    endAdornment: (
                                      <InputAdornment position="end">
                                        <IncreaseDecreaseIcon />
                                      </InputAdornment>
                                    )
                                  }}
                                />
                              </Grid>
                            </Grid>
                          </Grid>
                        </Grid>
                        <Grid container spacing={GRID_SPACING}>
                          <Grid item xs={6} sm={6}>
                            <div>
                              <InputLabel htmlFor="timeToLive">Lock Time</InputLabel>
                              <Select
                                native
                                value={state.ttl}
                                onChange={(event) => {
                                  setState({ 
                                    ...state,
                                    ttl: parseInt(event.target.value as string),
                                  })
                                }}
                                inputProps={{
                                  name: "age",
                                  id: "timeToLive",
                                }}
                              >
                                <option value="" />
                                <option value={10}>10 Mins</option>
                                <option value={20}>20 Mins</option>
                                <option value={30}>30 Mins</option>
                                <option value={60}>1 Hour</option>
                                <option value={120}>2 Hours</option>
                                <option value={360}>6 Hours</option>
                                <option value={720}>12 Hours</option>
                                <option value={1440}>24 Hours</option>
                              </Select>
                            </div>
                          </Grid>
                          <Grid item xs={2} sm={2}>
                            <Button
                              variant="contained"
                              color="secondary"
                              size="small"
                              disabled={
                                state.am === 0 &&
                                state.pm === 0 &&
                                state.del === 0 &&
                                state.rtn === 0 &&
                                state.trl === 0
                              }
                              className={classes.holidaySaveBtn}
                              onClick={() => {
                                let ttl = 0;
                                switch (state.ttl) {
                                  case 10:
                                    ttl = moment().add(10, "minutes").valueOf();
                                    break;
                                  case 20:
                                    ttl = moment().add(20, "minutes").valueOf();
                                    break;
                                  case 30:
                                    ttl = moment().add(30, "minutes").valueOf();
                                    break;
                                  case 60:
                                    ttl = moment().add(1, "hours").valueOf();
                                    break;
                                  case 120:
                                    ttl = moment().add(2, "hours").valueOf();
                                    break;
                                  case 360:
                                    ttl = moment().add(6, "hours").valueOf();
                                    break;
                                  case 720:
                                    ttl = moment().add(12, "hours").valueOf();
                                    break;
                                  case 1440:
                                    ttl = moment().add(24, "hours").valueOf();
                                    break;
                                  default:
                                    ttl = 0;
                                }
                                const data = {
                                  type: "values",
                                  del: state.del,
                                  rtn: state.rtn,
                                  am: state.am,
                                  pm: state.pm,
                                  trl: state.trl,
                                  ttl: ttl,
                                };
                                setState({
                                  ...state,
                                  ttl: 10,
                                  del: 0,
                                  rtn: 0,
                                  am: 0,
                                  pm: 0,
                                  trl: 0,
                                });
                                setChanging({
                                  ...changing,
                                  moveValues: true,
                                })
                                sendDataToApi(data);
                              }}
                            >
                              <SaveIcon
                                className={classNames(classes.leftIcon, classes.iconSmall)}
                              />
                              Save
                            </Button>
                          </Grid>
                          <Grid item xs={2} sm={2}></Grid>
                        </Grid>
                      </div>
                    ))
                  : null}
                {editComponent === "date"
                  ? (
                    <>
                      {changing.holiday ? (
                        <CircularProgress className={classes.progress} />
                      ) : (
                        <>
                          <h3>Closures</h3>
                          <Grid container spacing={GRID_SPACING}>
                            <Grid item xs={3} sm={3}>
                              <FormControlLabel
                                control={
                                  <Checkbox
                                    checked={holiday}
                                    onChange={(event) => {
                                      if (event.target.checked) {
                                        setHoliday(event.target.checked);
                                      } else {
                                        setHoliday(event.target.checked);
                                        setHolidayDescription("");
                                      };
                                    }}
                                    value="holiday"
                                  />
                                }
                                label="Closed"
                              />
                            </Grid>
                            <Grid item xs={7} sm={7}>
                              <TextField
                                id="hoildayDescription"
                                label="Closed Description"
                                variant="outlined"
                                multiline={true}
                                className={classes.textField}
                                value={holidayDescription}
                                onChange={(event) => setHolidayDescription(event.target.value)}
                                rows={1}
                                rowsMax={10}
                                margin="normal"
                              />
                            </Grid>
                            <Grid item xs={2} sm={2}>
                              <Button
                                variant="contained"
                                color="secondary"
                                size="small"
                                className={classes.holidaySaveBtn}
                                disabled={changing.holiday}
                                onClick={(ev) => {
                                  const data = {
                                    type: "holiday",
                                    holiday: holiday,
                                    holidayDescription: holidayDescription,
                                  };
                                  setChanging({ 
                                    ...changing,
                                    holiday: true,
                                  });
                                  sendDataToApi(data);
                                }}
                              >
                                <SaveIcon
                                  className={classNames(
                                    classes.leftIcon,
                                    classes.iconSmall
                                  )}
                                />
                                Save
                              </Button>
                            </Grid>
                          </Grid>

                          <h3>Messages for the day</h3>
                          <Grid container spacing={GRID_SPACING}>
                            <Grid item xs={10} sm={10}>
                              <TextField
                                id="infoMessage"
                                label="Info Message"
                                className={classes.textField2}
                                value={state.infoMessageForDay}
                                variant="outlined"
                                multiline={true}
                                onChange={(event) => {
                                  setState({
                                    ...state,
                                    infoMessageForDay: event.target.value,
                                  });
                                }}
                                rows={2}
                                disabled={false}
                                rowsMax={10}
                                margin="normal"
                              />
                            </Grid>
                            <Grid item xs={2} sm={2}>
                              <Button
                                variant="contained"
                                color="secondary"
                                size="small"
                                className={classes.holidaySaveBtn}
                                onClick={() => {
                                  const data = {
                                    type: "infoMsg",
                                    message: state.infoMessageForDay,
                                  };
                                  setState({ 
                                    ...state,
                                    infoMessageForDay: "",
                                  });
                                  setChanging({
                                    ...changing,
                                    holiday: true,
                                  })
                                  sendDataToApi(data);
                                }}
                              >
                                <SaveIcon
                                  className={classNames(
                                    classes.leftIcon,
                                    classes.iconSmall
                                  )}
                                />
                                Save
                              </Button>
                            </Grid>
                          </Grid>
                          <div className={classes.yourEntriesTitle}>
                            Your entries for the day
                          </div>
                          <div className={classes.yourEntriesContent}>
                            { userMods && userMods.infoMsg && userMods.infoMsg.length ? (
                                userMods.infoMsg.map((msg) => {
                                  if (msg.user === user) {
                                    return (
                                      <Grid container spacing={2} key={msg.did}>
                                        <Grid item xs={11} sm={11} className={classes.userEntryText}>
                                          {msg.message}
                                          <div className={classes.timeStampOfMsg}>
                                            Added on {moment(msg.time).format("DD/MM/YYYY hh:mm:ss A")}
                                          </div>
                                        </Grid>
                                        <Grid item xs={1} sm={1}>
                                          <a onClick={() => {
                                            setChanging({ 
                                              ...changing,
                                              holiday: true,
                                            });
                                            setUserEditingTruckNorrisData(true);
                                            //this.setState({ deletingMoveValues: true });
                                            const data = {
                                              site: site,
                                              date: day.date,
                                              did: msg.did,
                                            };
                                            // post delete data
                                            axiosInstance
                                              .post("/userinfomsgdelete", data)
                                              .then((response) => {
                                                //console.log(response);
                                                setSnackbarMessage("Info message deleted successfully!");
                                                setUserEditingTruckNorrisData(false);
                                                setChanging({
                                                  ...changing,
                                                  holiday: false,
                                                })
                                                hideAdjustmentDialog();
                                                setTimeout(() => handleSnackClose(), 1000);
                                                executeOnce();
                                              })
                                              .catch((error) => {
                                                console.log(error);
                                              });
                                            }}
                                          >
                                            <DeleteIcon
                                              className={classes.leftIcon}
                                            />
                                          </a>
                                        </Grid>
                                      </Grid>
                                    );
                                  }
                                })
                              ) : null
                            }
                          </div>
                        </>
                      )}
                    </>
                  ) : null}
                {editComponent === "moves"
                  ? (
                    <>
                      {changing.message ? (
                        <CircularProgress className={classes.progress} />
                      ) : (
                        <>
                          <Grid container spacing={GRID_SPACING}>
                            <Grid item xs={10} sm={10}>
                              <TextField
                                id="movesMessage"
                                label="Message"
                                className={classes.textField}
                                value={state.movesMessage}
                                onChange={(event) => {
                                  setState({ 
                                    ...state,
                                    movesMessage: event.target.value,
                                  });
                                }}
                                margin="normal"
                                inputProps={{ maxLength: 15 }}
                                helperText={"15 Characters Max"}
                              />
                            </Grid>
                            <Grid item xs={2} sm={2}>
                              <Button
                                variant="contained"
                                color="secondary"
                                size="small"
                                className={classes.holidaySaveBtn}
                                onClick={() => {
                                  setChanging({ 
                                    ...changing,
                                    message: true,
                                  });
                                  const theNewMessage = state.movesMessage !== "" ? state.movesMessage : "N/A";
                                  const data = {
                                    type: "message",
                                    message: theNewMessage,
                                  };
                                  sendDataToApi(data);
                                }}
                              >
                                <SaveIcon
                                  className={classNames(classes.leftIcon, classes.iconSmall)}
                                />
                                Save
                              </Button>
                            </Grid>
                          </Grid>
                          <Grid
                            container
                            style={{ paddingTop: 20, textAlign: "justify" }}
                            spacing={GRID_SPACING}
                          >
                            <Grid item xs={12} sm={12}>
                              <Typography variant="subtitle1" gutterBottom>
                                Reservations
                              </Typography>
                              <hr />

                              {deletingMoveValues ? (
                                <CircularProgress className={classes.progress} />
                              ) : (
                                userMods &&
                                userMods.values &&
                                userMods.values.length &&
                                activeReservations && 
                                activeReservations.length ? (
                                  activeReservations.map((value) => (
                                    <Grid key={value.user + value.ttl} container spacing={GRID_SPACING}>
                                      <Grid item xs={11} sm={11}>
                                        <div style={{ fontSize: 12 }}>
                                          {value.am > 0 ? (
                                            <strong>AM: {value.am} &nbsp;</strong>
                                          ) : (
                                            false
                                          )}
                                          {value.del > 0 ? (
                                            <strong>DEL: {value.del}&nbsp;</strong>
                                          ) : (
                                            false
                                          )}
                                          {value.pm > 0 ? <strong>PM: {value.pm}&nbsp;</strong> : false}
                                          {value.rtn > 0 ? (
                                            <strong>RTN: {value.rtn}&nbsp;</strong>
                                          ) : (
                                            false
                                          )}
                                          {value.trl > 0 ? (
                                            <strong>TRL: {value.trl} &nbsp;</strong>
                                          ) : (
                                            false
                                          )}
                                          <br />
                                          <span style={{ fontSize: 11 }}>
                                            On: {value.time}&nbsp; By:{" "}
                                            {value.user.split("@")[0].toUpperCase()}&nbsp;
                                            <strong>Expires {moment(value.ttl).fromNow()}</strong>
                                          </span>
                                          <br />
                                          <br />
                                        </div>
                                      </Grid>
                                      <Grid item xs={1} sm={1}>
                                        {value.user === user ? (
                                          <DeleteIcon
                                            onClick={() => {
                                              setUserEditingTruckNorrisData(true);
                                              setDeletingMoveValues(true);
                                              const data = {
                                                site: site,
                                                date: day.date,
                                                did: value.did,
                                              };
                                              // post delete data
                                              axiosInstance
                                                .post("/userchangesdelete", data)
                                                .then((response) => {
                                                  setSnackbarMessage("Locked reservation deleted successfully!");
                                                  setDeletingMoveValues(false);
                                                  setUserEditingTruckNorrisData(false);
                                                  hideAdjustmentDialog();
                                                  setTimeout(() => handleSnackClose(), 1000);
                                                  executeOnce();
                                                })
                                                .catch((error) => {
                                                  console.log(error);
                                                });
                                            }}
                                          />
                                        ) : (
                                          false
                                        )}
                                      </Grid>
                                    </Grid>
                                  ))
                                ) : (
                                  <Typography variant="caption" gutterBottom>
                                    No reservations
                                  </Typography>
                                )
                              )}
                            </Grid>
                          </Grid>
                        </>
                      )}
                    </>
                  )
                  : null}
                {editComponent === "limits"
                  ? (
                    <>
                      {changing.limits ? (
                        <CircularProgress className={classes.progress} />
                      ) : (
                        <div>
                          <>
                            <Grid container spacing={GRID_SPACING}>
                              <Grid item xs={5} sm={5}>
                                <TextField
                                  id="lowerLimit"
                                  label="Lower Limit"
                                  type="number"
                                  className={classes.textField}
                                  value={lowerLimit}
                                  onChange={(ev) => setLowerLimit(parseInt(ev.target.value))}
                                  margin="normal"
                                />
                              </Grid>
                              <Grid item xs={5} sm={5}>
                                <TextField
                                  id="upperLimit"
                                  label="Upper Limit"
                                  type="number"
                                  className={classes.textField}
                                  value={upperLimit}
                                  onChange={(ev) => setUpperLimit(parseInt(ev.target.value))}
                                  margin="normal"
                                />
                              </Grid>
                              <Grid item xs={2} sm={2}>
                                <Button
                                  variant="contained"
                                  color="secondary"
                                  size="small"
                                  className={classes.holidaySaveBtn}
                                  onClick={() => {
                                    const data = {
                                      type: "limits",
                                      upper: upperLimit,
                                      lower: lowerLimit,
                                    };
                                    setChanging({
                                      ...changing,
                                      limits: true,
                                    });
                                    sendDataToApi(data);
                                  }}
                                >
                                  <SaveIcon
                                    className={classNames(
                                      classes.leftIcon,
                                      classes.iconSmall
                                    )}
                                  />
                                  Save
                                </Button>
                              </Grid>
                            </Grid>
                          </>
                        </div>
                      )}
                    </>
                  ) : null}
              </Grid>
              <Grid item xs={1} sm={1}>
                <CloseIcon
                  className={classes.icon}
                  onClick={hideAdjustmentDialog}
                />
              </Grid>
            </Grid>
            {editComponent === "del" ? (
              <Typography
                className={classes.lockTimeDesc}
                variant="caption"
                gutterBottom
              >
                Lock time is the time you want to keep this change to make
                sure that next automatic refresh of data doesn't ignore the
                values you set.{" "}
              </Typography>
            ) : (
              null
            )}
          </Grid>
        ) : (
          null
        )}
      </Grid>
      {snackbarMessage && snackbarMessage !== "" ? (
        <Snackbar
          anchorOrigin={{
            vertical: "bottom",
            horizontal: "left",
          }}
          open={snackbarMessage !== "" && snackbarMessage !== undefined}
          autoHideDuration={6000}
          ContentProps={{
            "aria-describedby": "message-id",
          }}
          message={<span id="message-id">{snackbarMessage}</span>}
          action={[
            <IconButton
              key="close"
              aria-label="Close"
              color="inherit"
              className={classes.close}
              onClick={handleSnackClose}
            >
              <CloseIcon />
            </IconButton>,
          ]}
        />
      ) : null}
    </div>
  ) : (
    null
  );;
};

interface DayStatComponentProps {
  dateAndTrailerLimits?: DateAndTrailerLimitData;
  day: SiteData;
  site: SiteID;
  executeOnce: () => void;
  userMods: UserModData;
  userEditingTruckNorrisData: boolean;
  setUserEditingTruckNorrisData: React.Dispatch<React.SetStateAction<boolean>>;
};


// ============================================================================
// Helpers
// ============================================================================

const apiURL = "https://alfxkn3ccg.execute-api.ap-southeast-2.amazonaws.com/prod";

// Configure instance
const axiosInstance = axios.create({
  baseURL: apiURL,
  timeout: 5000,
  headers: {
    'x-api-key': process.env.REACT_APP_API_KEY as string,
  },
});

/**
 * Calculates numbers of same Zone 3 Suburbs if there are any
 */
const getZone3n4ProcessedArray = (zoneList: string[]) => {
  let processed: {[key: string]: number} = {};
  for (let suburb of zoneList) {
    if (
      Object.keys(processed).length === 0 ||
      (Object.keys(processed).length > 0 && !processed[suburb])
    ) {
      processed[suburb] = 1;
    } else {
      // increment
      processed[suburb]++;
    }
  }
  return processed;
};

// ============================================================================
// Styles
// ============================================================================

const GRID_SPACING = 2;
const useStyles = makeStyles(theme => ({
  root: {
    flexGrow: 1,
    background: "#595959",
    padding: 10,
    margin: 10,
    borderRadius: 5,
  },
  formControl: {
    margin: theme.spacing(2),
  },
  textField: {
    marginLeft: 0,
    marginRight: theme.spacing(1),
    maxWidth: 200,
  },
  textField2: {
    marginLeft: 0,
    marginRight: theme.spacing(1),
    width: "100%",
  },
  dense: {
    marginTop: 19,
  },
  menu: {
    width: 200,
  },
  inactiveRoot: {
    flexGrow: 1,
    background: "#9E9E9E",
    padding: 10,
    margin: 10,
    borderRadius: 5,
  },
  dayComponent: {
    padding: 5,
    borderRadius: 5,
    //background: 'white',
    height: 90,
    color: "white",
    cursor: "pointer",
  },
  adjustmentContainer: {
    marginTop: 5,
    marginLeft: 10,
    marginRight: 10,
    marginBottom: 10,
    borderRadius: 5,
    background: "#FFF8E1",
  },
  day: {
    fontSize: 16,
    color: "white",
  },
  date: {
    fontSize: 30,
  },
  month: {
    fontSize: 12,
    color: "white",
  },
  movesWarning: {
    fontSize: 10,
    color: "#595959",
    fontWeight: "bold",
  },
  spacer: {
    height: 5,
  },
  danger: {
    background: "#F44336",
  },
  warning: {
    background: "#FF9800",
  },
  healthy: {
    background: "#8BC34A",
  },
  lowerText: {
    fontSize: 11,
    color: "#FF9800",
    fontWeight: "bold",
  },
  lowerValue: {
    fontSize: 22,
    color: "#FF9800",
    fontWeight: "bold",
  },
  upperValue: {
    fontSize: 22,
    color: "#F44336",
    fontWeight: "bold",
  },
  upperText: {
    fontSize: 11,
    color: "#F44336",
    fontWeight: "bold",
  },
  timeSpreadContainer: {
    width: "100%",
    flexGrow: 1,
    fontSize: 10,
    color: "white",
    fontWeight: "bold",
  },
  metadata: {
    color: "white",
  },
  dftext: {
    color: "orange",
    fontSize: 12,
    fontWeight: 700,
    minHeight: 24,
  },
  arrowPopper: {
    '&[x-placement*="bottom"] $arrowArrow': {
      top: 0,
      left: 0,
      marginTop: "-0.9em",
      width: "3em",
      height: "1em",
      "&::before": {
        borderWidth: "0 1em 1em 1em",
        borderColor: `transparent transparent ${theme.palette.grey[700]} transparent`,
      },
    },
    '&[x-placement*="top"] $arrowArrow': {
      bottom: 0,
      left: 0,
      marginBottom: "-0.9em",
      width: "3em",
      height: "1em",
      "&::before": {
        borderWidth: "1em 1em 0 1em",
        borderColor: `${theme.palette.grey[700]} transparent transparent transparent`,
      },
    },
    '&[x-placement*="right"] $arrowArrow': {
      left: 0,
      marginLeft: "-0.9em",
      height: "3em",
      width: "1em",
      "&::before": {
        borderWidth: "1em 1em 1em 0",
        borderColor: `transparent ${theme.palette.grey[700]} transparent transparent`,
      },
    },
    '&[x-placement*="left"] $arrowArrow': {
      right: 0,
      marginRight: "-0.9em",
      height: "3em",
      width: "1em",
      "&::before": {
        borderWidth: "1em 0 1em 1em",
        borderColor: `transparent transparent transparent ${theme.palette.grey[700]}`,
      },
    },
  },
  arrowArrow: {
    position: "absolute",
    fontSize: 7,
    width: "3em",
    height: "3em",
    "&::before": {
      content: '""',
      margin: "auto",
      display: "block",
      width: 0,
      height: 0,
      borderStyle: "solid",
    },
  },
  tooltipText: {
    fontSize: 12,
  },
  tooltipText2: {
    fontSize: 14,
  },
  userDetails: {
    fontSize: 12,
    color: "#b5b2b2",
  },
  infoMsgContainer: {
    paddingBottom: 10,
  },
  icon: {
    "&:hover": {
      color: "#FF9800",
    },
    fontSize: 18,
    float: "right",
  },
  button: {
    margin: theme.spacing(1),
  },
  chip: {
    margin: theme.spacing(1),
  },
  adjustmentControls: {
    paddingTop: 5,
    paddingLeft: 5,
    fontSize: 10.5,
  },
  updateControl: {
    color: "#F9A825",
    fontWeight: 700,
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
  holidaySaveBtn: {
    marginTop: 30,
  },
  delText: {
    fontSize: 16,
    fontWeight: 700,
    paddingTop: 10,
    paddingLeft: 12,
    textAlign: "left",
  },
  ttlContainer: {
    float: "left",
    paddingLeft: 10,
  },
  lockTimeDesc: {
    paddingLeft: 15,
    textAlign: "left",
  },
  progress: {
    margin: theme.spacing(2),
  },
  close: {
    padding: theme.spacing(1),
  },
  yourEntriesTitle: {
    paddingTop: 10,
    paddingBottom: 5,
    borderBottom: "1px dashed #8b8888",
    textTransform: "uppercase",
    fontSize: 14,
  },
  yourEntriesContent: {
    paddingTop: 20,
  },
  userEntryText: {
    textAlign: "left",
  },
  timeStampOfMsg: {
    fontSize: 12,
    color: "#846403",
    paddingTop: 2,
    paddingBottom: 5,
  },
}));

// ============================================================================
// Export Default
// ============================================================================

export default DayStatComponent;