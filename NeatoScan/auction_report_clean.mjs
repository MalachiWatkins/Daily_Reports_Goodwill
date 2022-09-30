import {
    Client_User_Name,
    Token,
    SOAP_Header_CONTENT_TYPE,
    SOAP_Header_Host_Config,
    USER_AGENT,
    SOAP_actions,
    SOAP_Content_len,
    SOAP_urls,
    NIM_User,
    NIM_Password,
    daily_start,
    daily_end,
    MTD_Start,
    MTD_END,
    Neat_start_day
} from './config.js';
import {
    createRequire
} from 'module';
const require = createRequire(
    import.meta.url);
const axios = require('axios-https-proxy-fix');
const soapRequest = require('easy-soap-request');
var fs = require('fs'),
    parseString = require("xml2js").parseString,
    xml2js = require("xml2js");
const { JSDOM } = require("jsdom");
const { window } = new JSDOM();
var start = window.performance.now();

// XML File Locations Put this in config file
var Request_Auction_Order = '/Users/malachiwatkins/Desktop/work/Daily_Reports_Goodwill/NeatoScan/xml_files/Auction_order.xml'
//'/home/malachi/Desktop/Projects/Daily_Reports_Goodwill/NeatoScan/xml_files/Auction_order.xml'
var Request_Auction_Inv = '/Users/malachiwatkins/Desktop/work/Daily_Reports_Goodwill/NeatoScan/xml_files/auction_inventory.xml'
//'/home/malachi/Desktop/Projects/Daily_Reports_Goodwill/NeatoScan/xml_files/auction_inventory.xml'
var Authenticate_xml = '/Users/malachiwatkins/Desktop/work/Daily_Reports_Goodwill/NeatoScan/xml_files/auction_auth.xml'
//'/home/malachi/Desktop/Projects/Daily_Reports_Goodwill/NeatoScan/xml_files/auction_auth.xml'
var Request_Auction_Activity = '/Users/malachiwatkins/Desktop/work/Daily_Reports_Goodwill/NeatoScan/xml_files/auction_activity.xml'
var Request_Auction_Container_details = '/Users/malachiwatkins/Desktop/work/Daily_Reports_Goodwill/NeatoScan/xml_files/auction_container_details.xml'
var Request_Auction_Refunds = '/Users/malachiwatkins/Desktop/work/Daily_Reports_Goodwill/NeatoScan/xml_files/auction_refunds.xml'
                                                                                                             


const url_auctions = SOAP_urls['Auction_Url']; // Main Book URL


// Auth Function
async function AuctionreqAuth(url, xml, CL, type) {
    const USER_Headers = {
        headers: {
            "User-Agent": USER_AGENT,
            'Content-Type': SOAP_Header_CONTENT_TYPE['Auction_Content_Type'],
            'Host': SOAP_Header_Host_Config['Books_Host'],
            "Content-Length": SOAP_Content_len[CL],
            'Expect': '100-continue',
            'Connection': 'Keep-Alive'
        }
    }
    return new Promise((resolve, reject) => {
        axios.post(url, xml, USER_Headers).then(response => {
            parseString(response.data, async function (err, result) {
                if (type == 'auth') {
                    // resolve(response['data']);
                    parseString(response['data'], async function (err, result) {
                        var json = result;
                        // var neat_token = json['s:Envelope']['s:Body'][0]['Authenticate'][0];
                        var auth_res = json['s:Envelope']['s:Body'][0]['AuthenticateResponse'][0]['AuthenticateResult'][0];
                        var neat_token = auth_res['b:NeatoTokenID']
                        var expire_time = auth_res['b:Expires'];
                        var session_guid = auth_res['b:Info'][0]['b:SessionGuid'];
                        var auth_package = {
                            'neat_token': neat_token,
                            'expire': expire_time,
                            'guid': session_guid,
                        }
                        resolve(auth_package)

                    });
                }
            });
        }).catch(err => {
            console.log(err)
        });
    });
}
// Parses Auth Response Into Authentication Package
async function authFIleparse() {
    return new Promise((resolve, reject) => {
        fs.readFile(Authenticate_xml, "utf-8", function (err, data) {
            parseString(data, async function (err, result) {
                var json = result;
                var auth_pkg = json['s:Envelope']['s:Body'][0]['Authenticate'][0];
                var pkg_user = auth_pkg['username'] = NIM_User
                var pkg_client = auth_pkg['clientUsername'] = Client_User_Name
                var pkg_pass = auth_pkg['password'] = NIM_Password
                var builder = new xml2js.Builder();
                const xml = builder.buildObject(json);
                const auth_response = await AuctionreqAuth(url_auctions, xml, 'Auctions_Report_Content_Len', 'auth')
                console.log('Authenticated!');
                resolve(auth_response);
            });

        });
    });
}


// Adds Authentication to XML Soap Envelope
async function AuctionSoapEnv(SOAPENV, type, start, end) {
    return new Promise((resolve, reject) => {
        fs.readFile(SOAPENV, "utf-8", function (err, data) {
            parseString(data, async function (err, result) {
                const authentication_package = await authFIleparse()
                var json = result;
                const reqtype = json['s:Envelope']['s:Body'][0][type][0];
                const token = reqtype['token'][0];
                const market_places = reqtype['token'][0]['b:Marketplaces'][0]['b:Marketplace'];
                var Auth_date_start = reqtype['start'] = start
                var Auth_date_end = reqtype['end'] = end
                var Cli_User = token['b:ClientUserName'] = Client_User_Name
                var Neat_token = token['b:NeatoTokenID'] = authentication_package['neat_token']
                var NimUser = token['b:UserName'] = NIM_User
                var NimPass = token['b:UnsecurePassword'] = NIM_Password
                var Expire = token['b:Expires'] = authentication_package['expire']
                var session_guid = token['b:Info'][0]['b:SessionGuid'] = authentication_package['guid']
                // Market Place Will Always Have 3 in the list
                var ebay_user = market_places[0]['b:UserName'] = Client_User_Name
                var ShopGoodWill_user = market_places[1]['b:UserName'] = Client_User_Name
                var eBayAuction_user = market_places[2]['b:UserName'] = Client_User_Name
                var builder = new xml2js.Builder();
                const xml = builder.buildObject(json);
                resolve(xml)
            });

        });
    });
}
// Request from SOAP Endpoint 
async function AuctionRequest(Request_xml, type,start, end) {
    return new Promise(async (resolve, reject) => {
        // ALL THIS CAN BE CONDENCED DOWN TO ONE XML FILE A FEW KEYS NEED CHANGEING
        const soap_data = await AuctionSoapEnv(Request_xml, type, start, end)
        console.log('Request Envelope Ready');
        // ALL That needs to be done is to change headers to pull from config and thats it
        // Long Issue over GUID cuz me no smart sometimes and brain != workin
        const USER_Headers = {
            headers: {
                'User-Agent': USER_AGENT,
                'Content-Type': SOAP_Header_CONTENT_TYPE['Auction_Content_Type'],
                'Host': SOAP_Header_Host_Config['Books_Host'],
                "Content-Length": SOAP_Content_len['Auctions_Report_Content_Len'],
                "Expect": "100-continue",
                "Connection": "Keep-Alive"
            }
        }
        axios.post(url_auctions, soap_data, USER_Headers).then(response => {
            resolve(response)            
        })
    });
}


// parse auction order Responce
async function OrderAucion_parse(start, end) {
    // Daily And Monthly
    const request_resp = await AuctionRequest(Request_Auction_Order, 'Orders',start, end)
    var resp_data = request_resp['data']
    parseString(resp_data, async function (err, result) {
        var json = result;
        var orders = json['s:Envelope']['s:Body'][0]['OrdersResponse'][0]['OrdersResult'][0]['diffgr:diffgram'][0]['DocumentElement'][0]['Orders']
        // Order Example 
        var ord_exam = {
            '$': { 'diffgr:id': 'Orders1017', 'msdata:rowOrder': '1016' },
            itemID: [ '68348' ],
            Sku: [ 'NS41-001GQK' ],
            externalItemID: [ '151373648' ],
            Title: [ 'Nike Golf Forged Titanium 9.5° Driver Regular Flex Mid Kick' ],
            Source: [ 'Goodwill on North Oak' ],
            addTime: [ '2022-09-08T12:31:00' ],
            startTime: [ '2022-09-08T12:31:00' ],
            endTime: [ '2022-09-14T03:43:00' ],
            orderID: [ '' ],
            orderItemID: [ '' ],
            externalOrderID: [ '38417210' ],
            externalOrderItemID: [ '151373648' ],
            createdDate: [ '2022-09-16T00:58:51' ],
            DateSold: [ '2022-09-16T00:58:51' ],
            DatePaid: [ '2022-09-16T01:00:34' ],
            fulfillmentLevel: [ 'Pickup' ],
            addressLine1: [ '' ],
            addressLine2: [ '' ],
            addressLine3: [ '' ],
            city: [ '' ],
            state: [ '' ],
            zip: [ '' ],
            country: [ 'United States' ],
            salesAmount: [ '17.00' ],
            shippingActual: [ '0.00' ],
            shippingEstimated: [ '0.00' ],
            processingFee: [ '0.00' ],
            salesTax: [ '1.42' ],
            handlingTax: [ '0.25' ],
            shippingTax: [ '0.00' ],
            donation: [ '0.00' ],
            totalTax: [ '1.67' ],
            itemHandling: [ '2.99' ],
            grossItemSale: [ '19.99' ],
            grossOrderSale: [ '21.66' ],
            auctionType: [ 'SGW' ],
            category: [ 'Sports' ],
            categoryBreadcrumb: [ 'Sports>Sporting Equipment>Golf' ],
            timesListedToSell: [ '1' ],
            listingProfile: [ 'SGW General Wares (Non-Bulky)' ],
            orderItemStatusID: [ '3' ],
            orderItemStatus: [ 'Awaiting Pickup' ]
          }

        var store_report = {}
        var total_orders = [0]
        var total_subtotal = {
            'SGW': [0.00],
            'eBay': [0.00],
        }
        var shipping = {
            'Cost': [0],
            'Rev': [0],
        }
        var x = 0 
        var user_report = {
        }
        while (x<orders.length) {
            var single_order_status = orders[x]['orderItemStatus'] 
            if (typeof single_order_status !== 'undefined') {
                if (single_order_status != 'Unpaid' || single_order_status != 'Canceled') {
                    var date_paid_check = orders[x]['DatePaid']
                    if (typeof date_paid_check != 'undefined') {
                        var sku = orders[x]['Sku'][0]
                        var source = orders[x]['Source'][0]
                        var date_paid = date_paid_check[0]
                        var auction_type = orders[x]['auctionType'][0]
                        var sales_ammount = orders[x]['salesAmount'][0]
                        var shipping_rev = orders[x]['shippingEstimated'][0]
                        var shipping_cost = orders[x]['shippingActual'][0]
                        // Eveything below needs to be daily and monthly
                        function add_to_order(total_orders) {
                            var add_ord_to_total = parseInt(total_orders[0]) + 1
                            total_orders[0] = [ parseInt(add_ord_to_total)]
                        }
                        function Total_subtotal(auction_type, sub) {
                            var add_subtotal = parseFloat(total_subtotal[auction_type.toString()][0]) + parseFloat(sub)
                            total_subtotal[auction_type.toString()] = [add_subtotal.toFixed(2)]
                        }
                        function Total_ship(type, num) {
                            var add = parseFloat(shipping[type]) + parseFloat(num)
                            shipping[type] = [add.toFixed(2)]
                        }
                        Total_ship('Cost',shipping_cost )
                        Total_ship('Rev',shipping_rev )
                        add_to_order(total_orders)
                        Total_subtotal(auction_type, sales_ammount)
                        // Store Report // Daily and MTD
                        if (typeof store_report[source] == 'undefined') { // If source not a key in dict
                            store_report[source] = {}
                            if (typeof store_report[source][auction_type] == 'undefined') { // Sets innital Value
                                store_report[source][auction_type] = {
                                        'Total_Orders': [0],
                                        'sub': [parseFloat(sales_ammount)],
                                        'ship_rev': [parseFloat(shipping_rev)],
                                        'ship_cost':[parseFloat(shipping_cost)],
                                }

                            }else { // if value exists already adds next value and sets it as the new arr 

                                var new_order_total = store_report[source][auction_type]['Total_Orders'][0] + 1
                                store_report[source][auction_type]['Total_Orders'] = [new_order_total]

                                var New_sum_sub = store_report[source][auction_type]['sub'][0] + parseFloat(sales_ammount)
                                store_report[source][auction_type]['sub'] = [parseFloat(New_sum_sub.toFixed(2))]

                                var New_sum_ship_rev = store_report[source][auction_type]['ship_rev'][0] + parseFloat(sales_ammount)
                                store_report[source][auction_type]['ship_rev'] = [parseFloat(New_sum_ship_rev.toFixed(2))]

                                var New_sum_ship_cost = store_report[source][auction_type]['ship_cost'][0] + parseFloat(sales_ammount)
                                store_report[source][auction_type]['ship_cost'] = [parseFloat(New_sum_ship_cost.toFixed(2))]
                            }
                        } else { // if source already found 
                            if (typeof store_report[source][auction_type] == 'undefined') { // checks if acution found
                                store_report[source][auction_type] = {
                                    'Total_Orders': [0],
                                    'sub': [parseFloat(sales_ammount)],
                                    'ship_rev': [parseFloat(shipping_rev)],
                                    'ship_cost':[parseFloat(shipping_cost)],
                                }
                            }else {
                                var new_order_total = store_report[source][auction_type]['Total_Orders'][0] + 1
                                store_report[source][auction_type]['Total_Orders'] = [new_order_total]

                                var New_sum = store_report[source][auction_type]['sub'][0] + parseFloat(sales_ammount)
                                store_report[source][auction_type]['sub'] = [parseFloat(New_sum.toFixed(2))]

                                var New_sum_ship_rev = store_report[source][auction_type]['ship_rev'][0] + parseFloat(sales_ammount)
                                store_report[source][auction_type]['ship_rev'] = [parseFloat(New_sum_ship_rev.toFixed(2))]

                                var New_sum_ship_cost = store_report[source][auction_type]['ship_cost'][0] + parseFloat(sales_ammount)
                                store_report[source][auction_type]['ship_cost'] = [parseFloat(New_sum_ship_cost.toFixed(2))]
                            }
                        }
                        // User Report
                       // SELECT first_name FROM customer WHERE sku = '';
                       var query = "SELECT user_name FROM activity WHERE sku = '"
                       var query_sku = query  + sku + "'"
                       const find_lister = await pool.query(query_sku,
                      );
                      const lister_user_name = find_lister.rows[0]['user_name']
                      if (typeof user_report[lister_user_name.trim()] == 'undefined') {
                        user_report[lister_user_name.trim()] = [parseFloat(sales_ammount), 1]
                      } else {
                        var user_rev_sum =  user_report[lister_user_name.trim()][0] + parseFloat(sales_ammount)
                        var user_orders =  user_report[lister_user_name.trim()][1] + 1
                        user_report[lister_user_name.trim()] = [parseFloat(user_rev_sum.toFixed(2)), user_orders]
                      }
                    }
                }
            }
            x++ 
        }
        // User PPI
        var pased_user_dict = {}
        for (const [key, value] of Object.entries(user_report)) {
            var user_ppi = value[0] / value[1]
            pased_user_dict[key] = [value[0] ,value[1], user_ppi.toFixed(2)]
          }
        // User, Order, And store Rport
        var total_subtotal = parseFloat(total_subtotal['SGW'][0]) + parseFloat(total_subtotal['eBay'][0])
        var ppi = total_subtotal / total_orders[0][0]
        console.log(ppi);
        console.log(total_subtotal);
        console.log(total_orders);
        console.log(shipping);
        console.log(store_report);
        console.log(pased_user_dict);

    });
    var end = window.performance.now();
    console.log(`Execution time: ${end - start} ms`);
}

OrderAucion_parse(daily_start,daily_end) 
// var section = ```
// Start Top Left of report
// if section requiers a new function or diffrent request then mark here 
// """
// Daily Postings
// Avg Posting Per Lister
// Orders Shipped
// Active SGW and eBay listings
// Daily Budeget Needs to Be Set By Kristen Monthly Through the reporting Software
// MTD Budeget Needs to Be Set By Kristen Monthly Through the reporting Software
// Buget Variance
// Daily Inventory (My api)
// MTD Postings
// MTD PPI
// Sell Throu Rate
// MTD Refund Subtotal
// Refund % of Sales
// MTD Shiped Orders 
// MTD Shipping Cost
// Avg Cost Per Shipped Order
// """
// Mark Done Here 
// """
// Daily  Subtotal
// Daily Items Sold
// Daily PPI
// Daily Marketplace Subtotal
// Daily Shipping rev
// MTD Subtotal
// MTD Shipping rev
// MTD Items Sold
// """

// Store Reports all this info needs to be gatherd for each source

// Done Goes Here
// """
// Daily Created Items
// MTD Processed Accepted Rejected
// Accept Rate Percent
// SGW Itmes Sold
// avg PPi
// ebayItmes sold
// ebay PPI
// total items sold
// total sales
// total ppi


// """

// Diffrent Section
// """

// """
// ```