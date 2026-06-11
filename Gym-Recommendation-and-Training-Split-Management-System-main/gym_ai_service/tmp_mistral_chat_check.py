from dotenv import load_dotenv
load_dotenv()
import os
from mistralai.client import Mistral

key = os.getenv("MISTRAL_API_KEY")
client = Mistral(api_key=key)
try:
    resp = client.chat.complete(
        model="mistral-small-latest",
        messages=[{"role": "user", "content": "Return only JSON: {\"ok\": true}"}],
        response_format={"type": "json_object"}
    )
    print("CHAT_OK", bool(resp))
    print(str(resp.choices[0].message.content)[:120])
except Exception as e:
    print("ERROR_TYPE", type(e).__name__)
    print("ERROR", repr(e))
