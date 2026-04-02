"""PayPal Payment Integration"""
from fastapi import APIRouter, HTTPException, Request
from pydantic import BaseModel
from motor.motor_asyncio import AsyncIOMotorClient
from datetime import datetime, timezone
import os
import uuid
import logging

logger = logging.getLogger(__name__)

paypal_router = APIRouter(prefix="/api/payments")

PAYPAL_CLIENT_ID = os.environ.get("PAYPAL_CLIENT_ID", "")
PAYPAL_CLIENT_SECRET = os.environ.get("PAYPAL_CLIENT_SECRET", "")
PAYPAL_MODE = os.environ.get("PAYPAL_MODE", "sandbox")
FRONTEND_URL = os.environ.get("FRONTEND_URL", "")

_client = AsyncIOMotorClient(os.environ['MONGO_URL'])
db = _client[os.environ['DB_NAME']]

def _get_paypal_client():
    if not PAYPAL_CLIENT_ID or not PAYPAL_CLIENT_SECRET:
        return None
    try:
        from paypalcheckoutsdk.core import PayPalHttpClient, SandboxEnvironment, LiveEnvironment
        if PAYPAL_MODE == "live":
            env = LiveEnvironment(client_id=PAYPAL_CLIENT_ID, client_secret=PAYPAL_CLIENT_SECRET)
        else:
            env = SandboxEnvironment(client_id=PAYPAL_CLIENT_ID, client_secret=PAYPAL_CLIENT_SECRET)
        return PayPalHttpClient(env)
    except ImportError:
        logger.warning("PayPal SDK not installed")
        return None

class PayPalCreateOrderRequest(BaseModel):
    amount: float
    currency: str = "USD"
    description: str = "Kalmori Music Distribution"
    release_id: str = None
    plan_id: str = None
    order_type: str = "subscription"

class PayPalCaptureRequest(BaseModel):
    order_id: str

async def _get_user(request: Request):
    from server import get_current_user
    return await get_current_user(request)

@paypal_router.get("/paypal/config")
async def get_paypal_config():
    return {"client_id": PAYPAL_CLIENT_ID, "mode": PAYPAL_MODE, "enabled": bool(PAYPAL_CLIENT_ID)}

@paypal_router.post("/paypal/create-order")
async def create_paypal_order(data: PayPalCreateOrderRequest, request: Request):
    user = await _get_user(request)
    client = _get_paypal_client()
    
    order_id = str(uuid.uuid4())
    
    if client:
        try:
            from paypalcheckoutsdk.orders import OrdersCreateRequest
            pp_request = OrdersCreateRequest()
            pp_request.prefer("return=representation")
            pp_request.request_body({
                "intent": "CAPTURE",
                "purchase_units": [{
                    "reference_id": order_id,
                    "amount": {"currency_code": data.currency, "value": f"{data.amount:.2f}"},
                    "description": data.description
                }],
                "application_context": {
                    "return_url": f"{FRONTEND_URL}/dashboard?paypal=success&order_id={order_id}",
                    "cancel_url": f"{FRONTEND_URL}/pricing?paypal=cancelled",
                    "brand_name": "Kalmori",
                    "user_action": "PAY_NOW"
                }
            })
            response = client.execute(pp_request)
            pp_order_id = response.result.id
            approve_url = next((l.href for l in response.result.links if l.rel == "approve"), None)
            
            await db.paypal_orders.insert_one({
                "id": order_id, "paypal_order_id": pp_order_id, "user_id": user["id"],
                "amount": data.amount, "currency": data.currency, "release_id": data.release_id,
                "plan_id": data.plan_id, "order_type": data.order_type, "status": "created",
                "created_at": datetime.now(timezone.utc)
            })
            return {"order_id": pp_order_id, "internal_order_id": order_id, "approve_url": approve_url, "status": "created"}
        except Exception as e:
            logger.error(f"PayPal create order error: {e}")
            raise HTTPException(status_code=500, detail=f"PayPal error: {str(e)}")
    else:
        # Sandbox simulation when no PayPal keys configured
        await db.paypal_orders.insert_one({
            "id": order_id, "paypal_order_id": f"SIMULATED-{order_id[:8]}", "user_id": user["id"],
            "amount": data.amount, "currency": data.currency, "release_id": data.release_id,
            "plan_id": data.plan_id, "order_type": data.order_type, "status": "created",
            "created_at": datetime.now(timezone.utc)
        })
        return {
            "order_id": f"SIMULATED-{order_id[:8]}", "internal_order_id": order_id,
            "approve_url": f"{FRONTEND_URL}/dashboard?paypal=success&order_id={order_id}",
            "status": "created", "simulated": True,
            "message": "PayPal sandbox mode - no API keys configured"
        }

@paypal_router.post("/paypal/capture-order")
async def capture_paypal_order(data: PayPalCaptureRequest, request: Request):
    user = await _get_user(request)
    client = _get_paypal_client()
    
    if client:
        try:
            from paypalcheckoutsdk.orders import OrdersCaptureRequest
            pp_request = OrdersCaptureRequest(data.order_id)
            response = client.execute(pp_request)
            
            await db.paypal_orders.update_one(
                {"paypal_order_id": data.order_id},
                {"$set": {"status": "captured", "captured_at": datetime.now(timezone.utc),
                          "payer_email": getattr(response.result.payer, 'email_address', None)}}
            )
            return {"status": "captured", "order_id": data.order_id, "payer": getattr(response.result.payer, 'email_address', None)}
        except Exception as e:
            logger.error(f"PayPal capture error: {e}")
            raise HTTPException(status_code=500, detail=f"PayPal capture error: {str(e)}")
    else:
        order = await db.paypal_orders.find_one({"paypal_order_id": data.order_id})
        if order:
            await db.paypal_orders.update_one(
                {"paypal_order_id": data.order_id},
                {"$set": {"status": "captured", "captured_at": datetime.now(timezone.utc)}}
            )
        return {"status": "captured", "order_id": data.order_id, "simulated": True}

@paypal_router.get("/paypal/order/{order_id}")
async def get_paypal_order(order_id: str, request: Request):
    await _get_user(request)
    order = await db.paypal_orders.find_one({"$or": [{"id": order_id}, {"paypal_order_id": order_id}]})
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    order.pop("_id", None)
    return order
