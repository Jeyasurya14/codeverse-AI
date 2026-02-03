/**
 * Topic-specific learning content for each article.
 * Keys: "languageId-slug" (e.g. "1-intro-js", "2-lists-dicts").
 */
export const ARTICLE_CONTENT: Record<string, string> = {
  // —— JavaScript ——
  '1-intro-js': `JavaScript is the language of the web. It runs in browsers and on servers (Node.js), letting you build interactive pages and full-stack applications.

**Key points:**
- JavaScript is dynamically typed and runs line by line.
- You can run it in the browser console or in a .js file.
- Variables are declared with let, const, or (legacy) var.

\`\`\`javascript
// Your first program
console.log("Hello, World!");
const name = "CodeVerse";
let count = 0;
count = count + 1;
\`\`\`

Start by writing small scripts and using console.log to see results. Once you're comfortable, move on to variables and data types.`,

  '1-variables': `Variables hold values. In modern JavaScript you use let (reassignable) and const (constant reference). Types include numbers, strings, booleans, null, undefined, and objects.

**Key points:**
- Prefer const by default; use let when you need to reassign.
- Strings can use single quotes, double quotes, or backticks (template literals).
- typeof helps you inspect the type of a value at runtime.

\`\`\`javascript
const pi = 3.14;
let score = 0;
const message = \`Score: \${score}\`;
const isActive = true;
let empty = null;
console.log(typeof message); // "string"
\`\`\`

Understanding types will make debugging easier and prepare you for TypeScript later.`,

  '1-functions': `Functions bundle reusable logic. They create their own scope: variables declared inside are not visible outside. Parameters receive inputs; return sends a value back.

**Key points:**
- Function declarations are hoisted; function expressions are not.
- Scope is lexical: inner functions can access outer variables (closure).
- Avoid polluting the global scope; keep functions small and focused.

\`\`\`javascript
function greet(name) {
  const greeting = "Hello, " + name;
  return greeting;
}
const result = greet("Developer");
function counter() {
  let n = 0;
  return function () { return ++n; };
}
const next = counter();
console.log(next()); // 1
console.log(next()); // 2
\`\`\`

Practice writing pure functions (same inputs → same outputs) when you can.`,

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

  '1-arrays': `Arrays are ordered lists. They hold any types and have methods for adding, removing, and transforming elements. Indexes start at 0.

**Key points:**
- Use push/pop for the end, unshift/shift for the start.
- map, filter, and reduce are the core tools for transforming arrays.
- forEach runs a function per item but doesn't return a new array.

\`\`\`javascript
const nums = [1, 2, 3, 4, 5];
const doubled = nums.map(n => n * 2);
const evens = nums.filter(n => n % 2 === 0);
const sum = nums.reduce((acc, n) => acc + n, 0);
nums.push(6);
console.log(nums.length);
\`\`\`

Master map, filter, and reduce; they appear everywhere in modern JavaScript.`,

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

  '1-async-await': `Async operations (e.g. fetching data) don't block the main thread. Promises represent a future value; async/await lets you write asynchronous code in a linear style.

**Key points:**
- A Promise is pending, then fulfilled with a value or rejected with an error.
- await can only be used inside an async function.
- Always handle errors with try/catch around await or .catch on the promise.

\`\`\`javascript
async function fetchUser(id) {
  const res = await fetch(\`/api/users/\${id}\`);
  if (!res.ok) throw new Error("Failed to fetch");
  return res.json();
}
fetchUser(1).then(user => console.log(user)).catch(err => console.error(err));
\`\`\`

Use async/await for readability; understand Promises for debugging and interoperability.`,

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
  '2-intro-python': `Python is a general-purpose language known for clear syntax and readability. It's used in web development, data science, automation, and scripting.

**Key points:**
- Indentation defines blocks (no curly braces); use four spaces.
- Run code with python script.py or an interactive session (python or ipython).
- The standard library and PyPI offer modules for almost any task.

\`\`\`python
print("Hello, World!")
name = "CodeVerse"
print(f"Learning with {name}")
\`\`\`

Start with small scripts and the REPL. Focus on readability and consistency.`,

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
  '4-components-jsx': `React UIs are built from components: functions or classes that return a description of the UI. JSX is syntax that looks like HTML but compiles to React.createElement calls.

**Key points:**
- Components return a single root element (or Fragment); use PascalCase for components.
- JSX uses className and camelCase for event props (onClick, onChange).
- Expressions go in curly braces; never put objects in the body without spreading or rendering.

\`\`\`javascript
function Welcome({ name }) {
  return <h1>Hello, {name}!</h1>;
}
function App() {
  return (
    <div className="app">
      <Welcome name="CodeVerse" />
    </div>
  );
}
\`\`\`

Think in components: small, reusable pieces that receive data via props.`,

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
};
