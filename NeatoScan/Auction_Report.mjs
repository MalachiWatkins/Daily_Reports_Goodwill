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
const { Pool } = require('pg');
const pool = new Pool({
    user: 'reports',
    database: 'reports',
    port: 5432,
    host: '',
  })
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

// // authFIleparse()
// async function main_auth() {
//     const authentication_package = await authFIleparse()
//     console.log(authentication_package);
// }

// Adds Authentication to XML Soap Envelope
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
        // const res = await pool.query("SELECT sku FROM orders");
        // console.log(res.rows[0]);
        // const res = await pool.query("SELECT count(sku) FROM orders")
        // console.log(res.rows);
        var x = 0 
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
                        var shipping = orders[x]['shippingEstimated'][0]
                        // Below Makes sure that there are no Dupelicated orders when request is made
                        try {
                            const res = await pool.query(
                            "INSERT INTO orders (sku, source, auction_type, date_paid, sales_ammount, shipping) VALUES ($1, $2, $3, $4, $5, $6)",
                            [sku, source, auction_type, date_paid, sales_ammount, shipping]
                          );
                        } catch (error) {}
                    }

                }
            }
            x++        
        }
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
            if (inv[x]['itemStatus']=='Active' ) {
                console.log(inv[x]);
            }

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
            var action = Activity[x]['action'][0]
            var user_name = Activity[x]['username'][0]
            var sku = Activity[x]['itemBarcode'][0]
            //
            try {
                const res = await pool.query(
                "INSERT INTO activity (sku, action, user_name ) VALUES ($1, $2, $3)",
                [sku, action, user_name]
              );
            } catch (error) {}
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
Auction_Activity()
//Auction_Inventory()
OrderAucion_parse() 
var end = window.performance.now();
console.log(`Execution time: ${end - start} ms`);
// So New system is gonna go sum like this
// Everything Generated here is going to a postgres DB table 
// then we are going to generate a report from the raw_db because some tags dont have names assoisated so i can find values by using the sku
// to see who listed and give them credit in the report 
// delete old report then add new one to 
// after report is generated then delete original raw db table 
// after report is generated copy to an Archive table of the report
// run again


// so technically to reduce exc time i could just put all orders in one dictionary then look though it when i got to generate
// the report this should save alot of time and be more effecent plus saves on bandwith and seems like the optimal 
// way to do all of this
