import statistics
from openpyxl import load_workbook
import requests
#       # Inventory
#       
#       sheet["F13"] = "" # Sgw Gaylords
#       sheet["F14"] = "" # SGW Totes
#       sheet["F15"] = "" # Jewl Totes
#       sheet["F16"] = "" # Computer Gaylord
#       #
#       sheet["J4"] = "" # MTD Postings
#       sheet["J5"] = "" # MTD PPI
#       sheet["J11"] = "" # MTD Orders
#       sheet["J12"] = "" # MTD Shipping Cost
#       sheet["J13"] = "" # MTD Shipping Cost Per order 

def test():
      workbook = load_workbook(filename="Daily _Report.xlsx")
      ecomm_perfom_sheet = workbook['Ecomm Performance']

      response = requests.get('')
 
      res = response

      res_json = res.json()
      for x in res_json:
        # x is documents in DB
        if x['Report'] == "orders":
          if x['Date_Type'] == "Daily":
            ecomm_perfom_sheet["C4"] = "$" + str(round(x['Total_sales'], 2))
            ecomm_perfom_sheet["C6"] = str(x['Total_orders'])
            ecomm_perfom_sheet["C7"] = str(x['PPI'])
            ecomm_perfom_sheet["C10"] = str(x['SGW_Sales'])
            ecomm_perfom_sheet["C11"] = str(x['Ebay_Sales'])
          elif x['Date_Type'] == "Monthly":
            ecomm_perfom_sheet["F6"] = str(x['Total_sales']) # MTD Sales
            ecomm_perfom_sheet["F7"] = str(x['Total_orders']) # MTD Items Sold

        elif x['Report'] == "action":
          if x['type'] == "Daily":
            ecomm_perfom_sheet["C14"] = str(x['Postings'][0])
            avg_postings = float(x['Postings'][0]) / 5
            ecomm_perfom_sheet["C15"] = str(round(avg_postings,2)) # this is just postings divided by 5
            ecomm_perfom_sheet["C16"] = str(x['Orders_Shipped'][0])

        elif x["Report"] == "inv":
          ecomm_perfom_sheet["C19"] = str(x['Active_Inv']['SGW'][0]) # Active SGW Listings
          ecomm_perfom_sheet["C20"] = str(x['Active_Inv']['eBay'][0]) # Active Ebay Listings
          units_shelved = float(x['Active_Inv']['SGW'][0]) + float(x['Active_Inv']['eBay'][0])
          ecomm_perfom_sheet["F12"] = str(units_shelved) # is just total active listings
      workbook.save(filename="Daily _Report.xlsx")
      return
test()