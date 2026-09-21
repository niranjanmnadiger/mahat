
class Node {

    constructor(value, nextNode) {
        this.value = value;
        this.nextNode = nextNode;

    }



}
//pointer is the variable that holds the 

class Linkedlist {

    constructor() {
        this.startNode = new Node(4, null); // this is a new class object of Node class


    }

    insert(newNode) {
        newNode.nextNode = this.startNode;

        this.startNode = newNode;

    }

    insertAtEnd(newNode) {
        if (this.startNode == null) {
            this.startNode = newNode
        } else if (this.startNode && this.startNode.node == null) {
            this.startNode.node = Node;
        }
        var currNode = this.startNode
        while (currNode.nextNode != null) {
            currNode = currNode.nextNode;


        }

        currNode.nextNode = newNode;


    }

    search(element) {
        var currNode = this.startNode

        while (currNode != null) {

            if (currNode.value == element) {
                console.log("found");
            } else {
                console.log("not found")
            }
            currNode = currNode.nextNode;
        }

    }

    display() {
        if (this.startNode == null) {
            console.log("empty node")
        } else if (this.startNode != null && this.startNode.node == null) {
            console.log(this.startNode.node);
        }

        var node = this.startNode
        while (node != null) {
            console.log(node.value)
            node = node.nextNode;
        }
    }

}

const linkedlist = new Linkedlist();
linkedlist.display();//4
const newNode1 = new Node(10, null); //10 4
linkedlist.insert(newNode1);
const newNode2 = new Node(15, null);
linkedlist.insert(newNode2);
const newNode3 = new Node(20, null);
linkedlist.insertAtEnd(newNode3)
linkedlist.display();

linkedlist.search(20);
linkedlist.search(200);