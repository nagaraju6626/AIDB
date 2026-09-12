import sqlite3
conn = sqlite3.connect('test_users.db')
conn.execute('DROP TABLE IF EXISTS users')
conn.execute('CREATE TABLE users (id INTEGER PRIMARY KEY, email TEXT, is_active BOOLEAN)')
conn.execute("INSERT INTO users (email, is_active) VALUES ('alice@example.com', 1), ('bob@example.com', 0)")
conn.commit()
conn.close()
