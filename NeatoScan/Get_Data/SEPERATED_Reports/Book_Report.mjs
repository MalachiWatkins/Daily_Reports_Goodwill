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
const require = createRequire(
    import.meta.url);
const axios = require('axios-https-proxy-fix');
const soapRequest = require('easy-soap-request');
var fs = require('fs'),
    parseString = require("xml2js").parseString,
    xml2js = require("xml2js");
const { spawn } = require('child_process');
const { exec } = require('child_process');
const decompress = require("decompress");
// XML File Locatioconst { spawn } = require('child_process');
var Request_Book_Order_report_XML = '/Users/malachiwatkins/Desktop/work/Daily_Reports_Goodwill/NeatoScan/Get_Data/xml_files/Request_Book_Order_Report.xml'
var Report_Status_Books_XML = '/Users/malachiwatkins/Desktop/work/Daily_Reports_Goodwill/NeatoScan/Get_Data/xml_files/Request_Report_Status.xml'
var Report_book_listings = '/Users/malachiwatkins/Desktop/work/Daily_Reports_Goodwill/NeatoScan/Get_Data/xml_files/book_listings.xml'
const url_books = SOAP_urls['Books_Url']; // Main Book URL

// Builds Request file
async function build_request_file(request_xml, type, start_date, end_date) {
    return new Promise((resolve, reject) => {
    fs.readFile(request_xml, "utf-8", function (err, data) { // Request_Book_Order_report_XML is xml file
        parseString(data, function (err, result) {
                var json = result;
                var auth_filter = json['soap:Envelope']['soap:Body'][0][type][0]; // RequestOrdersReport is type
                var auth_Client_User = auth_filter['username'] = Client_User_Name;
                var auth_token = auth_filter['token'] = Token;
                var date_start_filter = auth_filter['startDate'] = start_date;
                var date_end_filter = auth_filter['endDate'] = end_date;
                var builder = new xml2js.Builder();
                const xml = builder.buildObject(json);
                resolve(xml)
            
        });
    });
});
}


// Request Function
function req(url, xml, SA, CL, type, filter_type) {
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
                    var report_ID = json['soap:Envelope']['soap:Body'][0][filter_type + 'Response'][0][filter_type + 'Result'][0]['reportID'];
                    console.log('Report Generating');
                    resolve(report_ID)
                } else {
                    var json = result;
                    var status = json['soap:Envelope']['soap:Body'][0][ 'RequestReportStatusResponse'][0]['RequestReportStatusResult'][0]['status'];
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

        })
    });
}


async function getReport_id(time_filter) {
    //const req_xml = await build_request_file(Report_book_listings, 'RequestListingsReport' , daily_start, daily_end)
    //const report_id = await req(url_books, req_xml, 'Book_Listings', 'Book_Report_Request_Content_Len', 'order_report', 'RequestListingsReport')

    const req_xml = await build_request_file(Request_Book_Order_report_XML, 'RequestOrdersReport' , daily_start, daily_end)
    const report_id = await req(url_books, req_xml, 'Book_Report_Request', 'Book_Report_Request_Content_Len', 'order_report', 'RequestOrdersReport')
    
    fs.readFile(Report_Status_Books_XML, "utf-8", function (err, data) {
        parseString(data, function (err, result) {
            var json = result;
            var status_auth = json['soap:Envelope']['soap:Body'][0]['RequestReportStatus'][0];
            var status_username = status_auth['username'] = Client_User_Name
            var status_token = status_auth['token'] = Token
            var status_report_id = status_auth['reportID'] = report_id
            var builder = new xml2js.Builder();
            const xml_file = builder.buildObject(json);
            get_status(xml_file)
            async function get_status(xml) {
                const status = await req(url_books, xml, 'Request_Report_Status', 'Request_Report_Status_Content_Len', 'get_status')
                stat(status)
            }
            // Implement a delete function for zip file and text file reports
            const rm_zip = exec('rm -rf order_rept.zip')
            const rm_txt = exec('rm -rf report/report.txt')
            async function stat(resp) {
                if (resp['status'] == 'Sent'|| resp['status'] == 'Processing') {
                    get_status(xml_file)
                } else {
                    console.log(resp['URL']);
                    const curl_url = exec('curl ' + resp['URL'][0] + ' --output order_rept.zip')
                    async function decompress_zip() {
                        await new Promise(r => setTimeout(r, 2000));
                        // Decompress needs to change dir based on report gatherd ie: orders: Listing, orders.
                        decompress('order_rept.zip', "report").then(files => {
                            console.log("req");
                        });
                    }
                    const a = await decompress_zip()
                    if (time_filter == 'Daily') {
                        // const pythonProcess = spawn('python3',["/Users/malachiwatkins/Desktop/work/Daily_Reports_Goodwill/NeatoScan/Get_Data/book_orders_daily.py"]);
                    } else {
                        // const pythonProcess = spawn('python3',["/Users/malachiwatkins/Desktop/work/Daily_Reports_Goodwill/NeatoScan/Get_Data/book_orders.py"]);
                    }
                    

                }
            }
        });
    });
}
async function auto_run_daily() {
    getReport_id('Daily')
}
async function auto_run_monthly() {
    getReport_id('Monthly')
}

// setInterval(auto_run_daily, 300000)
// setInterval(auto_run_monthly, 1800000); // 30 mins
auto_run_daily()

