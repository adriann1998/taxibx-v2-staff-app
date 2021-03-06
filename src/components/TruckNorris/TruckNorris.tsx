import React, { useEffect, useState, useMemo, useRef, useCallback } from 'react';
import axios from "axios";
import {
  makeStyles,
  Typography,
  Grid,
  Divider,
  CircularProgress,
} from '@material-ui/core';
import { gql, ApolloClient, InMemoryCache } from '@apollo/client';
import moment from 'moment';
import loadash from 'lodash';
import {
  SiteID,
  CalculationData,
  HolidayData,
  DateAndTrailerLimitData,
  DayOfTheWeek,
  SiteData,
  UserModData,
} from '../../types';
import SiteStats from './SiteStats';
import CityNotes from './CityNotes';

const TruckNorris = React.memo(() => {

  const classes = useStyles();

  const [userEditingTruckNorrisData, setUserEditingTruckNorrisData] = useState<boolean>(false);
  const [data, setData] = useState<{
    holidays?: HolidayData[];
    calculationData?: CalculationData[];
    dateAndTrailerLimits?: DateAndTrailerLimitData[];
    userModifications?: UserModData[];
  }>({
    holidays: undefined,
    calculationData: undefined,
    dateAndTrailerLimits: undefined,
    userModifications: undefined,
  });
  const [melbourne, setMelbounre] = useState<SiteData[]>();
  const [sydney, setSydney] = useState<SiteData[]>();
  const [brisbane, setBrisbane] = useState<SiteData[]>();
  const [cityNotes, setCityNotes] = useState<{
    melNotes: string;
    sydNotes: string;
    brisNotes: string;
  }>({
    melNotes: "",
    sydNotes: "",
    brisNotes: "",
  });

  const loadInterval = useRef<NodeJS.Timeout>();

  useEffect(() => {
    executeOnce();
    // Load data 5 seconds if the user is not editing data
    try {
      if (loadInterval.current) clearInterval(loadInterval.current);
      loadInterval.current = setInterval(async () => {
        loadData();
      }, 5 * 1000);
    } catch (e) {
      console.log(e);
    }
  }, [userEditingTruckNorrisData]);

  useEffect(() => {
    if (
      data.holidays && 
      data.calculationData && 
      data.dateAndTrailerLimits &&
      data.userModifications
    ) {
      prepareData();
    };
  }, [data]);

  useEffect(() => {
    // Clear intervals on unmount
    return () => {
      if (loadInterval.current) {
        clearInterval(loadInterval.current);
      };
    }
  }, []);

  const executeOnce = async () => {
    if (!userEditingTruckNorrisData) {
      loadData();
    };
  };

  const loadData = () => {
    if (!userEditingTruckNorrisData) {
      // Configure instance
      const axiosInstance = axios.create({
        baseURL: apiURL,
        timeout: 35000,
        headers: {
          'x-api-key': process.env.REACT_APP_API_KEY as string,
        },
      });
  
  
      const getHolidaysPromise = new Promise<HolidayData[] | undefined>((resolve, reject) => {
        client
          .query({
            query: gql`
              query GetHolidays {
                getAllHolidays
              }
            `,
          })
          .then((result) => {
            if (
              result &&
              result.data &&
              result.data.getAllHolidays &&
              result.data.getAllHolidays.length
            ) {
              resolve(JSON.parse(result.data.getAllHolidays));
            } else {
              console.log("Error loading holidays from the GraphQL API");
            }
          });
      });
  
      // Retrieve calculation data
      const getCalculationPromise = new Promise<any>((resolve, reject) => {
        axiosInstance
          .get("/")
          .then((response) => {
            resolve(response.data)
          })
          .catch((error) => {
            console.log(error);
          });
      });
  
      // Retrieve limits
      const getLimitsPromise = new Promise<any>((resolve, reject) => {
        axiosInstance
          .get("/limits")
          .then((response) => {
            resolve(response.data)
          })
          .catch((error) => {
            console.log(error);
          });
      });
  
      // Retrieve user changes
      const dates = getRemainingWorkingDaysof4Weeks();
      const getUserChangePromise = new Promise<any>((resolve, reject) => {
        axiosInstance
          .post("/userchanges", dates)
          .then((response) => {
            resolve(response.data);
          })
          .catch((error) => {
            console.log(error);
          });
      });
  
      // Retrieve city notes only when not editing
      const getCityNotesPromise = new Promise<any>((resolve, reject) => {
        fetch("https://alfxkn3ccg.execute-api.ap-southeast-2.amazonaws.com/prod/citynotes")
          .then((data) => data.json())
          .then((data) => {
            resolve(data);
          });
      });
      
      const promises = [
        getHolidaysPromise,
        getCalculationPromise,
        getLimitsPromise,
        getUserChangePromise,
        getCityNotesPromise,
      ];
      Promise.all(promises).then((values) => {
        const holidaysRes = values[0];
        const calculationRes = values[1];
        const dateAndTrailerLimitsRes = values[2];
        const userModsRes = values[3];
        const cityNotesRes = values[4];
        setData({
          holidays: holidaysRes,
          calculationData: calculationRes, 
          dateAndTrailerLimits: dateAndTrailerLimitsRes,
          userModifications: userModsRes,
        })
        setCityNotes({
          melNotes: cityNotesRes.filter((d: any) => d.city === "Melbourne")[0].notes,
          sydNotes: cityNotesRes.filter((d: any) => d.city === "Sydney")[0].notes,
          brisNotes: cityNotesRes.filter((d: any) => d.city === "Brisbane")[0].notes,
        })
      });
  
    };

  };

  const prepareData = () => {
    setMelbounre(prepareSiteData(SITE_MELBOURNE));
    setSydney(prepareSiteData(SITE_SYDNEY));
    setBrisbane(prepareSiteData(SITE_BRISBANE));
  };

  const prepareSiteData = (site: SiteID) => {
    // Get all the working days for next 4 weeks.
    const remainingDays = getRemainingWorkingDaysof4Weeks();
    let preparedData = [];

    // Loop through each day and assign values
    if (
      remainingDays.length &&
      data.calculationData?.length &&
      data.dateAndTrailerLimits?.length
    ) {
      for (let day of remainingDays) {
        let dateObject: any = {
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
            wos: 0,
            zone3: [],
            zone4: [],
            customMessage: "",
            holiday: false,
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

        // Assign max min values and any other notifications
        const siteLimits = getLimitsForSite(site);
        // set the max and min limits for the day
        const dayName = moment(day)
          .format("dddd")
          .toLowerCase()
          .substring(0, 3);
        dateObject.limits = getLimitsForTheDay({
          siteLimits,
          dayName: dayName.toLocaleLowerCase() as DayOfTheWeek
        });

        // Add to list
        preparedData.push(dateObject);
      };
      return preparedData;
    } else {
      return undefined;
    }
  };

  const getLimitsForTheDay = ({
    siteLimits,
    dayName
  }: {
    siteLimits?: DateAndTrailerLimitData,
    dayName: DayOfTheWeek
  }) => {
    const limit = siteLimits?.deliveries.filter((lmt) => {
      if (Object.keys(lmt)[0] === dayName) {
        return lmt[dayName];
      }
      return undefined;
    });
    return limit;
  };

  const getCalculationDataForSite = (site: SiteID) => {
    let ret = null;
    if (data.calculationData?.length) {
      const latestData = getLastAddedRecord(data.calculationData).calculation;
      for (let siteKey in latestData) {
        if (parseInt(siteKey.split("#")[1], 10) === site) {
          ret = data.calculationData[0].calculation[siteKey];
        }
      }
    }

    return ret;
  };

  const getLastAddedRecord = (records: CalculationData[]) => {
    const orderedRecords = loadash.orderBy(records, ["id"], ["desc"]);
    return orderedRecords[0];
  };

  const getLimitsForSite = (site: SiteID) => {
    let limits = data.dateAndTrailerLimits?.filter((limit) => {
      return limit.id === site;
    });
    return limits ? limits[0] : undefined;
  };

  const getUserModificationsForTheSite = (site: SiteID) => {
    if (data.userModifications) {
      let mods = data.userModifications.filter((usermod) => {
        return usermod.id.includes(site.toString());
      });
      return mods;
    }
    return [];
  };

  const getSiteHolidaysForNext4Weeks = (site: SiteID) => {
    // Get the state for the site
    let holidaysOfMonth = [];
    const todayMonthYear = moment().format("MM-YYYY");
    const lastDayMonthYearOf4Weeks = moment().day(28).format("MM-YYYY");
    let state = "";
    switch (site) {
      case SITE_MELBOURNE:
        state = "VIC";
        break;
      case SITE_SYDNEY:
        state = "NSW";
        break;
      case SITE_BRISBANE:
        state = "QLD";
        break;
      default:
        state = "";
    }
    if (state !== "" && data.holidays?.length) {
      for (let st of data.holidays) {
        if (st.state === state) {
          for (let year of st.years) {
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

  const checkDateIsHoliday = (date: string, site: SiteID) => {
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

  return (
    <div className={classes.root}>
      <Typography variant="h4">Truck Norris</Typography>
      <br />
      <Divider />
      <br />
      <Grid container spacing={2}>
        <Grid item xs={12} sm={4}>
          <Typography variant="h5" style={{marginBottom: '15px'}}>
            Melbourne
          </Typography>
          <CityNotes
            initalNotes={cityNotes.melNotes}
            city="Melbourne"
            onSave={(newComment: string) => setCityNotes({
              ...cityNotes,
              melNotes: newComment
            })}
            userEditingTruckNorrisData={userEditingTruckNorrisData}
            setUserEditingTruckNorrisData={setUserEditingTruckNorrisData}
          />
          <br />
          <br />
          {melbourne ? (
            <SiteStats
              dateAndTrailerLimits={getLimitsForSite(SITE_MELBOURNE)}
              siteData={melbourne}
              userMods={getUserModificationsForTheSite(SITE_MELBOURNE)}
              executeOnce={loadData}
              site={SITE_MELBOURNE}
              userEditingTruckNorrisData={userEditingTruckNorrisData}
              setUserEditingTruckNorrisData={setUserEditingTruckNorrisData}
            />
          ) : (
            <CircularProgress className={classes.progress} />
          )}
        </Grid>
        <Grid item xs={12} sm={4}>
          <Typography variant="h5" style={{marginBottom: '15px'}}>Sydney</Typography>
          <CityNotes
            initalNotes={cityNotes.sydNotes}
            city="Sydney"
            onSave={(newComment: string) => setCityNotes({
              ...cityNotes,
              melNotes: newComment
            })}
            userEditingTruckNorrisData={userEditingTruckNorrisData}
            setUserEditingTruckNorrisData={setUserEditingTruckNorrisData}
          />
          <br />
          <br />
          {sydney ? (
            <SiteStats
              dateAndTrailerLimits={getLimitsForSite(SITE_SYDNEY)}
              userMods={getUserModificationsForTheSite(SITE_SYDNEY)}
              siteData={sydney}
              executeOnce={loadData}
              site={SITE_SYDNEY}
              userEditingTruckNorrisData={userEditingTruckNorrisData}
              setUserEditingTruckNorrisData={setUserEditingTruckNorrisData}
            />
          ) : (
            <CircularProgress className={classes.progress} />
          )}
        </Grid>
        <Grid item xs={12} sm={4}>
          <Typography variant="h5" style={{marginBottom: '15px'}}>Brisbane</Typography>
          <CityNotes
            initalNotes={cityNotes.brisNotes}
            city="Brisbane"
            onSave={(newComment: string) => setCityNotes({
              ...cityNotes,
              melNotes: newComment
            })}
            userEditingTruckNorrisData={userEditingTruckNorrisData}
            setUserEditingTruckNorrisData={setUserEditingTruckNorrisData}
          />
          <br />
          <br />
          {brisbane ? (
            <SiteStats
              dateAndTrailerLimits={getLimitsForSite(SITE_BRISBANE)}
              userMods={getUserModificationsForTheSite(SITE_BRISBANE)}
              siteData={brisbane}
              executeOnce={loadData}
              site={SITE_BRISBANE}
              userEditingTruckNorrisData={userEditingTruckNorrisData}
              setUserEditingTruckNorrisData={setUserEditingTruckNorrisData}
            />
          ) : (
            <CircularProgress className={classes.progress} />
          )}
        </Grid>
      </Grid>
    </div>
  )
});

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
// Constants/Settings
// ============================================================================

let stateValuesSet = false;

const SITE_MELBOURNE: SiteID = 1867;
const SITE_SYDNEY: SiteID = 7312;
const SITE_BRISBANE: SiteID = 31303;

const apiURL = "https://alfxkn3ccg.execute-api.ap-southeast-2.amazonaws.com/prod";
const client = new ApolloClient({
  uri: "https://graph.taxibox.com.au/graphql",
  cache: new InMemoryCache(),
});

// ============================================================================
// Helpers
// ============================================================================

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

const getISODate = (date: string) => {
  const splittedDate = date.split("-");
  return splittedDate[2] + "-" + splittedDate[1] + "-" + splittedDate[0];
};

// ============================================================================
// Export Default
// ============================================================================

export default TruckNorris;