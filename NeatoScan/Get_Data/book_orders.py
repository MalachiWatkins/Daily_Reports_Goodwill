import json
import re
import sys
import os
import pymongo
myclient = pymongo.MongoClient("mongodb://18.189.171.25:27017/")
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
sgw_sub = []
ebay_sub = []
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
       
        if 'eBay' in list_of_lists[x]:
            # all_matched 0 index_in_list -1 = sku index # if ebay in the lst sku is -2 insted of -1
            sku_index = index_of_first_match - 2
            
            try:
               # print("Ebay...." + str(all_matched[0]) + ":" + str(all_matched[3]))
                ebay_sub.append(float(all_matched[0]))
            except:
                #print("Ebay...." + str(all_matched[0]))
                ebay_sub.append(float(all_matched[0]))
            
        else:
            sku_index = index_of_first_match - 1
           # print("SGW" + "...." + str(all_matched[0])  + ":" +  str(all_matched[1]))
            sgw_sub.append(float(all_matched[0]))
        order_sku = list_of_lists[x][sku_index]
        # if the sku index returns an number skip it because its value is 
    x+=1

y = {
    "Report": "books_orders",
    "SGW": round(sum(sgw_sub)),
    "Ebay": round(sum(ebay_sub))
}
x = mycol.insert_one(y)

# I need a source report so bacisally i need to work on grabbing all users listings and there sku and out them in a db 
# then here i can check it agiants the sku to get the soucre subtotal report

# IF ebay then we just need index 0 and 3 in all matched

# Find all mmoney with regex then the index that the sales occur in is always the same so for example when sorted the index
# of the currency at 1 will always be subtotal ( not accurate still need to figure all the info out but the base 
# idea should be funconal using the above sorting method should make this process fast and effecant (obviosly inporve the
# method above) )