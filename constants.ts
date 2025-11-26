
import { Language, ThemeKey, ExampleSnippet } from './types';

export const DEFAULT_PYTHON_CODE = `print("Hello, World!")`;

export const DEFAULT_CPP_CODE = `#include <iostream>
using namespace std;

int main() {
    cout << "Hello, World!" << endl;
    return 0;
}`;

export const SNIPPETS: Record<Language, string> = {
  [Language.PYTHON]: DEFAULT_PYTHON_CODE,
  [Language.CPP]: DEFAULT_CPP_CODE,
};

export const CPP_EXAMPLES: ExampleSnippet[] = [
  {
    name: "Hello World",
    language: Language.CPP,
    code: `#include <iostream>
using namespace std;

int main() {
    cout << "Hello, World!" << endl;
    return 0;
}`
  },
  {
    name: "Data Types",
    language: Language.CPP,
    code: `#include <iostream>
using namespace std;

int main() {
    int a = 10;
    long long b = 123456789012345LL;
    double c = 3.14159;
    char d = 'A';
    bool e = true;

    cout << "int: " << a << endl;
    cout << "long long: " << b << endl;
    cout << "double: " << c << endl;
    cout << "char: " << d << endl;
    cout << "bool: " << e << endl;

    return 0;
}`
  },
  {
    name: "If-Else Statements",
    language: Language.CPP,
    code: `#include <iostream>
using namespace std;

int main() {
    int score;
    cout << "Enter score (0-100): ";
    cin >> score;

    if (score >= 90) {
        cout << "Grade: A" << endl;
    } else if (score >= 60) {
        cout << "Grade: Pass" << endl;
    } else {
        cout << "Grade: Fail" << endl;
    }

    return 0;
}`
  },
  {
    name: "Switch Statements",
    language: Language.CPP,
    code: `#include <iostream>
using namespace std;

int main() {
    char grade;
    cout << "Enter grade (A/B/C/D/F): ";
    cin >> grade;

    switch (grade) {
        case 'A':
            cout << "Excellent!" << endl;
            break;
        case 'B':
        case 'C':
            cout << "Well done" << endl;
            break;
        case 'D':
            cout << "You passed" << endl;
            break;
        case 'F':
            cout << "Better try again" << endl;
            break;
        default:
            cout << "Invalid grade" << endl;
    }

    return 0;
}`
  },
  {
    name: "While / Do-While Loops",
    language: Language.CPP,
    code: `#include <iostream>
using namespace std;

int main() {
    int i = 1;
    cout << "While Loop:" << endl;
    while (i <= 5) {
        cout << i << " ";
        i++;
    }
    cout << endl;

    int j = 1;
    cout << "Do-While Loop:" << endl;
    do {
        cout << j << " ";
        j++;
    } while (j <= 5);
    cout << endl;

    return 0;
}`
  },
  {
    name: "For Loops & Nested",
    language: Language.CPP,
    code: `#include <iostream>
using namespace std;

int main() {
    cout << "Multiplication Table:" << endl;
    for (int i = 1; i <= 9; i++) {
        for (int j = 1; j <= i; j++) {
            cout << j << "*" << i << "=" << i*j << "\\t";
        }
        cout << endl;
    }
    return 0;
}`
  },
  {
    name: "Arrays (1D & 2D)",
    language: Language.CPP,
    code: `#include <iostream>
using namespace std;

int main() {
    // 1D Array
    int arr[5] = {1, 2, 3, 4, 5};
    cout << "1D Array: ";
    for(int i=0; i<5; i++) cout << arr[i] << " ";
    cout << endl;

    // 2D Array
    int matrix[2][3] = {{1, 2, 3}, {4, 5, 6}};
    cout << "2D Array:" << endl;
    for(int i=0; i<2; i++) {
        for(int j=0; j<3; j++) {
            cout << matrix[i][j] << " ";
        }
        cout << endl;
    }
    return 0;
}`
  },
  {
    name: "C-style Strings",
    language: Language.CPP,
    code: `#include <iostream>
#include <cstring>
using namespace std;

int main() {
    char str1[20] = "Hello";
    char str2[] = "World";

    strcat(str1, " ");
    strcat(str1, str2);

    cout << "Concatenated: " << str1 << endl;
    cout << "Length: " << strlen(str1) << endl;

    return 0;
}`
  },
  {
    name: "Functions",
    language: Language.CPP,
    code: `#include <iostream>
using namespace std;

// Function declaration
int add(int a, int b);
void greet(string name = "Guest"); // Default parameter

int main() {
    int sum = add(5, 3);
    cout << "Sum: " << sum << endl;

    greet("Alice");
    greet();

    return 0;
}

// Function definition
int add(int a, int b) {
    return a + b;
}

void greet(string name) {
    cout << "Hello, " << name << "!" << endl;
}`
  },
  {
    name: "Structures",
    language: Language.CPP,
    code: `#include <iostream>
using namespace std;

struct Student {
    string name;
    int age;
    double score;
};

int main() {
    Student s1;
    s1.name = "Tom";
    s1.age = 18;
    s1.score = 95.5;

    cout << "Name: " << s1.name << endl;
    cout << "Age: " << s1.age << endl;
    cout << "Score: " << s1.score << endl;

    return 0;
}`
  },
  {
    name: "Classes",
    language: Language.CPP,
    code: `#include <iostream>
using namespace std;

class Rectangle {
private:
    int width, height;

public:
    Rectangle(int w, int h) {
        width = w;
        height = h;
    }

    int area() {
        return width * height;
    }
};

int main() {
    Rectangle rect(10, 5);
    cout << "Area: " << rect.area() << endl;
    return 0;
}`
  }
];

export const PYTHON_EXAMPLES: ExampleSnippet[] = [
  {
    name: "Hello World",
    language: Language.PYTHON,
    code: `print("Hello, World!")`
  },
  {
    name: "Basic Arithmetic",
    language: Language.PYTHON,
    code: `a = 10
b = 3

print(f"Addition: {a} + {b} = {a + b}")
print(f"Subtraction: {a} - {b} = {a - b}")
print(f"Multiplication: {a} * {b} = {a * b}")
print(f"Division: {a} / {b} = {a / b}")
print(f"Integer Division: {a} // {b} = {a // b}")
print(f"Modulus: {a} % {b} = {a % b}")
print(f"Power: {a} ** {b} = {a ** b}")`
  },
  {
    name: "If-Elif-Else",
    language: Language.PYTHON,
    code: `score = int(input("Enter score (0-100): "))

if score >= 90:
    print("Grade: A")
elif score >= 60:
    print("Grade: Pass")
else:
    print("Grade: Fail")`
  },
  {
    name: "Loops (For & While)",
    language: Language.PYTHON,
    code: `print("For Loop (Range):")
for i in range(1, 6):
    print(i, end=" ")
print()

print("\\nWhile Loop:")
count = 1
while count <= 5:
    print(count, end=" ")
    count += 1
print()`
  },
  {
    name: "Lists (Arrays)",
    language: Language.PYTHON,
    code: `fruits = ["apple", "banana", "cherry"]

print(f"Original: {fruits}")

# Access
print(f"First: {fruits[0]}")

# Modify
fruits[1] = "blueberry"
print(f"Modified: {fruits}")

# Append
fruits.append("date")
print(f"Appended: {fruits}")

# Loop
print("Iterating:")
for fruit in fruits:
    print(f"- {fruit}")`
  },
  {
    name: "Dictionaries (Maps)",
    language: Language.PYTHON,
    code: `student = {
    "name": "Alice",
    "age": 20,
    "major": "Computer Science"
}

print(f"Name: {student['name']}")
print(f"Age: {student['age']}")

# Add new key
student["gpa"] = 3.8
print(f"Updated: {student}")

# Loop through keys and values
for key, value in student.items():
    print(f"{key}: {value}")`
  },
  {
    name: "String Operations",
    language: Language.PYTHON,
    code: `text = " Python Programming "

print(f"Original: '{text}'")
print(f"Stripped: '{text.strip()}'")
print(f"Lower: '{text.lower()}'")
print(f"Upper: '{text.upper()}'")
print(f"Replace: '{text.replace('Python', 'Java')}'")
print(f"Split: {text.split()}")`
  },
  {
    name: "Functions",
    language: Language.PYTHON,
    code: `def greet(name="Guest"):
    return f"Hello, {name}!"

def add(a, b):
    return a + b

print(greet("Bob"))
print(greet())

result = add(5, 7)
print(f"5 + 7 = {result}")`
  },
  {
    name: "Exception Handling",
    language: Language.PYTHON,
    code: `try:
    num = int(input("Enter a number: "))
    result = 10 / num
    print(f"10 / {num} = {result}")
except ValueError:
    print("Error: Please enter a valid integer.")
except ZeroDivisionError:
    print("Error: Cannot divide by zero.")
finally:
    print("Execution complete.")`
  },
  {
    name: "Classes",
    language: Language.PYTHON,
    code: `class Dog:
    def __init__(self, name, breed):
        self.name = name
        self.breed = breed

    def bark(self):
        return f"{self.name} says Woof!"

dog1 = Dog("Buddy", "Golden Retriever")
dog2 = Dog("Rex", "German Shepherd")

print(dog1.bark())
print(f"{dog2.name} is a {dog2.breed}")`
  }
];

// Theme Definitions using RGB triplets for CSS Variables
export const THEMES: Record<ThemeKey, any> = {
  warm: {
    name: 'Warm (Default)',
    isDark: true,
    colors: {
      '--bg-app': '40 40 40',        // Gruvbox Dark Bg #282828
      '--bg-panel': '60 56 54',      // Gruvbox Surface #3c3836
      '--color-primary': '215 153 33', // Gruvbox Yellow #d79921
      '--color-secondary': '168 153 132', // Gruvbox Fg4 #a89984
      '--color-accent': '204 36 29',   // Gruvbox Red #cc241d
      '--color-success': '152 151 26', // Gruvbox Green #98971a
      '--color-error': '251 73 52',    // Gruvbox Red Bright #fb4934
      '--color-border': '80 73 69',    // Gruvbox Bg2 #504945
      '--color-text': '235 219 178',   // Gruvbox Fg #ebdbb2
    },
    monaco: {
      base: 'vs-dark',
      inherit: true,
      rules: [
        { token: 'keyword', foreground: 'fb4934' },
        { token: 'string', foreground: 'b8bb26' },
        { token: 'comment', foreground: '928374', fontStyle: 'italic' },
        { token: 'number', foreground: 'd3869b' },
        { token: 'type', foreground: 'fabd2f' },
      ],
      colors: {
        'editor.background': '#3c3836',
        'editor.foreground': '#ebdbb2',
        'editor.lineHighlightBackground': '#504945',
        'editorCursor.foreground': '#ebdbb2',
        'editorIndentGuide.background': '#504945',
      }
    }
  },
  cold: {
    name: 'Cold (Nord)',
    isDark: true,
    colors: {
      '--bg-app': '46 52 64',        // Nord 0 #2e3440
      '--bg-panel': '59 66 82',      // Nord 1 #3b4252
      '--color-primary': '136 192 208', // Nord 8 #88c0d0
      '--color-secondary': '129 161 193', // Nord 9 #81a1c1
      '--color-accent': '191 97 106',   // Nord 11 #bf616a
      '--color-success': '163 190 140', // Nord 14 #a3be8c
      '--color-error': '208 135 112',   // Nord 12 #d08770
      '--color-border': '76 86 106',    // Nord 3 #4c566a
      '--color-text': '236 239 244',    // Nord 6 #eceff4
    },
    monaco: {
      base: 'vs-dark',
      inherit: true,
      rules: [
        { token: 'keyword', foreground: '81a1c1' },
        { token: 'string', foreground: 'a3be8c' },
        { token: 'comment', foreground: '616e88', fontStyle: 'italic' },
        { token: 'number', foreground: 'b48ead' },
        { token: 'type', foreground: '8fbcbb' },
      ],
      colors: {
        'editor.background': '#3b4252',
        'editor.foreground': '#eceff4',
        'editor.lineHighlightBackground': '#434c5e',
        'editorCursor.foreground': '#d8dee9',
      }
    }
  },
  dark: {
    name: 'Dark (Slate)',
    isDark: true,
    colors: {
      '--bg-app': '15 23 42',        // Slate 900
      '--bg-panel': '30 41 59',      // Slate 800
      '--color-primary': '56 189 248', // Sky 400
      '--color-secondary': '148 163 184', // Slate 400
      '--color-accent': '244 63 94',   // Rose 500
      '--color-success': '74 222 128', // Green 400
      '--color-error': '248 113 113',  // Red 400
      '--color-border': '51 65 85',    // Slate 700
      '--color-text': '248 250 252',   // Slate 50
    },
    monaco: {
      base: 'vs-dark',
      inherit: true,
      rules: [
        { token: 'comment', foreground: '6272a4', fontStyle: 'italic' },
        { token: 'keyword', foreground: 'ff79c6' },
        { token: 'string', foreground: 'f1fa8c' },
      ],
      colors: {
        'editor.background': '#1e293b',
        'editor.lineHighlightBackground': '#334155',
      }
    }
  },
  light: {
    name: 'Light (Clean)',
    isDark: false,
    colors: {
      '--bg-app': '249 250 251',     // Gray 50
      '--bg-panel': '255 255 255',   // White
      '--color-primary': '15 23 42', // Slate 900 (High contrast)
      '--color-secondary': '107 114 128', // Gray 500
      '--color-accent': '239 68 68',   // Red 500
      '--color-success': '22 163 74',  // Green 600
      '--color-error': '220 38 38',    // Red 600
      '--color-border': '229 231 235', // Gray 200
      '--color-text': '17 24 39',      // Gray 900
    },
    monaco: {
      base: 'vs',
      inherit: true,
      rules: [],
      colors: {
        'editor.background': '#ffffff',
        'editor.lineHighlightBackground': '#f3f4f6',
      }
    }
  }
};
