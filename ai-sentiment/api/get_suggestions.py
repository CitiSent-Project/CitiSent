from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List
from ai import generate_suggestions

router = APIRouter()


class MessageItem(BaseModel):
    sender: str
    text: str


class SuggestionsRequest(BaseModel):
    latestUserMessage: str
    conversationContext: List[MessageItem]
    reportCategory: str
    urgency: str
    detectedEmotion: str


@router.post("/chat/suggestions", status_code=200)
async def get_chat_suggestions(body: SuggestionsRequest):
    try:
        # Convert context items to dictionary format for the AI prompt builder
        context = [msg.model_dump() for msg in body.conversationContext]
        result = await generate_suggestions(
            latest_message=body.latestUserMessage,
            conversation_context=context,
            report_category=body.reportCategory,
            urgency=body.urgency,
            detected_emotion=body.detectedEmotion
        )
        return result
    except Exception as exc:
        raise HTTPException(
            status_code=500,
            detail=f"Error generating chat suggestions: {str(exc)}"
        )
