// consumes msgs from bus to simulate tickers
// recieve msg rom srv bus

const express = require('express');
const bodyParser = require('body-parser');
const app = express();
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
const port = 3003;

const _PAIR = "XETHZEUR"
const error =[];
var tick=2344;

function constructResponse(result) {
    const resp = {
        error : error,
        result: result
    }
    return JSON.stringify(resp);
}

// Open orders
app.get('/Price', (req, res) => {
    console.log("-----/Price called-----");   
    const result = {
        price : tick
    } ;
    res.send(constructResponse(result));
});


app.listen(port, () => {
    console.log(`Example app listening at http://localhost:${port}`)
})
