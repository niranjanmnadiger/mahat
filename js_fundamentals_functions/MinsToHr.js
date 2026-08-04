//Write a function named minutesToHours that receives a number of minutes as parameter and returns a number representing the same amount of time but in hours.

function minutesToHours(minutes) {
    return minutes / 60;
}

console.log(minutesToHours(120)); // 2
minutesToHours(90);  // 1.5
minutesToHours(30);  // 0.5