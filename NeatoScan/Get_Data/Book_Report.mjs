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
    SOAP_urls
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
var Request_Book_Order_report_XML = '/home/malachi/Desktop/Projects/Daily_Reports_Goodwill/NeatoScan/xml_files/Request_Book_Order_Report.xml'
var Report_Status_Books_XML = '/home/malachi/Desktop/Projects/Daily_Reports_Goodwill/NeatoScan/xml_files/Request_Report_Status.xml'

const url_books = SOAP_urls['Books_Url']; // Main Book URL

//
function delay(time) {
    return new Promise(resolve => setTimeout(resolve, time));
  } 

// Request Function
function req(url, xml, SA, CL, type) {
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
        getReport_id(xml)

    });
});
async function getReport_id(xml_file) {
    const report_id = await req(url_books, xml_file, 'Book_Report_Request', 'Book_Report_Request_Content_Len', 'order_report')
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
            
            async function stat(resp) {
                if (resp['status'] == 'Sent'|| resp['status'] == 'Processing') {
                    get_status(xml_file)
                } else {
                    console.log(resp['URL']);
                                        // const curl_url = exec('curl ' + resp['URL'][0] + ' --output order_rept.zip')
                    // async function decompress_zip() {
                    //     await new Promise(r => setTimeout(r, 2000));
                    //     decompress('order_rept.zip', "report").then(files => {
                            
                    //     });
                    // }
                    // const a = await decompress_zip()
                    // const pythonProcess = spawn('python3',["/Users/malachiwatkins/Desktop/work/Daily_Reports_Goodwill/NeatoScan/Get_Data/book_orders.py"]);

                }
            }
        });
    });
}
