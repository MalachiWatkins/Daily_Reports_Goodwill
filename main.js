const request = require('request');
const axios = require('axios');
const json = require('json');
var lodash = require('lodash');
const regex = new RegExp("(.*)T", 'gm')
const API_TOKEN =

  const config = {
    headers: {
      'X-Authorization': API_TOKEN,
    }
  };
var subtotal_list = []
var shipping_list = []

//paid at
// let values = main(1, );

function main(page, date) {
  return new Promise((resolve, reject) => {
    const url = 'https://app.uprightlabs.com/api/orders?page=' + page + '&per_page=40&sort=ordered_at.desc'
    axios
      // search 150 Pages Max 100
      .get(url, config)

      .then(res => {
        // console.log(page);
        //  var test = JSON.parse(res)
        var data = res['data']['orders']
        // console.log(data['id']);
        for (let i = 0; i < data.length; i++) {
          var list = data[i]

          if (list['paid_at'].includes(date)) {
            subtotal_list.push(parseInt(list['subtotal']))
            // console.log(list['subtotal']);
          }

          // console.log(list['paid_at']);
          // shipping_list.push(list['shipping_total'])

        }
        var sum = subtotal_list.reduce(function(a, b) {
          return a + b;
        }, 0);
        var total_sales = sum
        if (page = 7) {
          console.log(subtotal_list);
        }
        // console.log(total_sales);
        resolve(total_sales)
        // console.log(shipping_list);
        // console.log(subtotal_list);
      })
  })
};
var data_list = []
async function data(p) {

  //3. Await for the first function to complete
  const result = await main(p, '2022-07-20')
  // console.log(result);
};
// data(8)
for (let x = 6; x < 8; x++) {
  let values = data(x);
}