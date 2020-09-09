'use strict';

function getArgumentType(name){
    switch (name.slice(-1)){
        case "B":
            return "boolean";
        
        case "I":
            return "integer";
        
        case "N":
            return "number";

        case "S":
            return "string";
        
        case "A":
            return "array";
        
        case "O":
            return "object";
        
        default:
            return undefined;
    }
        
    
}

function processDefaultParameter(type,value){
    // TODO
    if (!value){
        return value;
    }

    switch(type){
        case "boolean":
            break;

        case "integer":
            break;

        case "number":
            break;

        case "string":
            return value.replace(/\"/g,"")

        case "array":
            break;

        case "object":
            break;

        default:
            return value;
    }
}

function getArgumentList(functionString){

    // discard function body
    let declarationBody = functionString.split("{")[0].trim();
              
    // cant get the regex to match only argument part functionBody.match(/(?<=(\s*(function)?\s*))(\(.*\))(?=([\s=]*\{))/)
    let argumentDeclaration = declarationBody.match(/(?<=(\()).*(?=(\)))/);
    
    if (argumentDeclaration === null){
        // if function is a monad arrow function without brackets
        argumentDeclaration = declarationBody.split(" ")[0];

    } else {
        argumentDeclaration = argumentDeclaration[0]
    }

    return argumentDeclaration.split(",");
}

function extractMethodInfo(functionObj){
    let objProperties = {};

    Object.keys(functionObj).forEach(propertyName => {
        objProperties[propertyName] = {};

        objProperties[propertyName].type = typeof functionObj[propertyName]

        if (objProperties[propertyName].type === 'function'){
            
            let functionBodyString = functionObj[propertyName].toString();

            let argumentList = getArgumentList(functionBodyString);
        
            argumentList = argumentList.map(arg => {
                let name_default_pair = arg.split("=");
                return {name:name_default_pair[0].trim(),default:name_default_pair[1] ? name_default_pair[1].trim() : name_default_pair[1]}
            }) // separate argument names and default values
            
            // filter functions with no parameters (name is empty string)
            argumentList = argumentList.filter((arg) => {return arg.name});
        
            objProperties[propertyName].arguments = argumentList.map((param) => {
                let type = getArgumentType(param.name);
                let name = type ? param.name.slice(0,-1) : param.name
                let defaultValue = processDefaultParameter(type,param.default)

                return {"name":name,"type":type,"default":defaultValue}               
            })
        }

    })

    return objProperties;
};







module.exports.extractMethodInfo = extractMethodInfo;