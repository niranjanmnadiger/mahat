//2635. Apply Transform Over Each Element in Array

var map = function (arr, fn) {
    const returnedArray = [];

    for (let i = 0; i < arr.length; i++) {
        returnedArray.push(fn(arr[i], i));
    }

    return returnedArray;
};

const arr = [1, 2, 3];

function plusI(n, i) {
    return n + i;
}

console.log(map(arr, plusI)); // [1, 3, 5]