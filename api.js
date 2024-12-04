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
            <title>Image Upscaler</title>
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
                button {
                    margin: 5px;
                    padding: 10px 20px;
                    font-size: 16px;
                    cursor: pointer;
                }
            </style>
        </head>
        <body>
            <h1>Upload and Upscale Image</h1>
            <form id="uploadForm" enctype="multipart/form-data">
                <input type="file" id="imageInput" name="image" accept="image/*" required />
                <div>
                    <button type="button" data-resolution="4K">Upscale to 4K</button>
                    <button type="button" data-resolution="8K">Upscale to 8K</button>
                    <button type="button" data-resolution="10K">Upscale to 10K</button>
                </div>
            </form>
            <h2>Result:</h2>
            <p id="blobLink"></p>
            <img id="resultImage" alt="Upscaled Image" />
            <script>
                const form = document.getElementById('uploadForm');
                const resultImage = document.getElementById('resultImage');
                const blobLink = document.getElementById('blobLink');
                const buttons = document.querySelectorAll('button[data-resolution]');

                buttons.forEach(button => {
                    button.onclick = async (e) => {
                        const resolution = e.target.getAttribute('data-resolution');
                        const formData = new FormData(form);
                        formData.append('resolution', resolution);

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
                });
            </script>
        </body>
        </html>
    `);
});

// Dosya yükleme ve işleme
app.post('/upload', upload.single('image'), async (req, res) => {
    try {
        const resolution = req.body.resolution;
        let width, height;

        // Çözünürlük değerlerini belirle
        if (resolution === '4K') {
            width = 3840;
            height = 2160;
        } else if (resolution === '8K') {
            width = 7680;
            height = 4320;
        } else if (resolution === '10K') {
            width = 10240;
            height = 5760;
        } else {
            return res.status(400).send('Invalid resolution');
        }

        const buffer = await sharp(req.file.buffer)
            .resize(width, height)
            .toFormat('png')
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
