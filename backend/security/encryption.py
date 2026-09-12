import os
import base64
from cryptography.hazmat.primitives.ciphers.aead import AESGCM
from cryptography.exceptions import InvalidTag

KEY_FILE = os.path.join(os.path.dirname(os.path.dirname(__file__)), ".db_encryption.key")

def _get_or_create_key() -> bytes:
    env_key = os.environ.get("DB_ENCRYPTION_KEY")
    if env_key:
        try:
            key = base64.b64decode(env_key)
            if len(key) == 32:
                return key
        except Exception:
            pass
            
    if os.path.exists(KEY_FILE):
        with open(KEY_FILE, "rb") as f:
            return f.read()
            
    # Generate a new 256-bit key
    key = AESGCM.generate_key(bit_length=256)
    try:
        with open(KEY_FILE, "wb") as f:
            f.write(key)
    except Exception:
        pass
    return key

_MASTER_KEY = _get_or_create_key()

def encrypt_password(password: str) -> str:
    if not password:
        return password
        
    aesgcm = AESGCM(_MASTER_KEY)
    nonce = os.urandom(12)
    encrypted_data = aesgcm.encrypt(nonce, password.encode('utf-8'), None)
    
    payload = nonce + encrypted_data
    return base64.b64encode(payload).decode('utf-8')

def decrypt_password(encrypted_password: str) -> str:
    if not encrypted_password:
        return encrypted_password
        
    try:
        payload = base64.b64decode(encrypted_password)
        if len(payload) <= 12:
            return encrypted_password 
            
        nonce = payload[:12]
        encrypted_data = payload[12:]
        
        aesgcm = AESGCM(_MASTER_KEY)
        decrypted_data = aesgcm.decrypt(nonce, encrypted_data, None)
        return decrypted_data.decode('utf-8')
    except Exception:
        # Fallback to plain text in case it was stored before encryption was implemented
        return encrypted_password
