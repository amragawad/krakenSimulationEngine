// consumes msgs from bus to simulate tickers
// recieve msg rom srv bus

const axios = require('axios');
const express = require('express');
const bodyParser = require('body-parser');
const app = express();
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
const port = 3003;

const _PAIR = "XETHZEUR"
const error =[];
var tick=114.97;
const ordersLink = "http://localhost:3000/pulse";

function constructResponse(result) {
    const resp = {
        error : error,
        result: result
    }
    return JSON.stringify(resp);
}

// Open orders
app.get('/Price', (req, res) => {
    //console.log("-----/Price called-----");   
    const result = {
        price : tick
    } ;
    res.send(constructResponse(result));
});


app.get('/tick', async (req, res) => {
    //console.log("-----/tick called-----");
    // here we recieve ticks from engine everytime the price changes
    // req.param should have the price
    tick = parseFloat(req.query.price);
    const time = req.query.time;
    //console.log("Price: " + tick);
    await axios.get(ordersLink, { params: { price: tick , time: time} });
    res.send("ok");
});

app.listen(port, () => {
    //console.log(`Example app listening at http://localhost:${port}`)
})
