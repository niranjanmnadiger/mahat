//leetcode 2620. Counter

let counter = function (n) { //takes n as an input 

    return function () { // returns a function
        return n++; //which increments n every single time
    }

}

let count = counter(10); // starting from 10 - this stores the new value every single time function is called

console.log(count()); // why count() and why not count - coz count is a function and it needs () to execute it and get the value
console.log(count());
console.log(count());
console.log(count());

