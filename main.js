const request = require('request');
const axios = require('axios');
const json = require('json');
var lodash = require('lodash');
const API_TOKEN = ''
// SOMETHING IS DOUBLEING FIND AND FIX
const config = {
  headers: {
    'X-Authorization': API_TOKEN,
  }
};
var start_day = '2022-08-15'
var end_day = '2022-08-16'
let order_url = 'https://app.uprightlabs.com/api/reports/order_items?time_start=' + start_day + 'T05:00:00.247Z&time_end=' + end_day + 'T05:00:59.247Z'

function data(url) {
  return new Promise((resolve, reject) => {
    axios
      .get(url, config)
      .then(res => {
        resolve(res)
      });
  });
}

async function parse() {
  const response = await data(order_url)
  response['data']['data'].forEach((order) => {
    console.log(order);
  });

}
parse()
const listing_url = 'https://app.uprightlabs.com/api/reports/productivity/user?time_start=2022-07-18&time_end=2022-07-18&hide_inactive_users=true'
const url_t = 'https://app.uprightlabs.com/api/reports/paid_orders?time_start=2022-06-01T00:00:00.247Z&time_end=2022-06-01T23:30:13.247Z%27&payment_status=PAID'
// listing(url_t)
