# 🤖 AI Data Assistant
------------------------------------------------------------------------

## 🌟 Overview

**AI Data Assistant** is a full-stack AI-powered database analytics
application that allows users to interact with relational databases
using **natural language**.

Instead of manually writing SQL, a user can simply ask:

> **"Show the top 10 food listings by quantity."**

The system understands the question, analyzes the connected database
schema, generates SQL using an AI model, validates the query for safety,
executes the query, and presents the results in an easy-to-understand
interface.

### The core idea

``` text
┌──────────────────────┐
│   Natural Language   │
│  "Show top providers"│
└──────────┬───────────┘
           ↓
┌──────────────────────┐
│    Database Schema   │
│ Tables + Columns +   │
│ Types + Relationships│
└──────────┬───────────┘
           ↓
┌──────────────────────┐
│      AI / Groq       │
│    Text → SQL        │
└──────────┬───────────┘
           ↓
┌──────────────────────┐
│    SQL Validation    │
│     Read-only gate   │
└──────────┬───────────┘
           ↓
┌──────────────────────┐
│      Database        │
└──────────┬───────────┘
           ↓
┌──────────────────────┐
│ Results + AI Insight │
│   Table + Charts     │
└──────────────────────┘
```

------------------------------------------------------------------------

# ✨ Features

## 💬 1. Natural Language Database Queries

Users can ask database questions in everyday language instead of writing
SQL manually.

**Examples:**

``` text
Show all providers
```

``` text
Show the top 5 providers by rating
```

``` text
How many food listings are available?
```

``` text
Show food listings with quantity greater than 20
```

``` text
Which provider has the most food listings?
```

``` text
Show the top 10 food listings by quantity
```

------------------------------------------------------------------------

## 🧠 2. Schema-Aware Text-to-SQL

The AI does not generate SQL blindly.

The backend retrieves the connected database schema and provides the
available tables, columns, data types, and relevant metadata to the AI.

``` text
User Question
      +
Database Schema
      ↓
   AI Model
      ↓
   SQL Query
```

This helps the system generate queries that match the actual database
structure.

------------------------------------------------------------------------

## 🛡️ 3. SQL Safety Validation

AI-generated SQL is treated as **untrusted output** and is validated
before execution.

The current application is designed primarily for read-only database
exploration.

Operations such as these are blocked by the database safety layer:

``` sql
DROP TABLE ...
DELETE FROM ...
TRUNCATE TABLE ...
ALTER TABLE ...
INSERT INTO ...
UPDATE ...
```

> **Important:** For production databases, always use read-only database
> credentials and database-level permissions in addition to
> application-level validation.

------------------------------------------------------------------------

## 📊 4. Data Visualization

Query results can be explored through a table and chart interface.

Depending on the returned data, the application can work with
visualization types such as:

-   📊 Bar charts
-   📈 Line charts
-   🥧 Pie charts
-   🔵 Scatter charts

The visualization is based on the **actual query result**, not
fabricated sample data.

------------------------------------------------------------------------

## ✨ 5. AI-Powered Insights

After a query is executed, the AI can summarize the result in concise
natural language.

Example:

``` text
The top food listings are Vegetables, Salad, Rice,
Bread, and Soup, with the highest quantity reaching 50.
```

This helps users understand the result without manually analyzing every
row.

------------------------------------------------------------------------

## 🗂️ 6. Query History

Users can review previous database questions and generated queries.

This makes it easier to:

-   revisit previous analysis
-   understand past questions
-   track database exploration
-   reuse successful queries

------------------------------------------------------------------------

## 💾 7. Saved Queries

Useful queries can be saved for later use.

This is particularly helpful for frequently performed database analysis.

------------------------------------------------------------------------

## 🗃️ 8. Schema Explorer

The Schema Explorer provides a visual view of the connected database
structure.

Users can inspect:

-   tables
-   columns
-   data types
-   primary keys
-   foreign keys
-   record counts
-   table previews

------------------------------------------------------------------------

## 🔌 9. Database Connections

The application includes a database connection management layer built
around SQLAlchemy.

The current backend includes support for:

-   SQLite
-   PostgreSQL
-   MySQL

The database layer is separated from the AI service so the Text-to-SQL
logic can work independently from database connectivity.

------------------------------------------------------------------------

## 🔐 10. Authentication

The application includes authentication and protected API routes.

The backend uses:

-   JWT authentication
-   password hashing
-   protected user resources
-   encrypted database connection information

------------------------------------------------------------------------

# 🏗️ System Architecture

``` text
                           ┌─────────────────┐
                           │      User       │
                           └────────┬────────┘
                                    │
                                    ▼
                         ┌────────────────────┐
                         │ React + Vite       │
                         │ Frontend           │
                         └─────────┬──────────┘
                                   │ REST API
                                   ▼
                         ┌────────────────────┐
                         │ FastAPI Backend    │
                         │                    │
                         │ Authentication     │
                         │ Query Processing   │
                         │ Schema Retrieval   │
                         │ SQL Validation     │
                         │ DB Execution       │
                         └───────┬──────┬─────┘
                                 │      │
                    Schema +     │      │ SQL
                    Question     │      │
                                 ▼      ▼
                         ┌──────────┐ ┌──────────┐
                         │  Groq    │ │ Database │
                         │ AI Model │ │          │
                         └──────────┘ └──────────┘
                                 │
                                 ▼
                         ┌────────────────────┐
                         │ Results + Insight  │
                         │ Table + Chart      │
                         └────────────────────┘
```

------------------------------------------------------------------------

# 🧩 Application Flow

A typical query follows this process:

### 1️⃣ User asks a question

``` text
"Show the top 10 food listings by quantity"
```

### 2️⃣ Backend identifies the active database

The application determines which database connection the user is working
with.

### 3️⃣ Schema is retrieved

The backend collects the relevant database metadata.

Example:

``` text
food_listings
├── Food_ID
├── Food_Name
├── Quantity
└── Expiry_Date
```

### 4️⃣ AI generates SQL

The Groq-powered AI receives the question and schema and returns
structured SQL information.

Example:

``` sql
SELECT Food_Name, Quantity
FROM food_listings
ORDER BY Quantity DESC
LIMIT 10;
```

### 5️⃣ SQL is validated

The generated SQL passes through the application's safety validation
layer.

### 6️⃣ Query is executed

The validated read query is executed against the selected database.

### 7️⃣ Results are returned

The frontend receives:

-   generated SQL
-   columns
-   rows
-   result metadata
-   chart information
-   AI insight

### 8️⃣ User explores the result

The result can be viewed in a table and, when appropriate, as a chart.

------------------------------------------------------------------------

# 🛠️ Technology Stack

  Layer                          Technology
  ------------------------------ -----------------------------
  **Frontend**                   React 19 + Vite
  **Language**                   TypeScript / JavaScript
  **Styling**                    Tailwind CSS
  **Charts**                     Recharts
  **HTTP Client**                Axios
  **State Management**           Zustand
  **Forms & Validation**         React Hook Form + Zod
  **Backend**                    FastAPI
  **Backend Language**           Python
  **ORM / DB Layer**             SQLAlchemy
  **Data Processing**            Pandas / NumPy
  **AI Provider**                Groq
  **SQL Parsing / Validation**   SQLGlot
  **Authentication**             JWT + password hashing
  **Databases**                  SQLite / PostgreSQL / MySQL

------------------------------------------------------------------------

# 📁 Project Structure

``` text
AIDB/
│
├── backend/
│   ├── api/
│   │   ├── auth.py
│   │   ├── databases.py
│   │   ├── deps.py
│   │   ├── foundation.py
│   │   └── query.py
│   │
│   ├── database/
│   │   ├── adapters/
│   │   │   ├── base.py
│   │   │   └── sqlite.py
│   │   ├── core.py
│   │   ├── demo_db.py
│   │   ├── service.py
│   │   └── universal_service.py
│   │
│   ├── models/
│   │   ├── connection.py
│   │   ├── query.py
│   │   └── user.py
│   │
│   ├── schemas/
│   │   ├── connection.py
│   │   └── user.py
│   │
│   ├── security/
│   │   ├── auth.py
│   │   └── encryption.py
│   │
│   ├── services/
│   │   ├── ai_service.py
│   │   └── sql_validator.py
│   │
│   ├── main.py
│   ├── requirements.txt
│   └── ...
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── services/
│   │   ├── store/
│   │   ├── App.tsx
│   │   └── main.tsx
│   │
│   ├── public/
│   ├── package.json
│   └── vite.config.ts
│
├── .gitignore
└── README.md
```

------------------------------------------------------------------------

# ⚙️ Installation

## Prerequisites

Make sure you have installed:

-   **Python 3.x**
-   **Node.js + npm**
-   A supported database if connecting to an external database
-   A **Groq API key**

------------------------------------------------------------------------

## 1. Clone the Repository

``` bash
git clone <YOUR_GITHUB_REPOSITORY_URL>
cd AIDB
```

------------------------------------------------------------------------

# 🐍 Backend Setup

Move into the backend directory:

``` bash
cd backend
```

Create a virtual environment.

### Windows

``` cmd
python -m venv venv
venv\Scripts\activate
```

### macOS / Linux

``` bash
python3 -m venv venv
source venv/bin/activate
```

Install the backend dependencies:

``` bash
pip install -r requirements.txt
```

------------------------------------------------------------------------

# 🔑 Environment Configuration

Create:

``` text
backend/.env
```

Example:

``` env
GROQ_API_KEY=your_groq_api_key
AI_MODEL=your_supported_groq_model
CORS_ORIGIN=http://localhost:5173
```

### 🔒 Never commit secrets

Do **not** commit:

``` text
.env
API keys
database passwords
JWT secrets
encryption keys
```

The Groq API key must remain on the backend.

------------------------------------------------------------------------

# ▶️ Start the Backend

From the `backend` directory:

``` bash
uvicorn main:app --reload
```

The API will normally be available at:

``` text
http://127.0.0.1:8000
```

FastAPI documentation:

``` text
http://127.0.0.1:8000/docs
```

Root health response:

``` json
{
  "status": "ok",
  "message": "AI Database Assistant API is running"
}
```

------------------------------------------------------------------------

# ⚛️ Frontend Setup

Open another terminal.

``` bash
cd frontend
```

Install dependencies:

``` bash
npm install
```

Start the development server:

``` bash
npm run dev
```

The frontend will normally run at:

``` text
http://localhost:5173
```

------------------------------------------------------------------------

# 🔗 Frontend → Backend Configuration

The frontend uses:

``` env
VITE_API_URL
```

If it is not provided during local development, the application defaults
to:

``` text
http://localhost:8000/api
```

For production, configure:

``` env
VITE_API_URL=https://YOUR-BACKEND-DOMAIN/api
```

Do not put the Groq API key in the frontend environment.

------------------------------------------------------------------------

# 🧪 Example

### User input

``` text
Show the top 10 food listings by quantity
```

### AI-generated SQL

``` sql
SELECT Food_Name, Quantity
FROM food_listings
ORDER BY Quantity DESC
LIMIT 10;
```

### Result

``` text
Food_Name     Quantity
----------------------
Vegetables       50
Salad            50
Rice             50
Bread            50
Soup             50
...
```

### AI Insight

``` text
The highest-quantity food listings have a quantity of 50,
with several food items sharing the top value.
```

------------------------------------------------------------------------

# 🔐 Security Model

Because this application allows an AI model to generate database
queries, security is a core design requirement.

The intended protection chain is:

``` text
User
 ↓
Authentication
 ↓
Natural Language
 ↓
AI-generated SQL
 ↓
SQL Validator
 ↓
Read-only Database Access
 ↓
Result
```

### Recommended production controls

For production deployments, use:

-   Read-only database credentials
-   Strict SQL allowlists
-   Query execution timeouts
-   Maximum result-size limits
-   API rate limiting
-   Audit logs
-   HTTPS
-   Secure secret storage
-   Database-level permissions
-   Input validation

> **Never rely on the LLM alone to protect your database.**

------------------------------------------------------------------------

# 🤖 AI Layer

The application uses the **Groq API** as its AI inference provider.

The AI service performs two main tasks:

### 1. Text-to-SQL

``` text
Natural Language + Schema
            ↓
       Groq AI Model
            ↓
       Structured SQL
```

### 2. Result Insight

``` text
Question + SQL + Query Results
            ↓
       Groq AI Model
            ↓
      Concise Insight
```

The current query flow therefore uses AI for both SQL generation and
result summarization.

------------------------------------------------------------------------

# 📊 Visualization Logic

The AI can return a suggested chart type based on the query intent:

  Chart         Best suited for
  ------------- -------------------------------------------
  **Bar**       Category comparisons and rankings
  **Line**      Time-based trends
  **Pie**       Simple part-to-whole comparisons
  **Scatter**   Relationships between numeric values
  **None**      Results where visualization is not useful

The frontend maps the returned query columns to the selected chart axes.

------------------------------------------------------------------------

# 🗄️ Database Support

The backend contains a database abstraction layer using SQLAlchemy.

### SQLite

Useful for:

-   local development
-   demos
-   testing
-   lightweight deployments

### PostgreSQL

Useful for:

-   production applications
-   larger datasets
-   concurrent workloads

### MySQL

Useful for:

-   existing MySQL applications
-   production relational databases

The application separates database access from AI processing, making the
architecture easier to extend.

------------------------------------------------------------------------

# 🚀 Production Deployment

A typical production architecture can look like this:

``` text
                         Internet
                            │
              ┌─────────────┴─────────────┐
              │                           │
              ▼                           ▼
       React / Vite                 FastAPI
       Frontend                     Backend
              │                           │
              │                           ├──────► Groq API
              │                           │
              └───────────────────────────┤
                                          ▼
                                   PostgreSQL /
                                   MySQL / SQLite
```

### Production checklist

Before deployment:

-   [ ] Remove `.env` from Git
-   [ ] Rotate exposed API keys if necessary
-   [ ] Configure production `VITE_API_URL`
-   [ ] Configure production CORS
-   [ ] Use HTTPS
-   [ ] Store secrets in the hosting platform
-   [ ] Use read-only database credentials
-   [ ] Configure database access securely
-   [ ] Add rate limiting
-   [ ] Configure logging
-   [ ] Test authentication
-   [ ] Test schema retrieval
-   [ ] Test Natural Language → SQL
-   [ ] Test SQL validation
-   [ ] Test database execution
-   [ ] Test charts and insights

------------------------------------------------------------------------

# 🧪 Testing

The project includes an end-to-end test workflow.

The expected flow is:

``` text
Authentication
      ↓
Database Connection
      ↓
Schema Retrieval
      ↓
Data Preview
      ↓
Natural Language Question
      ↓
AI SQL Generation
      ↓
SQL Validation
      ↓
Database Execution
      ↓
AI Insight
      ↓
Frontend Result
```

Example test questions:

``` text
Show all providers
```

``` text
Show the top 5 providers by rating
```

``` text
How many food listings are there?
```

``` text
Show the top 10 food listings by quantity
```

------------------------------------------------------------------------

# 🧠 Design Principles

The project follows several important principles:

### Separation of responsibilities

``` text
Frontend
   ↓
API
   ↓
Business Logic
   ↓
AI Service
   ↓
SQL Validation
   ↓
Database Layer
```

### Security before execution

``` text
AI Output
   ↓
Validate
   ↓
Execute
```

### Schema-aware generation

``` text
Question
   +
Schema
   ↓
Better SQL generation
```

### Provider independence

The AI layer is isolated in its own service so the application can be
extended to support additional AI providers or local models in the
future.

------------------------------------------------------------------------

# 🔮 Future Enhancements

The architecture can be extended with:

-   🧠 Fine-tuned Text-to-SQL models
-   🔄 Multi-model AI fallback
-   🏠 Local/offline LLM support
-   📚 RAG for database documentation
-   🎙️ Voice-to-SQL
-   📈 Automatic dashboard generation
-   ⚡ SQL optimization recommendations
-   🧩 More database engines
-   📤 CSV / Excel / PDF export
-   👥 Team and workspace support
-   🔍 Query explanation
-   🛡️ Advanced policy-based SQL permissions
-   📊 More advanced analytics
-   ☁️ Cloud-native deployment
-   📉 Query performance monitoring

------------------------------------------------------------------------

# 🎓 Project Value

This project demonstrates practical integration of:

``` text
Artificial Intelligence
        +
Natural Language Processing
        +
Text-to-SQL
        +
Database Systems
        +
Backend APIs
        +
Frontend Development
        +
Data Visualization
        +
Application Security
```

It is especially useful as a portfolio or academic project because it
addresses a real problem:

> **How can non-technical users retrieve useful information from
> databases without knowing SQL?**

------------------------------------------------------------------------

# 🏆 Key Takeaway

### Traditional database interaction

``` text
User
 ↓
Learn SQL
 ↓
Understand Schema
 ↓
Write Query
 ↓
Debug Query
 ↓
Execute
 ↓
Analyze Results
```

### AI Data Assistant

``` text
User
 ↓
Ask a question naturally
 ↓
AI understands intent
 ↓
Schema-aware SQL generation
 ↓
SQL safety validation
 ↓
Database execution
 ↓
Table / Chart
 ↓
AI Insight
```

**The goal is simple: make databases easier to understand and query
using natural language while keeping database access controlled and
safe.**

------------------------------------------------------------------------

# 🤝 Contributing

Contributions are welcome.

A typical workflow:

``` bash
git checkout -b feature/your-feature
```

Make your changes, test them, then create a pull request.

When contributing:

-   Keep changes focused
-   Follow the existing project structure
-   Avoid committing secrets
-   Add tests for important backend changes
-   Keep API contracts stable where possible
-   Document significant changes

------------------------------------------------------------------------

## 👨‍💻 Author

**Nagaraj**

AI Data Assistant — AI-powered natural language database analytics.

------------------------------------------------------------------------

