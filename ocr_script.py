import sys
import easyocr
import json
import traceback

def extract_text(image_path):
    try:
        reader = easyocr.Reader(['en'], gpu=False)  # Disable GPU unless needed
        result = reader.readtext(image_path, detail=0)
        return ' '.join(result)
    except Exception as e:
        print(f"[OCR Error] Failed during text extraction: {str(e)}", file=sys.stderr)
        traceback.print_exc(file=sys.stderr)
        return ""

if __name__ == "__main__":
    try:
        if len(sys.argv) < 2:
            raise ValueError("No image path provided.")

        image_path = sys.argv[1]
        print(f"[INFO] Starting OCR for: {image_path}", file=sys.stderr)

        extracted_text = extract_text(image_path)
        output = {'extractedText': extracted_text}
        print(json.dumps(output))

    except Exception as e:
        print(f"[Script Error] {str(e)}", file=sys.stderr)
        traceback.print_exc(file=sys.stderr)
        print(json.dumps({'error': str(e)}))
