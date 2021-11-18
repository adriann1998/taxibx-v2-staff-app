import React, { useState, useEffect } from 'react';
import { makeStyles } from '@material-ui/core';
import { gql, useQuery } from '@apollo/client';
import {
  Typography,
  Divider,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Paper,
} from '@material-ui/core';
import PostcodeAutocomplete from "./PostcodeAutocomplete";
import { 
  PostcodeData, 
  PostcodeOption,
  StorageDuration,
} from '../../types';


const ZoneCalculator = () => {

  const classes = useStyles();
  const [postcodes, setPostcodes] = useState<PostcodeOption[]>([]);
  const [duration, setDuration] = useState<StorageDuration>(0);
  const [deliveryPostcode,setDeliveryPostcode] = useState<PostcodeData>();
  const [redeliveryPostcode, setRedeliveryPostcode] = useState<PostcodeData>();
  const [firstDeliveryPrice, setFirstDeliveryPrice] = useState<number>();
  const [nextDeliveryPrice, setNextDeliveryPrice] = useState<number>();

  // Postcodes query
  const { data } = useQuery<GetPostcodesData>(GET_POSTCODES);

  useEffect(() => {
    if (data?.getPostcodes) {
      const postcodes = data.getPostcodes;
      const postcodesOptions: PostcodeOption[] = postcodes.map(postcode => {
        // add # if secondary facility
        const modifiedHint = postcode.hint + (postcode.facility === 'SECONDARY' ? ' #' : "")
        return {
          label: modifiedHint, 
          postcode: {
            ...postcode,
            hint: modifiedHint
          },
        }
      })

      // add city options L001, L002, L003 in case user does not know the exact address
      const extraCityCodes = ['L001', 'L002', 'L003'];
      const extraCityNames = ['Melbourne', 'Sydney', 'Brisbane'];
      const extraPostcodes = [3000, 2000, 4000];
      for (let i = 0; i < extraCityCodes.length; i++) {
        const hint = `${extraCityCodes[i]} - ${extraCityNames[i]}`;
        postcodesOptions.push({
          label: hint,
          postcode: {
            CBD: true,
            facility: "PRIMARY",
            hint: hint,
            issue: "",
            marginal: false,
            name: extraCityNames[i],
            postcode: extraPostcodes[i],
            zone: 1,
          }
        });
      };
      setPostcodes(postcodesOptions);
    }
  }, [data]);

  // get price
  let variables;
  if (
    deliveryPostcode &&
    redeliveryPostcode &&
    duration !== undefined
  ) {
    variables = {
      qty: 1,
      postcode1: deliveryPostcode.postcode,
      postcode2: redeliveryPostcode.postcode,
      duration: duration,
    }
  }

  const quoteResult = useQuery<
    GetQuoteData,
    GetQuoteVars
  >(GET_QUOTE, {
    variables,
    skip: !variables,
  });

  useEffect(() => {
    if (quoteResult.data) {
      const peakPrice = quoteResult.data.quote.redelivery.total - quoteResult.data.quote.redelivery.price[0];
      const redelPrice = quoteResult.data.quote.redelivery.price.map(x => x + peakPrice);
      setFirstDeliveryPrice(redelPrice[0]);
      setNextDeliveryPrice(redelPrice[1]);
    }
  }, [quoteResult]);

  return (
    <div className={classes.root}>
      <Typography variant="h4">Zone Calculator</Typography><br />
      <Divider />
      <Grid container spacing={2} style={{marginTop: '20px'}}>
        <Grid item xs={6}>
          <Grid container spacing={2} >
            <Grid item xs={12}>
              <FormControl style={{width: '95%', marginBottom: '30px'}}>
                <InputLabel id="storage-duration-label">Storage Duration</InputLabel>
                <Select
                  labelId="storage-duration-label"
                  id="storage-duration"
                  value={duration}
                  label="Duration"
                  onChange={(ev) => setDuration(ev.target.value as StorageDuration)}
                >
                  {storageDurationMenuItems.map(item => (
                    <MenuItem value={item.value} key={`storageduration-menu-item-${item.value}`}>{item.label}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={6}>
              <PostcodeAutocomplete
                suggestions={postcodes}
                // selectedPostcode={state.deliveryPostcode}
                label={"Delivery Postcode/Suburb"}
                select={(newSelection) => setDeliveryPostcode(newSelection)}
              />
            </Grid>
            <Grid item xs={6}>
              <PostcodeAutocomplete
                suggestions={postcodes}
                // selectedPostcode={state.redeliveryPostcode}
                label={"Re-delivery Postcode/Suburb"}
                select={(newSelection) => setRedeliveryPostcode(newSelection)}
              />
            </Grid>
          </Grid>
        </Grid>
        <Grid item xs={6}>
          {deliveryPostcode && (
            <Typography className={classes.result}>
              <b>{deliveryPostcode.hint}</b> <br/>
              Zone: {deliveryPostcode ? deliveryPostcode.zone : ''}
              <Typography className={classes.issues}>
                {deliveryPostcode.issue}
              </Typography>
              <Typography className={classes.issues}>
                {deliveryPostcode.marginal ? 'Not all suburbs in this postcode is supported' : ''}
              </Typography>
            </Typography>
          )}
          <br /> <br />
          {redeliveryPostcode && (
            <Typography className={classes.result}>
              <b>{redeliveryPostcode.hint}</b> <br/>
              Zone: {redeliveryPostcode ? redeliveryPostcode.zone : ''}
              <Typography className={classes.issues}>
                {redeliveryPostcode.issue}
              </Typography>
              <Typography className={classes.issues}>
                {redeliveryPostcode.marginal ? 'Not all suburbs in this postcode is supported' : ''}
              </Typography>
            </Typography>
          )}
          <Paper style={{marginTop: '20px'}}>
            {firstDeliveryPrice !== undefined && (
              <Typography className={classes.price}>
                1st: ${firstDeliveryPrice}
              </Typography>
            )}
            {nextDeliveryPrice !== undefined && (
              <Typography className={classes.price}>
                Thereafter: ${nextDeliveryPrice}
              </Typography>
            )}
          </Paper>
        </Grid>
      </Grid>
    </div >
  );
}

// ============================================================================
// Styles
// ============================================================================

const useStyles = makeStyles((theme) => ({
  root: {
    flexGrow: 1,
  },
  result: {
    fontSize: 22,
  },
  issues: {
    fontSize: 18,
    color: 'red',
  },
  price: {
    fontSize: 18,
    color: 'blue',
  }
}));

// ============================================================================
// Queries
// ============================================================================
type GetPostcodesData = {
  getPostcodes: PostcodeData[];
};

export const GET_POSTCODES = gql`
  query GetPostcodes {
    getPostcodes {
      postcode
      name
      zone
      hint
      facility
      issue
      marginal
      CBD
    }
  }
`

interface GetQuoteData {
  quote: {
    redelivery: {
      price: number[];
      total: number;
    };
  };
};

interface GetQuoteVars {
  qty: number;
  postcode1: number;
  postcode2: number;
  duration?: number;
}

const GET_QUOTE = gql`
  query GetQuote(
    $qty: Int!
    $postcode1: Int!
    $postcode2: Int
    $duration: Int
  ) {
    quote(
      qty: $qty
      postcode1: $postcode1
      postcode2: $postcode2
      duration: $duration
      type: "TB-A"
      service: "mss"
    ) {
      redelivery {
        price
        total
      }
    }
  }
`;

// ============================================================================
// Helpers
// ============================================================================

interface StorageDurationMenuItem {
  label: string;
  value: StorageDuration;
};

const storageDurationMenuItems: StorageDurationMenuItem[] = [
  {label: '0-3 months', value: 0},
  {label: '3-12 months', value: 3},
  {label: '12+ months', value: 12},
];

export default ZoneCalculator;