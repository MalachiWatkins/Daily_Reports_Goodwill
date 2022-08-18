const request = require('request');
const axios = require('axios');
const json = require('json');
const API_TOKEN = ''
const config = {
  headers: {
    'X-Authorization': API_TOKEN,
  }
};

// so Month to date calc will start with aug 1 and end with the current day +1
var start_day = '18' // start day is the day you want to search
var start_month = '08'
var start_year = '2022'

var end_day = '19' // end day  always needs to be start_day +1
var end_month = '08'
var end_year = '2022'

var start_string = start_year + '-' + start_month + '-' + start_day
var end_string = end_year + '-' + end_month + '-' + end_day

let order_url = 'https://app.uprightlabs.com/api/reports/order_items?time_start=' + start_string + 'T05:00:00.247Z&time_end=' + end_string + 'T05:00:59.247Z'

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
  var sgw_sub = []
  var ebay_sub = []
  var shipping_sub = []
  var main_data = {
    "eBay": ebay_sub,
    "SGW": sgw_sub,
    "shipping": shipping_sub,
    "Meta": {
      'Items_sold': response['data']['data'].length
    }
  }
  response['data']['data'].forEach((order) => {
    var store_supplier = order['supplier'] // also need shipping subtotal
    shipping_sub.push(parseFloat(order['order_shipping_total']))
    if (order['channel'] == 'eBay') {
      var data_dict = {
        [store_supplier]: order['order_subtotal']
      }
      ebay_sub.push(data_dict)
    } else {
      var data_dict = {
        [store_supplier]: order['order_subtotal']
      }
      sgw_sub.push(data_dict)
    }
  });
  return new Promise((resolve, reject) => {
    resolve(main_data);
  });

}

async function parse_2() {
  const unproc_data = await parse()
  var ebay_sub = []
  var sgw_sub = []
  unproc_data['eBay'].forEach((item) => {
    for (var key in item) {
      ebay_sub.push(parseFloat(item[key]));
    }
  });
  unproc_data['SGW'].forEach((item) => {
    for (var key in item) {
      sgw_sub.push(parseFloat(item[key]));
    }
  });
  var sgw_sum = sgw_sub.reduce(function(a, b) {
    return a + b;
  }, 0);
  var ebay_sum = ebay_sub.reduce(function(a, b) {
    return a + b;
  }, 0);
  var shipping_sum = unproc_data['shipping'].reduce(function(a, b) {
    return a + b;
  }, 0);
  var total_sales = parseFloat(sgw_sum) + parseFloat(ebay_sum)
  var meta = unproc_data['Meta']
  var ppl = total_sales.toFixed(2) / meta['Items_sold']
  console.log('Items Sold: ' + meta['Items_sold']);
  console.log('PPL: ' + ppl.toFixed(2));
  console.log('Total Shipping Revenue: ' + shipping_sum.toFixed(2));
  console.log('Total Sales: ' + total_sales.toFixed(2));
  console.log('Total SGW Sales: ' + sgw_sum.toFixed(2));
  console.log('Total eBay Sales: ' + ebay_sum.toFixed(2));
}
var oper_url = 'https://app.uprightlabs.com/api/reports/productivity/operational?interval=day&time_start=' + start_string + 'T00:00:00.247Z&time_end=' + end_string + 'T23:59:13.247Z'
async function operation() {
  const response = await data(oper_url)
  console.log("Postings: " + response['data']['data'][0]['posted']);
  console.log('Orders Shipped: ' + response['data']['data'][0]['shipped']);
  console.log('Avg Posting per lister: ' + parseInt(response['data']['data'][0]['posted']) / 5);
}

var sgw_listings_url = 'https://app.uprightlabs.com/api/reports/listings/shopgoodwill?time_start=2022-07-15T00:00:00.247Z&time_end=' + end_string + 'T21:30:13.247Z'
var ebay_listing_url = 'https://app.uprightlabs.com/api/reports/listings/ebay?time_start=2022-07-15T00:00:00.247Z&time_end=' + end_string + 'T21:30:13.247Z'
async function active_listings(url) {
  const response = await data(url)
  var state_dict = {}
  var active_list = [];
  var inactive_list = []
  var list = response['data']['data'];
  list.forEach((listing) => {
    if (listing['state'] == "LISTED") { //
      active_list.push(listing['state'])
    }
  });
  if (url == ebay_listing_url) {
    console.log("Ebay Active Listings: " + active_list.length);
    total_units_shelved.push(active_list.length)
  } else {
    console.log("Shop Good WIll Active Listings: " + active_list.length);
    total_units_shelved.push(active_list.length)
  }

}

operation()
parse_2()

active_listings(sgw_listings_url)
active_listings(ebay_listing_url)

const listing_url = 'https://app.uprightlabs.com/api/reports/productivity/user?time_start=2022-07-18&time_end=2022-07-18&hide_inactive_users=true'
const url_t = 'https://app.uprightlabs.com/api/reports/paid_orders?time_start=2022-06-01T00:00:00.247Z&time_end=2022-06-01T23:30:13.247Z%27&payment_status=PAID'
// listing(url_t)