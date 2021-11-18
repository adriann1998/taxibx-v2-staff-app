import React from 'react';
import DayStatComponent from './DayStatComponent';
import moment from 'moment';
import { 
  DateAndTrailerLimitData,
  SiteData,
  UserModData,
  SiteID,
} from '../../types';

const SiteStats = ({
  dateAndTrailerLimits,
  siteData,
  userMods,
  executeOnce,
  site,
  userEditingTruckNorrisData,
  setUserEditingTruckNorrisData,
}: SiteStatsProps) => {

  const getUserModsForTheDate = (date: string) => {
    let modsOfDay = userMods.filter(mod => {
      return mod.id.includes(date);
    });
    return modsOfDay;
  }

  const generated = siteData.map((stat, index) => {
    let component = null;
    // Check whether the date is Monday, If so add a gap
    if (moment(stat.date).day() === 6) {
      component = <div key={index + stat.date} >
        <DayStatComponent
          dateAndTrailerLimits={dateAndTrailerLimits}
          day={stat}
          site={site}
          executeOnce={executeOnce}
          userMods={getUserModsForTheDate(stat.date)}
          userEditingTruckNorrisData={userEditingTruckNorrisData}
          setUserEditingTruckNorrisData={setUserEditingTruckNorrisData}
        />
        <br /><br /></div>;
    } else {
      component = (
        <DayStatComponent
          dateAndTrailerLimits={dateAndTrailerLimits}
          key={index + stat.date}
          day={stat}
          site={site} 
          executeOnce={executeOnce}
          userMods={getUserModsForTheDate(stat.date)}
          userEditingTruckNorrisData={userEditingTruckNorrisData}
          setUserEditingTruckNorrisData={setUserEditingTruckNorrisData}
        />
      );
    }

    return component;

  });
  return (
    <div>
      {generated}
    </div>
  )
}

interface SiteStatsProps {
  dateAndTrailerLimits?: DateAndTrailerLimitData;
  siteData: SiteData[];
  userMods: UserModData[];
  executeOnce: () => void;
  site: SiteID;
  userEditingTruckNorrisData: boolean;
  setUserEditingTruckNorrisData: React.Dispatch<React.SetStateAction<boolean>>;
}

export default SiteStats;