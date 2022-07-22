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

// // TODO: Clean  up code, start next listing section
async function url() {
  var i = 1;
  let res_list = [];
  while (i < 3) {

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
  let shipped_orders = []
  while (x < response.length) {
    var singel_res = response[x]
    var single_data = singel_res['data']
    for (var i = 0; i < single_data['orders'].length; i++) {
      var order = single_data['orders']
      var single_order = order[i]


      var paid_at = single_order['paid_at']
      try {
        if (paid_at.includes(date)) {
          if (single_order['shipped_at'] != null) {
            shipped_orders.push(single_order['shipped_at'])
          }

          var market = single_order['market_name']
          var ship_total = single_order['shipping_total']
          var ship_dict = {}
          ship_dict[market] = ship_total;
          shipping.push(ship_dict)
          single_order['order_items'].forEach((item, i) => {

            var order_dict = {};
            var store_number_order_dict = {};
            order_dict[String(market)] = item['total'];
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
    var nested_data = [subtotal, shipping, shipped_orders]
    resolve(nested_data) // data here is nested and the subtotals have store numbers as keys ex: {store_num: {sgw: '10.99'}}
  });

}


async function sales_data() {
  const data = await parse('2022-07-22')
  var subtotal = data[0]
  var sub_price = []
  var sgw_sub_price = []
  var ebay_sub_price = []
  var shipped_order = data[2]
  var shipping = data[1]
  var ship_price = []
  shipping.forEach((single_shipping) => {
    for (var key in single_shipping) {
      ship_price.push(parseFloat(single_shipping[key]))
    }
  });

  // Totals
  subtotal.forEach((store) => {
    for (var key in store) {
      var price = store[key];
      // console.log(price);
      if (price['shopgoodwill']) {
        sgw_sub_price.push(parseFloat(price['shopgoodwill']))
      } else {
        ebay_sub_price.push(parseFloat(price['ebay']))
      }
      for (var key in price) {

        sub_price.push(parseFloat(price[key]))
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

  var sgw_sum = sgw_sub_price.reduce(function(a, b) {
    return a + b;
  }, 0);
  var total_sgw = sgw_sum

  var ebay_sum = ebay_sub_price.reduce(function(a, b) {
    return a + b;
  }, 0);
  var total_ebay = ebay_sum

  var items_sold = subtotal.length
  var ppl = total_sales / items_sold
  var roundedppl = ppl.toFixed(2);
  // ONCE DONE CREATE A PROMISE HERE FOR AUTO FILL FUNCTION
  console.log('Shipped Orders: ' + shipped_order.length);
  console.log('Total Sales: ' + total_sales.toFixed(2));
  console.log('Ebay Sales: ' + total_ebay.toFixed(2));
  console.log('SGW Sales: ' + total_sgw.toFixed(2));
  console.log('Total Shipping Revenue: ' + total_shipping.toFixed(2));
  console.log('Items Sold: ' + items_sold.toFixed(2));
  console.log('Daily PPL: ' + roundedppl);

}
sales_data()