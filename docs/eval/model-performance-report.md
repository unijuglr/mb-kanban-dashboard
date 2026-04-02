# Model Bake-off Report
Generated on: 2026-04-01 23:01:30

## Performance Summary (Tokens/sec)

| Model | Avg TPS | Max TPS | Min TPS |
| :--- | :--- | :--- | :--- |
| llama3.2:latest | 178.51 | 180.82 | 176.43 |
| deepseek-coder-v2:16b | 146.65 | 150.49 | 143.87 |
| qwen2.5-coder:14b | 55.51 | 57.74 | 53.85 |

## Detailed Results

### llama3.2:latest
#### Logical Reasoning (Sally's Brothers)
- **TPS:** 178.30
- **Duration:** 9.83s
- **Response:** To find out how many sisters Sally has, we need to consider the information given about her brothers and their sisters. 

We know that each of Sally's 3 brothers has 2 sisters. Since Sally herself is ...
#### Python Generation (Fibonacci)
- **TPS:** 176.43
- **Duration:** 3.89s
- **Response:** **Fibonacci Number Calculation using Recursion in Python**

### Code

```python
def fibonacci(n):
    """
    Calculate the Nth Fibonacci number using recursion.

    Args:
    n (int): The position o...
#### Summarization
- **TPS:** 180.82
- **Duration:** 0.38s
- **Response:** The sentence "The quick brown fox jumps over the lazy dog" is a pangram, meaning it uses every letter of the alphabet, and is often used to test typing and keyboard accuracy....

### deepseek-coder-v2:16b
#### Logical Reasoning (Sally's Brothers)
- **TPS:** 145.58
- **Duration:** 31.44s
- **Response:**  To determine how many sisters Sally has, let's break down the information given:

1. Sally has 3 brothers.
2. Each of her brothers has 2 sisters.

Let's analyze this step by step:

- Sally has 3 brot...
#### Python Generation (Fibonacci)
- **TPS:** 143.87
- **Duration:** 4.67s
- **Response:**  To calculate the Nth Fibonacci number using recursion in Python, you can use the following function:

```python
def fibonacci(n):
    if n <= 0:
        return 0
    elif n == 1:
        return 1
   ...
#### Summarization
- **TPS:** 150.49
- **Duration:** 0.34s
- **Response:**  The text states that a sentence containing every letter of the alphabet is called a pangram and is often used for testing typewriters and computer keyboards....

### qwen2.5-coder:14b
#### Logical Reasoning (Sally's Brothers)
- **TPS:** 54.93
- **Duration:** 28.03s
- **Response:** Sally has 3 brothers, and each of these brothers has 2 sisters. Since Sally is one of those sisters, the other sister must be Sally's only sister. Therefore, Sally has 1 sister.

To explain further:

...
#### Python Generation (Fibonacci)
- **TPS:** 53.85
- **Duration:** 11.51s
- **Response:** To calculate the Nth Fibonacci number using recursion in Python, you can define a simple recursive function. The Fibonacci sequence is a series of numbers where each number is the sum of the two prece...
#### Summarization
- **TPS:** 57.74
- **Duration:** 0.96s
- **Response:** The sentence "The quick brown fox jumps over the lazy dog" is a pangram that uses every letter of the alphabet and is commonly used for testing typewriters and computer keyboards....
