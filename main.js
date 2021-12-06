//init stuff
const { Client, ChatTypes } = require('whatsapp-web.js');
const client = new Client({ puppeteer: { headless: false }, clientId: 'example' });
const fsPromises = require('fs').promises;
client.initialize();
client.on('qr', (qr) => {
    console.log('QR RECEIVED', qr);
});
client.on('authenticated', () => {
    console.log('AUTHENTICATED');
});
client.on('auth_failure', msg => {
    console.error('AUTHENTICATION FAILURE', msg);
});
client.on('ready', () => {
    console.log('READY');
});
client.on('disconnected', (reason) => {
    console.log('Client was logged out', reason);
});
///

//slightly edited but pretty much a copy paste function from https://www.geeksforgeeks.org/node-js-filehandle-readfile-method/
async function readtxtfrom(filename) {
    let filehandle = null;
    try {
        filehandle = 
        await fsPromises.open(filename, 'r+');
        var txtdata = 
        await filehandle.readFile("utf8");
        await filehandle.close()//closes the file. idk why this wasn't included in there example
        return txtdata;//returns the read data
    } catch (e) {
        console.log("Error", e);
    }
}
//another variation of that but it returns an array (each line(phone number) is an element)
async function readtxtlines(filename) {
    let filehandle = null;
    try {
        filehandle = 
        await fsPromises.open(filename, 'r+');
        var txtdata = 
        await filehandle.readFile("utf8");
        await filehandle.close()
        lines = txtdata.split(/\r\n|\n|\r/);
        return lines;
    } catch (e) {
        console.log("Error", e);
    }
}
//another variation that writes new lines to a txt file (currently only used for whitelisting)
async function writetxtline(filename,towrite) {
    let filehandle = null;
    try {
        filehandle = 
        await fsPromises.open(filename, 'a');
        await filehandle.appendFile(towrite)
        await filehandle.appendFile("\n")
        await filehandle.close()
    } catch (e) {
        console.log("Error", e);
    }
}
//


client.on('message_create', (msg) => {
    msg.getChat().then(function(inGroup) {
        if (inGroup.isGroup){//used to stop the bot from sending response messages to group chats
            console.log('group msg -> ignoring');
        }else if(msg.type == "revoked"){
            console.log('someone deleted a message -> ignoring');
        }else if (msg.fromMe){
            if (msg.body =="!whitelist"){
                writetxtline("whitelist.txt",msg.to)
                console.log("added",msg.to,"to the whitelist")
                msg.reply("added to the whitelist")
            }else if(msg.body == "!rmwhitelist"){
                //removes the contact from whitelist
                //will work on it
            }
        }else if (!inGroup.isGroup){
            var date = new Date();
            //you can use the check below to set a time in which the bot stops sending response messages
            //anything above == 23 will make the bot always responed with the message
            //currently set to between 12AM and 1AM aka. 0(or 24, idk man i don't use 24 hour format) to 1
            if(date.getHours() == 0 ){
                console.log("private msg inside active hours -> ignoring")
            }else if(msg.from == "status@broadcast") { //this is used so that the bot doesn't try to respond to status updates
                console.log("status update -> ignoring")
            }else{
                readtxtlines("whitelist.txt").then(function(lines){
                    if (lines.includes(msg.from)){
                        console.log("private msg from a whitlisted number -> ignoring")
                    }else{
                        console.log("private msg outside active hours -> sending automsg to", msg.from, "time =",Date())
                        readtxtfrom("automsg.txt").then(function (txtdata){
                            client.sendMessage(msg.from, txtdata);
                        })
                    }
                })
            }
        }
    },
    function(error) {console.log(error)});
},);