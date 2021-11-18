import React, { useState, useEffect, useMemo } from "react";
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
import { gql, useQuery, ApolloClient, InMemoryCache } from "@apollo/client";
import { 
  CityNoteData, 
  SiteID, 
  HolidayData,
  Holiday,
  DateAndTrailerLimitData,
  DayOfTheWeek,
  UserModData,
  SiteData,
  CalculationData,
} from '../../types';

const TruckNorris = () => {

  const classes = useStyles();
  const [userEditingTruckNorrisData, setUserEditingTruckNorrisData] = useState<boolean>(false);
  const [dateAndTrailerLimits, setDateAndTrailerLimits] = useState<DateAndTrailerLimitData[] | null>(null);
  const [calculationData, setCalculationData] = useState<CalculationData[] | null>(null);
  const [holidays, setHolidays] = useState<HolidayData[] | null>(null);
  const [melbourne, setMelbourne] = useState<SiteData[] | null>(null); 
  const [sydney, setSydney] = useState<SiteData[] | null>(null); 
  const [brisbane, setBrisbane] = useState<SiteData[] | null>(null); 
  const [userModifications, setUserModifications] = useState<UserModData[] | null>(null);
  const [melNotes, setMelNotes] = useState<string>("");
  const [sydNotes, setSydNotes] = useState<string>("");
  const [brisNotes, setBrisNotes] = useState<string>("");


  useEffect(() => {
    console.log('should only run once')
    // Load data every minute if the user is not editing data
    if (!userEditingTruckNorrisData) {
      loadData();
      prepareData();
      const loadInterval: NodeJS.Timeout = setInterval(() => {
        loadData();
      }, 5 * 1000);
      
      // Set data every 45 seconds
      const interval: NodeJS.Timeout = setInterval(async () => {
        if (
          holidays &&
          calculationData &&
          dateAndTrailerLimits
        ) {
          prepareData();
        }
      }, 45 * 1000)

      return () => {
        clearInterval(interval);
        clearInterval(loadInterval);
      };
    };
  }, []);

  /**
   * Prepares data and generates DayStats components
   */
  const prepareData = useMemo(() => (() => {
    setMelbourne(prepareSiteData(SITE_MELBOURNE, holidays, calculationData, dateAndTrailerLimits));
    setSydney(prepareSiteData(SITE_SYDNEY, holidays, calculationData, dateAndTrailerLimits));
    setBrisbane(prepareSiteData(SITE_BRISBANE, holidays, calculationData, dateAndTrailerLimits));
  }), [holidays, dateAndTrailerLimits, calculationData]);

  /**
   * Returns user modifications for the given site
   */
  const getUserModificationsForTheSite = (site: SiteID) => {
    if (userModifications && userModifications.length) {
      let mods = userModifications.filter((usermod) => {
        return usermod.id.includes(site.toString());
      });
      return mods;
    }
    return [];
  };

  /**
   * Loads all data required for the app
   */
  const loadData = useMemo(() => (async () => {
    // Configure instance
    const axiosInstance = axios.create({
      baseURL: apiURL,
      timeout: 35000,
      headers: {
        'x-api-key': process.env.REACT_APP_TAXIBOX_API_KEY as string,
      },
    });

    const holidaysPromise = new Promise<HolidayData[] | null>((resolve, reject) => {
      client
        .query({
          query: gql`
            query GetHolidays {
              getAllHolidays
            }
          `,
        })
        .then((result: any) => {
          if (
            result &&
            result.data &&
            result.data.getAllHolidays &&
            result.data.getAllHolidays.length
          ) {
            // setHolidays(JSON.parse(result.data.getAllHolidays));
            resolve(JSON.parse(result.data.getAllHolidays));
          } else {
            console.log("Error loading holidays from the GraphQL API");
          }
        });
    })

    // Retrieve calculation data
    const calculationPromise = new Promise<CalculationData[] | null>((resolve, reject) => {
      axiosInstance
        .get("/")
        .then((response) => {
          if (response.data.length) {
            // setCalculationData(response.data);
            resolve(response.data)
          } else {
            reject(false);
          }
        })
        .catch((error) => {
          console.log(error);
        });
    })

    // Retrieve limits
    const limitsPromise = new Promise<DateAndTrailerLimitData[] | null>((resolve, reject) => {
      axiosInstance
        .get("/limits")
        .then((response) => {
          // setDateAndTrailerLimits(response.data);
          resolve(response.data);
        })
        .catch((error) => {
          console.log(error);
        });
    })

    // Retrieve user changes
    const userModsPromise = new Promise<UserModData[] | null>((resolve, reject) => {
      const dates = getRemainingWorkingDaysof4Weeks();
      axiosInstance
        .post("/userchanges", dates)
        .then((response) => {
          // setUserModifications(response.data);
          resolve(response.data);
        })
        .catch((error) => {
          console.log(error);
        });
    });

    // Retrieve city notes only when not editing
    const cityNotesPromise = new Promise<{
      melNotes: string,
      sydNotes: string;
      brisNotes: string;
    }>((resolve, reject) => {
      fetch("https://alfxkn3ccg.execute-api.ap-southeast-2.amazonaws.com/prod/citynotes")
        .then((data) => data.json())
        .then((data) => {
          // setMelNotes(data.filter((d: {city: string, notes: string}) => d.city === "Melbourne")[0].notes);
          // setSydNotes(data.filter((d: {city: string, notes: string}) => d.city === "Sydney")[0].notes);
          // setBrisNotes(data.filter((d: {city: string, notes: string}) => d.city === "Brisbane")[0].notes);
          resolve({
            melNotes: data.filter((d: {city: string, notes: string}) => d.city === "Melbourne")[0].notes,
            sydNotes: data.filter((d: {city: string, notes: string}) => d.city === "Sydney")[0].notes,
            brisNotes: data.filter((d: {city: string, notes: string}) => d.city === "Brisbane")[0].notes,
          })
        });
    })
    
    Promise.all([
      holidaysPromise,
      calculationPromise,
      limitsPromise,
      userModsPromise,
      cityNotesPromise
    ])
    .then(results => {
      setHolidays(results[0]);
      setCalculationData(results[1]);
      setDateAndTrailerLimits(results[2]);
      setUserModifications(results[3]);
      setMelNotes(results[4].melNotes);
      setSydNotes(results[4].sydNotes);
      setBrisNotes(results[4].brisNotes);
    })
  }), []);

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
            notes={melNotes}
            city="Melbourne"
            handleNotesChange={(event) => setMelNotes(event.target.value)}
          />
          <br />
          <br />
          {melbourne ? (
            <SiteStats
              dateAndTrailerLimits={getLimitsForSite(SITE_MELBOURNE, dateAndTrailerLimits)}
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
            notes={sydNotes}
            city="Sydney"
            handleNotesChange={(event) => setSydNotes(event.target.value)}
          />
          <br />
          <br />
          {sydney ? (
            <SiteStats
              dateAndTrailerLimits={getLimitsForSite(SITE_SYDNEY, dateAndTrailerLimits)}
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
            notes={brisNotes}
            city="Brisbane"
            handleNotesChange={(event) => setBrisNotes(event.target.value)}
          />
          <br />
          <br />
          {brisbane ? (
            <SiteStats
              dateAndTrailerLimits={getLimitsForSite(SITE_BRISBANE, dateAndTrailerLimits)}
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
  );
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

// AXIOS Configuration instance
const apiURL = "https://alfxkn3ccg.execute-api.ap-southeast-2.amazonaws.com/prod";

const client = new ApolloClient({
  uri: "https://graph.taxibox.com.au/graphql",
  cache: new InMemoryCache(),
});

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

  /**
   * Prepares data for a site provided
   */
const prepareSiteData = (
  site: SiteID, 
  holidays: HolidayData[] | null, 
  calculationData: CalculationData[] | null,
  dateAndTrailerLimits: DateAndTrailerLimitData[] | null,
) => {
  // Get all the working days for next 4 weeks.
  const remainingDays = getRemainingWorkingDaysof4Weeks();
  let preparedData = [];

  // Loop through each day and assign values
  if (remainingDays.length) {
    for (let day of remainingDays) {
      let dateObject: SiteData | undefined = {
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
      dateObject.holiday = checkDateIsHoliday(day, site, holidays);

      // Assign calculation data
      if (calculationData && calculationData.length) {
        const calculationDataForSite = getCalculationDataForSite(site, calculationData);
        //console.log(site, day, calculationData);
        if (calculationDataForSite) {
          // Loop through each calculation data and assign for the date
          for (let date in calculationDataForSite) {
            if (date === day) {
              dateObject.data = calculationDataForSite[date];
            }
          }
        }
      }
      // Assign max min values and any other notifications
      if (dateAndTrailerLimits && dateAndTrailerLimits.length) {
        const siteLimits = getLimitsForSite(site, dateAndTrailerLimits);
        if (siteLimits) {
          // set the max and min limits for the day
          const dayName = moment(day)
            .format("dddd")
            .toLowerCase()
            .substring(0, 3);
          dateObject.limits = getLimitsForTheDay(siteLimits, dayName as DayOfTheWeek);
        };
      }
      preparedData.push(dateObject);
    }
  }

  return preparedData;
};

/**
   * Returns calculation data for
   */
 const getCalculationDataForSite = (site: SiteID, calculationData: CalculationData[] | null) => {
  let data = null;
  if (calculationData && calculationData.length) {
    const latestData = getLastAddedRecord(
      calculationData
    ).calculation;
    //console.log('Latest data', latestData);
    for (let siteKey in latestData) {
      if (parseInt(siteKey.split("#")[1], 10) === site) {
        data = calculationData[0].calculation[siteKey];
        //console.log(site, data);
      }
    }
  }

  return data;
};

/**
   * Returns limits for the given site
   */
 const getLimitsForSite = (site: SiteID, dateAndTrailerLimits: DateAndTrailerLimitData[] | null) => {
  let limits;
  if (dateAndTrailerLimits && dateAndTrailerLimits.length) {
    limits = dateAndTrailerLimits.filter((limit) => limit.id === site);
  }
  return limits && limits[0];
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
   * Checks whether the provided date of a site is a holiday
   */
 const checkDateIsHoliday = (date: string, site: SiteID, holidays: HolidayData[] | null) => {
  const next4WeeksHolidays = getSiteHolidaysForNext4Weeks(site, holidays);

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

/**
   * Returns holidays for next 4 weeks including the current week for a given site
   */
 const getSiteHolidaysForNext4Weeks = (site: SiteID, holidays: HolidayData[] | null) => {
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
  if (state !== "" && holidays && holidays.length) {
    for (let st of holidays) {
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

// Connect with Redux store
export default TruckNorris;
