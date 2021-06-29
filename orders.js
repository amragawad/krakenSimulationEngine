const express = require('express');
const bodyParser = require('body-parser');
const fs = require('fs');
const { default: axios } = require('axios');
const app = express();
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
const port = 3000;
const engineLink = "http://localhost:3003"

// for simiplicty we use int index
var index = 0;

const _PAIR = "XETHZEUR";
const _LIMIT = "limit";
const _MARKET = "market";
const _TYPE_BUY = "buy";
const _TYPE_SELL = "sell";
const _FEE = 0.003;

var time = new Date();

// 
var openOrders = { open: {} }
var Balance = 1000;
const error = [];
fs.writeFileSync('Balance.json', Balance + " , " +  Object.keys(openOrders.open).length +" , "+ time + "  \n");

function recordBalance() {
    fs.appendFileSync('Balance.json', Balance + "," + Object.keys(openOrders.open).length + " , "+ time +" \n");
}

async function getPrice() {
    const resp = await axios.get(engineLink + "/Price");
    const price = (resp.data.result['price']);
    console.log(price);
    return price;
}

async function constructTicker() {
    // get current price from engine
    const price = await getPrice();

    return {
        [_PAIR]: {
            a: [
                price
            ]
        }
    };
}

function cancelOrder(txid) {
    delete openOrders.open[txid];
}

function createOpenOrder(type, orderType, volume, pair, price, closePricePerc) {

    const sellPrice = price + (price * (closePricePerc[1] / 100));
    var descr = {
        "ordertype": orderType,
        "type": type,
        "volume": volume,
        "pair": pair,
    }
    if (type == _TYPE_BUY) {
        descr.price = price;
        descr['close[ordertype]'] = "take-profit";
        descr['close[price]'] = closePricePerc;
    }
    else {
        descr.price = sellPrice;
    }
    return {
        'descr': descr
    };
}

function executeSellOrder(order, cost) {
    // decrease Balance
    // console.log(order);
    // console.log("Cost: " + cost);
    const fee = cost * _FEE;
     console.log("Fee: " + fee);
     console.log((cost - fee));
    Balance += (cost - fee);
    recordBalance();
}

function createBuyOrder(order, price) {
    /*
    example order req
    {
            "ordertype": "market",
            "type": "buy",
            "volume": "volume",
            "pair": "ETHEUR",
            "close[ordertype]" : "take-profit",
            "close[price]": "+1%" ,
            "validate": "validateOrder"
    }
    */
    var newOpenOrder = [];
    console.log(order);
    if (order.ordertype == _MARKET) {
        console.log(order.ordertype + " buy order is being executed @price: " + price);
        //console.log(order);
        var cost = (order.volume * price);
        const fee = cost * _FEE;
        cost = cost + fee;
        // check if balance is enough
        if (Balance < cost) {
            console.log(" low fund: Balance: " + Balance + "cost: " + cost);
            return;
        }
        // update balance
        Balance = Balance - cost;
        recordBalance();
        // add to Open orders
        newOpenOrder = createOpenOrder(_TYPE_SELL, _LIMIT,
            order.volume, order.pair, price, order['close[price]']);
    }
    else if (order.ordertype == _LIMIT) {
        console.log(order.ordertype + " buy order is  recieved");
        //console.log(order);
        newOpenOrder = createOpenOrder(_TYPE_BUY, _LIMIT,
            order.volume, order.pair, order.price, order['close[price]']);
    }
    //console.log(newOpenOrder);
    addToOpenOrders(newOpenOrder);
    // incrrease index 
    index++;

    return { // just fake resp to make sure result is not empty
        "descr": {
            "order": "buy 2.12340000 XBTUSD @ limit 45000.1 with 2:1 leverage",
            "close": "close position @ stop loss 38000.0 -> limit 36000.0"
        },
        "txid": [
            "OUF4EM-FRGI2-MQMWZD"
        ]
    }
}

function isEmpty(object) {
    return Object.keys(object).length === 0
}

function addToOpenOrders(order) {
    if (isEmpty(order)) {
        return;
    }
    openOrders.open[index] = order;
}

function constructResp(result) {
    const ret = {
        error : error,
        result : result
    };
    return JSON.stringify(ret);
}

function tick(priceTick) {
    
    var deleteIndex = [];
    // loop thru open orders to check if the recieved price
    // triggers sell/buy order
    Object.entries(openOrders.open).forEach(
        ([indx, openOrderDescr]) => {
            //console.log(indx, openOrderDescr);
            if (openOrderDescr.descr.type == _TYPE_SELL && priceTick >= openOrderDescr.descr.price) {
                console.log("Price match, executing  " + openOrderDescr.descr.type + " @price:" + priceTick);
                executeSellOrder(openOrderDescr.descr, priceTick * openOrderDescr.descr.volume);
                deleteIndex.push(indx);
            }
            else if (openOrderDescr.descr.type == _TYPE_BUY && priceTick <= openOrderDescr.descr.price) {
                console.log("Price match, executing  " + openOrderDescr.descr.type + " @price:" + priceTick);
                openOrderDescr.descr.ordertype = _MARKET;
                createBuyOrder(openOrderDescr.descr, priceTick);
                deleteIndex.push(indx);
            }
            // now delete the executed orders from the open orders
            deleteIndex.forEach(element => {
                //console.log(openOrders.open[element]);
                delete openOrders.open[element];
            });
        }
    );

}

// Open orders
app.post('/OpenOrders', (req, res) => {
    console.log("-----/OpenOrders called-----");
    res.send(constructResp(openOrders));
});

// add sell or buy order
app.post('/AddOrder', async (req, res) => {
    console.log("-----/AddOrder called-----");
    console.log(req.body);
    // get current ETH price
    const price = await getPrice();
    // assume always buy or buy limit order with sell-take-profit fields
    // execute the buy order
    const result = createBuyOrder(req.body, price);

    res.send(constructResp(result));
});

// retrun the current balance
app.post('/Balance', (req, res) => {
    console.log("-----/Balance called-----");
    const jsonBalance = { ZEUR: Balance };
    res.send(constructResp(jsonBalance));
});

app.post('/Ticker', async (req, res) => {
    console.log("-----/Ticker called-----");
    const result = await constructTicker();
    res.send(constructResp(result));
});

app.post('/CancelAll', (req, res) => {
    console.log("-----/CancelAll called-----");
    openOrders = { open: {} };
    res.send("ok");
});

// cancel order
app.post('/CancelOrder', (req, res) => {
    console.log("-----/CancelOrder called-----");
    cancelOrder(req.body.txid);
    res.send("ok");
});
// Internal api
app.get('/pulse', (req, res) => {
    console.log("-----/pulse called-----");
    // here we recieve ticks from engine everytime the price changes
    // req.param should have the price
    time = req.query.time;
    tick(parseFloat(req.query.price));
    res.send("ok");
});

app.listen(port, () => {
    console.log(`Example app listening at http://localhost:${port}`)
})

