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
  while (i < 5) {
    const url = 'https://app.uprightlabs.com/api/orders?page=' + i.toString() + '&per_page=5&sort=ordered_at.desc'
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

      if (single_order['paid_at'].includes(date)) {
        var market = single_order['market_name']
        // shipping total can stay the way it is but the total need to chance and the store number needs to be attached so itterate down one  in the dictuonary
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
    }

    x++
  }
  console.log(subtotal);
  console.log(shipping);
}
parse('2022-07-21')