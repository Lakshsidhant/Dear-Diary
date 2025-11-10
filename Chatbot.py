from langchain_core.prompts import ChatPromptTemplate, MessagesPlaceholder
from langchain_core.messages import BaseMessage, HumanMessage, AIMessage
from langchain_core.output_parsers import StrOutputParser
from langchain_classic.memory import ConversationBufferMemory
from langchain_classic.schema.runnable import RunnableParallel
from langchain_google_genai import ChatGoogleGenerativeAI
from pydantic import BaseModel, Field
from fastapi import FastAPI, HTTPException
from dotenv import load_dotenv
import sqlite3
from datetime import datetime
import re
from fastapi.middleware.cors import CORSMiddleware

load_dotenv()

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # for local dev
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

llm=ChatGoogleGenerativeAI(model="gemini-2.5-flash")
memory = ConversationBufferMemory(memory_key="chat_history", return_messages=True)
parser = StrOutputParser()

user_name = "Laksh"
user_nationality = "Indian"

class DiaryRequest(BaseModel):
    date: str
    user_input: str


@app.post('/insights_and_emojis')
def insights_and_emojis(request: DiaryRequest):
    date = request.date
    user_input = request.user_input

    date_pattern = r"^(0[1-9]|[12][0-9]|3[01])/(0[1-9]|1[0-2])/\d{4}$"
    
    if not re.match(date_pattern, date):
        raise HTTPException(status_code=400, detail="Invalid date format. Please use DD/MM/YYYY format.")
    
    try:
        datetime.strptime(date, "%d/%m/%Y")
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid date. Please enter a valid date in DD/MM/YYYY format.")
    
    prompt = ChatPromptTemplate.from_template("""
    You are given a diary entry. 
    1. Extract meaningful insights in bullet points.
    2. Suggest 2-5 emoji names that represent the mood and events.

    Return JSON with fields: insights, emojis.

    Diary entry:
    {user_input}
    """)

    class DiaryAnalysis(BaseModel):
        insights: list[str] = Field(description="Meaningful insights from the diary.")
        emojis: list[str] = Field(description="Relevant emoji names.")

    structured_llm = llm.with_structured_output(DiaryAnalysis)
    chain = prompt | structured_llm
    result = chain.invoke({"user_input": user_input})

    global insights, emojis
    insights = result.insights
    emojis = result.emojis

    conn = sqlite3.connect("diary_entries.db")
    cursor = conn.cursor()

    cursor.execute('''
        CREATE TABLE IF NOT EXISTS "Diary Entries" (
            Date TEXT PRIMARY KEY,
            Entry TEXT,
            Insights TEXT,
            Emojis TEXT
        )
    ''')

    cursor.execute('''
        INSERT INTO "Diary Entries" (Date, Entry, Insights, Emojis)
        VALUES (?, ?, ?, ?)
    ''', (date, user_input, str(insights), str(emojis)))

    conn.commit()
    conn.close()
    
    return {"insights": insights, "emojis": emojis}

class UserInput(BaseModel):
    user_input: str
    
@app.post('/response')
def response(data : UserInput):
    
    user_input = data.user_input

    chat_prompt = ChatPromptTemplate.from_messages([
        ("system", "You are a supportive and lighthearted AI friend. The user is {user_nationality} and his name is {user_name}. When the user shares their day or insights, respond in a way that feels curious, witty, soothing, and casual. Keep the tone conversational, inquizitive, funny and approachable, like chatting with a close friend. Use gentle humor, little jokes, or playful remarks when appropriate. Avoid sounding too formal, philosophical, or robotic. Focus on being relatable, encouraging, and fun while still showing genuine care. Keep the reponses very short and ask about a different insight of the day after about 3 responses. Finish the conversation smoothly in about 7 responses and tell the user to go to bed."),
        ("system", "Here are the user's insights for today:\n{insights}"),
        MessagesPlaceholder(variable_name="chat_history"),
        ("human", "{user_message}")
    ])

    chat_chain = chat_prompt | llm | parser

    response = chat_chain.invoke({
        "user_name": user_name,
        "user_nationality": user_nationality,
        "insights": insights,
        "chat_history": memory.load_memory_variables({})["chat_history"],
        "user_message": user_input
    })
    memory.save_context({"input": user_input}, {"output": response})

    return {"response": response}