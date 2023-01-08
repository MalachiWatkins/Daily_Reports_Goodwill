import json
import re
import sys
import os
import pymongo
import random
myclient = pymongo.MongoClient("")
mydb = myclient["reports"]
mycol = mydb["report"]

a_file = open("/Users/malachiwatkins/Desktop/work/Daily_Reports_Goodwill/NeatoScan/Get_Data/report/report.txt", "r")

list_of_lists = []
for line in a_file:
  stripped_line = line.strip()
  line_list = stripped_line.split()
  list_of_lists.append(line_list)

a_file.close()

#regex = r"(^\d\.\d\d$)"
regex = r"(^\d*\d\.\d\d$)"
filters = ["Refunded", "Canceled" , "orderid"]# orderid is used to remove lable list # possible filters are  NEW, Refunded, Canceled; New Is the main one we are after as it is the true total orders
# regex: (^.\d.\d\d$) add a as many . after ^ for increasing values
# Order goes Princeable ammount , shipping ammount, shipping holdback, closing ammount, shipping tax, tax, marketplaceCommision

# This Set can give me
# Store specific: orders, sales mtd and daily

# If dupe then its always first in the list
stores = ["220", '108', '100', '101', '103', '110', '118', '123', '131', '205', '211', '214', '204', '222', '202', '206', '224']
sgw_sub = []
ebay_sub = []
shipping_rev = []
shipping_cost = []
items_sold = len(list_of_lists)
Store_report = {
    '220': {"Orders": [0], "Ebay": [], "SGW": []},
    '108': {"Orders": [0],"Ebay": [], "SGW": []},
    '100': {"Orders": [0],"Ebay": [], "SGW": []},
    '101': {"Orders": [0],"Ebay": [], "SGW": []},
    '103': {"Orders": [0],"Ebay": [], "SGW": []},
    '110': {"Orders": [0],"Ebay": [], "SGW": []},
    '118': {"Orders": [0],"Ebay": [], "SGW": []},
    '123': {"Orders": [0],"Ebay": [], "SGW": []},
    '131': {"Orders": [0],"Ebay": [], "SGW": []},
    '205': {"Orders": [0],"Ebay": [], "SGW": []},
    '211': {"Orders": [0],"Ebay": [], "SGW": []},
    '214': {"Orders": [0],"Ebay": [], "SGW": []},
    '204': {"Orders": [0],"Ebay": [], "SGW": []},
    '222': {"Orders": [0],"Ebay": [], "SGW": []},
    '202': {"Orders": [0],"Ebay": [], "SGW": []},
    '206': {"Orders": [0],"Ebay": [], "SGW": []},
    '224': {"Orders": [0],"Ebay": [], "SGW": []},

}
x = 0
while x < len(list_of_lists):
    if any(item in filters for item in list_of_lists[x]):
        pass
    else: 
        y = 0
        all_matched = []
        while y < len(list_of_lists[x]):
            matches = re.findall(regex, list_of_lists[x][y], re.MULTILINE)
            try:
                all_matched.append(matches[0])
            except:
                pass
            y+=1
        index_of_first_match = list_of_lists[x].index(all_matched[0])
        source = []
        for store in stores:
                if store in list_of_lists[x]:
                    source.append(store)
        if 'eBay' in list_of_lists[x]:
            # NEED TO GET A TOTAL OF ALL ORDERS FOR STORES
            # all_matched 0 index_in_list -1 = sku index # if ebay in the lst sku is -2 insted of -1
            try:
                e_sales = Store_report[source[0]]["Ebay"][0]
                n_sale = e_sales + float(all_matched[0])
                Store_report[source[0]]["Ebay"] = [n_sale]
                Order_Num = Store_report[source[0]]['Orders'][0]
                Store_report[source[0]]['Orders'][0] = Order_Num + 1

            except:
                try:
                    Store_report[source[0]]["Ebay"].append(float(all_matched[0]))
                    Order_Num = Store_report[source[0]]['Orders'][0] + 1
                    Store_report[source[0]]['Orders'][0] = Order_Num
                except:
                    pass
            sku_index = index_of_first_match - 2
            # print("Ebay...." + str(all_matched[0]) + ":" + str(all_matched[3]))
            ebay_sub.append(float(all_matched[0]))   
        else:
            try:
                e_sales = Store_report[source[0]]["SGW"][0]
                n_sale = e_sales + float(all_matched[0])
                Store_report[source[0]]["SGW"] = [n_sale]
                Order_Num = Store_report[source[0]]['Orders'][0]
                Store_report[source[0]]['Orders'][0] = Order_Num + 1
            except:
                try:
                    Store_report[source[0]]["SGW"].append(float(all_matched[0]))
                    Order_Num = Store_report[source[0]]['Orders'][0] + 1
                    Store_report[source[0]]['Orders'][0] = Order_Num
                except:
                    pass
            sku_index = index_of_first_match - 1
           # print("SGW" + "...." + str(all_matched[0])  + ":" +  str(all_matched[1]))
            sgw_sub.append(float(all_matched[0]))
            shipping_rev.append(3.99)
            shipping_cost.append(random.uniform(1.21, 3.65))
            


        order_sku = list_of_lists[x][sku_index]
        
        # if the sku index returns an number skip it because its value is 
    x+=1
Total_sales = sum(sgw_sub) + sum(ebay_sub)
ppi = Total_sales / items_sold
avg_ship_cost = items_sold / sum(shipping_cost)

y = {
    "Report": "books_orders",
    "Type": "Monthly",
    "Total_sales": Total_sales,
    "SGW": sum(sgw_sub),
    "Ebay": sum(ebay_sub),
    "PPI": ppi,
    "avg_ship_cost": avg_ship_cost,
    'shipping_rev': sum(shipping_rev),
    'shipping_cost': sum(shipping_cost),
    'items_sold': items_sold,
}
book_store = {
    "Report": "Book_store_orders",
    'Type': "Monthly",
    "rpt": Store_report
}
del_old_rept = mycol.delete_one({'Report': 'Book_store_orders', "Type": "Monthly",})
del_old_store_rpt = mycol.delete_one({'Report': 'books_orders', "Type": "Monthly",})
x = mycol.insert_one(y)
ins_store = mycol.insert_one(book_store)

# add a function to search the aws posgres database for the source to get a sales report by store
# All thse need to be added both to the mongodb and the Postgres table
# ebay has no shipping amound and amazon has 3.99 shipping
# PPI can be gatherd here total_sales / total_items sold 
# total orders can be gatherd here too
