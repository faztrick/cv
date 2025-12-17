import smtplib
import argparse
import os
import getpass
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from email.mime.application import MIMEApplication

def parse_body(file_path):
    """Reads the body file and strips headers like Date:, Subject:, etc."""
    if not os.path.exists(file_path):
        return f"Error: Body file not found at {file_path}"

    with open(file_path, 'r', encoding='utf-8') as f:
        lines = f.readlines()

    body_lines = []
    header_mode = True
    for line in lines:
        if header_mode:
            # Skip header lines and empty lines at the start
            if line.strip() == "" or line.startswith(("Date:", "Subject:", "To:", "From:")):
                continue
            header_mode = False
        body_lines.append(line)
    return "".join(body_lines).strip()

def send_email(to_email, subject, body_file, attachment_path, sender_email, password):
    msg = MIMEMultipart()
    msg['From'] = sender_email
    msg['To'] = to_email
    msg['Subject'] = subject

    print(f"Reading body from: {body_file}")
    body = parse_body(body_file)
    msg.attach(MIMEText(body, 'plain'))

    if attachment_path:
        print(f"Attaching file: {attachment_path}")
        if os.path.exists(attachment_path):
            with open(attachment_path, "rb") as f:
                part = MIMEApplication(f.read(), Name=os.path.basename(attachment_path))
            part['Content-Disposition'] = f'attachment; filename="{os.path.basename(attachment_path)}"'
            msg.attach(part)
        else:
            print(f"Warning: Attachment not found at {attachment_path}")

    print(f"Connecting to SMTP server (smtp.gmail.com:587)...")
    try:
        server = smtplib.SMTP('smtp.gmail.com', 587)
        server.starttls()
        server.login(sender_email, password)
        print(f"Sending email to {to_email}...")
        server.send_message(msg)
        server.quit()
        print("✅ Email sent successfully!")
    except Exception as e:
        print(f"❌ Failed to send email: {e}")
        print("Tip: Ensure you are using an App Password, not your regular Gmail password.")
        print("Generate one at: https://myaccount.google.com/apppasswords")

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Send email with attachment via Gmail SMTP")
    parser.add_argument("--to", required=True, help="Recipient email")
    parser.add_argument("--subject", required=True, help="Email subject")
    parser.add_argument("--body", required=True, help="Path to body text file")
    parser.add_argument("--attachment", help="Path to attachment file")
    default_sender = os.environ.get("GMAIL_SENDER_EMAIL") or "faztrick@gmail.com"
    parser.add_argument("--sender", default=default_sender, help="Sender email")

    args = parser.parse_args()

    password = os.environ.get("GMAIL_APP_PASSWORD")
    if not password:
        print("\n⚠️  Authentication Required")
        print("Please enter your Gmail App Password (hidden input).")
        print("If you don't have one, generate it at: https://myaccount.google.com/apppasswords")
        password = getpass.getpass("Password: ")

    send_email(args.to, args.subject, args.body, args.attachment, args.sender, password)
