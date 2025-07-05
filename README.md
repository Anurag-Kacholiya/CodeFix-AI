# CodeFix-AI
Developed a VS Code extension using the OpenAI API for AI-assisted debugging. Extract errors from the terminal using OCR, analyze them using GPT, and provide precise error reasoning and solutions, enhancing developer productivity. Technologies used: OpenAI API, OCR, Node.js, REST API, JSON, NPM

# Terminal Error Solution

The **Terminal Error Solution** extension for Visual Studio Code helps detect terminal errors in real-time and suggests possible solutions powered by GPT. 

## Features

- **Capture Terminal Screenshot**: Allows you to take a screenshot of the terminal and process it for errors.
- **OCR Processing**: Extracts text from terminal screenshots and identifies potential errors.
- **GPT-Powered Solutions**: Automatically queries OpenAI's GPT for possible solutions to terminal errors and displays them in VS Code.

## Installation

1. Download the `.vsix` file from the [Release page](#).
2. Open VS Code.
3. Go to the Extensions view (`Ctrl+Shift+X` or `Cmd+Shift+X` on macOS).
4. Click the three dots in the top-right corner of the Extensions view and select "Install from VSIX..."
5. Choose the `.vsix` file and click "Open" to install the extension.

Alternatively, you can use the following steps to install directly from source:

```bash
git clone https://github.com/your-username/terminal-error-solution.git
cd terminal-error-solution
npm install
vsce package
