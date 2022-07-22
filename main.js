const request = require('request');
const axios = require('axios');
const json = require('json');
var lodash = require('lodash');
const API_TOKEN = ''

const config = {
  headers: {
    'X-Authorization': API_TOKEN,
  }
};

// So since this is async its really hard for my brain to understand but i think  i worked out a soluition
// so just the responce is async so if i create a way to generate the responce and pass is to a non async function
// this should fix all the issues im having right now

async function url() {
  var i = 1;
  let res_list = [];
  while (i < 60) {

    const url = 'https://app.uprightlabs.com/api/orders?page=' + i.toString() + '&per_page=40&sort=ordered_at.desc'
    const result = await data(url)
    res_list.push(result)
    i++
  }
  return new Promise((resolve, reject) => {
    resolve(res_list)
  });

}

function data(url) {
  return new Promise((resolve, reject) => {
    axios
      // search 150 Pages Max 100
      .get(url, config)

      .then(res => {
        resolve(res)
      });
  });
}

async function parse(date) {
  const response = await url()
  var x = 0;
  let subtotal = []
  let shipping = []
  while (x < response.length) {
    var singel_res = response[x]
    var single_data = singel_res['data']
    for (var i = 0; i < single_data['orders'].length; i++) {
      var order = single_data['orders']
      var single_order = order[i]

      var paid_at = single_order['paid_at']
      try {
        if (paid_at.includes(date)) {
          var market = single_order['market_name']
          var ship_total = single_order['shipping_total']
          var ship_dict = {}
          ship_dict[market] = ship_total;
          shipping.push(ship_dict)
          single_order['order_items'].forEach((item, i) => {

            var order_dict = {};
            var store_number_order_dict = {};
            order_dict[market] = item['total'];
            store_number_order_dict[item['store_name']] = order_dict;
            subtotal.push(store_number_order_dict)
          });
        }
      } catch (e) {
        var n = 'null'
      } finally {
        var n = 'null'
      }

    }

    x++
  }
  return new Promise((resolve, reject) => {
    var nested_data = [subtotal, shipping]
    resolve(nested_data)
  });
  // console.log(subtotal.length);
  // console.log(shipping);
}


async function sales_data() {
  const data = await parse('2022-07-21')
  var subtotal = data[0]
  var sub_price = []
  var shipping = data[1]
  var ship_price = []
  shipping.forEach((single_shipping) => {
    for (var key in single_shipping) {
      ship_price.push(parseInt(single_shipping[key]))
    }
  });

  // Totals
  subtotal.forEach((store) => {
    for (var key in store) {
      var price = store[key];
      for (var key in price) {
        sub_price.push(parseInt(price[key]))
      }
    }

  });
  var sum = sub_price.reduce(function(a, b) {
    return a + b;
  }, 0);
  var total_sales = sum


  var sum_shipping = ship_price.reduce(function(a, b) {
    return a + b;
  }, 0);
  var total_shipping = sum_shipping
  var items_sold = subtotal.length
  var ppl = total_sales / items_sold
  var roundedppl = ppl.toFixed(1);
  console.log('Total Sales: ' + total_sales);
  console.log('Total Shipping Revenue: ' + total_shipping);
  console.log('Items Sold: ' + items_sold);
  console.log('Daily PPL: ' + roundedppl);

}
sales_data()