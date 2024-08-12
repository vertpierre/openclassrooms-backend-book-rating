const fs = require('fs');
const path = require('path');
const request = require('supertest');
const express = require('express');
const imageMiddleware = require('../../middleware/image');

describe('Image Middleware Test', () => {
  const app = express();
  app.use(imageMiddleware);
  app.post('/upload', (req, res) => {
    res.json({ filename: req.file.filename });
  });

  const testImagePath = path.join(__dirname, '..', 'src', 'image.jpg');
  const outputDir = path.join(__dirname, '..', 'images');

  beforeAll(() => {
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir);
    }
  });

  afterAll(() => {
    const files = fs.readdirSync(outputDir);
    for (const file of files) {
      if (file.includes('image.jpg')) {
        fs.unlinkSync(path.join(outputDir, file));
      }
    }
  });

  it('should upload and optimize image', async () => {
    const response = await request(app)
      .post('/upload')
      .attach('image', testImagePath);

    expect(response.status).toBe(200);
    expect(response.body.filename.endsWith('.webp')).toBe(true);

    const outputPath = path.join(outputDir, response.body.filename);
    expect(fs.existsSync(outputPath)).toBe(true);

    const stats = fs.statSync(outputPath);
    expect(stats.size).toBeLessThan(fs.statSync(testImagePath).size);
  });

  it('should reject non-image files', async () => {
    const textFilePath = path.join(__dirname, '..', 'src', 'test.txt');
    fs.writeFileSync(textFilePath, 'This is a test file');

    const response = await request(app)
      .post('/upload')
      .attach('image', textFilePath);

    expect(response.status).toBe(500);

    fs.unlinkSync(textFilePath);
  });
});