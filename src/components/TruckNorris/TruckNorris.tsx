import React, { useState, useEffect } from "react";
import { makeStyles } from "@material-ui/core";
import {
  Typography,
  Divider,
  Grid,
  CircularProgress,
} from '@material-ui/core';
import CityNotes from "./CityNotes";
import axios from "axios";
import moment from "moment";
import SiteStats from "./SiteStats";
import loadash from "lodash";
import { gql, useQuery } from "@apollo/client";
import { 
  CityNoteData, 
  SiteID, 
  HolidayData,
  Holiday,
  DateAndTrailerLimitData,
  DayOfTheWeek,
  LimitData,
  SiteData,
} from '../../types';

const TruckNorris = () => {
  const classes = useStyles();
  const [userEditingTruckNorrisData, setUserEditingTruckNorrisData] = useState<boolean>(false);
  const [state, setState] = useState<{
    dateAndTrailerLimits: DateAndTrailerLimitData[];
    calculationData?: any;
    holidays: HolidayData[];
    melbourne?: SiteData[];
    sydney?: SiteData[];
    brisbane?: SiteData[];
    userModifications?: LimitData[],
    melNotes: string;
    sydNotes: string;
    brisNotes: string;
  }>({
    dateAndTrailerLimits: [],
    calculationData: undefined,
    holidays: [],
    melbourne: [],
    sydney: [],
    brisbane: [],
    userModifications: undefined,
    melNotes: "",
    sydNotes: "",
    brisNotes: "",
  });

  // Get Holidays Query
  const holidaysResult = useQuery<GetHolidaysResult>(GET_HOLIDAYS);
  
  let interval: NodeJS.Timeout; 
  let interval2: NodeJS.Timeout; 
  let loadInterval: NodeJS.Timeout;
  
  useEffect(() => {
    executeOnce();
    // Load data every minute if the user is not editing data
    if (!userEditingTruckNorrisData) {
      try {
        loadInterval = setInterval(async () => {
          loadData();
        }, 60 * 1000);
      } catch (e) {
        console.log(e);
      }

      // Set data every 45 seconds
      interval = setInterval(async () => {
        //console.log('preparing data');
        if (
          state.holidays &&
          state.calculationData &&
          state.dateAndTrailerLimits &&
          !stateValuesSet
        ) {
          stateValuesSet = true;
          prepareData();
        }
      }, 45 * 1000);
    }
  }, [])

  // Clear interval when unmount
  useEffect(() => {
    return () => {
      clearInterval(interval);
      clearInterval(interval2);
      clearInterval(loadInterval);
    }
  }, [])

  const prepareData = () => {
    setState({
      ...state,
      melbourne: prepareSiteData(SITE_MELBOURNE),
      sydney: prepareSiteData(SITE_SYDNEY),
      brisbane: prepareSiteData(SITE_BRISBANE),
    });
  };

  const checkDateIsHoliday = (date: string, site: SiteID): Holiday | boolean => {
    const next4WeeksHolidays = getSiteHolidaysForNext4Weeks(site);
    if (next4WeeksHolidays.length) {
      for (let holiday of next4WeeksHolidays) {
        if (getISODate(holiday.date) === date) {
          return holiday;
        }
      }
      return false;
    } else {
      return false;
    }
  };

  const getSiteHolidaysForNext4Weeks = (site: SiteID) => {
    // Get the state for the site
    let holidaysOfMonth = [];
    const todayMonthYear = moment().format("MM-YYYY");
    const lastDayMonthYearOf4Weeks = moment().day(28).format("MM-YYYY");
    let australianState = "";
    switch (site) {
      case SITE_MELBOURNE:
        australianState = "VIC";
        break;
      case SITE_SYDNEY:
        australianState = "NSW";
        break;
      case SITE_BRISBANE:
        australianState = "QLD";
        break;
      default:
        australianState = "";
    }
    if (australianState !== "" && state.holidays.length) {
      for (let holidayData of state.holidays) {
        if (holidayData.state === australianState) {
          for (let year of holidayData.years) {
            if (year.year === parseInt(moment().format("YYYY"), 10)) {
              for (let holiday of year.holidays) {
                const dateISO = getISODate(holiday.date);
                if (
                  (holiday.date.includes(todayMonthYear) ||
                    holiday.date.includes(lastDayMonthYearOf4Weeks)) &&
                  moment(dateISO).unix() <= moment().day(28).unix()
                ) {
                  holidaysOfMonth.push(holiday);
                }
              }
            }
          }
        }
      }
    }
  
    return holidaysOfMonth;
  };

  /**
   * Prepares data for a site provided
   */
  const prepareSiteData = (site: SiteID): SiteData[] => {
    // Get all the working days for next 4 weeks.
    const remainingDays = getRemainingWorkingDaysof4Weeks();
    let preparedData = [];

    // Loop through each day and assign values
    if (remainingDays.length) {
      for (let day of remainingDays) {
        let dateObject: SiteData = {
          date: "",
          dateBroken: [],
          holiday: false,
          data: {
            am: 0,
            anytime: 0,
            customers: [],
            delivery: 0,
            dfCount: 0,
            pickup: 0,
            pm: 0,
            sdp: 0,
            trailers: 0,
            zone3: [],
          },
          limits: [],
        };
        dateObject.date = day;
        dateObject.dateBroken = [
          moment(day).format("dddd").substring(0, 3),
          moment(day).format("DD"),
          moment(day).format("MMMM").substring(0, 3),
        ];
        // Check for holidays, if so, add holiday details
        dateObject.holiday = checkDateIsHoliday(day, site);

        // Assign calculation data
        if (state.calculationData.length) {
          const calculationData = getCalculationDataForSite(site);
          //console.log(site, day, calculationData);
          if (calculationData) {
            // Loop through each calculation data and assign for the date
            for (let date in calculationData) {
              if (date === day) {
                dateObject.data = calculationData[date];
              }
            }
          }
        }
        // Assign max min values and any other notifications
        if (
          state.dateAndTrailerLimits &&
          state.dateAndTrailerLimits.length
        ) {
          const siteLimits = getLimitsForSite(site);
          // set the max and min limits for the day
          const dayName = moment(day)
            .format("dddd")
            .toLowerCase()
            .substring(0, 3);
          dateObject.limits = getLimitsForTheDay(siteLimits, dayName as DayOfTheWeek);
        }
        preparedData.push(dateObject);
      }
    }

    return preparedData;
  };

  /**
   * Returns limits for the given site
   */
   const getLimitsForSite = (site: SiteID) => {
    let limits = state.dateAndTrailerLimits.filter((limit) => {
      return limit.id === site;
    });
    return limits[0];
  };

  /**
   * Returns limits for the date provided of a site
   */
   const getLimitsForTheDay = (siteLimits: DateAndTrailerLimitData, dayName: DayOfTheWeek) => {
    const limit = siteLimits.deliveries.filter((lmt) => {
      if (Object.keys(lmt)[0] === dayName) {
        return lmt[dayName];
      }
      return undefined;
    });
    return limit;
  };

  /**
   * Returns calculation data for
   */
   const getCalculationDataForSite = (site: SiteID) => {
    let data = null;
    if (state.calculationData.length) {
      //console.log(this.state.calculationData);
      const latestData = getLastAddedRecord(
        state.calculationData
      ).calculation;
      //console.log('Latest data', latestData);
      for (let siteKey in latestData) {
        if (parseInt(siteKey.split("#")[1], 10) === site) {
          data = state.calculationData[0].calculation[siteKey];
          //console.log(site, data);
        }
      }
    }

    return data;
  };

  const executeOnce = () => {
    loadData();
    // Set data every 6 minutes
    interval2 = setInterval(async () => {
      if (
        state.holidays &&
        state.calculationData &&
        state.dateAndTrailerLimits &&
        !stateValuesSet
      ) {
        stateValuesSet = true;
        prepareData();
      }
    }, 500);
  };

  const loadData = () => {
    if (
      holidaysResult &&
      holidaysResult.data &&
      holidaysResult.data.getAllHolidays &&
      JSON.parse(holidaysResult.data.getAllHolidays).length
    ) {
      const holidays: HolidayData[] = JSON.parse(holidaysResult.data.getAllHolidays);
      // Set holidays state
      setState({
        ...state,
        holidays: holidays
      });
    };

    stateValuesSet = false;

    // Configure instance
    const axiosInstance = axios.create({
      baseURL: apiURL,
      timeout: 35000,
      headers: {
        'x-api-key': process.env.REACT_APP_TAXIBOX_API_KEY || '',
      },
    });

    // Retrieve calculation data
    axiosInstance
      .get("/")
      .then((response) => {
        // console.log(response);
        if (response.data.length) {
          // console.log(response.data)
          setState({ 
            ...state,
            calculationData: response.data,
          });
        }
      })
      .catch((error) => {
        console.log(error);
      });

    // Retrieve limits
    axiosInstance
      .get("/limits")
      .then((response) => {
        // console.log(response);
        setState({ 
          ...state,
          dateAndTrailerLimits: response.data,
        });
      })
      .catch((error) => {
        console.log(error);
      });

    // Retrieve user changes
    const dates = getRemainingWorkingDaysof4Weeks();
    axiosInstance
      .post("/userchanges", dates)
      .then((response) => {
        // console.log(response);
        setState({
          ...state,
          userModifications: response.data,
        });
      })
      .catch((error) => {
        console.log(error);
      });

    // Retrieve city notes only when not editing
    fetch("https://alfxkn3ccg.execute-api.ap-southeast-2.amazonaws.com/prod/citynotes")
      .then((data) => data.json())
      .then((data) => {
        setState({
          ...state,
          melNotes: data.filter((d: CityNoteData) => d.city === "Melbourne")[0].notes,
          sydNotes: data.filter((d: CityNoteData) => d.city === "Sydney")[0].notes,
          brisNotes: data.filter((d: CityNoteData) => d.city === "Brisbane")[0].notes,
        });
      });
  };

  /**
   * Returns user modifications for the given site
   */
  const getUserModificationsForTheSite = (site: SiteID) => {
    if (state.userModifications) {
      let mods = state.userModifications.filter((usermod) => {
        return usermod.id.includes(site.toString());
      });
      return mods;
    }
    return [];
  };

  useEffect(() => {
    loadData();
  }, [holidaysResult]);

  // return null;
  console.log(state);

  return (
    <div className={classes.root}>
      <Typography variant="h4">Truck Norris</Typography>
      <br />
      <Divider />
      <br />
      <Grid container spacing={8}>
        <Grid item xs={12} sm={4}>
          <Typography variant="h5" style={{marginBottom: '15px'}}>
            Melbourne
          </Typography>
          <CityNotes
            notes={state.melNotes}
            city="Melbourne"
          />
          <br />
          <br />
          {state.melbourne ? (
            <SiteStats
              dateAndTrailerLimits={getLimitsForSite(SITE_MELBOURNE)}
              siteData={state.melbourne}
              userMods={getUserModificationsForTheSite(SITE_MELBOURNE)}
              executeOnce={executeOnce}
              site={SITE_MELBOURNE}
            />
          ) : (
            <CircularProgress className={classes.progress} />
          )}
        </Grid>
        <Grid item xs={12} sm={4}>
          <Typography variant="h5" style={{marginBottom: '15px'}}>Sydney</Typography>
          <CityNotes
            notes={state.sydNotes}
            city="Sydney"
          />
          <br />
          <br />
          {state.sydney ? (
            null
            // <SiteStats
            //   dateAndTrailerLimits={getLimitsForSite(SITE_SYDNEY)}
            //   userMods={getUserModificationsForTheSite(SITE_SYDNEY)}
            //   siteData={state.sydney}
            //   executeOnce={executeOnce}
            //   site={SITE_SYDNEY}
            // />
          ) : (
            <CircularProgress className={classes.progress} />
          )}
        </Grid>
        <Grid item xs={12} sm={4}>
          <Typography variant="h5" style={{marginBottom: '15px'}}>Brisbane</Typography>
          <CityNotes
            notes={state.brisNotes}
            city="Brisbane"
          />
          <br />
          <br />
          {state.brisbane ? (
            null
            // <SiteStats
            //   dateAndTrailerLimits={getLimitsForSite(SITE_BRISBANE)}
            //   userMods={getUserModificationsForTheSite(SITE_BRISBANE)}
            //   siteData={state.brisbane}
            //   executeOnce={executeOnce}
            //   site={SITE_BRISBANE}
            // />
          ) : (
            <CircularProgress className={classes.progress} />
          )}
        </Grid>
      </Grid>
    </div>
  );


  // /**
  //  * Prepares data for a site provided
  //  */
  // prepareSiteData = (site) => {
  //   // Get all the working days for next 4 weeks.
  //   const remainingDays = this.getRemainingWorkingDaysof4Weeks();
  //   let preparedData = [];

  //   // Loop through each day and assign values
  //   if (remainingDays.length) {
  //     for (let day of remainingDays) {
  //       let dateObject = {};
  //       dateObject.date = day;
  //       dateObject.dateBroken = [
  //         moment(day).format("dddd").substring(0, 3),
  //         moment(day).format("DD"),
  //         moment(day).format("MMMM").substring(0, 3),
  //       ];
  //       // Check for holidays, if so, add holiday details
  //       dateObject.holiday = this.checkDateIsHoliday(day, site);

  //       // Assign calculation data
  //       if (this.state.calculationData.length) {
  //         const calculationData = this.getCalculationDataForSite(site);
  //         //console.log(site, day, calculationData);
  //         if (calculationData) {
  //           // Loop through each calculation data and assign for the date
  //           for (let date in calculationData) {
  //             if (date === day) {
  //               dateObject.data = calculationData[date];
  //             }
  //           }
  //         }
  //       }
  //       // Assign max min values and any other notifications
  //       if (this.state.dateAndTrailerLimits.length) {
  //         const siteLimits = this.getLimitsForSite(site);
  //         // set the max and min limits for the day
  //         const dayName = moment(day)
  //           .format("dddd")
  //           .toLowerCase()
  //           .substring(0, 3);
  //         dateObject.limits = this.getLimitsForTheDay(siteLimits, dayName);
  //       }
  //       preparedData.push(dateObject);
  //     }
  //   }

  //   return preparedData;
  // };

}

// ============================================================================
// Styles
// ============================================================================

const useStyles = makeStyles(theme => ({
  root: {
    flexGrow: 1,
  },
  progress: {
    margin: theme.spacing(2),
  },
  cityTitle: { 
    marginBottom: "15px" 
  },
}));

// ============================================================================
// Queries
// ============================================================================

interface GetHolidaysResult {
  getAllHolidays: string;
} 

const GET_HOLIDAYS = gql`
  query GetHolidays {
    getAllHolidays
  }
`;

// ============================================================================
// Helpers
// ============================================================================

const SITE_MELBOURNE: SiteID = 1867;
const SITE_SYDNEY: SiteID = 7312;
const SITE_BRISBANE: SiteID = 31303;

let stateValuesSet = false;
const apiURL = "https://alfxkn3ccg.execute-api.ap-southeast-2.amazonaws.com/prod";

const getISODate = (date: string) => {
  const splittedDate = date.split("-");
  return splittedDate[2] + "-" + splittedDate[1] + "-" + splittedDate[0];
};

const getRemainingWorkingDaysof4Weeks = () => {
  let dates = [];
  // Get the next 4 Sundays
  const next4Sundays = [
    moment().day(7).format("YYYY-MM-DD"),
    moment().day(14).format("YYYY-MM-DD"),
    moment().day(21).format("YYYY-MM-DD"),
    moment().day(28).format("YYYY-MM-DD"),
  ];
  // Get the number of remaining days including today
  const noOfRemainingDays = 28 - (moment().day() - 1);
  for (let i = 0; i < noOfRemainingDays; i++) {
    let day = moment().add(i, "days").format("YYYY-MM-DD");
    // Add the date if not a Sunday
    if (next4Sundays.indexOf(day) === -1) {
      dates.push(day);
    }
  }
  return dates;
};

const getLastAddedRecord = (records: any) => {
  const orderedRecords = loadash.orderBy(records, ["id"], ["desc"]);
  return orderedRecords[0];
};

// Connect with Redux store
export default TruckNorris;
