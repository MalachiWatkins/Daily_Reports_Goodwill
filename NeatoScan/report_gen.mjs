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
var Request_Book_Order_report_XML = '/Users/malachiwatkins/Desktop/work/Daily_Reports_Goodwill/NeatoScan/xml_files/Request_Book_Order_Report.xml'
// '/home/malachi/Desktop/Projects/Daily_Reports_Goodwill/NeatoScan/xml_files/Request_Book_Order_Report.xml'
var Report_Status_Books_XML = '/Users/malachiwatkins/Desktop/work/Daily_Reports_Goodwill/NeatoScan/xml_files/Request_Report_Status.xml'
//'/home/malachi/Desktop/Projects/Daily_Reports_Goodwill/NeatoScan/xml_files/Request_Report_Status.xml'
var Request_Auction_Report = '/Users/malachiwatkins/Desktop/work/Daily_Reports_Goodwill/NeatoScan/xml_files/Request_Auction_Report.xml'
//'/home/malachi/Desktop/Projects/Daily_Reports_Goodwill/NeatoScan/xml_files/Request_Auction_Report.xml'
var Authenticate_xml = '/Users/malachiwatkins/Desktop/work/Daily_Reports_Goodwill/NeatoScan/xml_files/auction_auth.xml'
// '/home/malachi/Desktop/Projects/Daily_Reports_Goodwill/NeatoScan/xml_files/auction_auth.xml'

const url_books = SOAP_urls['Books_Url']; // Main Book URL
const url_auctions = SOAP_urls['Auction_Url']; // Main Auction URL



// Request Function
function book_req(url, xml, SA, CL, type) {
    const USER_Headers = {
        headers: {
            "User-Agent": USER_AGENT,
            'Content-Type': SOAP_Header_CONTENT_TYPE['Books_Content_Type'],
            'SOAPAction': SOAP_actions[SA],
            'Host': SOAP_Header_Host_Config['Books_Host'],
            "Content-Length": SOAP_Content_len[CL],
            'Expect': '100-continue',
            'Connection': 'Keep-Alive'
        }
    }
    return new Promise((resolve, reject) => {
        axios.post(url, xml, USER_Headers).then(response => {
            parseString(response.data, async function (err, result) {
                if (type == 'order_report' ) {
                    var json = result;
                    var report_ID = json['soap:Envelope']['soap:Body'][0]['RequestOrdersReportResponse'][0]['RequestOrdersReportResult'][0]['reportID'];
                    console.log('Report Generating');
                    resolve(report_ID)
                } else {
                    var json = result;
                    var status = json['soap:Envelope']['soap:Body'][0]['RequestReportStatusResponse'][0]['RequestReportStatusResult'][0]['status'];
                    if (status == 'Done') {
                        var url = json['soap:Envelope']['soap:Body'][0]['RequestReportStatusResponse'][0]['RequestReportStatusResult'][0]['reportURL']
                        var resp_dict = {
                            'URL': url,
                            'status': status
                        }
                        resolve(resp_dict)
                    }else {
                        var url = 'NULL'
                        var resp_dict = {
                            'URL': url,
                            'status': status
                        }
                        resolve(resp_dict)
                    }    
                }
            });

        }).catch(err => {
            console.log(err)
        });
    });
}

function get_book_report_url() {
    fs.readFile(Request_Book_Order_report_XML, "utf-8", function (err, data) {
        parseString(data, function (err, result) {
            var json = result;
            var auth_filter = json['soap:Envelope']['soap:Body'][0]['RequestOrdersReport'][0];
            var auth_Client_User = auth_filter['username'] = Client_User_Name;
            var auth_token = auth_filter['token'] = Token;
            var date_start_filter = auth_filter['startDate'] = start_date_time;
            var date_end_filter = auth_filter['endDate'] = end_date_time;
            var builder = new xml2js.Builder();
            const xml = builder.buildObject(json);
            book_get_Report_id(xml)
    
        });
    });
}

async function book_get_Report_id(xml_file) {
    const report_id = await book_req(url_books, xml_file, 'Book_Report_Request', 'Book_Report_Request_Content_Len', 'order_report')
    fs.readFile(Report_Status_Books_XML, "utf-8", function (err, data) {
        parseString(data, function (err, result) {
            var json = result;
            var status_auth = json['soap:Envelope']['soap:Body'][0]['RequestReportStatus'][0];
            var status_username = status_auth['username'] = Client_User_Name
            var status_token = status_auth['token'] = Token
            var status_report_id = status_auth['reportID'] = report_id
            var builder = new xml2js.Builder();
            const xml_file = builder.buildObject(json);
            book_get_status(xml_file)

            async function book_get_status(xml) {
                const status = await book_req(url_books, xml, 'Request_Report_Status', 'Request_Report_Status_Content_Len', 'get_status')
                book_stat(status)
            }
            
            async function book_stat(resp) {
                if (resp['status'] == 'Sent'|| resp['status'] == 'Processing') {
                    book_get_status(xml_file)
                } else {
                    console.log(resp['URL']);
                }
            }
        });
    });
}

// Auction Report
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
    const book_url = await get_book_report_url()
    const authentication_package = await authFIleparse()
    console.log(authentication_package);
}
main_auth()