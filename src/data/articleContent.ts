/**
 * Topic-specific learning content for each article.
 * Keys: "languageId-slug" (e.g. "1-intro-js", "2-lists-dicts").
 */
export const ARTICLE_CONTENT: Record<string, string> = {
  // —— JavaScript ——
  '1-intro-js': `# Introduction to JavaScript

JavaScript is the programming language that powers the modern web. Created by Brendan Eich in 1995, JavaScript has evolved from a simple scripting language for web browsers into a powerful, versatile language used for front-end development, back-end servers (Node.js), mobile apps (React Native), desktop applications (Electron), and even embedded systems.

## What Makes JavaScript Special?

JavaScript is unique because it's the only programming language that runs natively in web browsers. This means every modern browser has a JavaScript engine built-in, making it universally accessible. Additionally, JavaScript is:

- **Dynamically typed**: You don't need to declare variable types upfront
- **Interpreted**: Code runs line-by-line without compilation (though modern engines use JIT compilation)
- **Multi-paradigm**: Supports object-oriented, functional, and procedural programming styles
- **Event-driven**: Built for handling user interactions and asynchronous operations

## Where JavaScript Runs

### 1. Web Browsers
JavaScript runs in browsers like Chrome, Firefox, Safari, and Edge. It manipulates the Document Object Model (DOM) to create interactive web pages.

\`\`\`javascript
// Browser example - adding interactivity to a webpage
document.getElementById('button').addEventListener('click', function() {
  alert('Hello from JavaScript!');
});
\`\`\`

### 2. Node.js (Server-Side)
Node.js allows JavaScript to run on servers, enabling full-stack JavaScript development.

\`\`\`javascript
// Node.js example - creating a simple web server
const http = require('http');
const server = http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/plain' });
  res.end('Hello from Node.js!');
});
server.listen(3000);
\`\`\`

### 3. Mobile Apps
Frameworks like React Native and Ionic use JavaScript to build native mobile applications.

### 4. Desktop Applications
Electron uses JavaScript to build desktop apps (VS Code, Slack, Discord are built with Electron).

## Your First JavaScript Program

Let's start with the classic "Hello, World!" program:

\`\`\`javascript
// Your first program
console.log("Hello, World!");

// Storing values in variables
const name = "CodeVerse";
let count = 0;
count = count + 1;

console.log(\`Welcome to \${name}! Count: \${count}\`);
\`\`\`

## Understanding JavaScript Execution

JavaScript code executes in a specific order:

1. **Top to bottom**: Code runs line by line from top to bottom
2. **Synchronous by default**: Each line waits for the previous one to complete
3. **Asynchronous capabilities**: Can handle non-blocking operations with callbacks, promises, and async/await

\`\`\`javascript
// Synchronous execution
console.log("First");
console.log("Second");
console.log("Third");
// Output: First, Second, Third (in order)

// Asynchronous example
console.log("First");
setTimeout(() => console.log("Second"), 1000);
console.log("Third");
// Output: First, Third, Second (after 1 second)
\`\`\`

## Variable Declarations: let, const, and var

Modern JavaScript uses three ways to declare variables:

### const (Constant)
Use \`const\` for values that won't be reassigned. This is the preferred choice for most variables.

\`\`\`javascript
const PI = 3.14159;
const userName = "Alice";
// PI = 3.14; // Error! Cannot reassign const

// Note: const doesn't make objects immutable
const user = { name: "Alice" };
user.name = "Bob"; // This works! We're modifying the object, not reassigning
\`\`\`

### let (Block-Scoped Variable)
Use \`let\` when you need to reassign a value. It's block-scoped, meaning it only exists within the nearest curly braces.

\`\`\`javascript
let counter = 0;
counter = counter + 1; // Reassignment is allowed

if (true) {
  let blockScoped = "I only exist here";
}
// console.log(blockScoped); // Error! blockScoped doesn't exist here
\`\`\`

### var (Legacy - Avoid in New Code)
\`var\` is function-scoped and can lead to confusing behavior. Avoid it in modern code.

\`\`\`javascript
// var is function-scoped (not block-scoped)
if (true) {
  var functionScoped = "I exist outside the block!";
}
console.log(functionScoped); // This works, which can be confusing
\`\`\`

## Running JavaScript

### In the Browser
1. **Browser Console**: Press F12 or right-click → Inspect → Console tab
2. **HTML Script Tag**: Add \`<script src="app.js"></script>\` to your HTML
3. **Inline Script**: Use \`<script>/* your code */</script>\` directly in HTML

### With Node.js
\`\`\`bash
# Run a JavaScript file
node app.js

# Interactive REPL (Read-Eval-Print Loop)
node
> console.log("Hello from REPL!")
\`\`\`

## JavaScript Ecosystem

The JavaScript ecosystem is vast and includes:

- **Package Managers**: npm, yarn, pnpm
- **Build Tools**: Webpack, Vite, Parcel
- **Frameworks**: React, Vue, Angular, Svelte
- **Libraries**: jQuery, Lodash, Axios
- **Testing**: Jest, Mocha, Cypress
- **Type Systems**: TypeScript (adds types to JavaScript)

## Best Practices for Beginners

1. **Always use \`const\` by default**, switch to \`let\` only when reassignment is needed
2. **Use meaningful variable names**: \`userName\` instead of \`u\` or \`x\`
3. **Write small, focused functions**: Each function should do one thing well
4. **Use console.log() liberally**: It's your best friend for debugging
5. **Read error messages carefully**: They tell you exactly what went wrong and where

## Common Beginner Mistakes

1. **Forgetting semicolons**: While optional, they prevent certain bugs
2. **Using == instead of ===**: Always use strict equality (\`===\`) to avoid type coercion surprises
3. **Not understanding scope**: Variables declared with \`let\` and \`const\` are block-scoped
4. **Mutating arrays/objects**: Remember that \`const\` prevents reassignment, not mutation

## Next Steps

Now that you understand the basics, you're ready to explore:
- Variables and data types (numbers, strings, booleans, objects, arrays)
- Functions and how to organize code
- Control flow (if/else, loops)
- Working with the DOM for web interactivity

Start by writing small scripts and experimenting in the browser console. The more you practice, the more comfortable you'll become with JavaScript's unique characteristics and powerful features.`,

  '1-variables': `# Variables and Data Types in JavaScript

Variables are containers that store data values. In JavaScript, variables are dynamically typed, meaning you don't need to declare what type of data they'll hold. The type is determined automatically when you assign a value.

## Understanding Variables

A variable is like a labeled box where you can store information. You give it a name (identifier) and assign it a value. JavaScript variables can hold different types of data, and you can even change the type of data stored in a variable (though this is generally not recommended).

## Variable Declaration: const vs let

### const - Constant Reference
\`const\` creates a variable that cannot be reassigned. This is the preferred way to declare variables in modern JavaScript.

\`\`\`javascript
const pi = 3.14159;
const userName = "Alice";
const isActive = true;

// This will cause an error:
// pi = 3.14; // TypeError: Assignment to constant variable

// However, const doesn't make objects/arrays immutable:
const user = { name: "Alice", age: 30 };
user.age = 31; // This works! We're modifying the object, not reassigning
user.email = "alice@example.com"; // Adding properties also works
\`\`\`

### let - Reassignable Variable
Use \`let\` when you need to change the value later.

\`\`\`javascript
let score = 0;
score = score + 10; // Reassignment is allowed
score = 100; // Can change the value completely

let currentUser = null;
currentUser = { name: "Bob", id: 123 }; // Can reassign to different types
\`\`\`

## JavaScript Data Types

JavaScript has 7 primitive types and objects:

### 1. Number
Represents both integers and floating-point numbers. JavaScript uses 64-bit floating point for all numbers.

\`\`\`javascript
const age = 25; // Integer
const price = 19.99; // Floating point
const temperature = -10; // Negative number
const bigNumber = 1e6; // Scientific notation (1,000,000)
const infinity = Infinity;
const notANumber = NaN; // Special value for invalid math operations

// Number operations
const sum = 10 + 5; // 15
const product = 10 * 5; // 50
const division = 10 / 3; // 3.3333333333333335
const remainder = 10 % 3; // 1 (modulo)
\`\`\`

### 2. String
Text data enclosed in quotes. You can use single quotes, double quotes, or backticks (template literals).

\`\`\`javascript
const singleQuotes = 'Hello';
const doubleQuotes = "World";
const templateLiteral = \`Hello, \${singleQuotes}!\`; // "Hello, Hello!"

// String operations
const firstName = "John";
const lastName = "Doe";
const fullName = firstName + " " + lastName; // Concatenation
const greeting = \`Hello, \${fullName}!\`; // Template literal (preferred)

// String methods
const text = "Hello World";
console.log(text.length); // 11
console.log(text.toUpperCase()); // "HELLO WORLD"
console.log(text.toLowerCase()); // "hello world"
console.log(text.substring(0, 5)); // "Hello"
\`\`\`

### 3. Boolean
Represents true or false values, used for logical operations.

\`\`\`javascript
const isLoggedIn = true;
const hasPermission = false;
const isGreater = 10 > 5; // true

// Boolean operations
const and = true && false; // false (both must be true)
const or = true || false; // true (at least one must be true)
const not = !true; // false (negation)
\`\`\`

### 4. null
Represents the intentional absence of a value. It's a value that means "no value."

\`\`\`javascript
let user = null; // Explicitly set to "no value"
// Later...
user = { name: "Alice" }; // Can be reassigned
\`\`\`

### 5. undefined
Represents a variable that has been declared but not assigned a value.

\`\`\`javascript
let unassigned; // undefined
console.log(unassigned); // undefined

// undefined is also returned when accessing non-existent properties
const obj = { name: "Alice" };
console.log(obj.age); // undefined
\`\`\`

### 6. Symbol (ES6+)
A unique identifier, primarily used for object property keys.

\`\`\`javascript
const sym1 = Symbol("description");
const sym2 = Symbol("description");
console.log(sym1 === sym2); // false (each Symbol is unique)
\`\`\`

### 7. BigInt (ES2020+)
For integers larger than Number.MAX_SAFE_INTEGER.

\`\`\`javascript
const bigNumber = 9007199254740991n; // Note the 'n' suffix
const anotherBig = BigInt("9007199254740991");
\`\`\`

### Objects (Reference Type)
Objects are collections of key-value pairs. Arrays, functions, and dates are also objects.

\`\`\`javascript
// Object literal
const person = {
  name: "Alice",
  age: 30,
  email: "alice@example.com",
  isActive: true
};

// Accessing properties
console.log(person.name); // Dot notation
console.log(person["age"]); // Bracket notation (useful for dynamic keys)

// Arrays are also objects
const fruits = ["apple", "banana", "cherry"];
console.log(fruits[0]); // "apple"
\`\`\`

## Type Checking with typeof

The \`typeof\` operator helps you inspect the type of a value at runtime.

\`\`\`javascript
console.log(typeof 42); // "number"
console.log(typeof "hello"); // "string"
console.log(typeof true); // "boolean"
console.log(typeof undefined); // "undefined"
console.log(typeof null); // "object" (this is a JavaScript quirk!)
console.log(typeof {}); // "object"
console.log(typeof []); // "object" (arrays are objects)
console.log(typeof function() {}); // "function"

// Better way to check for arrays
console.log(Array.isArray([])); // true
console.log(Array.isArray({})); // false

// Checking for null
const value = null;
console.log(value === null); // true (use === for null checks)
\`\`\`

## Type Coercion

JavaScript automatically converts types in certain situations. This can be helpful but also confusing.

\`\`\`javascript
// Implicit coercion
console.log("5" + 3); // "53" (number converted to string)
console.log("5" - 3); // 2 (string converted to number)
console.log("5" * "2"); // 10 (both converted to numbers)

// Explicit coercion
const num = Number("42"); // 42
const str = String(42); // "42"
const bool = Boolean(1); // true

// Truthy and Falsy values
// Falsy: false, 0, "", null, undefined, NaN
// Everything else is truthy
if (0) { console.log("won't run"); }
if (1) { console.log("will run"); }
\`\`\`

## Best Practices

1. **Always use \`const\` by default**: Only use \`let\` when you need reassignment
2. **Use meaningful names**: \`userName\` instead of \`u\` or \`x\`
3. **Prefer template literals**: Use backticks for string interpolation
4. **Use strict equality**: Always use \`===\` instead of \`==\` to avoid coercion surprises
5. **Initialize variables**: Always assign a value when declaring

\`\`\`javascript
// Good
const userName = "Alice";
const userAge = 30;
const isActive = true;

// Bad
let u = "Alice"; // Unclear name
let age; // Undefined, should initialize
if (age == 30) { } // Should use ===
\`\`\`

## Common Pitfalls

1. **Reassigning const**: Remember that \`const\` prevents reassignment, not mutation
2. **Type coercion surprises**: Be careful with \`+\` operator (it concatenates strings)
3. **null vs undefined**: \`null\` is intentional, \`undefined\` means not assigned
4. **typeof null**: Returns "object" (historical JavaScript quirk)

Understanding types deeply will make debugging easier and prepare you for TypeScript, which adds static typing to JavaScript.`,

  '1-functions': `# Functions and Scope in JavaScript

Functions are the building blocks of JavaScript programs. They allow you to encapsulate code into reusable blocks, making your code more organized, maintainable, and testable. Understanding functions deeply is crucial for mastering JavaScript.

## What Are Functions?

A function is a block of code designed to perform a specific task. Functions can:
- Accept input (parameters)
- Process that input
- Return output (return value)
- Be called multiple times with different inputs

## Function Declarations

Function declarations are hoisted, meaning they're available throughout their scope, even before they're defined.

\`\`\`javascript
// Function declaration
function greet(name) {
  const greeting = "Hello, " + name;
  return greeting;
}

// Can be called before it's defined (hoisting)
console.log(greet("Alice")); // "Hello, Alice"

// Functions can have multiple parameters
function calculateTotal(price, tax, discount) {
  const subtotal = price - discount;
  return subtotal + (subtotal * tax);
}

console.log(calculateTotal(100, 0.1, 10)); // 99
\`\`\`

## Function Expressions

Function expressions assign a function to a variable. They're not hoisted.

\`\`\`javascript
// Function expression
const greet = function(name) {
  return "Hello, " + name;
};

// Arrow function expression (ES6+)
const greetArrow = (name) => {
  return "Hello, " + name;
};

// Arrow function with implicit return
const greetShort = (name) => "Hello, " + name;

console.log(greet("Bob")); // "Hello, Bob"
\`\`\`

## Arrow Functions (ES6+)

Arrow functions provide a shorter syntax and lexical \`this\` binding.

\`\`\`javascript
// Traditional function
function add(a, b) {
  return a + b;
}

// Arrow function equivalent
const addArrow = (a, b) => {
  return a + b;
};

// Single expression - implicit return
const addShort = (a, b) => a + b;

// Single parameter - can omit parentheses
const square = x => x * x;

// No parameters
const getRandom = () => Math.random();

// Arrow functions don't have their own 'this'
const obj = {
  name: "Alice",
  traditional: function() {
    console.log(this.name); // "Alice" (this refers to obj)
  },
  arrow: () => {
    console.log(this.name); // undefined (this refers to global scope)
  }
};
\`\`\`

## Parameters and Arguments

Parameters are the variables listed in the function definition. Arguments are the actual values passed when calling the function.

\`\`\`javascript
// Parameters: name, age
function introduce(name, age) {
  return \`I'm \${name} and I'm \${age} years old\`;
}

// Arguments: "Alice", 30
console.log(introduce("Alice", 30));

// Default parameters (ES6+)
function greet(name = "Guest", greeting = "Hello") {
  return \`\${greeting}, \${name}!\`;
}

console.log(greet()); // "Hello, Guest!"
console.log(greet("Bob", "Hi")); // "Hi, Bob!"

// Rest parameters (collect remaining arguments)
function sum(...numbers) {
  return numbers.reduce((total, num) => total + num, 0);
}

console.log(sum(1, 2, 3, 4, 5)); // 15
\`\`\`

## Return Values

Functions can return values using the \`return\` statement. Without \`return\`, functions return \`undefined\`.

\`\`\`javascript
function add(a, b) {
  return a + b; // Returns the sum
}

const result = add(5, 3); // result is 8

function noReturn() {
  console.log("This function doesn't return anything");
}

const value = noReturn(); // value is undefined

// Early return
function checkAge(age) {
  if (age < 0) {
    return "Invalid age"; // Early exit
  }
  if (age < 18) {
    return "Minor";
  }
  return "Adult";
}
\`\`\`

## Scope and Closures

Scope determines where variables are accessible. JavaScript has function scope (and block scope with \`let\`/\`const\`).

\`\`\`javascript
// Global scope
const globalVar = "I'm global";

function outerFunction() {
  // Function scope
  const outerVar = "I'm in outer function";
  
  function innerFunction() {
    // Inner function scope
    const innerVar = "I'm in inner function";
    console.log(globalVar); // Can access global
    console.log(outerVar); // Can access outer (closure!)
    console.log(innerVar); // Can access own
  }
  
  innerFunction();
  // console.log(innerVar); // Error! innerVar is not accessible here
}

outerFunction();
\`\`\`

## Closures

A closure is when an inner function has access to variables from its outer (enclosing) scope, even after the outer function has returned.

\`\`\`javascript
// Classic closure example
function createCounter() {
  let count = 0; // Private variable
  
  return function() {
    count++; // Accesses outer scope variable
    return count;
  };
}

const counter1 = createCounter();
const counter2 = createCounter();

console.log(counter1()); // 1
console.log(counter1()); // 2
console.log(counter2()); // 1 (separate closure)
console.log(counter1()); // 3

// Practical closure: Factory function
function createMultiplier(factor) {
  return function(number) {
    return number * factor; // factor is "closed over"
  };
}

const double = createMultiplier(2);
const triple = createMultiplier(3);

console.log(double(5)); // 10
console.log(triple(5)); // 15
\`\`\`

## Higher-Order Functions

Functions that take other functions as arguments or return functions are called higher-order functions.

\`\`\`javascript
// Function as argument
function processArray(arr, processor) {
  const result = [];
  for (let item of arr) {
    result.push(processor(item));
  }
  return result;
}

const numbers = [1, 2, 3, 4];
const doubled = processArray(numbers, x => x * 2); // [2, 4, 6, 8]

// Built-in higher-order functions
const nums = [1, 2, 3, 4, 5];
const doubled = nums.map(x => x * 2); // [2, 4, 6, 8, 10]
const evens = nums.filter(x => x % 2 === 0); // [2, 4]
const sum = nums.reduce((acc, x) => acc + x, 0); // 15

// Function as return value
function createValidator(min, max) {
  return function(value) {
    return value >= min && value <= max;
  };
}

const validateAge = createValidator(18, 65);
console.log(validateAge(25)); // true
console.log(validateAge(15)); // false
\`\`\`

## Pure Functions

Pure functions always return the same output for the same input and have no side effects.

\`\`\`javascript
// Pure function
function add(a, b) {
  return a + b; // Same input always gives same output, no side effects
}

// Impure function (has side effect)
let counter = 0;
function increment() {
  counter++; // Modifies external state
  return counter;
}

// Impure function (depends on external state)
function getCurrentTime() {
  return new Date(); // Different output each time
}

// Benefits of pure functions:
// - Easier to test
// - Easier to reason about
// - Can be memoized
// - Safe for parallel execution
\`\`\`

## Function Methods: call, apply, bind

These methods allow you to control the \`this\` context of functions.

\`\`\`javascript
const person = {
  name: "Alice",
  greet: function(greeting) {
    return \`\${greeting}, I'm \${this.name}\`;
  }
};

// call - calls function with specified this and arguments
console.log(person.greet.call({ name: "Bob" }, "Hi")); // "Hi, I'm Bob"

// apply - same as call but arguments are in an array
console.log(person.greet.apply({ name: "Charlie" }, ["Hello"])); // "Hello, I'm Charlie"

// bind - creates a new function with bound this
const greetBob = person.greet.bind({ name: "Bob" });
console.log(greetBob("Hey")); // "Hey, I'm Bob"
\`\`\`

## Best Practices

1. **Keep functions small**: Each function should do one thing well
2. **Use descriptive names**: Function names should clearly describe what they do
3. **Prefer pure functions**: Easier to test and reason about
4. **Limit parameters**: Too many parameters make functions hard to use
5. **Use default parameters**: Make functions more flexible
6. **Document complex logic**: Add comments for non-obvious code

\`\`\`javascript
// Good
function calculateTotalPrice(items, taxRate = 0.1) {
  const subtotal = items.reduce((sum, item) => sum + item.price, 0);
  return subtotal * (1 + taxRate);
}

// Bad
function calc(a, b, c, d, e, f) { // Too many parameters
  // 50 lines of code doing multiple things
}
\`\`\`

## Common Patterns

### Callback Pattern
\`\`\`javascript
function fetchData(url, callback) {
  // Simulate async operation
  setTimeout(() => {
    callback({ data: "result" });
  }, 1000);
}

fetchData("/api/users", (result) => {
  console.log(result.data);
});
\`\`\`

### IIFE (Immediately Invoked Function Expression)
\`\`\`javascript
(function() {
  const privateVar = "I'm private";
  console.log(privateVar);
})(); // Executes immediately, creates its own scope
\`\`\`

### Recursive Functions
\`\`\`javascript
function factorial(n) {
  if (n <= 1) return 1; // Base case
  return n * factorial(n - 1); // Recursive case
}

console.log(factorial(5)); // 120
\`\`\`

Mastering functions is essential for writing clean, maintainable JavaScript code. Practice creating pure functions, using closures effectively, and understanding scope to become a better JavaScript developer.`,

  '1-control-flow': `Programs make decisions with if/else and repeat work with for and while loops. Conditionals use comparison (===, <, >) and logical operators (&&, ||, !).

**Key points:**
- Use strict equality (===) instead of == to avoid type coercion bugs.
- for loops are ideal when you know how many iterations; while when you don't.
- break exits a loop; continue skips to the next iteration.

\`\`\`javascript
const age = 18;
if (age >= 18) {
  console.log("Adult");
} else {
  console.log("Minor");
}
for (let i = 0; i < 3; i++) {
  console.log(i);
}
let j = 0;
while (j < 2) {
  console.log("tick", j);
  j++;
}
\`\`\`

Combine conditionals and loops to process data and control program flow.`,

  '1-arrays': `# Arrays and Array Methods in JavaScript

Arrays are one of the most fundamental data structures in JavaScript. They're ordered collections of values that can hold any type of data, including other arrays and objects. Understanding arrays deeply is essential for effective JavaScript programming.

## What Are Arrays?

An array is an ordered list of values. Each value is called an element, and each element has a numeric position called an index. Arrays in JavaScript are:
- **Zero-indexed**: The first element is at index 0
- **Dynamic**: Can grow or shrink in size
- **Heterogeneous**: Can contain different types of data
- **Mutable**: Can be modified after creation

## Creating Arrays

\`\`\`javascript
// Array literal (most common)
const fruits = ["apple", "banana", "cherry"];

// Array constructor
const numbers = new Array(1, 2, 3);

// Empty array
const empty = [];

// Array with different types
const mixed = [1, "hello", true, { name: "Alice" }, [1, 2, 3]];

// Array with initial size
const sized = new Array(5); // Creates array with 5 undefined elements
\`\`\`

## Accessing Array Elements

\`\`\`javascript
const fruits = ["apple", "banana", "cherry"];

// Access by index
console.log(fruits[0]); // "apple"
console.log(fruits[1]); // "banana"
console.log(fruits[2]); // "cherry"
console.log(fruits[3]); // undefined (doesn't exist)

// Negative indexing (not native, but can use length)
console.log(fruits[fruits.length - 1]); // "cherry" (last element)

// Check array length
console.log(fruits.length); // 3
\`\`\`

## Adding and Removing Elements

### Adding Elements

\`\`\`javascript
const arr = [1, 2, 3];

// Add to end
arr.push(4); // [1, 2, 3, 4]
arr.push(5, 6); // Can add multiple: [1, 2, 3, 4, 5, 6]

// Add to beginning
arr.unshift(0); // [0, 1, 2, 3, 4, 5, 6]

// Insert at specific index
arr.splice(2, 0, 1.5); // Insert 1.5 at index 2: [0, 1, 1.5, 2, 3, 4, 5, 6]
\`\`\`

### Removing Elements

\`\`\`javascript
const arr = [1, 2, 3, 4, 5];

// Remove from end
arr.pop(); // Returns 5, arr is now [1, 2, 3, 4]

// Remove from beginning
arr.shift(); // Returns 1, arr is now [2, 3, 4]

// Remove at specific index
arr.splice(1, 1); // Remove 1 element at index 1: [2, 4]

// Remove multiple
const arr2 = [1, 2, 3, 4, 5];
arr2.splice(1, 3); // Remove 3 elements starting at index 1: [1, 5]
\`\`\`

## Essential Array Methods

### map() - Transform Each Element

Creates a new array by transforming each element.

\`\`\`javascript
const numbers = [1, 2, 3, 4, 5];

// Double each number
const doubled = numbers.map(n => n * 2); // [2, 4, 6, 8, 10]

// Convert to strings
const strings = numbers.map(n => n.toString()); // ["1", "2", "3", "4", "5"]

// Transform objects
const users = [
  { name: "Alice", age: 30 },
  { name: "Bob", age: 25 }
];
const names = users.map(user => user.name); // ["Alice", "Bob"]
\`\`\`

### filter() - Select Elements

Creates a new array with elements that pass a test.

\`\`\`javascript
const numbers = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

// Get even numbers
const evens = numbers.filter(n => n % 2 === 0); // [2, 4, 6, 8, 10]

// Get numbers greater than 5
const large = numbers.filter(n => n > 5); // [6, 7, 8, 9, 10]

// Filter objects
const users = [
  { name: "Alice", age: 30 },
  { name: "Bob", age: 15 },
  { name: "Charlie", age: 25 }
];
const adults = users.filter(user => user.age >= 18);
// [{ name: "Alice", age: 30 }, { name: "Charlie", age: 25 }]
\`\`\`

### reduce() - Accumulate Values

Reduces an array to a single value by applying a function to each element.

\`\`\`javascript
const numbers = [1, 2, 3, 4, 5];

// Sum all numbers
const sum = numbers.reduce((acc, n) => acc + n, 0); // 15

// Find maximum
const max = numbers.reduce((acc, n) => n > acc ? n : acc, numbers[0]); // 5

// Count occurrences
const words = ["apple", "banana", "apple", "cherry", "banana"];
const counts = words.reduce((acc, word) => {
  acc[word] = (acc[word] || 0) + 1;
  return acc;
}, {});
// { apple: 2, banana: 2, cherry: 1 }

// Flatten array
const nested = [[1, 2], [3, 4], [5]];
const flat = nested.reduce((acc, arr) => acc.concat(arr), []); // [1, 2, 3, 4, 5]
\`\`\`

### forEach() - Execute for Each Element

Executes a function for each element (doesn't return a new array).

\`\`\`javascript
const fruits = ["apple", "banana", "cherry"];

fruits.forEach((fruit, index) => {
  console.log(\`\${index + 1}. \${fruit}\`);
});
// 1. apple
// 2. banana
// 3. cherry

// Side effects (modifying external variables)
let sum = 0;
[1, 2, 3, 4].forEach(n => {
  sum += n;
});
console.log(sum); // 10
\`\`\`

## More Useful Array Methods

### find() and findIndex()

\`\`\`javascript
const users = [
  { id: 1, name: "Alice" },
  { id: 2, name: "Bob" },
  { id: 3, name: "Charlie" }
];

// Find first matching element
const user = users.find(u => u.id === 2); // { id: 2, name: "Bob" }

// Find index of first matching element
const index = users.findIndex(u => u.name === "Bob"); // 1
\`\`\`

### some() and every()

\`\`\`javascript
const numbers = [1, 2, 3, 4, 5];

// Check if any element passes test
const hasEven = numbers.some(n => n % 2 === 0); // true

// Check if all elements pass test
const allPositive = numbers.every(n => n > 0); // true
\`\`\`

### includes()

\`\`\`javascript
const fruits = ["apple", "banana", "cherry"];

console.log(fruits.includes("banana")); // true
console.log(fruits.includes("orange")); // false
\`\`\`

### slice() and splice()

\`\`\`javascript
const arr = [1, 2, 3, 4, 5];

// slice() - returns new array (doesn't modify original)
const part = arr.slice(1, 4); // [2, 3, 4] (from index 1 to 3)
const copy = arr.slice(); // [1, 2, 3, 4, 5] (shallow copy)
const lastTwo = arr.slice(-2); // [4, 5] (last 2 elements)

// splice() - modifies original array
const arr2 = [1, 2, 3, 4, 5];
arr2.splice(2, 2, "a", "b"); // Remove 2 elements at index 2, insert "a", "b"
// arr2 is now [1, 2, "a", "b", 5]
\`\`\`

### sort()

\`\`\`javascript
const numbers = [3, 1, 4, 1, 5, 9, 2, 6];

// Sort numbers (modifies original)
numbers.sort((a, b) => a - b); // [1, 1, 2, 3, 4, 5, 6, 9]

const users = [
  { name: "Alice", age: 30 },
  { name: "Bob", age: 25 },
  { name: "Charlie", age: 35 }
];

// Sort by age
users.sort((a, b) => a.age - b.age);
\`\`\`

## Array Destructuring (ES6+)

\`\`\`javascript
const fruits = ["apple", "banana", "cherry"];

// Basic destructuring
const [first, second, third] = fruits;
console.log(first); // "apple"

// Skip elements
const [a, , c] = fruits; // Skip second element

// Rest operator
const [head, ...tail] = fruits; // head = "apple", tail = ["banana", "cherry"]

// Default values
const [x = "default", y] = []; // x = "default", y = undefined

// Swap variables
let a = 1, b = 2;
[a, b] = [b, a]; // a = 2, b = 1
\`\`\`

## Multidimensional Arrays

\`\`\`javascript
// 2D array (matrix)
const matrix = [
  [1, 2, 3],
  [4, 5, 6],
  [7, 8, 9]
];

console.log(matrix[1][2]); // 6 (row 1, column 2)

// Iterating 2D array
matrix.forEach(row => {
  row.forEach(cell => {
    console.log(cell);
  });
});
\`\`\`

## Common Patterns

### Chaining Methods

\`\`\`javascript
const numbers = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

const result = numbers
  .filter(n => n % 2 === 0) // [2, 4, 6, 8, 10]
  .map(n => n * 2) // [4, 8, 12, 16, 20]
  .reduce((sum, n) => sum + n, 0); // 60
\`\`\`

### Converting Array-like Objects

\`\`\`javascript
// Convert NodeList to Array
const divs = document.querySelectorAll("div");
const divArray = Array.from(divs);

// Convert arguments to Array
function sum() {
  const args = Array.from(arguments);
  return args.reduce((sum, n) => sum + n, 0);
}

// Using spread operator
const divArray2 = [...document.querySelectorAll("div")];
\`\`\`

## Performance Considerations

\`\`\`javascript
// For large arrays, consider performance
const largeArray = new Array(1000000).fill(0).map((_, i) => i);

// O(n) operations
largeArray.forEach(n => { /* ... */ }); // Fast
largeArray.map(n => n * 2); // Fast

// O(n²) operations (avoid nested loops)
// largeArray.forEach(a => {
//   largeArray.forEach(b => { /* ... */ }); // Very slow!
// });

// Use Set for fast lookups
const set = new Set(largeArray);
set.has(500000); // O(1) - very fast
\`\`\`

## Best Practices

1. **Use map/filter/reduce**: Prefer functional methods over loops
2. **Don't mutate in map/filter**: These should be pure transformations
3. **Use const for arrays**: Prevents reassignment, but allows mutation
4. **Prefer slice() over splice()**: slice() doesn't mutate
5. **Use includes() for simple checks**: More readable than indexOf() !== -1

\`\`\`javascript
// Good
const doubled = numbers.map(n => n * 2);
const evens = numbers.filter(n => n % 2 === 0);

// Bad
const doubled = [];
for (let i = 0; i < numbers.length; i++) {
  doubled.push(numbers[i] * 2);
}
\`\`\`

Mastering arrays and their methods is crucial for JavaScript development. Practice using map, filter, and reduce - they're the foundation of functional programming in JavaScript and appear everywhere in modern codebases.`,

  '1-objects-prototypes': `Objects store key-value pairs. Almost everything in JavaScript is an object. Prototypes form the basis of inheritance: objects can delegate to another object for properties they don't have.

**Key points:**
- Create objects with {} or new Object(); access keys with dot or bracket notation.
- Prototypes are used for sharing behavior; avoid mutating Object.prototype.
- Modern code often uses classes (syntactic sugar over prototypes).

\`\`\`javascript
const user = { name: "Alex", age: 25 };
user.email = "alex@example.com";
console.log(user["name"]);
function getKeys(obj) {
  return Object.keys(obj);
}
\`\`\`

Understanding prototypes helps when debugging and when reading older codebases.`,

  '1-es6-basics': `ES6+ added arrow functions (shorter syntax and lexical this) and destructuring for arrays and objects. These features make code more concise and readable.

**Key points:**
- Arrow functions don't have their own this; they inherit from the enclosing scope.
- Destructuring unpacks values from arrays or properties from objects.
- Use rest (...rest) to collect remaining items or properties.

\`\`\`javascript
const add = (a, b) => a + b;
const [first, second] = [10, 20];
const { name, age } = { name: "Sam", age: 30 };
const nums = [1, 2, 3];
const [head, ...tail] = nums;
\`\`\`

Adopt these patterns in new code; they're standard in modern JavaScript.`,

  '1-async-await': `# Promises and Async/Await in JavaScript

Asynchronous programming is fundamental to JavaScript. Since JavaScript is single-threaded, it uses asynchronous operations to handle time-consuming tasks (like network requests, file I/O, timers) without blocking the main thread. Understanding Promises and async/await is essential for modern JavaScript development.

## Why Asynchronous Programming?

JavaScript runs in a single thread, meaning it can only do one thing at a time. Without asynchronous programming, any long-running operation (like fetching data from a server) would freeze the entire application.

\`\`\`javascript
// Synchronous (blocking) - DON'T DO THIS
function fetchDataSync() {
  // This would freeze the browser for 3 seconds
  const start = Date.now();
  while (Date.now() - start < 3000) { } // Wait 3 seconds
  return "Data";
}

// Asynchronous (non-blocking) - CORRECT
async function fetchDataAsync() {
  // This doesn't block - other code can run
  await new Promise(resolve => setTimeout(resolve, 3000));
  return "Data";
}
\`\`\`

## Understanding Promises

A Promise represents a value that will be available in the future. It's an object that represents the eventual completion (or failure) of an asynchronous operation.

### Promise States

A Promise has three states:
1. **Pending**: Initial state, operation not completed
2. **Fulfilled**: Operation completed successfully
3. **Rejected**: Operation failed

\`\`\`javascript
// Creating a Promise
const promise = new Promise((resolve, reject) => {
  // Simulate async operation
  setTimeout(() => {
    const success = true;
    if (success) {
      resolve("Operation succeeded!"); // Fulfilled
    } else {
      reject(new Error("Operation failed!")); // Rejected
    }
  }, 1000);
});

// Using the Promise
promise
  .then(result => console.log(result)) // "Operation succeeded!"
  .catch(error => console.error(error)); // Handles rejection
\`\`\`

### Promise Methods

\`\`\`javascript
// then() - handles fulfillment
promise.then(value => {
  console.log("Success:", value);
});

// catch() - handles rejection
promise.catch(error => {
  console.error("Error:", error);
});

// finally() - runs regardless of outcome
promise.finally(() => {
  console.log("Operation completed");
});

// Chaining
fetch("/api/users")
  .then(response => response.json())
  .then(users => {
    console.log(users);
    return fetch(\`/api/users/\${users[0].id}\`);
  })
  .then(response => response.json())
  .then(user => console.log(user))
  .catch(error => console.error("Error:", error));
\`\`\`

### Promise.all() - Wait for All

\`\`\`javascript
// Wait for all promises to resolve
const promise1 = fetch("/api/users");
const promise2 = fetch("/api/posts");
const promise3 = fetch("/api/comments");

Promise.all([promise1, promise2, promise3])
  .then(responses => {
    // All promises resolved
    return Promise.all(responses.map(r => r.json()));
  })
  .then(([users, posts, comments]) => {
    console.log("All data loaded:", { users, posts, comments });
  })
  .catch(error => {
    // If any promise rejects, this catches it
    console.error("One or more requests failed:", error);
  });
\`\`\`

### Promise.allSettled() - Wait for All (Regardless of Outcome)

\`\`\`javascript
// Wait for all promises to settle (fulfilled or rejected)
Promise.allSettled([promise1, promise2, promise3])
  .then(results => {
    results.forEach((result, index) => {
      if (result.status === "fulfilled") {
        console.log(\`Promise \${index} succeeded:\`, result.value);
      } else {
        console.log(\`Promise \${index} failed:\`, result.reason);
      }
    });
  });
\`\`\`

### Promise.race() - First to Complete

\`\`\`javascript
// Returns the first promise that settles
const timeout = new Promise((_, reject) => 
  setTimeout(() => reject(new Error("Timeout")), 5000)
);
const fetchPromise = fetch("/api/data");

Promise.race([fetchPromise, timeout])
  .then(response => response.json())
  .then(data => console.log("Data:", data))
  .catch(error => console.error("Error or timeout:", error));
\`\`\`

## Async/Await Syntax

\`async/await\` is syntactic sugar over Promises that makes asynchronous code look and behave more like synchronous code.

### Basic Async Function

\`\`\`javascript
// async function always returns a Promise
async function fetchUser(id) {
  // await pauses execution until Promise resolves
  const response = await fetch(\`/api/users/\${id}\`);
  
  if (!response.ok) {
    throw new Error(\`Failed to fetch user \${id}\`);
  }
  
  const user = await response.json();
  return user; // Automatically wrapped in Promise
}

// Using async function
fetchUser(1)
  .then(user => console.log(user))
  .catch(error => console.error(error));
\`\`\`

### Error Handling with try/catch

\`\`\`javascript
async function fetchUserSafe(id) {
  try {
    const response = await fetch(\`/api/users/\${id}\`);
    
    if (!response.ok) {
      throw new Error(\`HTTP error! status: \${response.status}\`);
    }
    
    const user = await response.json();
    return user;
  } catch (error) {
    console.error("Error fetching user:", error);
    // Return default or rethrow
    throw error; // Re-throw to let caller handle
  }
}

// Using with try/catch
async function displayUser(id) {
  try {
    const user = await fetchUserSafe(id);
    console.log("User:", user);
  } catch (error) {
    console.error("Failed to display user:", error);
  }
}
\`\`\`

### Sequential vs Parallel Execution

\`\`\`javascript
// Sequential (slow - waits for each)
async function fetchSequential() {
  const user1 = await fetch("/api/users/1"); // Wait
  const user2 = await fetch("/api/users/2"); // Then wait
  const user3 = await fetch("/api/users/3"); // Then wait
  
  return [user1, user2, user3];
}

// Parallel (fast - all at once)
async function fetchParallel() {
  const [user1, user2, user3] = await Promise.all([
    fetch("/api/users/1"),
    fetch("/api/users/2"),
    fetch("/api/users/3")
  ]);
  
  return [user1, user2, user3];
}
\`\`\`

### Real-World Examples

\`\`\`javascript
// Fetching data with error handling
async function getUserData(userId) {
  try {
    const [user, posts, comments] = await Promise.all([
      fetch(\`/api/users/\${userId}\`).then(r => r.json()),
      fetch(\`/api/users/\${userId}/posts\`).then(r => r.json()),
      fetch(\`/api/users/\${userId}/comments\`).then(r => r.json())
    ]);
    
    return { user, posts, comments };
  } catch (error) {
    console.error("Error loading user data:", error);
    throw error;
  }
}

// Retry logic
async function fetchWithRetry(url, retries = 3) {
  for (let i = 0; i < retries; i++) {
    try {
      const response = await fetch(url);
      if (response.ok) return await response.json();
      throw new Error(\`HTTP \${response.status}\`);
    } catch (error) {
      if (i === retries - 1) throw error;
      await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)));
    }
  }
}

// Timeout wrapper
async function fetchWithTimeout(url, timeout = 5000) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);
  
  try {
    const response = await fetch(url, { signal: controller.signal });
    clearTimeout(timeoutId);
    return await response.json();
  } catch (error) {
    clearTimeout(timeoutId);
    if (error.name === "AbortError") {
      throw new Error("Request timeout");
    }
    throw error;
  }
}
\`\`\`

### Common Patterns

\`\`\`javascript
// Loading state pattern
async function loadData() {
  let loading = true;
  let data = null;
  let error = null;
  
  try {
    data = await fetch("/api/data").then(r => r.json());
  } catch (err) {
    error = err;
  } finally {
    loading = false;
  }
  
  return { loading, data, error };
}

// Batch processing
async function processItems(items) {
  const results = [];
  
  // Process in batches of 5
  for (let i = 0; i < items.length; i += 5) {
    const batch = items.slice(i, i + 5);
    const batchResults = await Promise.all(
      batch.map(item => processItem(item))
    );
    results.push(...batchResults);
  }
  
  return results;
}
\`\`\`

## Best Practices

1. **Always handle errors**: Use try/catch or .catch()
2. **Use Promise.all() for parallel operations**: Don't await sequentially
3. **Don't forget await**: Missing await can cause bugs
4. **Use async/await for readability**: But understand Promises for debugging
5. **Avoid mixing styles**: Stick to async/await or Promises, don't mix unnecessarily

\`\`\`javascript
// Good
async function goodExample() {
  try {
    const data = await fetchData();
    return processData(data);
  } catch (error) {
    handleError(error);
  }
}

// Bad - missing error handling
async function badExample() {
  const data = await fetchData(); // What if this fails?
  return processData(data);
}

// Bad - unnecessary mixing
async function confusingExample() {
  await fetchData().then(data => {
    processData(data).then(result => {
      // Hard to read and debug
    });
  });
}
\`\`\`

## Common Mistakes

1. **Forgetting await**: Results in a Promise object instead of the value
2. **Not handling errors**: Unhandled promise rejections can crash your app
3. **Sequential when parallel would work**: Using await in a loop instead of Promise.all()
4. **Async in forEach**: forEach doesn't wait for async operations

\`\`\`javascript
// Wrong - forEach doesn't wait
items.forEach(async item => {
  await processItem(item); // This doesn't wait!
});

// Correct - use for...of
for (const item of items) {
  await processItem(item); // This waits
}

// Or use Promise.all for parallel
await Promise.all(items.map(item => processItem(item)));
\`\`\`

Mastering async/await and Promises is crucial for modern JavaScript development. Practice handling errors, running operations in parallel, and understanding when to use each approach.`,

  '1-closures': `A closure is when a function keeps access to variables from its outer scope even after that outer function has returned. Higher-order functions take or return functions.

**Key points:**
- Closures "close over" variables; they're created whenever a function is defined.
- Higher-order functions (map, filter, setTimeout) accept callbacks.
- Closures are useful for private state and factory functions.

\`\`\`javascript
function makeMultiplier(factor) {
  return function (n) {
    return n * factor;
  };
}
const double = makeMultiplier(2);
console.log(double(5)); // 10
[1, 2, 3].forEach(x => console.log(x));
\`\`\`

Closures are everywhere in JavaScript; recognize them to avoid bugs and write cleaner code.`,

  '1-error-handling': `Errors happen at runtime. try/catch lets you handle them gracefully. throw creates an error; always prefer Error objects and meaningful messages.

**Key points:**
- Put risky code in try; handle failures in catch; optional finally runs either way.
- Don't swallow errors; log or rethrow so issues are visible.
- Use the debugger and console to trace where and why something failed.

\`\`\`javascript
function parseJSON(str) {
  try {
    return JSON.parse(str);
  } catch (e) {
    console.error("Invalid JSON:", e.message);
    return null;
  }
}
throw new Error("Something went wrong");
\`\`\`

Good error handling improves reliability and makes debugging easier.`,

  '1-modules': `Modules let you split code into files. ES modules use import and export. Each file is a module; exported names are available to importers.

**Key points:**
- Use export default for a single main export; named exports for multiple.
- Import only what you need; default imports can have any name.
- In Node.js you may need "type": "module" in package.json for ES modules.

\`\`\`javascript
// math.js
export const add = (a, b) => a + b;
export default function multiply(a, b) { return a * b; }

// app.js
import multiply, { add } from './math.js';
console.log(add(1, 2));
console.log(multiply(2, 3));
\`\`\`

Organize projects with one main idea per module and clear exports.`,

  '1-classes-oop': `Classes are a template for creating objects. They support constructors, instance methods, and inheritance with extends. Under the hood they use prototypes.

**Key points:**
- constructor runs when you create an instance with new.
- Use extends and super() for inheritance; super is also used to call parent methods.
- Class fields and methods can be public; private fields use #.

\`\`\`javascript
class Animal {
  constructor(name) {
    this.name = name;
  }
  speak() {
    return \`\${this.name} makes a sound\`;
  }
}
class Dog extends Animal {
  speak() {
    return \`\${this.name} barks\`;
  }
}
const d = new Dog("Rex");
console.log(d.speak());
\`\`\`

Use classes when you need multiple instances with shared behavior and structure.`,

  '1-event-loop': `JavaScript is single-threaded. The event loop takes tasks from the queue and runs them. Async work (timers, I/O) is handled by the environment and their callbacks run when the stack is clear.

**Key points:**
- Call stack runs synchronous code; when it's empty, the loop picks the next task.
- Microtasks (promises) run before the next macrotask (setTimeout, I/O).
- Blocking the main thread (heavy loops) delays all other work.

\`\`\`javascript
console.log("A");
setTimeout(() => console.log("B"), 0);
Promise.resolve().then(() => console.log("C"));
console.log("D");
// Output: A, D, C, B
\`\`\`

Understanding the event loop helps you reason about order of execution and avoid subtle bugs.`,

  '1-dom': `The Document Object Model (DOM) is the tree of HTML elements. JavaScript can query nodes, change content and attributes, and listen for events. This is how you make pages interactive.

**Key points:**
- querySelector and querySelectorAll find elements; getElementById is older but still valid.
- textContent and innerHTML change content; be careful with innerHTML and user data (XSS).
- addEventListener registers handlers; removeEventListener cleans up.

\`\`\`javascript
const btn = document.querySelector("#submit");
const list = document.querySelector(".items");
btn.addEventListener("click", () => {
  const li = document.createElement("li");
  li.textContent = "New item";
  list.appendChild(li);
});
\`\`\`

Practice selecting elements and responding to events; it's the foundation of front-end interactivity.`,

  // —— Python ——
  '2-intro-python': `# Introduction to Python

Python is a high-level, interpreted programming language known for its simplicity, readability, and versatility. Created by Guido van Rossum and first released in 1991, Python has become one of the most popular programming languages in the world, powering everything from web applications to data science, artificial intelligence, automation, and scientific computing.

## Why Python?

Python's design philosophy emphasizes code readability and simplicity. The language's syntax is clean and intuitive, making it an excellent choice for beginners while remaining powerful enough for complex applications. Python's motto, "There should be one—and preferably only one—obvious way to do it," reflects its focus on clarity and simplicity.

### Key Advantages

1. **Readability**: Python code reads almost like English, making it easy to understand
2. **Versatility**: Used in web development, data science, AI, automation, and more
3. **Large Ecosystem**: Extensive standard library and third-party packages (PyPI)
4. **Community**: Huge, supportive community with abundant resources
5. **Cross-Platform**: Runs on Windows, macOS, Linux, and more

## Python's Philosophy: The Zen of Python

Python follows a set of principles known as "The Zen of Python":

\`\`\`python
import this
# Beautiful is better than ugly.
# Explicit is better than implicit.
# Simple is better than complex.
# Complex is better than complicated.
# Readability counts.
\`\`\`

## Installing Python

### Windows
1. Download from python.org
2. Run installer and check "Add Python to PATH"
3. Verify: \`python --version\`

### macOS
\`\`\`bash
# Using Homebrew
brew install python3

# Or download from python.org
\`\`\`

### Linux
\`\`\`bash
# Ubuntu/Debian
sudo apt update
sudo apt install python3 python3-pip

# Fedora
sudo dnf install python3 python3-pip
\`\`\`

## Your First Python Program

\`\`\`python
# hello.py
print("Hello, World!")
name = "CodeVerse"
print(f"Learning with {name}")
\`\`\`

Run it:
\`\`\`bash
python hello.py
# or
python3 hello.py
\`\`\`

## Python's Unique Features

### 1. Indentation-Based Syntax

Unlike most languages that use curly braces \`{}\`, Python uses indentation to define code blocks. This enforces consistent formatting and readability.

\`\`\`python
# Correct indentation (4 spaces recommended)
if True:
    print("This is indented")
    print("So is this")
    if True:
        print("Nested indentation")

# Wrong - will cause IndentationError
# if True:
# print("Not indented")  # Error!
\`\`\`

**Best Practice**: Use 4 spaces for indentation (PEP 8 standard). Most editors can be configured to insert spaces when you press Tab.

### 2. Dynamic Typing

Python determines variable types automatically at runtime.

\`\`\`python
# No type declarations needed
name = "Alice"        # str
age = 30              # int
price = 19.99         # float
is_active = True       # bool

# Types can be checked
print(type(name))     # <class 'str'>
print(type(age))      # <class 'int'>

# Type hints (optional, Python 3.5+)
def greet(name: str) -> str:
    return f"Hello, {name}"
\`\`\`

### 3. Interactive REPL

Python's Read-Eval-Print Loop (REPL) lets you test code interactively.

\`\`\`bash
$ python3
Python 3.11.0 (default, Oct 24 2022, 10:07:16)
>>> print("Hello!")
Hello!
>>> 2 + 2
4
>>> name = "Python"
>>> f"Learning {name}"
'Learning Python'
>>> exit()
\`\`\`

## Python Versions

- **Python 2**: Legacy version (end of life in 2020) - Don't use
- **Python 3**: Current version - Always use Python 3.x

Check your version:
\`\`\`bash
python3 --version
# Python 3.11.0
\`\`\`

## Basic Syntax

### Variables and Assignment

\`\`\`python
# Simple assignment
x = 10
name = "Alice"

# Multiple assignment
a, b, c = 1, 2, 3
x = y = z = 0  # All set to 0

# Swapping (Pythonic!)
a, b = b, a
\`\`\`

### Comments

\`\`\`python
# Single-line comment

"""
Multi-line comment
(actually a string, but commonly used for documentation)
"""

def function():
    """Docstring - describes what the function does"""
    pass
\`\`\`

### Print Function

\`\`\`python
# Basic print
print("Hello, World!")

# Multiple arguments (automatically adds space)
print("Hello", "World", "!")  # Hello World !

# Custom separator
print("Hello", "World", sep="-")  # Hello-World

# End with custom character (default is newline)
print("Hello", end="")
print("World")  # HelloWorld

# Formatted strings (f-strings, Python 3.6+)
name = "Alice"
age = 30
print(f"{name} is {age} years old")  # Alice is 30 years old

# Old-style formatting (still works)
print("{} is {} years old".format(name, age))
print("%s is %d years old" % (name, age))
\`\`\`

## Python's Standard Library

Python comes with a vast standard library - "batteries included":

\`\`\`python
# File operations
import os
import shutil
from pathlib import Path

# Date and time
from datetime import datetime, timedelta

# JSON handling
import json

# HTTP requests
import urllib.request
# Or use requests library: pip install requests

# Regular expressions
import re

# Math operations
import math
import random
import statistics

# Collections
from collections import Counter, defaultdict, deque

# And many more!
\`\`\`

## Package Management with pip

pip is Python's package installer. It connects to PyPI (Python Package Index) with thousands of packages.

\`\`\`bash
# Install a package
pip install requests

# Install specific version
pip install requests==2.28.0

# Install from requirements file
pip install -r requirements.txt

# List installed packages
pip list

# Show package info
pip show requests

# Uninstall
pip uninstall requests
\`\`\`

## Virtual Environments

Virtual environments isolate project dependencies, preventing conflicts.

\`\`\`bash
# Create virtual environment
python3 -m venv myenv

# Activate (Linux/macOS)
source myenv/bin/activate

# Activate (Windows)
myenv\\Scripts\\activate

# Deactivate
deactivate

# Create requirements.txt
pip freeze > requirements.txt
\`\`\`

## Python Use Cases

### 1. Web Development
- **Frameworks**: Django, Flask, FastAPI
- **Use cases**: Backend APIs, web applications, REST services

### 2. Data Science & Analytics
- **Libraries**: NumPy, Pandas, Matplotlib, Seaborn
- **Use cases**: Data analysis, visualization, statistical modeling

### 3. Machine Learning & AI
- **Libraries**: TensorFlow, PyTorch, Scikit-learn
- **Use cases**: Neural networks, predictive modeling, NLP

### 4. Automation & Scripting
- **Use cases**: File operations, system administration, task automation

### 5. Scientific Computing
- **Libraries**: SciPy, SymPy
- **Use cases**: Scientific calculations, simulations

## Python Style Guide (PEP 8)

PEP 8 is Python's official style guide:

\`\`\`python
# Naming conventions
CONSTANT_NAME = "UPPER_CASE"      # Constants
variable_name = "snake_case"      # Variables and functions
ClassName = "PascalCase"           # Classes

# Line length: max 79 characters (or 99 for some teams)
# Indentation: 4 spaces
# Blank lines: 2 between top-level definitions, 1 between methods
\`\`\`

## Common Beginner Mistakes

1. **Mixing tabs and spaces**: Use spaces consistently
2. **Forgetting colons**: Required after if, for, def, etc.
3. **Case sensitivity**: \`Name\` and \`name\` are different
4. **Indentation errors**: Most common syntax error
5. **Import errors**: Make sure packages are installed

\`\`\`python
# Common errors
# if True  # Missing colon!
#     print("Hello")

# name = "Alice"
# print(Name)  # NameError: name 'Name' is not defined

# import nonexistent  # ModuleNotFoundError
\`\`\`

## Getting Help

\`\`\`python
# Built-in help
help(print)
help(str)

# Interactive help in REPL
>>> help(str.split)

# Online resources
# - Official docs: docs.python.org
# - Stack Overflow
# - Real Python
# - Python.org tutorials
\`\`\`

## Next Steps

Now that you understand Python basics:
1. Practice with the REPL
2. Write small scripts
3. Learn about data types (strings, lists, dictionaries)
4. Explore control flow (if/else, loops)
5. Study functions and modules
6. Work on projects to apply your knowledge

Python's simplicity and power make it an excellent language for both beginners and experienced developers. Focus on writing clean, readable code and leveraging Python's extensive ecosystem.`,

  '2-lists-dicts': `Lists are ordered, mutable sequences. Dictionaries store key-value pairs and are optimized for lookups. Both are used in almost every Python program.

**Key points:**
- List indices start at 0; negative indices count from the end.
- Dict keys must be hashable (e.g. strings, numbers, tuples); values can be anything.
- Use in to test membership; len() for length.

\`\`\`python
fruits = ["apple", "banana", "cherry"]
fruits.append("date")
print(fruits[0], fruits[-1])
person = {"name": "Alex", "age": 25}
person["city"] = "NYC"
print(person.get("name"))
\`\`\`

Master list comprehensions and dict methods; they make code concise and fast.`,

  '2-variables-types': `Variables don't need a type declaration. Python has integers, floats, strings, booleans, and None. Type hints (optional) document expected types.

**Key points:**
- Names are references to objects; assignment rebinds the name.
- Use snake_case for variables and functions; UPPER_CASE for constants.
- type(x) and isinstance(x, int) help you inspect types.

\`\`\`python
count = 42
price = 19.99
name = 'Python'
active = True
nothing = None
def greet(name: str) -> str:
    return f"Hello, {name}"
\`\`\`

Write clear names and add type hints in larger projects for better tooling.`,

  '2-control-flow': `Control flow uses if, elif, else for branching and for/while for loops. Indentation defines which code belongs to which block.

**Key points:**
- Conditions can use and, or, not; truthiness matters (empty collections are False).
- for item in sequence is the usual loop; use range() for indices when needed.
- break and continue work like in other languages.

\`\`\`python
age = 20
if age >= 18:
    print("Adult")
elif age >= 13:
    print("Teen")
else:
    print("Child")
for i in range(3):
    print(i * 2)
\`\`\`

Keep conditions simple and avoid deep nesting; extract logic into functions.`,

  '2-functions': `Functions are defined with def. Arguments can be positional or keyword; you can set defaults and use *args and **kwargs for variable numbers of arguments.

**Key points:**
- return sends a value back; without return, the function returns None.
- Mutable default arguments (e.g. list) are shared across calls—avoid them.
- Use type hints and docstrings to document behavior.

\`\`\`python
def greet(name, greeting="Hello"):
    return f"{greeting}, {name}!"
print(greet("World"))
print(greet("Dev", greeting="Hi"))
def sum_all(*args):
    return sum(args)
\`\`\`

Prefer pure functions and small, single-purpose definitions.`,

  '2-strings': `Strings are immutable sequences of characters. You can slice them, use f-strings for formatting, and call methods like split, join, strip, and replace.

**Key points:**
- Single and double quotes are equivalent; triple quotes for multiline.
- f"value: {x}" is the preferred way to format; .format() and % are older.
- Strings have many methods; use the docs when you need something specific.

\`\`\`python
s = "  Hello, World!  "
print(s.strip().lower())
print(s.split(","))
words = ["a", "b", "c"]
print("-".join(words))
name = "Alex"
print(f"Name: {name!r}")
\`\`\`

String handling is common in scripts and data processing; get comfortable with slicing and f-strings.`,

  '2-tuples-sets': `Tuples are immutable sequences; sets are unordered collections of unique elements. List, dict, and set comprehensions build structures in one expression.

**Key points:**
- Use tuples for fixed records (e.g. coordinates); they can be keys in dicts.
- Sets have O(1) membership and support union, intersection, difference.
- Comprehensions are readable and often faster than loops for building lists/dicts/sets.

\`\`\`python
point = (10, 20)
tags = {"python", "coding", "python"}
tags.add("learning")
squares = [x ** 2 for x in range(5)]
evens = [n for n in nums if n % 2 == 0]
\`\`\`

Prefer sets when you need uniqueness or fast membership; use comprehensions to keep code concise.`,

  '2-modules': `Code is organized in modules (.py files) and packages (directories with __init__.py). The standard library is vast; import what you need.

**Key points:**
- import math then math.sqrt(); from math import sqrt for direct use.
- __name__ == "__main__" is True when the file is run as a script, not when imported.
- Prefer explicit imports; avoid from module import *.

\`\`\`python
import os
from pathlib import Path
from collections import Counter
if __name__ == "__main__":
    print("Running as script")
\`\`\`

Structure projects with one main idea per module and clear public APIs.`,

  '2-file-io': `Reading and writing files uses open() and pathlib.Path. Always close files (or use with) so resources are released. Path handles cross-platform paths.

**Key points:**
- with open(path) as f: ensures the file is closed when the block exits.
- 'r' read, 'w' overwrite, 'a' append; add 'b' for binary.
- pathlib.Path is the modern way to build and manipulate paths.

\`\`\`python
from pathlib import Path
path = Path("data") / "input.txt"
path.parent.mkdir(parents=True, exist_ok=True)
with open(path, "r") as f:
    content = f.read()
with open("output.txt", "w") as f:
    f.write("Hello\\n")
\`\`\`

Use with and pathlib in new code; they make file handling safer and clearer.`,

  '2-classes-oop': `Classes define types with attributes and methods. __init__ is the constructor; self is the instance. Inheritance uses class Child(Parent): and super().

**Key points:**
- Instance methods receive self as the first argument.
- Use __str__ and __repr__ for string representation.
- Prefer composition over deep inheritance when possible.

\`\`\`python
class Person:
    def __init__(self, name, age):
        self.name = name
        self.age = age
    def greet(self):
        return f"Hi, I'm {self.name}"
class Student(Person):
    def __init__(self, name, age, major):
        super().__init__(name, age)
        self.major = major
\`\`\`

Use classes when you have clear nouns and shared behavior; keep hierarchies shallow.`,

  '2-error-handling': `Exceptions are raised with raise and caught with try/except. Use specific exception types and clean up in finally or with context managers.

**Key points:**
- try/except/else/finally: else runs if no exception; finally always runs.
- Catch specific exceptions (e.g. ValueError) instead of bare except.
- Use logging or re-raise after handling so problems aren't hidden.

\`\`\`python
try:
    n = int(input("Enter a number: "))
except ValueError:
    print("Not a valid number")
else:
    print(f"You entered {n}")
finally:
    print("Done")
\`\`\`

Handle errors at the layer that can respond meaningfully; let others propagate.`,

  '2-decorators-generators': `Decorators wrap functions to add behavior; generators yield values one at a time and are memory-efficient for streams or large sequences.

**Key points:**
- A decorator is a function that takes a function and returns a (often wrapped) function.
- Generators use yield; they're lazy and support iteration and send().
- @functools.wraps preserves the wrapped function's metadata.

\`\`\`python
def repeat(times):
    def decorator(fn):
        def wrapper(*args, **kwargs):
            for _ in range(times):
                fn(*args, **kwargs)
        return wrapper
    return decorator
def count_up_to(n):
    i = 0
    while i < n:
        yield i
        i += 1
\`\`\`

Use decorators for cross-cutting concerns; use generators for large or infinite sequences.`,

  '2-venv-pip': `Virtual environments isolate project dependencies. pip installs packages from PyPI. Always use a venv per project so dependency versions don't conflict.

**Key points:**
- python -m venv .venv creates a venv; activate it (e.g. .venv\\Scripts\\activate on Windows).
- pip install -r requirements.txt reproduces an environment; pip freeze > requirements.txt saves it.
- Prefer pip install -e . for local packages in development.

\`\`\`bash
python -m venv .venv
.venv\\Scripts\\activate
pip install requests
pip freeze > requirements.txt
\`\`\`

Use a venv for every project and document dependencies in requirements.txt or pyproject.toml.`,

  '2-ds-algo': `Data structures (lists, dicts, sets, queues) and algorithms (sorting, searching, recursion) are the foundation of efficient code. Big-O helps reason about cost.

**Key points:**
- List append is O(1); insert at front is O(n). Dict get/set are O(1) average.
- Recursion has a base case and recursive case; watch stack depth.
- The standard library provides sort, bisect, heapq, and collections.

\`\`\`python
from collections import deque
q = deque()
q.append(1)
q.popleft()
def factorial(n):
    if n <= 1:
        return 1
    return n * factorial(n - 1)
\`\`\`

Study common patterns (two pointers, sliding window, recursion) and practice on small problems.`,

  // —— TypeScript ——
  '3-ts-basics': `TypeScript adds static types to JavaScript. You write .ts (or .tsx) files, and the compiler checks types and emits JavaScript. This catches many bugs before runtime.

**Key points:**
- TypeScript is a superset of JavaScript; valid JS is valid TS.
- Use tsc to compile or run with ts-node; IDEs give inline type errors.
- Start by adding types to existing JS, then adopt stricter options.

\`\`\`typescript
const message: string = "Hello, TypeScript!";
let count: number = 0;
const done: boolean = false;
console.log(message);
\`\`\`

Install TypeScript with npm and add a tsconfig.json; then add types gradually to your code.`,

  '3-types-annotations': `You add type annotations to variables, parameters, and return types. The compiler infers types when you don't specify them. Primitives and arrays are common starting points.

**Key points:**
- number, string, boolean, null, undefined, symbol, bigint are primitives.
- Array<T> or T[] for arrays; [string, number] for tuples.
- Use strict mode in tsconfig for better safety.

\`\`\`typescript
let id: number = 1;
let name: string = "Alex";
let tags: string[] = ["a", "b"];
let pair: [string, number] = ["age", 25];
function length(s: string): number {
  return s.length;
}
\`\`\`

Annotate function parameters and return types first; let inference handle local variables when obvious.`,

  '3-interfaces-aliases': `Interfaces and type aliases describe object shapes. Interfaces can be extended; type aliases can represent unions and more complex types. Use them for contracts and reuse.

**Key points:**
- interface is extendable and mergeable; type is a general alias.
- Optional properties use ?; readonly marks read-only properties.
- Use both for API boundaries and shared data structures.

\`\`\`typescript
interface User {
  id: number;
  name: string;
  email?: string;
}
type ID = string | number;
const u: User = { id: 1, name: "Alex" };
\`\`\`

Prefer interface for object shapes; use type for unions, tuples, and mapped types.`,

  '3-functions': `Functions have parameter and return types. Overloads let you describe different call signatures. TypeScript enforces that you pass and return the right types.

**Key points:**
- Annotate parameters and return type; inference works for returns if you want.
- Optional parameters use ?; default values infer types.
- Use function overloads when one implementation has multiple call patterns.

\`\`\`typescript
function add(a: number, b: number): number {
  return a + b;
}
const greet = (name: string): string => \`Hello, \${name}\`;
function getLength(x: string | string[]): number {
  return typeof x === "string" ? x.length : x.length;
}
\`\`\`

Type your public APIs first; it documents behavior and catches misuse.`,

  '3-unions-literals': `Union types (A | B) allow a value to be one of several types. Literal types narrow to specific values. Type narrowing (typeof, in, checks) lets the compiler infer types in branches.

**Key points:**
- Discriminated unions use a common property (e.g. kind) to narrow safely.
- Literal types "a" | "b" restrict to those exact values.
- Narrow with if (typeof x === "string") or if ("prop" in obj).

\`\`\`typescript
type Status = "idle" | "loading" | "done";
function handle(status: Status) {
  if (status === "loading") {
    console.log("Please wait...");
  }
}
type Result = { ok: true; data: string } | { ok: false; error: string };
function getMessage(r: Result): string {
  if (r.ok) return r.data;
  return r.error;
}
\`\`\`

Unions and narrowing are central to modeling real-world data and state.`,

  '3-generics': `Generics let you write reusable code that works with different types while keeping type safety. Functions and types can have type parameters.

**Key points:**
- Type parameters are placeholders (e.g. T) that get inferred or specified at use site.
- Constraints (extends) limit what T can be.
- Use generics for containers, utilities, and APIs that work over many types.

\`\`\`typescript
function first<T>(arr: T[]): T | undefined {
  return arr[0];
}
const n = first([1, 2, 3]);
const s = first(["a", "b"]);
interface Box<T> {
  value: T;
}
\`\`\`

Start with generic functions (e.g. identity, first); then add generic types and constraints.`,

  '3-utility-types': `TypeScript provides utility types that transform existing types. Partial, Required, Pick, Omit, and Record are used constantly in real codebases.

**Key points:**
- Partial<T> makes all properties optional; Required<T> the opposite.
- Pick<T, K> and Omit<T, K> select or drop properties.
- Record<K, V> builds an object type with keys K and values V.

\`\`\`typescript
interface User {
  id: number;
  name: string;
  email: string;
}
type UpdateUser = Partial<User>;
type Preview = Pick<User, "name" | "email">;
type WithoutEmail = Omit<User, "email">;
type Dict = Record<string, number>;
\`\`\`

Use these to derive types from existing ones instead of duplicating shapes.`,

  '3-classes': `TypeScript classes add type annotations to properties and constructors. You can implement interfaces and use abstract classes. Inheritance works with extends and super.

**Key points:**
- Class properties can have public, private, protected, or readonly.
- Implement interfaces with implements; extend base classes with extends.
- Abstract classes can have abstract methods that subclasses must implement.

\`\`\`typescript
interface Named {
  name: string;
}
class Person implements Named {
  constructor(public name: string, private age: number) {}
  greet(): string {
    return \`I'm \${this.name}\`;
  }
}
\`\`\`

Use classes when you need instances with shared typed behavior; combine with interfaces for flexibility.`,

  '3-tsconfig': `tsconfig.json configures the TypeScript compiler. You set the target, module system, strict flags, and which files to include. Getting this right improves type safety and compatibility.

**Key points:**
- target and module control emitted JS (e.g. ES2020, ESNext).
- strict enables stricter checks; start with true and fix issues.
- include/exclude control which files are compiled; use paths for aliases.

\`\`\`json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "ESNext",
    "strict": true,
    "outDir": "dist"
  },
  "include": ["src"]
}
\`\`\`

Enable strict mode early; tune target and module for your runtime and bundler.`,

  '3-advanced-types': `Conditional types (T extends U ? X : Y) and mapped types let you build types that change based on other types. They power advanced patterns and utility libraries.

**Key points:**
- Conditional types resolve to one type or another based on a condition.
- Mapped types iterate over keys: { [K in keyof T]: T[K] }.
- infer in conditional types extracts inferred type from a generic.

\`\`\`typescript
type IsString<T> = T extends string ? true : false;
type Readonly<T> = { readonly [K in keyof T]: T[K] };
type ReturnType<T> = T extends (...args: any[]) => infer R ? R : never;
\`\`\`

Use these when building reusable type utilities; study built-in types in lib.d.ts for inspiration.`,

  // —— React ——
  '4-components-jsx': `# Components and JSX in React

React revolutionized front-end development by introducing a component-based architecture. Components are the building blocks of React applications - they're reusable, composable pieces of code that return a description of the UI. Understanding components and JSX is fundamental to React development.

## What Are Components?

A component is a JavaScript function or class that returns React elements (typically written in JSX). Components allow you to:
- **Split UI into reusable pieces**: Write once, use anywhere
- **Encapsulate logic and presentation**: Keep related code together
- **Build complex UIs from simple parts**: Compose small components into larger ones
- **Manage state and props**: Handle data flow in your application

## Function Components (Modern Approach)

Function components are the recommended way to write React components. They're simpler, easier to test, and work seamlessly with React Hooks.

\`\`\`javascript
// Simple function component
function Welcome({ name }) {
  return <h1>Hello, {name}!</h1>;
}

// Arrow function component (equivalent)
const Welcome = ({ name }) => {
  return <h1>Hello, {name}!</h1>;
};

// Usage
<Welcome name="CodeVerse" />
\`\`\`

## Understanding JSX

JSX (JavaScript XML) is a syntax extension that lets you write HTML-like code in JavaScript. It's not HTML - it's syntactic sugar that compiles to \`React.createElement()\` calls.

### JSX vs HTML

\`\`\`javascript
// JSX
const element = <h1 className="title">Hello, World!</h1>;

// What it compiles to (you don't write this)
const element = React.createElement(
  'h1',
  { className: 'title' },
  'Hello, World!'
);

// HTML (for comparison)
// <h1 class="title">Hello, World!</h1>
\`\`\`

### Key JSX Differences from HTML

1. **className instead of class**: \`class\` is a reserved word in JavaScript
2. **camelCase for attributes**: \`onClick\`, \`onChange\`, \`tabIndex\`
3. **Self-closing tags**: Must have \`/\` before \`>\`
4. **JavaScript expressions**: Use \`{}\` to embed JavaScript

\`\`\`javascript
// className (not class)
<div className="container">Content</div>

// camelCase event handlers
<button onClick={handleClick}>Click me</button>
<input onChange={handleChange} />

// Self-closing tags
<img src="image.jpg" alt="Description" />
<br />
<hr />

// JavaScript expressions in {}
const name = "Alice";
<div>Hello, {name}!</div>
<div>2 + 2 = {2 + 2}</div>
\`\`\`

## Component Composition

Components can contain other components, creating a tree structure.

\`\`\`javascript
// Child component
function Button({ text, onClick }) {
  return <button onClick={onClick}>{text}</button>;
}

// Parent component
function App() {
  const handleClick = () => alert("Clicked!");
  
  return (
    <div className="app">
      <h1>My App</h1>
      <Button text="Click me" onClick={handleClick} />
      <Button text="Another button" onClick={() => console.log("Hi")} />
    </div>
  );
}
\`\`\`

## JSX Rules

### 1. Single Root Element

Components must return a single root element. Use React Fragment (\`<>\` or \`<Fragment>\`) to avoid extra DOM nodes.

\`\`\`javascript
// Wrong - multiple root elements
function BadComponent() {
  return (
    <h1>Title</h1>
    <p>Content</p>
  );
}

// Correct - single root
function GoodComponent() {
  return (
    <div>
      <h1>Title</h1>
      <p>Content</p>
    </div>
  );
}

// Better - Fragment (no extra DOM node)
function BetterComponent() {
  return (
    <>
      <h1>Title</h1>
      <p>Content</p>
    </>
  );
}
\`\`\`

### 2. JavaScript Expressions in Curly Braces

\`\`\`javascript
const name = "Alice";
const age = 30;
const isActive = true;
const items = ["apple", "banana", "cherry"];

function Component() {
  return (
    <div>
      {/* Variables */}
      <p>Name: {name}</p>
      
      {/* Expressions */}
      <p>Age next year: {age + 1}</p>
      
      {/* Conditionals */}
      {isActive && <p>User is active</p>}
      {age >= 18 ? <p>Adult</p> : <p>Minor</p>}
      
      {/* Arrays */}
      <ul>
        {items.map(item => <li key={item}>{item}</li>)}
      </ul>
      
      {/* Function calls */}
      <p>Uppercase: {name.toUpperCase()}</p>
    </div>
  );
}
\`\`\`

### 3. Don't Put Objects Directly in JSX

\`\`\`javascript
// Wrong - object in JSX
function BadComponent() {
  const style = { color: "red" };
  return <div>{style}</div>; // Error!
}

// Correct - use object properties
function GoodComponent() {
  const style = { color: "red" };
  return <div style={style}>Content</div>; // Works!
  
  // Or inline
  return <div style={{ color: "red" }}>Content</div>;
}
\`\`\`

## Props (Properties)

Props are how you pass data to components. They're read-only and flow down from parent to child.

\`\`\`javascript
// Component receiving props
function UserCard({ name, email, age }) {
  return (
    <div className="user-card">
      <h2>{name}</h2>
      <p>Email: {email}</p>
      <p>Age: {age}</p>
    </div>
  );
}

// Using the component with props
function App() {
  return (
    <div>
      <UserCard 
        name="Alice" 
        email="alice@example.com" 
        age={30} 
      />
      <UserCard 
        name="Bob" 
        email="bob@example.com" 
        age={25} 
      />
    </div>
  );
}
\`\`\`

### Default Props

\`\`\`javascript
function Greeting({ name = "Guest", greeting = "Hello" }) {
  return <p>{greeting}, {name}!</p>;
}

// Usage
<Greeting /> // "Hello, Guest!"
<Greeting name="Alice" /> // "Hello, Alice!"
<Greeting name="Bob" greeting="Hi" /> // "Hi, Bob!"
\`\`\`

### Props Destructuring

\`\`\`javascript
// Without destructuring
function Component(props) {
  return <div>{props.name} - {props.age}</div>;
}

// With destructuring (preferred)
function Component({ name, age }) {
  return <div>{name} - {age}</div>;
}

// With rest operator
function Component({ name, age, ...otherProps }) {
  return (
    <div {...otherProps}>
      {name} - {age}
    </div>
  );
}
\`\`\`

## Conditional Rendering

\`\`\`javascript
function UserStatus({ isLoggedIn, userName }) {
  // If/else
  if (isLoggedIn) {
    return <p>Welcome back, {userName}!</p>;
  } else {
    return <p>Please log in</p>;
  }
}

// Ternary operator
function UserStatus({ isLoggedIn, userName }) {
  return (
    <div>
      {isLoggedIn ? (
        <p>Welcome back, {userName}!</p>
      ) : (
        <p>Please log in</p>
      )}
    </div>
  );
}

// Logical AND (for simple cases)
function UserStatus({ isLoggedIn, userName }) {
  return (
    <div>
      {isLoggedIn && <p>Welcome back, {userName}!</p>}
      {!isLoggedIn && <p>Please log in</p>}
    </div>
  );
}
\`\`\`

## Lists and Keys

When rendering lists, React needs a unique \`key\` prop for each item.

\`\`\`javascript
function TodoList({ todos }) {
  return (
    <ul>
      {todos.map(todo => (
        <li key={todo.id}>
          {todo.text}
        </li>
      ))}
    </ul>
  );
}

// Keys should be stable, unique, and predictable
// Good: ID from data
{users.map(user => <UserCard key={user.id} user={user} />)}

// Bad: Array index (only if list never reorders)
{items.map((item, index) => <Item key={index} item={item} />)}
\`\`\`

## Event Handling

\`\`\`javascript
function Button() {
  // Define handler function
  const handleClick = () => {
    console.log("Button clicked!");
  };
  
  // Inline handler
  const handleMouseOver = () => alert("Hovered!");
  
  return (
    <button 
      onClick={handleClick}
      onMouseOver={handleMouseOver}
    >
      Click me
    </button>
  );
}

// With parameters
function ButtonList() {
  const handleClick = (id) => {
    console.log(\`Button \${id} clicked\`);
  };
  
  return (
    <div>
      <button onClick={() => handleClick(1)}>Button 1</button>
      <button onClick={() => handleClick(2)}>Button 2</button>
    </div>
  );
}
\`\`\`

## Styling Components

\`\`\`javascript
// Inline styles (object)
function StyledComponent() {
  const style = {
    color: "blue",
    fontSize: "20px",
    padding: "10px"
  };
  
  return <div style={style}>Content</div>;
}

// CSS classes (preferred)
function Component() {
  return <div className="container">Content</div>;
}

// CSS Modules
import styles from './Component.module.css';
function Component() {
  return <div className={styles.container}>Content</div>;
}
\`\`\`

## Component Best Practices

1. **Single Responsibility**: Each component should do one thing
2. **Descriptive Names**: Use PascalCase and clear names
3. **Keep Components Small**: Easier to understand and test
4. **Extract Reusable Logic**: Create custom hooks for shared logic
5. **Props Validation**: Use PropTypes or TypeScript

\`\`\`javascript
// Good - focused, reusable
function Button({ text, onClick, variant = "primary" }) {
  return (
    <button 
      className={\`btn btn-\${variant}\`}
      onClick={onClick}
    >
      {text}
    </button>
  );
}

// Bad - does too much
function BadComponent() {
  // 200 lines of code doing multiple things
  // Hard to understand, test, and reuse
}
\`\`\`

## Common Mistakes

1. **Forgetting keys in lists**: Causes React warnings and bugs
2. **Mutating props**: Props are read-only
3. **Putting objects in JSX**: Must use object properties
4. **Missing return statement**: Component must return JSX
5. **Using class instead of className**: Common typo

\`\`\`javascript
// Common errors
function BadComponent({ items }) {
  // Missing key
  return items.map(item => <div>{item}</div>);
  
  // Mutating props
  items.push("new"); // Don't do this!
  
  // Wrong attribute name
  return <div class="container">Content</div>; // Should be className
}
\`\`\`

Components and JSX are the foundation of React. Master these concepts, and you'll be able to build complex, interactive user interfaces. Practice creating small, focused components and composing them into larger applications.`,

  '4-props-composition': `Props pass data from parent to child. Composition means building UIs by nesting components and sometimes passing children or render props. Avoid prop drilling with context or state management when needed.

**Key points:**
- Props are read-only; don't mutate them. Use state for data that changes.
- children is a special prop for nested content; you can pass JSX or callbacks.
- Compose with wrapper components and slots (e.g. Card with header/body).

\`\`\`javascript
function Card({ title, children }) {
  return (
    <div className="card">
      <h2>{title}</h2>
      {children}
    </div>
  );
}
function Page() {
  return (
    <Card title="Welcome">
      <p>Content here.</p>
    </Card>
  );
}
\`\`\`

Prefer composition over large, monolithic components; keep props minimal and explicit.`,

  '4-state-usestate': `State holds data that can change over time and triggers re-renders when updated. useState returns the current value and a setter; always use the setter to update, never mutate directly.

**Key points:**
- const [value, setValue] = useState(initial); updates are asynchronous and batched.
- For objects/arrays, pass a function to setState to avoid stale closures: setCount(c => c + 1).
- Lift state up when multiple components need the same data.

\`\`\`javascript
function Counter() {
  const [count, setCount] = useState(0);
  return (
    <div>
      <span>{count}</span>
      <button onClick={() => setCount(c => c + 1)}>+1</button>
    </div>
  );
}
function Form() {
  const [text, setText] = useState("");
  return <input value={text} onChange={e => setText(e.target.value)} />;
}
\`\`\`

Use state for values that affect the UI and change over time; keep state as local as possible.`,

  '4-events-forms': `React uses synthetic events (e.g. onClick, onChange). Form inputs are controlled when their value is tied to state and updated in the handler. Submit with onSubmit and preventDefault.

**Key points:**
- Event handlers receive a synthetic event; use e.target.value for inputs.
- Controlled inputs: value={state} and onChange updates state; single source of truth.
- Use name attributes and state shape to handle multiple inputs cleanly.

\`\`\`javascript
function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  function handleSubmit(e) {
    e.preventDefault();
    console.log({ email, password });
  }
  return (
    <form onSubmit={handleSubmit}>
      <input type="email" value={email} onChange={e => setEmail(e.target.value)} />
      <input type="password" value={password} onChange={e => setPassword(e.target.value)} />
      <button type="submit">Log in</button>
    </form>
  );
}
\`\`\`

Keep form state in React state and validate on submit or on blur as needed.`,

  '4-useeffect': `useEffect runs side effects after render: data fetching, subscriptions, or touching the DOM. You specify dependencies so the effect re-runs only when they change. Cleanup prevents leaks.

**Key points:**
- useEffect(fn, deps): run fn after commit; deps optional (run every time) or [] (run once).
- Return a cleanup function to cancel subscriptions or timers when the component unmounts or deps change.
- Prefer fetching in effects or use a data library (e.g. React Query) for server state.

\`\`\`javascript
useEffect(() => {
  const id = setInterval(() => setCount(c => c + 1), 1000);
  return () => clearInterval(id);
}, []);
useEffect(() => {
  fetch(\`/api/user/\${id}\`).then(r => r.json()).then(setUser);
}, [id]);
\`\`\`

Use effects for synchronization with the outside world; keep them small and dependency-correct.`,

  '4-custom-hooks': `Custom hooks are functions that use other hooks. They let you reuse stateful logic across components. Name them with use so the rules of hooks apply.

**Key points:**
- Extract logic that uses useState, useEffect, etc. into a function starting with "use".
- Return state and handlers so the component controls the UI; the hook controls the logic.
- Compose hooks inside other hooks for more reuse.

\`\`\`javascript
function useWindowWidth() {
  const [width, setWidth] = useState(window.innerWidth);
  useEffect(() => {
    const handler = () => setWidth(window.innerWidth);
    window.addEventListener("resize", handler);
    return () => window.removeEventListener("resize", handler);
  }, []);
  return width;
}
function useFetch(url) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => { /* fetch and set */ }, [url]);
  return { data, loading };
}
\`\`\`

Create custom hooks when you see repeated state/effect logic; they keep components simple.`,

  '4-context': `Context lets you pass data through the tree without prop drilling. Provider supplies a value; consumers read it with useContext. Use for theme, auth, or locale; avoid putting frequently changing data in a single context.

**Key points:**
- createContext(default), then <Context.Provider value={...}> and useContext(Context).
- Consumers re-render when the context value identity changes; keep value stable (useMemo/useState) to avoid unnecessary renders.
- Split contexts by concern so updates don't force everyone to re-render.

\`\`\`javascript
const ThemeContext = createContext("light");
function App() {
  const [theme, setTheme] = useState("dark");
  return (
    <ThemeContext.Provider value={theme}>
      <Toolbar />
    </ThemeContext.Provider>
  );
}
function Button() {
  const theme = useContext(ThemeContext);
  return <button className={theme}>Click</button>;
}
\`\`\`

Use context for truly global, low-change data; combine with local state or data libraries for server state.`,

  '4-performance': `React re-renders when state or props change. memo, useMemo, and useCallback help avoid unnecessary work. Use them after measuring; overuse can hurt readability and maintenance.

**Key points:**
- memo(Component) skips re-render if props are shallowly equal.
- useMemo(fn, deps) caches a computed value; useCallback(fn, deps) caches a function reference.
- Profile first; optimize only hot paths (lists, expensive computations, or heavy children).

\`\`\`javascript
const ExpensiveList = memo(function ExpensiveList({ items }) {
  return items.map(i => <Item key={i.id} item={i} />);
});
function Parent() {
  const [count, setCount] = useState(0);
  const items = useMemo(() => fetchItems(), []);
  const handleClick = useCallback(() => doSomething(), []);
  return <ExpensiveList items={items} onClick={handleClick} />;
}
\`\`\`

Measure before optimizing; use these tools when you have measured a real performance problem.`,

  // —— TensorFlow (13) ——
  '13-intro-tf': `# Introduction to TensorFlow

TensorFlow is an open-source machine learning framework developed by Google. It is used for building and training neural networks, from simple linear models to large-scale deep learning systems. TensorFlow supports deployment on CPUs, GPUs, TPUs, and mobile devices.

## Why TensorFlow?

- **Production-ready**: Used by Google and many companies for production ML systems
- **Flexible**: Supports research and production with the same API
- **Ecosystem**: TensorFlow Lite (mobile), TF.js (browser), TensorFlow Serving (deploy)
- **Keras integration**: High-level Keras API is the recommended way to build models

## Installation

\`\`\`bash
pip install tensorflow
# or for GPU support (with CUDA/cuDNN installed):
# pip install tensorflow[and-cuda]
\`\`\`

## Your First TensorFlow Program

\`\`\`python
import tensorflow as tf

# Check version
print(tf.__version__)

# Create a constant tensor
x = tf.constant([[1, 2], [3, 4]])
print(x)
# tf.Tensor([[1 2] [3 4]], shape=(2, 2), dtype=int32)

# Simple computation
y = tf.constant([[5, 6], [7, 8]])
z = tf.add(x, y)
print(z.numpy())
\`\`\`

## Key Concepts

1. **Tensors**: Multi-dimensional arrays (like NumPy arrays) that can run on GPU
2. **Graph (legacy)**: TensorFlow 1.x used a static graph; TF 2.x uses eager execution by default
3. **Eager execution**: Operations run immediately, like NumPy—no separate build/run phase
4. **Keras**: High-level API for defining layers, models, and training loops

## Next Steps

In the following articles you will learn tensors and operations, the Keras API, building and training models, and deploying them.`,

  '13-tensors-ops': `# Tensors and Operations

In TensorFlow, data is represented as **tensors**: multi-dimensional arrays with a uniform type. Tensors have a **shape** (dimensions) and a **dtype** (e.g. float32, int32).

## Creating Tensors

\`\`\`python
import tensorflow as tf

# Scalars (0-D)
s = tf.constant(42)

# Vectors (1-D)
v = tf.constant([1.0, 2.0, 3.0])

# Matrices (2-D)
m = tf.constant([[1, 2], [3, 4]], dtype=tf.float32)

# Higher dimensions
t = tf.ones((2, 3, 4))  # shape (2, 3, 4)
\`\`\`

## Common Operations

\`\`\`python
a = tf.constant([[1, 2], [3, 4]], dtype=tf.float32)
b = tf.constant([[5, 6], [7, 8]], dtype=tf.float32)

# Element-wise
c = tf.add(a, b)
c = a + b
c = tf.multiply(a, b)
c = a * b

# Matrix multiplication
d = tf.matmul(a, b)
d = a @ b

# Reduction
tf.reduce_sum(a)
tf.reduce_mean(a, axis=1)
\`\`\`

## Shape and Reshaping

\`\`\`python
x = tf.constant([[1, 2, 3], [4, 5, 6]])
print(x.shape)  # (2, 3)

y = tf.reshape(x, (3, 2))
z = tf.reshape(x, (-1,))  # flatten; -1 infers size
\`\`\`

## Converting to/from NumPy

\`\`\`python
import numpy as np
arr = np.array([[1, 2], [3, 4]])
t = tf.constant(arr)
back = t.numpy()
\`\`\`

Understanding tensors and operations is the foundation for building and training models in TensorFlow.`,

  '13-keras-sequential': `# Keras API and Sequential Models

The **Keras** API in TensorFlow provides a simple way to build neural networks. A **Sequential** model is a linear stack of layers: each layer has exactly one input and one output.

## Building a Sequential Model

\`\`\`python
import tensorflow as tf
from tensorflow import keras

model = keras.Sequential([
    keras.layers.Dense(128, activation='relu', input_shape=(784,)),
    keras.layers.Dense(64, activation='relu'),
    keras.layers.Dense(10, activation='softmax')
])

model.summary()
\`\`\`

## Adding Layers Step by Step

\`\`\`python
model = keras.Sequential()
model.add(keras.layers.Dense(128, activation='relu', input_shape=(784,)))
model.add(keras.layers.Dropout(0.2))
model.add(keras.layers.Dense(10, activation='softmax'))
\`\`\`

## Compile and Fit

\`\`\`python
model.compile(
    optimizer='adam',
    loss='sparse_categorical_crossentropy',
    metrics=['accuracy']
)

# Assuming you have train_images, train_labels
# model.fit(train_images, train_labels, epochs=5, batch_size=32)
\`\`\`

## When to Use Sequential

- **Pros**: Simple, readable, good for linear stacks (MLPs, simple CNNs)
- **Limitation**: Single input, single output, no branching or skip connections

For multiple inputs/outputs or custom topologies, use the **Functional API** or **Subclassing**.`,

  '13-layers': `# Layers: Dense, Conv2D, Pooling

TensorFlow (Keras) provides many layer types. Here are the most common.

## Dense (Fully Connected)

\`\`\`python
from tensorflow.keras import layers

layer = layers.Dense(64, activation='relu', input_shape=(32,))
# Output shape: (batch, 64)
\`\`\`

## Conv2D (Convolution)

\`\`\`python
layer = layers.Conv2D(32, kernel_size=(3, 3), activation='relu', input_shape=(28, 28, 1))
# 32 filters, 3x3 kernel
\`\`\`

## MaxPooling2D

\`\`\`python
layer = layers.MaxPooling2D(pool_size=(2, 2))
# Halves spatial dimensions
\`\`\`

## Flatten and Dropout

\`\`\`python
layers.Flatten()  # (batch, h, w, c) -> (batch, h*w*c)
layers.Dropout(0.5)  # Regularization
\`\`\`

## Example: Small CNN

\`\`\`python
model = keras.Sequential([
    layers.Conv2D(32, (3, 3), activation='relu', input_shape=(28, 28, 1)),
    layers.MaxPooling2D((2, 2)),
    layers.Conv2D(64, (3, 3), activation='relu'),
    layers.MaxPooling2D((2, 2)),
    layers.Flatten(),
    layers.Dense(64, activation='relu'),
    layers.Dropout(0.5),
    layers.Dense(10, activation='softmax')
])
\`\`\``,

  '13-training': `# Training: compile() and fit()

Training a Keras model involves **compiling** (optimizer, loss, metrics) and **fitting** (running training on data).

## compile()

\`\`\`python
model.compile(
    optimizer='adam',
    loss='sparse_categorical_crossentropy',
    metrics=['accuracy']
)
\`\`\`

- **optimizer**: 'adam', 'sgd', or an instance like \`keras.optimizers.Adam(0.001)\`
- **loss**: 'mse', 'binary_crossentropy', 'sparse_categorical_crossentropy', etc.
- **metrics**: list of metrics to log (e.g. ['accuracy'])

## fit()

\`\`\`python
history = model.fit(
    x_train, y_train,
    batch_size=32,
    epochs=10,
    validation_data=(x_val, y_val),
    verbose=1
)
\`\`\`

\`history\` contains \`history.history\` (loss and metrics per epoch) for plotting.

## Callbacks

\`\`\`python
from tensorflow.keras.callbacks import EarlyStopping, ModelCheckpoint

callbacks = [
    EarlyStopping(patience=3, restore_best_weights=True),
    ModelCheckpoint('best_model.keras', save_best_only=True)
]
model.fit(x_train, y_train, epochs=20, callbacks=callbacks)
\`\`\``,

  '13-cnn': `# Convolutional Neural Networks (CNN)

CNNs are designed for grid-like data (images). They use **convolutional layers** to learn local patterns and **pooling** to reduce spatial size.

## Why CNNs for Images?

- **Local connectivity**: Each neuron sees a small region (receptive field)
- **Weight sharing**: Same filter applied across the image
- **Translation invariance**: Patterns detected regardless of position

## Building a CNN for MNIST

\`\`\`python
from tensorflow.keras import layers, Sequential

model = Sequential([
    layers.Conv2D(32, (3, 3), activation='relu', input_shape=(28, 28, 1)),
    layers.MaxPooling2D((2, 2)),
    layers.Conv2D(64, (3, 3), activation='relu'),
    layers.MaxPooling2D((2, 2)),
    layers.Flatten(),
    layers.Dense(128, activation='relu'),
    layers.Dropout(0.5),
    layers.Dense(10, activation='softmax')
])
model.compile(optimizer='adam', loss='sparse_categorical_crossentropy', metrics=['accuracy'])
\`\`\`

## Data Augmentation

\`\`\`python
from tensorflow.keras.preprocessing.image import ImageDataGenerator
datagen = ImageDataGenerator(rotation_range=15, width_shift_range=0.1, height_shift_range=0.1)
# Use with model.fit(datagen.flow(x_train, y_train, batch_size=32), ...)
\`\`\`

CNNs are the backbone of image classification, object detection, and many vision tasks.`,

  '13-save-load': `# Saving and Loading Models

TensorFlow offers several ways to save and load models.

## Save/Load Entire Model (Keras format)

\`\`\`python
# Save
model.save('my_model.keras')

# Load
model = keras.models.load_model('my_model.keras')
\`\`\`

## Save Weights Only

\`\`\`python
model.save_weights('weights.ckpt')
# Later, with same architecture:
model.load_weights('weights.ckpt')
\`\`\`

## SavedModel (for deployment)

\`\`\`python
model.export('saved_model_dir')
# Or: tf.saved_model.save(model, 'saved_model_dir')
\`\`\`

Loading a SavedModel:

\`\`\`python
loaded = tf.saved_model.load('saved_model_dir')
\`\`\`

Use \`.keras\` for development; use **SavedModel** for TensorFlow Serving or other runtimes.`,

  '13-deployment': `# Deployment with TensorFlow Serving

TensorFlow Serving is a flexible server for serving TensorFlow models in production.

## Export for Serving

\`\`\`python
model.export('serving_model')
# Or manually:
tf.saved_model.save(model, 'serving_model/1')
\`\`\`

## Run TensorFlow Serving (Docker)

\`\`\`bash
docker run -p 8501:8501 \\
  -v "/path/to/serving_model:/models/my_model" \\
  -e MODEL_NAME=my_model \\
  tensorflow/serving
\`\`\`

## REST Request

\`\`\`python
import requests
import json

url = 'http://localhost:8501/v1/models/my_model:predict'
payload = {'instances': x_test[:3].tolist()}
r = requests.post(url, json=payload)
predictions = json.loads(r.text)['predictions']
\`\`\`

## TensorFlow Lite (Mobile)

\`\`\`python
converter = tf.lite.TFLiteConverter.from_keras_model(model)
tflite_model = converter.convert()
with open('model.tflite', 'wb') as f:
    f.write(tflite_model)
\`\`\`

Choose Serving for servers, TFLite for mobile and edge devices.`,

  // —— PyTorch (14) ——
  '14-intro-pytorch': `# Introduction to PyTorch

PyTorch is an open-source deep learning framework developed by Meta (Facebook). It is widely used in research and industry for its **dynamic computation graph**, Pythonic design, and strong GPU support.

## Why PyTorch?

- **Eager execution**: Build and run in a natural, imperative style
- **Pythonic**: Feels like NumPy with automatic differentiation
- **Research-friendly**: Easy to experiment and debug
- **Ecosystem**: torchvision, torchaudio, Hugging Face integrations

## Installation

\`\`\`bash
pip install torch torchvision
\`\`\`

## Your First Tensor

\`\`\`python
import torch

x = torch.tensor([[1, 2], [3, 4]], dtype=torch.float32)
print(x)
print(x.shape)
y = x + 1
print(y)
\`\`\`

## GPU Support

\`\`\`python
device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
x = x.to(device)
\`\`\`

In the next articles you will learn autograd, nn.Module, and the training loop.`,

  '14-tensors-autograd': `# Tensors and Autograd

PyTorch tensors are similar to NumPy arrays but can live on GPU and support **automatic differentiation** via \`requires_grad=True\`.

## Creating Tensors

\`\`\`python
import torch

a = torch.tensor([1.0, 2.0, 3.0])
b = torch.zeros(2, 3)
c = torch.ones(2, 3)
d = torch.randn(2, 3)
\`\`\`

## Autograd

\`\`\`python
x = torch.tensor([2.0], requires_grad=True)
y = x ** 2 + 3 * x
y.backward()
print(x.grad)  # dy/dx at x=2
\`\`\`

## Gradients for Training

\`\`\`python
w = torch.randn(3, 2, requires_grad=True)
loss = ((x @ w - target) ** 2).mean()
loss.backward()
# w.grad now holds gradients; optimizer.step() updates w
\`\`\`

## Common Operations

\`\`\`python
torch.matmul(a, b)
a @ b
a.sum(), a.mean(), a.max()
a.reshape(2, 3)
a.to(device)
\`\`\``,

  '14-nn-module': `# Building Models with nn.Module

\`torch.nn.Module\` is the base class for all neural network modules. You define \`__init__\` (layers) and \`forward\` (computation).

## Simple MLP

\`\`\`python
import torch.nn as nn

class MLP(nn.Module):
    def __init__(self):
        super().__init__()
        self.fc1 = nn.Linear(784, 128)
        self.fc2 = nn.Linear(128, 64)
        self.fc3 = nn.Linear(64, 10)

    def forward(self, x):
        x = x.view(-1, 784)
        x = torch.relu(self.fc1(x))
        x = torch.relu(self.fc2(x))
        return self.fc3(x)

model = MLP()
\`\`\`

## Sequential

\`\`\`python
model = nn.Sequential(
    nn.Linear(784, 128),
    nn.ReLU(),
    nn.Linear(128, 10)
)
\`\`\`

## Parameters

\`\`\`python
for name, param in model.named_parameters():
    print(name, param.shape)
\`\`\``,

  '14-training-loop': `# The Training Loop

In PyTorch you write the training loop explicitly: forward pass, loss, backward, optimizer step.

## Typical Loop

\`\`\`python
optimizer = torch.optim.Adam(model.parameters(), lr=1e-3)
criterion = nn.CrossEntropyLoss()

model.train()
for epoch in range(10):
    for x_batch, y_batch in train_loader:
        optimizer.zero_grad()
        out = model(x_batch)
        loss = criterion(out, y_batch)
        loss.backward()
        optimizer.step()
\`\`\`

## Validation

\`\`\`python
model.eval()
with torch.no_grad():
    for x_batch, y_batch in val_loader:
        out = model(x_batch)
        # compute accuracy, etc.
\`\`\`

## Device

\`\`\`python
model = model.to(device)
x_batch, y_batch = x_batch.to(device), y_batch.to(device)
\`\`\``,

  '14-cnn-pytorch': `# Convolutional Networks in PyTorch

\`\`\`python
import torch.nn as nn

class CNN(nn.Module):
    def __init__(self):
        super().__init__()
        self.conv1 = nn.Conv2d(1, 32, 3)
        self.pool = nn.MaxPool2d(2)
        self.conv2 = nn.Conv2d(32, 64, 3)
        self.fc1 = nn.Linear(64 * 5 * 5, 128)
        self.fc2 = nn.Linear(128, 10)

    def forward(self, x):
        x = self.pool(nn.functional.relu(self.conv1(x)))
        x = self.pool(nn.functional.relu(self.conv2(x)))
        x = x.view(-1, 64 * 5 * 5)
        x = nn.functional.relu(self.fc1(x))
        return self.fc2(x)
\`\`\`

Use \`nn.Conv2d(in_channels, out_channels, kernel_size)\` and \`nn.MaxPool2d\`. Flatten before dense layers.`,

  '14-transfer-learning': `# Transfer Learning

Transfer learning reuses a pretrained model (e.g. ResNet) and fine-tunes it on your dataset.

## Load Pretrained Model

\`\`\`python
from torchvision import models
backbone = models.resnet18(weights=models.ResNet18_Weights.IMAGENET1K_V1)
# Replace final layer
backbone.fc = nn.Linear(backbone.fc.in_features, num_classes)
\`\`\`

## Freeze Then Unfreeze

\`\`\`python
for param in backbone.parameters():
    param.requires_grad = False
backbone.fc = nn.Linear(backbone.fc.in_features, num_classes)
# Train only backbone.fc, then unfreeze and fine-tune with small lr
\`\`\``,

  '14-checkpoints': `# Saving and Loading Checkpoints

\`\`\`python
# Save
torch.save({
    'epoch': epoch,
    'model_state_dict': model.state_dict(),
    'optimizer_state_dict': optimizer.state_dict(),
    'loss': loss,
}, 'checkpoint.pt')

# Load
ckpt = torch.load('checkpoint.pt')
model.load_state_dict(ckpt['model_state_dict'])
optimizer.load_state_dict(ckpt['optimizer_state_dict'])
\`\`\`

For inference only:

\`\`\`python
torch.save(model.state_dict(), 'model_weights.pt')
model.load_state_dict(torch.load('model_weights.pt'))
\`\`\``,

  // —— Scikit-learn (15) ——
  '15-intro-sklearn': `# Introduction to Scikit-learn

Scikit-learn is the standard Python library for **classical** machine learning: classification, regression, clustering, and preprocessing. It is built on NumPy, SciPy, and matplotlib.

## Design Principles

- **Consistent API**: \`fit()\`, \`predict()\`, \`transform()\` across estimators
- **Sensible defaults**: Works out of the box
- **Composition**: Pipelines and model selection

## Installation

\`\`\`bash
pip install scikit-learn
\`\`\`

## Minimal Example

\`\`\`python
from sklearn.datasets import load_iris
from sklearn.model_selection import train_test_split
from sklearn.neighbors import KNeighborsClassifier

X, y = load_iris(return_X_y=True)
X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2)
clf = KNeighborsClassifier(n_neighbors=5)
clf.fit(X_train, y_train)
score = clf.score(X_test, y_test)
\`\`\``,

  '15-preprocessing': `# Data Preprocessing

Preparing features before training: scaling, encoding, imputation.

## StandardScaler

\`\`\`python
from sklearn.preprocessing import StandardScaler
scaler = StandardScaler()
X_train_scaled = scaler.fit_transform(X_train)
X_test_scaled = scaler.transform(X_test)
\`\`\`

## MinMaxScaler, OneHotEncoder

\`\`\`python
from sklearn.preprocessing import MinMaxScaler, OneHotEncoder
# MinMaxScaler: scale to [0, 1]
# OneHotEncoder: categorical -> dummy variables
\`\`\`

## SimpleImputer

\`\`\`python
from sklearn.impute import SimpleImputer
imp = SimpleImputer(strategy='mean')
X_imputed = imp.fit_transform(X)
\`\`\``,

  '15-classification': `# Supervised Learning: Classification

Common classifiers in scikit-learn.

## Logistic Regression

\`\`\`python
from sklearn.linear_model import LogisticRegression
clf = LogisticRegression(max_iter=1000)
clf.fit(X_train, y_train)
y_pred = clf.predict(X_test)
\`\`\`

## Random Forest, SVM

\`\`\`python
from sklearn.ensemble import RandomForestClassifier
from sklearn.svm import SVC
clf = RandomForestClassifier(n_estimators=100)
# clf = SVC(kernel='rbf')
clf.fit(X_train, y_train)
\`\`\`

## Probability Estimates

\`\`\`python
proba = clf.predict_proba(X_test)
\`\`\``,

  '15-regression': `# Supervised Learning: Regression

\`\`\`python
from sklearn.linear_model import LinearRegression, Ridge
from sklearn.ensemble import RandomForestRegressor

# Linear
reg = LinearRegression()
reg.fit(X_train, y_train)

# Regularized
reg = Ridge(alpha=1.0)

# Non-linear
reg = RandomForestRegressor(n_estimators=100)
reg.fit(X_train, y_train)
y_pred = reg.predict(X_test)
\`\`\``,

  '15-metrics': `# Model Evaluation and Metrics

## Classification

\`\`\`python
from sklearn.metrics import accuracy_score, precision_recall_fscore_support, confusion_matrix

accuracy_score(y_test, y_pred)
precision_recall_fscore_support(y_test, y_pred, average='weighted')
confusion_matrix(y_test, y_pred)
\`\`\`

## Regression

\`\`\`python
from sklearn.metrics import mean_squared_error, r2_score
mean_squared_error(y_test, y_pred)
r2_score(y_test, y_pred)
\`\`\`

## Cross-Validation

\`\`\`python
from sklearn.model_selection import cross_val_score
scores = cross_val_score(clf, X, y, cv=5)
\`\`\``,

  '15-pipelines': `# Pipelines and Model Selection

## Pipeline

\`\`\`python
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import StandardScaler
from sklearn.svm import SVC

pipe = Pipeline([
    ('scaler', StandardScaler()),
    ('clf', SVC())
])
pipe.fit(X_train, y_train)
pipe.predict(X_test)
\`\`\`

## GridSearchCV

\`\`\`python
from sklearn.model_selection import GridSearchCV
param_grid = {'clf__C': [0.1, 1, 10], 'clf__gamma': ['scale', 'auto']}
search = GridSearchCV(pipe, param_grid, cv=5)
search.fit(X_train, y_train)
print(search.best_params_)
\`\`\``,

  // —— OpenAI API (16) ——
  '16-intro-openai': `# Introduction to the OpenAI API

The OpenAI API provides access to language models (GPT-4, GPT-3.5) and embeddings. You send HTTP requests (or use the official SDK) with a prompt and receive text or embeddings.

## Concepts

- **Models**: e.g. gpt-4o, gpt-4o-mini, text-embedding-3-small
- **API key**: Required in the \`Authorization\` header
- **Tokens**: Input and output are billed by token count

## Quick Example (Python)

\`\`\`python
from openai import OpenAI
client = OpenAI(api_key="your-api-key")
response = client.chat.completions.create(
    model="gpt-4o-mini",
    messages=[{"role": "user", "content": "Say hello in one sentence."}]
)
print(response.choices[0].message.content)
\`\`\`

## REST Alternative

\`\`\`
POST https://api.openai.com/v1/chat/completions
Authorization: Bearer YOUR_API_KEY
Content-Type: application/json
{"model": "gpt-4o-mini", "messages": [{"role": "user", "content": "Hello"}]}
\`\`\``,

  '16-chat-completions': `# Chat Completions

The Chat Completions API is used for conversational and single-turn text generation.

## Message Roles

- **system**: Sets behavior (e.g. "You are a helpful assistant.")
- **user**: The human or application request
- **assistant**: Model replies (include for few-shot or conversation history)

## Basic Call

\`\`\`python
response = client.chat.completions.create(
    model="gpt-4o-mini",
    messages=[
        {"role": "system", "content": "You are a coding tutor."},
        {"role": "user", "content": "Explain a for loop in Python."}
    ],
    max_tokens=500,
    temperature=0.7
)
text = response.choices[0].message.content
\`\`\`

## Multi-turn

\`\`\`python
messages = [
    {"role": "user", "content": "What is 2+2?"},
    {"role": "assistant", "content": "4."},
    {"role": "user", "content": "Multiply that by 3."}
]
response = client.chat.completions.create(model="gpt-4o-mini", messages=messages)
\`\`\``,

  '16-embeddings': `# Embeddings and Similarity

Embeddings turn text into fixed-size vectors. Use them for search, clustering, or as input to other models.

## Getting Embeddings

\`\`\`python
response = client.embeddings.create(
    model="text-embedding-3-small",
    input="Your text here"
)
vector = response.data[0].embedding
\`\`\`

## Similarity (Cosine)

\`\`\`python
import numpy as np
def cosine_similarity(a, b):
    return np.dot(a, b) / (np.linalg.norm(a) * np.linalg.norm(b))
sim = cosine_similarity(vec1, vec2)
\`\`\`

## Use Cases

- Semantic search: embed query and documents; rank by similarity
- Clustering: k-means on embedding vectors
- Classification: use embeddings as features for a small classifier`,

  '16-best-practices': `# Best Practices and Prompting

## Clear Instructions

- Be specific: "List 3 bullet points" instead of "Tell me about X."
- Specify format: JSON, markdown, code block.
- Give examples (few-shot) when the task is nuanced.

## System Message

Use the system role to set tone, constraints, and output format so the model stays on task.

## Temperature and max_tokens

- **temperature**: Lower (0–0.3) for factual, deterministic output; higher for creativity.
- **max_tokens**: Set to avoid runaway generation and control cost.

## Security

- Never log or expose API keys.
- Sanitize user input before sending; don’t trust model output blindly in security-sensitive flows.`,

  '16-rate-limits': `# Rate Limits and Error Handling

## Rate Limits

OpenAI enforces requests per minute (RPM) and tokens per minute (TPM). When exceeded, you get HTTP 429.

## Retry with Backoff

\`\`\`python
import time
def with_retry(fn, max_retries=3):
    for i in range(max_retries):
        try:
            return fn()
        except Exception as e:
            if "429" in str(e) and i < max_retries - 1:
                time.sleep(2 ** i)
            else:
                raise
\`\`\`

## Handle Errors

- **429**: Rate limit — back off and retry.
- **401**: Invalid or missing API key.
- **500**: Server error — retry with backoff.

Check the response body for \`error.code\` and \`error.message\` for details.`,

  // —— DevOps ——
  '17-linux-basics': `# Linux Basics

Linux is the dominant operating system for servers, cloud infrastructure, and DevOps workflows. Understanding Linux fundamentals is essential for any developer working in modern software delivery.

## The Linux File System

The Linux file system is hierarchical and starts from the root (\`/\`):

- \`/home\` — User home directories
- \`/etc\` — System configuration files
- \`/var\` — Variable data (logs, caches)
- \`/usr\` — User programs and binaries
- \`/tmp\` — Temporary files
- \`/opt\` — Optional/third-party software

\`\`\`bash
# Navigate and list
cd /home
ls -la
pwd
\`\`\`

## Essential Commands

### File and Directory Operations

\`\`\`bash
# Create, copy, move, remove
mkdir myproject
touch file.txt
cp file.txt backup/
mv file.txt renamed.txt
rm file.txt
rm -rf directory/
\`\`\`

### Viewing and Editing Files

\`\`\`bash
# View file contents
cat file.txt
head -20 file.txt
tail -f log.txt   # Follow log in real time

# Edit with nano or vim
nano file.txt
vim file.txt
\`\`\`

### Permissions and Ownership

\`\`\`bash
# View permissions (rwx for owner, group, others)
ls -l file.txt

# Change permissions (read=4, write=2, execute=1)
chmod 755 script.sh
chmod +x script.sh

# Change ownership
chown user:group file.txt
\`\`\`

## Pipes and Redirects

\`\`\`bash
# Pipe output to next command
cat file.txt | grep "error"

# Redirect output
echo "hello" > output.txt   # Overwrite
echo "more" >> output.txt   # Append

# Redirect stderr
command 2> error.log
command 2>&1 | tee combined.log
\`\`\`

## Processes and System

\`\`\`bash
# List processes
ps aux
top
htop

# Kill process
kill PID
kill -9 PID   # Force kill

# Run in background
./long-task &
nohup ./task &
\`\`\`

## Package Management

\`\`\`bash
# Ubuntu/Debian (apt)
sudo apt update
sudo apt install nginx
sudo apt remove package

# CentOS/RHEL (yum/dnf)
sudo yum install nginx
sudo dnf install nginx
\`\`\`

## Environment Variables

\`\`\`bash
# Set for current session
export API_KEY=secret123
echo $API_KEY

# Set for a single command
API_KEY=secret123 ./app
\`\`\`

Mastering these basics prepares you for scripting, server management, and container workflows.`,

  '17-git-github': `# Git and GitHub

Git is a distributed version control system. GitHub is a platform for hosting Git repositories and collaborating on code.

## Git Fundamentals

### Initialize and Clone

\`\`\`bash
# Start a new repo
git init

# Clone existing repo
git clone https://github.com/user/repo.git
\`\`\`

### Basic Workflow

\`\`\`bash
# Stage changes
git add file.txt
git add .

# Commit
git commit -m "Add feature X"

# Push to remote
git push origin main
\`\`\`

### Branches

\`\`\`bash
# Create and switch
git branch feature-x
git checkout feature-x
git checkout -b feature-x   # Create and switch

# Merge
git checkout main
git merge feature-x
\`\`\`

## GitHub Workflow

1. **Fork** a repo on GitHub to your account
2. **Clone** your fork locally
3. **Create a branch** for your changes
4. **Commit and push** to your fork
5. **Open a Pull Request** (PR) to the original repo
6. **Review and merge** after approval

\`\`\`bash
# Add upstream for sync
git remote add upstream https://github.com/original/repo.git
git fetch upstream
git merge upstream/main
\`\`\`

## Undo and Reset

\`\`\`bash
# Unstage
git reset HEAD file.txt

# Discard local changes
git checkout -- file.txt

# Reset last commit (keep changes)
git reset --soft HEAD~1

# Reset last commit (discard changes)
git reset --hard HEAD~1
\`\`\`

## .gitignore

\`\`\`gitignore
# Dependencies
node_modules/
venv/

# Environment
.env
.env.local

# Build
dist/
build/
\`\`\`

Git and GitHub are the foundation of modern collaborative development.`,

  '17-env-management': `# Environment Management

Environment variables and configuration management keep secrets and environment-specific values out of code.

## Why Environment Variables?

- **Security**: API keys and passwords stay out of source control
- **Flexibility**: Same code runs in dev, staging, and production
- **Twelve-Factor App**: Config in the environment

## Using Environment Variables

### Shell (Linux/Mac)

\`\`\`bash
# Export for current session
export DATABASE_URL=postgres://localhost/mydb
export NODE_ENV=production

# Load from file
export $(cat .env | xargs)
\`\`\`

### .env Files

\`\`\`env
DATABASE_URL=postgres://localhost/mydb
API_KEY=your-secret-key
NODE_ENV=development
\`\`\`

**Important**: Add \`.env\` to \`.gitignore\`. Never commit secrets.

### Loading .env in Applications

\`\`\`javascript
// Node.js with dotenv
require('dotenv').config();
const dbUrl = process.env.DATABASE_URL;
\`\`\`

\`\`\`python
# Python with python-dotenv
from dotenv import load_dotenv
load_dotenv()
import os
db_url = os.getenv("DATABASE_URL")
\`\`\`

## Environment-Specific Config

\`\`\`
.env.development
.env.staging
.env.production
\`\`\`

Load the appropriate file based on \`NODE_ENV\` or \`APP_ENV\`.

## Secret Management

- **Local**: \`.env\` files (gitignored)
- **CI/CD**: Secret variables in GitHub Actions, GitLab CI, etc.
- **Cloud**: AWS Secrets Manager, HashiCorp Vault, Azure Key Vault

Proper env management is critical for secure, portable deployments.`,

  '17-docker-basics': `# Docker Basics

Docker containerizes applications with their dependencies, ensuring "it works on my machine" becomes "it works everywhere."

## Containers vs Virtual Machines

- **VMs**: Full OS per instance, slower startup
- **Containers**: Shared OS kernel, lightweight, fast startup

## Core Concepts

### Images

An image is a read-only template. Built from a Dockerfile.

\`\`\`bash
# Pull an image
docker pull nginx:alpine

# List images
docker images
\`\`\`

### Containers

A container is a runnable instance of an image.

\`\`\`bash
# Run a container
docker run -d -p 8080:80 --name web nginx:alpine

# List running
docker ps

# Stop and remove
docker stop web
docker rm web
\`\`\`

## Writing a Dockerfile

\`\`\`dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 3000
CMD ["node", "index.js"]
\`\`\`

\`\`\`bash
# Build
docker build -t myapp:latest .

# Run
docker run -p 3000:3000 myapp:latest
\`\`\`

## Useful Commands

\`\`\`bash
docker logs container_id
docker exec -it container_id sh
docker cp file.txt container_id:/path/
\`\`\`

## Volumes

Persist data outside the container:

\`\`\`bash
docker run -v /host/path:/container/path myimage
docker volume create mydata
docker run -v mydata:/data myimage
\`\`\`

Docker is the foundation for modern deployment and local development parity.`,

  '17-docker-compose': `# Docker Compose

Docker Compose orchestrates multi-container applications with a single \`docker-compose.yml\` file.

## Basic Structure

\`\`\`yaml
version: '3.8'

services:
  web:
    build: .
    ports:
      - "3000:3000"
    environment:
      - DATABASE_URL=postgres://db:5432/mydb
    depends_on:
      - db

  db:
    image: postgres:15-alpine
    environment:
      POSTGRES_USER: app
      POSTGRES_PASSWORD: secret
      POSTGRES_DB: mydb
    volumes:
      - postgres_data:/var/lib/postgresql/data

volumes:
  postgres_data:
\`\`\`

## Key Concepts

### Services

Each service is a container. Define \`build\` or \`image\`, \`ports\`, \`environment\`, \`volumes\`, \`depends_on\`.

### Networks

By default, Compose creates a network. Services reach each other by service name (e.g., \`db\`).

### Volumes

Named volumes persist data across restarts. Bind mounts map host paths.

\`\`\`yaml
volumes:
  - myvolume:/app/data      # Named volume
  - ./local/path:/app/data   # Bind mount
\`\`\`

## Commands

\`\`\`bash
# Start all services
docker-compose up -d

# Stop
docker-compose down

# View logs
docker-compose logs -f web

# Rebuild
docker-compose up -d --build
\`\`\`

## Environment Files

\`\`\`yaml
env_file:
  - .env
\`\`\`

Compose simplifies running full stacks (app + db + cache) locally and in CI.`,

  '17-ci-github-actions': `# CI + GitHub Actions

Continuous Integration (CI) runs automated checks on every push or PR. GitHub Actions is GitHub's built-in CI/CD platform.

## Workflow File

Create \`.github/workflows/ci.yml\`:

\`\`\`yaml
name: CI

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'

      - run: npm ci
      - run: npm run lint
      - run: npm run test
      - run: npm run build
\`\`\`

## Key Concepts

### Triggers (\`on\`)

- \`push\`: On push to branches
- \`pull_request\`: On PRs
- \`workflow_dispatch\`: Manual trigger

### Jobs and Steps

- **Job**: Runs on a runner (e.g., ubuntu-latest)
- **Step**: Single unit (checkout, run, action)

### Actions

Reusable units from the Marketplace:

\`\`\`yaml
- uses: actions/checkout@v4
- uses: actions/setup-node@v4
  with:
    node-version: '20'
\`\`\`

## Caching

\`\`\`yaml
- uses: actions/cache@v4
  with:
    path: node_modules
    key: \${{ runner.os }}-npm-\${{ hashFiles('**/package-lock.json') }}
\`\`\`

## Secrets

\`\`\`yaml
env:
  API_KEY: \${{ secrets.API_KEY }}
\`\`\`

Add secrets in repo Settings → Secrets and variables → Actions.`,

  '17-eslint-prettier': `# ESLint and Prettier

ESLint catches code quality issues. Prettier formats code consistently. Together they keep codebases clean and uniform.

## ESLint

### Setup

\`\`\`bash
npm init -y
npm install -D eslint
npx eslint --init
\`\`\`

### Configuration (\`.eslintrc.js\` or \`eslint.config.js\`)

\`\`\`javascript
module.exports = {
  env: { node: true, es2022: true },
  extends: ['eslint:recommended', 'plugin:@typescript-eslint/recommended'],
  parser: '@typescript-eslint/parser',
  plugins: ['@typescript-eslint'],
  rules: {
    'no-unused-vars': 'warn',
    'no-console': 'off',
  },
};
\`\`\`

### Running

\`\`\`bash
npx eslint .
npx eslint --fix .
\`\`\`

## Prettier

### Setup

\`\`\`bash
npm install -D prettier
\`\`\`

### Configuration (\`.prettierrc\`)

\`\`\`json
{
  "semi": true,
  "singleQuote": true,
  "tabWidth": 2,
  "trailingComma": "es5"
}
\`\`\`

### Running

\`\`\`bash
npx prettier --write .
npx prettier --check .
\`\`\`

## ESLint + Prettier Together

\`\`\`bash
npm install -D eslint-config-prettier eslint-plugin-prettier
\`\`\`

\`\`\`javascript
// .eslintrc.js
extends: ['eslint:recommended', 'plugin:prettier/recommended']
\`\`\`

\`eslint-config-prettier\` turns off ESLint rules that conflict with Prettier.`,

  '17-aws-deployment': `# AWS Deployment

Amazon Web Services provides scalable infrastructure for deploying applications.

## Key Services

### EC2

Virtual servers. Full control over the OS.

- Launch instance (AMI, instance type)
- Security groups (firewall)
- Elastic IP for static IP

### Elastic Beanstalk

Platform-as-a-Service. Upload code, EB handles scaling, load balancing, and deployment.

\`\`\`bash
eb init -p node.js my-app
eb create production
eb deploy
\`\`\`

### ECS (Elastic Container Service)

Run Docker containers. Use Fargate for serverless containers (no EC2 to manage).

### Lambda

Serverless functions. Pay per invocation. Great for APIs and event-driven workloads.

### S3 + CloudFront

Static hosting. Upload build artifacts to S3, serve via CloudFront CDN.

\`\`\`bash
aws s3 sync dist/ s3://my-bucket --delete
aws cloudfront create-invalidation --distribution-id XXX --paths "/*"
\`\`\`

### RDS

Managed databases (PostgreSQL, MySQL, etc.). Automated backups, multi-AZ for HA.

## IAM and Security

- Use IAM roles for EC2/ECS/Lambda instead of access keys
- Principle of least privilege
- Enable MFA for root and admin users

## Cost Optimization

- Use Reserved Instances or Savings Plans for steady workloads
- Scale down dev/staging when not in use
- Monitor with Cost Explorer and budgets`,

  '17-cicd': `# CI/CD Pipelines

CI/CD (Continuous Integration / Continuous Delivery) automates building, testing, and deploying software.

## Pipeline Stages

1. **Build**: Compile, install dependencies
2. **Test**: Unit, integration, e2e
3. **Security**: SAST, dependency scanning
4. **Deploy**: To staging, then production

## Example: GitHub Actions Full Pipeline

\`\`\`yaml
name: CI/CD

on:
  push:
    branches: [main]

jobs:
  build-test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
      - run: npm ci
      - run: npm run lint
      - run: npm run test
      - run: npm run build

  deploy:
    needs: build-test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Deploy to AWS
        run: |
          # Deploy script (e.g., EB, S3, ECS)
          echo "Deploying..."
\`\`\`

## Strategies

- **Blue-Green**: Two identical environments, switch traffic
- **Canary**: Gradually shift traffic to new version
- **Rolling**: Replace instances incrementally

## Best Practices

- Automated tests must pass before deploy
- Use feature flags for gradual rollout
- Rollback plan and runbooks
- Audit logging for deployments`,

  '17-kubernetes': `# Kubernetes

Kubernetes (K8s) orchestrates containers at scale. It manages deployment, scaling, load balancing, and self-healing.

## Core Concepts

### Pod

The smallest deployable unit. Usually one container per pod; can run multiple co-located containers.

\`\`\`yaml
apiVersion: v1
kind: Pod
metadata:
  name: my-app
spec:
  containers:
    - name: app
      image: myapp:latest
      ports:
        - containerPort: 3000
\`\`\`

### Deployment

Manages ReplicaSets and rolling updates. Declares desired state.

\`\`\`yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: my-app
spec:
  replicas: 3
  selector:
    matchLabels:
      app: my-app
  template:
    metadata:
      labels:
        app: my-app
    spec:
      containers:
        - name: app
          image: myapp:latest
          ports:
            - containerPort: 3000
\`\`\`

### Service

Exposes pods via a stable network endpoint. Types: ClusterIP, NodePort, LoadBalancer.

\`\`\`yaml
apiVersion: v1
kind: Service
metadata:
  name: my-app
spec:
  selector:
    app: my-app
  ports:
    - port: 80
      targetPort: 3000
  type: LoadBalancer
\`\`\`

### Ingress

HTTP routing to services. One load balancer for multiple services.

## Essential Commands

\`\`\`bash
kubectl apply -f deployment.yaml
kubectl get pods
kubectl logs pod-name
kubectl exec -it pod-name -- sh
kubectl scale deployment my-app --replicas=5
\`\`\`

## Helm

Package manager for Kubernetes. Charts templatize manifests for reuse.

\`\`\`bash
helm install myapp ./mychart
helm upgrade myapp ./mychart
\`\`\`

Kubernetes is the standard for running containerized workloads in production.`,

  // —— ClawdBot ——
  '18-intro-clawdbot': `# What is ClawdBot & Prerequisites

**Stop asking AI questions. Start telling it to do things.**

ClawdBot is your personal AI assistant that actually takes action. Tell it to clear your inbox, draft emails, manage your calendar, check you in for flights — all from WhatsApp, Telegram, Discord, or any chat app you already use.

It runs 24/7 on your computer, remembers everything you tell it, and gets smarter the more you interact with it.

## Why ClawdBot?

- **It actually does things** — sends emails, manages tasks, takes notes, runs searches. Not just a chatbot.
- **Perfect memory** — remembers context 24/7.
- **Always available** — accessible from any messaging app.
- **Your data stays yours** — runs locally, not in the cloud.

## Prerequisites Checklist

| Requirement | Details |
|-------------|---------|
| Node.js | Version 22 or higher |
| OS | macOS, Linux, or Windows (WSL2) |
| AI Model | Anthropic Claude or OpenAI API key |
| Messaging | WhatsApp, Telegram, or Discord account |

## Check Node.js Version

\`\`\`bash
node --version
\`\`\`

Should show **v22** or higher. If not, download from [nodejs.org](https://nodejs.org).

## Get an API Key

- **Anthropic (Claude)**: [console.anthropic.com](https://console.anthropic.com/)
- **OpenAI**: [platform.openai.com](https://platform.openai.com/)`,

  '18-install-windows': `# Installation on Windows

**Windows users: WSL2 is required.** Native Windows is not supported.

## Step 1: Install WSL2

1. Open PowerShell as Administrator and run:

\`\`\`powershell
wsl --install
\`\`\`

2. Restart your computer when prompted.
3. Complete Ubuntu setup (create username and password).

## Step 2: Install Node.js in WSL

\`\`\`bash
# Update package list
sudo apt update

# Install Node.js 22
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt install -y nodejs

# Verify
node --version
\`\`\`

## Step 3: Install ClawdBot

\`\`\`bash
curl -fsSL https://clawd.bot/install.sh | bash
\`\`\`

Or via npm:

\`\`\`bash
npm install -g clawdbot@latest
\`\`\`

## Step 4: Verify Installation

\`\`\`bash
clawdbot --version
\`\`\`

You should see a version like \`2026.1.23\`.

## Linux systemd on WSL

If enabling lingering for background service:

\`\`\`bash
sudo loginctl enable-linger $USER
\`\`\``,

  '18-install-mac': `# Installation on macOS

## Method 1: Installer Script (Recommended)

\`\`\`bash
curl -fsSL https://clawd.bot/install.sh | bash
\`\`\`

This downloads the CLI, installs globally, and adds it to your PATH.

## Method 2: npm

\`\`\`bash
npm install -g clawdbot@latest
\`\`\`

## Method 3: pnpm

\`\`\`bash
pnpm add -g clawdbot@latest
\`\`\`

## Verify Installation

\`\`\`bash
clawdbot --version
\`\`\`

Expected: version like \`2026.1.23\`.

## Works on Intel and Apple Silicon

ClawdBot supports both Intel Macs and Apple Silicon (M1/M2/M3).`,

  '18-install-linux': `# Installation on Linux

## Method 1: Installer Script (Recommended)

\`\`\`bash
curl -fsSL https://clawd.bot/install.sh | bash
\`\`\`

## Update PATH (Debian/Ubuntu)

\`\`\`bash
export PATH="$HOME/.local/bin:$PATH"
\`\`\`

Add to \`~/.bashrc\` or \`~/.zshrc\` for persistence:

\`\`\`bash
echo 'export PATH="$HOME/.local/bin:$PATH"' >> ~/.bashrc
source ~/.bashrc
\`\`\`

## Method 2: npm

\`\`\`bash
npm install -g clawdbot@latest
\`\`\`

## Method 3: pnpm

\`\`\`bash
pnpm add -g clawdbot@latest
\`\`\`

## Verify

\`\`\`bash
clawdbot --version
\`\`\`

## Enable Lingering (Background Service)

For systemd user service to run after logout:

\`\`\`bash
sudo loginctl enable-linger $USER
\`\`\``,

  '18-first-steps': `# First Steps & Onboarding

## Run the Onboarding Wizard

\`\`\`bash
clawdbot onboard --install-daemon
\`\`\`

## What You'll Configure

### 1. AI Model & Authentication

Choose your provider:
- **Anthropic (Claude)** — API key from [console.anthropic.com](https://console.anthropic.com/)
- **OpenAI** — API key from [platform.openai.com](https://platform.openai.com/)

### 2. Messaging Providers

Select which to connect:
- WhatsApp — QR code scan
- Telegram — bot token
- Discord — bot token

### 3. Gateway

- **Local** (recommended) — runs on port 18789
- **Remote** — for VPS/server

### 4. Background Service

- **macOS** — launchd (starts on login)
- **Linux/WSL** — systemd (starts at boot)

## After Onboarding

Gateway starts automatically. Proceed to pair your first channel.

## Check Status

\`\`\`bash
clawdbot gateway status
clawdbot health
\`\`\``,

  '18-whatsapp-integration': `# WhatsApp Integration

**Easiest option:** QR code scan. No bot token needed.

## Step 1: Pair WhatsApp

\`\`\`bash
clawdbot channels login
\`\`\`

A QR code appears in your terminal.

## Step 2: Scan on Phone

1. Open WhatsApp on your phone
2. Go to **Settings** → **Linked Devices**
3. Tap **Link a Device**
4. Scan the QR code in the terminal

## Step 3: Wait for Confirmation

Terminal shows: **"WhatsApp session established"**

## Test

Send a message to your ClawdBot: **"Hello ClawdBot!"**

## Troubleshooting

- **QR won't scan?** Enlarge terminal window or screenshot the QR.
- **Invalid QR?** Ensure you're in Linked Devices, not regular scan.
- **Expired?** QR codes expire ~30 seconds. Run \`clawdbot channels login\` again.

## Useful Commands

\`\`\`bash
clawdbot channels login    # Re-pair if needed
clawdbot gateway status    # Check connection
clawdbot health            # Full health check
\`\`\``,

  '18-telegram-integration': `# Telegram Integration

Requires a Telegram bot token. More setup than WhatsApp, but reliable.

## Step 1: Create Telegram Bot

1. Open Telegram and search for **@BotFather**
2. Send: \`/start\`
3. Send: \`/newbot\`
4. Follow prompts (e.g., name: "MyClawd")
5. Copy the bot token (format: \`123456:ABC-DEF1234ghIkl-zyx57W2v1u123ew11\`)

## Step 2: Configure ClawdBot

\`\`\`bash
clawdbot configure
\`\`\`

Add your bot token when prompted. Or edit config manually:

\`\`\`json
{
  "channels": {
    "telegram": {
      "token": "YOUR_BOT_TOKEN"
    }
  }
}
\`\`\`

## Step 3: Test the Bot

1. Search for your bot in Telegram (the name you gave it)
2. Send: **"Hello!"**
3. Bot replies with a pairing code

## Step 4: Approve Pairing

\`\`\`bash
clawdbot pairing approve telegram <code>
\`\`\`

Replace \`<code>\` with the code from the bot.

## Verify

\`\`\`bash
clawdbot pairing list telegram
clawdbot gateway status
\`\`\`

## Commands Reference

\`\`\`bash
clawdbot configure                      # Add/edit config
clawdbot pairing list telegram          # List pending pairings
clawdbot pairing approve telegram <code> # Approve pairing
clawdbot gateway restart                # Restart gateway
\`\`\``,

  '18-discord-integration': `# Discord Integration

Requires a Discord bot token and server setup.

## Step 1: Create Discord Bot

1. Go to [Discord Developer Portal](https://discord.com/developers/applications)
2. Click **New Application**
3. Name it (e.g., "MyClawdBot")
4. Go to **Bot** → **Add Bot**
5. Copy the token under **TOKEN** (click "Reset Token" if needed)

## Step 2: Generate OAuth Invite URL

1. Go to **OAuth2** → **URL Generator**
2. Scopes: select \`bot\`
3. Permissions: **Send Messages**, **Read Message History**, **Read Messages/View Channels**
4. Copy the generated URL

## Step 3: Invite Bot to Server

1. Open the OAuth URL in your browser
2. Select your Discord server
3. Click **Authorize**

## Step 4: Configure ClawdBot

\`\`\`bash
clawdbot configure
\`\`\`

Add your Discord bot token. Or edit config:

\`\`\`json
{
  "channels": {
    "discord": {
      "token": "YOUR_DISCORD_BOT_TOKEN"
    }
  }
}
\`\`\`

## Step 5: Restart Gateway

\`\`\`bash
clawdbot gateway restart
\`\`\`

## Test

Send a message to your bot in Discord. Bot should respond.

## Commands

\`\`\`bash
clawdbot configure          # Add Discord token
clawdbot gateway restart    # Apply config
clawdbot gateway status     # Verify connection
\`\`\``,

  '18-slack-more': `# Slack & Other Integrations

ClawdBot supports additional messaging platforms.

## Slack Setup

1. Create a Slack app at [api.slack.com/apps](https://api.slack.com/apps)
2. Add **Bot** scope and permissions:
   - \`chat:write\`
   - \`channels:history\`, \`groups:history\`, \`im:history\`
3. Install app to workspace
4. Copy **Bot User OAuth Token** (starts with \`xoxb-\`)
5. Configure ClawdBot:

\`\`\`bash
clawdbot configure
\`\`\`

Add Slack token to config.

## iMessage (macOS Only)

- Requires native macOS integration
- Set during onboarding
- Limited to Apple ecosystem

## Config File Location

\`\`\`
~/.clawdbot/config.json
\`\`\`

Or OpenClaw:

\`\`\`
~/.openclaw/openclaw.json
\`\`\`

## Add Multiple Channels

You can connect WhatsApp, Telegram, Discord, and Slack simultaneously. Each channel is independent.

## Useful Commands

\`\`\`bash
clawdbot configure          # Add/edit channel configs
clawdbot gateway status     # See all connected channels
clawdbot channels login     # Re-pair WhatsApp
\`\`\``,

  '18-agent-automation': `# Agent Integrations & Automation Guide

ClawdBot can run agents, skills, and automations across your messaging channels.

## Activation Modes

\`\`\`
/activation always   # Always respond to messages
/activation manual   # Respond only when mentioned or commanded
\`\`\`

## Available Commands (in chat)

\`\`\`
/skills              # List available skills
/help                # Show commands
/activation always   # Always respond
/activation manual   # Manual mode
\`\`\`

## Gateway Management

\`\`\`bash
clawdbot gateway status     # Check status
clawdbot gateway restart    # Restart gateway
clawdbot gateway --port 18789 --verbose   # Run with debug
clawdbot health             # Full health check
\`\`\`

## Dashboard

Open in browser:

\`\`\`
http://127.0.0.1:18789/
\`\`\`

View status, manage agents, and monitor activity.

## Workspace & Config

- **Config**: \`~/.openclaw/openclaw.json\`
- **Workspace**: \`~/.openclaw/workspace\` (skills, prompts, memories)

Keep customization in these paths so updates don't overwrite them.

## Automation Ideas

- Auto-reply to common questions
- Draft emails from chat
- Manage calendar from WhatsApp
- Search the web on demand
- Run reminders and recurring tasks

## Skills

Add skills for web search, calendar, email, etc. Check docs for available skills:

\`\`\`
docs.clawd.bot
\`\`\``,

  '18-security-troubleshooting': `# Security & Troubleshooting

## Security Checklist

- Keep API keys private — never share or commit
- Enable gateway authentication on VPS
- Don't expose port 18789 to the internet
- Use strong, unique passwords
- Regenerate tokens if exposed

## Common Issues

### Onboarding Crashes

\`\`\`bash
clawdbot onboard --verbose
\`\`\`

Causes: Node.js < 22, corrupted config. Delete \`~/.clawdbot/config.json\` and retry.

### WhatsApp QR Won't Scan

- Use **Linked Devices** (not regular scan)
- Enlarge terminal or screenshot QR
- QR expires ~30s; run \`clawdbot channels login\` again

### Telegram Bot Doesn't Respond

\`\`\`bash
clawdbot pairing approve telegram <code>
clawdbot gateway restart
\`\`\`

### "Auth not configured"

\`\`\`bash
clawdbot onboard
# or
clawdbot configure --section auth
\`\`\`

### Port 18789 in Use

\`\`\`bash
lsof -i :18789
kill -9 <pid>
# or
clawdbot gateway --port 18790
\`\`\`

### View Logs

\`\`\`bash
clawdbot gateway --verbose
\`\`\`

macOS (launchd):

\`\`\`bash
log stream --predicate 'process == "clawdbot"' --level debug
\`\`\`

Linux (systemd):

\`\`\`bash
journalctl -u clawdbot-gateway -f
\`\`\`

## VPS Security Warning

If running on a VPS, never expose gateway ports without authentication. Enable auth and use firewalls.`,
};
