import json
import urllib.request
import urllib.error
import uuid
from django.conf import settings

def get_bot_token():
    return getattr(settings, 'TELEGRAM_BOT_TOKEN', '8460071507:AAF1lwV6gqoHDmqUewsqDGW04y7pGW-wWvY')

# Known cache and verified mappings for direct delivery without polling conflicts
KNOWN_USER_MAPPINGS = {
    'redugetch': '5179839146',
}

def resolve_chat_id(telegram_username_or_id):
    """
    Resolves a Telegram username (@username) or numeric chat ID into a chat_id.
    Queries known mappings first, then bot's /getUpdates API case-insensitively.
    """
    if not telegram_username_or_id:
        return None
        
    identifier = str(telegram_username_or_id).strip()
    clean_uname = identifier.lstrip('@').strip().lower()
    
    # 1. If it is already a numeric ID
    if clean_uname.lstrip('-').isdigit():
        return identifier.lstrip('@').strip()
        
    # 2. Check verified/cached user mappings
    if clean_uname in KNOWN_USER_MAPPINGS:
        return KNOWN_USER_MAPPINGS[clean_uname]
        
    token = get_bot_token()
    if not token:
        return None
        
    try:
        req = urllib.request.Request(f"https://api.telegram.org/bot{token}/getUpdates")
        with urllib.request.urlopen(req, timeout=10) as response:
            updates = json.loads(response.read().decode('utf-8'))
            
        if not updates.get('ok'):
            return None
            
        # Search recent updates in reverse to find the latest chat_id
        for update in reversed(updates.get('result', [])):
            for key in ['message', 'my_chat_member', 'chat_member', 'callback_query', 'channel_post']:
                item = update.get(key)
                if not item:
                    continue
                    
                from_user = item.get('from', {})
                if from_user.get('username') and from_user.get('username').lower() == clean_uname:
                    return from_user.get('id')
                    
                chat = item.get('chat', {})
                if chat.get('username') and chat.get('username').lower() == clean_uname:
                    return chat.get('id')
    except Exception as e:
        print(f"[Telegram] Failed to resolve chat_id for {identifier}: {e}")
        
    return None

def send_telegram_message(telegram_username_or_id, text, parse_mode='Markdown', button_text=None, button_url=None):
    """
    Sends a text message (with optional inline button) to a Telegram user.
    """
    token = get_bot_token()
    if not token:
        return {"success": False, "error": "Telegram bot token is not configured."}
        
    chat_id = resolve_chat_id(telegram_username_or_id)
    if not chat_id:
        clean = str(telegram_username_or_id).lstrip('@')
        return {
            "success": False, 
            "error": f"Could not find Telegram chat for @{clean}. Make sure they started the bot (@FieldFlowApp_bot) and sent /start."
        }
        
    payload = {
        "chat_id": chat_id,
        "text": text,
        "parse_mode": parse_mode
    }
    
    if button_text and button_url and button_url.startswith(('http://', 'https://')):
        payload["reply_markup"] = {
            "inline_keyboard": [[{"text": button_text, "url": button_url}]]
        }
        
    try:
        req = urllib.request.Request(
            f"https://api.telegram.org/bot{token}/sendMessage",
            data=json.dumps(payload).encode('utf-8'),
            headers={'Content-Type': 'application/json'}
        )
        with urllib.request.urlopen(req, timeout=10) as resp:
            data = json.loads(resp.read().decode('utf-8'))
            return {"success": True, "result": data}
    except urllib.error.HTTPError as e:
        err_msg = e.read().decode('utf-8', errors='ignore')
        print(f"[Telegram] HTTPError {e.code}: {err_msg}")
        if "parse entities" in err_msg.lower() and payload.get('parse_mode'):
            payload.pop('parse_mode', None)
            try:
                retry_req = urllib.request.Request(
                    f"https://api.telegram.org/bot{token}/sendMessage",
                    data=json.dumps(payload).encode('utf-8'),
                    headers={'Content-Type': 'application/json'}
                )
                with urllib.request.urlopen(retry_req, timeout=10) as retry_resp:
                    return {"success": True, "result": json.loads(retry_resp.read().decode('utf-8'))}
            except Exception as retry_err:
                return {"success": False, "error": str(retry_err)}
        return {"success": False, "error": f"HTTP {e.code}: {err_msg}"}
    except Exception as e:
        print(f"[Telegram] Error sending message: {e}")
        return {"success": False, "error": str(e)}

def send_telegram_photo(telegram_username_or_id, photo_bytes, caption, parse_mode='Markdown', button_text=None, button_url=None):
    """
    Sends a photo (with optional caption & inline button) using multipart/form-data.
    """
    token = get_bot_token()
    if not token:
        return {"success": False, "error": "Telegram bot token is not configured."}
        
    chat_id = resolve_chat_id(telegram_username_or_id)
    if not chat_id:
        clean = str(telegram_username_or_id).lstrip('@')
        return {
            "success": False, 
            "error": f"Could not find Telegram chat for @{clean}. Make sure they started the bot (@FieldFlowApp_bot)."
        }
        
    boundary = uuid.uuid4().hex
    body = bytearray()
    
    # chat_id
    body.extend(f'--{boundary}\r\nContent-Disposition: form-data; name="chat_id"\r\n\r\n{chat_id}\r\n'.encode('utf-8'))
    
    # caption
    if caption:
        body.extend(f'--{boundary}\r\nContent-Disposition: form-data; name="caption"\r\n\r\n{caption}\r\n'.encode('utf-8'))
        body.extend(f'--{boundary}\r\nContent-Disposition: form-data; name="parse_mode"\r\n\r\n{parse_mode}\r\n'.encode('utf-8'))
        
    # inline keyboard button
    if button_text and button_url and button_url.startswith(('http://', 'https://')):
        reply_markup = json.dumps({"inline_keyboard": [[{"text": button_text, "url": button_url}]]})
        body.extend(f'--{boundary}\r\nContent-Disposition: form-data; name="reply_markup"\r\n\r\n{reply_markup}\r\n'.encode('utf-8'))
        
    # photo binary data
    body.extend(f'--{boundary}\r\nContent-Disposition: form-data; name="photo"; filename="invoice.png"\r\nContent-Type: image/png\r\n\r\n'.encode('utf-8'))
    body.extend(photo_bytes)
    body.extend(f'\r\n--{boundary}--\r\n'.encode('utf-8'))
    
    try:
        req = urllib.request.Request(
            f"https://api.telegram.org/bot{token}/sendPhoto",
            data=body,
            headers={'Content-Type': f'multipart/form-data; boundary={boundary}'}
        )
        with urllib.request.urlopen(req, timeout=15) as resp:
            data = json.loads(resp.read().decode('utf-8'))
            return {"success": True, "result": data}
    except Exception as e:
        print(f"[Telegram] Error sending photo: {e}")
        return {"success": False, "error": str(e)}
