abstract class BankAccount {

    accountID: string;
    private balance: number;
    phoneNumber: string;


    policies?: Policies

    constructor(accountID: string, balance: number, phoneNumber: string,) {
        this.accountID = accountID;
        this.balance = balance;
        this.phoneNumber = phoneNumber;
        this.policies = new Policies();
    }

    public getBalance(): number {


        return this.balance;
    }

    public setBalance(balance: number): number {

        return this.balance;
    }

    public abstract withdraw(): number



}

//const bankaccount1 = new BankAccount("1001", 10000, "9632090231"); u cannont creat a new object for abstract class

class FixedAccount extends BankAccount {
    public withdraw(): number {
        throw new Error("Method not implemented.");
    }



    public getBalance(): number {
        const balance = super.getBalance()
        return balance;
    }

    static maturityDate: Date;

}

class RecurringAccount extends BankAccount {
    public withdraw(): number {
        throw new Error("Method not implemented.");
    }


    public getBalance(): number {
        const balance = super.getBalance()
        return balance;
    }
}

class SavingAccount extends BankAccount implements AccountMandatory, FreezeAccount {
    deposit(): void {
        throw new Error("Method not implemented.");
    }

    public withdraw(): number {
        throw new Error("Method not implemented.");
    }
    public freeze(accountID?: string): number | void {
        if (accountID != null) {
            console.log(accountID)
            return 0;
        }

    }

    public getBalance(): number {
        const balance = super.getBalance()
        return balance;
    }
}

interface AccountMandatory {

    deposit(): void;
    freeze(accountID: string): void;
    freeze(): number;
    withdraw(): void;

}
interface FreezeAccount {


    freeze(): void;


}

class Policies {

    public getPolicy() {

    }

}
//console.log(bankaccount1.balance);

const maturityDate = FixedAccount.maturityDate;


class ThreadCreation {

    private static totalthreads: number;

    static getThreads(): number {
        return this.totalthreads;
    }

    displayThreads() {

        console.log(this.totalthreads)
    }


}


//private is where it is completely acc