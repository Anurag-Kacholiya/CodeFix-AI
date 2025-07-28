import * as vscode from 'vscode';
import screenshotDesktop from 'screenshot-desktop';
import sharp from 'sharp';
import * as path from 'path';
import * as fs from 'fs';
const { PythonShell } = require('python-shell');

import axios, { AxiosResponse } from 'axios';

export function activate(context: vscode.ExtensionContext) {
    console.log('✅ Extension "terminal-error-solution" is now active!');

    const disposable = vscode.commands.registerCommand('extension.captureTerminalScreenshot', async () => {
        vscode.window.showInformationMessage('✅ Command triggered: Starting screenshot and OCR process...');

        try {
            // Capture the screenshot
            const imageBuffer = await screenshotDesktop();
            vscode.window.showInformationMessage('📸 Screenshot captured successfully.');

            const image = sharp(imageBuffer);
            const metadata = await image.metadata();

            if (!metadata || !metadata.width || !metadata.height) {
                throw new Error('Failed to retrieve valid image metadata.');
            }

            console.log('Image Metadata:', metadata);

            const x = 820;
            const y = 1180;
            const width = 2880;
            const height = 1800;

            const validX = Math.min(x, metadata.width - 1);
            const validY = Math.min(y, metadata.height - 1);
            const validWidth = Math.min(width, metadata.width - validX);
            const validHeight = Math.min(height, metadata.height - validY);

            const croppedImageBuffer = await sharp(imageBuffer)
                .extract({ left: validX, top: validY, width: validWidth, height: validHeight })
                .toBuffer();

            console.log('📸 Cropped screenshot to the defined region.');

            // Ensure the 'dist' directory exists before saving the image
            const distDir = 'D:/Projects/terminal-error-solution/dist'; // Direct path to dist
            if (!fs.existsSync(distDir)) {
                fs.mkdirSync(distDir, { recursive: true });
            }

            const tempImagePath = path.join(distDir, 'temp_image.png'); // Corrected path for saving the image
            fs.writeFileSync(tempImagePath, croppedImageBuffer);
            console.log(`📸 Image saved to: ${tempImagePath}`);

            const extractedText = await runOCR(tempImagePath);
            console.log('🧠 Extracted Text:', extractedText);

            if (extractedText) {
                vscode.window.showInformationMessage(`📝 OCR Extracted Text:\n${extractedText.slice(0, 200)}...`);
            } else {
                vscode.window.showInformationMessage('❌ No text extracted from the screenshot.');
            }

            try {
                const solution = await fetchGPTSolution(extractedText);
                const finalMsg = solution || '⚠️ No useful suggestion received from GPT.';
                vscode.window.showInformationMessage(`💡 GPT Suggestion:\n${finalMsg}`);
            } catch (err: any) {
                vscode.window.showErrorMessage(`❌ GPT Error: ${err.message || err}`);
            }

        } catch (err: unknown) {
            if (err instanceof Error) {
                vscode.window.showErrorMessage(`❌ OCR Error: ${err.message || err}`);
            } else {
                vscode.window.showErrorMessage('❌ Unknown OCR Error');
            }
        }
    });

    context.subscriptions.push(disposable);
}

async function runOCR(imagePath: string): Promise<string> {
    return new Promise<string>((resolve, reject) => {
        const scriptPath = path.join(__dirname, 'scripts', 'ocr_script.py');

        const shell = new PythonShell(scriptPath, {
            pythonPath: 'C:/Program Files/Python313',
            pythonOptions: ['-u'],
            args: [imagePath],
            timeout: 60000,  // Set timeout to 60 seconds
        });

        let output = '';
        let errorOutput = '';

        shell.stdout?.on('data', (data: string) => {
            output += data;
        });

        shell.stderr?.on('data', (data: string) => {
            // Ignore the "Starting OCR for" and "Using CPU" messages
            if (data.includes("Starting OCR for:") || data.includes("Using CPU. Note: This module is much faster with a GPU.")) {
                return; // Ignore these informational messages
            }
            errorOutput += data;
        });

        shell.end((err: any) => {
            if (err || errorOutput) {
                console.error('❌ OCR Script stderr or Error:', errorOutput || err);
                reject(errorOutput || err.message || 'Unknown OCR error');
                return;
            }

            try {
                const result = JSON.parse(output.trim());
                const extractedText = result?.extractedText || '';
                resolve(extractedText);
            } catch (parseError: any) {
                console.error('❌ Failed to parse OCR result:', parseError, output);
                reject(`Failed to parse OCR output: ${parseError.message}`);
            }
        });
    });
}


async function fetchGPTSolution(errorMessage: string): Promise<string> {
    const apiKey = 'add your OpenAI API key here'; // Replace with your actual OpenAI API key
    const url = 'https://api.openai.com/v1/chat/completions';

    try {
        const response: AxiosResponse = await axios.post(
            url,
            {
                model: 'gpt-3.5-turbo',
                messages: [
                    { role: 'system', content: 'You are a helpful assistant that explains and fixes terminal errors.' },
                    { role: 'user', content: `Suggest a fix for this terminal output:\n${errorMessage}` },
                ],
                max_tokens: 2000,
                temperature: 0.5,
            },
            {
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${apiKey}`,
                },
            }
        );

        const gptReply = response.data?.choices?.[0]?.message?.content?.trim();
        console.log('🧠 GPT Response:', gptReply);
        return gptReply || '⚠️ No useful suggestion received from GPT.';
    } catch (err: any) {
        console.error('❌ GPT Error:', err.response?.data || err.message);
        throw new Error('Error fetching GPT suggestion');
    }
}

export function deactivate() {}
