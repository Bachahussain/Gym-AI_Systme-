from dotenv import load_dotenv
load_dotenv()
import os
from mistralai.client import Mistral

key = os.getenv("MISTRAL_API_KEY")
print("KEY_SET", bool(key), "LEN", len(key or ""))
client = Mistral(api_key=key)
try:
    models = client.models.list()
    print("MODELS_OK", len(models.data) if hasattr(models, "data") else "ok")
except Exception as e:
    print("ERROR_TYPE", type(e).__name__)
    print("ERROR", repr(e))
