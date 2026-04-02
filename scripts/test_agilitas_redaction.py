import sys
import os
import logging

# Ensure project root is in path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '../services/agilitas-ai-core/redaction/')))

from presidio_redactor import get_redactor

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def test_agilitas_redaction():
    # Synthetic transcript with multiple PII types
    transcript = """
    Customer Service Transcript (Synthetic)
    Agent: Good morning, this is Sarah from Agilitas. Who am I speaking with?
    Customer: Hello Sarah, this is John Doe. I'm calling about my account ending in 1234.
    Agent: Thank you, Mr. Doe. Can you please confirm your email address and SSN for verification?
    Customer: Sure, my email is john.doe82@gmail.com and my SSN is 123-45-6789.
    Agent: Perfect. And just to confirm your address for our records?
    Customer: I live at 1234 Maple Avenue, Seattle, WA 98101. You can also reach me at 206-555-0123.
    Agent: Got it. How can I help you today?
    """

    logger.info("Initializing redactor...")
    redactor = get_redactor()
    
    logger.info(f"Using redactor type: {type(redactor).__name__}")

    logger.info("Original Transcript:")
    logger.info("-" * 40)
    logger.info(transcript)
    logger.info("-" * 40)

    logger.info("Redacted Transcript:")
    logger.info("-" * 40)
    redacted_text = redactor.redact(transcript)
    logger.info(redacted_text)
    logger.info("-" * 40)

    # Verification checks
    pii_indicators = ["John Doe", "john.doe82@gmail.com", "123-45-6789", "1234 Maple Avenue", "206-555-0123"]
    
    leaks = [pii for pii in pii_indicators if pii in redacted_text]
    
    if leaks:
        logger.error(f"FAILURE: PII leaked into redacted text: {leaks}")
    else:
        logger.info("SUCCESS: No PII detected in redacted text.")

    # Check for placeholder markers (assuming Presidio was active)
    if "PERSON" in redacted_text or "EMAIL_ADDRESS" in redacted_text or "SSN" in redacted_text:
        logger.info("Verified: Redaction placeholders present.")
    elif "PresidioRedactor" in type(redactor).__name__:
        logger.warning("No placeholders found even though Presidio was used. Check analyzer settings.")

if __name__ == "__main__":
    test_agilitas_redaction()
