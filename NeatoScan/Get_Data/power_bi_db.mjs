import {
    createRequire
} from 'module';
import {
    log
} from 'console';
const require = createRequire(
    import.meta.url);
const {
    Pool
} = require('pg');
const pool = new Pool({
    user: '',
    database: '',
    port: 1,
    host: '', // Local Ip Nice Try
})
const axios = require('axios');
function getRandomInt(max) {
  return Math.floor(Math.random() * max);
}

async function report(){
  axios.get('http://3.145.105.87:2000/data')
  .then(response => {
    const data = response['data']
    var store_list = []
    data.forEach(async element => {
        if (element['Report'] == "orders"){
          const del = await pool.query('DELETE FROM power_bi_report_orders;')
          const res = await pool.query(
            "INSERT INTO power_bi_report_orders (rand,date_type, type, total_sales, sgw_sales, ebay_sales, orders, ppi, shipping_cost, shipping_rev ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9,$10)",
            [getRandomInt(2000).toString(),element['Date_Type'], 'Auction', element['Total_sales'].toFixed(2).toString(), element['SGW_Sales'].toString(),element['Ebay_Sales'].toString(), element['Total_orders'].toString(),  element['PPI'].toString(),element['shipping']['Cost'][0].toString(),element['shipping']['Rev'][0].toString()]
        );
        }else if (element['Report'] == "books_orders"){
          const del = await pool.query('DELETE FROM power_bi_report_orders;')
          const res = await pool.query(
            "INSERT INTO power_bi_report_orders (rand,date_type, type, total_sales, sgw_sales, ebay_sales, orders, ppi, shipping_cost, shipping_rev ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9,$10)",
            [getRandomInt(20).toString(),element['Type'], 'Book', element['Total_sales'].toFixed(2).toString(), element['SGW'].toFixed(2).toString(),element['Ebay'].toFixed(2).toString(), element['items_sold'].toString(),  element['PPI'].toFixed(2).toString(),element['shipping_cost'].toFixed(2).toString(),element['shipping_rev'].toFixed(2).toString()]
        );
        }else if(element['Report'] == "store_par"){
          // build dict here of what i need then push it 
          store_list.push(element)
        }
    });
    // Any Reports that need more than one document from the api need to be built and incerted here
    console.log(store_list);
  })
  .catch(error => {
    console.log(error);
  });

}
report()