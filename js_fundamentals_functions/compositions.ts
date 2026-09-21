class FlyingAbility {


    fly() {

    }

}


class Bird {

    private ability: FlyingAbility

    constructor(
        ability: FlyingAbility
    ) {

        this.ability = ability;
    }

}