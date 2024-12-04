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
                .button-group {
                    margin-top: 20px;
                }
            </style>
        </head>
        <body>
            <h1>Upload and Upscale Image</h1>
            <form id="uploadForm" enctype="multipart/form-data">
                <input type="file" id="imageInput" name="image" accept="image/*" required />
                <button type="submit">Upload Image</button>
            </form>

            <div class="button-group">
                <button id="4kButton">Upscale to 4K</button>
                <button id="8kButton">Upscale to 8K</button>
                <button id="10kButton">Upscale to 10K</button>
            </div>

            <h2>Result:</h2>
            <p id="blobLink"></p>
            <img id="resultImage" alt="Upscaled Image" />
            
            <script>
                const form = document.getElementById('uploadForm');
                const resultImage = document.getElementById('resultImage');
                const blobLink = document.getElementById('blobLink');
                let imageBuffer = null;

                form.onsubmit = async (e) => {
                    e.preventDefault();
                    const formData = new FormData(form);
                    const response = await fetch('/upload', {
                        method: 'POST',
                        body: formData,
                    });
                    imageBuffer = await response.blob();

                    // Blob URL oluştur ve sonucu göster
                    const blobUrl = URL.createObjectURL(imageBuffer);
                    blobLink.innerHTML = \`<a href="\${blobUrl}" target="_blank">Download Image</a>\`;
                    resultImage.src = blobUrl;
                };

                // Butonlara event listener ekle
                document.getElementById('4kButton').addEventListener('click', () => upscaleImage(3840, 2160));
                document.getElementById('8kButton').addEventListener('click', () => upscaleImage(7680, 4320));
                document.getElementById('10kButton').addEventListener('click', () => upscaleImage(10240, 5760));

                // Seçilen çözünürlüğe göre resmi yeniden boyutlandır
                async function upscaleImage(width, height) {
                    if (!imageBuffer) {
                        alert('Please upload an image first!');
                        return;
                    }

                    const formData = new FormData();
                    formData.append('image', imageBuffer);

                    const response = await fetch('/uploadUpscale', {
                        method: 'POST',
                        body: JSON.stringify({ width, height }),
                        headers: {
                            'Content-Type': 'application/json',
                        },
                    });

                    const blob = await response.blob();
                    const blobUrl = URL.createObjectURL(blob);
                    blobLink.innerHTML = \`<a href="\${blobUrl}" target="_blank">Download Image</a>\`;
                    resultImage.src = blobUrl;
                }
            </script>
        </body>
        </html>
    `);
});

// Dosya yükleme ve işleme
app.post('/upload', upload.single('image'), async (req, res) => {
    try {
        // İlk işlem: Resim boyutunu artırma
        const buffer = await sharp(req.file.buffer)
            .resize(3840, 2160) // Varsayılan olarak 4K boyutlarına ölçekle
            .toFormat('png') // PNG formatında dönüştür
            .toBuffer();

        res.set('Content-Type', 'image/png');
        res.send(buffer); // İşlenmiş görüntüyü gönder
    } catch (error) {
        console.error(error);
        res.status(500).send('Error processing image.');
    }
});

// Yeni işleme isteği (Farklı çözünürlükler için)
app.post('/uploadUpscale', async (req, res) => {
    try {
        const { width, height } = req.body;
        const buffer = await sharp(req.body.buffer)
            .resize(width, height) // Kullanıcının seçtiği çözünürlük
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
