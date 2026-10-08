import sharp from "sharp";
const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><rect width="512" height="512" fill="#070a12"/><g fill="none" stroke="#00f0ff" stroke-width="22" stroke-linecap="round"><circle cx="256" cy="256" r="140"/><path d="M256 116c-70 80-70 200 0 280M256 116c70 80 70 200 0 280M116 256h280" stroke="#ff2bd6"/></g></svg>`;
for (const s of [192, 512]) await sharp(Buffer.from(svg)).resize(s, s).png().toFile(`public/icon-${s}.png`);
