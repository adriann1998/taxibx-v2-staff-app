import React, { useState } from 'react';
import classNames from 'classnames';
import { NavMenuItem } from '../../types';

// Material UI
import {
  CssBaseline,
  Drawer,
  AppBar,
  Toolbar,
  List,
  Typography,
  Divider,
  IconButton,
  Tooltip,
  makeStyles,
} from '@material-ui/core';

// Icons and Logos
import MenuIcon from '@material-ui/icons/Menu';
import ChevronLeftIcon from '@material-ui/icons/ChevronLeft';
import PowerIcon from '@material-ui/icons/PowerSettingsNew';
import TaxiBoxLogo from './../../assets/images/Logo.svg';

// Components
import ListItems from './ListItems';
import Calculator from './../Calculator/Calculator';
import TruckNorris from './../TruckNorris/TruckNorris';
import ZoneCalculator from './../ZoneCalculator/ZoneCalculator';
import { authContext } from '../../adalConfig';

/**
 * Main component in the TAXIBOX staff app. 
 */
const Dashboard = () => {

  const classes = useStyles();
  const [open, setOpen] = useState<boolean>(false);
  const [activeNavTab, setActiveNavTab] = useState<NavMenuItem>('trucknorris');

  /**
   * Handles the left drawer open state.
   */
  const handleDrawerOpen = () => {
    setOpen(true);
  };

  /**
   * Handles the left drawer close state.
   */
  const handleDrawerClose = () => {
    setOpen(false);
  };


  const handleLogout = () => {
    authContext.logOut();
  }

  /**
   * Renders the component
   */
  return (
    <React.Fragment>
      <CssBaseline />
      <div className={classes.root}>
        <AppBar
          position="absolute"
          className={classNames(classes.appBar, open && classes.appBarShift)}
        >
          <Toolbar disableGutters={!open} className={classes.toolbar}>
            <IconButton
              color="inherit"
              aria-label="Open drawer"
              onClick={handleDrawerOpen}
              className={classNames(
                classes.menuButton,
                open && classes.menuButtonHidden,
              )}
            >
              <MenuIcon />
            </IconButton>
            <Typography variant="body2" color="inherit" noWrap className={classes.title}>
              <img src={TaxiBoxLogo} width="150" alt="TaxiBox" />  Staff App
            </Typography>
            <Typography variant="body2" color="inherit">
              {
                //@ts-ignore
                `Hello ${authContext._user.profile.given_name}`
              }
            </Typography>
            <IconButton color="inherit" onClick={handleLogout}>
              <Tooltip title="Logout">
                <PowerIcon />
              </Tooltip>
            </IconButton>
          </Toolbar>
        </AppBar>

        <Drawer
          variant="permanent"
          classes={{
            paper: classNames(classes.drawerPaper, !open && classes.drawerPaperClose),
          }}
          open={open}
        >
          <div className={classes.toolbarIcon}>
            <IconButton onClick={handleDrawerClose}>
              <ChevronLeftIcon />
            </IconButton>
          </div>
          <Divider />
          <List>
            <ListItems 
              handleMenuClick={(menu) => setActiveNavTab(menu)}
              show={activeNavTab}
            />
          </List>
        </Drawer>
            
        <main className={classes.content}>
          <div className={classes.appBarSpacer} />
            {
              activeNavTab === 'trucknorris' ?
                <TruckNorris />
                : null
            }
            {
              activeNavTab === 'calculator' ?
                <Calculator />
                : null
            }
            {
              activeNavTab === 'zone-calculator' ?
                <ZoneCalculator />
                : null
            }
        </main>
      </div>
    </React.Fragment>
  );
}

// ============================================================================
// Styles
// ============================================================================

const drawerWidth = 240;

const useStyles = makeStyles((theme) => ({
  root: {
    display: 'flex',
  },
  toolbar: {
    paddingRight: 24, // keep right padding when drawer closed
  },
  toolbarIcon: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'flex-end',
    padding: '0 8px',
    ...theme.mixins.toolbar,
  },
  appBar: {
    zIndex: theme.zIndex.drawer + 1,
    transition: theme.transitions.create(['width', 'margin'], {
      easing: theme.transitions.easing.sharp,
      duration: theme.transitions.duration.leavingScreen,
    }),
  },
  appBarShift: {
    marginLeft: drawerWidth,
    width: `calc(100% - ${drawerWidth}px)`,
    transition: theme.transitions.create(['width', 'margin'], {
      easing: theme.transitions.easing.sharp,
      duration: theme.transitions.duration.enteringScreen,
    }),
  },
  menuButton: {
    marginLeft: 12,
    marginRight: 36,
  },
  menuButtonHidden: {
    display: 'none',
  },
  title: {
    flexGrow: 1,
  },
  drawerPaper: {
    position: 'relative',
    whiteSpace: 'nowrap',
    width: drawerWidth,
    transition: theme.transitions.create('width', {
      easing: theme.transitions.easing.sharp,
      duration: theme.transitions.duration.enteringScreen,
    }),
  },
  drawerPaperClose: {
    overflowX: 'hidden',
    transition: theme.transitions.create('width', {
      easing: theme.transitions.easing.sharp,
      duration: theme.transitions.duration.leavingScreen,
    }),
    width: theme.spacing(7),
    [theme.breakpoints.up('sm')]: {
      width: theme.spacing(9),
    },
  },
  appBarSpacer: theme.mixins.toolbar,
  content: {
    flexGrow: 1,
    padding: theme.spacing(3),
    height: '100vh',
    overflow: 'auto',
    backgroundColor: '#ffffff'
  },
  chartContainer: {
    marginLeft: -22,
  },
  tableContainer: {
    height: 320,
  },
}));

// ============================================================================
// Export Default
// ============================================================================

export default Dashboard;