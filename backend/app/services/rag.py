from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain_openai import OpenAIEmbeddings, ChatOpenAI
from langchain.vectorstores import FAISS
from langchain.chains import ConversationalRetrievalChain
from app.core.config import settings

def build_rag_chain(text: str):
    if not settings.OPENAI_API_KEY:
        raise ValueError("OPENAI_API_KEY not configured")
        
    text_splitter = RecursiveCharacterTextSplitter(chunk_size=1000, chunk_overlap=100)
    docs = text_splitter.create_documents([text])
    
    embeddings = OpenAIEmbeddings(openai_api_key=settings.OPENAI_API_KEY)
    vectorstore = FAISS.from_documents(docs, embeddings)
    retriever = vectorstore.as_retriever(search_kwargs={"k": 3})
    
    llm = ChatOpenAI(model_name="gpt-4-turbo-preview", temperature=0.2, openai_api_key=settings.OPENAI_API_KEY)
    chain = ConversationalRetrievalChain.from_llm(llm=llm, retriever=retriever)
    return chain

def query_resume(chain, question: str, chat_history: list):
    response = chain({"question": question, "chat_history": [(msg["user"], msg["ai"]) for msg in chat_history]})
    return response["answer"]
