//array example - 2 pointer method


class ArrayOperations {

    constructor() {
        this.array = [];
        this.start = 0;
        this.end = 0;
    }


    insertEle(element) {
        this.array[this.end] = element;
        this.end++;
    }

    deleteEle() {
        console.log(`deleted ele at ${this.end} `);
        this.end--;
        this.array[this.end] = undefined;



    }

    insertAtIndex(index, element) {
        if (index < this.end) {
            for (let i = this.end; i > index; i--) {
                this.array[i] = this.array[i - 1];

            }

            this.array[index] = element;
            this.end++;
            //[1,2,3] - insert5 at 1
            //[1,5,2,3]

        }



    }

    deletAtIndex(index) {

        if (index < this.end) {
            for (let i = index; i < this.end; i++) { //i =2 - i-- -> i =3 
                this.array[i] = this.array[i + 1];
                // 2 = 3

            }
            this.end--;
        }

    }

    displayArray() {
        // console.log(this.array);
        // console.log(this.start);
        // console.log(this.end);
        for (let i = 0; i < this.end; i++) {
            console.log(this.array[i])
        }
    }


}

const object = new ArrayOperations();

object.insertEle(1); //1
object.insertEle(2); // 1,2
object.insertAtIndex(0, 7); //7,1,2
object.insertEle(3); //7,1,2,3
object.insertEle(4); //7,1,2,3,4
object.deleteEle(); // 7,1,2,3
object.deletAtIndex(0);//1,2,3


object.displayArray();



//static keyword is used to instanciate a class 