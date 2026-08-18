from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List
from ai import generate_admin_note_suggestions, generate_suggestions

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


class AdminNoteSuggestionsRequest(BaseModel):
    reportStatus: str
    conversationContext: List[MessageItem]
    reportCategory: str
    urgency: str
    detectedEmotion: str
    reportDescription: str


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


@router.post("/admin-notes/suggestions", status_code=200)
async def get_admin_note_suggestions(body: AdminNoteSuggestionsRequest):
    try:
        result = await generate_admin_note_suggestions(
            report_status=body.reportStatus,
            conversation_context=[message.model_dump() for message in body.conversationContext],
            report_category=body.reportCategory,
            urgency=body.urgency,
            detected_emotion=body.detectedEmotion,
            report_description=body.reportDescription,
        )
        return result
    except Exception as exc:
        raise HTTPException(
            status_code=500,
            detail=f"Error generating admin-note suggestions: {str(exc)}",
        )
