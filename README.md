# Vid-ai — Dokumentasi Pengajaran Bahasa Melayu

Video dokumentari PdP Bahasa Melayu (set induksi PETRONAS → sorok kad mercu tanda → AR → Misi Tembak Kata → rumusan),
27:15, dibina daripada 8 rakaman Google Drive dengan HyperFrames + FFmpeg.

- `docs/STORYBOARD.md`: storyboard 10 segmen
- `docs/TIMELINE.md`: timeline penuh dan ringkasan durasi setiap segmen
- `docs/QC_REPORT.md`: keputusan quality control
- `graphics/`: projek HyperFrames boleh sunting (7 adegan penerangan; nama guru = pemboleh ubah `teacher_name`)
- `overlays/`: projek HyperFrames untuk label pada rakaman (satu komposisi, pemboleh ubah per label)
- `scripts/plan.py`: sumber tunggal EDL, label, muzik dan SFX

## Jana semula

```bash
./scripts/setup.sh
./scripts/fetch_footage.sh          # muat turun 8 rakaman ke footage/
./scripts/make_broll.sh             # B-roll untuk graphics/
python3 scripts/plan.py             # edl.json, overlays/batch.json, docs/TIMELINE.md
./scripts/render_labels.sh          # 30 label telus (WebM)
python scripts/assemble.py          # gfx → clips → audio → mux → preview  (perlu numpy + soundfile)
```

Muzik latar dibaca dari `footage/edit/music/<mood>.wav` (intro, induksi, treasure, ar, game, reflection).
Output: `output/DOKUMENTASI_PENGAJARAN_BAHASA_MELAYU_FINAL.mp4` dan preview 720p.

Toolchain: HyperFrames (`npx hyperframes`), FFmpeg, yt-dlp (`npx hyperframes doctor` untuk semak persekitaran).
