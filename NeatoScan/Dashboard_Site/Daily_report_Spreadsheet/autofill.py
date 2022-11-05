import statistics
from openpyxl import load_workbook
import requests
class report:


    def fill(self):
      warehouse_api = 'http://10.118.0.165:2041/api'
      statistics_api ='http://10.118.0.165:2000/data'
          # Start by opening the spreadsheet and selecting the main sheet
      workbook = load_workbook(filename="Daily _Report.xlsx")
      sheet = workbook.active
      # get another sheet is Store_sheet = workbook['sheetname']

      # Cells
      # Date 
      sheet["B3"] = ""
      sheet["B13"] = ""
      #
      sheet["C4"] = "" # Daily Sales
      sheet["C6"] = "" # Daily Items Sold
      sheet["C7"] = "" # Daily PPI
      sheet["C10"] = "" # Sgw Sales
      sheet["C11"] = "" # Ebay Sales
      sheet["C14"] = "" # Daily Listings
      sheet["C15"] = "" # Avg Postings Per Lister
      sheet["C16"] = "" # Daily Orders Shipped
      sheet["C19"] = "" # Active SGW Listings
      sheet["C20"] = "" # Active Ebay Listings

      sheet["F6"] = "" # MTD Sales
      sheet["F7"] = "" # MTD Items Sold
      # Inventory
      sheet["F12"] = "" # Daily Units Shelved
      sheet["F13"] = "" # Sgw Gaylords
      sheet["F14"] = "" # SGW Totes
      sheet["F15"] = "" # Jewl Totes
      sheet["F16"] = "" # Computer Gaylord
      #
      sheet["J4"] = "" # MTD Postings
      sheet["J5"] = "" # MTD PPI
      sheet["J11"] = "" # MTD Orders
      sheet["J12"] = "" # MTD Shipping Cost
      sheet["J13"] = "" # MTD Shipping Cost Per order 
      # Save the spreadsheet
      workbook.save(filename="Daily _Report.xlsx")

      
 
      # Making a get request
      response = requests.get('https://api.github.com')
 
      # print response
      print(response)
 
      # print json content
      print(response.json())  
      return
    def file(self):

      return

report_class = report()

report_class.fill()