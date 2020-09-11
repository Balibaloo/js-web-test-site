module.exports = {
    iterateObject: (objectO) => {
        Object.keys(objectO).forEach(key => {
            console.log(key,":",objectO[key])
        })
    },
    iterateArray: (arrayA) => {
        arrayA.forEach(item => {
            console.log(item)
        })
    },
    allInput: (boolB,numN,intI,strS,arrA,objO) => {
        console.log(boolB);
        console.log(numN);
        console.log(intI);
        console.log(strS);
        console.log(arrA);
        console.log(objO);
    }
}