const express = require('express');
const bodyParser = require('body-parser');
const { default: axios } = require('axios');
const app = express();
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
const port = 3000;
const engineLink = "http://localhost:3003"

// for simiplicty we use int index
var index=0;

const _PAIR = "ETHEUR";
const _LIMIT = "limit";
const _MARKET = "market";
const _TYPE_BUY = "buy";
const _TYPE_SELL = "sell";

// 
var openOrders = []
var Balance = 600;
const error = [];

async function getPrice() {
    const resp = await axios.get(engineLink+"/Price");
    const price = (resp.data.result['price']);
    //console.log(price);
    return price;
}

async function constructTicker() {
    // get current price from engine
    const price = await getPrice();
    
    return {
        [_PAIR]: {
            a : [
                price
            ]
        }
    };
}

async function createBuyOrder(order) {
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
    if(order.ordertype == _MARKET)
    {
        // get current ETH price
        const price = await getPrice();
        console.log(order.ordertype + " buy order is being executed @price: " + price);
        var cost = (order.volume * price);
        const fee = cost * 0.03;
        cost = cost + fee;
        // check if balance is enough
        if(Balance < cost)
        {
            console.log(" low fund: Balance: " + Balance + "cost: " + cost);
            return;
        }
        // update balance
        Balance = Balance - cost;

        // add to Open orders
        addToOpenOrders(order);
        // incrrease index 
        index++;        
    }
    const buyOrderReturn = {
        "descr": {
            "order": "buy 2.12340000 XBTUSD @ limit 45000.1 with 2:1 leverage",
            "close": "close position @ stop loss 38000.0 -> limit 36000.0"
            },
        "txid": [
            "OUF4EM-FRGI2-MQMWZD"
            ]
    }
}

function addToOpenOrders(order) {
    /* example
"open": {
"OQCLML-BW3P3-BUCMWZ": {
"descr": {
    "pair": "XBTUSD", // _PAIR
    "type": "buy",
    },
}
    */
   const openOrderJson = {
       'open': {
            [index] : {
                'descr': {
                    'pair': order.pair,
                    'type': order.type
                }
            }
       }
   }
   //index+=1;
   openOrders.push(openOrderJson);
}

function constructResp(result) {
    return "{'error': " + JSON.stringify(error) + ", 'result': " + JSON.stringify(result) + "}";
}

// Open orders
app.get('/OpenOrders', (req, res) => {
    console.log("-----/OpenOrders called-----");
    res.send(constructResp(openOrders));
});

// add sell or buy order
app.post('/AddOrder', async (req, res) => {
    console.log("-----/AddOrder called-----");
    // assume always buy or buy limit order with sell-take-profit fields
    // execute the buy order
    await createBuyOrder(req.body);

    res.send(constructResp(openOrders));
});

// retrun the current balance
app.get('/Balance', (req, res) => {
    console.log("-----/Balance called-----");
    const jsonBalance = { ZEUR: Balance };
    res.send(constructResp(jsonBalance));
});

app.get('/Ticker', async (req, res) => {
    console.log("-----/Ticker called-----");    
    const result = await constructTicker();
    res.send(constructResp(result));
});


app.listen(port, () => {
    console.log(`Example app listening at http://localhost:${port}`)
})

