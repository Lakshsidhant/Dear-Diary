from langchain_core.output_parsers import StrOutputParser, JsonOutputParser
from langchain_classic.retrievers import ContextualCompressionRetriever
from langchain_classic.retrievers.document_compressors import LLMChainExtractor
from langchain_classic.prompts import PromptTemplate
from langchain_community.document_loaders import SQLDatabaseLoader
from langchain_community.utilities import SQLDatabase
from langchain_community.vectorstores import FAISS
from langchain_google_genai import ChatGoogleGenerativeAI, GoogleGenerativeAIEmbeddings
from pydantic import Field, BaseModel
from fastapi import FastAPI
from dotenv import load_dotenv

element = FastAPI()

load_dotenv()

llm=ChatGoogleGenerativeAI(model="gemini-2.5-flash")

year = 2025
month = 11

@element.get('/vector_store')
def vector_store():

    loader = SQLDatabaseLoader(f"SELECT Date, Entry FROM 'Diary Entries' WHERE strftime('%m', Date) = '{month}' AND strftime('%Y', Date) = '{year}'", SQLDatabase.from_uri("sqlite:///diary_entries.db"))

    table = loader.load()

    global vector_store
    embeddings = GoogleGenerativeAIEmbeddings(model="gemini-embedding-001")
    vector_store = FAISS.from_documents(table, embeddings)

@element.post('/monthly_assessment')
def monthly_assessment():

    retriever = vector_store.as_retriever(search_type="similarity", search_kwargs={"k": 30}) 
    retrieved_docs = retriever.invoke(f"Assess the emotions in the following entries")
    
    parser = JsonOutputParser()

    class emotional_scores(BaseModel):
        emotions: list[str] = Field(description="List of Emotions")
        scores: list[float] = Field(description="List of Consecutive Scores of every emotion")

    prompt = PromptTemplate(
        template="""You are an AI trained to assess emotions in text.
        Given the following diary entries from this month, evaluate the 4-7 dominant emotions and express them in terms of scores totalling a score of 10. 

        {context}
        """,
        input_variables = ['context']
    )
    
    structured_llm = llm.with_structured_output(emotional_scores)
    chain = prompt | structured_llm
    context = "\n\n".join(doc.page_content for doc in retrieved_docs)
    output = chain.invoke({'context': context})

    return {"monthly_assessment": output}

@element.post('/monthly_chatbot')
def monthly_chatbot(question):

    retriever = vector_store.as_retriever(search_type="similarity", search_kwargs={"k": 5})
    compressor = LLMChainExtractor.from_llm(llm)
    compression_retriever = ContextualCompressionRetriever(
        base_retriever = retriever,
        base_compressor = compressor
    )
    retrieved_docs = compression_retriever.invoke(question)
    context = "\n\n".join(doc.page_content for doc in retrieved_docs)

    prompt = PromptTemplate(
        template="""
        You are a lighthearted AI friend.
        Answer ONLY from the provided context in a lighthearted and soothing manner.
        If the context is insufficient, just say you don't know.

        {context}
        Question: {question}
        """,
        input_variables = ['context', 'question']
    )

    parser = StrOutputParser()
    chain = prompt | llm | parser
    output = chain.invoke({'context':context, 'question':question})
    return output