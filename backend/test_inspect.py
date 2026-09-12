import sys
sys.path.append('.')
from sqlalchemy import create_engine, inspect, text
engine = create_engine('sqlite:///demo.db')
inspector = inspect(engine)
tables = inspector.get_table_names()
print(tables)
conn = engine.connect()
for t in tables:
    print(t, conn.execute(text('SELECT COUNT(*) FROM "' + t + '"')).scalar())
print(inspector.get_columns('students'))
print(inspector.get_foreign_keys('students'))
conn.close()
