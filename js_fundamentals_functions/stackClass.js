

class StackOperations {
    constructor() {
        this.array = [];

        // Points to the next empty position
        this.top = -1;  // stack always starts with imnaginary index - so -1 and not 0
    }

    push(element) {
        this.array[++this.top] = element;// a[0] = ele
        //this.top++; // 0 ->1

    }

    pop() {
        if (this.top === -1) {
            return "Stack is empty";
        }

        // Move to the last occupied position
        //this.top--;


        const deletedElement = this.array[this.top]; //a[0] 

        this.top--;

        //this.array[this.top] = undefined;

        return deletedElement;
    }

    peek() {
        if (this.top === -1) {
            return "Stack is empty";
        }


        // so top - 1 is the last element
        return this.array[this.top];
    }

    displayStack() {
        for (let i = 0; i <= this.top; i++) {
            console.log(this.array[i]);
        }
    }
}

const stack = new StackOperations();

stack.push(1); //1
stack.push(2); //2 1
stack.push(3); //3 2 1
stack.push(4); //4 3 2 1

console.log("stack after all push");
stack.displayStack()

console.log('the peek element is', stack.peek());
// 4

console.log('popped element is', stack.pop());
// 4

console.log('popped element is ', stack.pop());
// 3

stack.displayStack();
// 1
// 2