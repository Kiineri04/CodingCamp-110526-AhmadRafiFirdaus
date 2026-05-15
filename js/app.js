// js/app.js — Expense & Budget Visualizer
// Arsitektur: Observer/Event-Driven dengan State Store terpusat
// Semua kode menggunakan ES6+ (const/let, arrow functions, module pattern)

'use strict';

// =============================================================================
// RESULT PATTERN HELPERS
// Pola Result<T, E> sederhana untuk penanganan error yang eksplisit
// =============================================================================

/**
 * Membungkus nilai sukses dalam objek Result.
 * @param {*} value - Nilai yang berhasil
 * @returns {{ success: true, value: * }}
 */
const ok = (value) => ({ success: true, value });

/**
 * Membungkus error dalam objek Result.
 * @param {*} error - Objek atau pesan error
 * @returns {{ success: false, error: * }}
 */
const err = (error) => ({ success: false, error });

// =============================================================================
// STORAGE SERVICE
// Abstraksi atas Local Storage API dengan penanganan error via Result pattern
// =============================================================================

const StorageService = (() => {
  /** Kunci-kunci yang digunakan untuk menyimpan data di Local Storage */
  const STORAGE_KEYS = Object.freeze({
    TRANSACTIONS: 'ebv_transactions',
    CATEGORIES:   'ebv_categories',
    BUDGET_LIMIT: 'ebv_budget_limit',
    THEME:        'ebv_theme',
  });

  /**
   * Mengecek apakah Local Storage tersedia di browser saat ini.
   * @returns {boolean}
   */
  const isAvailable = () => {
    try {
      const testKey = '__ebv_test__';
      localStorage.setItem(testKey, '1');
      localStorage.removeItem(testKey);
      return true;
    } catch (_e) {
      return false;
    }
  };

  /**
   * Menyimpan data ke Local Storage sebagai JSON.
   * @param {string} key - Kunci penyimpanan
   * @param {*} data - Data yang akan disimpan (akan di-serialize ke JSON)
   * @returns {Result<void, { type: string, key: string, originalError: Error }>}
   */
  const save = (key, data) => {
    try {
      localStorage.setItem(key, JSON.stringify(data));
      return ok(undefined);
    } catch (e) {
      return err({ type: 'SAVE_ERROR', key, originalError: e });
    }
  };

  /**
   * Memuat dan mem-parse data JSON dari Local Storage.
   * Mengembalikan ok(null) jika key tidak ditemukan.
   * Mengembalikan err jika data JSON rusak (tidak dapat di-parse).
   * @param {string} key - Kunci penyimpanan
   * @returns {Result<*, { type: string, key: string, originalError: Error }>}
   */
  const load = (key) => {
    try {
      const raw = localStorage.getItem(key);
      if (raw === null) return ok(null);
      return ok(JSON.parse(raw));
    } catch (e) {
      // JSON.parse gagal — data rusak
      return err({ type: 'PARSE_ERROR', key, originalError: e });
    }
  };

  /**
   * Menghapus sebuah key dari Local Storage.
   * @param {string} key - Kunci yang akan dihapus
   * @returns {Result<void, { type: string, key: string, originalError: Error }>}
   */
  const remove = (key) => {
    try {
      localStorage.removeItem(key);
      return ok(undefined);
    } catch (e) {
      return err({ type: 'REMOVE_ERROR', key, originalError: e });
    }
  };

  return { STORAGE_KEYS, isAvailable, save, load, remove };
})();

// =============================================================================
// EVENT BUS
// Mekanisme publish-subscribe sederhana untuk komunikasi antar komponen
// =============================================================================

const EventBus = (() => {
  /**
   * Map dari nama event ke array callback listener.
   * @type {Map<string, Function[]>}
   */
  const listeners = new Map();

  /**
   * Event yang didefinisikan dalam aplikasi.
   * - 'state:changed' : dipancarkan setiap kali AppStore memperbarui state
   * - 'error:storage' : dipancarkan ketika operasi Local Storage gagal
   */
  const EVENTS = Object.freeze({
    STATE_CHANGED: 'state:changed',
    ERROR_STORAGE: 'error:storage',
  });

  /**
   * Mendaftarkan callback sebagai listener untuk sebuah event.
   * @param {string} event - Nama event
   * @param {Function} callback - Fungsi yang dipanggil saat event dipancarkan
   */
  const subscribe = (event, callback) => {
    if (!listeners.has(event)) {
      listeners.set(event, []);
    }
    listeners.get(event).push(callback);
  };

  /**
   * Menghapus callback dari daftar listener sebuah event.
   * Tidak melakukan apa-apa jika callback tidak terdaftar.
   * @param {string} event - Nama event
   * @param {Function} callback - Fungsi yang akan dihapus
   */
  const unsubscribe = (event, callback) => {
    if (!listeners.has(event)) return;
    const updated = listeners.get(event).filter((cb) => cb !== callback);
    listeners.set(event, updated);
  };

  /**
   * Memancarkan event ke semua listener yang terdaftar.
   * Setiap listener dipanggil dengan data yang diberikan.
   * Error dari satu listener tidak menghentikan listener lainnya.
   * @param {string} event - Nama event
   * @param {*} data - Data yang dikirimkan ke setiap listener
   */
  const emit = (event, data) => {
    if (!listeners.has(event)) return;
    listeners.get(event).forEach((callback) => {
      try {
        callback(data);
      } catch (e) {
        console.error(`[EventBus] Error pada listener event "${event}":`, e);
      }
    });
  };

  return { EVENTS, subscribe, unsubscribe, emit };
})();

// =============================================================================
// APP STORE
// State management terpusat dengan persistensi ke Local Storage
// =============================================================================

const AppStore = (() => {
  // Referensi ke STORAGE_KEYS dari StorageService
  const STORAGE_KEYS = StorageService.STORAGE_KEYS;

  /**
   * Kategori bawaan yang selalu tersedia dan tidak dapat dihapus.
   * @type {Array<{ name: string, isDefault: boolean }>}
   */
  const DEFAULT_CATEGORIES = [
    { name: 'Makanan',       isDefault: true },
    { name: 'Transportasi',  isDefault: true },
    { name: 'Hiburan',       isDefault: true },
  ];

  /**
   * State awal aplikasi.
   * Digunakan sebagai fallback ketika Local Storage tidak tersedia atau data rusak.
   * @returns {AppState}
   */
  const createDefaultState = () => ({
    transactions: [],
    categories:   DEFAULT_CATEGORIES.map((c) => ({ ...c })),
    budgetLimit:  0,
    sortOrder:    'default',
    theme:        'light',
  });

  /** State internal aplikasi. */
  let state = createDefaultState();

  // ---------------------------------------------------------------------------
  // PUBLIC API
  // ---------------------------------------------------------------------------

  /**
   * Mengembalikan salinan dangkal (shallow copy) dari state saat ini.
   * Mencegah mutasi langsung dari luar store.
   * @returns {AppState}
   */
  const getState = () => ({ ...state });

  /**
   * Memuat semua data persisten dari Local Storage dan menggabungkannya ke state.
   *
   * Urutan pemuatan:
   *  1. Transactions  → STORAGE_KEYS.TRANSACTIONS
   *  2. Custom categories → STORAGE_KEYS.CATEGORIES (di-merge dengan DEFAULT_CATEGORIES)
   *  3. Budget limit  → STORAGE_KEYS.BUDGET_LIMIT
   *  4. Theme         → STORAGE_KEYS.THEME
   *
   * Jika Local Storage tidak tersedia sama sekali, state tetap default dan
   * sebuah warning ditampilkan di console.
   *
   * Jika salah satu key mengandung JSON rusak, state untuk key tersebut
   * direset ke nilai default dan event ERROR_STORAGE dipancarkan.
   *
   * Requirements: 5.2, 5.5, 5.6, 6.1
   */
  const loadFromStorage = () => {
    // Cek ketersediaan Local Storage
    if (!StorageService.isAvailable()) {
      console.warn(
        '[AppStore] Local Storage tidak tersedia. Memulai dengan state default.'
      );
      state = createDefaultState();
      return;
    }

    // Reset ke state default sebelum memuat agar tidak ada sisa state lama
    state = createDefaultState();

    // --- 1. Muat transactions ---
    const txResult = StorageService.load(STORAGE_KEYS.TRANSACTIONS);
    if (!txResult.success) {
      EventBus.emit(EventBus.EVENTS.ERROR_STORAGE, {
        message: 'Data transaksi tidak dapat dimuat. Memulai dengan data baru.',
        originalError: txResult.error,
      });
    } else if (Array.isArray(txResult.value)) {
      state.transactions = txResult.value;
    }

    // --- 2. Muat custom categories dan merge dengan default ---
    const catResult = StorageService.load(STORAGE_KEYS.CATEGORIES);
    if (!catResult.success) {
      EventBus.emit(EventBus.EVENTS.ERROR_STORAGE, {
        message: 'Data kategori tidak dapat dimuat. Menggunakan kategori bawaan.',
        originalError: catResult.error,
      });
    } else if (Array.isArray(catResult.value)) {
      // Gabungkan: mulai dari kategori default, lalu tambahkan kategori kustom
      // yang belum ada di daftar default (perbandingan case-insensitive)
      const customCategories = catResult.value.filter(
        (saved) =>
          !DEFAULT_CATEGORIES.some(
            (def) => def.name.toLowerCase() === saved.name.toLowerCase()
          )
      );
      state.categories = [
        ...DEFAULT_CATEGORIES.map((c) => ({ ...c })),
        ...customCategories,
      ];
    }

    // --- 3. Muat budget limit ---
    const budgetResult = StorageService.load(STORAGE_KEYS.BUDGET_LIMIT);
    if (!budgetResult.success) {
      EventBus.emit(EventBus.EVENTS.ERROR_STORAGE, {
        message: 'Data batas pengeluaran tidak dapat dimuat. Menggunakan nilai default (0).',
        originalError: budgetResult.error,
      });
    } else if (typeof budgetResult.value === 'number' && budgetResult.value >= 0) {
      state.budgetLimit = budgetResult.value;
    }

    // --- 4. Muat theme ---
    const themeResult = StorageService.load(STORAGE_KEYS.THEME);
    if (!themeResult.success) {
      EventBus.emit(EventBus.EVENTS.ERROR_STORAGE, {
        message: 'Data tema tidak dapat dimuat. Menggunakan tema default (light).',
        originalError: themeResult.error,
      });
    } else if (themeResult.value === 'light' || themeResult.value === 'dark') {
      state.theme = themeResult.value;
    }
  };

  // ---------------------------------------------------------------------------
  // TASK 3.2: addTransaction & deleteTransaction
  // ---------------------------------------------------------------------------

  /**
   * Menambahkan transaksi baru ke state dan menyimpannya ke Local Storage.
   *
   * Validasi:
   *  - itemName: non-kosong setelah trim, maks. 100 karakter
   *  - amount: number, > 0, ≤ 999_999_999.99
   *  - category: harus terdaftar di state.categories
   *
   * @param {{ itemName: string, amount: number, category: string }} item
   * @returns {Result<Transaction, { type: 'VALIDATION_ERROR', errors: Array }>}
   *
   * Requirements: 1.4, 5.1, 7.4
   */
  const addTransaction = (item) => {
    const errors = [];

    // Validasi itemName
    const trimmedName = (item.itemName || '').trim();
    if (!trimmedName) {
      errors.push({ field: 'itemName', message: 'Nama item tidak boleh kosong.' });
    } else if (trimmedName.length > 100) {
      errors.push({ field: 'itemName', message: 'Nama item maksimal 100 karakter.' });
    }

    // Validasi amount
    const amount = Number(item.amount);
    if (isNaN(amount) || amount <= 0) {
      errors.push({ field: 'amount', message: 'Jumlah harus lebih dari 0.' });
    } else if (amount > 999999999.99) {
      errors.push({ field: 'amount', message: 'Jumlah tidak boleh melebihi 999.999.999,99.' });
    }

    // Validasi category
    const trimmedCategory = (item.category || '').trim();
    const categoryExists = state.categories.some(
      (c) => c.name === trimmedCategory
    );
    if (!trimmedCategory) {
      errors.push({ field: 'category', message: 'Kategori harus dipilih.' });
    } else if (!categoryExists) {
      errors.push({ field: 'category', message: 'Kategori tidak terdaftar.' });
    }

    if (errors.length > 0) {
      return err({ type: 'VALIDATION_ERROR', errors });
    }

    // Buat objek Transaction baru
    const id =
      typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
        ? crypto.randomUUID()
        : 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
            const r = (Math.random() * 16) | 0;
            const v = c === 'x' ? r : (r & 0x3) | 0x8;
            return v.toString(16);
          });

    const newTransaction = {
      id,
      itemName: trimmedName,
      amount,
      category: trimmedCategory,
      timestamp: new Date().toISOString(),
    };

    state.transactions = [...state.transactions, newTransaction];

    // Simpan ke Local Storage
    StorageService.save(STORAGE_KEYS.TRANSACTIONS, state.transactions);

    // Emit state changed
    EventBus.emit(EventBus.EVENTS.STATE_CHANGED, getState());

    return ok(newTransaction);
  };

  /**
   * Menghapus transaksi berdasarkan ID dari state dan Local Storage.
   * Jika penyimpanan gagal, state di-rollback dan error dikembalikan.
   *
   * @param {string} id - ID transaksi yang akan dihapus
   * @returns {Result<void, { type: 'NOT_FOUND' | 'SAVE_ERROR' }>}
   *
   * Requirements: 2.3, 2.4, 5.3
   */
  const deleteTransaction = (id) => {
    const index = state.transactions.findIndex((t) => t.id === id);
    if (index === -1) {
      return err({ type: 'NOT_FOUND' });
    }

    // Simpan snapshot untuk rollback
    const previousTransactions = state.transactions;

    // Hapus dari state
    state.transactions = state.transactions.filter((t) => t.id !== id);

    // Simpan ke Local Storage
    const saveResult = StorageService.save(STORAGE_KEYS.TRANSACTIONS, state.transactions);
    if (!saveResult.success) {
      // Rollback state
      state.transactions = previousTransactions;
      EventBus.emit(EventBus.EVENTS.ERROR_STORAGE, {
        message: 'Gagal menyimpan perubahan ke Local Storage. Penghapusan dibatalkan.',
        originalError: saveResult.error,
      });
      return err(saveResult.error);
    }

    // Emit state changed
    EventBus.emit(EventBus.EVENTS.STATE_CHANGED, getState());

    return ok(undefined);
  };

  // ---------------------------------------------------------------------------
  // TASK 3.5: addCategory, setBudgetLimit, setSortOrder, setTheme
  // ---------------------------------------------------------------------------

  /**
   * Menambahkan kategori kustom baru ke state dan menyimpannya ke Local Storage.
   *
   * Validasi:
   *  - name: non-kosong setelah trim, panjang ≤ 50 karakter
   *  - Tidak boleh duplikat (case-insensitive)
   *  - Batas 20 kategori kustom (isDefault: false)
   *
   * @param {string} name - Nama kategori baru
   * @returns {Result<Category, { type: 'VALIDATION_ERROR', message: string }>}
   *
   * Requirements: 6.2, 6.3, 6.4, 6.5, 6.6, 6.7, 5.4
   */
  const addCategory = (name) => {
    const trimmedName = (name || '').trim();

    // Validasi: tidak boleh kosong
    if (!trimmedName) {
      return err({ type: 'VALIDATION_ERROR', message: 'Nama kategori tidak boleh kosong.' });
    }

    // Validasi: panjang maksimal 50 karakter
    if (trimmedName.length > 50) {
      return err({ type: 'VALIDATION_ERROR', message: 'Nama kategori maksimal 50 karakter.' });
    }

    // Validasi: tidak boleh duplikat (case-insensitive)
    const isDuplicate = state.categories.some(
      (c) => c.name.trim().toLowerCase() === trimmedName.toLowerCase()
    );
    if (isDuplicate) {
      return err({ type: 'VALIDATION_ERROR', message: 'Kategori sudah ada.' });
    }

    // Validasi: batas 20 kategori kustom
    const customCount = state.categories.filter((c) => !c.isDefault).length;
    if (customCount >= 20) {
      return err({
        type: 'VALIDATION_ERROR',
        message: 'Batas maksimal kategori kustom (20) telah tercapai.',
      });
    }

    const newCategory = { name: trimmedName, isDefault: false };
    state.categories = [...state.categories, newCategory];

    // Simpan HANYA custom categories ke Local Storage
    const customCategories = state.categories.filter((c) => !c.isDefault);
    StorageService.save(STORAGE_KEYS.CATEGORIES, customCategories);

    // Emit state changed
    EventBus.emit(EventBus.EVENTS.STATE_CHANGED, getState());

    return ok(newCategory);
  };

  /**
   * Menetapkan batas pengeluaran dan menyimpannya ke Local Storage.
   *
   * Validasi:
   *  - amount harus number, > 0, ≤ 999_999_999.99
   *
   * @param {number} amount - Nilai batas pengeluaran
   * @returns {Result<void, { type: 'VALIDATION_ERROR', message: string }>}
   *
   * Requirements: 9.1, 9.2, 9.4
   */
  const setBudgetLimit = (amount) => {
    const numAmount = Number(amount);

    if (isNaN(numAmount) || numAmount <= 0) {
      return err({
        type: 'VALIDATION_ERROR',
        message: 'Batas pengeluaran harus berupa angka positif lebih dari 0.',
      });
    }

    if (numAmount > 999999999.99) {
      return err({
        type: 'VALIDATION_ERROR',
        message: 'Batas pengeluaran tidak boleh melebihi 999.999.999,99.',
      });
    }

    state.budgetLimit = numAmount;

    // Simpan ke Local Storage
    StorageService.save(STORAGE_KEYS.BUDGET_LIMIT, state.budgetLimit);

    // Emit state changed
    EventBus.emit(EventBus.EVENTS.STATE_CHANGED, getState());

    return ok(undefined);
  };

  /**
   * Mengatur urutan pengurutan transaksi.
   *
   * @param {'default' | 'amount_asc' | 'amount_desc' | 'category_az'} order
   *
   * Requirements: 8.1, 8.2
   */
  const setSortOrder = (order) => {
    const validOrders = ['default', 'amount_asc', 'amount_desc', 'category_az'];
    if (!validOrders.includes(order)) return;

    state.sortOrder = order;

    // Emit state changed
    EventBus.emit(EventBus.EVENTS.STATE_CHANGED, getState());
  };

  /**
   * Mengatur tema aplikasi dan menyimpannya ke Local Storage.
   *
   * @param {'light' | 'dark'} theme
   *
   * Requirements: 10.2, 10.3
   */
  const setTheme = (theme) => {
    if (theme !== 'light' && theme !== 'dark') return;

    state.theme = theme;

    // Simpan ke Local Storage
    StorageService.save(STORAGE_KEYS.THEME, state.theme);

    // Emit state changed
    EventBus.emit(EventBus.EVENTS.STATE_CHANGED, getState());
  };

  return {
    getState,
    loadFromStorage,
    addTransaction,
    deleteTransaction,
    addCategory,
    setBudgetLimit,
    setSortOrder,
    setTheme,
  };
})();

// =============================================================================
// UTILITY FUNCTIONS
// Fungsi-fungsi helper yang digunakan oleh komponen UI
// =============================================================================

// ---------------------------------------------------------------------------
// TASK 5.1 — validateTransactionInput(data, categories)
// ---------------------------------------------------------------------------

/**
 * Memvalidasi input transaksi sebelum diproses oleh AppStore.
 *
 * @param {{ itemName: string, amount: number|string, category: string }} data
 *   - itemName : nama item pengeluaran
 *   - amount   : jumlah pengeluaran
 *   - category : nama kategori yang dipilih
 * @param {Array<{ name: string, isDefault: boolean }>} categories
 *   Daftar kategori yang terdaftar di state aplikasi.
 * @returns {{ isValid: boolean, errors: Array<{ field: string, message: string }> }}
 *
 * Validates: Requirements 1.2, 1.3, 1.7
 */
const validateTransactionInput = (data, categories) => {
  const errors = [];

  // --- Validasi itemName ---
  const trimmedName = (data.itemName || '').trim();
  if (!trimmedName) {
    errors.push({ field: 'itemName', message: 'Nama item tidak boleh kosong.' });
  } else if (trimmedName.length > 100) {
    errors.push({ field: 'itemName', message: 'Nama item maksimal 100 karakter.' });
  }

  // --- Validasi amount ---
  const amount = Number(data.amount);
  if (isNaN(amount) || amount <= 0) {
    errors.push({ field: 'amount', message: 'Jumlah harus lebih dari 0.' });
  } else if (amount > 999999999.99) {
    errors.push({ field: 'amount', message: 'Jumlah tidak boleh melebihi 999.999.999,99.' });
  }

  // --- Validasi category ---
  const trimmedCategory = (data.category || '').trim();
  if (!trimmedCategory) {
    errors.push({ field: 'category', message: 'Kategori harus dipilih.' });
  } else {
    const categoryExists = Array.isArray(categories) &&
      categories.some((c) => c.name === trimmedCategory);
    if (!categoryExists) {
      errors.push({ field: 'category', message: 'Kategori tidak terdaftar.' });
    }
  }

  return { isValid: errors.length === 0, errors };
};

// ---------------------------------------------------------------------------
// TASK 5.3 — formatCurrency(amount)
// ---------------------------------------------------------------------------

/**
 * Memformat angka menjadi string mata uang Rupiah Indonesia.
 *
 * Contoh: formatCurrency(1250000) → "Rp 1.250.000,00"
 *
 * @param {number} amount - Nilai numerik non-negatif yang akan diformat.
 * @returns {string} String berformat "Rp X.XXX.XXX,XX".
 *   Mengembalikan "Rp 0,00" jika amount negatif atau NaN.
 *
 * Validates: Requirements 3.4
 */
const formatCurrency = (amount) => {
  const num = Number(amount);

  // Kembalikan "Rp 0,00" untuk nilai tidak valid
  if (isNaN(num) || num < 0) {
    return 'Rp 0,00';
  }

  try {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })
      .format(num)
      // Intl menghasilkan "Rp1.250.000,00" atau "Rp 1.250.000,00" tergantung runtime;
      // normalisasi agar selalu ada spasi setelah "Rp"
      .replace(/^Rp\s*/, 'Rp ');
  } catch (_e) {
    // Fallback manual jika Intl tidak tersedia
    const fixed = num.toFixed(2);
    const [intPart, decPart] = fixed.split('.');
    const intFormatted = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
    return `Rp ${intFormatted},${decPart}`;
  }
};

// ---------------------------------------------------------------------------
// TASK 5.5 — getSortedTransactions(transactions, order)
// ---------------------------------------------------------------------------

/**
 * Mengembalikan salinan array transaksi yang telah diurutkan sesuai `order`.
 * Array asli tidak dimutasi.
 *
 * @param {Array<{ id: string, itemName: string, amount: number, category: string, timestamp: string }>} transactions
 *   Daftar transaksi yang akan diurutkan.
 * @param {'default' | 'amount_asc' | 'amount_desc' | 'category_az'} order
 *   Opsi pengurutan:
 *   - 'default'     : timestamp descending (terbaru dulu)
 *   - 'amount_asc'  : amount ascending
 *   - 'amount_desc' : amount descending
 *   - 'category_az' : nama kategori ascending (localeCompare)
 *   - lainnya       : kembalikan array asli tanpa diurutkan
 * @returns {Array} Salinan array yang sudah diurutkan.
 *
 * Validates: Requirements 8.1, 8.2, 8.3
 */
const getSortedTransactions = (transactions, order) => {
  switch (order) {
    case 'default':
      return [...transactions].sort(
        (a, b) => new Date(b.timestamp) - new Date(a.timestamp)
      );

    case 'amount_asc':
      return [...transactions].sort((a, b) => a.amount - b.amount);

    case 'amount_desc':
      return [...transactions].sort((a, b) => b.amount - a.amount);

    case 'category_az':
      return [...transactions].sort((a, b) =>
        a.category.localeCompare(b.category, 'id-ID')
      );

    default:
      // Order tidak dikenal — kembalikan salinan tanpa pengurutan
      return [...transactions];
  }
};

// ---------------------------------------------------------------------------
// TASK 5.7 — checkBudgetWarning(total, limit)
// ---------------------------------------------------------------------------

/**
 * Memeriksa apakah total pengeluaran telah mencapai atau melampaui batas anggaran.
 *
 * @param {number} total - Total pengeluaran saat ini.
 * @param {number} limit - Batas pengeluaran yang ditetapkan.
 * @returns {boolean}
 *   `true`  jika limit > 0 DAN total >= limit.
 *   `false` untuk semua kondisi lainnya (limit = 0, limit undefined, total < limit).
 *
 * Validates: Requirements 9.3, 9.5, 9.6
 */
const checkBudgetWarning = (total, limit) => {
  if (typeof limit !== 'number' || limit <= 0) return false;
  return total >= limit;
};

// ---------------------------------------------------------------------------
// TASK 5.9 — formatMonthLabel(monthKey) & groupByMonth(transactions)
// ---------------------------------------------------------------------------

/**
 * Nama-nama bulan dalam Bahasa Indonesia (indeks 0 = Januari).
 * @type {string[]}
 */
const MONTH_NAMES_ID = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember',
];

/**
 * Mengubah kunci bulan format "YYYY-MM" menjadi label Bahasa Indonesia.
 *
 * Contoh: formatMonthLabel("2024-01") → "Januari 2024"
 *
 * @param {string} monthKey - Kunci bulan dalam format "YYYY-MM".
 * @returns {string} Label bulan dalam Bahasa Indonesia, misalnya "Januari 2024".
 *
 * Validates: Requirements 7.1
 */
const formatMonthLabel = (monthKey) => {
  const [year, month] = monthKey.split('-');
  const monthIndex = parseInt(month, 10) - 1; // 0-based
  const monthName = MONTH_NAMES_ID[monthIndex] || monthKey;
  return `${monthName} ${year}`;
};

/**
 * Mengelompokkan transaksi berdasarkan bulan (format "YYYY-MM") dari timestamp ISO 8601.
 * Hasil diurutkan dari bulan terbaru ke terlama (descending by monthKey).
 *
 * @param {Array<{ id: string, itemName: string, amount: number, category: string, timestamp: string }>} transactions
 *   Daftar transaksi yang akan dikelompokkan.
 * @returns {Array<{ monthKey: string, label: string, total: number, transactions: Array }>}
 *   Array grup bulanan. Mengembalikan [] jika transactions kosong.
 *
 * Validates: Requirements 7.1, 7.2, 7.5
 */
const groupByMonth = (transactions) => {
  if (!Array.isArray(transactions) || transactions.length === 0) return [];

  /** @type {Map<string, { monthKey: string, label: string, total: number, transactions: Array }>} */
  const groupMap = new Map();

  transactions.forEach((tx) => {
    // Ambil "YYYY-MM" dari timestamp ISO 8601 (10 karakter pertama = "YYYY-MM-DD")
    const monthKey = tx.timestamp.slice(0, 7); // "YYYY-MM"

    if (!groupMap.has(monthKey)) {
      groupMap.set(monthKey, {
        monthKey,
        label: formatMonthLabel(monthKey),
        total: 0,
        transactions: [],
      });
    }

    const group = groupMap.get(monthKey);
    group.total += tx.amount;
    group.transactions.push(tx);
  });

  // Urutkan dari bulan terbaru ke terlama (descending by monthKey string)
  return Array.from(groupMap.values()).sort((a, b) =>
    b.monthKey.localeCompare(a.monthKey)
  );
};

// =============================================================================
// THEME MANAGER — Task 11.1
// Mengelola dark/light mode
// =============================================================================

const ThemeManager = (() => {
  /**
   * Menerapkan tema ke document.body dan memperbarui tombol toggle.
   * @param {'light'|'dark'} theme
   */
  const applyTheme = (theme) => {
    if (theme === 'dark') {
      document.body.classList.add('dark-mode');
    } else {
      document.body.classList.remove('dark-mode');
    }
    const btn = document.getElementById('btn-toggle-theme');
    if (btn) {
      btn.setAttribute('aria-label', theme === 'dark' ? 'Ganti ke mode terang' : 'Ganti ke mode gelap');
      btn.title = theme === 'dark' ? 'Mode Terang' : 'Mode Gelap';
    }
  };

  /**
   * Memuat preferensi tema dari Local Storage dan menerapkannya.
   * Dipanggil sebelum AppStore.loadFromStorage() untuk mencegah FOUC.
   */
  const loadThemeFromStorage = () => {
    const result = StorageService.load(StorageService.STORAGE_KEYS.THEME);
    const theme = (result.success && (result.value === 'dark' || result.value === 'light'))
      ? result.value
      : 'light';
    applyTheme(theme);
  };

  /** Toggle antara light dan dark, simpan ke store. */
  const toggleTheme = () => {
    const currentTheme = AppStore.getState().theme;
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    AppStore.setTheme(newTheme);
    applyTheme(newTheme);
  };

  // Subscribe ke state:changed untuk sinkronisasi
  EventBus.subscribe(EventBus.EVENTS.STATE_CHANGED, (state) => {
    applyTheme(state.theme);
  });

  return { applyTheme, loadThemeFromStorage, toggleTheme };
})();

// =============================================================================
// BALANCE DISPLAY — Task 7.2
// Menampilkan total saldo dan indikator peringatan batas pengeluaran
// =============================================================================

const BalanceDisplay = (() => {
  const render = (state) => {
    const total = Math.max(0, state.transactions.reduce((sum, t) => sum + t.amount, 0));
    const el = document.getElementById('balance-display');
    const alertEl = document.getElementById('budget-alert-indicator');
    if (!el) return;

    el.textContent = formatCurrency(total);

    const isWarning = checkBudgetWarning(total, state.budgetLimit);
    if (isWarning) {
      el.classList.add('balance--warning');
      if (alertEl) alertEl.removeAttribute('hidden');
    } else {
      el.classList.remove('balance--warning');
      if (alertEl) alertEl.setAttribute('hidden', '');
    }
  };

  EventBus.subscribe(EventBus.EVENTS.STATE_CHANGED, render);
  return { render };
})();

// =============================================================================
// FORM INPUT — Task 7.1
// Mengelola form input transaksi baru
// =============================================================================

const FormInput = (() => {
  const showFieldError = (fieldId, message) => {
    const el = document.getElementById(fieldId);
    if (el) { el.textContent = message; el.removeAttribute('hidden'); }
  };

  const clearErrors = () => {
    ['error-item-name', 'error-amount', 'error-category'].forEach((id) => {
      const el = document.getElementById(id);
      if (el) { el.textContent = ''; el.setAttribute('hidden', ''); }
    });
  };

  const reset = () => {
    const form = document.getElementById('form-transaction');
    if (form) form.reset();
    clearErrors();
  };

  /** Cegah karakter non-numerik pada field Jumlah */
  const preventNonNumeric = (e) => {
    const allowed = ['Backspace','Delete','Tab','ArrowLeft','ArrowRight','ArrowUp','ArrowDown','Home','End'];
    if (allowed.includes(e.key)) return;
    // Izinkan satu titik desimal
    if ((e.key === '.' || e.key === ',') && !e.target.value.includes('.')) return;
    if (!/^\d$/.test(e.key)) e.preventDefault();
  };

  const updateCategoryDropdown = (categories) => {
    const sel = document.getElementById('select-category');
    if (!sel) return;
    const current = sel.value;
    sel.innerHTML = '<option value="">-- Pilih Kategori --</option>';
    categories.forEach((cat) => {
      const opt = document.createElement('option');
      opt.value = cat.name;
      opt.textContent = cat.name;
      sel.appendChild(opt);
    });
    // Pertahankan pilihan sebelumnya jika masih ada
    if (categories.some((c) => c.name === current)) sel.value = current;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    clearErrors();
    const state = AppStore.getState();
    const data = {
      itemName: (document.getElementById('input-item-name') || {}).value || '',
      amount: (document.getElementById('input-amount') || {}).value || '',
      category: (document.getElementById('select-category') || {}).value || '',
    };

    const validation = validateTransactionInput(data, state.categories);
    if (!validation.isValid) {
      validation.errors.forEach(({ field, message }) => {
        const map = { itemName: 'error-item-name', amount: 'error-amount', category: 'error-category' };
        if (map[field]) showFieldError(map[field], message);
      });
      return;
    }

    const result = AppStore.addTransaction({ itemName: data.itemName, amount: Number(data.amount), category: data.category });
    if (result.success) {
      reset();
    } else {
      (result.error.errors || []).forEach(({ field, message }) => {
        const map = { itemName: 'error-item-name', amount: 'error-amount', category: 'error-category' };
        if (map[field]) showFieldError(map[field], message);
      });
    }
  };

  // Subscribe untuk update dropdown saat kategori berubah
  EventBus.subscribe(EventBus.EVENTS.STATE_CHANGED, (state) => {
    updateCategoryDropdown(state.categories);
  });

  return { reset, clearErrors, updateCategoryDropdown, preventNonNumeric, handleSubmit };
})();

// =============================================================================
// TRANSACTION LIST — Task 8.1 + 8.2
// Menampilkan daftar transaksi dengan fitur hapus dan pengurutan
// =============================================================================

const TransactionList = (() => {
  const formatDate = (isoString) => {
    const d = new Date(isoString);
    const dd = String(d.getDate()).padStart(2, '0');
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const yyyy = d.getFullYear();
    return `${dd}/${mm}/${yyyy}`;
  };

  const render = (state) => {
    const list = document.getElementById('transaction-list');
    const emptyMsg = document.getElementById('transaction-empty-message');
    const filterMsg = document.getElementById('transaction-filter-empty-message');
    if (!list) return;

    const sorted = getSortedTransactions(state.transactions, state.sortOrder);
    list.innerHTML = '';

    if (state.transactions.length === 0) {
      if (emptyMsg) emptyMsg.removeAttribute('hidden');
      if (filterMsg) filterMsg.setAttribute('hidden', '');
      return;
    }

    if (emptyMsg) emptyMsg.setAttribute('hidden', '');
    if (filterMsg) filterMsg.setAttribute('hidden', '');

    sorted.forEach((tx) => {
      const li = document.createElement('li');
      li.className = 'transaction-item';
      li.dataset.id = tx.id;
      li.innerHTML = `
        <div class="transaction-info">
          <span class="transaction-name">${escapeHtml(tx.itemName)}</span>
          <span class="transaction-meta">
            <span class="transaction-category badge">${escapeHtml(tx.category)}</span>
            <span class="transaction-date">${formatDate(tx.timestamp)}</span>
          </span>
        </div>
        <div class="transaction-right">
          <span class="transaction-amount">${formatCurrency(tx.amount)}</span>
          <button type="button" class="btn btn-danger btn-sm btn-delete" data-id="${tx.id}" aria-label="Hapus transaksi ${escapeHtml(tx.itemName)}">🗑</button>
        </div>`;
      list.appendChild(li);
    });
  };

  const updateSortButtons = (sortOrder) => {
    document.querySelectorAll('.btn-sort').forEach((btn) => {
      const isActive = btn.dataset.sort === sortOrder;
      btn.setAttribute('aria-pressed', String(isActive));
      btn.classList.toggle('btn-sort--active', isActive);
    });
  };

  EventBus.subscribe(EventBus.EVENTS.STATE_CHANGED, (state) => {
    render(state);
    updateSortButtons(state.sortOrder);
  });

  return { render, updateSortButtons };
})();

// =============================================================================
// CHART VISUALIZER — Task 9.1
// Merender pie chart menggunakan Chart.js
// =============================================================================

const ChartVisualizer = (() => {
  let chartInstance = null;

  const CHART_COLORS = [
    '#FF6384','#36A2EB','#FFCE56','#4BC0C0','#9966FF',
    '#FF9F40','#C9CBCF','#7BC8A4','#E8A838','#6C8EBF',
    '#D4526E','#2E93FA','#66DA26','#546E7A','#E91E63',
  ];

  const buildChartData = (transactions) => {
    const totals = {};
    transactions.forEach((tx) => {
      totals[tx.category] = (totals[tx.category] || 0) + tx.amount;
    });
    const labels = Object.keys(totals);
    const data = labels.map((l) => totals[l]);
    const backgroundColor = labels.map((_, i) => CHART_COLORS[i % CHART_COLORS.length]);
    return { labels, datasets: [{ data, backgroundColor }] };
  };

  const showPlaceholder = () => {
    const canvas = document.getElementById('expense-chart');
    const placeholder = document.getElementById('chart-placeholder');
    if (canvas) canvas.style.display = 'none';
    if (placeholder) placeholder.removeAttribute('hidden');
    if (chartInstance) { chartInstance.destroy(); chartInstance = null; }
  };

  const render = (transactions) => {
    const canvas = document.getElementById('expense-chart');
    const placeholder = document.getElementById('chart-placeholder');

    if (!transactions || transactions.length === 0) {
      showPlaceholder();
      return;
    }

    if (typeof Chart === 'undefined') {
      if (placeholder) { placeholder.textContent = 'Chart tidak dapat dimuat. Periksa koneksi internet.'; placeholder.removeAttribute('hidden'); }
      if (canvas) canvas.style.display = 'none';
      return;
    }

    if (placeholder) placeholder.setAttribute('hidden', '');
    if (canvas) canvas.style.display = '';

    const chartData = buildChartData(transactions);

    if (chartInstance) {
      chartInstance.data = chartData;
      chartInstance.update();
    } else {
      chartInstance = new Chart(canvas, {
        type: 'pie',
        data: chartData,
        options: {
          responsive: true,
          plugins: {
            legend: { position: 'bottom', labels: { padding: 16, font: { size: 13 } } },
            tooltip: {
              callbacks: {
                label: (ctx) => {
                  const total = ctx.dataset.data.reduce((a, b) => a + b, 0);
                  const pct = total > 0 ? ((ctx.parsed / total) * 100).toFixed(1) : 0;
                  return ` ${ctx.label}: ${formatCurrency(ctx.parsed)} (${pct}%)`;
                },
              },
            },
          },
        },
      });
    }
  };

  EventBus.subscribe(EventBus.EVENTS.STATE_CHANGED, (state) => {
    render(state.transactions);
  });

  return { render, showPlaceholder, buildChartData };
})();

// =============================================================================
// MONTHLY SUMMARY — Task 9.2
// Menampilkan ringkasan pengeluaran per bulan
// =============================================================================

const MonthlySummary = (() => {
  const formatDate = (isoString) => {
    const d = new Date(isoString);
    return `${String(d.getDate()).padStart(2,'0')}/${String(d.getMonth()+1).padStart(2,'0')}/${d.getFullYear()}`;
  };

  const handleMonthSelect = (monthKey, allTransactions) => {
    const group = groupByMonth(allTransactions).find((g) => g.monthKey === monthKey);
    if (!group) return;

    const detailContainer = document.getElementById('monthly-detail-container');
    const detailTitle = document.getElementById('monthly-detail-title');
    const detailList = document.getElementById('monthly-detail-list');
    if (!detailContainer || !detailTitle || !detailList) return;

    detailTitle.textContent = `${group.label} — ${formatCurrency(group.total)}`;
    detailList.innerHTML = '';
    group.transactions.forEach((tx) => {
      const li = document.createElement('li');
      li.className = 'transaction-item';
      li.innerHTML = `
        <div class="transaction-info">
          <span class="transaction-name">${escapeHtml(tx.itemName)}</span>
          <span class="transaction-meta">
            <span class="transaction-category badge">${escapeHtml(tx.category)}</span>
            <span class="transaction-date">${formatDate(tx.timestamp)}</span>
          </span>
        </div>
        <div class="transaction-right">
          <span class="transaction-amount">${formatCurrency(tx.amount)}</span>
        </div>`;
      detailList.appendChild(li);
    });
    detailContainer.removeAttribute('hidden');
  };

  const render = (transactions) => {
    const list = document.getElementById('monthly-list');
    const emptyMsg = document.getElementById('monthly-empty-message');
    if (!list) return;

    const groups = groupByMonth(transactions);
    list.innerHTML = '';

    if (groups.length === 0) {
      if (emptyMsg) emptyMsg.removeAttribute('hidden');
      return;
    }
    if (emptyMsg) emptyMsg.setAttribute('hidden', '');

    groups.forEach((group) => {
      const li = document.createElement('li');
      li.className = 'monthly-item';
      li.innerHTML = `
        <button type="button" class="monthly-item-btn" data-month="${group.monthKey}">
          <span class="monthly-label">${group.label}</span>
          <span class="monthly-total">${formatCurrency(group.total)}</span>
          <span class="monthly-count">${group.transactions.length} transaksi</span>
        </button>`;
      list.appendChild(li);
    });
  };

  EventBus.subscribe(EventBus.EVENTS.STATE_CHANGED, (state) => {
    render(state.transactions);
    // Sembunyikan detail saat data berubah
    const detailContainer = document.getElementById('monthly-detail-container');
    if (detailContainer) detailContainer.setAttribute('hidden', '');
  });

  return { render, handleMonthSelect };
})();

// =============================================================================
// CATEGORY MANAGER — Task 10.1
// Mengelola kategori bawaan dan kategori kustom
// =============================================================================

const CategoryManager = (() => {
  const showError = (message) => {
    const el = document.getElementById('error-category-name');
    if (el) { el.textContent = message; el.removeAttribute('hidden'); }
  };

  const clearError = () => {
    const el = document.getElementById('error-category-name');
    if (el) { el.textContent = ''; el.setAttribute('hidden', ''); }
  };

  const render = (categories) => {
    const list = document.getElementById('category-list');
    if (!list) return;
    list.innerHTML = '';
    categories.forEach((cat) => {
      const li = document.createElement('li');
      li.className = 'category-item';
      li.innerHTML = `<span class="category-name">${escapeHtml(cat.name)}</span>${cat.isDefault ? '<span class="badge badge--default">Bawaan</span>' : '<span class="badge badge--custom">Kustom</span>'}`;
      list.appendChild(li);
    });
    // Update dropdown transaksi
    FormInput.updateCategoryDropdown(categories);
  };

  const handleAddCategory = (name) => {
    clearError();
    const result = AppStore.addCategory(name);
    if (!result.success) {
      showError(result.error.message);
    } else {
      const input = document.getElementById('input-category-name');
      if (input) input.value = '';
    }
  };

  EventBus.subscribe(EventBus.EVENTS.STATE_CHANGED, (state) => {
    render(state.categories);
  });

  return { render, handleAddCategory };
})();

// =============================================================================
// BUDGET ALERT — Task 10.3
// Antarmuka penetapan batas pengeluaran
// =============================================================================

const BudgetAlert = (() => {
  const showError = (message) => {
    const el = document.getElementById('error-budget-limit');
    if (el) { el.textContent = message; el.removeAttribute('hidden'); }
  };

  const clearError = () => {
    const el = document.getElementById('error-budget-limit');
    if (el) { el.textContent = ''; el.setAttribute('hidden', ''); }
  };

  const render = (state) => {
    const display = document.getElementById('budget-limit-display');
    if (display) {
      display.textContent = state.budgetLimit > 0
        ? formatCurrency(state.budgetLimit)
        : 'Belum ditetapkan';
    }
    const input = document.getElementById('input-budget-limit');
    if (input && state.budgetLimit > 0) input.value = state.budgetLimit;
  };

  const handleSetBudget = (value) => {
    clearError();
    const result = AppStore.setBudgetLimit(value);
    if (!result.success) {
      showError(result.error.message);
    } else {
      const input = document.getElementById('input-budget-limit');
      if (input) input.value = '';
    }
  };

  EventBus.subscribe(EventBus.EVENTS.STATE_CHANGED, render);
  return { render, handleSetBudget };
})();

// =============================================================================
// HELPER: escapeHtml
// =============================================================================

/**
 * Escape karakter HTML untuk mencegah XSS.
 * @param {string} str
 * @returns {string}
 */
const escapeHtml = (str) => {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
};

// =============================================================================
// INISIALISASI UTAMA — Task 13.1
// Wiring semua komponen dan event listener
// =============================================================================

const App = (() => {
  const init = () => {
    // 1. Terapkan tema sebelum render untuk mencegah FOUC
    ThemeManager.loadThemeFromStorage();

    // 2. Muat semua data dari Local Storage
    AppStore.loadFromStorage();

    // 3. Render awal semua komponen dengan state yang dimuat
    const state = AppStore.getState();
    BalanceDisplay.render(state);
    TransactionList.render(state);
    ChartVisualizer.render(state.transactions);
    MonthlySummary.render(state.transactions);
    CategoryManager.render(state.categories);
    BudgetAlert.render(state);
    FormInput.updateCategoryDropdown(state.categories);

    // 4. Event listener: form tambah transaksi
    const formTransaction = document.getElementById('form-transaction');
    if (formTransaction) {
      formTransaction.addEventListener('submit', FormInput.handleSubmit);
    }

    // 5. Event listener: cegah non-numerik pada field jumlah
    const inputAmount = document.getElementById('input-amount');
    if (inputAmount) {
      inputAmount.addEventListener('keydown', FormInput.preventNonNumeric);
    }

    // 6. Event listener: tombol toggle tema
    const btnToggleTheme = document.getElementById('btn-toggle-theme');
    if (btnToggleTheme) {
      btnToggleTheme.addEventListener('click', ThemeManager.toggleTheme);
    }

    // 7. Event listener: tombol sort
    document.querySelectorAll('.btn-sort').forEach((btn) => {
      btn.addEventListener('click', () => {
        AppStore.setSortOrder(btn.dataset.sort);
      });
    });

    // 8. Event listener: hapus transaksi (event delegation)
    const transactionList = document.getElementById('transaction-list');
    if (transactionList) {
      transactionList.addEventListener('click', (e) => {
        const btn = e.target.closest('.btn-delete');
        if (!btn) return;
        const id = btn.dataset.id;
        if (!id) return;
        const result = AppStore.deleteTransaction(id);
        if (!result.success && result.error && result.error.type !== 'NOT_FOUND') {
          alert('Gagal menghapus transaksi. Silakan coba lagi.');
        }
      });
    }

    // 9. Event listener: form batas pengeluaran
    const formBudget = document.getElementById('form-budget-limit');
    if (formBudget) {
      formBudget.addEventListener('submit', (e) => {
        e.preventDefault();
        const val = (document.getElementById('input-budget-limit') || {}).value || '';
        BudgetAlert.handleSetBudget(val);
      });
    }

    // 10. Event listener: form tambah kategori
    const formCategory = document.getElementById('form-add-category');
    if (formCategory) {
      formCategory.addEventListener('submit', (e) => {
        e.preventDefault();
        const val = (document.getElementById('input-category-name') || {}).value || '';
        CategoryManager.handleAddCategory(val);
      });
    }

    // 11. Event listener: accordion settings
    const btnToggleSettings = document.getElementById('btn-toggle-settings');
    const settingsContent = document.getElementById('settings-content');
    if (btnToggleSettings && settingsContent) {
      btnToggleSettings.addEventListener('click', () => {
        const isExpanded = btnToggleSettings.getAttribute('aria-expanded') === 'true';
        btnToggleSettings.setAttribute('aria-expanded', String(!isExpanded));
        if (isExpanded) {
          settingsContent.setAttribute('hidden', '');
        } else {
          settingsContent.removeAttribute('hidden');
        }
      });
    }

    // 12. Event listener: ringkasan bulanan — pilih bulan
    const monthlyList = document.getElementById('monthly-list');
    if (monthlyList) {
      monthlyList.addEventListener('click', (e) => {
        const btn = e.target.closest('.monthly-item-btn');
        if (!btn) return;
        const monthKey = btn.dataset.month;
        if (!monthKey) return;
        MonthlySummary.handleMonthSelect(monthKey, AppStore.getState().transactions);
      });
    }

    // 13. Event listener: tutup detail bulanan
    const btnCloseDetail = document.getElementById('btn-close-monthly-detail');
    if (btnCloseDetail) {
      btnCloseDetail.addEventListener('click', () => {
        const detailContainer = document.getElementById('monthly-detail-container');
        if (detailContainer) detailContainer.setAttribute('hidden', '');
      });
    }

    // 14. Event listener: dismiss storage warning banner
    const btnDismiss = document.getElementById('btn-dismiss-banner');
    if (btnDismiss) {
      btnDismiss.addEventListener('click', () => {
        const banner = document.getElementById('storage-warning-banner');
        if (banner) banner.setAttribute('hidden', '');
      });
    }

    // 15. Subscribe ke error storage untuk tampilkan banner
    EventBus.subscribe(EventBus.EVENTS.ERROR_STORAGE, (errorData) => {
      const banner = document.getElementById('storage-warning-banner');
      const msg = document.getElementById('storage-warning-message');
      if (banner && msg) {
        msg.textContent = errorData.message || 'Data sebelumnya tidak dapat dimuat. Memulai dengan data baru.';
        banner.removeAttribute('hidden');
      }
    });

    // 16. Jika localStorage tidak tersedia, tampilkan banner
    if (!StorageService.isAvailable()) {
      const banner = document.getElementById('storage-warning-banner');
      const msg = document.getElementById('storage-warning-message');
      if (banner && msg) {
        msg.textContent = 'Local Storage tidak tersedia di browser ini. Data tidak akan tersimpan.';
        banner.removeAttribute('hidden');
      }
    }
  };

  return { init };
})();

// =============================================================================
// BOOTSTRAP — Jalankan saat DOM siap
// =============================================================================
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', App.init);
} else {
  App.init();
}
