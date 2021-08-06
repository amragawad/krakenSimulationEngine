const axios = require('axios');

const link = "https://api.kraken.com/0/public/Trades?pair=etheur&since=";//&since=1624033581293870666";

// const { ServiceBusClient } = require("@azure/service-bus");

// // connection string to your Service Bus namespace
// const connectionString = "Endpoint=sb://srvbus-a.servicebus.windows.net/;SharedAccessKeyName=RootManageSharedAccessKey;SharedAccessKey=JyylNgjiOhaxpYXlYD0ZdUoqIeFbQwHcPWGwfZ/WefM="

// // name of the queue
// const queueName = "thehistoryticks"

const engineLink = "http://localhost:3003/tick"

start();

async function start() {
    var msgArray = [];                 
    var varLast =     1546300800000000000 ;// from 1st Jan 2019 //1577836800000000000;// from 1 Jan 2020 //1622764800000000000; // from June 4 2021
    const startTime = 1609372800000000000;//(new Date()).getTime() * 1000;// 1596412800000000000; // till 1st Aug 2020
    console.log("Last: "+ startTime);
    while ( startTime > (varLast/1000) ) {
            //console.log(link+varLast);
        const resp = await axios.get(link+varLast); 
		// await new Promise(resolve => 
		// 	{
		// 		//console.log("waiting 500ms to refresh nonce");
		// 		setTimeout(resolve, 500);
		// 	}
		// 	);    
        // check if resp is recieved
        if(resp && resp.data && resp.data.result)
        {   
            varLast = resp.data.result.last;
            console.log(varLast);
			for (let element of resp.data.result['XETHZEUR']) {
                //msgArray.push({body: element});
				await axios.get(engineLink, { params: { price: parseFloat(element[0]) , time: new Date( (element[2] * 1000) ) } });
				// await new Promise(resolve => 
				// 	{
				// 		setTimeout(resolve, 1);
				// 	}
				// 	); 
            }
			// send tick 
            // send msg to service bus
            //await sendMsg(msgArray);
        }
    }

// Make a request for a user with a given ID
// axios.get(link)
//   .then(function (response) {
//     // handle success
//     console.log(response.data.result['XETHZEUR'].length);
//     console.log(response.data.result.last);
//   })
//   .catch(function (error) {
//     // handle error
//     console.log(error);
//   })
//   .then(function () {
//     // always executed
//   });
}


//( async () => console.log(await axios.get(link))) ();

// async function sendMsg(messages) {
// 	// create a Service Bus client using the connection string to the Service Bus namespace
// 	//const sbClient = new ServiceBusClient(connectionString);

// 	// createSender() can also be used to create a sender for a topic.
// 	//const sender = sbClient.createSender(queueName);

// 	try {
// 		// Tries to send all messages in a single batch.
// 		// Will fail if the messages cannot fit in a batch.
// 		// await sender.sendMessages(messages);

// 		// create a batch object
// 		let batch = await sender.createMessageBatch(); 
// 		for (let i = 0; i < messages.length; i++) {
// 			// for each message in the array			

// 			// try to add the message to the batch
// 			if (!batch.tryAddMessage(messages[i])) {			
// 				// if it fails to add the message to the current batch
// 				// send the current batch as it is full
// 				await sender.sendMessages(batch);

// 				// then, create a new batch 
// 				batch = await sender.createMessageBatch();

// 				// now, add the message failed to be added to the previous batch to this batch
// 				if (!batch.tryAddMessage(messages[i])) {
// 					// if it still can't be added to the batch, the message is probably too big to fit in a batch
// 					throw new Error("Message too big to fit in a batch");
// 				}
// 			}
// 		}

// 		// Send the last created batch of messages to the queue
// 		await sender.sendMessages(batch);

// 		console.log(`Sent a batch of messages to the queue: ${queueName}`);

// 		// Close the sender
// 		await sender.close();
// 	} finally {
// 		await sbClient.close();
// 	}
// }