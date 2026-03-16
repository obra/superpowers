The primary goal of OOD is to **reduce the cost of change** by ensuring code remains malleable in the face of uncertain future requirements.


## Tactical General Rules

1. Naming: Choose names that reflect business reality, not implementation. The names should be intuitive and simple English. They should reflect the business domain. Code should be read like domain experts talk about it. Use positive names (`active` not `not_deleted`).  Prefer custom errors for business rules. 
2. Embrace Ruby's expressiveness and metaprogramming features
3. Follow Ruby and Rails conventions and idioms
4. Idiomatic Ruby code following community conventions
5. Leverage Ruby 3.x capabilities including:
    - Pattern matching with `case/in`, `in` or the `=>` operator 
    - Endless methods for simple one-liners
    - Data objects for immutable value objects
    - Keyword arguments for clarity
    - Safe navigation operator (`&.`)
6. Use blocks, procs, and lambdas effectively
7. Create small well-named value objects instead of passing around hashes as return of a method
8. Aggressively limit the public methods. An object should expose only a small public surface, with a intuitive name and in the spirit of message passing. This makes objects easy to understand and limits coupling. 

### 1. Core Philosophy: Messaging and Distributed Process

To write effective Ruby, you must shift your perspective from domain objects (nouns) to the **messages** (verbs) passing between them. The heartbeat of an object-oriented (OO) application is the **message**, not the object itself

*   **The Biological Metaphor:** Think of objects like biological cells or computers on a network that can only communicate via messages while hiding their internal state.
  
*   **The Reactive Principle:** Every component should be able to present itself meaningfully for observation and manipulation.
  
*   **Behavior over Data:** Depend on what an object *does* rather than what it *is*.
  
*   **Distributed Process:** Avoid "centralizing process in a paradigm that expects process to be distributed". In high-quality OO, process is not centrally defined but "emerges through objects talking to objects".

*   **Trust over Control:** Public interfaces should ask for "what" the sender wants instead of telling the receiver "how" to behave.
  
* **Late Binding:** Embrace "extreme late-binding of all things," allowing objects to hide their internal "state-process" from the world.

### 2. Judging Code Quality: The TRUE Heuristic

Evaluate every class and method against the **TRUE** criteria to ensure it can tolerate change:
*  **Transparent:** "The consequences of change should be obvious in the code that is changing and in distant code that relies upon it" [Sandi Metz]
* **Reasonable:** "The cost of any change should be proportional to the benefits the change achieves". [Sandi Metz]
*  **Usable:** "Existing code should be usable in new and unexpected contexts" [Sandi Metz]
*  **Exemplary:** "The code itself should encourage those who change it to perpetuate these qualities".[Sandi Metz]

### 3. Cohesion and Single Responsibility

A class is **cohesive** if everything in it shares one single idea and does not mix incidental details with essential points.

- **The Story Metaphor:** Treat a file like a chapter in a book; it is most understandable when it sticks to one topic.
- **The One-Sentence Rule:** If a class description requires the word "and" or "or," the class likely has too many responsibilities.
- **Incidental Details:** Move gory calculation details or caching logic into new objects (POROs) or **Mixins** to keep the primary object focused on its essential story.
- **Avoid "Christmas Trees":** Resist the urge to hang unrelated methods onto objects like "ornaments on a Christmas tree".

### 4. Tactical Coding Rules

Follow these specific patterns to keep methods and classes focused and readable:
*   **Composed Method:** Divide programs into methods that perform one identifiable task at the same level of abstraction, typically only a few lines long.
*   **Intention-Revealing Selectors:** Name methods after what they accomplish (intent) rather than how they do it (implementation).
*   **Keyword Arguments:** Favor keyword arguments over positional ones to remove dependencies on argument order and provide explicit documentation.
*   **Direct Access Avoidance:** Wrap instance variables in accessor methods (getters/setters) to isolate knowledge of data representation.
*   **Indirect Variable Access:** "Hide the variables, even from the class that defines them, by wrapping them in methods". "Access and set its value only through a Getting Method and Setting Method". [Kent Beck]

### 5. Relationship Management

- **Favor Composition Over Inheritance:** "Composition contains far fewer built-in dependencies than inheritance; it is very often the best choice". Use inheritance only for "is-a" relationships where a subclass is a "specialization" of its superclass.
- **Law of Demeter:** "Only talk to your immediate neighbors". Avoid "train wrecks" like `object.provider.service.execute`. Messages should only be sent to "objects that are passed in as arguments," "objects that are directly available to self," or "objects created by" the current method.
- **Tell, Don't Ask:** Avoid "asking lots of information back and forth between the object" and instead simply "tell the object to go and do the thing".

### 6. Dependency Management

Design is the art of arranging dependencies so that objects can tolerate change.

- **Dependency Injection:** Pass collaborators into an object rather than hard-coding class names to make the object "smarter because it knows less".
- **Stability Rule:** Depend on things that change less often than you do.
- **Duck Typing:** Type is defined by what an object **does**, not what it **is**. Use duck types to replace costly class dependencies with forgiving message dependencies.
### 7. Structural Design Principles (SOLID)

* **Single Responsibility Principle (SRP):** A class should do the smallest possible useful thing. If you cannot describe a class in one sentence without using "and" or "or," it likely has too many responsibilities.
* **Open/Closed Principle:** Code should be open for extension but closed for modification. When a new requirement arrives, first refactor the code to be **open** to the change, then make the **easy change**.
* **Liskov Substitution Principle (LSP):** Subtypes must be substitutable for their supertypes; receivers have a contract with senders to return trustworthy, consistent objects.
* **Dependency Inversion (DIP):** Depend on abstractions (roles) rather than concretions (class names). Inject dependencies rather than hard-coding class names inside methods.

### 8. Effective Testing Strategy
Tests should be the "wall at your back" that allows you to refactor with confidence.
* **Test Public Interfaces:** "Incoming messages should be tested for the state they return. Outgoing command messages should be tested to ensure they get sent. Outgoing query messages should not be tested".
* **Ignore Private Methods:** Test private methods only indirectly through the public API to avoid tight coupling between tests and unstable implementation details.
* **Role Verification:** When using Duck Types or Fakes in tests, use shared test modules to programmatically verify that all players of a role honor the required API.

## 9. Naming

Naming should prioritize **human communication**, **domain clarity**, and **future flexibility**

General Philosophy

- **Write for Readers:** Code is read many more times than it is written; names are your "biggest billboard" for communicating your design intentions to future maintainers.
- **Reveal Intent:** The primary purpose of a name is to clarify the "why" and "what" rather than the "how".
- **Name for Meaning:** Avoid naming things after what they do right now; name them after what they mean in the context of the domain.
- **Domain Experts Talk**:  Naming should reflect the business domain. Code should be read like domain experts talk about the problem that the code is trying to solve. 

Method Naming (Selectors)

- **Intention-Revealing Selectors:** Name methods after what they **accomplish** (intent) instead of how they are implemented. For example, use `includes?` instead of `linear_search`.
- **Level of Abstraction:** A method name should be **one level of abstraction higher** than its implementation. Use `beverage` instead of `beer` to isolate code from specific implementation details when needed. 
- **Query Methods:** Methods that test properties and return Booleans should be predicates and end with `?`. Examples: Do not use `is_active`. Use `active?` 
- **Consistency over Creativity:** For common parameters (like those in enumeration blocks), use consistent names like `each` so readers can parse the structure instantly. Example: `products.each { |product| product.compact! }`. You can use `it` or named parameters if that makes the code read better. Eg: `product.each { it.compact! }`

**Variable Naming**

- **Role over Type:** Name both instance and temporary variables after the **role they play** in the computation rather than their class or data type.
- **Plurality:** Make a variable name **plural** if it is intended to hold a collection.
- **Greppability:** Using meaningful names for domain concepts (especially in `Data` objects) makes the codebase easier to search and refactor.

**Class Naming**

- **Simple Superclasses:** Use a **single word** that conveys the purpose of the design for the root of an inheritance hierarchy (e.g., `Number`, `Collection`).
- **Qualified Subclasses:** Name subclasses by **prepending an adjective** to the superclass name to indicate how they are different while maintaining the parent's identity (e.g., `LargeInteger`, `SortedCollection`).
- **Avoid Pattern Names:** Do not include design pattern names in class names (e.g., avoid `NumberDecorator`); instead, name the class after the **domain concept** it represents (e.g., `BottleNumber`).
- **Duck Types/Roles:** Name roles according to the behavior they share across classes, such as `Preparer` or `Schedulable`.

**Tactical Rules**

- **Avoid Abbreviations:** Abbreviations prioritize typing speed over reading speed and force the reader to perform a two-step mental translation.
- **Keyword Arguments:** Favor naming arguments with keywords to provide **explicit documentation** at both the sender and receiver ends of a message.
- **Use Signals:** Leverage conventions (like using prime numbers in tests to signal "arbitrary data") to communicate meaning without needing comments.
- **Data Objects:** Give structures a name (like a `Price` class) instead of using raw Hashes to improve "greppability" and clarify intent.
