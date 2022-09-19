import {
    Client_User_Name,
    Token,
    start_date_time,
    end_date_time,
    SOAP_Header_CONTENT_TYPE,
    SOAP_Header_Host_Config,
    USER_AGENT,
    SOAP_actions,
    SOAP_Content_len,
    SOAP_urls,
    NIM_User,
    NIM_Password,
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
<<<<<<< HEAD
const { JSDOM } = require("jsdom");
const { window } = new JSDOM();
var start = window.performance.now();
=======
>>>>>>> 24f68e75d20dfc88b5c6986f37e9a1b2872592b2

// XML File Locations Put this in config file
var Request_Auction_Order = '/Users/malachiwatkins/Desktop/work/Daily_Reports_Goodwill/NeatoScan/xml_files/Auction_order.xml'
//'/home/malachi/Desktop/Projects/Daily_Reports_Goodwill/NeatoScan/xml_files/Auction_order.xml'
var Request_Auction_Inv = '/Users/malachiwatkins/Desktop/work/Daily_Reports_Goodwill/NeatoScan/xml_files/auction_inventory.xml'
//'/home/malachi/Desktop/Projects/Daily_Reports_Goodwill/NeatoScan/xml_files/auction_inventory.xml'
<<<<<<< HEAD
var Authenticate_xml = '/Users/malachiwatkins/Desktop/work/Daily_Reports_Goodwill/NeatoScan/xml_files/auction_auth.xml'
//'/home/malachi/Desktop/Projects/Daily_Reports_Goodwill/NeatoScan/xml_files/auction_auth.xml'
var Request_Auction_Activity = '/Users/malachiwatkins/Desktop/work/Daily_Reports_Goodwill/NeatoScan/xml_files/auction_activity.xml'
var Request_Auction_Container_details = '/Users/malachiwatkins/Desktop/work/Daily_Reports_Goodwill/NeatoScan/xml_files/auction_container_details.xml'
var Request_Auction_Refunds = '/Users/malachiwatkins/Desktop/work/Daily_Reports_Goodwill/NeatoScan/xml_files/auction_refunds.xml'
                                                                                                             
=======
//

var Authenticate_xml = '/Users/malachiwatkins/Desktop/work/Daily_Reports_Goodwill/NeatoScan/xml_files/auction_auth.xml'
//'/home/malachi/Desktop/Projects/Daily_Reports_Goodwill/NeatoScan/xml_files/auction_auth.xml'
>>>>>>> 24f68e75d20dfc88b5c6986f37e9a1b2872592b2


const url_auctions = SOAP_urls['Auction_Url']; // Main Book URL


<<<<<<< HEAD
// Auth Function
=======
// Request Function
>>>>>>> 24f68e75d20dfc88b5c6986f37e9a1b2872592b2
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
<<<<<<< HEAD
            });
=======

            });

>>>>>>> 24f68e75d20dfc88b5c6986f37e9a1b2872592b2
        }).catch(err => {
            console.log(err)
        });
    });
}
<<<<<<< HEAD
// Parses Auth Response Into Authentication Package
=======
>>>>>>> 24f68e75d20dfc88b5c6986f37e9a1b2872592b2
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
<<<<<<< HEAD
                console.log('Authenticated!');
=======
>>>>>>> 24f68e75d20dfc88b5c6986f37e9a1b2872592b2
                resolve(auth_response);
            });

        });
    });
}

<<<<<<< HEAD
// // authFIleparse()
// async function main_auth() {
//     const authentication_package = await authFIleparse()
//     console.log(authentication_package);
// }

// Adds Authentication to XML Soap Envelope
=======
// authFIleparse()
async function main_auth() {
    const authentication_package = await authFIleparse()
    console.log(authentication_package);
}

>>>>>>> 24f68e75d20dfc88b5c6986f37e9a1b2872592b2
async function AuctionSoapEnv(SOAPENV, type) {
    return new Promise((resolve, reject) => {
        fs.readFile(SOAPENV, "utf-8", function (err, data) {
            parseString(data, async function (err, result) {
                const authentication_package = await authFIleparse()
                var json = result;
                const reqtype = json['s:Envelope']['s:Body'][0][type][0];
                const token = reqtype['token'][0];
                const market_places = reqtype['token'][0]['b:Marketplaces'][0]['b:Marketplace'];
                var Auth_date_start = reqtype['start'] = start_date_time
                var Auth_date_end = reqtype['end'] = end_date_time
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
<<<<<<< HEAD
// Request from SOAP Endpoint 
async function AuctionRequest(Request_xml, type) {
    return new Promise(async (resolve, reject) => {
        // ALL THIS CAN BE CONDENCED DOWN TO ONE XML FILE A FEW KEYS NEED CHANGEING
        const soap_data = await AuctionSoapEnv(Request_xml, type)
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
async function OrderAucion_parse() {
    const request_resp = await AuctionRequest(Request_Auction_Order, 'Orders') //// Request_Auction_Inv, 'Inventory'
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
            orderID: [ '47173' ],
            orderItemID: [ '32173' ],
            externalOrderID: [ '38417210' ],
            externalOrderItemID: [ '151373648' ],
            createdDate: [ '2022-09-16T00:58:51' ],
            DateSold: [ '2022-09-16T00:58:51' ],
            DatePaid: [ '2022-09-16T01:00:34' ],
            fulfillmentLevel: [ 'Pickup' ],
            addressLine1: [ '510 Kirkpatrick St' ],
            addressLine2: [ '' ],
            addressLine3: [ '' ],
            city: [ 'Odessa' ],
            state: [ 'MO' ],
            zip: [ '64076-1615' ],
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
        // Put this in config
        var ORDER_REPORT = {
            'SGW' : {
                'Shared Revenue/Ecommerce': {'sub': [], 'ship': []},
                'Goodwill East 63rd St': {'sub': [], 'ship': []},
                'Goodwill Lee’s Summit': {'sub': [], 'ship': []},
                'Goodwill Blue Springs': {'sub': [], 'ship': []},
                'Goodwill Manhattan': {'sub': [], 'ship': []},
                'Goodwill Bonner Springs': {'sub': [], 'ship': []},
                'Goodwill Leavenworth': {'sub': [], 'ship': []},
                'Goodwill Overland Park': {'sub': [], 'ship': []},
                'Goodwill Topeka': {'sub': [], 'ship': []},
                'Goodwill Pittsburg': {'sub': [], 'ship': []},
                'Goodwill Shawnee': {'sub': [], 'ship': []},
                'Goodwill on North Oak': {'sub': [], 'ship': []},
                'Goodwill Liberty': {'sub': [], 'ship': []},
                'Goodwill Outlet Store': {'sub': [], 'ship': []},
                'Goodwill Leawood Donation Center': {'sub': [], 'ship': []},
                'Goodwill Lawrence': {'sub': [], 'ship': []}
            },
            'Ebay' : {
                'Shared Revenue/Ecommerce': {'sub': [], 'ship': []},
                'Goodwill East 63rd St': {'sub': [], 'ship': []},
                'Goodwill Lee’s Summit': {'sub': [], 'ship': []},
                'Goodwill Blue Springs': {'sub': [], 'ship': []},
                'Goodwill Manhattan': {'sub': [], 'ship': []},
                'Goodwill Bonner Springs': {'sub': [], 'ship': []},
                'Goodwill Leavenworth': {'sub': [], 'ship': []},
                'Goodwill Overland Park': {'sub': [], 'ship': []},
                'Goodwill Topeka': {'sub': [], 'ship': []},
                'Goodwill Pittsburg': {'sub': [], 'ship': []},
                'Goodwill Shawnee': {'sub': [], 'ship': []},
                'Goodwill on North Oak': {'sub': [], 'ship': []},
                'Goodwill Liberty': {'sub': [], 'ship': []},
                'Goodwill Outlet Store': {'sub': [], 'ship': []},
                'Goodwill Leawood Donation Center': {'sub': [], 'ship': []},
                'Goodwill Lawrence': {'sub': [], 'ship': []}
            }
        }
        var x = 0 
        while (x<orders.length) {
            var single_order_status = orders[x]['orderItemStatus']
            if (typeof single_order_status !== 'undefined') {
                if (single_order_status != 'Unpaid') {
                  //  single_order_status == 'Paid' || single_order_status == 'Shipped' || single_order_status == 'Awaiting Pickup'
                    if (orders[x]['auctionType']== 'SGW') {
                        var source = orders[x]['Source']
                        var sgw_dict = ORDER_REPORT['SGW']
                        if (typeof sgw_dict[source] == 'undefined') { // Undef Means outlet store IDK WHY
                            sgw_dict['Goodwill Outlet Store']['sub'].push(parseFloat(orders[x]['salesAmount'][0]))
                            sgw_dict['Goodwill Outlet Store']['ship'].push(parseFloat(orders[x]['shippingEstimated'][0]))
                        }else {
                            sgw_dict[source]['sub'].push(parseFloat(orders[x]['salesAmount'][0]))
                            sgw_dict[source]['ship'].push(parseFloat(orders[x]['shippingEstimated'][0]))
                        }
                    }else {
                        var source = orders[x]['Source']
                        var sgw_dict = ORDER_REPORT['Ebay']
                        if (typeof sgw_dict[source] == 'undefined') { // Undef Means outlet store IDK WHY
                            sgw_dict['Goodwill Outlet Store']['sub'].push(parseFloat(orders[x]['salesAmount'][0]))
                            sgw_dict['Goodwill Outlet Store']['ship'].push(parseFloat(orders[x]['shippingEstimated'][0]))
                        }else {
                            sgw_dict[source]['sub'].push(parseFloat(orders[x]['salesAmount'][0]))
                            sgw_dict[source]['ship'].push(parseFloat(orders[x]['shippingEstimated'][0]))
                        }
                    }
                    
                }
            }
            x++
            
        }
        var total_sub_sgw = []
        var total_ship_sgw = []

       // var ppi = total_sales / times_sold
        for (const [key, value] of Object.entries(ORDER_REPORT['SGW'])) {
            value['sub'].forEach(subtotal => {
                total_sub_sgw.push(parseFloat(subtotal))
            });
            value['ship'].forEach(shiptotal => {
                total_ship_sgw.push(parseFloat(shiptotal))
            });
          }
        var sub_total_sgw = total_sub_sgw.reduce(function(a, b) {
            return a + b;
        }, 0);
        var ship_total_sgw = total_ship_sgw.reduce(function(a, b) {
            return a + b;
        }, 0);
        var total_sub_ebay = []
        var total_ship_sgw = []

       // var ppi = total_sales / times_sold
        for (const [key, value] of Object.entries(ORDER_REPORT['Ebay'])) {
            value['sub'].forEach(subtotal => {
                total_sub_ebay.push(parseFloat(subtotal))
            });
            value['ship'].forEach(shiptotal => {
                total_ship_sgw.push(parseFloat(shiptotal))
            });
          }
        var sub_total_ebay = total_sub_ebay.reduce(function(a, b) {
            return a + b;
        }, 0);
        var ship_total_ebay = total_ship_sgw.reduce(function(a, b) {
            return a + b;
        }, 0);
        var items_sold_SGW = total_sub_sgw.length
        var items_sold_ebay = total_sub_ebay.length
        var Total_sales = parseFloat(sub_total_sgw.toFixed(2)) + parseFloat(sub_total_ebay.toFixed(2))
        var Total_Items_Sold = items_sold_SGW + items_sold_ebay
        var Total_ppi = Total_sales / Total_Items_Sold
        // THESE Need to be put in DB
        var main_order_dict =  {
            'Total_Items_Sold' : Total_Items_Sold,
            'Total_Sales': Total_sales,
            'Total_Shipping': parseFloat(ship_total_sgw.toFixed(2)) + parseFloat(ship_total_ebay.toFixed(2)),
            'Total_PPI' : parseFloat(Total_ppi.toFixed(2)),
            'SGW_Items_Sold' : items_sold_SGW,
            'Total_SGW_Sales': parseFloat(sub_total_sgw.toFixed(2)),
            'Total SGW_Shipping': parseFloat(ship_total_sgw.toFixed(2)),
            'Ebay_Items_Sold': items_sold_ebay,
            'Total_Ebay_Sales': parseFloat(sub_total_ebay.toFixed(2)),
            'Total_Ebay_Shipping': parseFloat(ship_total_ebay.toFixed(2)),
        }
        console.log(main_order_dict);
    });
    


}
// parse auction Inventory response
async function Auction_Inventory() {
    const request_resp = await AuctionRequest(Request_Auction_Inv, 'Inventory')
    var resp_data = request_resp['data']
    parseString(resp_data, async function (err, result) {
        var json = result;
        var inv = json['s:Envelope']['s:Body'][0]['InventoryResponse'][0]['InventoryResult'][0]['diffgr:diffgram'][0]['DocumentElement'][0]['Inventory'];
        var inv_report = {
            'Incomplete': [],
            'Active': [],
            'Created': [],
            'Sorted': [],
            'Retired': [],
            'Rejected': [],
            'Sell in Lot': [],
            'Inactive Sold': [],
            'Error': [],
            'Active Unsold': [],
            'Missing': [],

        }
        var x  = 0 
        while (x<inv.length) {
            console.log(inv[x]);
            inv_report[inv[x]['itemStatus']].push(inv[x]['sku'])                     
            x++
        }
        console.log(inv_report);

    });
    
}

// parse auction Activity response
async function Auction_Activity() {
    const request_resp = await AuctionRequest(Request_Auction_Activity, 'Activity')
    var resp_data = request_resp['data']
    parseString(resp_data, async function (err, result) {
        var json = result;
        var Activity = json['s:Envelope']['s:Body'][0]['ActivityResponse'][0]['ActivityResult'][0]['diffgr:diffgram'][0]['DocumentElement'][0]['Activity']
        // put this in config vvvvv
        var Action_dict = {
            'Shipped' : [],
            'ArchiveContainer': [],
            'CreateContainer': [],
            'SortContainer': [],
            'Sorted': [],
            'Listed': [],
            'UNDEFINED': [],
            'CreateItem': [],
            'Photographed': [],
            'Shelved': [],
            'Picked': [],
            'AwaitingReview': [],
            'Packed': [],
            'Refunded': [],
        }
        var x = 0
        while (x<Activity.length) {
            var action = Activity[x]['action']
            // console.log(action);
            console.log(Activity[x]);
            Action_dict[action].push(Activity[x]['username'][0])
            x++
            
        }
        //console.log(Action_dict['Shipped']);
    });
    
}

async function Auction_Refunds() {
    const request_resp = await AuctionRequest(Request_Auction_Refunds, 'Refunds')
    var resp_data = request_resp['data']
    parseString(resp_data, async function (err, result) {
        var json = result;
        var refund_report_unparsed = {
            'SGW_Refund_Amount': [],
            'Ebay_Refund_Amount': [],
        }
        try {
            var refunds = json['s:Envelope']['s:Body'][0]['RefundsResponse'][0]['RefundsResult'][0]['diffgr:diffgram'][0]['DocumentElement'][0]['Refunds']
            var x = 0
            while (x<refunds.length) {
                if (refunds[x]['marketplaceType'][0] == 'SGW') {
                    refund_report['SGW_Refund_Amount'].push(parseFloat(refunds[x]['refundAmount'][0]))
                }else {
                    refund_report['Ebay_Refund_Amount'].push(parseFloat(refunds[x]['refundAmount'][0]))
                }
                x++
                
            }
            
        } catch (error) {}finally {}
        // WORKING HERE RN
        var sgw_refund_total = refund_report_unparsed['SGW_Refund_Amount'].reduce(function(a, b) {
            return a + b;
        }, 0);
        var refund_report = {
            'Total_num_refunds' : '',
            'Total_refunds': '',
            'Total_num_sgw_refunds': '',
            'Total_sgw_refunds': '',

        }
    });
    
}

// return new Promise((resolve, reject) => {

// });
//Auction_Refunds()
// Auction_Activity()
// Auction_Inventory()
OrderAucion_parse() 
var end = window.performance.now();
console.log(`Execution time: ${end - start} ms`);
=======
async function AuctionRequest(Request_xml, type) {
    // ALL THIS CAN BE CONDENCED DOWN TO ONE XML FILE A FEW KEYS NEED CHANGEING
    const soap_data = await AuctionSoapEnv(Request_xml, type)
    console.log('Request Envelope Ready');
    // ALL That needs to be done is to change headers to pull from config and thats it
    // Long Issue over GUID cuz me no smart sometimes and brain != workin
    const USER_Headers = {
        headers: {'User-Agent': USER_AGENT,
        'Content-Type': SOAP_Header_CONTENT_TYPE['Auction_Content_Type'],'Host': SOAP_Header_Host_Config['Books_Host'], "Content-Length":SOAP_Content_len['Auctions_Report_Content_Len'], 
        "Expect": "100-continue", "Connection": "Keep-Alive"}
    }
    axios.post(url_auctions, soap_data, USER_Headers).then(response => {
            console.log(response);
     })
}

AuctionRequest(Request_Auction_Order, 'Orders') //// Request_Auction_Inv, 'Inventory'
async function Aucion_parse() {
    
}
>>>>>>> 24f68e75d20dfc88b5c6986f37e9a1b2872592b2
