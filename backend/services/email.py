import os
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart

def send_password_reset_email(to_email: str, reset_link: str):
    smtp_host = os.getenv("SMTP_HOST")
    smtp_port = os.getenv("SMTP_PORT")
    smtp_username = os.getenv("SMTP_USERNAME")
    smtp_password = os.getenv("SMTP_PASSWORD")
    from_email = os.getenv("SMTP_FROM_EMAIL", "noreply@aidb.example.com")
    from_name = os.getenv("SMTP_FROM_NAME", "AIDB Admin")

    if not all([smtp_host, smtp_port, smtp_username, smtp_password]):
        print(f"\n{'='*50}\n[DEV] PASSWORD RESET EMAIL\nTO: {to_email}\nLINK: {reset_link}\n{'='*50}\n")
        return

    msg = MIMEMultipart()
    msg['From'] = f"{from_name} <{from_email}>"
    msg['To'] = to_email
    msg['Subject'] = "Reset your AIDB password"

    body = f"""Hello,

You requested a password reset. Click the link below to reset your password:

{reset_link}

If you did not request this, please ignore this email.

Thanks,
The AIDB Team
"""
    msg.attach(MIMEText(body, 'plain'))

    try:
        server = smtplib.SMTP(smtp_host, int(smtp_port))
        server.starttls()
        server.login(smtp_username, smtp_password)
        server.send_message(msg)
        server.quit()
    except Exception as e:
        print(f"Error sending email: {e}")
