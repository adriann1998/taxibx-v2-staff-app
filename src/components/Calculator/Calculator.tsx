import React from 'react';
import {
  makeStyles,
} from '@material-ui/core'

export default function Calculator() {

  const classes = useStyles();

  return (
    <div className={classes.iframeWrapper} id="tb-storage-calculator-popup">
      <iframe
        frameBorder="0"
        src="https://www.taxibox.com.au/faq/storage-calculator/?iframe=yes"
        width="100%"
        height="100%"
      ></iframe>
    </div>
  )
};

const useStyles = makeStyles(theme => ({
  iframeWrapper: {
    position: 'relative',
    overflow: 'hidden',
    width: '100%',
    height: '100%',
    marginTop: '5px',
  },
}));