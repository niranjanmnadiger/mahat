//leetcode : 2667. Create Hello World Function

const helloWorld = function () {

    function createHelloWorld() {
        return "hello world"
    }

    return createHelloWorld; // this returns the function
    //return createHelloWorld(); --> calls it and returns "hello world"


}

console.log(helloWorld());
