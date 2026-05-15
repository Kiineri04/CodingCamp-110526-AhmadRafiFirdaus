# Dokumen Requirements

## Introduction

Expense & Budget Visualizer adalah web app mobile-friendly untuk melacak pengeluaran harian secara personal. Aplikasi ini memungkinkan pengguna mencatat transaksi pengeluaran, melihat total saldo, menelusuri riwayat transaksi, dan memvisualisasikan distribusi pengeluaran per kategori melalui pie chart interaktif.

Aplikasi dibangun menggunakan HTML, CSS, dan Vanilla JavaScript tanpa framework atau backend server. Semua data disimpan secara lokal di browser menggunakan Local Storage API. Aplikasi harus berjalan di semua modern browser dan dapat digunakan sebagai standalone web app maupun browser extension.

---

## Glosarium

- **Aplikasi**: Expense & Budget Visualizer web app
- **Transaksi**: Satu catatan pengeluaran yang terdiri dari nama item, jumlah, dan kategori
- **Kategori**: Pengelompokan transaksi (contoh: Makanan, Transportasi, Hiburan, atau kategori kustom)
- **Saldo Total**: Jumlah akumulasi seluruh pengeluaran yang tercatat
- **Daftar Transaksi**: Tampilan scrollable seluruh transaksi yang telah ditambahkan
- **Pie Chart**: Grafik lingkaran yang menampilkan distribusi pengeluaran per kategori
- **Batas Pengeluaran**: Nilai ambang batas yang ditetapkan pengguna untuk memicu peringatan visual
- **Ringkasan Bulanan**: Tampilan agregat transaksi yang dikelompokkan per bulan
- **Local_Storage**: Browser Local Storage API yang digunakan untuk menyimpan data secara persisten di sisi klien
- **Form_Input**: Komponen antarmuka untuk memasukkan data transaksi baru
- **Daftar_Transaksi**: Komponen antarmuka yang menampilkan seluruh riwayat transaksi
- **Chart_Visualizer**: Komponen yang merender pie chart distribusi pengeluaran
- **Saldo_Display**: Komponen yang menampilkan total saldo pengeluaran
- **Kategori_Manager**: Komponen yang mengelola daftar kategori termasuk kategori kustom

---

## Requirements

### Requirement 1: Input Transaksi

**User Story:** Sebagai pengguna, saya ingin mengisi form untuk mencatat pengeluaran baru, agar saya dapat melacak setiap transaksi dengan detail yang lengkap.

#### Acceptance Criteria

1. THE Form_Input SHALL menampilkan field Nama Item (teks, maks. 100 karakter), Jumlah (Amount, numerik), dan Kategori (dropdown pilihan yang tersedia) dalam satu form yang dapat diakses dari halaman utama.
2. WHEN pengguna menekan tombol submit, THE Form_Input SHALL memvalidasi bahwa seluruh field (Nama Item, Jumlah > 0, dan Kategori) telah diisi dengan nilai yang valid sebelum memproses transaksi.
3. IF salah satu field kosong atau tidak valid saat submit, THEN THE Form_Input SHALL menampilkan pesan kesalahan yang menyebutkan nama field yang bermasalah dan alasan kegagalan validasinya.
4. WHEN semua field terisi dengan nilai valid dan pengguna menekan tombol submit, THE Form_Input SHALL menambahkan transaksi baru ke Daftar_Transaksi dan menyimpannya ke Local_Storage.
5. WHEN transaksi berhasil ditambahkan, THE Form_Input SHALL mengosongkan seluruh field dan mengembalikan dropdown Kategori ke pilihan default agar siap untuk input berikutnya.
6. WHEN pengguna mengetik karakter non-numerik pada field Jumlah, THE Form_Input SHALL mencegah karakter tersebut ditampilkan pada field secara langsung tanpa menunggu submit.
7. IF nilai yang dimasukkan pada field Jumlah melebihi 999.999.999,99, THEN THE Form_Input SHALL menampilkan pesan kesalahan dan menolak input tersebut saat submit.

---

### Requirement 2: Daftar Transaksi

**User Story:** Sebagai pengguna, saya ingin melihat seluruh riwayat transaksi dalam daftar yang dapat di-scroll, agar saya dapat meninjau dan mengelola catatan pengeluaran saya.

#### Acceptance Criteria

1. THE Daftar_Transaksi SHALL menampilkan seluruh transaksi yang tersimpan, masing-masing menampilkan Nama Item, Jumlah (diformat sebagai mata uang), dan Kategori.
2. WHILE tinggi konten daftar transaksi melebihi tinggi area tampilan yang tersedia, THE Daftar_Transaksi SHALL dapat di-scroll secara vertikal untuk menampilkan semua item.
3. WHEN pengguna menekan tombol hapus pada sebuah transaksi, THE Daftar_Transaksi SHALL menghapus transaksi tersebut dari tampilan dan dari Local_Storage tanpa memuat ulang halaman, dan memperbarui Saldo_Display serta Chart_Visualizer secara otomatis.
4. IF penghapusan dari Local_Storage gagal, THEN THE Daftar_Transaksi SHALL menampilkan pesan kesalahan kepada pengguna dan membatalkan penghapusan dari tampilan sehingga data tetap konsisten.
5. WHEN tidak ada transaksi yang tersimpan di Local_Storage, THE Daftar_Transaksi SHALL menampilkan pesan "Belum ada transaksi. Tambahkan pengeluaran pertama Anda." sebagai pengganti daftar kosong.
6. WHEN daftar transaksi kosong akibat hasil filter atau pengurutan yang tidak menghasilkan data, THE Daftar_Transaksi SHALL menampilkan pesan "Tidak ada transaksi yang sesuai dengan filter yang dipilih." sebagai pengganti daftar kosong.

---

### Requirement 3: Tampilan Saldo Total

**User Story:** Sebagai pengguna, saya ingin melihat total pengeluaran saya di bagian atas halaman, agar saya dapat memantau akumulasi pengeluaran secara sekilas.

#### Acceptance Criteria

1. THE Saldo_Display SHALL menampilkan jumlah total seluruh pengeluaran yang tercatat di bagian paling atas halaman utama.
2. WHEN transaksi baru ditambahkan atau transaksi yang ada diubah, THE Saldo_Display SHALL memperbarui nilai total secara otomatis tanpa memuat ulang halaman.
3. WHEN sebuah transaksi dihapus, THE Saldo_Display SHALL memperbarui nilai total secara otomatis untuk mencerminkan penghapusan tersebut.
4. THE Saldo_Display SHALL memformat nilai total menggunakan format mata uang Rupiah Indonesia: simbol "Rp" diikuti nilai dengan pemisah ribuan titik dan dua angka desimal dipisahkan koma (contoh: Rp 1.250.000,00).
5. WHEN tidak ada transaksi yang tersimpan, THE Saldo_Display SHALL menampilkan nilai "Rp 0,00" sebagai kondisi awal.
6. THE Saldo_Display SHALL selalu menampilkan nilai total sebagai angka non-negatif; jika hasil kalkulasi menghasilkan nilai negatif karena alasan apapun, nilai yang ditampilkan adalah Rp 0,00.

---

### Requirement 4: Visualisasi Chart Pengeluaran

**User Story:** Sebagai pengguna, saya ingin melihat pie chart distribusi pengeluaran per kategori, agar saya dapat memahami pola pengeluaran saya secara visual.

#### Acceptance Criteria

1. WHEN terdapat minimal satu transaksi tersimpan, THE Chart_Visualizer SHALL menampilkan pie chart yang memvisualisasikan proporsi pengeluaran untuk setiap kategori yang memiliki transaksi.
2. WHEN transaksi baru ditambahkan atau dihapus, THE Chart_Visualizer SHALL memperbarui pie chart secara otomatis dalam waktu kurang dari 1 detik untuk mencerminkan data terbaru.
3. WHEN semua transaksi dihapus sehingga tidak ada data yang dapat divisualisasikan, THE Chart_Visualizer SHALL menggantikan chart dengan pesan placeholder "Tidak ada data untuk ditampilkan." tanpa segmen chart apapun.
4. THE Chart_Visualizer SHALL menampilkan label dan legenda yang mengidentifikasi setiap kategori beserta persentase pengeluarannya terhadap total keseluruhan.
5. WHEN tidak ada transaksi yang tersimpan saat halaman pertama kali dimuat, THE Chart_Visualizer SHALL menampilkan pesan placeholder "Tidak ada data untuk ditampilkan." sebagai kondisi awal tanpa segmen chart apapun.

---

### Requirement 5: Persistensi Data

**User Story:** Sebagai pengguna, saya ingin data transaksi saya tetap tersimpan setelah menutup atau me-refresh browser, agar saya tidak kehilangan catatan pengeluaran saya.

#### Acceptance Criteria

1. WHEN pengguna menambahkan transaksi baru, THE Aplikasi SHALL menyimpan data transaksi tersebut ke Local_Storage sebelum respons UI berikutnya dirender.
2. WHEN pengguna membuka atau me-refresh halaman, THE Aplikasi SHALL memuat seluruh data transaksi dari Local_Storage dan menampilkannya di Daftar_Transaksi.
3. WHEN pengguna menghapus sebuah transaksi, THE Aplikasi SHALL menghapus data transaksi tersebut dari Local_Storage sebelum respons UI berikutnya dirender.
4. WHEN pengguna menambahkan kategori kustom baru, THE Aplikasi SHALL menyimpan data kategori tersebut ke Local_Storage sebelum respons UI berikutnya dirender.
5. WHEN pengguna membuka atau me-refresh halaman, THE Aplikasi SHALL memuat data kategori kustom dari Local_Storage sehingga kategori yang dibuat pengguna tetap tersedia di Form_Input.
6. IF Local_Storage tidak tersedia atau data yang tersimpan rusak (tidak dapat di-parse sebagai JSON valid), THEN THE Aplikasi SHALL memulai dengan state kosong (daftar transaksi kosong, kategori bawaan saja) dan menampilkan pesan peringatan kepada pengguna bahwa data sebelumnya tidak dapat dimuat.

---

### Requirement 6: Kategori Kustom

**User Story:** Sebagai pengguna, saya ingin menambahkan kategori pengeluaran sendiri di luar kategori bawaan, agar saya dapat menyesuaikan pelacakan pengeluaran dengan kebutuhan saya.

#### Acceptance Criteria

1. THE Kategori_Manager SHALL menyediakan kategori bawaan: Makanan, Transportasi, dan Hiburan yang selalu tersedia dan tidak dapat dihapus.
2. THE Kategori_Manager SHALL menyediakan antarmuka bagi pengguna untuk menambahkan kategori kustom baru dengan nama yang ditentukan sendiri, dengan panjang nama maksimal 50 karakter.
3. WHEN pengguna menambahkan kategori kustom, THE Kategori_Manager SHALL menampilkan kategori tersebut sebagai pilihan di dropdown Form_Input secara langsung.
4. WHEN pengguna menambahkan kategori kustom, THE Kategori_Manager SHALL menyimpan kategori tersebut ke Local_Storage sebelum respons UI berikutnya dirender.
5. IF pengguna mencoba menambahkan kategori dengan nama yang sudah ada (perbandingan case-insensitive setelah trim whitespace), THEN THE Kategori_Manager SHALL menampilkan pesan kesalahan "Kategori sudah ada." dan menolak penambahan duplikat.
6. IF pengguna mencoba menambahkan kategori dengan nama kosong atau hanya berisi whitespace, THEN THE Kategori_Manager SHALL menampilkan pesan kesalahan "Nama kategori tidak boleh kosong." dan menolak input tersebut.
7. IF jumlah kategori kustom yang tersimpan telah mencapai 20 kategori, THEN THE Kategori_Manager SHALL menampilkan pesan kesalahan "Batas maksimal kategori kustom (20) telah tercapai." dan menolak penambahan kategori baru.

---

### Requirement 7: Ringkasan Bulanan

**User Story:** Sebagai pengguna, saya ingin melihat ringkasan pengeluaran yang dikelompokkan per bulan, agar saya dapat menganalisis tren pengeluaran dari waktu ke waktu.

#### Acceptance Criteria

1. THE Aplikasi SHALL menyediakan tampilan Ringkasan Bulanan yang mengelompokkan transaksi berdasarkan bulan dan tahun pencatatan, diurutkan dari bulan terbaru ke terlama.
2. WHEN pengguna membuka tampilan Ringkasan Bulanan, THE Aplikasi SHALL menampilkan total pengeluaran untuk setiap bulan yang memiliki transaksi.
3. WHEN pengguna membuka tampilan Ringkasan Bulanan dan tidak ada transaksi yang tersimpan, THE Aplikasi SHALL menampilkan pesan "Belum ada data ringkasan bulanan." sebagai kondisi kosong.
4. WHEN pengguna menambahkan transaksi, THE Aplikasi SHALL menyimpan timestamp ISO 8601 (tanggal dan waktu lokal) pada data transaksi tersebut untuk keperluan pengelompokan bulanan.
5. WHEN pengguna memilih bulan tertentu di Ringkasan Bulanan, THE Aplikasi SHALL menampilkan daftar transaksi yang termasuk dalam bulan tersebut, masing-masing menampilkan Nama Item, Jumlah, Kategori, dan tanggal transaksi.

---

### Requirement 8: Pengurutan Transaksi

**User Story:** Sebagai pengguna, saya ingin mengurutkan daftar transaksi berdasarkan jumlah atau kategori, agar saya dapat menemukan dan menganalisis transaksi dengan lebih mudah.

#### Acceptance Criteria

1. THE Daftar_Transaksi SHALL menyediakan opsi pengurutan: Jumlah Terkecil (ascending), Jumlah Terbesar (descending), dan Kategori A–Z (alfabetis ascending berdasarkan nama kategori).
2. WHEN pengguna memilih opsi pengurutan, THE Daftar_Transaksi SHALL menampilkan ulang seluruh transaksi sesuai urutan yang dipilih dalam waktu kurang dari 200ms.
3. WHEN transaksi baru ditambahkan saat opsi pengurutan aktif, THE Daftar_Transaksi SHALL menyisipkan transaksi baru tersebut pada posisi yang sesuai dengan urutan yang sedang aktif.
4. THE Daftar_Transaksi SHALL menampilkan indikator visual berupa highlight atau tanda aktif pada tombol/opsi pengurutan yang sedang dipilih, berbeda secara visual dari opsi yang tidak aktif.
5. WHEN halaman pertama kali dimuat, THE Daftar_Transaksi SHALL menampilkan transaksi dalam urutan default: berdasarkan waktu penambahan terbaru ke terlama (descending by timestamp), tanpa indikator pengurutan aktif pada opsi manapun.

---

### Requirement 9: Peringatan Batas Pengeluaran

**User Story:** Sebagai pengguna, saya ingin menetapkan batas pengeluaran dan mendapatkan peringatan visual ketika pengeluaran melebihi batas tersebut, agar saya dapat mengelola anggaran dengan lebih disiplin.

#### Acceptance Criteria

1. THE Aplikasi SHALL menyediakan antarmuka bagi pengguna untuk menetapkan nilai Batas Pengeluaran berupa angka positif dalam satuan Rupiah dengan nilai maksimal 999.999.999,99.
2. IF pengguna memasukkan nilai Batas Pengeluaran yang tidak valid (nol, negatif, non-numerik, atau melebihi batas maksimal), THEN THE Aplikasi SHALL menampilkan pesan kesalahan yang menjelaskan aturan nilai yang valid dan menolak penyimpanan nilai tersebut.
3. WHILE total pengeluaran mencapai atau melebihi Batas Pengeluaran yang ditetapkan, THE Saldo_Display SHALL menampilkan indikator peringatan yang secara visual berbeda dari tampilan normal (misalnya warna teks atau latar berubah menjadi merah) sehingga perbedaan tersebut dapat diidentifikasi secara objektif.
4. WHEN pengguna menetapkan atau mengubah Batas Pengeluaran dengan nilai valid, THE Aplikasi SHALL menyimpan nilai tersebut ke Local_Storage dan langsung mengevaluasi ulang kondisi peringatan terhadap total pengeluaran saat ini.
5. WHEN pengguna membuka halaman, THE Aplikasi SHALL memuat Batas Pengeluaran dari Local_Storage dan menampilkan atau menyembunyikan indikator peringatan berdasarkan perbandingan total pengeluaran saat ini dengan Batas Pengeluaran yang dimuat.
6. IF Batas Pengeluaran belum ditetapkan atau bernilai nol, THEN THE Aplikasi SHALL tidak menampilkan indikator peringatan apapun pada Saldo_Display.

---

### Requirement 10: Mode Gelap dan Terang

**User Story:** Sebagai pengguna, saya ingin dapat beralih antara mode gelap dan mode terang, agar saya dapat menggunakan aplikasi dengan nyaman di berbagai kondisi pencahayaan.

#### Acceptance Criteria

1. THE Aplikasi SHALL menyediakan tombol toggle yang selalu terlihat di halaman utama untuk beralih antara mode gelap (dark mode) dan mode terang (light mode).
2. WHEN pengguna menekan tombol toggle mode, THE Aplikasi SHALL menerapkan tema yang dipilih ke seluruh elemen antarmuka dalam waktu kurang dari 100ms tanpa memuat ulang halaman.
3. WHEN pengguna menekan tombol toggle mode, THE Aplikasi SHALL menyimpan preferensi mode yang baru dipilih ke Local_Storage sebelum respons UI berikutnya dirender.
4. WHEN pengguna membuka atau me-refresh halaman, THE Aplikasi SHALL membaca preferensi mode dari Local_Storage dan menerapkan tema yang tersimpan sebelum konten halaman dirender untuk mencegah flash of unstyled content.
5. IF tidak ada preferensi mode yang tersimpan di Local_Storage, THEN THE Aplikasi SHALL menerapkan mode terang sebagai tampilan default.
6. WHEN mode gelap aktif, THE Aplikasi SHALL menampilkan latar belakang gelap dengan teks terang pada seluruh elemen antarmuka; WHEN mode terang aktif, THE Aplikasi SHALL menampilkan latar belakang terang dengan teks gelap pada seluruh elemen antarmuka.

---

### Requirement 11: Kompatibilitas dan Responsivitas

**User Story:** Sebagai pengguna, saya ingin menggunakan aplikasi di berbagai perangkat dan browser modern, agar saya dapat mencatat pengeluaran kapan saja dan di mana saja.

#### Acceptance Criteria

1. THE Aplikasi SHALL berjalan dengan benar (tanpa error JavaScript yang memblokir fungsionalitas) di browser Chrome, Firefox, Edge, dan Safari versi terbaru yang dirilis dalam 12 bulan terakhir.
2. THE Aplikasi SHALL menampilkan layout yang responsif dan dapat digunakan dengan nyaman pada layar dengan lebar minimal 320px (perangkat mobile) hingga lebar 1920px (layar desktop), tanpa overflow horizontal yang tidak disengaja.
3. THE Aplikasi SHALL dapat dijalankan sebagai standalone web app langsung dari file `index.html` lokal menggunakan protokol `file://` tanpa memerlukan server backend atau build step apapun.
4. THE Aplikasi SHALL menyelesaikan pemuatan seluruh antarmuka dan data dari Local_Storage dalam waktu kurang dari 3 detik pada perangkat dengan koneksi jaringan standar (untuk memuat CDN) dan hardware kelas menengah.
5. THE Aplikasi SHALL merespons setiap interaksi pengguna (klik tombol, input form, pemilihan dropdown) dengan pembaruan UI yang terlihat dalam waktu kurang dari 200ms.

---

### Requirement 12: Struktur Kode dan Aset

**User Story:** Sebagai developer, saya ingin struktur file proyek yang bersih dan terorganisir, agar kode mudah dipelihara dan dikembangkan lebih lanjut.

#### Acceptance Criteria

1. THE Aplikasi SHALL menggunakan tepat satu file CSS yang ditempatkan di dalam direktori `css/`.
2. THE Aplikasi SHALL menggunakan tepat satu file JavaScript yang ditempatkan di dalam direktori `js/`.
3. THE Aplikasi SHALL dibangun menggunakan HTML, CSS, dan Vanilla JavaScript tanpa menggunakan framework JavaScript seperti React, Vue, atau Angular.
4. THE Aplikasi SHALL menggunakan library Chart.js yang dimuat melalui CDN untuk keperluan visualisasi pie chart.
5. THE Aplikasi SHALL memiliki file `index.html` di root direktori proyek sebagai titik masuk (entry point) utama aplikasi.
