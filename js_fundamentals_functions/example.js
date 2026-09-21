/*

let arr = [1, 2, 3, 4];
let arr2 = [...arr, 2];

arr.forEach((num) => { console.log(num) });
arr.map
let obj = [
    { id: 1, name: "niranjan" },
    { id: 2, name: "niranjan m n " }
]

let obj2 = { id: 1, name: "niranjan" };
console.log(Object.entries(obj2).forEach(([key, value]) => { console.log(key, value) }));
console.log(obj2.name);
console.log(`key:id name`)

console.log(Object.prototype.toString.call([]));
const t = (v) => Object.prototype.toString.call(v)
console.log(t(6));


console.log(arr2);






let y;
const x = null;
let type = (v) => typeof (v);

console.log(type(y)); //undefined 
console.log(type(x)); //object - null is an object
//console.log(type(z)); this throws up an error since it is not even declared



function count() {
    let x = 5;
    let y = 6;

    function sum() {
        return x + y;
    }
    return sum();

}

console.log(count());

console.log(parseInt("4n2", 10));


//tagged templates
function uppercase(string, ...values) {
    return string[0]
        + values[0].toUpperCase()
        + string[1];
}

const name = "niranjan";
const result = uppercase`Hello, ${name}!`
console.log(result);




//spread operators

let arr = [1, 2, 3, 4];

arr.push(5);

console.log(arr)

let arr2 = [...arr]
let arr3 = arr;
console.log(arr3);
arr3.push(6);
console.log(arr)



const appointment = {
    customer: "Niranjan",
    time: "10:30 AM",
    status: "pending"
};

const updatedAppointment = {
    ...appointment,
    status: "confirmed"
};

console.log(updatedAppointment);



const arr = [2, 3, 4];

const update = [1, ...arr];
const update2 = [...arr, 5, 6];
const update3 = [...update, 5, 6];


console.log(update);
console.log(update2);
console.log(update3);

*/

const arr = new Set([1, 2, 3, 4, 5, 5, 6, 2]);

console.log(arr);

const number = [...arr];

console.log(number);

const userRoles = new Map([
    ["Niranjan", "Developer"],
    ["Karthik", "Mentor"],
]);

const entries = [...userRoles];

console.log(entries);
const names = [...userRoles.keys()];
console.log(names);

