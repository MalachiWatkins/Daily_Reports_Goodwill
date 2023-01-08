import pymongo

myclient = pymongo.MongoClient("")
mydb = myclient["reports"]
mycol = mydb["report"]

del_old_rept = mycol.delete_many({})
