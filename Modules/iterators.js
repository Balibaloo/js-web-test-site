"use strict";

let dataStructure = [0,1,2,3]

let myIterator = ((dataStructure) => {
    let iterator = {
        pointer: 0,
        lastIndex: dataStructure.length -1,

        getNext: () => {
            if (iterator.isNotEmpty()){
                iterator.pointer ++;
                return dataStructure[iterator.pointer -1];

            } else {
                return null;
            }
           
        },
        isNotEmpty: () => {
            return !(iterator.pointer > iterator.lastIndex);
        },
        restartPointer: () => {
            iterator.pointer = 0;
        },
    }

    return iterator

})(dataStructure);



while (myIterator.isNotEmpty()){
    console.log(myIterator.getNext())
}
myIterator.restartPointer()

while (myIterator.isNotEmpty()){
    console.log(myIterator.getNext())
}

console.log("test worked")

module.exports = myIterator;