import sqlite3
import os

def create_demo_database(db_path: str = "demo.db"):
    if os.path.exists(db_path):
        os.remove(db_path)

    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()

    # Create tables
    cursor.execute("""
        CREATE TABLE departments (
            id INTEGER PRIMARY KEY,
            name VARCHAR(100) NOT NULL
        )
    """)
    
    cursor.execute("""
        CREATE TABLE students (
            id INTEGER PRIMARY KEY,
            name VARCHAR(100) NOT NULL,
            department VARCHAR(50),
            age INTEGER,
            gender VARCHAR(20),
            cgpa DECIMAL(3, 2)
        )
    """)

    cursor.execute("""
        CREATE TABLE courses (
            id INTEGER PRIMARY KEY,
            course_name VARCHAR(100) NOT NULL,
            credits INTEGER
        )
    """)

    cursor.execute("""
        CREATE TABLE enrollments (
            student_id INTEGER,
            course_id INTEGER,
            grade VARCHAR(2),
            FOREIGN KEY(student_id) REFERENCES students(id),
            FOREIGN KEY(course_id) REFERENCES courses(id)
        )
    """)

    cursor.execute("""
        CREATE TABLE employees (
            id INTEGER PRIMARY KEY,
            name VARCHAR(100),
            department VARCHAR(50),
            salary DECIMAL(10, 2),
            joining_date DATE
        )
    """)

    cursor.execute("""
        CREATE TABLE sales (
            id INTEGER PRIMARY KEY,
            product VARCHAR(100),
            category VARCHAR(50),
            quantity INTEGER,
            price DECIMAL(10, 2),
            sale_date DATE
        )
    """)

    # Insert Data
    cursor.executemany("INSERT INTO departments (name) VALUES (?)", [('CSE',), ('ECE',), ('MECH',), ('CIVIL',)])
    
    students = [
        ('Arun', 'CSE', 20, 'M', 9.4),
        ('Priya', 'CSE', 21, 'F', 9.2),
        ('Rahul', 'CSE', 20, 'M', 9.0),
        ('Sneha', 'CSE', 22, 'F', 8.9),
        ('Kiran', 'CSE', 21, 'M', 8.7),
        ('John', 'ECE', 20, 'M', 8.5),
        ('Alice', 'MECH', 21, 'F', 7.8),
        ('Bob', 'CIVIL', 22, 'M', 7.5),
    ]
    cursor.executemany("INSERT INTO students (name, department, age, gender, cgpa) VALUES (?, ?, ?, ?, ?)", students)

    courses = [
        ('Artificial Intelligence', 4),
        ('Data Structures', 4),
        ('Thermodynamics', 3),
        ('Structural Engineering', 3)
    ]
    cursor.executemany("INSERT INTO courses (course_name, credits) VALUES (?, ?)", courses)

    employees = [
        ('Alice Manager', 'HR', 75000, '2020-01-15'),
        ('Bob Developer', 'IT', 85000, '2021-03-01'),
        ('Charlie Analyst', 'Finance', 60000, '2022-05-10'),
    ]
    cursor.executemany("INSERT INTO employees (name, department, salary, joining_date) VALUES (?, ?, ?, ?)", employees)

    sales = [
        ('Laptop X', 'Electronics', 5, 1200.00, '2026-09-01'),
        ('Mouse Y', 'Accessories', 20, 25.00, '2026-09-02'),
        ('Desk Z', 'Furniture', 2, 300.00, '2026-09-05'),
    ]
    cursor.executemany("INSERT INTO sales (product, category, quantity, price, sale_date) VALUES (?, ?, ?, ?, ?)", sales)

    conn.commit()
    conn.close()
    print(f"Created demo database at {db_path}")

if __name__ == "__main__":
    create_demo_database()
