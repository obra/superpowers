# Sandi Metz's Rules for Developers

These rules are heuristics for writing maintainable object-oriented code. They were popularized by Sandi Metz in her talks and books, particularly "Practical Object-Oriented Design in Ruby" (POODR).

## The Four Rules

### 1. Classes can be no longer than 100 lines of code

**Rationale:** Large classes are difficult to understand and maintain. They often have too many responsibilities and violate the Single Responsibility Principle.

**How to measure:**
- Count only lines of actual code (exclude blank lines and comments)
- Exclude the class definition line itself
- In Ruby, exclude `end` statements from the count

**Common violations:**
- God objects that do too much
- Classes that mix multiple concerns (e.g., business logic + presentation + persistence)
- Classes that haven't been properly decomposed

**Refactoring strategies:**
- Extract related methods into new classes
- Identify responsibilities and create separate classes for each
- Use composition over inheritance
- Consider the Strategy, Decorator, or Command patterns

### 2. Methods can be no longer than 5 lines of code

**Rationale:** Short methods are easier to understand, test, and reuse. They encourage good naming and clear intent.

**How to measure:**
- Count only lines of actual code (exclude blank lines and comments)
- Exclude the method definition line itself
- In Ruby, exclude `end` statements from the count

**Common violations:**
- Methods that do multiple things (violate Single Responsibility)
- Long conditional chains or case statements
- Complex loops with nested logic
- Methods with multiple levels of abstraction

**Refactoring strategies:**
- Extract sub-methods with descriptive names
- Replace conditional logic with polymorphism
- Use guard clauses to reduce nesting
- Extract temporary variables into well-named methods
- Apply the Composed Method pattern

**Example transformation:**

```ruby
# Before (7 lines)
def total_price
  base = items.sum(&:price)
  if premium_member?
    discount = base * 0.2
    base - discount
  else
    base
  end
end

# After (5 lines each)
def total_price
  base_price - member_discount
end

def base_price
  items.sum(&:price)
end

def member_discount
  premium_member? ? base_price * 0.2 : 0
end
```

### 3. Pass no more than 4 parameters into a method

**Rationale:** Many parameters indicate the method is doing too much or the parameters are related and should be grouped into an object.

**How to measure:**
- Count all explicit parameters
- Do not count block parameters (`&block`)
- In Ruby, count keyword arguments as individual parameters
- Optional parameters with defaults still count

**Common violations:**
- Methods that require configuration data
- Methods that pass through data from one layer to another
- Methods with boolean flags that change behavior
- Coordinate or related data passed separately (e.g., x, y, z)

**Refactoring strategies:**
- Introduce Parameter Object to group related parameters
- Use Builder pattern for complex object construction
- Replace parameter with method call (use instance variables)
- Consider if the method belongs in a different class
- Use Hash/Keyword arguments for options in Ruby (but still respect the 4 parameter limit)

**Example transformation:**

```ruby
# Before (5 parameters)
def create_user(name, email, age, city, country)
  # implementation
end

# After (2 parameters)
def create_user(personal_info, location)
  # implementation
end

# Where PersonalInfo and Location are simple data objects
```

### 4. Controllers can instantiate only one object

**Rationale:** Controllers should be thin and delegate to a single entry point, usually a service object or use case. This keeps business logic out of the controller layer.

**How to interpret:**
- A controller action should instantiate or call one object to perform its main work
- That object can instantiate or work with as many other objects as needed
- Querying to find an object (like `User.find(params[:id])`) doesn't count as instantiation
- Building response objects or view models after the main work is acceptable

**Common violations:**
- Controllers that orchestrate multiple service calls
- Business logic directly in controller actions
- Controllers that know too much about the domain layer
- Fat controllers that violate Single Responsibility

**Refactoring strategies:**
- Extract service objects or use cases
- Use the Command pattern for complex operations
- Create Facade objects that coordinate multiple operations
- Apply the Interactor or Operation patterns

**Example transformation:**

```ruby
# Before (multiple instantiations)
class OrdersController < ApplicationController
  def create
    order = Order.new(order_params)
    payment = PaymentProcessor.new(payment_params)
    inventory = InventoryManager.new

    if payment.process && inventory.reserve(order.items)
      order.save
      OrderMailer.new.send_confirmation(order)
      redirect_to order
    else
      render :new
    end
  end
end

# After (single instantiation)
class OrdersController < ApplicationController
  def create
    result = CreateOrder.new(order_params, payment_params).call

    if result.success?
      redirect_to result.order
    else
      @errors = result.errors
      render :new
    end
  end
end

# Business logic moved to CreateOrder service object
```

## Breaking the Rules

Sandi Metz has stated: "Break the rules only if you have a good reason or your pair lets you."

**When to consider breaking the rules:**
- Configuration files or data structures (e.g., routes files)
- Generated code or migrations
- Test files (though tests should still be readable)
- DSL definitions
- When following a rule would make the code less clear

**Important:** Even when breaking a rule, minimize the violation. If you need 6 lines in a method instead of 5, that's reasonable. If you need 20 lines, reconsider your approach.

## Application in Code Reviews

When reviewing code against these rules:

1. **Count accurately:** Use the specific counting rules for each metric
2. **Identify patterns:** Look for systemic issues, not just one-off violations
3. **Suggest specific refactorings:** Point to concrete patterns or techniques
4. **Consider the context:** Some violations are acceptable in specific situations
5. **Prioritize violations:** Large classes are usually more problematic than methods with 6 lines

## Tools and Automation

Consider using static analysis tools to enforce these rules:
- **RuboCop:** Can check method and class length (configure `Metrics/MethodLength`, `Metrics/ClassLength`, `Metrics/ParameterLists`)
- **Reek:** Detects code smells including long methods and large classes
- **flog/flay:** Measure complexity and duplication

## Related Concepts

These rules align with broader software design principles:

- **Single Responsibility Principle:** Each class/method should have one reason to change
- **Tell, Don't Ask:** Objects should tell other objects what to do, not query their state
- **Law of Demeter:** Only talk to your immediate friends
- **SOLID Principles:** Especially Single Responsibility and Dependency Inversion
- **Composed Method:** Methods at a single level of abstraction

## References

- Sandi Metz's talk: "Rules" at BaRuCo 2013
- Book: "Practical Object-Oriented Design in Ruby" (POODR) by Sandi Metz
- Book: "99 Bottles of OOP" by Sandi Metz and Katrina Owen
