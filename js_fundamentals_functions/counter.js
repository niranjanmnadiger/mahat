//leetcode 2620. Counter

let counter = function (n) {

    return function () {
        return n++;
    }

}

let count = counter(10)

console.log(count());
console.log(count());
console.log(count());
console.log(count());

