import os
import fitz  # PyMuPDF

class PDFServiceError(Exception):
    """Base exception for PDF service errors."""
    pass

class PDFNotFoundError(PDFServiceError, FileNotFoundError):
    """Raised when the PDF file does not exist."""
    pass

class PDFCorruptedError(PDFServiceError):
    """Raised when the PDF file is corrupted."""
    pass

class PDFEncryptedError(PDFServiceError):
    """Raised when the PDF file is encrypted."""
    pass

class PDFEmptyError(PDFServiceError):
    """Raised when the PDF file contains no readable text."""
    pass

def extract_text(pdf_path: str) -> str:
    """
    Opens a PDF file, extracts text page by page, and returns one merged string.
    
    Args:
        pdf_path (str): Path to the PDF file.
        
    Returns:
        str: Merged text content of all pages.
        
    Raises:
        PDFNotFoundError: If the PDF file does not exist.
        PDFEncryptedError: If the PDF is encrypted.
        PDFCorruptedError: If the PDF is corrupted or unreadable.
        PDFEmptyError: If no text can be extracted.
    """
    if not os.path.exists(pdf_path):
        raise PDFNotFoundError(f"PDF file not found at: {pdf_path}")

    try:
        doc = fitz.open(pdf_path)
    except Exception as e:
        raise PDFCorruptedError(f"Corrupted or invalid PDF format: {str(e)}") from e

    try:
        # Check if PDF is encrypted
        if doc.is_encrypted:
            raise PDFEncryptedError("The PDF file is encrypted and cannot be read.")

        extracted_pages = []
        for page in doc:
            page_text = page.get_text()
            if page_text:
                extracted_pages.append(page_text)

        merged_text = "\n".join(extracted_pages).strip()

        if not merged_text:
            raise PDFEmptyError("The PDF file is empty or contains no readable text.")

        return merged_text
    finally:
        doc.close()
