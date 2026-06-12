
import smtplib
import argparse
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText

def send_email(subject, to_addr, body_text, html_file):
    sender = "steve.andrew@3dlifestrategies.org"

    # Load HTML content
    with open(html_file, "r", encoding="utf-8") as f:
        html_content = f.read()

    # Build MIME message
    msg = MIMEMultipart("alternative")
    msg["From"] = sender
    msg["To"] = to_addr
    msg["Subject"] = subject

    # Attach plain text + HTML
    msg.attach(MIMEText(body_text, "plain"))
    msg.attach(MIMEText(html_content, "html"))

    # Send via Google Workspace SMTP
    with smtplib.SMTP_SSL("smtp.gmail.com", 465) as server:
        server.login(sender, "ajqenueirlzjpvdc")
        server.sendmail(sender, to_addr, msg.as_string())

    print("Email sent.")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Send HTML email via SMTP")
    parser.add_argument("-s", "--subject", required=True, help="Email subject")
    parser.add_argument("-t", "--to", required=True, help="Recipient email")
    parser.add_argument("-b", "--body", default="Your email client does not support HTML.",
                        help="Plain text fallback body")
    parser.add_argument("-a", "--html", required=True, help="Path to HTML file")
    args = parser.parse_args()

    send_email(args.subject, args.to, args.body, args.html)



