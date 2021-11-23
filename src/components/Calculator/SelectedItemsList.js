import React, { PureComponent } from "react";
import { connect } from "react-redux";
import List from '@material-ui/core/List';
import { removeItem, changeQuantity } from "../../redux/actions";
import CustomListItem from "./CustomListItem";
import Typography from '@material-ui/core/Typography';

/**
 * Responsible for loading the selected items list.
 */
class ConnectedList extends PureComponent {
  state = {
    expanded: null,
  };

  /**
   * Makes sure that the selected item is focused and expanded.
   * 
   * @param {*} prev 
   * @param {*} next 
   */
  componentDidUpdate(prev, next) {
    // Expand the panel of the last added item, Leigh likes that :)
    if (this.props.lastAddedItem && (!next.expanded || next.expanded !== this.props.lastAddedItem.id)) {
      this.setState({
        expanded: this.props.lastAddedItem.id,
      });
    }
  }

  /**
   * Handles the expansion change of a selected item.
   */
  handleExpansionChange = panel => (event, expanded) => {
    this.setState({
      expanded: expanded ? panel : false,
    });
  };

  /**
   * Generates a random number.
   */
  generateRandomNumber = () => {
    const min = 10000;
    const max = 11000;
    return Math.floor(min + Math.random() * (max - min));
  }

  /**
   * Call the reducer to handle quantity change.
   */
  handleQuantityChange = item => event => {
    this.props.changeQuantity(item.id, event.target.value)
  }

  /**
   * Gets all the items except the provided item.
   */
  getOtherItems = (id) => {
    return this.props.selectedItemObjects.filter(item => {
      return item.id !== id;
    });
  }

  /**
   * Calls the reducer to handle item deletion.
   * 
   * @param {*} item 
   */
  handleDeleteItem(item) {
    this.props.removeItem(item);
  }

  /**
   * Renders the selected items in the body for adding quantities.
   */
  renderSelectedItems = () => {
    let list = this.props.selectedItemObjects && this.props.selectedItemObjects.length ? this.props.selectedItemObjects.map((item, index) => {
      const itemDimensions = item.width + ' cm(W) x ' + item.height + ' cm(H) x ' + item.depth + ' cm(D)';
      return <CustomListItem
        key={item.id}
        item={item}
        itemDimensions={itemDimensions}
        handleQuantityChange={(item, event) => this.handleQuantityChange(item, event)}
        handleDeleteItem={(item) => this.handleDeleteItem(item)}
        handleChange={panel => this.handleExpansionChange(panel)}
        state={this.state} />
    })
      : <Typography variant="caption" gutterBottom align="center">
        Please start adding items
        </Typography>;

    return (
      <List component="nav">
        {list}
      </List>
    );
  }

  /** 
   * Renders the component.
   */
  render() {
    return (
      this.renderSelectedItems()
    );
  }
}

/**
 * Maps the global state variables to local props.
 * 
 * @param {*} state 
 */
const mapStateToProps = state => {
  return {
    selectedItemObjects: state.calculator.selectedItemObjects,
    lastAddedItem: state.calculator.lastAddedItem
  }
}

const SelectedItemsList = connect(mapStateToProps, { removeItem, changeQuantity })(ConnectedList);
export default SelectedItemsList;