# Laporan Quality Control — DOKUMENTASI_PENGAJARAN_BAHASA_MELAYU_FINAL.mp4

Semua angka di bawah **diukur** pada fail akhir (ffprobe / ffmpeg). Audio tidak didengar oleh manusia; kualiti bunyi disemak melalui pengukuran.

## Fail
| Perkara | Nilai |
|---|---|
| Durasi | **27:15.4** (1635.4 s) — melepasi minimum 25:00 |
| Video | H.264 High, 1920×1080, 30 fps, 49 062 frame (sepadan dengan EDL, setiap 16 bahagian disahkan frame demi frame) |
| Audio | AAC 48 kHz stereo 192 kb/s |
| Saiz | 1.14 GB (≈ 5.6 Mb/s) |
| Preview | `PREVIEW_720p_DOKUMENTASI_PENGAJARAN_BAHASA_MELAYU.mp4`, 1280×720, 189 MB |

## Semakan
| Semakan | Keputusan |
|---|---|
| Skrin hitam tidak disengajakan (blackdetect ≥0.25 s) | **Tiada.** Satu-satunya hitam: pudar penutup 0.67 s terakhir (disengajakan) |
| Audio terputus (silencedetect −45 dB ≥1 s) | **Tiada** |
| Kenyaringan keseluruhan | −16.4 LUFS, puncak −1.5 dBFS |
| Kenyaringan dialog (S03/S05/S08/S10) | −14.8 hingga −16.0 LUFS — suara guru & murid dominan |
| Kenyaringan grafik (S01/S02/S04/S06/S07/S09/penutup) | −20.1 hingga −21.6 LUFS (muzik + SFX, sengaja di bawah dialog) |
| Susunan 10 segmen | Betul: S01→S10 mengikut struktur prompt |
| Footage berulang | Tiada. Setiap saat rakaman digunakan sekali sahaja (B-roll dalam grafik ialah petikan pendek, senyap, sebagai ilustrasi penerangan) |
| Dialog penting terpotong | Tiada — potongan hanya di hujung/permulaan fail; setiap fail rakaman PdP dikekalkan hampir penuh |
| Grafik menutup wajah | 31 label disemak satu-satu pada frame sebenar; 6 dialihkan ke kanan, 2 digugurkan kerana kedua-dua sisi menutup wajah/soalan di TV |
| Ejaan | Semua teks pada skrin disemak (Bahasa Melayu baku) |
| Peralihan | 15 sempadan potong disemak (frame ±0.6 s): tiada kilatan atau frame salah |

## Had yang perlu diketahui
- **Tiada narasi** (Pilihan C). Segmen penerangan menggunakan teks, motion graphics, B-roll sebenar dan muzik.
- **Muzik latar dijana secara tempatan (MusicGen small)**: enam klip 20 s yang digelung dengan crossfade. Kualitinya sederhana dan tidak didengar oleh manusia. Untuk muzik berkualiti studio, log masuk HeyGen (`npx hyperframes auth login`) atau sediakan trek sendiri dan jalankan semula `scripts/assemble.py audio mux`.
- **Transkrip** dihasilkan dengan Whisper tempatan (kunci ElevenLabs ditolak). Ia digunakan untuk titik potong dan storyboard sahaja, tidak dipaparkan sebagai sari kata.
- **Nama guru** dipaparkan sebagai "Guru Pelatih" kerana nama tidak diberikan. Tukar pemboleh ubah `teacher_name` dalam `graphics/index.html` (atau melalui HyperFrames Studio), kemudian render semula S01.
- Soalan 5 permainan tidak dirakam, jadi tiada kad untuknya. Soalan 8 tidak diberi kad kerana label akan menutup soalan di TV (ayat dan jawapannya kekal jelas dalam rakaman).
- IMG_8234 dan IMG_8240 tiada dalam folder Drive.
