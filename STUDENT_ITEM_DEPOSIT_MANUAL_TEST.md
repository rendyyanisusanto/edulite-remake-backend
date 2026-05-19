# Student Item Deposit - Manual Test

## 0. Setup
1. Jalankan migration: `npx sequelize-cli db:migrate --migrations-path src/migrations --config src/config/database.js`
2. Jalankan seeder: `npx sequelize-cli db:seed:all --seeders-path src/seeders --config src/config/database.js`
3. Pastikan role user login punya permission `student_item_deposit.*` sesuai kebutuhan.
4. Jika kiosk tanpa login, set env backend: `KIOSK_INTERNAL_TOKEN=<token-rahasia>` lalu kirim header `x-kiosk-token` dari perangkat kiosk.

## 1. Admin - Kategori
1. Buka `/student-item-deposits` tab `Kategori`.
2. Pastikan kategori default ada: HP, Laptop, Tablet, Charger, Powerbank, Uang Tunai, Lainnya.
3. Tambah kategori baru dan verifikasi tersimpan.

## 2. Admin - Titip Barang
1. Tab `Barang Dititipkan` -> buat data titipan lewat endpoint/form.
2. Verifikasi `code` format `BT-YYYYMM-0001` dan status awal `DEPOSITED`.
3. Verifikasi class snapshot terisi mengikuti class aktif siswa pada tahun ajaran aktif.

## 3. Kiosk RFID
1. Buka `/kiosk/student-item-deposits`.
2. Scan RFID siswa aktif.
3. Verifikasi muncul data siswa + daftar barang aktif (`DEPOSITED/BORROWED`).
4. Klik `Pinjam Barang`, verifikasi sukses.

## 4. Loan
1. Verifikasi status deposit berubah `BORROWED`.
2. Verifikasi record baru masuk `student_item_loans` status `BORROWED`.
3. Ulang pinjam barang sama -> harus gagal (sudah dipinjam).

## 5. Return Daily
1. Scan RFID siswa lagi di kiosk.
2. Klik `Kembalikan Barang`.
3. Verifikasi loan `returned_at` terisi dan status `RETURNED`.
4. Verifikasi deposit kembali `DEPOSITED`.

## 6. Final Return
1. Dari admin klik `Ambil Permanen`.
2. Verifikasi masuk ke `student_item_final_returns`.
3. Verifikasi status deposit `RETURNED`.
4. Verifikasi barang tidak tampil lagi di kiosk scan.

## 7. Logs
1. Buka detail/log endpoint `/api/v1/student-item-deposits/:id/logs`.
2. Pastikan semua transisi masuk log: `CREATED`, `BORROWED`, `RETURNED_DAILY`, `FINAL_RETURNED`.

## 8. Negative Cases
1. RFID tidak terdaftar -> error `Kartu RFID tidak terdaftar`.
2. Return daily saat status bukan `BORROWED` -> error validasi.
3. Final return saat masih `BORROWED` -> error wajib kembalikan dulu.
4. Cancel saat status bukan `DEPOSITED` -> ditolak.
