

//Object.freeze(user);

class User {
    constructor(name, id) {
        this.name = name;
        this.id = id;
    }

    /*
     * Capitalizes the first letter of every word.
     * Example: niranjan m nadiger → Niranjan M Nadiger
     */
    displayName() {
        return this.name
            .trim()
            .split(/\s+/)
            .map(word =>
                word.charAt(0).toUpperCase() +
                word.slice(1).toLowerCase()
            )
            .join(" ");
    }

    displayNameWithId() {
        return `${this.id}:${this.displayName()}`;
    }
}

const user = new User("niranjan m nadiger", 2);

console.log(user.displayName());
// Niranjan M Nadiger

console.log(user.displayNameWithId());
// 2:Niranjan M Nadiger

class Book {

    // binding, dimension - Length and breadth, pages
    constructor(binding, length, breadth, pages) {
        this.binding = binding;
        this.length = length;
        this.breadth = breadth;
        this.pages = pages;
        //object is an instance of the class
    }
}

const handelBookProxy = {
    get(target, prop, reciver) {
        if (prop === "breadth") {
            return target[prop] == undefined || target[prop] == null ? 50 : target[prop];
        }
    },

    set(target, prop, reciver) {

        if (prop === "length" && !Number.isInteger(reciver)) {
            throw new Error("length is not a valid number")

        }
        target[prop] = reciver;
        return true
    }
}

let book1 = new Book("hard", 20, null, 200);
//store-setproxy retrive - get proxy 
let bookProxy = new Proxy(book1, handelBookProxy);
console.log(bookProxy.breadth);
bookProxy.length = "20";




/*
var user = {

    name: "niranjan",
    id: 1,

    function displayName(){
        console.log(this.name)

    }


}

user.displayName();

var user2 = Object.create(user){
    user.age:25

}
*/