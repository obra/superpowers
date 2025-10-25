#!/usr/bin/env python3
"""
Email Delivery System
=====================

Handles sending filled templates via email with support for multiple delivery methods.
"""

import os
import smtplib
import ssl
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from email.mime.application import MIMEApplication
from typing import Dict, List, Optional, Any, Union
from dataclasses import dataclass
import json

@dataclass
class EmailAttachment:
    """Represents an email attachment."""
    filename: str
    content: bytes
    content_type: str = "application/octet-stream"

@dataclass
class EmailConfig:
    """Email configuration settings."""
    smtp_host: str
    smtp_port: int
    username: str
    password: str
    use_tls: bool = True
    sender_email: Optional[str] = None
    sender_name: Optional[str] = None

@dataclass
class EmailRequest:
    """Represents an email delivery request."""
    to_address: Union[str, List[str]]
    subject: str
    html_content: Optional[str] = None
    text_content: Optional[str] = None
    cc_addresses: Optional[List[str]] = None
    bcc_addresses: Optional[List[str]] = None
    attachments: Optional[List[EmailAttachment]] = None

@dataclass
class EmailResult:
    """Result of an email delivery attempt."""
    success: bool
    message_id: Optional[str] = None
    error_message: Optional[str] = None
    delivery_details: Optional[Dict[str, Any]] = None

class EmailDeliverer:
    """Handles email delivery via multiple methods."""

    def __init__(self, config: Optional[EmailConfig] = None):
        """
        Initialize email deliverer.

        Args:
            config: Email configuration. If None, uses environment variables or prompts.
        """
        self.config = config or self._load_config_from_env()
        self._validate_config()

    def _load_config_from_env(self) -> EmailConfig:
        """Load email configuration from environment variables."""
        return EmailConfig(
            smtp_host=os.getenv('SMTP_HOST', 'smtp.gmail.com'),
            smtp_port=int(os.getenv('SMTP_PORT', '587')),
            username=os.getenv('SMTP_USERNAME', ''),
            password=os.getenv('SMTP_PASSWORD', ''),
            use_tls=os.getenv('SMTP_USE_TLS', 'true').lower() == 'true',
            sender_email=os.getenv('SENDER_EMAIL'),
            sender_name=os.getenv('SENDER_NAME', 'Claude Skills System')
        )

    def _validate_config(self):
        """Validate email configuration."""
        required = ['smtp_host', 'username', 'password']
        missing = [field for field in required if not getattr(self.config, field)]

        if missing:
            raise ValueError(f"Missing required email config: {missing}")

        if not self.config.sender_email:
            self.config.sender_email = self.config.username

    def send_email(self, request: EmailRequest) -> EmailResult:
        """
        Send an email with the specified content and attachments.

        Args:
            request: Email request details

        Returns:
            EmailResult indicating success/failure
        """
        try:
            # Create message
            msg = self._create_message(request)

            # Send via SMTP
            return self._send_via_smtp(msg, request)

        except Exception as e:
            return EmailResult(
                success=False,
                error_message=f"Email delivery failed: {str(e)}"
            )

    def _create_message(self, request: EmailRequest) -> MIMEMultipart:
        """Create MIME message from request."""
        msg = MIMEMultipart('alternative')

        # Set sender
        sender_name = self.config.sender_name or "Claude Skills"
        from_addr = f"{sender_name} <{self.config.sender_email}>"
        msg['From'] = from_addr

        # Set recipients
        if isinstance(request.to_address, list):
            msg['To'] = ', '.join(request.to_address)
            to_list = request.to_address
        else:
            msg['To'] = request.to_address
            to_list = [request.to_address]

        # Add CC/BCC
        all_recipients = to_list.copy()
        if request.cc_addresses:
            msg['Cc'] = ', '.join(request.cc_addresses)
            all_recipients.extend(request.cc_addresses)
        if request.bcc_addresses:
            all_recipients.extend(request.bcc_addresses)

        # Set subject
        msg['Subject'] = request.subject

        # Add content
        if request.text_content:
            msg.attach(MIMEText(request.text_content, 'plain'))

        if request.html_content:
            msg.attach(MIMEText(request.html_content, 'html'))

        # Add attachments
        if request.attachments:
            for attachment in request.attachments:
                part = MIMEApplication(attachment.content)
                part.add_header('Content-Disposition',
                              f'attachment; filename="{attachment.filename}"')
                part.add_header('Content-Type', attachment.content_type)
                msg.attach(part)

        return msg

    def _send_via_smtp(self, message: MIMEMultipart, request: EmailRequest) -> EmailResult:
        """Send message via SMTP."""
        try:
            # Create SMTP connection
            if self.config.use_tls:
                context = ssl.create_default_context()
                server = smtplib.SMTP(self.config.smtp_host, self.config.smtp_port)
                server.starttls(context=context)
            else:
                server = smtplib.SMTP_SSL(self.config.smtp_host, self.config.smtp_port)

            # Login
            server.login(self.config.username, self.config.password)

            # Prepare recipients
            recipients = []
            if isinstance(request.to_address, list):
                recipients.extend(request.to_address)
            else:
                recipients.append(request.to_address)

            if request.cc_addresses:
                recipients.extend(request.cc_addresses)
            if request.bcc_addresses:
                recipients.extend(request.bcc_addresses)

            # Send message
            if not self.config.sender_email:
                raise ValueError("Sender email not configured")

            server.sendmail(
                self.config.sender_email,
                recipients,
                message.as_string()
            )

            server.quit()

            return EmailResult(
                success=True,
                message_id=f"smtp-{hash(message.as_string()):08x}",
                delivery_details={
                    'method': 'smtp',
                    'recipients': len(recipients),
                    'subject': request.subject
                }
            )

        except smtplib.SMTPAuthenticationError:
            return EmailResult(
                success=False,
                error_message="SMTP authentication failed. Check username/password."
            )
        except smtplib.SMTPConnectError:
            return EmailResult(
                success=False,
                error_message="Could not connect to SMTP server."
            )
        except Exception as e:
            return EmailResult(
                success=False,
                error_message=f"SMTP error: {str(e)}"
            )

    def send_template_email(self, to_address: Union[str, List[str]],
                           subject: str, html_content: str,
                           attachments: Optional[List[EmailAttachment]] = None) -> EmailResult:
        """
        Convenience method for sending template HTML emails.

        Args:
            to_address: Recipient email(s)
            subject: Email subject
            html_content: Filled HTML template content
            attachments: Optional file attachments

        Returns:
            Email delivery result
        """
        request = EmailRequest(
            to_address=to_address,
            subject=subject,
            html_content=html_content,
            attachments=attachments
        )

        return self.send_email(request)

    def send_batch_emails(self, email_requests: List[EmailRequest]) -> List[EmailResult]:
        """
        Send multiple emails in batch.

        Args:
            email_requests: List of email requests

        Returns:
            List of email results (one per request)
        """
        results = []
        for request in email_requests:
            result = self.send_email(request)
            results.append(result)

            # Small delay between emails to avoid rate limits
            import time
            time.sleep(0.5)

        return results


# API-based email services (future extensions)

class SendGridDeliverer(EmailDeliverer):
    """Email delivery via SendGrid API."""

    def __init__(self, api_key: str):
        self.api_key = api_key

    def send_email(self, request: EmailRequest) -> EmailResult:
        # SendGrid API implementation would go here
        # For now, return mock success
        return EmailResult(success=True, message_id="sendgrid-mock")

class SESDeliverer(EmailDeliverer):
    """Email delivery via Amazon SES."""

    def __init__(self, access_key: str, secret_key: str, region: str = 'us-east-1'):
        self.access_key = access_key
        self.secret_key = secret_key
        self.region = region

    def send_email(self, request: EmailRequest) -> EmailResult:
        # AWS SES implementation would go here
        return EmailResult(success=True, message_id="ses-mock")


# Utility functions

def create_attachment_from_file(file_path: str) -> EmailAttachment:
    """
    Create email attachment from file path.

    Args:
        file_path: Path to file to attach

    Returns:
        EmailAttachment object
    """
    with open(file_path, 'rb') as f:
        content = f.read()

    filename = os.path.basename(file_path)

    # Guess content type based on extension
    import mimetypes
    content_type, _ = mimetypes.guess_type(file_path)
    if not content_type:
        content_type = "application/octet-stream"

    return EmailAttachment(
        filename=filename,
        content=content,
        content_type=content_type
    )

def create_config_interactive() -> EmailConfig:
    """
    Create email configuration interactively.

    Returns:
        EmailConfig object
    """
    print("📧 Email Configuration Setup")
    print("=" * 40)

    smtp_host = input("SMTP Host (e.g., smtp.gmail.com): ").strip()
    smtp_port = int(input("SMTP Port (587 for TLS): ").strip())
    username = input("SMTP Username (usually your email): ").strip()
    password = input("SMTP Password (may need app password): ").strip()
    use_tls = input("Use TLS? (y/n): ").strip().lower() == 'y'
    sender_email = input("Sender Email: ").strip() or username
    sender_name = input("Sender Name: ").strip()

    return EmailConfig(
        smtp_host=smtp_host,
        smtp_port=smtp_port,
        username=username,
        password=password,
        use_tls=use_tls,
        sender_email=sender_email,
        sender_name=sender_name
    )

def test_email_config(config: EmailConfig) -> bool:
    """
    Test email configuration by sending a test email.

    Args:
        config: Email configuration to test

    Returns:
        True if test successful
    """
    deliverer = EmailDeliverer(config)

    # Ensure we have a sender email for testing
    if not config.sender_email:
        raise ValueError("Sender email not configured for testing")

    test_request = EmailRequest(
        to_address=config.sender_email,  # Send to self
        subject="Email Configuration Test",
        text_content="This is a test email to verify your email configuration."
    )

    result = deliverer.send_email(test_request)
    return result.success


if __name__ == "__main__":
    # Interactive setup and testing
    print("🧪 Email Deliverer Setup and Test")

    config = create_config_interactive()

    print("\n🔧 Testing configuration...")
    if test_email_config(config):
        print("✅ Email configuration is working!")
        print("You can now use the email deliverer in your Claude skills.")
    else:
        print("❌ Email configuration failed. Please check your settings.")
        print("Common issues:")
        print("- Gmail: Enable 2FA and use App Password")
        print("- Port: 587 for TLS, 465 for SSL, 25 for plain")
        print("- Firewall: Ensure SMTP ports are not blocked")

    # Save config for future use (optional)
    save_config = input("\nSave configuration for future use? (y/n): ").strip().lower() == 'y'
    if save_config:
        config_file = ".email_config.json"
        with open(config_file, 'w') as f:
            json.dump({
                'smtp_host': config.smtp_host,
                'smtp_port': config.smtp_port,
                'username': config.username,
                'use_tls': config.use_tls,
                'sender_email': config.sender_email,
                'sender_name': config.sender_name
            }, f, indent=2)
        print(f"✅ Configuration saved to {config_file}")
        print("⚠️  Remember to set SMTP_PASSWORD environment variable!")
