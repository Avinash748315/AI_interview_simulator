import io
from fastapi import APIRouter, Depends, File, HTTPException, Response, UploadFile
import httpx

from ..config import settings
from ..deps import get_current_user
from ..models import User
from ..schemas import SpeechIn

router = APIRouter(prefix="/api/speech", tags=["speech"])


@router.get("/config")
def speech_config():
    return {
        "stt_provider": settings.stt_provider(),
        "tts_provider": settings.tts_provider(),
        "ai_provider": settings.ai_provider(),
        "elevenlabs_configured": bool(settings.elevenlabs_api_key.strip()),
        "openai_configured": bool(settings.openai_api_key.strip()),
    }


@router.post("/tts")
def text_to_speech(body: SpeechIn, user: User = Depends(get_current_user)):
    if not settings.elevenlabs_api_key.strip():
        raise HTTPException(
            status_code=501,
            detail="ElevenLabs TTS is not configured. The client should use browser text-to-speech fallback.",
        )
    try:
        url = f"https://api.elevenlabs.io/v1/text-to-speech/{settings.elevenlabs_voice_id}"
        headers = {
            "xi-api-key": settings.elevenlabs_api_key.strip(),
            "Content-Type": "application/json",
        }
        payload = {
            "text": body.text[:2000],
            "model_id": "eleven_monolingual_v1",
            "voice_settings": {
                "stability": 0.5,
                "similarity_boost": 0.75,
            },
        }
        res = httpx.post(url, headers=headers, json=payload, timeout=25)
        if res.status_code >= 400:
            raise HTTPException(status_code=502, detail="ElevenLabs service error.")
        return Response(content=res.content, media_type="audio/mpeg")
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"TTS synthesis failed: {exc}")


@router.post("/stt")
async def speech_to_text(file: UploadFile = File(...), user: User = Depends(get_current_user)):
    if not settings.openai_api_key.strip():
        raise HTTPException(
            status_code=501,
            detail="OpenAI Whisper STT is not configured. The client should use browser SpeechRecognition fallback.",
        )
    try:
        from openai import OpenAI
        client = OpenAI(api_key=settings.openai_api_key.strip())
        content = await file.read()
        file_obj = io.BytesIO(content)
        file_obj.name = file.filename or "audio.webm"
        transcript = client.audio.transcriptions.create(
            model="whisper-1",
            file=file_obj,
            language="en",
        )
        return {"text": transcript.text}
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Whisper transcription failed: {exc}")
