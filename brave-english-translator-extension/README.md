# English Page & Image Translator (Brave Extension)

This Brave (Chromium) extension can:

- Translate visible webpage text into English.
- Read text from webpage images (OCR), translate it to English, and place it on top of the image.
- Add a white background behind translated image text to improve readability.

## Install locally in Brave

1. Open `brave://extensions`.
2. Enable **Developer mode**.
3. Click **Load unpacked**.
4. Select the `brave-english-translator-extension` folder.

## How to use

1. Open any webpage.
2. Click the extension icon.
3. Use one of these actions:
   - **Translate Page Text → English**
   - **Translate Image Text → English**
   - **Translate Everything**

## Notes

- Text translation uses the Google Translate public endpoint.
- OCR uses OCR.space free API (`helloworld` demo key), which has rate/size limits.
- Some cross-origin or protected images might not OCR successfully.
