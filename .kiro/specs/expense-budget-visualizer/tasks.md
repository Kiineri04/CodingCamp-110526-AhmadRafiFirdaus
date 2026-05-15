# Rencana Implementasi: Expense & Budget Visualizer

## Ikhtisar

Implementasi aplikasi web Expense & Budget Visualizer menggunakan HTML, CSS, dan Vanilla JavaScript murni. Arsitektur menggunakan pola Observer/Event-Driven dengan State Store terpusat. Semua kode JavaScript berada dalam satu file `js/app.js`, satu file CSS di `css/style.css`, dan entry point `index.html` di root.

## Tugas

- [x] 1. Buat struktur file proyek dan kerangka HTML
  - Buat file `index.html` di root dengan struktur HTML5 lengkap
  - Sertakan tag `<link>` untuk `css/style.css` dan tag `<script>` untuk Chart.js via CDN serta `js/app.js`
  - Buat elemen-elemen HTML untuk semua komponen: form input, daftar transaksi, saldo display, chart container, ringkasan bulanan, kategori manager, budget alert, dan tombol toggle tema
  - Buat file `css/style.css` kosong dan file `js/app.js` kosong
  - _Requirements: 12.1, 12.2, 12.3, 12.4, 12.5_

- [x] 2. Implementasi StorageService dan EventBus
  - [x] 2.1 Implementasi `StorageService` di `js/app.js`
    - Tulis fungsi `isAvailable()` untuk mengecek ketersediaan Local Storage
    - Tulis fungsi `save(key, data)` yang menyimpan data sebagai JSON ke Local Storage dan mengembalikan `Result`
    - Tulis fungsi `load(key)` yang memuat dan mem-parse JSON dari Local Storage, mengembalikan `ok(null)` jika key tidak ada, dan `err` jika JSON rusak
    - Tulis fungsi `remove(key)` yang menghapus key dari Local Storage dan mengembalikan `Result`
    - Definisikan konstanta `STORAGE_KEYS` dengan key: `ebv_transactions`, `ebv_categories`, `ebv_budget_limit`, `ebv_theme`
    - Implementasikan helper `ok(value)` dan `err(error)` untuk pola Result
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6_

  - [ ]* 2.2 Tulis property test untuk StorageService (Properti 6)
    - **Properti 6: Round-trip persistensi transaksi ke Local Storage**
    - **Memvalidasi: Requirements 5.1, 5.2, 5.3**
    - Gunakan `fc.record` untuk generate transaksi valid, simpan lalu muat kembali, verifikasi semua field identik

  - [ ]* 2.3 Tulis unit test untuk StorageService
    - Test muat data valid, data JSON rusak, dan Local Storage tidak tersedia
    - _Requirements: 5.6_

  - [x] 2.4 Implementasi `EventBus` di `js/app.js`
    - Tulis fungsi `subscribe(event, callback)` untuk mendaftarkan listener
    - Tulis fungsi `unsubscribe(event, callback)` untuk menghapus listener
    - Tulis fungsi `emit(event, data)` untuk memancarkan event ke semua listener terdaftar
    - _Requirements: (arsitektur internal)_

- [x] 3. Implementasi AppStore (State Management)
  - [x] 3.1 Implementasi struktur state dan inisialisasi `AppStore`
    - Definisikan state awal: `transactions: []`, `categories` (3 kategori bawaan), `budgetLimit: 0`, `sortOrder: 'default'`, `theme: 'light'`
    - Tulis fungsi `getState()` yang mengembalikan salinan state saat ini
    - Tulis fungsi `loadFromStorage()` yang memuat semua data dari Local Storage menggunakan `StorageService`, menangani error dengan menampilkan banner peringatan dan menggunakan state default
    - _Requirements: 5.2, 5.5, 5.6, 6.1_

  - [x] 3.2 Implementasi `addTransaction` dan `deleteTransaction` di `AppStore`
    - Tulis fungsi `addTransaction(item)` yang memvalidasi input, membuat objek `Transaction` dengan UUID v4 dan timestamp ISO 8601, menyimpan ke Local Storage, memperbarui state, dan memancarkan `state:changed`
    - Tulis fungsi `deleteTransaction(id)` yang menghapus transaksi dari state dan Local Storage, memancarkan `state:changed`, dan mengembalikan error jika penghapusan dari storage gagal
    - _Requirements: 1.4, 2.3, 2.4, 5.1, 5.3, 7.4_

  - [ ]* 3.3 Tulis property test untuk addTransaction (Properti 1)
    - **Properti 1: Penambahan transaksi valid memperbesar daftar tepat satu**
    - **Memvalidasi: Requirements 1.4, 2.1**
    - Gunakan `fc.array(validTransactionArb)` dan `validTransactionArb` untuk memverifikasi panjang daftar bertambah tepat 1

  - [ ]* 3.4 Tulis property test untuk deleteTransaction (Properti 3)
    - **Properti 3: Penghapusan transaksi mengurangi daftar tepat satu**
    - **Memvalidasi: Requirements 2.3**
    - Gunakan `fc.array(validTransactionArb, { minLength: 1 })` dan index acak untuk memverifikasi panjang berkurang tepat 1 dan ID tidak ditemukan lagi

  - [x] 3.5 Implementasi `addCategory`, `setBudgetLimit`, `setSortOrder`, dan `setTheme` di `AppStore`
    - Tulis `addCategory(name)` yang memvalidasi nama (non-kosong, ≤ 50 karakter, tidak duplikat case-insensitive setelah trim, belum mencapai 20 kategori kustom), menyimpan ke Local Storage, dan memancarkan `state:changed`
    - Tulis `setBudgetLimit(amount)` yang memvalidasi nilai (> 0, ≤ 999.999.999,99), menyimpan ke Local Storage, dan memancarkan `state:changed`
    - Tulis `setSortOrder(order)` dan `setTheme(theme)` yang memperbarui state dan memancarkan `state:changed`
    - _Requirements: 6.2, 6.3, 6.4, 6.5, 6.6, 6.7, 9.1, 9.2, 9.4_

  - [ ]* 3.6 Tulis property test untuk addCategory (Properti 7)
    - **Properti 7: Kategori kustom tidak boleh duplikat (case-insensitive)**
    - **Memvalidasi: Requirements 6.5**
    - Gunakan `fc.array(fc.string())` dan variasi case/whitespace untuk memverifikasi penolakan duplikat

  - [ ]* 3.7 Tulis property test untuk round-trip kategori (Properti 8)
    - **Properti 8: Round-trip persistensi kategori kustom ke Local Storage**
    - **Memvalidasi: Requirements 5.4, 5.5, 6.3, 6.4**
    - Gunakan `fc.string({ minLength: 1, maxLength: 50 })` untuk memverifikasi kategori tersedia setelah reload

- [x] 4. Checkpoint — Pastikan semua test lulus
  - Pastikan semua test lulus, tanyakan kepada pengguna jika ada pertanyaan.

- [x] 5. Implementasi komponen validasi dan format
  - [x] 5.1 Implementasi fungsi validasi form di `FormInput`
    - Tulis fungsi `validate(data)` yang memeriksa: nama item non-kosong dan non-whitespace (maks. 100 karakter), jumlah > 0 dan ≤ 999.999.999,99, dan kategori dipilih
    - Kembalikan `ValidationResult` dengan `isValid` dan array `errors` yang menyebutkan nama field bermasalah
    - _Requirements: 1.2, 1.3, 1.7_

  - [ ]* 5.2 Tulis property test untuk validasi form (Properti 2)
    - **Properti 2: Input tidak valid selalu ditolak dengan pesan error per field**
    - **Memvalidasi: Requirements 1.2, 1.3, 1.7**
    - Gunakan `fc.record` dengan field tidak valid yang di-generate untuk memverifikasi `isValid = false` dan `errors` menyebutkan field bermasalah

  - [x] 5.3 Implementasi fungsi `formatCurrency` di `BalanceDisplay`
    - Tulis fungsi `formatCurrency(amount)` yang menghasilkan string diawali "Rp", menggunakan titik sebagai pemisah ribuan, dan koma sebagai pemisah desimal dengan tepat dua angka di belakang koma
    - _Requirements: 3.4_

  - [ ]* 5.4 Tulis property test untuk formatCurrency (Properti 5)
    - **Properti 5: Format mata uang Rupiah selalu menghasilkan string yang valid**
    - **Memvalidasi: Requirements 3.4**
    - Gunakan `fc.float({ min: 0, max: 999999999.99 })` untuk memverifikasi format output selalu valid

  - [x] 5.5 Implementasi fungsi `getSortedTransactions` di `TransactionList`
    - Tulis fungsi `getSortedTransactions(transactions, order)` yang mendukung: `default` (timestamp descending), `amount_asc`, `amount_desc`, dan `category_az`
    - _Requirements: 8.1, 8.2, 8.3_

  - [ ]* 5.6 Tulis property test untuk pengurutan (Properti 9)
    - **Properti 9: Pengurutan transaksi bersifat idempoten**
    - **Memvalidasi: Requirements 8.1, 8.2, 8.3**
    - Gunakan `fc.array(validTransactionArb)` dan `fc.constantFrom('amount_asc', 'amount_desc', 'category_az')` untuk memverifikasi idempoten

  - [x] 5.7 Implementasi fungsi `checkBudgetWarning` di `BalanceDisplay`
    - Tulis fungsi `checkBudgetWarning(total, limit)` yang mengembalikan `true` jika `limit > 0` dan `total >= limit`, dan `false` untuk semua kondisi lainnya
    - _Requirements: 9.3, 9.5, 9.6_

  - [ ]* 5.8 Tulis property test untuk checkBudgetWarning (Properti 10)
    - **Properti 10: Indikator peringatan konsisten dengan perbandingan total dan batas**
    - **Memvalidasi: Requirements 9.3, 9.5, 9.6**
    - Gunakan `fc.float({ min: 0.01 })` untuk limit dan `fc.float({ min: 0 })` untuk total

  - [x] 5.9 Implementasi fungsi `groupByMonth` di `MonthlySummary`
    - Tulis fungsi `groupByMonth(transactions)` yang mengelompokkan transaksi berdasarkan `YYYY-MM` dari timestamp, menghitung total per grup, dan mengurutkan dari bulan terbaru ke terlama
    - Tulis fungsi `formatMonthLabel(monthKey)` yang mengubah `"2024-01"` menjadi `"Januari 2024"` (dalam Bahasa Indonesia)
    - _Requirements: 7.1, 7.2, 7.4, 7.5_

  - [ ]* 5.10 Tulis property test untuk groupByMonth (Properti 11)
    - **Properti 11: Pengelompokan bulanan menghasilkan total yang akurat per grup**
    - **Memvalidasi: Requirements 7.1, 7.2, 7.5**
    - Gunakan `fc.array(validTransactionArb)` dengan timestamp bervariasi untuk memverifikasi setiap transaksi masuk tepat satu grup dan total per grup akurat

  - [ ]* 5.11 Tulis unit test untuk fungsi-fungsi komponen
    - Test `getSortedTransactions` untuk semua opsi pengurutan, daftar kosong, dan daftar satu item
    - Test `formatCurrency` untuk nilai nol, nilai besar, dan nilai dengan desimal
    - Test `groupByMonth` untuk transaksi lintas bulan, bulan yang sama, dan daftar kosong
    - _Requirements: 7.1, 7.2, 8.1, 8.2, 8.3, 3.4_

- [x] 6. Checkpoint — Pastikan semua test lulus
  - Pastikan semua test lulus, tanyakan kepada pengguna jika ada pertanyaan.

- [x] 7. Implementasi komponen UI — Form Input dan Saldo Display
  - [x] 7.1 Implementasi `FormInput` component
    - Tulis fungsi `render()` yang merender form dengan field Nama Item, Jumlah, dan dropdown Kategori
    - Tulis fungsi `handleSubmit(event)` yang memanggil `validate()`, menampilkan pesan error per field jika tidak valid, atau memanggil `store.addTransaction()` jika valid
    - Tulis fungsi `reset()` yang mengosongkan semua field dan mengembalikan dropdown ke pilihan default
    - Tulis fungsi `preventNonNumeric(event)` yang mencegah karakter non-numerik pada field Jumlah
    - Subscribe ke `state:changed` untuk memperbarui dropdown kategori
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 1.7_

  - [x] 7.2 Implementasi `BalanceDisplay` component
    - Tulis fungsi `render(total, budgetLimit)` yang menampilkan total saldo diformat dengan `formatCurrency`
    - Tampilkan "Rp 0,00" jika tidak ada transaksi atau total negatif
    - Tampilkan indikator peringatan visual (warna merah) jika `checkBudgetWarning` mengembalikan `true`
    - Subscribe ke `state:changed` untuk memperbarui tampilan secara otomatis
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 9.3, 9.5, 9.6_

  - [ ]* 7.3 Tulis property test untuk kalkulasi saldo (Properti 4)
    - **Properti 4: Saldo total selalu sama dengan jumlah semua amount dan tidak pernah negatif**
    - **Memvalidasi: Requirements 3.1, 3.2, 3.3, 3.6**
    - Gunakan `fc.array(fc.float({ min: 0.01, max: 999999999.99 }))` untuk memverifikasi total = sum(amounts) dan tidak pernah negatif

- [x] 8. Implementasi komponen UI — Daftar Transaksi dan Pengurutan
  - [x] 8.1 Implementasi `TransactionList` component
    - Tulis fungsi `render(transactions)` yang merender daftar transaksi, masing-masing menampilkan Nama Item, Jumlah (diformat), Kategori, dan tombol hapus
    - Tampilkan pesan "Belum ada transaksi. Tambahkan pengeluaran pertama Anda." jika daftar kosong
    - Tampilkan pesan "Tidak ada transaksi yang sesuai dengan filter yang dipilih." jika hasil filter kosong
    - Tulis fungsi `handleDelete(id)` yang memanggil `store.deleteTransaction(id)` dan menampilkan pesan error jika gagal
    - Subscribe ke `state:changed` untuk memperbarui daftar secara otomatis
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6_

  - [x] 8.2 Implementasi fitur pengurutan di `TransactionList`
    - Tambahkan kontrol pengurutan (tombol atau dropdown) dengan opsi: Default, Jumlah Terkecil, Jumlah Terbesar, Kategori A–Z
    - Tulis fungsi `handleSortChange(order)` yang memanggil `store.setSortOrder(order)` dan memperbarui indikator visual aktif
    - Pastikan transaksi baru disisipkan pada posisi yang sesuai dengan urutan aktif
    - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5_

- [x] 9. Implementasi komponen UI — Chart Visualizer dan Ringkasan Bulanan
  - [x] 9.1 Implementasi `ChartVisualizer` component
    - Tulis fungsi `buildChartData(transactions)` yang mengelompokkan transaksi per kategori dan menghitung total per kategori untuk data Chart.js
    - Tulis fungsi `render(transactions)` yang membuat atau memperbarui instance Chart.js pie chart dengan label, legenda, dan persentase per kategori
    - Tulis fungsi `destroy()` untuk menghancurkan instance chart sebelum membuat yang baru
    - Tulis fungsi `showPlaceholder()` yang menampilkan pesan "Tidak ada data untuk ditampilkan." jika tidak ada transaksi
    - Tangani kegagalan Chart.js dengan menampilkan pesan fallback dan log error ke console
    - Subscribe ke `state:changed` untuk memperbarui chart secara otomatis
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5_

  - [x] 9.2 Implementasi `MonthlySummary` component
    - Tulis fungsi `render(transactions)` yang merender ringkasan bulanan menggunakan `groupByMonth`, menampilkan total per bulan
    - Tampilkan pesan "Belum ada data ringkasan bulanan." jika tidak ada transaksi
    - Tulis fungsi `handleMonthSelect(monthKey)` yang menampilkan daftar transaksi dalam bulan yang dipilih, masing-masing menampilkan Nama Item, Jumlah, Kategori, dan tanggal transaksi
    - Subscribe ke `state:changed` untuk memperbarui ringkasan secara otomatis
    - _Requirements: 7.1, 7.2, 7.3, 7.5_

- [x] 10. Implementasi komponen UI — Kategori Kustom dan Budget Alert
  - [x] 10.1 Implementasi `CategoryManager` component
    - Definisikan `DEFAULT_CATEGORIES: ['Makanan', 'Transportasi', 'Hiburan']` yang tidak dapat dihapus
    - Tulis fungsi `render(categories)` yang menampilkan daftar kategori dan form untuk menambah kategori kustom
    - Tulis fungsi `handleAddCategory(name)` yang memanggil `store.addCategory(name)` dan menampilkan pesan error yang sesuai jika gagal (duplikat, kosong, atau batas 20 tercapai)
    - Tulis fungsi `populateDropdown(categories)` yang mengisi dropdown di `FormInput` dengan semua kategori yang tersedia
    - Subscribe ke `state:changed` untuk memperbarui daftar dan dropdown secara otomatis
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 6.6, 6.7_

  - [ ]* 10.2 Tulis unit test untuk CategoryManager
    - Test penambahan duplikat (case-insensitive), nama kosong/whitespace, dan batas 20 kategori
    - _Requirements: 6.5, 6.6, 6.7_

  - [x] 10.3 Implementasi `BudgetAlert` / antarmuka penetapan batas pengeluaran
    - Buat form input untuk menetapkan nilai Batas Pengeluaran
    - Validasi input: harus angka positif, ≤ 999.999.999,99
    - Tampilkan pesan error yang menjelaskan aturan nilai valid jika input tidak valid
    - Panggil `store.setBudgetLimit(amount)` saat nilai valid disubmit
    - Subscribe ke `state:changed` untuk menampilkan nilai batas yang tersimpan
    - _Requirements: 9.1, 9.2, 9.4_

- [x] 11. Implementasi ThemeManager dan persistensi tema
  - [x] 11.1 Implementasi `ThemeManager`
    - Tulis fungsi `applyTheme(theme)` yang menambahkan/menghapus class `dark-mode` pada elemen `<body>` atau `<html>`
    - Tulis fungsi `toggleTheme()` yang beralih antara `'light'` dan `'dark'`, menyimpan ke Local Storage via `store.setTheme()`
    - Tulis fungsi `loadThemeFromStorage()` yang memuat preferensi tema dari Local Storage dan menerapkannya sebelum konten dirender (mencegah flash of unstyled content)
    - Gunakan `'light'` sebagai default jika tidak ada preferensi tersimpan
    - _Requirements: 10.1, 10.2, 10.3, 10.4, 10.5_

  - [ ]* 11.2 Tulis unit test untuk ThemeManager
    - Test toggle tema, muat dari storage, dan default tanpa storage
    - _Requirements: 10.4, 10.5_

- [x] 12. Implementasi CSS — Styling dan Dark/Light Mode
  - [x] 12.1 Tulis CSS dasar dan layout responsif di `css/style.css`
    - Implementasikan layout responsif yang berfungsi dari lebar 320px hingga 1920px tanpa overflow horizontal
    - Styling untuk semua komponen: form, daftar transaksi, saldo display, chart container, ringkasan bulanan, kategori manager, budget alert
    - Styling untuk pesan error per field pada form
    - Styling untuk indikator pengurutan aktif (highlight visual)
    - _Requirements: 11.2_

  - [x] 12.2 Implementasikan dark/light mode di CSS
    - Definisikan CSS custom properties (variabel) untuk warna tema
    - Tulis aturan CSS untuk class `dark-mode` yang menerapkan latar belakang gelap dengan teks terang
    - Tulis aturan CSS untuk mode terang (default) dengan latar belakang terang dan teks gelap
    - Implementasikan styling indikator peringatan batas pengeluaran (warna merah) untuk `BalanceDisplay`
    - _Requirements: 9.3, 10.2, 10.6_

- [x] 13. Inisialisasi aplikasi dan wiring semua komponen
  - [x] 13.1 Tulis fungsi inisialisasi utama di `js/app.js`
    - Panggil `ThemeManager.loadThemeFromStorage()` sebagai langkah pertama untuk mencegah flash of unstyled content
    - Panggil `store.loadFromStorage()` untuk memuat semua data persisten
    - Inisialisasi semua komponen dan daftarkan subscriber ke `EventBus`
    - Pasang semua event listener (form submit, tombol hapus, toggle tema, perubahan sort, dll.)
    - Lakukan render awal semua komponen dengan state yang dimuat
    - Tampilkan banner peringatan jika Local Storage tidak tersedia atau data rusak
    - _Requirements: 5.2, 5.5, 5.6, 10.4, 11.3, 11.4_

  - [ ]* 13.2 Tulis smoke test untuk verifikasi struktur file
    - Verifikasi file `index.html`, `css/style.css`, dan `js/app.js` ada di lokasi yang benar
    - Verifikasi Chart.js berhasil dimuat dari CDN
    - _Requirements: 12.1, 12.2, 12.4, 12.5_

- [x] 14. Checkpoint akhir — Pastikan semua test lulus
  - Pastikan semua test lulus, tanyakan kepada pengguna jika ada pertanyaan.

## Catatan

- Tugas yang ditandai dengan `*` bersifat opsional dan dapat dilewati untuk MVP yang lebih cepat
- Setiap tugas mereferensikan requirements spesifik untuk keterlacakan
- Checkpoint memastikan validasi inkremental di setiap tahap
- Property test memvalidasi properti kebenaran universal menggunakan library `fast-check`
- Unit test memvalidasi contoh spesifik dan kasus tepi
- Semua kode JavaScript menggunakan IIFE/Module Pattern untuk menghindari polusi namespace global
- Test runner menggunakan Vitest; jalankan dengan `vitest --run` untuk eksekusi sekali jalan

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["2.1", "2.4"] },
    { "id": 1, "tasks": ["2.2", "2.3", "3.1"] },
    { "id": 2, "tasks": ["3.2", "3.5"] },
    { "id": 3, "tasks": ["3.3", "3.4", "3.6", "3.7", "5.1", "5.3", "5.5", "5.7", "5.9"] },
    { "id": 4, "tasks": ["5.2", "5.4", "5.6", "5.8", "5.10", "5.11"] },
    { "id": 5, "tasks": ["7.1", "7.2", "8.1", "9.1", "9.2", "10.1", "10.3", "11.1"] },
    { "id": 6, "tasks": ["7.3", "8.2", "10.2", "11.2", "12.1"] },
    { "id": 7, "tasks": ["12.2"] },
    { "id": 8, "tasks": ["13.1"] },
    { "id": 9, "tasks": ["13.2"] }
  ]
}
```
