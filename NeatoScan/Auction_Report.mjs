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
var Request_Auction_Report = '/home/malachi/Desktop/Projects/Daily_Reports_Goodwill/NeatoScan/xml_files/Request_Auction_Report.xml'
//'/Users/malachiwatkins/Desktop/work/Daily_Reports_Goodwill/NeatoScan/xml_files/Request_Auction_Report.xml'

var Authenticate_xml = '/home/malachi/Desktop/Projects/Daily_Reports_Goodwill/NeatoScan/xml_files/auction_auth.xml'
//'/Users/malachiwatkins/Desktop/work/Daily_Reports_Goodwill/NeatoScan/xml_files/auction_auth.xml'

const url_auctions = SOAP_urls['Auction_Url']; // Main Book URL


// Request Function
async function reqAuth(url, xml, CL,type) {
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
                            'neat_token' : neat_token,
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
            const auth_response = await reqAuth(url_auctions,xml ,'Auctions_Report_Content_Len', 'auth')
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
main_auth()