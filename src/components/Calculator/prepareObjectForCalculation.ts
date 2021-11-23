import {
  CalculatorItem,
} from '../../types';

/**
 * Prepares the selected items for calculation.
 * 
 * @param {*} items 
 */
const prepareObjectForCalculation = async (items: CalculatorItem[]) => {
  // Prepare date
  const currentDate = new Date();
  const formatttedDate = currentDate.toLocaleDateString("en-AU");
  // Generate a load ID with the current timestamp.
  const loadId = "TAXIBOX" + Date.now();

  // Load the fromatted request object.
  const promise = new Promise((resolve, reject) => {
    loadObjects(items, loadId)
      .then(products => {
        if (products && products.details && products.quantities) {
          const preparedObject = {
            "cubeiq":
            {
              "containers":
              {
                "container":
                  [
                    {
                      "containerid": "TAXIBOX",
                      "depth": 232.00000,
                      "width": 146.00000,
                      "height": 198.00000,
                      "maxweight": 1000.0000,
                      "settingsid": "Box Default",
                      "type": "Rectangular",
                      "bottomtotoploading": false,
                      "partialloadonfloor": true
                    }
                  ]
              }
              ,
              "settings":
              {
                "setting":
                  [
                    {
                      "settingsid": "Box Default",
                      "maxruntime": 60,
                      "maxnonimproveiters": 750,
                      "sequencemixok": true,
                      "singleunitblocks": true
                    }
                  ]
              }
              ,
              "products":
              {
                "product": products.details
              },
              "loads":
              {
                "load":
                  [
                    {
                      "loadid": loadId,
                      "notes": "TAXIBOX Load",
                      "date": formatttedDate
                    }
                  ]
              }
              ,
              "stages":
              {
                "stage":
                  [
                    {
                      "loadid": loadId,
                      "stage": 1,
                      "containerselectionrule": 3
                    }
                  ]
              }
              ,
              "containerstoload":
              {
                "containertoload":
                  [
                    {
                      "loadid": loadId,
                      "containerid": "TAXIBOX",
                      "containernum": 999999
                    }
                  ]
              }
              ,
              "productstoload":
              {
                "producttoload": products.quantities
              }
            }
          };
          resolve(preparedObject);
        }
      });
  });
  return await promise;
}

/**
 * Prepares the selected objects for the "products", "productstoload" parameter of the request object.
 * 
 * @param {*} items 
 * @param {*} loadId 
 */
const loadObjects = async (items: CalculatorItem[], loadId: string) => {
  const products: {
    details: ProductDetail[],
    quantities: ProductQuantity[],
  } = {
    details: [],
    quantities: [],
  };
  for (let item of items) {
    products.details.push({
      productid: item.id,
      length: item.depth,
      width: item.width,
      height: item.height,
      weight: null,
      turnable: true,
      flatok: true,
      sideupok: item.restriction && (item.restriction === 'Can be flipped' || item.restriction === 'Wall') ? true : false,
      endupok: item.restriction && (item.restriction === 'Can be flipped' || item.restriction === 'Wall') ? true : false,
      bottomonly: item.restriction && item.restriction === 'No stack' ? true : false,
      toponly: false,
      maxinlayer: 999999,
      stackindex: 2,
      type: item.type ? item.type : "box",
      color: 16760576
    });
    products.quantities.push({
      loadid: loadId,
      productid: item.id,
      batch: 1,
      quantity: item.quantity ? item.quantity : 1,
    });
  }
  return products;
};

interface ProductDetail {
  productid: string;
  length: number;
  width: number;
  height: number;
  weight: number | null;
  turnable: boolean;
  flatok: boolean;
  sideupok: boolean;
  endupok: boolean;
  bottomonly: boolean;
  toponly: boolean;
  maxinlayer: number;
  stackindex: number;
  type: string;
  color: number;
};

interface ProductQuantity {
  loadid: string;
  productid: string;
  batch: number;
  quantity: number;
};

export default prepareObjectForCalculation;