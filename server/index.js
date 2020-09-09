'use strict'; 
const path = require('path');
const fs = require('fs');
var codeScanner = require('./codeScanner');

require('dotenv').config();
let globalPort = process.env.PORT || 1234;

const express = require('express');
var app = express();
var server = require('http').createServer(app);
const WebSocket = require('ws')

const wss = new WebSocket.Server({ server:server, port:1235 });
let clientCounter = 0;


// TODO pipe console output to a readable stream

const { Stream } = require('stream');
var consoleStream = new Stream();
// let consoleWrite = process.stdout.write;
// process.stdout.write = (args) => {
//     consoleStream.emit("data",args);
//     args = Array.isArray(args) ? args : [args]; // avoids type errors
//     return consoleWrite.apply(process.stdout, args);
// }

let customSock = {
    querries:{
        isModuleLoaded:"isModuleLoaded",
        loadModule:"loadModule",
        executeMethod:"executeMethod",
        error:"error"
    },
    responces:{
        isLoaded:"isLoaded",
        moduleData:"moduleData",
        consoleLine:"consoleLine",
        error:"error"
    },
}

var activeCodeObj;

app.get("/",(req,res) => {
    res.sendFile(path.join(__dirname, "../client/index.html"))
})

app.use("/client",express.static(path.join(__dirname, "../client/")))


app.get("/allModules", (req,res) => {
    fs.readdir(path.join(__dirname,"../Modules"),(error,files) => {

        if (error){
            console.log(error)
            res.statusCode = 500;
            res.send(error);
        } else {
            files = files.filter((file) => file.endsWith(".js")).map((file) => file.slice(0,-3))
            res.json(files)
        }  
    })
})

let wsFunctions = {
    isLoaded: (ws) => {
        ws.sendObject({
            event:customSock.responces.isLoaded,
            data:{
                moduleIsLoaded:activeCodeObj?true:false,
                loadedFileName:activeCodeObj.ThisLocalFilename ? activeCodeObj.ThisLocalFilename: undefined,
            }
        })
    },
    loadModule: (ws,{fileName}) => {
        activeCodeObj = require(path.join(__dirname, "../Modules",fileName + ".js"));
        activeCodeObj.ThisLocalFilename = fileName;
        ws.sendObject({
            event:customSock.responces.moduleData,
            data:codeScanner.extractMethodInfo(activeCodeObj)
        })
    },
    executeMethod: (ws,{methodName:methodToCall,methodArguments}) => {
        // TODO figure out a way to not log when the module logs

        if (activeCodeObj){
            methodArguments = parseParameters(methodArguments)
            console.log("returned =>",activeCodeObj[methodToCall](...methodArguments))
        } else {
            ws.sendObject({
                event:customSock.responces.error,
                data:"No module is loaded"
            })
        }
    }
}

wss.on("connection",(ws) => {
    clientCounter++;
    console.log("connected to client",clientCounter)

    // TODO maybe add filter to the console pipeline
    // TODO maybe separate this console and module console
    
    ws.sendObject = (obj) => {
        ws.send(JSON.stringify(obj))
    }
    
    // pipe console output to client
    consoleStream.on("data",(data) => {
        ws.sendObject({event:"consoleLine",data:data} );
    })

    ws.on("message",(message) => {
        message = JSON.parse(message);
        let {event:command, ...parameters} = message;

        try{
            console.log("received",command, parameters)
            wsFunctions[command](ws,parameters);   

        } catch(err){
            console.log(err)
            ws.sendObject({event:"error",data:err})
        }

    }) 

    ws.on("close",() => {
        console.log("!",clientCounter,"Disconnected")
    })
    
})

function parseParameters(params){
    console.log("params",params)

    return params.map((param) => {
        if (param == ""){
            return undefined;
        } else {
            return param;
        }
        
    })
}

app.listen(globalPort,() => {
    console.log(globalPort,"server live")
})