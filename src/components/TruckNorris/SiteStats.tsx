import React, { Component } from 'react';
import DayStatComponent from './DayStatComponent';
import moment from 'moment';
import { 
  DateAndTrailerLimitData,
  SiteData,
  LimitData,
} from '../../types';

const SiteStats = ({
  dateAndTrailerLimits,
  siteData,
  userMods,
  executeOnce,
  site,
}: SiteStatsProps) => {

  const getUserModsForTheDate = (date: string) => {
    let modsOfDay = userMods.filter(mod => {
      return mod.id.includes(date);
    });
    return modsOfDay;
  }

  //console.log(this.props.siteData);
  const generated = this.props.siteData.map((stat, index) => {
    let component = null;
    // Check whether the date is Monday, If so add a gap
    if (moment(stat.date).day() === 6) {
      component = <div key={index + stat.date} >
        <DayStatComponent
          dateAndTrailerLimits={this.props.dateAndTrailerLimits}
          day={stat}
          site={this.props.site}
          executeOnce={this.props.executeOnce}
          userMods={this.getUserModsForTheDate(stat.date)} />
        <br /><br /></div>;
    } else {
      component = <DayStatComponent
        dateAndTrailerLimits={this.props.dateAndTrailerLimits}
        key={index + stat.date}
        day={stat}
        userMods={this.getUserModsForTheDate(stat.date)}
        executeOnce={this.props.executeOnce}
        site={this.props.site} />;
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
  dateAndTrailerLimits: DateAndTrailerLimitData;
  siteData: SiteData[];
  userMods: LimitData[]
}

export default SiteStats;