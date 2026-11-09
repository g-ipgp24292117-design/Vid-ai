# PHASE 1 — Analisis Google Drive (Status: SEBAHAGIAN)

Folder: **VID PENGAJARAN BM** (`1q8Z6wypnDg6SOearEPavlyZ3YQg73hYl`) — berjaya diakses dan dimuat turun sepenuhnya.

> Status: senarai fail, durasi, metadata dan analisis visual **selesai**.
> Transkripsi **belum** — kunci API ElevenLabs ditolak (401 Invalid API key). Lihat "Penghalang".

## 1. Senarai fail

| # | Fail | Masa rakam (tag kamera) | Durasi | Resolusi / fps | Saiz |
|---|------|------|-------:|------|-----:|
| 1 | IMG_8232.MOV | 23:24:09 | 4:04.1 | 3840×2160 HEVC 60 | 2.08 GB |
| 2 | IMG_8233.MOV | 23:29:41 | 0:44.7 | 1920×1080 HEVC 59.94 | 0.09 GB |
| 3 | IMG_8235.MOV | 23:34:47 | 4:32.4 | 1920×1080 HEVC 60 | 0.52 GB |
| 4 | IMG_8236.MOV | 23:42:42 | 2:22.8 | 1920×1080 HEVC 60 | 0.27 GB |
| 5 | IMG_8237.MOV | 23:45:28 | 2:32.2 | 1920×1080 HEVC 59.94 | 0.29 GB |
| 6 | IMG_8238.MOV | 23:49:34 | 3:21.0 | 3840×2160 HEVC 60 | 1.92 GB |
| 7 | IMG_8239.MOV | 23:54:16 | 0:31.3 | 3840×2160 HEVC 60 | 0.30 GB |
| 8 | IMG_8241.MOV | 23:55:11 | 3:59.1 | 3840×2160 HEVC 60 | 2.27 GB |
| | **Jumlah** | | **22:07.6** | | 7.75 GB |

Catatan:
- Nombor fail **IMG_8234** dan **IMG_8240** tiada dalam folder (mungkin dipadam / rakaman tersilap / belum dimuat naik).
- Jurang masa antara rakaman: 8233→8235 ≈ 4 min 20 s (sebahagian besar aktiviti sorok kad tidak dirakam), 8235→8236 ≈ 3 min 20 s.
- Satu kamera (iPhone), sudut berubah-ubah; tiada rakaman bertindih dari dua kamera serentak.

## 2. Kandungan setiap rakaman (analisis visual, frame setiap 8 s)

| Fail | Kandungan | Fasa PdP |
|------|-----------|----------|
| IMG_8232 | 0:00–1:28 guru berdiri di hadapan TV, menyapa & berinteraksi dengan murid. ~1:28–1:58 tayangan video panorama malam Kuala Lumpur / **Menara Berkembar PETRONAS** di TV. 2:00–4:04 soal jawab — murid angkat tangan, guru mengaitkan video dengan tajuk. | Set induksi (pelaksanaan) |
| IMG_8233 | Guru mengarahkan murid bergerak; murid mencari kad di sekitar kelas, seorang murid memegang kertas **"STESEN 1"**, close-up murid menemui **kad gambar Menara PETRONAS**; kumpulan berkumpul semula di meja. | Sorok kad mercu tanda (pencarian) |
| IMG_8235 | Slaid **"Menara Berkembar Petronas"** (petikan) di TV; murid memegang lembaran; murid berdiri membaca/menjawab; guru membimbing & menerangkan; murid angkat tangan (~3:44). TV dimatikan pada 4:16. | Sorok kad — membaca petikan & membetulkan kesalahan ayat |
| IMG_8236 | Permainan pada skrin interaktif: soalan ayat (cth. *"Ayah membeli **seekor** kerusi di kedai perabot itu."*) dengan gelembung pilihan *Sebuah / Sebiji / Sehelai*. Kamera komputer riba memaparkan badan murid di belakang gelembung — murid "menembak" jawapan dengan gerakan badan (**AR berasaskan kamera**). Murid bergilir ke hadapan. | Misi Tembak Kata (AR) |
| IMG_8237 | Sudut bertentangan. Murid perempuan di hadapan skrin; soalan *"Saya membaca buku cerita bertajuk sang kancil dengan…"*, pilihan *Kuala Lumpur* dsb. Guru membimbing; selepas itu murid kembali ke meja. | Misi Tembak Kata (AR) |
| IMG_8238 | Soalan *"Ibu memberikan hadiah kepada … Siti. Beliau sangat gembira…"* (pilihan *Mereka / Kami / Saya*), *"Ibu membeli ___ pisang di pasar"* (*Sesikat / Sehelai*). Guru menunjuk skrin, reaksi murid. | Misi Tembak Kata (AR) |
| IMG_8239 | Murid perempuan bersorak/ketawa, menunjuk; murid lain memegang kertas. Konteks perlu disahkan melalui audio. | Misi Tembak Kata (reaksi) — perlu sahkan |
| IMG_8241 | 0:00–2:55 soalan seterusnya (*"Ayah memelihara lima ___ ikan"* — *Batang/Ekor/Helai*; *"Kakak membeli dua helai kasut…"* — *Biji/Batang/Pasang*, Soalan 10/10), murid bersorak. 2:56–3:59 guru bercakap kepada kelas, murid membongkok menulis di meja. | AR (penutup) → **Rumusan & tiket refleksi** |

Pemerhatian pedagogi: fokus bahasa ialah **penjodoh bilangan dan kata ganti nama** dalam ayat — murid mengenal pasti perkataan yang salah dan memilih pembetulan.

## 3. Pemetaan awal ke 10 segmen

| Seg | Tajuk | Sumber rakaman | Rakaman tersedia |
|----:|-------|----------------|-----------------:|
| 01 | Pengenalan diri | **tiada rakaman** | 0:00 |
| 02 | Penerangan set induksi | **tiada rakaman** (boleh guna B-roll 8232 tayangan video) | 0:00 |
| 03 | Pelaksanaan set induksi | IMG_8232 | 4:04 |
| 04 | Penerangan sorok kad | **tiada rakaman** (B-roll 8233) | 0:00 |
| 05 | Pelaksanaan sorok kad | IMG_8233 + IMG_8235 | 5:17 |
| 06 | Penerangan AR | **tiada rakaman** (B-roll 8236) | 0:00 |
| 07 | Penerangan Misi Tembak Kata | **tiada rakaman** (B-roll skrin permainan) | 0:00 |
| 08 | Pelaksanaan AR | IMG_8236, 8237, 8238, 8239, 8241 (0:00–2:55) | 11:42 |
| 09 | Penerangan rumusan & refleksi | **tiada rakaman** | 0:00 |
| 10 | Pelaksanaan rumusan & refleksi | IMG_8241 (2:56–3:59) | ~1:03 |

## 4. Duration breakdown (anggaran)

| Seg | Sasaran prompt | Rakaman sebenar digunakan (anggaran selepas buang jeda kosong) | Grafik / narasi | Anggaran |
|----:|---|---:|---:|---:|
| 01 | 1–2 min | — | 1:30 | 1:30 |
| 02 | 2–3 min | B-roll | 2:30 | 2:30 |
| 03 | 2–3 min | 3:30 | — | 3:30 |
| 04 | 2–3 min | B-roll | 2:30 | 2:30 |
| 05 | 4–5 min | 4:45 | — | 4:45 |
| 06 | 2 min | B-roll | 2:00 | 2:00 |
| 07 | 2–3 min | B-roll | 2:30 | 2:30 |
| 08 | 4–5 min | 8:00–9:30 | — | 8:45 |
| 09 | 2 min | — | 2:00 | 2:00 |
| 10 | 3–4 min | ~1:00 | 0:30 penutup | 1:30 |
| | | **~18–19 min** | **~13 min** | **≈ 29:30** |

**Kesimpulan durasi:** rakaman sebenar hanya 22:08 (kira-kira 18–19 min selepas membuang jeda). Sasaran 25–30 min **hanya boleh dicapai** jika enam segmen "Penerangan" (01, 02, 04, 06, 07, 09) mempunyai sumber suara/penerangan sebenar (~13 min). Tanpa itu, video akan ~21–23 min.

Kekurangan lain: Segmen 10 (rumusan & refleksi) hanya ~1 min rakaman (sasaran 3–4 min); aktiviti sorok kad hanya 45 s rakaman pencarian.

## 5. Penghalang & keputusan diperlukan

1. **Transkripsi** — kunci ElevenLabs yang disimpan ditolak (401). Perlu kunci yang sah dengan kebenaran *Speech to Text*. Alternatif: Whisper tempatan (perlu benarkan hos `huggingface.co`; ketepatan Bahasa Melayu lebih rendah).
2. **Sumber segmen penerangan** — rakam suara/talking-head guru, atau suara AI (ElevenLabs TTS) berdasarkan skrip yang diluluskan, atau teks+grafik sahaja.
3. **Maklumat pengenalan diri** — nama, institut/IPG, sekolah, kelas, tarikh, subjek, tajuk.
4. **IMG_8234 & IMG_8240** — wujud atau tidak?
