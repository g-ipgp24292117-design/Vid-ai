# Misi Detektif Bahasa: Operasi Banci Kesalahan

Video pendidikan Bahasa Melayu Tahun 6 (5:00, 1920×1080, 30 fps) dibina dengan HyperFrames.

| Masa | Babak |
| --- | --- |
| 0:00–0:30 | Pembukaan: bilik penyiasatan, AMARAN, tajuk utama, tiga langkah misi |
| 0:30–4:30 | Lapan kes (30 s setiap satu): fail bukti → bahan → ayat ditaip → imbasan laser merah + kanta pembesar → zum ke kesalahan → label kategori → AYAT SALAH / NOTA DETEKTIF / AYAT BETUL → cop SELESAI |
| 4:30–5:00 | Papan penyiasatan: lapan kes merah → hijau, OPERASI BERJAYA!, BAHASA JIWA BANGSA |

Kes: 01 huruf besar (majalah) · 02 kata sendi nama (papan tanda) · 03 imbuhan (surat rasmi) · 04 kata pemeri (poster) · 05 penjodoh bilangan (risalah) · 06 kelewahan (komik) · 07 kata hubung (keratan akhbar) · 08 kata nafi (pengumuman).

## Struktur

- `build/script.json` — semua teks skrin dan naratif (sunting di sini).
- `build/tts_mms.py` — jana suara narator Bahasa Melayu (Meta MMS-TTS `facebook/mms-tts-zlm`) ke `assets/vo/` dan tempohnya ke `build/vo.json`.
- `build/music.py` — jana muzik latar (MusicGen-small); disambung menjadi `assets/music/bed.m4a`.
- `build/gen.mjs` + `build/materials.mjs` — jana `index.html` dan `compositions/*.html` mengikut tempoh suara sebenar.
- `assets/sfx/` — kesan bunyi (lihat `CREDITS.md`), termasuk `radio-static.mp3` (dijana dengan ffmpeg).

## Bina semula

```bash
HF_HUB_DISABLE_XET=1 python3 build/tts_mms.py   # suara
node build/gen.mjs                              # adegan
npx hyperframes check
npx hyperframes render -o renders/Misi_Detektif_Bahasa.mp4 --quality delivery
```
