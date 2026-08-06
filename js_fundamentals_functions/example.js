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


