import psycopg2
from urllib.parse import urlparse

DATABASE_URL = "postgresql://postgres:Tanvi%40123@localhost:5432/hiresense"

def main():
    print("Connecting to database to add missing columns...")
    try:
        conn = psycopg2.connect(DATABASE_URL)
        conn.autocommit = True
        cursor = conn.cursor()
        
        # Add avatar_url to users table
        cursor.execute("ALTER TABLE users ADD COLUMN IF NOT EXISTS avatar_url VARCHAR;")
        print("Successfully added avatar_url column to users table if it did not exist!")
        
        cursor.close()
        conn.close()
    except Exception as e:
        print(f"Error executing database alter: {e}")

if __name__ == "__main__":
    main()
