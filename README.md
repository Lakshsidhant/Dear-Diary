# RAG Chatbot Project

Currently, I aim to integrate **Chatbot.py** (backend) with the frontend interface.

##  Setup Instructions

### 1. Create and Activate a Virtual Environment
Create a virtual environment in your project directory and activate it:

``` bash
# Create virtual environment
python -m venv venv

# Activate it
# For Windows:
venv\Scripts\activate

# For macOS/Linux:
source venv/bin/activate
```

### 2. Install the dependencies
```bash
pip install -r Requirements.txt
```

### 3. Run the Backend
In one terminal, start the FastAPI backend using Uvicorn:
``` bash
uvicorn Chatbot:app --reload --port 8000
```

### 4. Run the Frontend
In a separate terminal, start the frontend development server:
```bash
npm run dev
```