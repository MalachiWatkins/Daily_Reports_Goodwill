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
    Neat_start_day,
    uri,
    yesterday_start,
    yesterday_end,
} from './config.js';
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
    user: 'reports',
    database: 'reports',
    port: 5432,
    host: '10.118.0.133', // Local Ip Nice Try
})
const axios = require('axios-https-proxy-fix');
const soapRequest = require('easy-soap-request');
var fs = require('fs'),
    parseString = require("xml2js").parseString,
    xml2js = require("xml2js");
const {
    JSDOM
} = require("jsdom");
const {
    window
} = new JSDOM();
var start = window.performance.now();
const {
    MongoClient
} = require('mongodb');
// XML File Locations Put this in config file
var Request_Auction_Order = '/Users/malachiwatkins/Desktop/work/Daily_Reports_Goodwill/NeatoScan/Get_Data/xml_files/Auction_order.xml'
//'/home/malachi/Desktop/Projects/Daily_Reports_Goodwill/NeatoScan/xml_files/Auction_order.xml'
var Request_Auction_Inv = '/Users/malachiwatkins/Desktop/work/Daily_Reports_Goodwill/NeatoScan/Get_Data/xml_files/auction_inventory.xml'
//'/home/malachi/Desktop/Projects/Daily_Reports_Goodwill/NeatoScan/xml_files/auction_inventory.xml'
var Authenticate_xml = '/Users/malachiwatkins/Desktop/work/Daily_Reports_Goodwill/NeatoScan/Get_Data/xml_files/auction_auth.xml'
//'/home/malachi/Desktop/Projects/Daily_Reports_Goodwill/NeatoScan/xml_files/auction_auth.xml'
var Request_Auction_Activity = '/Users/malachiwatkins/Desktop/work/Daily_Reports_Goodwill/NeatoScan/Get_Data/xml_files/auction_activity.xml'
var Request_Auction_Container_details = '/Users/malachiwatkins/Desktop/work/Daily_Reports_Goodwill/NeatoScan/Get_Data/xml_files/auction_container_details.xml'
var Request_Auction_Refunds = '/Users/malachiwatkins/Desktop/work/Daily_Reports_Goodwill/NeatoScan/xml_files/Get_Data/auction_refunds.xml'



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
                console.log(type);
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
async function AuctionRequest(Request_xml, type, start, end) {
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
async function OrderAucion_parse(start, end, type) {
    // Daily And Monthly
    const request_resp = await AuctionRequest(Request_Auction_Order, 'Orders', start, end)
    var resp_data = request_resp['data']
    parseString(resp_data, async function (err, result) {
        var json = result;
        var orders = json['s:Envelope']['s:Body'][0]['OrdersResponse'][0]['OrdersResult'][0]['diffgr:diffgram'][0]['DocumentElement'][0]['Orders']
        // Order Example 
        var ord_exam = {
            '$': {
                'diffgr:id': 'Orders1017',
                'msdata:rowOrder': '1016'
            },
            itemID: ['68348'],
            Sku: ['NS41-001GQK'],
            externalItemID: ['151373648'],
            Title: ['Nike Golf Forged Titanium 9.5° Driver Regular Flex Mid Kick'],
            Source: ['Goodwill on North Oak'],
            addTime: ['2022-09-08T12:31:00'],
            startTime: ['2022-09-08T12:31:00'],
            endTime: ['2022-09-14T03:43:00'],
            orderID: [''],
            orderItemID: [''],
            externalOrderID: ['38417210'],
            externalOrderItemID: ['151373648'],
            createdDate: ['2022-09-16T00:58:51'],
            DateSold: ['2022-09-16T00:58:51'],
            DatePaid: ['2022-09-16T01:00:34'],
            fulfillmentLevel: ['Pickup'],
            addressLine1: [''],
            addressLine2: [''],
            addressLine3: [''],
            city: [''],
            state: [''],
            zip: [''],
            country: ['United States'],
            salesAmount: ['17.00'],
            shippingActual: ['0.00'],
            shippingEstimated: ['0.00'],
            processingFee: ['0.00'],
            salesTax: ['1.42'],
            handlingTax: ['0.25'],
            shippingTax: ['0.00'],
            donation: ['0.00'],
            totalTax: ['1.67'],
            itemHandling: ['2.99'],
            grossItemSale: ['19.99'],
            grossOrderSale: ['21.66'],
            auctionType: ['SGW'],
            category: ['Sports'],
            categoryBreadcrumb: ['Sports>Sporting Equipment>Golf'],
            timesListedToSell: ['1'],
            listingProfile: ['SGW General Wares (Non-Bulky)'],
            orderItemStatusID: ['3'],
            orderItemStatus: ['Awaiting Pickup']
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
        var user_report = {}
        while (x < orders.length) {
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
                            total_orders[0] = [parseInt(add_ord_to_total)]
                        }

                        function Total_subtotal(auction_type, sub) {
                            var add_subtotal = parseFloat(total_subtotal[auction_type.toString()][0]) + parseFloat(sub)
                            total_subtotal[auction_type.toString()] = [add_subtotal.toFixed(2)]
                        }

                        function Total_ship(type, num) {
                            var add = parseFloat(shipping[type]) + parseFloat(num)
                            shipping[type] = [add.toFixed(2)]
                        }
                        Total_ship('Cost', shipping_cost)
                        Total_ship('Rev', shipping_rev)
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
                                    'ship_cost': [parseFloat(shipping_cost)],
                                }

                            } else { // if value exists already adds next value and sets it as the new arr 

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
                                    'ship_cost': [parseFloat(shipping_cost)],
                                }
                            } else {
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
                        var query_sku = query + sku + "'"
                        const find_lister = await pool.query(query_sku, );
                        try {
                            const lister_user_name = find_lister.rows[0]['user_name']
                            if (typeof user_report[lister_user_name.trim()] == 'undefined') {
                                user_report[lister_user_name.trim()] = [parseFloat(sales_ammount), 1]
                            } else {
                                var user_rev_sum = user_report[lister_user_name.trim()][0] + parseFloat(sales_ammount)
                                var user_orders = user_report[lister_user_name.trim()][1] + 1
                                user_report[lister_user_name.trim()] = [parseFloat(user_rev_sum.toFixed(2)), user_orders]
                            }
                        } catch (error) {

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
            pased_user_dict[key] = [value[0], value[1], user_ppi.toFixed(2)]
        }

        // User, Order, And store Rport

        var total_subtotal_total = parseFloat(total_subtotal['SGW'][0]) + parseFloat(total_subtotal['eBay'][0])
        var ppi = total_subtotal_total / total_orders[0][0]

        let doc = {
            'Report': 'orders',
            'Date_Type': type,
            'SGW_Sales': parseFloat(total_subtotal['SGW'][0]),
            'Ebay_Sales': parseFloat(total_subtotal['eBay'][0]),
            'PPI': ppi.toFixed(2),
            'Total_sales': total_subtotal_total,
            'Total_orders': total_orders[0][0],
            'shipping': shipping,
        }
        const delquery = {
            'Report': 'orders',
            'Date_Type': type,
        }
        const client = new MongoClient(uri);
        var cli = await client.connect();
        const cli_db = cli.db('reports')
        const cli_coll = cli_db.collection('report')
        var delete_doc = await cli_coll.deleteOne(delquery);
        var insert = await cli_coll.insertOne(doc);
        var close = await client.close()
        // client.connect(async err => {
        //     const collection = client.db("reports").collection("report");
        //     // perform actions on the collection object

        //     var delete_doc = await collection.deleteOne(delquery);
        //     var insert = await collection.insertOne(doc);
        //     client.close();
        // });
    });

}
async function unshipped() { // All this Does is get Unshipped Orders
    console.log('Unshipped');
    const request_resp = await AuctionRequest(Request_Auction_Order, 'Orders', Neat_start_day, daily_end)
    var resp_data = request_resp['data']
    parseString(resp_data, async function (err, result) {
        var json = result;
        var orders = json['s:Envelope']['s:Body'][0]['OrdersResponse'][0]['OrdersResult'][0]['diffgr:diffgram'][0]['DocumentElement'][0]['Orders']
        var unshipped_sgw = []
        var unshipped_ebay = []
        var x = 0
        while (x < orders.length) {
            var single_order_status = orders[x]['orderItemStatus']
            if (typeof single_order_status !== 'undefined') {
                if (single_order_status != 'Unpaid' || single_order_status != 'Canceled') {
                    var date_paid_check = orders[x]['DatePaid']
                    if (typeof date_paid_check != 'undefined') {
                        try {
                            const res = await pool.query(
                                "INSERT INTO orders (sku, source, orderitemid, marketplace ) VALUES ($1, $2, $3, $4)",
                                [orders[x]['Sku'][0], orders[x]['Source'][0], orders[x]['orderItemID'][0], orders[x]['auctionType'][0]]
                            );
                        } catch (error) {}

                        // Unshipped Orders This is a start of time to daily end date
                        if (orders[x]['orderItemStatus'][0] != 'Shipped') {
                            if (orders[x]['orderItemStatus'][0] != 'Awaiting Pickup') {
                                if (orders[x]['orderItemStatus'][0] != 'Refunded') {
                                    if (orders[x]['orderItemStatus'][0] != 'Errored') {
                                        if (orders[x]['auctionType'][0] == 'SGW') {

                                            unshipped_sgw.push(orders[x]['orderItemStatus'])
                                        } else {
                                            unshipped_ebay.push(orders[x]['orderItemStatus'])
                                        }

                                    }
                                }

                            }
                        }

                    }
                }
            }
            x++
        }
        const client = new MongoClient(uri);
        let doc = {
            'Report': 'unshipped',
            'unshipped_total': unshipped_sgw.length + unshipped_ebay.length,
            'unshipped_sgw': unshipped_sgw.length,
            'unshipped_ebay': unshipped_ebay.length

        }
        client.connect(async err => {
            const collection = client.db("reports").collection("report");
            // perform actions on the collection object
            const delquery = {
                'Report': 'unshipped'
            }
            console.log('unshipped insert');
            var delete_doc = await collection.deleteOne(delquery);
            var insert = await collection.insertOne(doc);
            client.close();
        });

    });
}
// parse auction Inventory response
async function Auction_Inventory(start, end) { // This Needs from start of time till daily end date
    const request_resp = await AuctionRequest(Request_Auction_Inv, 'Inventory', start, end)
    var resp_data = request_resp['data']
    parseString(resp_data, async function (err, result) {
        var json = result;
        var inv = json['s:Envelope']['s:Body'][0]['InventoryResponse'][0]['InventoryResult'][0]['diffgr:diffgram'][0]['DocumentElement'][0]['Inventory'];
        var inv_report = {
            'Incomplete': [0],
            'Active': [0],
            'Created': [0],
            'Sorted': [0],
            'Retired': [0],
            'Rejected': [0],
            'Sell in Lot': [0],
            'Inactive Sold': [0],
            'Error': [0],
            'Active Unsold': [0],
            'Missing': [0],

        }
        let active_inv = {
            'SGW': [0],
            'eBay': [0]
        }

        function getRandomInt(max) {
            return Math.floor(Math.random() * max);
        }
        var x = 0
        while (x < inv.length) {
            if (inv[x]['itemStatus'][0] == 'Active') {
                let new_market_sum = parseInt(active_inv[inv[x]['auctionType'][0]]) + 1
                active_inv[inv[x]['auctionType'][0]] = [new_market_sum]
            }
            // if itemStatus is active then look for auctionType
            let new_total = inv_report[inv[x]['itemStatus']][0] + 1
            inv_report[inv[x]['itemStatus']] = [new_total]
            // inv_report[inv[x]['itemStatus']].push(inv[x]['sku'])                     
            x++
        }
        const client = new MongoClient(uri);
        let doc = {
            'Report': 'inv',
            'Active_Inv': active_inv,
            'Inv_report': inv_report
        }
        client.connect(async err => {
            const collection = client.db("reports").collection("report");
            // perform actions on the collection object
            const delquery = {
                'Report': 'inv'
            }
            var delete_doc = await collection.deleteOne(delquery);
            var insert = await collection.insertOne(doc);
            client.close();
        });
    });

}
async function store_PAR(start, end) {
    const request_resp = await AuctionRequest(Request_Auction_Inv, 'Inventory', start, end)
    var resp_data = request_resp['data']
    console.log('par');
    parseString(resp_data, async function (err, result) {
        var json = result;
        var inv = json['s:Envelope']['s:Body'][0]['InventoryResponse'][0]['InventoryResult'][0]['diffgr:diffgram'][0]['DocumentElement'][0]['Inventory'];
        let par = {}
        console.log(par);
        var x = 0
        while (x < inv.length) {
            if (typeof par[inv[x]['Source']] == 'undefined') {
                par[inv[x]['Source']] = {
                    'P': [0],
                    'A': [0],
                    'R': [0],
                    'C': [0]
                }
            } else {
                if (inv[x]['isSorted'][0] == '1') {
                    let new_p = parseInt(par[inv[x]['Source']]['P'][0]) + 1
                    new_p = par[inv[x]['Source']]['P'] = [new_p]
                }
                try {
                    if (inv[x]['isAccepted'][0] == '1') {
                        let new_a = parseInt(par[inv[x]['Source']]['A'][0]) + 1
                        new_a = par[inv[x]['Source']]['A'] = [new_a]
                    }
                } catch (error) {

                }
                if (inv[x]['itemStatus'][0] == 'Rejected') {
                    let new_r = parseInt(par[inv[x]['Source']]['R'][0]) + 1
                    new_r = par[inv[x]['Source']]['R'] = [new_r]
                }
                if (inv[x]['itemStatus'][0] == 'Created') {
                    let new_c = parseInt(par[inv[x]['Source']]['C'][0]) + 1
                    new_c = par[inv[x]['Source']]['C'] = [new_c]
                }

            }
            x++

        }
        const client = new MongoClient(uri);
        let doc = {
            'Report': 'store_par',
            'Store_Par': par,
        }
        client.connect(async err => {
            const collection = client.db("reports").collection("report");
            // perform actions on the collection object
            const delquery = {
                'Report': 'store_par'
            }
            var delete_doc = await collection.deleteOne(delquery);
            var insert = await collection.insertOne(doc);
            client.close();
        });
    });
}

// activity log
async function auction_activity_log(start, end) { // This Just keeps activity log up to date this is important for orders to function
    const request_resp = await AuctionRequest(Request_Auction_Activity, 'Activity', start, end)
    var resp_data = request_resp['data']
    parseString(resp_data, async function (err, result) {
        var json = result;
        var Activity = json['s:Envelope']['s:Body'][0]['ActivityResponse'][0]['ActivityResult'][0]['diffgr:diffgram'][0]['DocumentElement'][0]['Activity']
        var x = 0
        while (x < Activity.length) {
            var action = Activity[x]['action'][0]
            var user_name_raw = Activity[x]['username'][0]
            var sku = Activity[x]['itemBarcode'][0]
            // This Just keeps activity log up to date this is important for orders to function
            if (action == 'Listed' || action == 'CreateItem') {
                try {
                    const res = await pool.query(
                        "INSERT INTO activity (sku, action, user_name ) VALUES ($1, $2, $3)",
                        [sku, action, user_name_raw]
                    );
                } catch (error) {
                }
            }
            x++
        }
    });
}
// parse auction Activity response
async function Auction_Activity(start, end, type) {
    const request_resp = await AuctionRequest(Request_Auction_Activity, 'Activity', start, end)
    var resp_data = request_resp['data']
    parseString(resp_data, async function (err, result) {
        var json = result;
        var Activity = json['s:Envelope']['s:Body'][0]['ActivityResponse'][0]['ActivityResult'][0]['diffgr:diffgram'][0]['DocumentElement'][0]['Activity']
        var Action_dict = {
            'Shipped': [0],
            'ArchiveContainer': [0],
            'CreateContainer': [0],
            'SortContainer': [0],
            'Sorted': [0],
            'Listed': [0],
            'UNDEFINED': [0],
            'CreateItem': [0], // number i cant rember for report
            'Photographed': [0],
            'Shelved': [0],
            'Picked': [0],
            'AwaitingReview': [0],
            'Packed': [0],
            'Refunded': [0],
            'Approved': [0],
        }
        var user_action = {}
        var x = 0
        while (x < Activity.length) {
            var query = "SELECT user_name FROM activity WHERE sku = '"
            var query_id = query + Activity[x]['orderItemID'][0] + "'"
            const find_lister = await pool.query(query_id, );
            var action = Activity[x]['action'][0]
            var user_name_raw = Activity[x]['username'][0]
            var sku = Activity[x]['itemBarcode'][0]
            // Total Activity Log
            try {
                var add = Action_dict[action][0] + 1
            } catch (error) {
                console.log(action);
            }
            var add = Action_dict[action][0] + 1
            Action_dict[action] = [add]
            var user_name = user_name_raw.toString().toLowerCase()
            // User Activity Log
            if (typeof user_action[user_name.trim()] == 'undefined') {
                user_action[user_name.trim()] = {}
                if (typeof user_action[user_name.trim()][action] == 'undefined') {
                    user_action[user_name.trim()][action] = [1]
                } else {
                    var action_sum = user_action[user_name.trim()][action][0] + 1
                    user_action[user_name.trim()][action] = [action_sum]
                }
            } else { // if username exsists in user_action dict
                if (typeof user_action[user_name.trim()][action] == 'undefined') {
                    user_action[user_name.trim()][action] = [1]
                } else {
                    var action_sum = user_action[user_name.trim()][action][0] + 1
                    user_action[user_name.trim()][action] = [action_sum]
                }
            }
            // This Just keeps activity log up to date this is important for orders to function
            if (action == 'Listed' || action == 'CreateItem') {
                try {
                    const res = await pool.query(
                        "INSERT INTO activity (sku, action, user_name ) VALUES ($1, $2, $3)",
                        [sku, action, user_name]
                    );
                } catch (error) {}
            }

            x++
        }
        let postings = Action_dict['Listed']
        let posting_per_lister = parseInt(Action_dict['Listed'][0] / 5)
        let order_shipped = Action_dict['Shipped']
        const client = new MongoClient(uri);
        let doc = {
            'Report': 'action',
            'type': type,
            'Postings': postings,
            'PPL': posting_per_lister,
            'Orders_Shipped': order_shipped,
            'Total_Action': Action_dict,
            'User_Action': user_action,
        }
        client.connect(async err => {
            const collection = client.db("reports").collection("report");
            // perform actions on the collection object
            const delquery = {
                'Report': 'action',
                'type': type,
            }
            var delete_doc = await collection.deleteOne(delquery);
            var insert = await collection.insertOne(doc);
            client.close();
        });
    });
}

async function Auction_Refunds(start, end) {
    const request_resp = await AuctionRequest(Request_Auction_Refunds, 'Refunds', start, end)
    var resp_data = request_resp['data']
    parseString(resp_data, async function (err, result) {
        var json = result;
        var refund_report_unparsed = {
            'SGW_Refund_Amount': [],
            'Ebay_Refund_Amount': [],
        }
        try {
            var refunds = json['s:Envelope']['s:Body'][0]['RefundsResponse'][0]['RefundsResult'][0]['diffgr:diffgram'][0]['DocumentElement'][0]['Refunds']
        } catch (error) {
            return
        }
        var x = 0
        while (x < refunds.length) {
            if (refunds[x]['marketplaceType'][0] == 'SGW') {
                refund_report_unparsed['SGW_Refund_Amount'].push(parseFloat(refunds[x]['refundAmount'][0]))
            } else {
                refund_report_unparsed['Ebay_Refund_Amount'].push(parseFloat(refunds[x]['refundAmount'][0]))
            }
            x++

        }

        // WORKING HERE RN
        var sgw_refund_total = refund_report_unparsed['SGW_Refund_Amount'].reduce(function (a, b) {
            return a + b;
        }, 0);
        var ebay_refund_total = refund_report_unparsed['Ebay_Refund_Amount'].reduce(function (a, b) {
            return a + b;
        }, 0);
        var refund_report = {
            'Total_num_refunds': refund_report_unparsed['SGW_Refund_Amount'].length + refund_report_unparsed['Ebay_Refund_Amount'].length,
            'Total_refunds': parseFloat(sgw_refund_total) + parseFloat(ebay_refund_total),
            'Total_num_sgw_refunds': refund_report_unparsed['SGW_Refund_Amount'].length,
            'Total_sgw_refunds': sgw_refund_total,
            'Total_num_ebay_refunds': refund_report_unparsed['Ebay_Refund_Amount'].length,
            'Total_ebay_refunds': ebay_refund_total

        }
        const client = new MongoClient(uri);
        let doc = {
            'Report': 'refund_report',
            'refund_report': refund_report,
        }
        client.connect(async err => {
            const collection = client.db("reports").collection("report");
            // perform actions on the collection object
            const delquery = {
                'Report': 'refund_report'
            }
            var delete_doc = await collection.deleteOne(delquery);
            var insert = await collection.insertOne(doc);
            client.close();
        });
    });

}

// all these need a start, end
//    daily_start,
//    daily_end,
//    MTD_Start,
//    MTD_END,
//    Neat_start_day and daily start is start of neatoscan this is only for activity and inventory

async function run() {
        let order_daily = await OrderAucion_parse(daily_start, daily_end, 'Daily')
        let activity_daily = await Auction_Activity(daily_start, daily_end, 'Daily')

        let order_yesterday = await OrderAucion_parse(yesterday_start, yesterday_end, 'Yesterday')
        let activity_yesterday = await Auction_Activity(yesterday_start, yesterday_end, 'Yesterday')

}

async function monthly() {
    let order_monthly = await OrderAucion_parse(MTD_Start, MTD_END, 'Monthly')
    let unshipped_test = await unshipped()
    let mtd_parc_store = await store_PAR(MTD_Start, daily_end)
    let activity_monthly = await Auction_Activity(MTD_Start, MTD_END, 'Monthly')
    //let refunds_monthly = await Auction_Refunds(MTD_Start, MTD_END) broken needs fix
    let inventory = await Auction_Inventory(Neat_start_day, daily_end)
    let activity_log = await auction_activity_log(Neat_start_day, daily_end)
}

// setInterval(run, 300000)
// setInterval(monthly, 1800000); // 30 mins
monthly()