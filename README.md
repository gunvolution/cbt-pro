# CBT Exam Management System (CBT-Pro)

Aplikasi manajemen ujian sekolah berbasis CBT dengan pemisahan peran Admin, Pengawas, dan Siswa.

## Fitur Utama
1. **Admin**: Manajemen Kelas, Ruang, Jadwal Sesi, Siswa & Pengawas (bisa Impor CSV), dan Cetak Kartu/Absensi Ruang.
2. **Pengawas**: Monitor ruang ujian, manajemen token ujian, dan rilis/refresh token baru.
3. **Siswa**: Jadwal aktif, input validasi token pengawas, dan countdown timer pengerjaan real-time.

## Format Impor Data Pengguna (.CSV)
Buat file CSV dengan header baris pertama persis seperti ini:
```csv
username,password,full_name,role,class_name,room_name,exam_number
2026003,siswa123,Citra Lestari,student,X-MIPA-1,LAB-KOMP-01,CBT-003
pengawas02,pass123,Rian Ardianto S.Pd,proctor,,LAB-KOMP-02,