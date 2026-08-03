//counter counts from X number - for n times lets say x = 10 and n is 5 - it should count from 10 to 15

//let n = 5;
//let x = 10;


function counter(n, x) {

    // let n = 5;

    for (let i = 1; i <= n; i++) {
        x++
    }
    return x;

}

console.log(counter(5, 10));