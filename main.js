const request = require('request');
const axios = require('axios');
const json = require('json');
const regex = new RegExp("(.*)T", 'gm')
const str = `2022-07-19T19:58:40.000Z`;
let m;
const API_TOKEN =

  const config = {
    headers: {
      'X-Authorization': API_TOKEN,
    }
  };
var subtotal_list = []
var shipping_list = []
// for (let x = 0; x < 10; x++) {
//   let values = main(x);
//   console.log('RUNNTING');
// }
//paid at
let values = main(1, '2022-07-19');

function main(page, date) {
  axios
    // search 150 Pages Max 100
    .get('https://app.uprightlabs.com/api/orders?page=' + page + '&per_page=40&sort=ordered_at.desc', config)
    .then(res => {
      //  var test = JSON.parse(res)
      var data = res['data']['orders']
      // console.log(data['id']);
      for (let i = 0; i < data.length; i++) {
        var list = data[i]

        if (list['paid_at'].includes(date)) {
          console.log('YES');
        } else {
          console.log('NO');
        }
        subtotal_list.push(list['subtotal'])
        // console.log(list['paid_at']);
        // shipping_list.push(list['shipping_total'])
      }
      // console.log(shipping_list);
      // console.log(subtotal_list);
    })
};