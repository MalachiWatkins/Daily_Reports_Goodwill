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
      ecomm_perfom_sheet = workbook['Ecomm Performance Funmi']
      response = requests.get('http://3.145.105.87:2000/data')
      res = response
      res_json = res.json()
      monthly_total_orders = []
      monthly_listings = []
      for x in res_json:
        try:
          if x['Report'] == "orders":
            if x['Date_Type'] == "Yesterday":
              ecomm_perfom_sheet["C4"] = "$" + str(round(x['Total_sales'], 2))
              ecomm_perfom_sheet["C5"] = x['shipping']['Rev'][0]
              ecomm_perfom_sheet["C7"] = str(x['Total_orders'])
              ecomm_perfom_sheet["C8"] = x['PPI']
              ecomm_perfom_sheet["C11"] = str(x['SGW_Sales'])
              ecomm_perfom_sheet["C12"] = str(x['Ebay_Sales'])
            elif x['Date_Type'] == "Monthly":
              ecomm_perfom_sheet["F6"] = str(x['Total_sales']) # MTD Sales
              ecomm_perfom_sheet["F7"] = x['shipping']['Rev'][0]
              ecomm_perfom_sheet["F8"] = str(x['Total_orders']) # MTD Items Sold
              monthly_total_orders.append(x['Total_orders'])
              ecomm_perfom_sheet["J5"] = x['PPI']
              ecomm_perfom_sheet["J12"] = x['shipping']['Cost'][0]
          elif x['Report'] == "action":
            if x['type'] == "Yesterday":
              ecomm_perfom_sheet["C15"] = str(x['Postings'][0])
              ecomm_perfom_sheet["C16"] = str(x['PPL'])
              ecomm_perfom_sheet["C17"] = str(x['Orders_Shipped'][0])
            elif x['type'] == 'Monthly':
              ecomm_perfom_sheet["J4"] = str(x['Postings'][0])
              monthly_listings.append(x['Postings'][0])
          elif x["Report"] == "inv":
            ecomm_perfom_sheet["C20"] = str(x['Active_Inv']['SGW'][0]) # Active SGW Listings
            ecomm_perfom_sheet["C21"] = str(x['Active_Inv']['eBay'][0]) # Active Ebay Listings
            units_shelved = float(x['Active_Inv']['SGW'][0]) + float(x['Active_Inv']['eBay'][0])
            ecomm_perfom_sheet["F13"] = str(units_shelved) # is just total active listings
          elif x['Report'] == 'refund_report':
            ecomm_perfom_sheet["J7"] = round(x['refund_report']['Total_refunds'], 2) # Active SGW Listings
        except:
          pass
      workbook.save(filename="Daily_Report.xlsx")
      return
test()


# sell throuh is items sold / items listed 