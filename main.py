import requests
def test():
    sub_list = []
    x = 0
    while x < 50:

        r=requests.get("https://app.uprightlabs.com/api/orders?page="+str(x)+"&per_page=40&sort=ordered_at.desc", headers={"X-Authorization":""})
        json_response = r.json()
        for order in json_response['orders']:
            if "2022-08-15" in order['paid_at']:
                print(order['subtotal'])
            else:
                print(order['paid_at'])
        x+=1
    return

def test2():
    list = []
    r=requests.get("https://app.uprightlabs.com/api/reports/order_items?time_start=2022-08-15T05:00:00.247Z&time_end=2022-08-16T05:00:59.247Z", headers={"X-Authorization":""})
    json_response = r.json()
    for data in json_response['data']:
        if "08/15/2022" in data['order_paid_at']:
            list.append(float(data['order_item_subtotal']))
        if "08/16/2022" in data['order_paid_at']:
            list.append(float(data['order_item_subtotal']))
    print(sum(list))

    return

def test3():
    # THIS IS ACURATE
    r=requests.get("https://app.uprightlabs.com/api/reports/productivity/operational?interval=day&time_start=2022-07-18T00:00:00.247Z&time_end=2022-07-18T23:59:13.247Z", headers={"X-Authorization":""})
    json_response = r.json()
    print(json_response)
    return
test2()
