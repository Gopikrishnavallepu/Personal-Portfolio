# Comprehensive Python DevOps Interview Question Bank (Parts 1–7)

This file contains an exhaustive list of interview questions organized by the Parts described in `PyOps/python_topcs.md`. Questions range from beginner to advanced and cover correctness, performance, security, design, and behavioral (STAR) prompts.

Use this as a study checklist or to create interview screens.

---

### Part 1 — Core Essentials (Printing, Variables, Types, Conversions, Math, Strings, Lists)

Fundamentals
- What does `print()` return? When should you use `print()` vs `logging` in production code?
- Explain dynamic typing in Python. Provide an example where dynamic typing simplifies code and an example where it causes bugs.
- List Python built-in data types and give one real-world use-case for each (int, float, str, bool, list, tuple, dict, set).
- Explain variable naming rules and best practices.

Type conversion and edge cases
- What happens when you call `int('12.3')`? How would you parse user input safely?
- How do you convert bytes to string and vice-versa? Explain encodings and common pitfalls.
- Compare `float` vs `decimal.Decimal`. When should you prefer `Decimal`?

Strings
- Why are Python strings immutable? What are the advantages?
- Show three string-formatting methods and why f-strings are preferred in modern Python.
- How do you search for a substring, split a string, and replace substrings? Discuss complexity where relevant.
- Given a configuration line `DB_PASS=secret;DB_USER=admin`, how would you mask the password safely for logs?

Lists and operations
- Explain slicing `start:stop:step` and negative indices.
- How does `list.append` compare with `list.extend` and `list +=` in terms of behavior and performance?
- Complexity of `list.insert(0, x)` and alternatives for queue-like behavior.
- How to remove duplicates while preserving order from a list? Provide code and complexity analysis.

Debugging & pitfalls
- A function sometimes receives `None`. How would you defensively program to avoid `AttributeError` in string operations?
- How to debug a `TypeError` caused by mixing strings and integers in concatenation? Show safe approaches.

Behavioral / STAR
- Describe a time you used string processing to fix a production issue. (S/T/A/R: mention functions used, edge-cases handled, outcome.)

---

### Part 2 — Intermediate Python (Tuples, Sets, Dicts, Control Flow, Loops, Comprehensions)

Collections & behavior
- Explain differences between list, tuple, set, and dict. When would you pick each in production code?
- Why are tuples hashable but lists are not? Explain with memory and mutability reasons.
- Discuss set operations (union, intersection, difference) and typical use-cases.

Dictionaries & hashing
- How are Python dicts implemented? Explain average-case complexity for lookup/insert/delete.
- What is a hash collision and how does Python mitigate collision attacks?
- Explain usage of `dict.get()`, `setdefault()`, and `collections.defaultdict` with examples.

Control flow and loops
- Explain short-circuit evaluation in `and`/`or` with side-effect examples.
- When to use `for` vs `while` loops? Provide examples.
- Show code using `enumerate()`, `zip()`, and `reversed()`; explain when these make code safer and more readable.

Comprehensions & iterators
- Write a list comprehension to create squares from 0..9 and a generator equivalent; discuss memory trade-offs.
- Implement a custom iterator class and explain `__iter__` and `__next__`.
- What is the iterator protocol and how do `for` loops use it internally?

Edge-cases and patterns
- Why is mutating a list while iterating over it dangerous? Show three safe alternatives.

Design interview
- Implement `most_common_words(log_lines, n)` that streams through a large log file and returns top-n words. Discuss memory limits and approaches (heap, counting, external sort).

---

### Part 3 — Functions & Advanced Concepts (*args, **kwargs, Lambdas, Decorators, Generators, Closures, Recursion, Async)

Function signatures & arguments
- Explain positional, keyword, default, keyword-only parameters. Give examples and use-cases.
- What do `*args` and `**kwargs` do? Demonstrate argument unpacking into a function call.

Lambda & functional tools
- When is `lambda` appropriate? Show sorting hosts by numeric suffix using `key=` with lambda.
- Compare `map`/`filter`/`reduce` with list comprehensions. When are each preferred?

Decorators
- Explain decorator syntax and implement a simple `@timer` decorator that measures runtime.
- Why use `functools.wraps`? Show an example where metadata is lost and how `wraps` fixes it.
- Implement a parameterized decorator `@retry(times=3, delay=0.1)` and discuss testing strategy.

Generators & yield
- Explain generators and memory benefits. Write a generator that reads a file and yields JSON objects one per line.
- Explain `yield from` and when to use it.

Closures & nonlocal
- Explain closures with `nonlocal`. Show a counter factory `make_counter()` with `nonlocal`.
- What are closure pitfalls (e.g., late binding in loop-created lambdas)? How to avoid them?

Recursion
- Show a recursive tree traversal and discuss recursion depth limits in Python; discuss converting recursion to iterative solution.

Async
- Explain `async`/`await`, event loop, tasks, and coroutines. Show `asyncio.create_task` vs `await`.
- How to run blocking code without blocking the loop? Demonstrate `run_in_executor` and `asyncio.to_thread`.
- Show how to cancel a coroutine and explain `CancelledError` handling and graceful cleanup.

Advanced prompts
- Implement a `retry` decorator that works for sync and async functions; include exponential backoff and jitter.
- Design a thread-safe memoization decorator; discuss memory usage and eviction strategies.

---

### Part 4 — OOP in Python (Classes, Inheritance, Encapsulation, Polymorphism, Abstract, Dataclasses)

Core OOP
- Describe how to define a class in Python and how to instantiate it. Explain `self` and `__init__`.
- What is the difference between `__repr__` and `__str__`? When to implement each.

Class vs instance attributes
- Explain class attributes, instance attributes, and show a bug caused by a mutable class attribute. How to fix it?

Inheritance & MRO
- Explain the MRO in multiple inheritance and how `super()` works. Provide a cooperative multiple inheritance example.
- When is multiple inheritance useful vs composition?

Encapsulation & properties
- Show how to use `@property` to create read-only or validated attributes.

Abstract base classes & interfaces
- Explain `abc.ABC` and defining abstract methods. When to use ABC instead of duck typing?

Dataclasses & typing
- What does `@dataclass` do? Show frozen dataclass example and pros/cons for immutability.

Design interview
- Design a `Deployment` class (attributes: name, replicas, image) that validates inputs and supports a thread-safe `scale(delta)` method. Provide tests and explain locking strategy.

---

### Part 5 — Exception Handling & File I/O

Errors & exceptions
- Show `try/except/else/finally` and explain when `else` executes.
- Why is catching `Exception` too broad? Why avoid bare `except:`? Which exceptions commonly should you catch?
- How to attach additional context to exceptions (raise ... from ...) and why it helps debugging?

Custom exceptions
- How to design a custom exception hierarchy for a library? Show example with `MyLibError` base class and several derived exceptions.

File I/O
- Show robust file reading (with encoding and error handling) and writing. Why use `with` and how does it ensure resource cleanup?
- How to process very large files with minimal memory (line-by-line generator, `mmap`), and pros/cons of each.

OS & security
- Use `pathlib` examples. Explain cross-platform path handling and why `pathlib` is recommended.
- How to safely handle secrets in CI, Docker images, and local development? Discuss environment variables, secret managers, and IAM roles.

Practical scenario
- Write a log-rotator that compresses logs older than N days. Discuss atomic moves, concurrency, and failure recovery.

---

### Part 6 — Modules, Packages & Imports

Import mechanics
- Explain how Python resolves `import foo` (sys.path, module cache). What is `sys.modules` and why does it matter?
- Absolute vs relative imports — demonstrate `from . import module` and explain when relative imports fail.

Packaging
- What is `pyproject.toml` and how does it relate to PEP 517/518? What fields are needed to build a basic package?
- How to create an editable install for local development? Explain `pip install -e .`.

Advanced topics
- What are namespace packages? When are they useful?
- Explain circular imports, how they occur, and strategies to break them (defer imports, design changes).

Interview design
- Propose a package layout for a CLI tool with reusable library modules and tests; include `setup.cfg`/`pyproject.toml` highlights and test discovery tips.

---

### Part 7 — DevOps Python Applications (Requests, Boto3, Subprocess, Log parsing, IaC)

HTTP & APIs
- How to handle paginated APIs and rate limits. Show code that automatically follows `next` links and backs off on 429 responses.
- Compare `requests` and async clients like `aiohttp`/`httpx`. When does each make sense?

Cloud SDKs & secrets
- Secure ways to supply AWS credentials: IAM roles, environment variables, instance profiles, passthrough via secrets manager. Show a small boto3 example listing S3 buckets.
- Explain difference between `boto3.client` and `boto3.resource`.

Subprocess & automation
- How to run a command and stream logs to your program output in real time? Show `subprocess.Popen` usage with non-blocking read.
- How to avoid shell injection when calling external commands with user input? Why avoid `shell=True`?

Log parsing & scaling
- Write a robust parser that extracts timestamps and error levels from heterogeneous log lines. Discuss timezone handling and performance when parsing millions of lines.
- How to scale log ingestion and aggregation? (message brokers, batching, backpressure)

IaC & templating
- Pros/cons of generating k8s manifests in Python vs Terraform/Helm. When is one approach preferable?
- How to keep secrets out of templates and inject them securely at deploy-time?

System-design interview
- Architect a system that ingests logs from thousands of servers, computes alert metrics, and supports real-time dashboards. Discuss components, scaling, reliability, and how Python fits into the pipeline.

---

## How to use this question bank
- Drill questions by part and time yourself for coding prompts (10–20 minutes per problem). Use whiteboard or a local scratch file for design questions.
- For behavioral STAR answers, prepare 2–3 concrete examples you can adjust to multiple keywords (async, decorators, generators, testing).
- Ask me to generate model answers or test cases for any specific coding question to practice verification.

---

If you want, I can now:
- Generate model answers and short code solutions for each question (one file per part).
- Produce a printable PDF of this bank.
- Build a randomized quiz runner (CLI or notebook) that shows a mix of questions for practice.

Which of these should I do next?
