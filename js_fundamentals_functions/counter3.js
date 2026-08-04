//2665. Counter II

//Write a function createCounter. It should accept an initial integer init. It should return an object with three functions.

var createCounter = function (init) {
    let currentValue = init;

    return {
        increment: function () {
            currentValue++;
            return currentValue;
        },

        decrement: function () {
            currentValue--;
            return currentValue;
        },

        reset: function () {
            currentValue = init;
            return currentValue;
        }
    };
};

const counter = createCounter(5);

console.log(counter.increment()); // 6
console.log(counter.reset());     // 5
console.log(counter.decrement()); // 4

/*
const counter = createCounter(5);
const output = [];

output.push(counter.increment());
output.push(counter.reset());
output.push(counter.decrement());

console.log(output); // [6, 5, 4]
*/