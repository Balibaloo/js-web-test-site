console.log("imported script")

const app = {

    maxSocketRetries:5,
    pages: [],
    showEvent: new Event("show"),
    hashChangeEvent:new Event("hashchange"),
    init:() => {
        window.addEventListener("hashchange",app.onHashChange);
        //window.addEventListener("popstate",(ev) => {console.log("popstate captured")});

        app.initPageLinks();
        app.initPages();
        
        if (location.hash){
            app.nav(location.hash.slice(1,))
        } else {
            history.replaceState({},"Home","#home");
        }
        
        
        
    },
    customSockQuerries:{
        isModuleLoaded:"isModuleLoaded",
        loadModule:"loadModule",
        executeMethod:"executeMethod"},
    customSockResponces:{
        isLoaded:"isLoaded",
        moduleData:"moduleData",
        consoleLine:"consoleLine"
    },
    initPageLinks: ()   => {
        document.querySelectorAll(".nav-link").forEach(link => {
            link.addEventListener("click",app.navByLink);
        })
    },
    navByLink: (ev) => {
        ev.preventDefault();
        let destination = ev.target.getAttribute("navTo");
        history.pushState({}, destination,`#${destination}`)
        window.dispatchEvent(app.hashChangeEvent)
    },
    nav:(destination)=> {
        console.log("naving to",destination)

        if (app.isValidPage(destination)){
            document.querySelector(".visible").classList.remove("visible")
            document.querySelector(`.page#${destination}`).classList.add("visible")
            document.querySelector(`.page#${destination}`).dispatchEvent(app.showEvent)

                // TODO maybe refactor
            console.log("naving to" ,destination)
            switch(destination) {
                
                case "fileView":
                    let response = fetch("http://localhost:1234/allModules")
                    response.then((response) => {

                        if (response.ok){
                            response.json().then((json) => {
                                app.displayAllFiles(json)
                            },(reason) => console.log(reason))

                        } else {
                            console.log("server replier with error: ",response)
                        }
                    })
                    break;
                

                case "moduleView":
                    if (history.state && history.state.fileName){
                        app.fetchModule();
                    } else {
                        console.log("No Module FileName Specified")
                    }
                    break;

                
                default:
                    // location.search = ''
            }

            
        
        } else {
            app.nav("pageNotFound");
        }
    },
    moduleButtonEventListener: (ev) => {
        ev.preventDefault();
        // CANT GET LOCATION TO CHANGE AND PAGE TO RELOAD, REVI
        //location.search = `?fileName=${ev.target.getAttribute("fileName")}`
        history.pushState({fileName: ev.target.getAttribute("fileName")}, "moduleView",`#moduleView`);
        window.dispatchEvent(app.hashChangeEvent)
    },
    getMethodInputs: (ev) => {
        let methodName = ev.target.parentNode.getAttribute("methodname");
        return Array.prototype.slice.call(document.querySelectorAll(`.method-grid>[methodname=${methodName}]>.inputElement`)); 
    },
    validateMethodArguments:(ev) => {
        let inputs = app.getMethodInputs(ev);
        let allValidations = inputs.map(app.validateInput);

        return allValidations.every(status => status);
    },
    validateInput: (input) => {
        // TODO highlight input error

        if ( input.value === "" && input.getAttribute("required") === null ){
            input.nextSibling.innerHTML = ""
            return true;
        }

        switch (input.getAttribute("dataType")){
            case "boolean":
                return true;

            case "integer":

                let validationResult =  /^\d+$/.test(input.value);
                if (!validationResult) {
                    input.nextSibling.innerHTML = "integer can only contain numbers"
                    return false;
                } else {
                    input.nextSibling.innerHTML = ""
                    return true;
                }

                
            case "number":

                if (/^\d+(\.\d+)?$/.test(input.value)){
                    input.nextSibling.innerHTML = ""
                    return true;
                } else {
                    input.nextSibling.innerHTML = "number can only contain numbers and a dot"
                    return false;
                }

            case "string":
                return true;
            
            case "array":
                try {
                    input.nextSibling.innerHTML = ""
                    return input.value[0] === "[" && JSON.parse(input.value); 

                } catch (err){
                    input.nextSibling.innerHTML = "array must start with [ and must be valid json"
                    return false;
                }

            case "object":
                try {
                    input.nextSibling.innerHTML = ""
                    return JSON.parse(input.value);

                } catch (err){
                    input.nextSibling.innerHTML = "object must be valid JSON"
                    return false;
                }
        }
    },
    methodButtonEventListener: (ev) => {
        ev.preventDefault();
        console.log("method called")
        if (app.validateMethodArguments(ev)){
            let message = {
                event:app.customSockQuerries.executeMethod,
                methodName:ev.target.parentNode.getAttribute("methodName"),
                methodArguments:app.getMethodArguments(ev),
            };
            app.ws.send(message);
        }
    },
    initPages: () => {
        app.pages = Array.from(document.querySelectorAll(".page"));
        app.pages.forEach(page => {
            page.addEventListener("show",app.pageShown);
        })
    },   
    isValidPage : (destination) => {
        return app.pages.some(page => {
            return page.id === destination;
        });
    },
    
    pageShown:(ev)=>{
        let h1 = ev.target.querySelector("h1");
        h1.classList.add("big")
        setTimeout((h1)=>{h1.classList.remove("big")},200,h1)

        let loadingIcon = ev.target.querySelector("#loading-icon");
        if (loadingIcon){
            loadingIcon.classList.remove("invisible");
        }

    },
    onHashChange:(ev)=>{
        ev.preventDefault();
        let destination =  location.hash.substr(1);
        app.nav(destination)
    },
    fetchModule:()=>{
        if (!app.ws){
            app.initWebSocket();
        } else {
            app.ws.send({event:app.customSockQuerries.isModuleLoaded})
        }
    },
    initWebSocket: () => {
        
        app.ws = new WebSocket("ws://localhost:1235/");
                
            Object.assign(app.ws,new EventTarget()) // enables the app.ws to handle events

            app.ws.addEventListener("open",(ev) => {
                console.log("connected to server")

                if (false){
                    app.ws.dispatchEvent(new CustomEvent(app.customSockResponces.moduleData,{detail:{
                        testMethod:{type :"function", 
                        arguments: [
                            {name:"someBool",type:"boolean",default:true},
                            {name:"someInt",type:"integer"},
                            {name:"someNum",type:"number"},
                            {name:"someStr",type:"string"},
                            {name:"someArr",type:"array"},
                            {name:"someObj",type:"object"},
                        ]}
                    }}));
                } else {
                    // remove above branch
                    app.ws.send({event:app.customSockQuerries.loadModule,fileName:history.state.fileName})
                }
                
            })

            app.ws.addEventListener("message",messageEvent => {
                // responces are [isLoaded,moduleData,consoleLine]    
                data = JSON.parse(messageEvent.data);
                console.log(data)
                app.ws.dispatchEvent(new CustomEvent(data.event,{detail:data.data}));
            })
    
            let eventErrorLogger = (event) => {console.log("server replied with error => ",(event.detail !== {}) ? event : event.detail)};
            app.ws.addEventListener("error",eventErrorLogger);
            
            // send stringified
            app.ws.unsafeSend = app.ws.send;
            app.ws.send = (data,tryNumber = 0) => {
                try{
                    app.ws.unsafeSend(JSON.stringify(data));
                } catch(err) {
                    if (tryNumber!=app.maxSocketRetries){
                        setTimeout((data,tryNumber) =>{
                            app.ws.send(data,tryNumber++);
                        },2000,data,tryNumber)
                    } else{
                        console.log(err);
                    }
                }
            };
    
            app.ws.addEventListener(app.customSockResponces.moduleData,app.displayModule);
            app.ws.addEventListener(app.customSockResponces.consoleLine,app.displayConsoleOutput)

            app.ws.addEventListener(app.customSockResponces.isLoaded,(ev)=> {
                let requiredModuleName = history.state.fileName;
                if (!ev.detail.moduleIsLoaded || ev.detail.loadedFileName !== requiredModuleName){
                    app.ws.send({event:app.customSockQuerries.loadModule,fileName:requiredModuleName})
                }
            })
    },
    disconnectSocket: () => {
        if (app.ws){
            app.ws.disconnect()
        }
    },
    displayAllFiles: (files)=>{
        console.log(files);

        // remove all buttons
        let container = document.getElementsByClassName("module-grid")[0];
        console.log("button container",container)
        while (container.firstChild){
            container.lastChild.removeEventListener("click",app.moduleButtonEventListener)
            container.removeChild(container.lastChild);
        }

        // hide loading icon
        document.querySelector("#fileView>div>#loading-icon").classList.add("invisible");

        
        files.forEach((file) => {   
            let newButton = document.createElement("button")
            newButton.setAttribute("type", "button");
            newButton.appendChild(document.createTextNode(app.processFileName(file)))
            newButton.classList.add("module-button");
            newButton.setAttribute("fileName", file);

            document.querySelector(".module-grid").appendChild(newButton);
        })

        document.querySelectorAll(".module-button").forEach(button => {
            button.addEventListener("click",app.moduleButtonEventListener)
        })
        
    },
    displayModule: (ev) => {
        let module = ev.detail
        console.log("received module methods = ",module)

        // remove all method buttons
        let methodGrid = document.querySelector(".method-grid");
        while (methodGrid.firstChild){
            methodGrid.lastChild.removeEventListener("click",app.methodButtonEventListener);
            methodGrid.removeChild(methodGrid.lastChild);
        }

        document.querySelector("#moduleView>div>#loading-icon").classList.add("invisible");

        app.generateModuleUi(module,methodGrid);

        document.querySelectorAll(".method-container>[type=submit]").forEach(button => {
            button.addEventListener("click",app.methodButtonEventListener)
        })

    },
    generateModuleUi: (module,methodGrid)=> {

        let hiddenDiv = document.createElement('div');
        
        hiddenDiv.classList.add('hiddendiv');


        Object.keys(module).forEach((methodName) => { 
            if (module[methodName].type === "function"){
                let newForm = app.generateUiFor.methodForm(methodName);
                newForm.appendChild(app.generateUiFor.submitButton(methodName));

                module[methodName].arguments.forEach((argument) => {
                    app.generateUiFor.parameterInput(argument,newForm,hiddenDiv);
                })

                document.querySelector(".method-grid").appendChild(newForm);
            }
        })
    },
    getTrueInputValue: (input) => {
        switch (input.datatype) {
            case "boolean":
                return input.children[0].value;

            case "array":
            case "object":
                return JSON.parse(input.value);

            default:
                return input.value;
        }
        
    },
    getMethodArguments: (ev) => {
        let argumentList = [];
        let inputs = app.getMethodInputs(ev);
        inputs.forEach((input) => {
            argumentList.push(app.getTrueInputValue(input));
        })
        return argumentList;
    },
    displayConsoleOutput: (ev)=>{
        let line = ev.detail
        console.log(line)
    },
    processFileName: (file) => {
        return file;
    },
    processMethodName: (method) => {
        return method;
    },
    displayConsoleOutput: (ev)=>{
        let line = ev.detail
        console.log(line)
    },
    generateUiFor:{
        submitButton: (methodName)  => {
            let button = document.createElement("input");
            button.type = "submit";

            button.classList.add("method-button");
            button.value = methodName;
            return button;
            
        },parameterInput: (argumentObj,container, hiddenDiv) => {
            // TODO use dictionary to store ui generators

            try {
                let content = null;
            } catch (err){}

            let newInput = document.createElement("input");

            if (argumentObj.default){
                newInput.placeholder = `${argumentObj.name}=${argumentObj.default}`;
            } else {
                newInput.placeholder = `${argumentObj.name}=required`
                newInput.required = true;
                newInput.classList.add('requiredInput')
            }

            switch (argumentObj.type){
                case "boolean":
                    let checkbox = newInput;    
                    checkbox.type = "checkbox";
                    checkbox.id = `${argumentObj.name}-checkbox`
                    
                    newInput = document.createElement("div");
                    let newLabel = document.createElement("Label");
                    newLabel.textContent = argumentObj.name
                    newLabel.setAttribute("for",newInput.id)

                    newInput.append(checkbox);
                    newInput.append(newLabel);
                    newInput.classList.add("inputElement");
                    newInput.setAttribute("dataType",argumentObj.type)
                    break;

                case "integer":
                    newInput.type = "number";
                    newInput.step = 1;
                    newInput.pattern = /^d+$/;
                    newInput.setAttribute("dataType",argumentObj.type)
                    newInput.classList.add("inputElement");
                    break;

                case "number":
                    newInput.type = "number";
                    newInput.setAttribute("dataType",argumentObj.type)
                    newInput.classList.add("inputElement");
                    break;

                case "string":
                    newInput.type = "text";
                    newInput.setAttribute("dataType",argumentObj.type)
                    newInput.classList.add("inputElement");
                    break;
                
                case "array":
                    // TODO

                    let tempInputA = newInput;

                    newInput = document.createElement("textarea");
                    newInput.classList.add("expandableTA");
                    newInput.value = tempInputA.placeholder;

                    newInput.setAttribute("dataType",argumentObj.type);
                    newInput.classList.add("inputElement");

                    newInput.addEventListener('input', function() {
      
                        // Append hiddendiv to parent of textarea, so the size is correct
                        newInput.parentNode.appendChild(hiddenDiv);
                        
                        // Remove this if you want the user to be able to resize it in modern browsers
                        newInput.style.resize = 'none';
                        
                        // This removes scrollbars
                        newInput.style.overflow = 'hidden';
                  
                        // Every input/change, grab the content
                        content = newInput.value;
                  
                        // Add the same content to the hidden div
                        
                        // This is for old IE
                        content = content.replace(/\n/g, '<br>');
                        
                        // The <br ..> part is for old IE
                        // This also fixes the jumpy way the textarea grows if line-height isn't included
                        hiddenDiv.innerHTML = content + '<br style="line-height: 3px;">';
                  
                        // Briefly make the hidden div block but invisible
                        // This is in order to read the height
                        hiddenDiv.style.visibility = 'hidden';
                        hiddenDiv.style.display = 'block';
                        newInput.style.height = hiddenDiv.offsetHeight + 'px';
                  
                        // Make the hidden div display:none again
                        hiddenDiv.style.visibility = 'visible';
                        hiddenDiv.style.display = 'none';
                      });
                    break;

                case "object":

                    let tempInputO = newInput;

                    newInput = document.createElement("textarea");
                    newInput.classList.add("expandableTA");
                    newInput.value = tempInputO.placeholder;

                    // TODO
                    newInput.setAttribute("dataType",argumentObj.type)
                    newInput.classList.add("inputElement");

                    newInput.addEventListener('input', function() {
      
                        // Append hiddendiv to parent of textarea, so the size is correct
                        newInput.parentNode.appendChild(hiddenDiv);
                        
                        // Remove this if you want the user to be able to resize it in modern browsers
                        newInput.style.resize = 'none';
                        
                        // This removes scrollbars
                        newInput.style.overflow = 'hidden';
                  
                        // Every input/change, grab the content
                        content = newInput.value;
                  
                        // Add the same content to the hidden div
                        
                        // This is for old IE
                        content = content.replace(/\n/g, '<br>');
                        
                        // The <br ..> part is for old IE
                        // This also fixes the jumpy way the textarea grows if line-height isn't included
                        hiddenDiv.innerHTML = content + '<br style="line-height: 3px;">';
                  
                        // Briefly make the hidden div block but invisible
                        // This is in order to read the height
                        hiddenDiv.style.visibility = 'hidden';
                        hiddenDiv.style.display = 'block';
                        newInput.style.height = hiddenDiv.offsetHeight + 'px';
                  
                        // Make the hidden div display:none again
                        hiddenDiv.style.visibility = 'visible';
                        hiddenDiv.style.display = 'none';
                      });
                    break;
            }

            container.appendChild(newInput)

            let errorSpan = document.createElement("span");
            errorSpan.classList.add("errorSpan");
            container.appendChild(errorSpan);

        },methodForm: (methodName) => {
            let newForm = document.createElement("form");
            newForm.classList.add("method-container");
            newForm.setAttribute("methodName", methodName);
            return newForm;
        }

    }
}

document.addEventListener("DOMContentLoaded",app.init)
document.addEventListener("onUnLoad",app.disconnectSocket())