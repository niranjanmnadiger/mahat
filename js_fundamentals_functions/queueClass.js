class QueueOperations {
    constructor() {
        this.array = [];

        //single ended queue (enqueue and dequeue) - double ended queue ()

        // First valid element
        this.start = 0;

        // Next empty position
        this.end = 0;
    }

    isEmpty() {
        return this.start === this.end;
    }

    // Standard queue insertion
    enqueue(element) {
        this.rearInsert(element);
    }

    // Standard queue deletion
    dequeue() {
        return this.frontDelete();
    }

    // Insert from the rear
    rearInsert(element) {
        this.array[this.end] = element;
        this.end++;
    }

    // Delete from the rear
    rearDelete() {
        if (this.isEmpty()) {
            return "Queue is empty";
        }

        this.end--;

        const deletedElement = this.array[this.end];

        this.array[this.end] = undefined;

        this.resetIfEmpty();

        return deletedElement;
    }

    // Insert from the front
    frontInsert(element) {
        /*
         If there is an unused position before start,
         reuse that position.
        */
        if (this.start > 0) {
            this.start--;
            this.array[this.start] = element;
            return;
        }

        /*
         If start is already 0, shift every element
         one position towards the right.
        */
        for (let i = this.end; i > this.start; i--) { //left shift -> i++, right shift -> i--
            this.array[i] = this.array[i - 1];
        }

        //shift operations
        //when u delet an element - 

        this.array[this.start] = element;
        this.end++;
    }

    // Delete from the front
    frontDelete() {
        if (this.isEmpty()) {
            return "Queue is empty";
        }

        const deletedElement = this.array[this.start]; //del = a[0];

        this.array[this.start] = undefined; //a[0] - undefined
        this.start++; // start pointer shifts from 0 to 1 and 1 becomes new this.start

        this.resetIfEmpty();

        return deletedElement;
    }

    peekFront() {
        if (this.isEmpty()) {
            return "Queue is empty";
        }

        return this.array[this.start];
    }

    peekRear() {
        if (this.isEmpty()) {
            return "Queue is empty";
        }

        return this.array[this.end - 1];
    }

    resetIfEmpty() {
        if (this.start === this.end) {
            this.array = [];
            this.start = 0;
            this.end = 0;
        }
    }

    displayQueue() {
        for (let i = this.start; i < this.end; i++) {
            console.log(this.array[i]);
        }
    }
}

const queue = new QueueOperations();

queue.enqueue(1);       // [1]
queue.enqueue(2);       // [1, 2]
queue.rearInsert(3);    // [1, 2, 3]
queue.frontInsert(7);   // [7, 1, 2, 3]

[queue.displayQueue()];

console.log(queue.dequeue());
// 7

console.log(queue.rearDelete());
// 3

queue.displayQueue();
// 1
// 2

console.log(queue.peekFront());
// 1

console.log(queue.peekRear());
// 2