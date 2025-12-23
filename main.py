# main.py
from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import List
import sqlite3
import json
import os
from datetime import datetime, date as dt_date, timedelta
from dotenv import load_dotenv

# LangChain & Gemini
from langchain_core.prompts import ChatPromptTemplate, MessagesPlaceholder, PromptTemplate
from langchain_core.messages import HumanMessage, AIMessage
from langchain_core.output_parsers import StrOutputParser
from langchain_google_genai import ChatGoogleGenerativeAI, GoogleGenerativeAIEmbeddings
from langchain_community.document_loaders import SQLDatabaseLoader
from langchain_community.utilities import SQLDatabase
from langchain_community.vectorstores import FAISS

# Load Environment Variables
load_dotenv()

app = FastAPI(title="Mindful Diary AI")

# ---- CORS (fixed) ----
# Example:
# FRONTEND_ORIGINS="http://localhost:5173,http://127.0.0.1:5173"
FRONTEND_ORIGINS = os.getenv("FRONTEND_ORIGINS", "http://localhost:5173").split(",")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[o.strip() for o in FRONTEND_ORIGINS if o.strip()],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# AI Configuration
llm = ChatGoogleGenerativeAI(model="gemini-2.5-flash", temperature=0.7)
embeddings = GoogleGenerativeAIEmbeddings(model="gemini-embedding-001")
DB_PATH = "diary_entries.db"


# --- Database & Helpers ---

def get_conn():
    return sqlite3.connect(DB_PATH, check_same_thread=False)

def init_db():
    conn = get_conn()
    cursor = conn.cursor()
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS "Diary Entries" (
            Date TEXT PRIMARY KEY,
            Entry TEXT,
            Insights TEXT,
            Emojis TEXT
        )
    """)
    conn.commit()
    conn.close()

init_db()

def format_date_for_db(date_str: str) -> str:
    """Converts DD/MM/YYYY -> YYYY-MM-DD for storage"""
    try:
        return datetime.strptime(date_str, "%d/%m/%Y").strftime("%Y-%m-%d")
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid date format. Use DD/MM/YYYY")

def format_date_for_ui(date_str: str) -> str:
    """Converts YYYY-MM-DD -> DD/MM/YYYY for display"""
    try:
        return datetime.strptime(date_str, "%Y-%m-%d").strftime("%d/%m/%Y")
    except ValueError:
        return date_str

def normalize_scores_to_10(scores: List[float]) -> List[float]:
    if not scores:
        return []
    total = sum(scores)
    if total == 0:
        return scores
    return [round((s / total) * 10, 1) for s in scores]


# --- Pydantic Models ---

class DiaryRequest(BaseModel):
    date: str  # Frontend sends DD/MM/YYYY
    user_input: str

class ChatRequest(BaseModel):
    user_input: str
    date: str  # DD/MM/YYYY
    user_name: str = "Friend"
    chat_history: List[dict] = []  # [{role: 'user'|'ai'|'assistant', content: '...'}]

class MonthRequest(BaseModel):
    month: str  # "MM"
    year: str   # "YYYY"

class DiaryAnalysis(BaseModel):
    insights: list[str] = Field(description="3-5 bullet points analyzing the day")
    emojis: list[str] = Field(description="3 emoji characters (not names) that match the mood")

class EmotionalScores(BaseModel):
    emotions: list[str] = Field(description="List of dominant emotions")
    scores: list[float] = Field(description="Score out of 10 for each emotion")


# --- Endpoints ---

@app.get("/")
def health_check():
    return {"status": "Mindful Diary AI is awake 🧠"}

# 1) Save Entry & Analyze
@app.post("/analyze_day")
def analyze_day(request: DiaryRequest):
    db_date = format_date_for_db(request.date)

    prompt = ChatPromptTemplate.from_template("""
    Analyze this diary entry for a mindfulness journal.
    1. Extract 3-5 key psychological insights or summary points.
    2. Select 3 specific EMOJI CHARACTERS (like 🌿, 😔, 🔥) that represent the mood.

    Entry: {user_input}
    """)

    structured_llm = llm.with_structured_output(DiaryAnalysis)
    chain = prompt | structured_llm
    result: DiaryAnalysis = chain.invoke({"user_input": request.user_input})

    conn = get_conn()
    cursor = conn.cursor()
    cursor.execute("""
        INSERT OR REPLACE INTO "Diary Entries" (Date, Entry, Insights, Emojis)
        VALUES (?, ?, ?, ?)
    """, (db_date, request.user_input, json.dumps(result.insights), json.dumps(result.emojis)))
    conn.commit()
    conn.close()

    return result

# 2) Get Month History (for calendar dots/history list)
@app.get("/get_entries/{year}/{month}")
def get_entries(year: str, month: str):
    conn = get_conn()
    cursor = conn.cursor()

    like_prefix = f"{year}-{month}%"
    cursor.execute(
        'SELECT Date, Entry, Emojis FROM "Diary Entries" WHERE Date LIKE ? ORDER BY Date DESC',
        (like_prefix,)
    )
    rows = cursor.fetchall()
    conn.close()

    history = []
    for r in rows:
        entry = r[1] or ""
        preview = entry[:100] + ("..." if len(entry) > 100 else "")
        history.append({
            "date": format_date_for_ui(r[0]),
            "entry_preview": preview,
            "emojis": json.loads(r[2]) if r[2] else []
        })
    return history

# NEW: Get a single day's entry (Dashboard date change needs this)
@app.get("/entry")
def get_entry(date: str = Query(..., description="DD/MM/YYYY")):
    db_date = format_date_for_db(date)

    conn = get_conn()
    cursor = conn.cursor()
    cursor.execute('SELECT Date, Entry, Insights, Emojis FROM "Diary Entries" WHERE Date = ?', (db_date,))
    row = cursor.fetchone()
    conn.close()

    if not row:
        return {"exists": False}

    return {
        "exists": True,
        "date": format_date_for_ui(row[0]),
        "entry": row[1] or "",
        "insights": json.loads(row[2]) if row[2] else [],
        "emojis": json.loads(row[3]) if row[3] else [],
    }

# 3) Chatbot
@app.post("/chat")
def chat_response(request: ChatRequest):
    db_date = format_date_for_db(request.date)

    # Fetch today's context
    conn = get_conn()
    cursor = conn.cursor()
    cursor.execute('SELECT Insights, Entry FROM "Diary Entries" WHERE Date = ?', (db_date,))
    row = cursor.fetchone()
    conn.close()

    context_text = "No entry written for today yet."
    if row:
        insights = json.loads(row[0]) if row[0] else []
        original_entry = row[1] or ""
        context_text = f"User's Diary Entry: {original_entry}\nAI Insights: {insights}"

    # Build history for LangChain (last 10)
    langchain_history = []
    for msg in (request.chat_history or [])[-10:]:
        role = (msg.get("role") or "").lower()
        content = msg.get("content") or ""
        if role == "user":
            langchain_history.append(HumanMessage(content=content))
        else:
            # accept "ai", "assistant", etc.
            langchain_history.append(AIMessage(content=content))

    prompt = ChatPromptTemplate.from_messages([
        ("system", f"You are a warm, empathetic, and witty AI diary companion. User's name is {request.user_name}. Keep it conversational."),
        ("system", f"Context for today ({request.date}):\n{context_text}"),
        MessagesPlaceholder(variable_name="history"),
        ("human", "{input}")
    ])

    chain = prompt | llm | StrOutputParser()
    response = chain.invoke({"history": langchain_history, "input": request.user_input})

    return {"response": response}

# 4) Monthly Mood Report
@app.post("/monthly_report")
def monthly_report(request: MonthRequest):
    db_uri = f"sqlite:///{DB_PATH}"
    like_prefix = f"{request.year}-{request.month}%"
    query = "SELECT Date, Entry FROM 'Diary Entries' WHERE Date LIKE :prefix"

    loader = SQLDatabaseLoader(
        query,
        SQLDatabase.from_uri(db_uri),
        parameters={"prefix": like_prefix},
    )
    docs = loader.load()

    if not docs:
        return {"message": "No data for this month."}

    vector_store = FAISS.from_documents(docs, embeddings)
    retriever = vector_store.as_retriever(search_kwargs={"k": 20})
    relevant_docs = retriever.invoke("What are the dominant emotions and struggles?")
    combined_text = "\n".join([d.page_content for d in relevant_docs])

    prompt = PromptTemplate(
        template="""Analyze the emotions in these diary entries.
Return a JSON object with two lists of equal length:
1. 'emotions': The top 5 emotions felt.
2. 'scores': A score (0-10) for how strong that emotion was overall.

Entries: {context}""",
        input_variables=["context"]
    )

    structured_llm = llm.with_structured_output(EmotionalScores)
    chain = prompt | structured_llm
    output: EmotionalScores = chain.invoke({"context": combined_text})

    output.scores = normalize_scores_to_10(output.scores)
    return output

# NEW: DB-based stats (streak + totals)
@app.get("/stats")
def stats(month: str | None = None, year: str | None = None):
    conn = get_conn()
    cursor = conn.cursor()

    cursor.execute('SELECT Date FROM "Diary Entries"')
    all_dates = {r[0] for r in cursor.fetchall()}  # YYYY-MM-DD

    # streak ending today
    streak = 0
    cur = dt_date.today()
    while cur.strftime("%Y-%m-%d") in all_dates:
        streak += 1
        cur -= timedelta(days=1)

    total_all = len(all_dates)

    total_month = None
    if month and year:
        cursor.execute(
            'SELECT COUNT(*) FROM "Diary Entries" WHERE Date LIKE ?',
            (f"{year}-{month}%",)
        )
        total_month = cursor.fetchone()[0]

    conn.close()

    return {
        "total_entries_all": total_all,
        "streak": streak,
        "total_entries_month": total_month,
    }
