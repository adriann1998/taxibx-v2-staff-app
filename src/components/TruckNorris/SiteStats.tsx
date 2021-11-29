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
    return modsOfDay[0];
  };
  
  return (
    <div>
      {
        siteData.map((stat, index) => {
          // Check whether the date is Saturday, If so add a gap
          if (!stat.limits.length || !dateAndTrailerLimits) {
            return null;
          }
          return moment(stat.date).day() === 6 ? (
            <div key={index + stat.date} >
              <DayStatComponent
                dateAndTrailerLimits={dateAndTrailerLimits}
                day={stat}
                site={site}
                executeOnce={executeOnce}
                userMods={getUserModsForTheDate(stat.date)}
                userEditingTruckNorrisData={userEditingTruckNorrisData}
                setUserEditingTruckNorrisData={setUserEditingTruckNorrisData}
              />
              <br />
              <br />
            </div>
          ) : (
            <DayStatComponent
              dateAndTrailerLimits={dateAndTrailerLimits}
              day={stat}
              site={site} 
              executeOnce={executeOnce}
              userMods={getUserModsForTheDate(stat.date)}
              userEditingTruckNorrisData={userEditingTruckNorrisData}
              setUserEditingTruckNorrisData={setUserEditingTruckNorrisData}
            />
          );

        })
      }
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

// ============================================================================
// Export Default
// ============================================================================

export default SiteStats;