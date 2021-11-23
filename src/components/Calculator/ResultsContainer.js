import React, { Component } from 'react';
import { withStyles } from '@material-ui/core/styles';
import { List, ListItem } from '@material-ui/core';
import ListItemText from '@material-ui/core/ListItemText';
import HappyIcon from '@material-ui/icons/Mood';
import BoxIcon from '@material-ui/icons/CheckBoxOutlineBlank';
import Divider from '@material-ui/core/Divider';
import Typography from '@material-ui/core/Typography';
import FullScreenDialog from './FullScreenDialog';

const styles = theme => ({
  imageLink: {
    cursor: "pointer"
  },
  calculationResultsContainer: {
    padding: 30
  },
  resultsHeading: {
    paddingTop: 0
  }
})

/**
 * Loads the calculation results and displays a larger image for the rendered 3D image.
 * 
 * @param {*} props 
 */
class ResultsContainer extends Component {
  state = {
    open: false,
    selectedImage: null
  };

  handleClickOpen = () => {
    this.setState({ open: true });
  };

  handleClose = () => {
    this.setState({ open: false });
  };

  showImagePopup = image => {
    if (image.length > 0) {
      this.setState({ selectedImage: image, open: true });
    }
  }
  render() {
    const { classes } = this.props;
    if (this.props.results.cubeiq) {
      const results = this.props.results.cubeiq.loadedcontainers.loadedcontainer;
      // prepare the box stats
      const items = results.map((stat, index) => {
        return <div key={stat.loadid + index}>
          <ListItem>
            <BoxIcon />
            <ListItemText primary={"TAXIBOX " + (index + 1)} secondary="Weight:  " />
            <ListItemText primary="&nbsp;" secondary={"Utilization: " + stat.volumeutilization + "%"} />
          </ListItem>
          <a className={classes.imageLink} onClick={() => this.showImagePopup(this.props.results.imageURLs[index])}><img src={this.props.results.imageURLs[index]} width="300" alt="" /></a>
          <Typography variant="caption" gutterBottom align="center">
            Click to see the large version
                </Typography><br />
          <Divider />
        </div>;
      })
      return (
        <div className={classes.calculationResultsContainer}>
          <Typography variant="subtitle1" gutterBottom className={classes.resultsHeading}>
            Calculation Results
        </Typography>
          <List>
            <ListItem>
              <HappyIcon />
              <ListItemText primary="TAXIBOXes" secondary={results.length} />
            </ListItem>
            <Divider />
            {items}
          </List>
          <FullScreenDialog handleClose={this.handleClose} state={this.state} />
        </div>
      )
    } else {
      return false;
    }
  }
};

export default withStyles(styles)(ResultsContainer);