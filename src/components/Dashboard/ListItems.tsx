import React from 'react';
import ListItem from '@material-ui/core/ListItem';
import ListItemIcon from '@material-ui/core/ListItemIcon';
import ListItemText from '@material-ui/core/ListItemText';
import AssessmentIcon from '@material-ui/icons/Exposure';
import PlaceIcon from '@material-ui/icons/Place';
import TruckNorrisIcon from '@material-ui/icons/LocalShipping';
import { NavMenuItem } from '../../types';

const ListItems = ({
  handleMenuClick,
  show,
}: ListItemsProps) => {

  return (
    <div>
      <ListItem button selected={show === 'trucknorris' ? true : false} onClick={() => handleMenuClick('trucknorris')}>
        <ListItemIcon>
          <TruckNorrisIcon />
        </ListItemIcon>
        <ListItemText primary="Truck Norris" />
      </ListItem>
      <ListItem button selected={show === 'calculator' ? true : false} onClick={() => handleMenuClick('calculator')}>
        <ListItemIcon>
          <AssessmentIcon />
        </ListItemIcon>
        <ListItemText primary="Storage Calculator" />
      </ListItem>
      <ListItem button selected={show === 'zone-calculator' ? true : false} onClick={() => handleMenuClick('zone-calculator')}>
        <ListItemIcon>
          <PlaceIcon />
        </ListItemIcon>
        <ListItemText primary="Zone Calculator" />
      </ListItem>
    </div >
  );
};

// ============================================================================
// Props
// ============================================================================

interface ListItemsProps {
  handleMenuClick: (menu: NavMenuItem) => void;
  show: NavMenuItem;
};

// ============================================================================
// Export Default
// ============================================================================

export default ListItems;
