# Model Bake-off Report
Generated on: 2026-04-01 23:45:31

## Performance Summary (Tokens/sec)

| Model | Avg TPS | Max TPS | Min TPS |
| :--- | :--- | :--- | :--- |
| llama3.2:latest | 91.40 | 96.38 | 88.48 |
| deepseek-coder-v2:16b | 64.19 | 65.38 | 63.35 |
| qwen2.5-coder:14b | 30.70 | 31.05 | 30.40 |
| deepseek-r1:32b | 27.35 | 27.56 | 26.99 |

## Detailed Results

### llama3.2:latest
#### Logical Reasoning (Sally's Brothers)
- **TPS:** 89.34
- **Duration:** 2.58s
- **Response:** Let's break it down:

Sally has 3 brothers.

Each of her brothers has 2 sisters. This means that there are 2 sisters for each brother, and since Sally has 3 brothers, there are 3 x 2 = 6 sisters in to...
#### Python Generation (Fibonacci)
- **TPS:** 88.48
- **Duration:** 1.70s
- **Response:** def fibonacci(n):
    # base cases
    if n == 0:
        return 0
    elif n == 1:
        return 1
    else:
        # recursive case
        return fibonacci(n-1) + fibonacci(n-2)

# example usage
...
#### Summarization
- **TPS:** 96.38
- **Duration:** 1.28s
- **Response:** The sentence "The quick brown fox jumps over the lazy dog" is a pangram, a sentence that uses every letter of the alphabet, and is commonly used for testing typing and keyboard functionality....

### deepseek-coder-v2:16b
#### Logical Reasoning (Sally's Brothers)
- **TPS:** 63.35
- **Duration:** 9.83s
- **Response:**  To determine how many sisters Sally has, we need to break down the information given and follow a logical reasoning process.

1. **Identify the number of brothers Sally has:**
   - Sally has 3 brothe...
#### Python Generation (Fibonacci)
- **TPS:** 63.84
- **Duration:** 12.29s
- **Response:**  Certainly! The Fibonacci sequence is a series of numbers where each number is the sum of the two preceding ones, usually starting with 0 and 1. The sequence starts as follows: 0, 1, 1, 2, 3, 5, 8, 13...
#### Summarization
- **TPS:** 65.38
- **Duration:** 1.51s
- **Response:**  A pangram is a sentence that uses every letter of the alphabet, like "The quick brown fox jumps over the lazy dog," which is often used for testing typewriters and computer keyboards....

### qwen2.5-coder:14b
#### Logical Reasoning (Sally's Brothers)
- **TPS:** 30.64
- **Duration:** 5.65s
- **Response:** Sally has 3 brothers, and each of these brothers has 2 sisters. Since Sally is one of the sisters, the other sister must be the only other sister they all share.

To break it down:
- Sally has 3 broth...
#### Python Generation (Fibonacci)
- **TPS:** 30.40
- **Duration:** 13.42s
- **Response:** Here's a Python function to calculate the Nth Fibonacci number using a recursive approach:

```python
def fibonacci(n):
    """
    Calculate the Nth Fibonacci number using recursion.
    
    Args:
 ...
#### Summarization
- **TPS:** 31.05
- **Duration:** 2.13s
- **Response:** The sentence "The quick brown fox jumps over the lazy dog" is a pangram that uses every letter of the alphabet and is commonly used for testing typewriters and computer keyboards....

### deepseek-r1:32b
#### Logical Reasoning (Sally's Brothers)
- **TPS:** 27.56
- **Duration:** 29.81s
- **Response:** To determine how many sisters Sally has, let's break down the information step by step.

1. **Sally's Brothers:**
   - Sally has **3 brothers**.

2. **Sisters According to Her Brothers:**
   - Each of...
#### Python Generation (Fibonacci)
- **TPS:** 26.99
- **Duration:** 100.05s
- **Response:** To solve this problem, we need to write a Python function to calculate the Nth Fibonacci number using recursion and explain its time complexity.

### Approach
The Fibonacci sequence is a series of num...
#### Summarization
- **TPS:** 27.51
- **Duration:** 11.26s
- **Response:** The sentence 'The quick brown fox jumps over the lazy dog' is a pangram that uses every letter of the alphabet and is commonly used to test typewriters and computer keyboards....
