const express = require('express');
const multer = require('multer');
const sharp = require('sharp');

const app = express();
const port = 3000;

// Multer ile dosya yükleme yapılandırması (hafızada tut)
const upload = multer({ storage: multer.memoryStorage() });

// Ana sayfa (HTML formu)
app.get('/', (req, res) => {
    res.send(`
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>4K Image Upscaler</title>
            <style>
                body {
                    font-family: Arial, sans-serif;
                    text-align: center;
                    margin: 20px;
                }
                img {
                    max-width: 100%;
                    height: auto;
                    margin-top: 20px;
                }
            </style>
        </head>
        <body>
            <h1>Upload and Upscale Image to 4K</h1>
            <form id="uploadForm" enctype="multipart/form-data">
                <input type="file" id="imageInput" name="image" accept="image/*" required />
                <button type="submit">Upload and Process</button>
            </form>
            <h2>Result:</h2>
            <p id="blobLink"></p>
            <img id="resultImage" alt="Upscaled Image" />
            <script>
                const form = document.getElementById('uploadForm');
                const resultImage = document.getElementById('resultImage');
                const blobLink = document.getElementById('blobLink');

                form.onsubmit = async (e) => {
                    e.preventDefault();

                    const formData = new FormData(form);
                    const response = await fetch('/upload', {
                        method: 'POST',
                        body: formData,
                    });

                    const blob = await response.blob();

                    // Blob URL oluştur ve sonucu göster
                    const blobUrl = URL.createObjectURL(blob);
                    blobLink.innerHTML = \`<a href="\${blobUrl}" target="_blank">Download Image</a>\`;
                    resultImage.src = blobUrl;
                };
            </script>
        </body>
        </html>
    `);
});

// Dosya yükleme ve işleme
app.post('/upload', upload.single('image'), async (req, res) => {
    try {
        const buffer = await sharp(req.file.buffer)
            .resize(3840, 2160) // 4K boyutlarına ölçekle
            .toFormat('png') // PNG formatında dönüştür
            .toBuffer();

        res.set('Content-Type', 'image/png');
        res.send(buffer); // İşlenmiş görüntüyü gönder
    } catch (error) {
        console.error(error);
        res.status(500).send('Error processing image.');
    }
});

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});
