from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import requests
import os
from datetime import datetime, timedelta
from typing import List, Optional
import math

app = FastAPI(title="Fast-Commerce ML Service", version="1.0.0")

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Environment variables
BACKEND_URL = os.getenv("BACKEND_URL", "http://127.0.0.1:5000")

class ForecastRequest(BaseModel):
    storeId: str
    itemId: str

class StoreForecastRequest(BaseModel):
    storeId: str

class ForecastResponse(BaseModel):
    suggestedQty: int
    confidence: float
    reasoning: str

@app.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "timestamp": datetime.now().isoformat(),
        "service": "Fast-Commerce ML Service"
    }

@app.post("/forecast", response_model=ForecastResponse)
async def forecast_item(request: ForecastRequest):
    """
    Generate inventory forecast for a specific item.
    Calculates average daily sales for the last 7 days and suggests reorder quantity.
    """
    try:
        # Get orders for the last 7 days for this item
        seven_days_ago = datetime.now() - timedelta(days=7)
        
        # Call backend to get orders using the public endpoint
        print(f"Calling backend public orders endpoint: {BACKEND_URL}/api/orders/ml/public")
        orders_response = requests.get(
            f"{BACKEND_URL}/api/orders/ml/public",
            params={
                "storeId": request.storeId,
                "since": seven_days_ago.isoformat()
            }
        )
        
        print(f"Orders response status: {orders_response.status_code}")
        if orders_response.status_code != 200:
            print(f"Orders response error: {orders_response.text}")
            raise HTTPException(status_code=500, detail=f"Failed to fetch orders from backend: {orders_response.text}")
        
        orders_data = orders_response.json()
        orders = orders_data.get("orders", [])
        print(f"Total orders received: {len(orders)}")
        
        # Filter orders for the specific item
        relevant_orders = []
        for order in orders:
            # Check if order contains the specified item
            for item in order.get("items", []):
                if item.get("item", {}).get("_id") == request.itemId:
                    relevant_orders.append(order)
                    break
        
        print(f"Relevant orders found: {len(relevant_orders)}")
        
        # Calculate total quantity sold for this item in the last 7 days
        total_sold = 0
        for order in relevant_orders:
            for item in order.get("items", []):
                if item.get("item", {}).get("_id") == request.itemId:
                    total_sold += item.get("quantity", 0)
        
        print(f"Total sold for item {request.itemId}: {total_sold}")
        
        # Calculate average daily sales
        days = 7
        average_daily_sales = total_sold / days if days > 0 else 0
        
        # Suggested quantity: average daily sales * 1.2 (20% buffer)
        suggested_qty = math.ceil(average_daily_sales * 1.2)
        
        # Ensure minimum suggested quantity
        suggested_qty = max(suggested_qty, 5)
        
        # Calculate confidence based on data availability
        confidence = min(0.9, 0.3 + (len(relevant_orders) * 0.1)) if relevant_orders else 0.3
        
        reasoning = f"Based on {total_sold} units sold in the last 7 days ({average_daily_sales:.1f} daily average). Suggested quantity includes 20% buffer."
        
        return ForecastResponse(
            suggestedQty=suggested_qty,
            confidence=confidence,
            reasoning=reasoning
        )
        
    except requests.RequestException as e:
        print(f"Request exception: {str(e)}")
        raise HTTPException(status_code=503, detail=f"Backend service unavailable: {str(e)}")
    except Exception as e:
        print(f"General exception: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Forecast calculation failed: {str(e)}")

@app.post("/forecast/store")
async def forecast_store_items(request: StoreForecastRequest):
    """
    Generate inventory forecasts for all items in a store.
    """
    try:
        # Get store items
        items_response = requests.get(f"{BACKEND_URL}/api/items/store/{request.storeId}")
        
        if items_response.status_code != 200:
            raise HTTPException(status_code=500, detail="Failed to fetch store items from backend")
        
        items_data = items_response.json()
        items = items_data.get("items", [])
        
        # Get all orders for analysis using public endpoint
        seven_days_ago = datetime.now() - timedelta(days=7)
        orders_response = requests.get(
            f"{BACKEND_URL}/api/orders/ml/public",
            params={"since": seven_days_ago.isoformat()}
        )
        
        if orders_response.status_code != 200:
            raise HTTPException(status_code=500, detail="Failed to fetch orders from backend")
        
        orders_data = orders_response.json()
        orders = orders_data.get("orders", [])
        
        # Filter orders for this store
        store_orders = []
        for order in orders:
            if order.get("store", {}).get("_id") == request.storeId:
                store_orders.append(order)
        
        forecasts = []
        
        for item in items:
            try:
                # Calculate forecast for this item
                total_sold = 0
                for order in store_orders:
                    for order_item in order.get("items", []):
                        if order_item.get("item", {}).get("_id") == item["_id"]:
                            total_sold += order_item.get("quantity", 0)
                
                # Calculate average daily sales
                days = 7
                average_daily_sales = total_sold / days if days > 0 else 0
                
                # Suggested quantity: average daily sales * 1.2 (20% buffer)
                suggested_qty = math.ceil(average_daily_sales * 1.2)
                suggested_qty = max(suggested_qty, 5)
                
                # Calculate confidence
                confidence = min(0.9, 0.3 + (len(store_orders) * 0.1)) if store_orders else 0.3
                
                reasoning = f"Based on {total_sold} units sold in the last 7 days ({average_daily_sales:.1f} daily average). Suggested quantity includes 20% buffer."
                
                forecasts.append({
                    "itemId": item["_id"],
                    "itemName": item["name"],
                    "currentQty": item["quantity"],
                    "reorderThreshold": item["reorderThreshold"],
                    "suggestedQty": suggested_qty,
                    "confidence": confidence,
                    "reasoning": reasoning
                })
            except Exception as e:
                # Continue with other items if one fails
                forecasts.append({
                    "itemId": item["_id"],
                    "itemName": item["name"],
                    "currentQty": item["quantity"],
                    "reorderThreshold": item["reorderThreshold"],
                    "suggestedQty": 0,
                    "confidence": 0,
                    "reasoning": f"Forecast failed: {str(e)}"
                })
        
        return {
            "storeId": request.storeId,
            "forecasts": forecasts,
            "timestamp": datetime.now().isoformat()
        }
        
    except requests.RequestException as e:
        raise HTTPException(status_code=503, detail=f"Backend service unavailable: {str(e)}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Store forecast calculation failed: {str(e)}")

@app.post("/test-forecast", response_model=ForecastResponse)
async def test_forecast_item(request: ForecastRequest):
    """
    Test forecast endpoint that doesn't call the backend.
    """
    try:
        # Simulate some test data
        total_sold = 15  # Simulate 15 units sold in 7 days
        average_daily_sales = total_sold / 7
        
        # Suggested quantity: average daily sales * 1.2 (20% buffer)
        suggested_qty = math.ceil(average_daily_sales * 1.2)
        suggested_qty = max(suggested_qty, 5)
        
        confidence = 0.8
        reasoning = f"Test forecast: Based on {total_sold} units sold in the last 7 days ({average_daily_sales:.1f} daily average). Suggested quantity includes 20% buffer."
        
        return ForecastResponse(
            suggestedQty=suggested_qty,
            confidence=confidence,
            reasoning=reasoning
        )
        
    except Exception as e:
        print(f"Test forecast exception: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Test forecast failed: {str(e)}")

@app.get("/")
async def root():
    return {
        "message": "Fast-Commerce ML Service",
        "version": "1.0.0",
        "endpoints": {
            "health": "/health",
            "forecast": "/forecast",
            "store_forecast": "/forecast/store"
        }
    } 