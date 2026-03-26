from fastapi import FastAPI, APIRouter, HTTPException, Depends, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict, EmailStr
from typing import List, Optional
from datetime import datetime, timezone, timedelta
from passlib.context import CryptContext
from jose import JWTError, jwt

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

app = FastAPI()
api_router = APIRouter(prefix="/api")

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
SECRET_KEY = os.environ.get('JWT_SECRET_KEY', 'your-secret-key-change-in-production')
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24 * 7

security = HTTPBearer()

class User(BaseModel):
    model_config = ConfigDict(extra="ignore")
    email: EmailStr
    name: str
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class UserSignup(BaseModel):
    email: EmailStr
    password: str
    name: str

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class Token(BaseModel):
    access_token: str
    token_type: str
    user: User

class Income(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    user_email: str
    amount: float
    date: str
    source: str
    notes: Optional[str] = ""
    category: str = "salary"
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class IncomeCreate(BaseModel):
    amount: float
    date: str
    source: str
    notes: Optional[str] = ""
    category: str = "salary"

class Expense(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    user_email: str
    amount: float
    date: str
    category: str
    notes: Optional[str] = ""
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class ExpenseCreate(BaseModel):
    amount: float
    date: str
    category: str
    notes: Optional[str] = ""

class Investment(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    user_email: str
    type: str
    amount_invested: float
    current_value: float
    date: str
    notes: Optional[str] = ""
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class InvestmentCreate(BaseModel):
    type: str
    amount_invested: float
    current_value: float
    date: str
    notes: Optional[str] = ""

class MoneyReceived(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    user_email: str
    amount: float
    sender: str
    date: str
    description: Optional[str] = ""
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class MoneyReceivedCreate(BaseModel):
    amount: float
    sender: str
    date: str
    description: Optional[str] = ""

class MoneySource(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    user_email: str
    name: str
    type: str
    description: Optional[str] = ""
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class MoneySourceCreate(BaseModel):
    name: str
    type: str
    description: Optional[str] = ""

class DashboardSummary(BaseModel):
    total_balance: float
    total_income: float
    total_expenses: float
    total_investments: float
    total_money_received: float
    investment_profit_loss: float
    recent_transactions: List[dict]

def create_access_token(data: dict):
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    token = credentials.credentials
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email: str = payload.get("sub")
        if email is None:
            raise HTTPException(status_code=401, detail="Invalid authentication credentials")
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid authentication credentials")
    
    user = await db.users.find_one({"email": email}, {"_id": 0, "password_hash": 0})
    if user is None:
        raise HTTPException(status_code=401, detail="User not found")
    return user

@api_router.post("/auth/signup", response_model=Token)
async def signup(user_data: UserSignup):
    existing_user = await db.users.find_one({"email": user_data.email})
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    password_hash = pwd_context.hash(user_data.password)
    user_doc = {
        "email": user_data.email,
        "name": user_data.name,
        "password_hash": password_hash,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.users.insert_one(user_doc)
    
    access_token = create_access_token(data={"sub": user_data.email})
    user = User(email=user_data.email, name=user_data.name, created_at=datetime.now(timezone.utc))
    
    return Token(access_token=access_token, token_type="bearer", user=user)

@api_router.post("/auth/login", response_model=Token)
async def login(user_data: UserLogin):
    user = await db.users.find_one({"email": user_data.email})
    if not user or not pwd_context.verify(user_data.password, user["password_hash"]):
        raise HTTPException(status_code=401, detail="Incorrect email or password")
    
    access_token = create_access_token(data={"sub": user_data.email})
    user_response = User(
        email=user["email"],
        name=user["name"],
        created_at=datetime.fromisoformat(user["created_at"]) if isinstance(user["created_at"], str) else user["created_at"]
    )
    
    return Token(access_token=access_token, token_type="bearer", user=user_response)

@api_router.get("/auth/me", response_model=User)
async def get_me(current_user: dict = Depends(get_current_user)):
    return User(**current_user)

@api_router.post("/income", response_model=Income)
async def create_income(income_data: IncomeCreate, current_user: dict = Depends(get_current_user)):
    import uuid
    income_id = str(uuid.uuid4())
    income_doc = income_data.model_dump()
    income_doc["id"] = income_id
    income_doc["user_email"] = current_user["email"]
    created_at = datetime.now(timezone.utc)
    income_doc["created_at"] = created_at.isoformat()
    
    await db.income.insert_one(income_doc)
    income_doc["created_at"] = created_at
    return Income(**income_doc)

@api_router.get("/income", response_model=List[Income])
async def get_income(current_user: dict = Depends(get_current_user)):
    income_list = await db.income.find({"user_email": current_user["email"]}, {"_id": 0}).to_list(1000)
    for item in income_list:
        if isinstance(item.get("created_at"), str):
            item["created_at"] = datetime.fromisoformat(item["created_at"])
    return income_list

@api_router.put("/income/{income_id}", response_model=Income)
async def update_income(income_id: str, income_data: IncomeCreate, current_user: dict = Depends(get_current_user)):
    update_data = income_data.model_dump()
    result = await db.income.update_one(
        {"id": income_id, "user_email": current_user["email"]},
        {"$set": update_data}
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Income not found")
    
    updated_income = await db.income.find_one({"id": income_id}, {"_id": 0})
    if isinstance(updated_income.get("created_at"), str):
        updated_income["created_at"] = datetime.fromisoformat(updated_income["created_at"])
    return Income(**updated_income)

@api_router.delete("/income/{income_id}")
async def delete_income(income_id: str, current_user: dict = Depends(get_current_user)):
    result = await db.income.delete_one({"id": income_id, "user_email": current_user["email"]})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Income not found")
    return {"message": "Income deleted successfully"}

@api_router.post("/expenses", response_model=Expense)
async def create_expense(expense_data: ExpenseCreate, current_user: dict = Depends(get_current_user)):
    import uuid
    expense_id = str(uuid.uuid4())
    expense_doc = expense_data.model_dump()
    expense_doc["id"] = expense_id
    expense_doc["user_email"] = current_user["email"]
    created_at = datetime.now(timezone.utc)
    expense_doc["created_at"] = created_at.isoformat()
    
    await db.expenses.insert_one(expense_doc)
    expense_doc["created_at"] = created_at
    return Expense(**expense_doc)

@api_router.get("/expenses", response_model=List[Expense])
async def get_expenses(current_user: dict = Depends(get_current_user)):
    expenses_list = await db.expenses.find({"user_email": current_user["email"]}, {"_id": 0}).to_list(1000)
    for item in expenses_list:
        if isinstance(item.get("created_at"), str):
            item["created_at"] = datetime.fromisoformat(item["created_at"])
    return expenses_list

@api_router.put("/expenses/{expense_id}", response_model=Expense)
async def update_expense(expense_id: str, expense_data: ExpenseCreate, current_user: dict = Depends(get_current_user)):
    update_data = expense_data.model_dump()
    result = await db.expenses.update_one(
        {"id": expense_id, "user_email": current_user["email"]},
        {"$set": update_data}
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Expense not found")
    
    updated_expense = await db.expenses.find_one({"id": expense_id}, {"_id": 0})
    if isinstance(updated_expense.get("created_at"), str):
        updated_expense["created_at"] = datetime.fromisoformat(updated_expense["created_at"])
    return Expense(**updated_expense)

@api_router.delete("/expenses/{expense_id}")
async def delete_expense(expense_id: str, current_user: dict = Depends(get_current_user)):
    result = await db.expenses.delete_one({"id": expense_id, "user_email": current_user["email"]})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Expense not found")
    return {"message": "Expense deleted successfully"}

@api_router.post("/investments", response_model=Investment)
async def create_investment(investment_data: InvestmentCreate, current_user: dict = Depends(get_current_user)):
    import uuid
    investment_id = str(uuid.uuid4())
    investment_doc = investment_data.model_dump()
    investment_doc["id"] = investment_id
    investment_doc["user_email"] = current_user["email"]
    created_at = datetime.now(timezone.utc)
    investment_doc["created_at"] = created_at.isoformat()
    
    await db.investments.insert_one(investment_doc)
    investment_doc["created_at"] = created_at
    return Investment(**investment_doc)

@api_router.get("/investments", response_model=List[Investment])
async def get_investments(current_user: dict = Depends(get_current_user)):
    investments_list = await db.investments.find({"user_email": current_user["email"]}, {"_id": 0}).to_list(1000)
    for item in investments_list:
        if isinstance(item.get("created_at"), str):
            item["created_at"] = datetime.fromisoformat(item["created_at"])
    return investments_list

@api_router.put("/investments/{investment_id}", response_model=Investment)
async def update_investment(investment_id: str, investment_data: InvestmentCreate, current_user: dict = Depends(get_current_user)):
    update_data = investment_data.model_dump()
    result = await db.investments.update_one(
        {"id": investment_id, "user_email": current_user["email"]},
        {"$set": update_data}
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Investment not found")
    
    updated_investment = await db.investments.find_one({"id": investment_id}, {"_id": 0})
    if isinstance(updated_investment.get("created_at"), str):
        updated_investment["created_at"] = datetime.fromisoformat(updated_investment["created_at"])
    return Investment(**updated_investment)

@api_router.delete("/investments/{investment_id}")
async def delete_investment(investment_id: str, current_user: dict = Depends(get_current_user)):
    result = await db.investments.delete_one({"id": investment_id, "user_email": current_user["email"]})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Investment not found")
    return {"message": "Investment deleted successfully"}

@api_router.post("/money-received", response_model=MoneyReceived)
async def create_money_received(money_data: MoneyReceivedCreate, current_user: dict = Depends(get_current_user)):
    import uuid
    money_id = str(uuid.uuid4())
    money_doc = money_data.model_dump()
    money_doc["id"] = money_id
    money_doc["user_email"] = current_user["email"]
    created_at = datetime.now(timezone.utc)
    money_doc["created_at"] = created_at.isoformat()
    
    await db.money_received.insert_one(money_doc)
    money_doc["created_at"] = created_at
    return MoneyReceived(**money_doc)

@api_router.get("/money-received", response_model=List[MoneyReceived])
async def get_money_received(current_user: dict = Depends(get_current_user)):
    money_list = await db.money_received.find({"user_email": current_user["email"]}, {"_id": 0}).to_list(1000)
    for item in money_list:
        if isinstance(item.get("created_at"), str):
            item["created_at"] = datetime.fromisoformat(item["created_at"])
    return money_list

@api_router.delete("/money-received/{money_id}")
async def delete_money_received(money_id: str, current_user: dict = Depends(get_current_user)):
    result = await db.money_received.delete_one({"id": money_id, "user_email": current_user["email"]})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Money received record not found")
    return {"message": "Money received record deleted successfully"}

@api_router.post("/money-sources", response_model=MoneySource)
async def create_money_source(source_data: MoneySourceCreate, current_user: dict = Depends(get_current_user)):
    import uuid
    source_id = str(uuid.uuid4())
    source_doc = source_data.model_dump()
    source_doc["id"] = source_id
    source_doc["user_email"] = current_user["email"]
    created_at = datetime.now(timezone.utc)
    source_doc["created_at"] = created_at.isoformat()
    
    await db.money_sources.insert_one(source_doc)
    source_doc["created_at"] = created_at
    return MoneySource(**source_doc)

@api_router.get("/money-sources", response_model=List[MoneySource])
async def get_money_sources(current_user: dict = Depends(get_current_user)):
    sources_list = await db.money_sources.find({"user_email": current_user["email"]}, {"_id": 0}).to_list(1000)
    for item in sources_list:
        if isinstance(item.get("created_at"), str):
            item["created_at"] = datetime.fromisoformat(item["created_at"])
    return sources_list

@api_router.delete("/money-sources/{source_id}")
async def delete_money_source(source_id: str, current_user: dict = Depends(get_current_user)):
    result = await db.money_sources.delete_one({"id": source_id, "user_email": current_user["email"]})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Money source not found")
    return {"message": "Money source deleted successfully"}

@api_router.get("/dashboard/summary", response_model=DashboardSummary)
async def get_dashboard_summary(current_user: dict = Depends(get_current_user)):
    income_list = await db.income.find({"user_email": current_user["email"]}, {"_id": 0}).to_list(1000)
    expenses_list = await db.expenses.find({"user_email": current_user["email"]}, {"_id": 0}).to_list(1000)
    investments_list = await db.investments.find({"user_email": current_user["email"]}, {"_id": 0}).to_list(1000)
    money_received_list = await db.money_received.find({"user_email": current_user["email"]}, {"_id": 0}).to_list(1000)
    
    total_income = sum(item["amount"] for item in income_list)
    total_expenses = sum(item["amount"] for item in expenses_list)
    total_money_received = sum(item["amount"] for item in money_received_list)
    
    total_invested = sum(item["amount_invested"] for item in investments_list)
    total_current_value = sum(item["current_value"] for item in investments_list)
    investment_profit_loss = total_current_value - total_invested
    
    total_balance = total_income + total_money_received + investment_profit_loss - total_expenses
    
    all_transactions = []
    for item in income_list:
        all_transactions.append({
            "type": "income",
            "amount": item["amount"],
            "date": item["date"],
            "description": f"{item['source']} - {item['category']}"
        })
    for item in expenses_list:
        all_transactions.append({
            "type": "expense",
            "amount": item["amount"],
            "date": item["date"],
            "description": f"{item['category']}"
        })
    for item in money_received_list:
        all_transactions.append({
            "type": "received",
            "amount": item["amount"],
            "date": item["date"],
            "description": f"From {item['sender']}"
        })
    
    all_transactions.sort(key=lambda x: x["date"], reverse=True)
    recent_transactions = all_transactions[:10]
    
    return DashboardSummary(
        total_balance=total_balance,
        total_income=total_income,
        total_expenses=total_expenses,
        total_investments=total_current_value,
        total_money_received=total_money_received,
        investment_profit_loss=investment_profit_loss,
        recent_transactions=recent_transactions
    )

app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()