//write a class - video encoder has one consturture which will have a string - path - 
//class will be having 5 diff method - which will give out 5 diff quality of videos 
//

// Parent class
class Encoder {
    constructor(videoName, path) {
        this.videoName = videoName;
        this.path = path;
    }

    displayPath() {
        console.log(`Video path: ${this.path}`);
    }

    encode144p() {
        console.log("Calling encode144p() from Encoder class");
    }

    encode240p() {
        console.log("Calling encode240p() from Encoder class");
    }

    encode360p() {
        console.log("Calling encode360p() from Encoder class");
    }

    encode480p() {
        console.log("Calling encode480p() from Encoder class");
    }

    encode720p() {
        console.log("Calling encode720p() from Encoder class");
    }
}

//this class has to inherit all the props from base class - encoder - one class inherit
// Child class
class YoutubeEncoder extends Encoder {
    constructor(videoName, path, type) {
        super(videoName, path);
        this.type = type;
    }

    encode144p() {
        super.encode144p(); //super is a function which is used to instanciate the base class function
        console.log(
            `Encoding ${this.videoName} in 144p (256 × 144)`
        );
    }

    encode240p() {
        super.encode240p();
        console.log(
            `Encoding ${this.videoName} in 240p (426 × 240)`
        );
    }

    encode360p() {
        super.encode360p();
        console.log(
            `Encoding ${this.videoName} in 360p (640 × 360)`
        );
    }

    encode480p() {
        super.encode480p();
        console.log(
            `Encoding ${this.videoName} in 480p (854 × 480)`
        );
    }

    encode720p() {
        super.encode720p();
        console.log(
            `Encoding ${this.videoName} in 720p (1280 × 720)`
        );
    }
}

// Creating an object
const youtubeEncoderObject = new YoutubeEncoder(
    "JavaScript Course",
    "/videos/course.mp4",
    "YouTube"
);

// Calling inherited and overridden methods
youtubeEncoderObject.displayPath();
youtubeEncoderObject.encode144p();
youtubeEncoderObject.encode240p();
youtubeEncoderObject.encode360p();
youtubeEncoderObject.encode480p();
youtubeEncoderObject.encode720p();