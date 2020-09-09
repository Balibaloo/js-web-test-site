module.exports = {
    simpleLog: (stringS = "default") => {
        console.log(stringS)
    },
    assertLog: (assertionB = true,contextS = "context") => {
        console.assert(assertionB,contextS)
    },
    countLog: labelS => {
        console.count(labelS)
    },
    clearLog: () => {
        console.clear()
    },
    errorLog: function (labelS,data) {
        console.error(labelS,data)
    },
    groupLog: function(labelS = "blue") {
        console.group(labelS)
    },
    groupColapsedLog:function(labelS) {
        console.groupCollapsed(labelS)
    },
    groupEndLog: function() {
        let x = (bruh) => {
            
        }
        console.groupEnd()
    }
}