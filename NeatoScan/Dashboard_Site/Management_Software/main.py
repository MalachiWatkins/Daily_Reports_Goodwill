import json
import re
import sys
import os
import pymongo
myclient = pymongo.MongoClient("")
mydb = myclient["reports"]
mycol = mydb["report"]


def find_msg():
    msg_query = { "address": "Park Lane 38" }
    msg_doc = mycol.find(msg_query)
    for msg in msg_doc:
        print(msg)

    return msg
def add_msg(h1, h2, p1, p2):
    msg_doc = {
        "Type": 'MSG',
        "H1": h1,
        "P1": p1,
        "H2": h2,
        "P2": p2,    
    }
    msg_insert = mycol.insert_one(msg_doc)
    return

def delete_msg():
    del_msg_query ={'H1':'H1'}
    mycol.delete_one(del_msg_query)
    return
#find_msg()
#add_msg("H1", 'h2', 'p1', 'p2')
delete_msg()
# x = mycol.insert_one(y)

# from tkinter import *   
 
# # create a tkinter window
# root = Tk()             
# root.configure(bg='white')
# # Open window having dimension 100x100
# root.geometry('400x400')

# label=Label(root, text="System Information", font=("Courier 22 bold"))
# label.pack(pady = 20)

# Type = Label(root, text="Type: ", font=("Courier 14 bold"))
# Type.pack()

# Serial = Label(root, text="Serial Number: ", font=("Courier 14 bold"))
# Serial.pack()

# man = Label(root, text="Manufacturer: ",font=("Courier 14 bold"))
# man.pack()
# mod = Label(root, text="Model: ", font=("Courier 14 bold"))
# mod.pack()
 
# root.mainloop()