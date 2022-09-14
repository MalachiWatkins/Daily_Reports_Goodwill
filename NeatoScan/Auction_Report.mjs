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

// XML File Locations Put this in config file
var Request_Auction_Order = '/Users/malachiwatkins/Desktop/work/Daily_Reports_Goodwill/NeatoScan/xml_files/Auction_order.xml'
//'/home/malachi/Desktop/Projects/Daily_Reports_Goodwill/NeatoScan/xml_files/Auction_order.xml'
var Request_Auction_Inv = '/Users/malachiwatkins/Desktop/work/Daily_Reports_Goodwill/NeatoScan/xml_files/auction_inventory.xml'
//'/home/malachi/Desktop/Projects/Daily_Reports_Goodwill/NeatoScan/xml_files/auction_inventory.xml'
//

var Authenticate_xml = '/Users/malachiwatkins/Desktop/work/Daily_Reports_Goodwill/NeatoScan/xml_files/auction_auth.xml'
//'/home/malachi/Desktop/Projects/Daily_Reports_Goodwill/NeatoScan/xml_files/auction_auth.xml'


const url_auctions = SOAP_urls['Auction_Url']; // Main Book URL


// Request Function
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
                resolve(auth_response);
            });

        });
    });
}

// authFIleparse()
async function main_auth() {
    const authentication_package = await authFIleparse()
    console.log(authentication_package);
}

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