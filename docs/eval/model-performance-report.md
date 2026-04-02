# Model Bake-off Report
Generated on: 2026-04-02 00:13:15

## Performance Summary (Tokens/sec)

| Model | Avg TPS | Max TPS | Min TPS |
| :--- | :--- | :--- | :--- |
| llama3.2:latest | 179.60 | 181.61 | 178.37 |
| deepseek-coder-v2:16b | 147.47 | 151.71 | 144.09 |
| qwen2.5-coder:14b | 57.37 | 58.02 | 56.26 |
| deepseek-r1:32b | 27.47 | 27.64 | 27.27 |

## Detailed Results

### llama3.2:latest
#### Logical Reasoning (Sally's Brothers)
- **TPS:** 178.83
- **Duration:** 2.87s
- **Response:** To solve this problem, let's break it down step by step.

We know that Sally has 3 brothers. Each of her brothers has 2 sisters. This means that the 2 sisters are Sally's sisters.

The phrase "each of...
#### Python Generation (Fibonacci)
- **TPS:** 178.37
- **Duration:** 1.43s
- **Response:** def fibonacci(n):
    """
    Calculate the Nth Fibonacci number using recursion.

    Args:
    n (int): The position of the Fibonacci number to calculate.

    Returns:
    int: The Nth Fibonacci nu...
#### Summarization
- **TPS:** 181.61
- **Duration:** 0.49s
- **Response:** The sentence "The quick brown fox jumps over the lazy dog" is a pangram, a phrase that uses every letter of the alphabet, often used for testing typing accuracy....

### deepseek-coder-v2:16b
#### Logical Reasoning (Sally's Brothers)
- **TPS:** 146.61
- **Duration:** 6.71s
- **Response:**  To determine how many sisters Sally has, let's follow a step-by-step reasoning process:

1. **Identify the number of brothers Sally has:**
   - Sally has 3 brothers.

2. **Determine the number of sis...
#### Python Generation (Fibonacci)
- **TPS:** 144.09
- **Duration:** 5.28s
- **Response:**  Certainly! The Fibonacci sequence is a series of numbers where each number is the sum of the two preceding ones, usually starting with 0 and 1. The sequence looks like this: 0, 1, 1, 2, 3, 5, 8, 13, ...
#### Summarization
- **TPS:** 151.71
- **Duration:** 0.53s
- **Response:**  The text describes a sentence that contains all the letters of the alphabet, which is used to test typewriters and computer keyboards for proper functionality....

### qwen2.5-coder:14b
#### Logical Reasoning (Sally's Brothers)
- **TPS:** 57.84
- **Duration:** 2.40s
- **Response:** Sally has 3 brothers, and each of these brothers has 2 sisters. Since Sally is one of those sisters, the other sister must be Sally's only sister. Therefore, Sally has 1 sister....
#### Python Generation (Fibonacci)
- **TPS:** 56.26
- **Duration:** 6.82s
- **Response:** Certainly! Below is a Python function that calculates the Nth Fibonacci number using a recursive approach:

```python
def fibonacci(n):
    if n <= 0:
        raise ValueError("Input should be a posit...
#### Summarization
- **TPS:** 58.02
- **Duration:** 1.02s
- **Response:** The quick brown fox jumps over the lazy dog, a pangram using every letter of the alphabet, is commonly used for testing typewriters and computer keyboards....

### deepseek-r1:32b
#### Logical Reasoning (Sally's Brothers)
- **TPS:** 27.64
- **Duration:** 12.87s
- **Response:** Let's analyze the problem step by step.

**Given:**
- Sally has **3 brothers**.
- Each brother has **2 sisters**.

**Step 1:** Identify the total number of sisters from the brothers' perspective.
- Si...
#### Python Generation (Fibonacci)
- **TPS:** 27.27
- **Duration:** 52.34s
- **Response:** To calculate the Nth Fibonacci number using recursion, we can define a function that calls itself with smaller values until it reaches the base cases. Here's the implementation:

```python
def fibonac...
#### Summarization
- **TPS:** 27.49
- **Duration:** 11.87s
- **Response:** The sentence "The quick brown fox jumps over the lazy dog" is a pangram that includes every letter of the alphabet and is commonly used to test typewriters and computer keyboards....
