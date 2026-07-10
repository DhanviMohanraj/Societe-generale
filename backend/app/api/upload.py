import os
from fastapi import APIRouter, File, UploadFile, HTTPException, status
import fitz  # PyMuPDF

router = APIRouter()

# Max file size: 10MB
MAX_FILE_SIZE = 10 * 1024 * 1024
UPLOAD_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "uploads"))

@router.post("/upload", status_code=status.HTTP_200_OK)
async def upload_file(file: UploadFile = File(...)):
    """
    Uploads a PDF file, validating that it is a valid, non-empty PDF
    within the size limit (10MB), and stores it in the uploads/ directory.
    """
    # 1. Check if a file was actually provided
    if not file or not file.filename:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Empty request: No file was uploaded."
        )

    # 2. Check file extension and MIME type
    if not file.filename.lower().endswith(".pdf"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid file type: Only PDF files are accepted."
        )

    # Note: Sometimes browser/client content types can be empty or generic.
    # We will check if it matches PDF when provided, but rely on PyMuPDF validation.
    if file.content_type and file.content_type != "application/pdf":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid file type: Content-Type must be application/pdf."
        )

    # 3. Read the file content
    try:
        content = await file.read()
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Failed to read upload data: {str(e)}"
        )

    file_size = len(content)

    # 4. Check for empty file
    if file_size == 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Empty request: The uploaded file is empty (0 bytes)."
        )

    # 5. Check size limit
    if file_size > MAX_FILE_SIZE:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail=f"File too large: File size exceeds the {MAX_FILE_SIZE // (1024 * 1024)}MB limit."
        )

    # 6. Validate PDF structure using PyMuPDF
    try:
        doc = fitz.open(stream=content, filetype="pdf")
        # Ensure we can retrieve basic document properties or page count
        _ = doc.page_count
        doc.close()
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid PDF: The file is corrupted or not a valid PDF. Details: {str(e)}"
        )

    # 7. Save file to the uploads/ directory
    try:
        os.makedirs(UPLOAD_DIR, exist_ok=True)
        file_path = os.path.join(UPLOAD_DIR, file.filename)
        with open(file_path, "wb") as f:
            f.write(content)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to save the file locally: {str(e)}"
        )

    return {
        "message": "Upload Successful",
        "filename": file.filename
    }
