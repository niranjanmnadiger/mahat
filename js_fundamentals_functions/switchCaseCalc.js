function calculate(x, y, operator) {
    switch (operator) {
        // Arithmetic operators

        case "+":
            // Adds x and y - Addition
            // 6 + 7 gives 13
            return x + y;

        case "-":
            // Subtracts y from x - Subtraction
            // 10 - 4 gives 6
            return x - y;

        case "*":
            // Multiplies x by y - Multiplication
            // 5 * 3 gives 15
            return x * y;

        case "/":
            // Divides x by y - Division
            // 10 / 2 gives 5
            return y === 0 ? "Cannot divide by zero" : x / y;

        case "%":
            // Finds the remainder after division - Remainder/Modulo
            // 10 % 3 gives 1
            return y === 0 ? "Cannot divide by zero" : x % y;

        case "**":
            // Raises x to the power of y - Exponentiation
            // 2 ** 3 gives 8
            return x ** y;


        // Comparison operators

        case "===":
            // Compares value and data type - Strict Equality
            // 5 === "5" gives false
            return x === y;

        case "!==":
            // Checks if value or data type differs - Strict Inequality
            // 5 !== "5" gives true
            return x !== y;

        case "==":
            // Compares values after type conversion - Loose Equality
            // 5 == "5" gives true
            return x == y;

        case "!=":
            // Checks if values differ after type conversion - Loose Inequality
            // 5 != "5" gives false
            return x != y;

        case ">":
            // Checks whether x is greater than y - Greater Than
            // 10 > 5 gives true
            return x > y;

        case "<":
            // Checks whether x is less than y - Less Than
            // 3 < 8 gives true
            return x < y;

        case ">=":
            // Checks whether x is greater than or equal to y
            // Greater Than or Equal To
            // 5 >= 5 gives true
            return x >= y;

        case "<=":
            // Checks whether x is less than or equal to y
            // Less Than or Equal To
            // 4 <= 7 gives true
            return x <= y;


        // Logical operators

        case "&&":
            // Returns y if x is truthy; otherwise returns x - Logical AND
            // true && "Hello" gives "Hello"
            return x && y;

        case "||":
            // Returns x if x is truthy; otherwise returns y - Logical OR
            // false || "Fallback" gives "Fallback"
            return x || y;

        case "??":
            // Returns y when x is null or undefined - Nullish Coalescing
            // null ?? "Guest" gives "Guest"
            return x ?? y;


        // Bitwise operators

        case "&":
            // Performs AND on the binary bits - Bitwise AND
            // 5 & 3 gives 1
            return x & y;

        case "|":
            // Performs OR on the binary bits - Bitwise OR
            // 5 | 3 gives 7
            return x | y;

        case "^":
            // Performs XOR on the binary bits - Bitwise XOR
            // 5 ^ 3 gives 6
            return x ^ y;

        case "<<":
            // Shifts the bits of x left by y positions - Left Shift
            // 5 << 1 gives 10
            return x << y;

        case ">>":
            // Shifts bits right while preserving the sign - Signed Right Shift
            // 8 >> 1 gives 4
            return x >> y;

        case ">>>":
            // Shifts bits right and fills the left with zeros
            // Unsigned Right Shift
            // 8 >>> 1 gives 4
            return x >>> y;


        // Assignment operators

        case "=":
            // Assigns y to x - Assignment
            // If x = 5 and y = 10, x = y gives 10
            return (x = y);

        case "+=":
            // Adds y to x and stores the result in x - Addition Assignment
            // If x = 5 and y = 3, x += y gives 8
            return (x += y);

        case "-=":
            // Subtracts y from x and stores the result - Subtraction Assignment
            // If x = 10 and y = 4, x -= y gives 6
            return (x -= y);

        case "*=":
            // Multiplies x by y and stores the result - Multiplication Assignment
            // If x = 5 and y = 3, x *= y gives 15
            return (x *= y);

        case "/=":
            // Divides x by y and stores the result - Division Assignment
            // If x = 10 and y = 2, x /= y gives 5
            return y === 0 ? "Cannot divide by zero" : (x /= y);

        case "%=":
            // Finds the remainder and stores it in x - Remainder Assignment
            // If x = 10 and y = 3, x %= y gives 1
            return y === 0 ? "Cannot divide by zero" : (x %= y);

        case "**=":
            // Raises x to power y and stores the result
            // Exponentiation Assignment
            // If x = 2 and y = 3, x **= y gives 8
            return (x **= y);

        case "&&=":
            // Assigns y to x when x is truthy - Logical AND Assignment
            // If x = true and y = "Hello", x &&= y gives "Hello"
            return (x &&= y);

        case "||=":
            // Assigns y to x when x is falsy - Logical OR Assignment
            // If x = false and y = "Fallback", x ||= y gives "Fallback"
            return (x ||= y);

        case "??=":
            // Assigns y when x is null or undefined
            // Nullish Coalescing Assignment
            // If x = null and y = "Guest", x ??= y gives "Guest"
            return (x ??= y);

        case "&=":
            // Performs bitwise AND and stores the result
            // Bitwise AND Assignment
            // If x = 5 and y = 3, x &= y gives 1
            return (x &= y);

        case "|=":
            // Performs bitwise OR and stores the result
            // Bitwise OR Assignment
            // If x = 5 and y = 3, x |= y gives 7
            return (x |= y);

        case "^=":
            // Performs bitwise XOR and stores the result
            // Bitwise XOR Assignment
            // If x = 5 and y = 3, x ^= y gives 6
            return (x ^= y);

        case "<<=":
            // Left-shifts x and stores the result - Left Shift Assignment
            // If x = 5 and y = 1, x <<= y gives 10
            return (x <<= y);

        case ">>=":
            // Signed right-shifts x and stores the result
            // Signed Right Shift Assignment
            // If x = 8 and y = 1, x >>= y gives 4
            return (x >>= y);

        case ">>>=":
            // Unsigned right-shifts x and stores the result
            // Unsigned Right Shift Assignment
            // If x = 8 and y = 1, x >>>= y gives 4
            return (x >>>= y);

        default:
            // Runs when no case matches - Default Case
            // Using "abc" gives "Invalid or unsupported operator"
            return "Invalid or unsupported operator";
    }
}


//Arithmetic operators

console.log(calculate(6, 7, "+"));       // 13 — adds 6 and 7
console.log(calculate(10, 4, "-"));      // 6  — subtracts 4 from 10
console.log(calculate(5, 3, "*"));       // 15 — multiplies 5 by 3
console.log(calculate(10, 2, "/"));      // 5  — divides 10 by 2
console.log(calculate(10, 3, "%"));      // 1  — remainder after division
console.log(calculate(2, 3, "**"));      // 8  — 2 raised to power 3


//Comparison operators

console.log(calculate(5, "5", "==="));   // false — value same, but types differ
console.log(calculate(5, "5", "!=="));   // true  — types are different

console.log(calculate(5, "5", "=="));    // true  — compares after type conversion
console.log(calculate(5, "5", "!="));    // false — values are equal after conversion

console.log(calculate(10, 5, ">"));      // true  — 10 is greater than 5
console.log(calculate(3, 8, "<"));       // true  — 3 is less than 8
console.log(calculate(5, 5, ">="));      // true  — 5 is equal to 5
console.log(calculate(4, 7, "<="));      // true  — 4 is less than 7


//Logical operators
console.log(calculate(true, "Hi", "&&"));
// "Hi" — x is truthy, so it returns y

console.log(calculate(false, "Hi", "||"));
// "Hi" — x is falsy, so it returns y

console.log(calculate(null, "Guest", "??"));
// "Guest" — x is null, so it returns y


//Bitwise operators

console.log(calculate(5, 3, "&"));       // 1  — bitwise AND
console.log(calculate(5, 3, "|"));       // 7  — bitwise OR
console.log(calculate(5, 3, "^"));       // 6  — bitwise XOR

console.log(calculate(5, 1, "<<"));      // 10 — shifts bits left once
console.log(calculate(8, 1, ">>"));      // 4  — signed right shift
console.log(calculate(8, 1, ">>>"));     // 4  — unsigned right shift


//Assignment operators

console.log(calculate(5, 10, "="));      // 10 — assigns y to local variable x

console.log(calculate(5, 3, "+="));      // 8  — x = x + y
console.log(calculate(10, 4, "-="));     // 6  — x = x - y
console.log(calculate(5, 3, "*="));      // 15 — x = x * y
console.log(calculate(10, 2, "/="));     // 5  — x = x / y
console.log(calculate(10, 3, "%="));     // 1  — x = x % y
console.log(calculate(2, 3, "**="));     // 8  — x = x ** y

console.log(calculate(true, "Hi", "&&="));
// "Hi" — x is truthy, so y is assigned to x

console.log(calculate(false, "Hi", "||="));
// "Hi" — x is falsy, so y is assigned to x

console.log(calculate(null, "Guest", "??="));
// "Guest" — x is null, so y is assigned to x

console.log(calculate(5, 3, "&="));      // 1  — x = x & y
console.log(calculate(5, 3, "|="));      // 7  — x = x | y
console.log(calculate(5, 3, "^="));      // 6  — x = x ^ y

console.log(calculate(5, 1, "<<="));     // 10 — x = x << y
console.log(calculate(8, 1, ">>="));     // 4  — x = x >> y
console.log(calculate(8, 1, ">>>="));    // 4  — x = x >>> y


//Invalid operator
console.log(calculate(5, 3, "abc"));
// "Invalid or unsupported operator"

console.log(calculate(3, 4, "&&"));

