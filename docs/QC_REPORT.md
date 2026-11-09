# Laporan Quality Control — DOKUMENTASI_PENGAJARAN_BAHASA_MELAYU_FINAL.mp4

Semua angka di bawah **diukur** pada fail akhir (ffprobe / ffmpeg). Audio tidak didengar oleh manusia; kualiti bunyi disemak melalui pengukuran.

## Fail
| Perkara | Nilai |
|---|---|
| Durasi | **25:22.1** (1522.1 s) — melepasi minimum 25:00 |
| Video | H.264 High@4.0, yuv420p, 1920×1080, 30 fps, 45 663 frame (sepadan dengan EDL, setiap 16 bahagian disahkan frame demi frame) |
| Audio | AAC-LC 48 kHz stereo 192 kb/s |
| Saiz | 1.03 GB; dihantar dalam 3 bahagian < 400 MiB (00:00–08:30, 08:30–16:58, 16:58–25:22) |
| Preview | `PREVIEW_720p_DOKUMENTASI_PENGAJARAN_BAHASA_MELAYU.mp4`, 1280×720, 165 MB, satu fail |

## Semakan
| Semakan | Keputusan |
|---|---|
| Boleh dibuka | Nyahkod penuh tanpa sebarang ralat (`ffmpeg -v error … -f null`) bagi fail akhir, preview dan setiap bahagian; faststart untuk main serta-merta |
| Skrin hitam tidak disengajakan (blackdetect ≥0.25 s) | **Tiada.** Satu-satunya hitam: pudar penutup 0.67 s terakhir (disengajakan) |
| Audio terputus (silencedetect −45 dB ≥1 s) | **Tiada** |
| Kenyaringan keseluruhan | −16.4 LUFS, puncak −3.3 dBFS |
| Kenyaringan dialog (S03/S05/S08/S10) | −14.8 hingga −16.0 LUFS — suara guru & murid dominan |
| Kenyaringan grafik (S01/S02/S04/S06/S07/S09/penutup) | −20.1 hingga −21.6 LUFS (muzik + SFX, sengaja di bawah dialog) |
| Susunan 10 segmen | Betul: S01→S10 mengikut struktur prompt |
| Jeda janggal & ulangan | Setiap jurang pertuturan ≥2.5 s disemak dengan gambar; ~1:53 dibuang (menunggu, berjalan, bacaan Soalan 8 yang diulang tiga kali, sembang berulang). Aktiviti sebenar dikekalkan |
| Kelancaran potongan | 11 potongan dalam syot: dissolve video 0.4 s + crossfade audio equal-power; pertukaran kamera: dip 0.2 s; 11 dissolve disemak frame demi frame |
| Footage berulang | Tiada. Setiap saat rakaman digunakan sekali sahaja (B-roll dalam grafik ialah petikan pendek, senyap, sebagai ilustrasi penerangan) |
| Dialog penting terpotong | Tiada — potongan hanya di hujung/permulaan fail; setiap fail rakaman PdP dikekalkan hampir penuh |
| Grafik menutup wajah | 32 label disemak satu-satu pada frame sebenar; 6 dialihkan ke kanan; 1 label (close-up murid ketawa di IMG_8239) digugurkan kerana kedua-dua sisi menutup wajah; kad Soalan 8 dipindahkan ke saat guru menerangkan jawapan supaya tidak menutup TV |
| Ejaan | Semua teks pada skrin disemak (Bahasa Melayu baku) |
| Peralihan | 15 sempadan potong disemak (frame ±0.6 s): tiada kilatan atau frame salah |

## Had yang perlu diketahui
- **Tiada narasi** (Pilihan C). Segmen penerangan menggunakan teks, motion graphics, B-roll sebenar dan muzik.
- **Muzik latar dijana secara tempatan (MusicGen small)**: enam klip 20 s yang digelung dengan crossfade. Kualitinya sederhana dan tidak didengar oleh manusia. Untuk muzik berkualiti studio, log masuk HeyGen (`npx hyperframes auth login`) atau sediakan trek sendiri dan jalankan semula `scripts/assemble.py audio mux`.
- **Transkrip** dihasilkan dengan Whisper tempatan (kunci ElevenLabs ditolak). Ia digunakan untuk titik potong dan storyboard sahaja, tidak dipaparkan sebagai sari kata.
- Soalan 5 permainan tidak dirakam, jadi tiada kad untuknya. Semua soalan lain yang dirakam mempunyai kad.
- IMG_8234 dan IMG_8240 tiada dalam folder Drive.
