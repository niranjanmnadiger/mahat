var expect = function (val) {
    return {
        toBe: (anotherVal) => val === anotherVal ? true : null,

        notToBe: (anotherVal) => val !== anotherVal ? true : "equal"
    };
};

console.log(expect(5).toBe(null));
var output = expect(5).toBe(null);
output?.valueOf();

/* try {
    console.log(expect(5).toBe(null));
} catch (error) {
    console.log(error.message); // Not Equal
}

try {
    console.log(expect(5).notToBe(5));
} catch (error) {
    console.log(error.message); // Equal
}

try {
    console.log(expect(5).toBe(5)); // true
} catch (error) {
    console.log(error.message);
}*/