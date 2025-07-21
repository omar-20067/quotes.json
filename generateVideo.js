const fs = require('fs');
const path = require('path');
const ffmpeg = require('fluent-ffmpeg');
const axios = require('axios');
const { v4: uuidv4 } = require('uuid');

// تحميل البيانات
const quotes = JSON.parse(fs.readFileSync(path.join(__dirname, 'quotes.json')));
const videos = JSON.parse(fs.readFileSync(path.join(__dirname, 'videos.json')));

// اختيار عشوائي
const quote = quotes[Math.floor(Math.random() * quotes.length)];
const video = videos[Math.floor(Math.random() * videos.length)];

const outputName = `output-${uuidv4()}.mp4`;
const inputPath = path.join(__dirname, 'temp.mp4');

// تحميل الفيديو
async function downloadVideo() {
  const writer = fs.createWriteStream(inputPath);
  const response = await axios({
    url: video.video_url,
    method: 'GET',
    responseType: 'stream'
  });
  response.data.pipe(writer);
  return new Promise((resolve, reject) => {
    writer.on('finish', resolve);
    writer.on('error', reject);
  });
}

// إنشاء الفيديو بالاقتباس
async function generateVideo() {
  await downloadVideo();

  return new Promise((resolve, reject) => {
    ffmpeg(inputPath)
      .videoCodec('libx264')
      .outputOptions('-preset veryfast')
      .complexFilter([
        `[0:v]drawtext=text='${quote.quote_ar}':fontfile=/path/to/arabic-font.ttf:fontsize=36:fontcolor=white:x=(w-text_w)/2:y=H/3:box=1:boxcolor=black@0.5:boxborderw=10`,
        `[0:v]drawtext=text='${quote.quote_en}':fontfile=/path/to/english-font.ttf:fontsize=28:fontcolor=white:x=(w-text_w)/2:y=H/3+50:box=1:boxcolor=black@0.5:boxborderw=10`
      ])
      .output(outputName)
      .on('end', () => {
        fs.unlinkSync(inputPath); // حذف الفيديو المؤقت
        resolve(outputName);
      })
      .on('error', reject)
      .run();
  });
}

generateVideo().then(output => {
  console.log('✅ Video created:', output);
}).catch(err => {
  console.error('❌ Error generating video:', err);
});
