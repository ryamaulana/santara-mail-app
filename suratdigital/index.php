<?php
/**
 * SIPEDIG - Sistem Informasi Persuratan Digital
 * Versi PHP & SQLite Portabel dengan Pengamanan Level Akun (Admin & Viewer),
 * Perbaikan Scroll Layout, dan Batasan Tampilan Dashboard & Halaman Utama Maksimal 5 Surat Terbaru.
 */

// Mulai sesi PHP untuk mengelola login level akun
session_start();

// Tentukan berkas database SQLite dan folder uploads
$db_file = __DIR__ . '/sipedig110.db';
$upload_dir = __DIR__ . '/uploads/';

// Buat direktori upload jika belum ada
if (!is_dir($upload_dir)) {
    @mkdir($upload_dir, 0777, true);
}

try {
    // Hubungkan ke database SQLite (akan otomatis dibuat jika belum ada)
    $db = new PDO("sqlite:" . $db_file);
    $db->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    $db->setAttribute(PDO::ATTR_DEFAULT_FETCH_MODE, PDO::FETCH_ASSOC);
} catch (Exception $e) {
    die("Koneksi ke database SQLite gagal: " . $e->getMessage());
}

// Konstruksi struktur tabel jika belum ada
$db->exec("CREATE TABLE IF NOT EXISTS profil (
    id INTEGER PRIMARY KEY CHECK (id = 1),
    nama_instansi TEXT,
    nama_dinas TEXT,
    alamat TEXT,
    telepon TEXT,
    email TEXT,
    kode_pos TEXT,
    website TEXT
)");

$db->exec("CREATE TABLE IF NOT EXISTS surat_masuk (
    id TEXT PRIMARY KEY,
    no_surat TEXT,
    asal_surat TEXT,
    perihal TEXT,
    tanggal_surat TEXT,
    tanggal_diterima TEXT,
    sifat TEXT,
    status TEXT,
    disposisi TEXT,
    ringkasan TEXT,
    file_surat TEXT
)");

$db->exec("CREATE TABLE IF NOT EXISTS surat_keluar (
    id TEXT PRIMARY KEY,
    no_surat TEXT,
    tujuan TEXT,
    perihal TEXT,
    tanggal_surat TEXT,
    sifat TEXT,
    status TEXT,
    pembuat TEXT,
    isi_ringkas TEXT,
    file_surat TEXT
)");

// Tambahkan kolom file_surat secara aman jika tabel sudah ada dari versi sebelumnya
try {
    $db->exec("ALTER TABLE surat_masuk ADD COLUMN file_surat TEXT");
} catch (Exception $e) {
    // Abaikan jika kolom sudah ada
}
try {
    $db->exec("ALTER TABLE surat_keluar ADD COLUMN file_surat TEXT");
} catch (Exception $e) {
    // Abaikan jika kolom sudah ada
}

// Periksa apakah folder uploads bisa ditulis
$uploads_writable = is_writable($upload_dir);

// Masukkan data profil instansi bawaan jika masih kosong
$count_profil = $db->query("SELECT COUNT(*) FROM profil")->fetchColumn();
if ($count_profil == 0) {
    $db->exec("INSERT INTO profil (id, nama_instansi, nama_dinas, alamat, telepon, email, kode_pos, website) VALUES (
        1,
        'PEMERINTAH PROVINSI DKI JAKARTA',
        'SMA NEGERI 110 JAKARTA',
        'Jl. Bendungan Melayu No,80 Tugu Selatan -Koja Jakarta Utara',
        '(021)-4350059',
        'surat@sman110jkt.sch.id',
        '14260',
        'sma110.pusdatinku.com'
    )");
}

// Masukkan data uji (mock data) Surat Masuk jika kosong
$count_masuk = $db->query("SELECT COUNT(*) FROM surat_masuk")->fetchColumn();
if ($count_masuk == 0) {
    $db->exec("INSERT INTO surat_masuk VALUES 
        ('SM-001', '045.2/120/KPG/2026', 'Kementerian Dalam Negeri', 'Undangan Rapat Koordinasi Nasional Transformasi Digital', '2026-05-10', '2026-05-12', 'Penting', 'Selesai', 'Kadis ke Kabid Aplikasi Informatika untuk dihadiri.', 'Permintaan kehadiran perwakilan dinas pada rakornas tanggal 25 Mei 2026 di Jakarta.', ''),
        ('SM-002', '800/4021-Kepeg/2026', 'Badan Kepegawaian Daerah', 'Pengiriman Peserta Pelatihan Manajemen Arsip Digital', '2026-05-14', '2026-05-15', 'Biasa', 'Diproses', 'Kasubag Kepegawaian untuk koordinasikan daftar peserta.', 'Pelatihan arsip digital untuk 2 orang staf pengelola surat.', ''),
        ('SM-003', 'S-209/M.PANRB/05/2026', 'Kementerian PAN-RB', 'Evaluasi SPBE (Sistem Pemerintahan Berbasis Elektronik) 2026', '2026-05-16', '2026-05-18', 'Rahasia', 'Baru', 'Segera jadwalkan rapat internal persiapan evaluasi SPBE.', 'Penyampaian instrumen penilaian mandiri SPBE tahun anggaran berjalan.', '')
    ");
}

// Masukkan data uji (mock data) Surat Keluar jika kosong
$count_keluar = $db->query("SELECT COUNT(*) FROM surat_keluar")->fetchColumn();
if ($count_keluar == 0) {
    $db->exec("INSERT INTO surat_keluar VALUES 
        ('SK-001', '090/512/DKIS/2026', 'Para Kepala Satuan Kerja Perangkat Daerah', 'Pemberitahuan Migrasi Pusat Data Terpadu', '2026-05-11', 'Penting', 'Dikirim', 'Sekretariat', 'Imbauan pencadangan data mandiri sehubungan dengan pemeliharaan rutin server.', ''),
        ('SK-002', '094/302-Tugas/2026', 'Hendra Wijaya, S.Kom (Pranata Komputer)', 'Surat Tugas Pendampingan Teknis Jaringan Internet', '2026-05-15', 'Biasa', 'Persetujuan', 'Subag Umum', 'Ditugaskan mendampingi integrasi jaringan di Kantor Kecamatan Menteng.', ''),
        ('SK-003', 'Draf-102/2026', 'Direktur Utama PT. Solusi Teknologi', 'Permintaan Presentasi Proposal Aplikasi e-Office', '2026-05-19', 'Biasa', 'Draf', 'Bidang Aptika', 'Permintaan paparan teknis solusi cloud document management system.', '')
    ");
}

// ===================================================
// SISTEM LOGIN & LOGOUT (AUTHENTICATION)
// ===================================================
$login_error = '';
if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['action_auth']) && $_POST['action_auth'] === 'login') {
    $username = trim($_POST['username'] ?? '');
    $password = trim($_POST['password'] ?? '');

    if ($username === 'kasubag' && $password === 'Kasubag110') {
        $_SESSION['user_role'] = 'admin';
        $_SESSION['user_name'] = 'Administrator Utama';
        $_SESSION['user_email'] = 'admin.sipedig@prov.go.id';
        header("Location: index.php?tab=dashboard&msg=Selamat+datang+kembali,+Admin&type=success");
        exit;
    } elseif ($username === 'viewer' && $password === 'viewer123') {
        $_SESSION['user_role'] = 'viewer';
        $_SESSION['user_name'] = 'Petugas Baca (Viewer)';
        $_SESSION['user_email'] = 'viewer.sipedig@prov.go.id';
        header("Location: index.php?tab=dashboard&msg=Berhasil+masuk+sebagai+Viewer&type=success");
        exit;
    } else {
        $login_error = 'Username atau Password yang Anda masukkan keliru!';
    }
}

// Logout Action
if (isset($_GET['action']) && $_GET['action'] === 'logout') {
    session_destroy();
    header("Location: index.php?msg=Anda+telah+keluar+dari+sistem&type=success");
    exit;
}

// Cek Keberadaan Sesi Login (Jika kosong, tampilkan form login)
$user_role = $_SESSION['user_role'] ?? '';
$user_name = $_SESSION['user_name'] ?? '';
$user_email = $_SESSION['user_email'] ?? '';
$is_admin = ($user_role === 'admin');

if (empty($user_role)) {
    // ====================================================================
    // TEMPLATE HALAMAN LOGIN (JIKA BELUM AUTENTIKASI)
    // ====================================================================
    ?>
    <!DOCTYPE html>
    <html lang="id">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>SIPEDIG 110 - Masuk Sistem</title>
      <script src="https://cdn.tailwindcss.com"></script>
      <script src="https://unpkg.com/lucide@latest"></script>
      <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap" rel="stylesheet">
      <style>body { font-family: 'Inter', sans-serif; }</style>
    </head>
    <body class="min-h-screen bg-slate-950 flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden">
      <!-- Ornamen Dekoratif Latar Belakang -->
      <div class="absolute top-0 left-1/4 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl"></div>
      <div class="absolute bottom-0 right-1/4 w-96 h-96 bg-emerald-600/10 rounded-full blur-3xl"></div>

      <div class="sm:mx-auto sm:w-full sm:max-w-md z-10">
        <div class="flex justify-center">
          <div class="bg-indigo-600 p-3 rounded-2xl text-white shadow-xl shadow-indigo-600/20">
            <i data-lucide="mail-open" class="w-10 h-10"></i>
          </div>
        </div>
        <h2 class="mt-6 text-center text-3xl font-extrabold text-white">SIPEDIG 110</h2>
        <p class="mt-2 text-center text-sm text-slate-400">
          Sistem Informasi Persuratan Digital Modern
        </p>
      </div>

      <div class="mt-8 sm:mx-auto sm:w-full sm:max-w-md z-10 px-4">
        <div class="bg-slate-900 py-8 px-6 shadow-2xl rounded-2xl border border-slate-800/80">
          
          <?php if (!empty($login_error)): ?>
            <div class="mb-4 p-3 bg-rose-500/15 border border-rose-500/30 text-rose-400 text-xs rounded-lg flex items-center space-x-2">
              <i data-lucide="alert-circle" class="w-4 h-4 shrink-0"></i>
              <span><?php echo $login_error; ?></span>
            </div>
          <?php endif; ?>

          <?php if (isset($_GET['msg'])): ?>
            <div class="mb-4 p-3 bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-xs rounded-lg flex items-center space-x-2">
              <i data-lucide="check-circle-2" class="w-4 h-4 shrink-0"></i>
              <span><?php echo htmlspecialchars($_GET['msg']); ?></span>
            </div>
          <?php endif; ?>

          <form class="space-y-4" action="index.php" method="POST">
            <input type="hidden" name="action_auth" value="login">
            
            <div>
              <label class="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">Username</label>
              <div class="relative">
                <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                  <i data-lucide="user" class="w-4 h-4"></i>
                </div>
                <input 
                  type="text" 
                  name="username" 
                  required 
                  placeholder="Masukkan nama pengguna..."
                  class="block w-full pl-10 pr-3 py-2.5 bg-slate-950/60 border border-slate-800 rounded-xl text-white text-sm placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
                >
              </div>
            </div>

            <div>
              <label class="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">Password</label>
              <div class="relative">
                <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                  <i data-lucide="lock" class="w-4 h-4"></i>
                </div>
                <input 
                  type="password" 
                  name="password" 
                  required 
                  placeholder="••••••••"
                  class="block w-full pl-10 pr-3 py-2.5 bg-slate-950/60 border border-slate-800 rounded-xl text-white text-sm placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
                >
              </div>
            </div>

            <div class="pt-2">
              <button 
                type="submit" 
                class="w-full flex justify-center py-2.5 px-4 border border-transparent rounded-xl shadow-md text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all duration-150"
              >
                Masuk ke Aplikasi
              </button>
            </div>
          </form>

          <!-- Informasi Kredensial Uji Coba -->
          <div class="mt-6 pt-6 border-t border-slate-800/80 space-y-2 text-xs">
            <p class="text-slate-400 font-bold mb-1">Pusdatin110 (Go SMAN@110):</p>
            <div class="p-2.5 bg-slate-950/50 rounded-xl border border-slate-800 flex justify-between items-center">
              <div>
                <p class="text-slate-200 font-bold">SANTARA Co. (Developer)</p>
                <p class="text-slate-500 font-mono">***: <strong class="text-indigo-400">kasubag</strong> | ***: <strong class="text-indigo-400">Jumedi</strong></p>
              </div>
              <span class="px-2 py-0.5 bg-indigo-500/10 text-indigo-400 font-bold rounded text-[10px]">SMA 110</span>
            </div>
            <div class="p-2.5 bg-slate-950/50 rounded-xl border border-slate-800 flex justify-between items-center">
              <div>
                <p class="text-slate-200 font-bold">Created by Pusdatin110</p>
                <p class="text-slate-500 font-mono">***: <strong class="text-slate-400">Pelopor</strong> | ***: <strong class="text-slate-400">Digitalisasi</strong></p>
              </div>
              <span class="px-2 py-0.5 bg-slate-400/10 text-slate-400 font-bold rounded text-[10px]">Baca</span>
            </div>
          </div>

        </div>
      </div>

      <script>lucide.createIcons();</script>
    </body>
    </html>
    <?php
    exit;
}

// ===================================================
// PROTEKSI AKSI POST UNTUK LEVEL AKSES ADMIN
// ===================================================
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $action = $_POST['action'] ?? '';
    $active_tab = $_POST['active_tab'] ?? 'dashboard';

    // Jika user bukan admin tapi mencoba memicu aksi tulis/ubah/hapus
    $actions_restricted = [
        'tambah_masuk', 'tambah_keluar', 'upload_susulan', 
        'update_tindak_lanjut', 'hapus_masuk', 'hapus_keluar', 
        'simpan_kop', 'simpan_draf_generator'
    ];

    if (!$is_admin && in_array($action, $actions_restricted)) {
        header("Location: index.php?tab=" . $active_tab . "&msg=Aksi+ditolak!+Anda+tidak+memiliki+akses+Admin&type=error");
        exit;
    }

    // 1. Tambah Agenda Surat Masuk
    if ($action === 'tambah_masuk') {
        // Proses Upload File Fisik Surat
        $file_surat = '';
        if (isset($_FILES['file_surat']) && $_FILES['file_surat']['error'] === UPLOAD_ERR_OK) {
            $file_extension = strtolower(pathinfo($_FILES['file_surat']['name'], PATHINFO_EXTENSION));
            $allowed_extensions = ['pdf', 'jpg', 'jpeg', 'png', 'gif'];
            
            if (in_array($file_extension, $allowed_extensions)) {
                $unique_filename = 'SM_' . time() . '_' . preg_replace("/[^a-zA-Z0-9\._-]/", "", $_FILES['file_surat']['name']);
                if (move_uploaded_file($_FILES['file_surat']['tmp_name'], $upload_dir . $unique_filename)) {
                    $file_surat = $unique_filename;
                }
            }
        }

        // Cari nomor urutan ID baru
        $stmt_id = $db->query("SELECT id FROM surat_masuk ORDER BY id DESC LIMIT 1");
        $last_id = $stmt_id->fetchColumn();
        $next_num = 1;
        if ($last_id) {
            $next_num = ((int) substr($last_id, 3)) + 1;
        }
        $new_id = 'SM-' . str_pad($next_num, 3, '0', STR_PAD_LEFT);

        $stmt = $db->prepare("INSERT INTO surat_masuk (id, no_surat, asal_surat, perihal, tanggal_surat, tanggal_diterima, sifat, status, disposisi, ringkasan, file_surat) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");
        $stmt->execute([
            $new_id,
            $_POST['no_surat'],
            $_POST['asal_surat'],
            $_POST['perihal'],
            $_POST['tanggal_surat'],
            $_POST['tanggal_diterima'] ?: date('Y-m-d'),
            $_POST['sifat'],
            $_POST['status'],
            $_POST['disposisi'],
            $_POST['ringkasan'],
            $file_surat
        ]);
        header("Location: index.php?tab=" . $active_tab . "&msg=Surat+masuk+berhasil+ditambahkan&type=success");
        exit;
    }

    // 2. Tambah / Registrasi Surat Keluar
    if ($action === 'tambah_keluar') {
        // Proses Upload File Fisik Surat
        $file_surat = '';
        if (isset($_FILES['file_surat']) && $_FILES['file_surat']['error'] === UPLOAD_ERR_OK) {
            $file_extension = strtolower(pathinfo($_FILES['file_surat']['name'], PATHINFO_EXTENSION));
            $allowed_extensions = ['pdf', 'jpg', 'jpeg', 'png', 'gif'];
            
            if (in_array($file_extension, $allowed_extensions)) {
                $unique_filename = 'SK_' . time() . '_' . preg_replace("/[^a-zA-Z0-9\._-]/", "", $_FILES['file_surat']['name']);
                if (move_uploaded_file($_FILES['file_surat']['tmp_name'], $upload_dir . $unique_filename)) {
                    $file_surat = $unique_filename;
                }
            }
        }

        $stmt_id = $db->query("SELECT id FROM surat_keluar ORDER BY id DESC LIMIT 1");
        $last_id = $stmt_id->fetchColumn();
        $next_num = 1;
        if ($last_id) {
            $next_num = ((int) substr($last_id, 3)) + 1;
        }
        $new_id = 'SK-' . str_pad($next_num, 3, '0', STR_PAD_LEFT);

        $stmt = $db->prepare("INSERT INTO surat_keluar (id, no_surat, tujuan, perihal, tanggal_surat, sifat, status, pembuat, isi_ringkas, file_surat) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");
        $stmt->execute([
            $new_id,
            $_POST['no_surat'],
            $_POST['tujuan'],
            $_POST['perihal'],
            $_POST['tanggal_surat'],
            $_POST['sifat'],
            $_POST['status'] ?: 'Draf',
            'Admin',
            $_POST['ringkasan'],
            $file_surat
        ]);
        header("Location: index.php?tab=" . $active_tab . "&msg=Surat+keluar+berhasil+diregistrasi&type=success");
        exit;
    }

    // 3. Upload Berkas Susulan (Dari halaman Detail)
    if ($action === 'upload_susulan') {
        $id = $_POST['id'] ?? '';
        $type = $_POST['type'] ?? ''; // 'masuk' atau 'keluar'
        $file_surat = '';

        if (isset($_FILES['file_surat']) && $_FILES['file_surat']['error'] === UPLOAD_ERR_OK) {
            $file_extension = strtolower(pathinfo($_FILES['file_surat']['name'], PATHINFO_EXTENSION));
            $allowed_extensions = ['pdf', 'jpg', 'jpeg', 'png', 'gif'];

            if (in_array($file_extension, $allowed_extensions)) {
                $prefix = $type === 'masuk' ? 'SM_' : 'SK_';
                $unique_filename = $prefix . time() . '_' . preg_replace("/[^a-zA-Z0-9\._-]/", "", $_FILES['file_surat']['name']);
                if (move_uploaded_file($_FILES['file_surat']['tmp_name'], $upload_dir . $unique_filename)) {
                    $file_surat = $unique_filename;

                    $table = $type === 'masuk' ? 'surat_masuk' : 'surat_keluar';
                    $stmt = $db->prepare("UPDATE $table SET file_surat = ? WHERE id = ?");
                    $stmt->execute([$file_surat, $id]);

                    header("Location: index.php?tab=" . ($type === 'masuk' ? 'surat-masuk' : 'surat-keluar') . "&msg=Berkas+digital+berhasil+diunggah&type=success");
                    exit;
                }
            }
        }
        header("Location: index.php?tab=" . ($type === 'masuk' ? 'surat-masuk' : 'surat-keluar') . "&msg=Gagal+mengunggah+berkas&type=error");
        exit;
    }

    // 4. Tindak Lanjut Surat (Update Status & Disposisi)
    if ($action === 'update_tindak_lanjut') {
        $id = $_POST['id'] ?? '';
        $type = $_POST['type'] ?? ''; // 'masuk' atau 'keluar'
        $status = $_POST['status'] ?? '';
        $disposisi = $_POST['disposisi'] ?? '';

        if ($type === 'masuk') {
            $stmt = $db->prepare("UPDATE surat_masuk SET status = ?, disposisi = ? WHERE id = ?");
            $stmt->execute([$status, $disposisi, $id]);
        } else {
            $stmt = $db->prepare("UPDATE surat_keluar SET status = ? WHERE id = ?");
            $stmt->execute([$status, $id]);
        }

        header("Location: index.php?tab=" . ($type === 'masuk' ? 'surat-masuk' : 'surat-keluar') . "&msg=Tindak+lanjut+surat+berhasil+diperbarui&type=success");
        exit;
    }

    // 5. Hapus Surat Masuk
    if ($action === 'hapus_masuk') {
        $id = $_POST['id'] ?? '';
        // Hapus file fisik jika ada
        $stmt_file = $db->prepare("SELECT file_surat FROM surat_masuk WHERE id = ?");
        $stmt_file->execute([$id]);
        $file_name = $stmt_file->fetchColumn();
        if ($file_name && is_file($upload_dir . $file_name)) {
            @unlink($upload_dir . $file_name);
        }

        $stmt = $db->prepare("DELETE FROM surat_masuk WHERE id = ?");
        $stmt->execute([$id]);
        header("Location: index.php?tab=" . $active_tab . "&msg=Surat+masuk+berhasil+dihapus&type=error");
        exit;
    }

    // 6. Hapus Surat Keluar
    if ($action === 'hapus_keluar') {
        $id = $_POST['id'] ?? '';
        // Hapus file fisik jika ada
        $stmt_file = $db->prepare("SELECT file_surat FROM surat_keluar WHERE id = ?");
        $stmt_file->execute([$id]);
        $file_name = $stmt_file->fetchColumn();
        if ($file_name && is_file($upload_dir . $file_name)) {
            @unlink($upload_dir . $file_name);
        }

        $stmt = $db->prepare("DELETE FROM surat_keluar WHERE id = ?");
        $stmt->execute([$id]);
        header("Location: index.php?tab=" . $active_tab . "&msg=Surat+keluar+berhasil+dihapus&type=error");
        exit;
    }

    // 7. Perbarui Konfigurasi Kop Surat
    if ($action === 'simpan_kop') {
        $stmt = $db->prepare("UPDATE profil SET nama_instansi = ?, nama_dinas = ?, alamat = ?, telepon = ?, email = ?, kode_pos = ?, website = ? WHERE id = 1");
        $stmt->execute([
            $_POST['nama_instansi'],
            $_POST['nama_dinas'],
            $_POST['alamat'],
            $_POST['telepon'],
            $_POST['email'],
            $_POST['kode_pos'],
            $_POST['website']
        ]);
        header("Location: index.php?tab=" . $active_tab . "&msg=Konfigurasi+Kop+Surat+berhasil+disimpan&type=success");
        exit;
    }

    // 8. Simpan Hasil Generator Surat Dinas ke Log Surat Keluar
    if ($action === 'simpan_draf_generator') {
        $stmt_id = $db->query("SELECT id FROM surat_keluar ORDER BY id DESC LIMIT 1");
        $last_id = $stmt_id->fetchColumn();
        $next_num = 1;
        if ($last_id) {
            $next_num = ((int) substr($last_id, 3)) + 1;
        }
        $new_id = 'SK-' . str_pad($next_num, 3, '0', STR_PAD_LEFT);

        $stmt = $db->prepare("INSERT INTO surat_keluar (id, no_surat, tujuan, perihal, tanggal_surat, sifat, status, pembuat, isi_ringkas, file_surat) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");
        $stmt->execute([
            $new_id,
            $_POST['nomorSurat'],
            $_POST['penerimaNama'],
            $_POST['jenisSurat'] . ": " . $_POST['hal'],
            $_POST['tanggalSurat'],
            'Biasa',
            'Draf',
            'Generator Otomatis',
            $_POST['isiSurat'],
            ''
        ]);
        header("Location: index.php?tab=surat-keluar&msg=Surat+disimpan+sebagai+Draf+Registrasi&type=success");
        exit;
    }
}

// ===================================================
// PENGAMBILAN DATA DARI DATABASE SQLITE
// ===================================================
$profil = $db->query("SELECT * FROM profil WHERE id = 1")->fetch();
$surat_masuk_list = $db->query("SELECT * FROM surat_masuk ORDER BY id DESC")->fetchAll();
$surat_keluar_list = $db->query("SELECT * FROM surat_keluar ORDER BY id DESC")->fetchAll();

// Perhitungan Statistik
$total_masuk = count($surat_masuk_list);
$total_keluar = count($surat_keluar_list);

$disposisi_aktif = 0;
foreach ($surat_masuk_list as $sm) {
    if ($sm['status'] === 'Diproses') {
        $disposisi_aktif++;
    }
}

$pending_review = 0;
foreach ($surat_keluar_list as $sk) {
    if ($sk['status'] === 'Persetujuan') {
        $pending_review++;
    }
}

// Membaca URL Query params untuk tab default & Toast
$active_tab_query = $_GET['tab'] ?? 'dashboard';
$toast_msg = $_GET['msg'] ?? '';
$toast_type = $_GET['type'] ?? 'success';
?>
<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>SIPEDIG 110 - Portal Persuratan Digital</title>
  
  <!-- Tailwind CSS CDN -->
  <script src="https://cdn.tailwindcss.com"></script>
  
  <!-- Lucide Icons CDN -->
  <script src="https://unpkg.com/lucide@latest"></script>

  <!-- Google Fonts -->
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&family=Playfair+Display:ital,wght@0,400;0,700;1,400&display=swap" rel="stylesheet">

  <style>
    body {
      font-family: 'Inter', sans-serif;
    }
    .font-serif {
      font-family: 'Playfair Display', Georgia, serif;
    }
    /* Animasi Lembut */
    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(8px); }
      to { opacity: 1; transform: translateY(0); }
    }
    .animate-fadeIn {
      animation: fadeIn 0.25s ease-out forwards;
    }
  </style>
</head>
<body class="h-screen w-screen bg-slate-50 text-slate-800 flex overflow-hidden">

  <!-- MOBILE SIDEBAR OVERLAY -->
  <div id="sidebar-overlay" class="fixed inset-0 bg-slate-900/60 z-40 hidden lg:hidden transition-opacity"></div>

  <!-- SIDEBAR (DIKUNCI DENGAN STRICT FLEXBOX AGAR TIDAK OVERFLOW DI LAPTOP) -->
  <aside id="mobile-sidebar" class="fixed inset-y-0 left-0 z-50 w-64 h-screen max-h-screen bg-slate-900 text-slate-100 flex flex-col justify-between border-r border-slate-800 shrink-0 transition-transform duration-300 ease-in-out -translate-x-full lg:static lg:translate-x-0 lg:h-screen lg:max-h-screen overflow-hidden print:hidden">
    
    <!-- Brand App -->
    <div class="p-6 border-b border-slate-800 flex items-center justify-between shrink-0">
      <div class="flex items-center space-x-3">
        <div class="bg-indigo-600 p-2 rounded-lg text-white">
          <i data-lucide="mail-open" class="w-6 h-6"></i>
        </div>
        <div>
          <h1 class="font-bold text-lg leading-tight">SIPEDIG 110</h1>
          <p class="text-xs text-slate-400">E-Persuratan Modern</p>
        </div>
      </div>
      <button onclick="toggleSidebar(false)" class="lg:hidden text-slate-400 hover:text-white">
        <i data-lucide="x" class="w-5 h-5"></i>
      </button>
    </div>

    <!-- Menu Navigasi (Menggunakan scroll mandiri jika list menu penuh, dikunci dengan min-h-0) -->
    <nav class="flex-1 px-4 py-6 space-y-1.5 overflow-y-auto min-h-0">
      <button 
        onclick="switchTab('dashboard')"
        data-tab="dashboard"
        class="sidebar-btn w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-sm font-medium transition-all"
      >
        <i data-lucide="layout-dashboard" class="w-[18px] h-[18px]"></i>
        <span>Dashboard</span>
      </button>

      <button 
        onclick="switchTab('surat-masuk')"
        data-tab="surat-masuk"
        class="sidebar-btn w-full flex items-center justify-between px-4 py-3 rounded-lg text-sm font-medium transition-all"
      >
        <div class="flex items-center space-x-3">
          <i data-lucide="arrow-down-left" class="w-[18px] h-[18px] text-emerald-400"></i>
          <span>Surat Masuk</span>
        </div>
        <span class="bg-emerald-500/20 text-emerald-400 text-xs px-2 py-0.5 rounded-full font-bold">
          <?php echo $total_masuk; ?>
        </span>
      </button>

      <button 
        onclick="switchTab('surat-keluar')"
        data-tab="surat-keluar"
        class="sidebar-btn w-full flex items-center justify-between px-4 py-3 rounded-lg text-sm font-medium transition-all"
      >
        <div class="flex items-center space-x-3">
          <i data-lucide="arrow-up-right" class="w-[18px] h-[18px] text-sky-400"></i>
          <span>Surat Keluar</span>
        </div>
        <span class="bg-sky-500/20 text-sky-400 text-xs px-2 py-0.5 rounded-full font-bold">
          <?php echo $total_keluar; ?>
        </span>
      </button>

      <button 
        onclick="switchTab('buat-surat')"
        data-tab="buat-surat"
        class="sidebar-btn w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-sm font-medium transition-all"
      >
        <i data-lucide="file-text" class="w-[18px] h-[18px] text-amber-400"></i>
        <span>Pembuat Surat (A4)</span>
      </button>

      <button 
        onclick="switchTab('pengaturan')"
        data-tab="pengaturan"
        class="sidebar-btn w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-sm font-medium transition-all"
      >
        <i data-lucide="settings" class="w-[18px] h-[18px]"></i>
        <span>Pengaturan Kop</span>
      </button>
    </nav>

    <!-- Info Pengguna & Tombol Logout (Selalu berada di bagian paling bawah) -->
    <div class="p-4 border-t border-slate-800 bg-slate-950/50 flex flex-col space-y-3 shrink-0">
      <div class="flex items-center space-x-3">
        <div class="w-10 h-10 rounded-full bg-indigo-50/20 text-indigo-400 flex items-center justify-center font-bold shrink-0">
          <?php echo $is_admin ? 'ADM' : 'VWR'; ?>
        </div>
        <div class="overflow-hidden">
          <div class="flex items-center space-x-1.5">
            <p class="text-xs font-semibold text-slate-200 truncate"><?php echo htmlspecialchars($user_name); ?></p>
            <span class="px-1.5 py-0.5 rounded text-[8px] font-bold shrink-0 <?php echo $is_admin ? 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/30' : 'bg-slate-500/20 text-slate-400 border border-slate-500/30'; ?>">
              <?php echo $is_admin ? 'Admin' : 'Viewer'; ?>
            </span>
          </div>
          <p class="text-[10px] text-slate-400 truncate"><?php echo htmlspecialchars($user_email); ?></p>
        </div>
      </div>
      <!-- Tombol Logout -->
      <a 
        href="index.php?action=logout" 
        class="w-full py-2 px-3 bg-rose-950/30 hover:bg-rose-900/40 border border-rose-900/30 rounded-lg text-xs font-semibold text-rose-400 flex items-center justify-center space-x-2 transition cursor-pointer"
      >
        <i data-lucide="log-out" class="w-3.5 h-3.5"></i>
        <span>Keluar Sistem</span>
      </a>
    </div>
  </aside>

  <!-- AREA KONTEN UTAMA -->
  <main class="flex-1 flex flex-col min-w-0 bg-slate-50 print:bg-white print:p-0">
    
    <!-- HEADER (DITAMBAHKAN TOMBOL LOGOUT CADANGAN BAGI LAPTOP/DESKTOP SEBAGAI BACKUP HANDAL) -->
    <header class="h-16 border-b border-slate-200 bg-white flex items-center justify-between px-4 sm:px-8 shrink-0 print:hidden">
      <div class="flex items-center space-x-3">
        <button onclick="toggleSidebar(true)" class="lg:hidden p-2 text-slate-600 hover:bg-slate-100 rounded-lg">
          <i data-lucide="menu" class="w-5 h-5"></i>
        </button>
        <h2 id="header-title" class="text-base sm:text-lg font-bold text-slate-800 capitalize truncate">
          Dashboard
        </h2>
      </div>
      
      <div class="flex items-center space-x-4">
        <span class="text-xs sm:text-sm text-slate-500 hidden md:inline">
          Hari ini: <strong class="text-slate-700">Rabu, 20 Mei 2026</strong>
        </span>
        <div class="h-8 w-px bg-slate-200 hidden md:block"></div>
        <div class="flex items-center space-x-2 truncate">
          <i data-lucide="building" class="w-[18px] h-[18px] text-slate-400 shrink-0"></i>
          <span class="text-xs sm:text-sm font-semibold text-indigo-600 truncate max-w-[120px] sm:max-w-none">
            <?php echo htmlspecialchars($profil['nama_dinas']); ?>
          </span>
        </div>
        <!-- Tombol Keluar Cepat untuk Laptop/Desktop -->
        <div class="h-8 w-px bg-slate-200 hidden lg:block"></div>
        <a 
          href="index.php?action=logout" 
          class="hidden lg:flex items-center space-x-1.5 px-3 py-1.5 bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-600 rounded-lg text-xs font-semibold transition"
          title="Keluar dari sistem"
        >
          <i data-lucide="log-out" class="w-3.5 h-3.5"></i>
          <span>Keluar</span>
        </a>
      </div>
    </header>

    <!-- AREA KONTEN SCROLLABLE -->
    <div class="flex-1 overflow-y-auto p-4 sm:p-8 pb-24 sm:pb-32 print:p-0">

      <!-- Peringatan Direktori Uploads jika tidak writable -->
      <?php if (!$uploads_writable): ?>
        <div class="bg-rose-50 border border-rose-200 text-rose-800 p-4 rounded-xl text-xs mb-6 print:hidden">
          <div class="flex items-center space-x-2">
            <i data-lucide="alert-triangle" class="text-rose-600 shrink-0"></i>
            <span><strong>Pemberitahuan Sistem:</strong> Folder <code>/uploads</code> tidak dapat ditulis oleh sistem. Fitur upload file fisik tidak akan berfungsi dengan benar sampai Anda mengatur hak akses folder (CHMOD 777).</span>
          </div>
        </div>
      <?php endif; ?>
      
      <!-- TOAST NOTIFICATION (PHP TRIGGERED) -->
      <?php if ($toast_msg): ?>
        <div id="toast-notif" class="fixed top-4 right-4 z-50 flex items-center space-x-3 px-4 py-3 rounded-lg shadow-xl text-white transition-all transform duration-300 <?php echo $toast_type === 'error' ? 'bg-rose-600' : 'bg-emerald-600'; ?>">
          <i data-lucide="check-circle-2" class="w-[18px] h-[18px]"></i>
          <span class="text-sm font-medium"><?php echo htmlspecialchars($toast_msg); ?></span>
        </div>
      <?php endif; ?>

      <!-- ==================================================================== -->
      <!-- TAB: DASHBOARD PANE -->
      <!-- ==================================================================== -->
      <div id="pane-dashboard" class="tab-content space-y-6 sm:space-y-8 animate-fadeIn hidden">
        <!-- Banner Sambutan & Pintasan -->
        <div class="bg-gradient-to-r from-indigo-700 via-indigo-800 to-slate-900 rounded-2xl p-6 sm:p-8 text-white shadow-xl flex flex-col xl:flex-row justify-between items-start xl:items-center gap-6">
          <div class="space-y-2">
            <h3 class="text-xl sm:text-2xl font-bold">Selamat Datang di Portal SIPEDIG 110</h3>
            <p class="text-indigo-200 text-xs sm:text-sm max-w-xl">
              Sistem informasi manajemen surat dengan database relasional terintegrasi. Catat agenda dinas, lakukan disposisi, dan buat draf naskah A4 secara instan.
            </p>
          </div>
          <div class="flex flex-wrap gap-3 w-full xl:w-auto">
            <?php if ($is_admin): ?>
              <button onclick="openAddModal('masuk')" class="flex-1 sm:flex-initial bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-xs sm:text-sm px-4 py-2.5 rounded-lg flex items-center justify-center space-x-2 transition shadow-lg shadow-emerald-900/30">
                <i data-lucide="plus" class="w-4 h-4"></i>
                <span>Catat Surat Masuk</span>
              </button>
            <?php endif; ?>
            <button onclick="switchTab('buat-surat')" class="flex-1 sm:flex-initial bg-white/15 hover:bg-white/25 text-white font-medium text-xs sm:text-sm px-4 py-2.5 rounded-lg flex items-center justify-center space-x-2 transition border border-white/20">
              <i data-lucide="file-text" class="w-4 h-4"></i>
              <span>Buat Surat Dinas</span>
            </button>
          </div>
        </div>

        <!-- STAT CARDS -->
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          <div class="bg-white p-5 sm:p-6 rounded-xl border border-slate-200 shadow-sm flex items-center space-x-4">
            <div class="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
              <i data-lucide="arrow-down-left" class="w-6 h-6"></i>
            </div>
            <div>
              <p class="text-[10px] sm:text-xs text-slate-400 font-medium uppercase tracking-wider">Total Surat Masuk</p>
              <h4 class="text-xl sm:text-2xl font-extrabold text-slate-800"><?php echo $total_masuk; ?></h4>
            </div>
          </div>

          <div class="bg-white p-5 sm:p-6 rounded-xl border border-slate-200 shadow-sm flex items-center space-x-4">
            <div class="p-3 bg-sky-50 text-sky-600 rounded-xl">
              <i data-lucide="arrow-up-right" class="w-6 h-6"></i>
            </div>
            <div>
              <p class="text-[10px] sm:text-xs text-slate-400 font-medium uppercase tracking-wider">Total Surat Keluar</p>
              <h4 class="text-xl sm:text-2xl font-extrabold text-slate-800"><?php echo $total_keluar; ?></h4>
            </div>
          </div>

          <div class="bg-white p-5 sm:p-6 rounded-xl border border-slate-200 shadow-sm flex items-center space-x-4">
            <div class="p-3 bg-amber-50 text-amber-600 rounded-xl">
              <i data-lucide="clock" class="w-6 h-6"></i>
            </div>
            <div>
              <p class="text-[10px] sm:text-xs text-slate-400 font-medium uppercase tracking-wider">Disposisi Berjalan</p>
              <h4 class="text-xl sm:text-2xl font-extrabold text-slate-800"><?php echo $disposisi_aktif; ?></h4>
            </div>
          </div>

          <div class="bg-white p-5 sm:p-6 rounded-xl border border-slate-200 shadow-sm flex items-center space-x-4">
            <div class="p-3 bg-rose-50 text-rose-600 rounded-xl">
              <i data-lucide="alert-triangle" class="w-6 h-6"></i>
            </div>
            <div>
              <p class="text-[10px] sm:text-xs text-slate-400 font-medium uppercase tracking-wider">Butuh Persetujuan</p>
              <h4 class="text-xl sm:text-2xl font-extrabold text-slate-800"><?php echo $pending_review; ?></h4>
            </div>
          </div>
        </div>

        <!-- DUA KOLOM SINKRON / SIMETRIS: DIKUNCI HANYA MAKSIMAL 5 SURAT TERBARU -->
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8 pb-10">
          
          <!-- Kiri: 5 Surat Masuk Terbaru -->
          <div class="bg-white p-5 sm:p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
            <div class="flex items-center justify-between border-b border-slate-100 pb-4">
              <div class="flex items-center space-x-2">
                <i data-lucide="arrow-down-left" class="w-[18px] h-[18px] text-emerald-500"></i>
                <h3 class="font-bold text-slate-800 text-sm sm:text-base">5 Surat Masuk Terbaru</h3>
              </div>
              <button onclick="switchTab('surat-masuk')" class="text-xs text-indigo-600 font-semibold hover:underline">
                Lihat Semua
              </button>
            </div>

            <div class="divide-y divide-slate-100">
              <?php if (empty($surat_masuk_list)): ?>
                <p class="text-xs text-slate-400 py-6 text-center">Belum ada agenda surat masuk.</p>
              <?php else: 
                // Mengambil maksimal 5 data terbaru
                $limited_masuk = array_slice($surat_masuk_list, 0, 5);
                foreach ($limited_masuk as $sm_item):
                  $sifat_color = $sm_item['sifat'] === 'Penting' ? 'bg-amber-100 text-amber-700' : ($sm_item['sifat'] === 'Rahasia' ? 'bg-rose-100 text-rose-700' : 'bg-slate-100 text-slate-700');
                  $status_color = $sm_item['status'] === 'Selesai' ? 'bg-emerald-100 text-emerald-800' : ($sm_item['status'] === 'Diproses' ? 'bg-amber-100 text-amber-800' : 'bg-blue-100 text-blue-800');
              ?>
                <div class="py-3.5 first:pt-0 last:pb-0 flex items-start justify-between gap-4 cursor-pointer hover:bg-slate-50/60 p-1.5 rounded-lg transition" onclick="viewDetail('masuk', '<?php echo $sm_item['id']; ?>')">
                  <div class="space-y-1 pr-2 min-w-0">
                    <div class="flex items-center space-x-2">
                      <span class="inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-bold <?php echo $sifat_color; ?>">
                        <?php echo htmlspecialchars($sm_item['sifat']); ?>
                      </span>
                      <span class="text-[10px] font-mono text-slate-400 font-semibold"><?php echo htmlspecialchars($sm_item['id']); ?></span>
                    </div>
                    <h5 class="font-bold text-xs sm:text-sm text-slate-700 truncate"><?php echo htmlspecialchars($sm_item['perihal']); ?></h5>
                    <div class="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[10px] text-slate-400">
                      <span class="truncate max-w-[150px]">Dari: <?php echo htmlspecialchars($sm_item['asal_surat']); ?></span>
                      <span>•</span>
                      <span><?php echo htmlspecialchars($sm_item['tanggal_diterima']); ?></span>
                    </div>
                  </div>
                  <span class="shrink-0 text-[10px] px-2 py-1 rounded font-bold <?php echo $status_color; ?>">
                    <?php echo htmlspecialchars($sm_item['status']); ?>
                  </span>
                </div>
              <?php endforeach; endif; ?>
            </div>
          </div>

          <!-- Kanan: 5 Surat Keluar Terbaru -->
          <div class="bg-white p-5 sm:p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
            <div class="flex items-center justify-between border-b border-slate-100 pb-4">
              <div class="flex items-center space-x-2">
                <i data-lucide="arrow-up-right" class="w-[18px] h-[18px] text-sky-500"></i>
                <h3 class="font-bold text-slate-800 text-sm sm:text-base">5 Surat Keluar Terbaru</h3>
              </div>
              <button onclick="switchTab('surat-keluar')" class="text-xs text-indigo-600 font-semibold hover:underline">
                Lihat Semua
              </button>
            </div>

            <div class="divide-y divide-slate-100">
              <?php if (empty($surat_keluar_list)): ?>
                <p class="text-xs text-slate-400 py-6 text-center">Belum ada agenda surat keluar.</p>
              <?php else: 
                // Mengambil maksimal 5 data terbaru
                $limited_keluar = array_slice($surat_keluar_list, 0, 5);
                foreach ($limited_keluar as $sk_item):
                  $sifat_color = $sk_item['sifat'] === 'Penting' ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-700';
                  $status_style = $sk_item['status'] === 'Dikirim' ? 'bg-emerald-100 text-emerald-800' : ($sk_item['status'] === 'Persetujuan' ? 'bg-amber-100 text-amber-800' : 'bg-slate-100 text-slate-700');
              ?>
                <div class="py-3.5 first:pt-0 last:pb-0 flex items-start justify-between gap-4 cursor-pointer hover:bg-slate-50/60 p-1.5 rounded-lg transition" onclick="viewDetail('keluar', '<?php echo $sk_item['id']; ?>')">
                  <div class="space-y-1 pr-2 min-w-0">
                    <div class="flex items-center space-x-2">
                      <span class="inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-bold <?php echo $sifat_color; ?>">
                        <?php echo htmlspecialchars($sk_item['sifat']); ?>
                      </span>
                      <span class="text-[10px] font-mono text-slate-400 font-semibold"><?php echo htmlspecialchars($sk_item['id']); ?></span>
                    </div>
                    <h5 class="font-bold text-xs sm:text-sm text-slate-700 truncate"><?php echo htmlspecialchars($sk_item['perihal']); ?></h5>
                    <div class="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[10px] text-slate-400">
                      <span class="truncate max-w-[150px]">Ke: <?php echo htmlspecialchars($sk_item['tujuan']); ?></span>
                      <span>•</span>
                      <span><?php echo htmlspecialchars($sk_item['tanggal_surat']); ?></span>
                    </div>
                  </div>
                  <span class="shrink-0 text-[10px] px-2 py-1 rounded font-bold <?php echo $status_style; ?>">
                    <?php echo htmlspecialchars($sk_item['status']); ?>
                  </span>
                </div>
              <?php endforeach; endif; ?>
            </div>
          </div>

        </div>
      </div>

      <!-- ==================================================================== -->
      <!-- TAB: SURAT MASUK PANE (DIBATASI MAKSIMAL 5 SURAT TERBARU) -->
      <!-- ==================================================================== -->
      <div id="pane-surat-masuk" class="tab-content space-y-6 animate-fadeIn hidden">
        
        <!-- Filter & Pencarian -->
        <div class="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-4 rounded-xl border border-slate-200">
          <div class="flex flex-col sm:flex-row flex-1 items-stretch sm:items-center gap-3">
            <div class="relative flex-1">
              <i data-lucide="search" class="absolute left-3 top-2.5 text-slate-400 w-[18px] h-[18px]"></i>
              <input 
                type="text" 
                id="search-input-masuk"
                placeholder="Cari nomor, pengirim, atau hal..."
                onkeyup="applyFilterAndSearch('masuk')"
                class="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            
            <div class="flex items-center space-x-2 bg-slate-50 border border-slate-200 px-3 py-2 rounded-lg">
              <i data-lucide="filter" class="text-slate-400 w-4 h-4"></i>
              <select 
                id="filter-sifat-masuk"
                onchange="applyFilterAndSearch('masuk')"
                class="bg-transparent text-sm focus:outline-none text-slate-600 w-full"
              >
                <option value="Semua">Semua Sifat</option>
                <option value="Biasa">Biasa</option>
                <option value="Penting">Penting</option>
                <option value="Rahasia">Rahasia</option>
              </select>
            </div>
          </div>

          <?php if ($is_admin): ?>
            <button onclick="openAddModal('masuk')" class="bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold px-4 py-2.5 rounded-lg flex items-center justify-center space-x-2 transition">
              <i data-lucide="plus" class="w-4 h-4"></i>
              <span>Agenda Baru</span>
            </button>
          <?php endif; ?>
        </div>

        <!-- Tabel Surat Masuk -->
        <div class="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div class="px-6 py-3 bg-slate-50 border-b border-slate-100 flex justify-between items-center text-xs text-slate-500 font-medium">
            <span>Menampilkan 5 surat terbaru (Total Terarsip: <?php echo $total_masuk; ?>)</span>
          </div>
          <div class="overflow-x-auto">
            <table class="w-full text-left border-collapse min-w-[700px]">
              <thead>
                <tr class="bg-slate-50/50 text-slate-400 font-bold text-xs uppercase tracking-wider border-b border-slate-200">
                  <th class="px-6 py-4">No. Agenda</th>
                  <th class="px-6 py-4">Sifat & Tanggal</th>
                  <th class="px-6 py-4">Pengirim / No. Surat</th>
                  <th class="px-6 py-4">Perihal</th>
                  <th class="px-6 py-4">Status & Disposisi</th>
                  <th class="px-6 py-4 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody id="surat-masuk-tbody" class="divide-y divide-slate-100 text-sm">
                <?php if (empty($surat_masuk_list)): ?>
                  <tr id="no-data-masuk">
                    <td colSpan="6" class="px-6 py-12 text-center text-slate-400">Tidak ada data surat masuk ditemukan.</td>
                  </tr>
                <?php else: 
                  // Dibatasi hanya 5 surat terbaru
                  $limited_page_masuk = array_slice($surat_masuk_list, 0, 5);
                  foreach ($limited_page_masuk as $row): 
                    $sifat_style = $row['sifat'] === 'Penting' ? 'bg-amber-100 text-amber-700' : ($row['sifat'] === 'Rahasia' ? 'bg-rose-100 text-rose-700' : 'bg-slate-100 text-slate-600');
                    $status_style = $row['status'] === 'Selesai' ? 'bg-emerald-100 text-emerald-800' : ($row['status'] === 'Diproses' ? 'bg-amber-100 text-amber-800' : 'bg-blue-100 text-blue-800');
                ?>
                  <tr class="hover:bg-slate-50/50 transition-colors" data-sifat="<?php echo $row['sifat']; ?>">
                    <td class="px-6 py-4 font-bold text-slate-800"><?php echo htmlspecialchars($row['id']); ?></td>
                    <td class="px-6 py-4 space-y-1">
                      <span class="inline-block px-2 py-0.5 rounded-full text-[10px] font-bold <?php echo $sifat_style; ?>">
                        <?php echo htmlspecialchars($row['sifat']); ?>
                      </span>
                      <p class="text-xs text-slate-400">Terima: <?php echo htmlspecialchars($row['tanggal_diterima']); ?></p>
                    </td>
                    <td class="px-6 py-4">
                      <p class="font-bold text-slate-700"><?php echo htmlspecialchars($row['asal_surat']); ?></p>
                      <p class="text-xs text-slate-400"><?php echo htmlspecialchars($row['no_surat']); ?></p>
                    </td>
                    <td class="px-6 py-4 max-w-xs">
                      <div class="flex items-center">
                        <span class="font-semibold text-slate-700 line-clamp-2"><?php echo htmlspecialchars($row['perihal']); ?></span>
                        <?php if (!empty($row['file_surat'])): ?>
                          <span class="inline-flex items-center shrink-0 text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded text-[9px] font-bold ml-2 border border-indigo-100">
                            <i data-lucide="paperclip" class="w-2.5 h-2.5 mr-0.5"></i> Berkas
                          </span>
                        <?php endif; ?>
                      </div>
                    </td>
                    <td class="px-6 py-4 space-y-1.5">
                      <span class="inline-block text-[10px] px-2 py-0.5 rounded font-bold <?php echo $status_style; ?>">
                        <?php echo htmlspecialchars($row['status']); ?>
                      </span>
                      <?php if ($row['disposisi']): ?>
                        <p class="text-xs text-slate-500 italic line-clamp-1">Disp: "<?php echo htmlspecialchars($row['disposisi']); ?>"</p>
                      <?php endif; ?>
                    </td>
                    <td class="px-6 py-4">
                      <div class="flex items-center justify-center space-x-2">
                        <button onclick="viewDetail('masuk', '<?php echo $row['id']; ?>')" class="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded" title="<?php echo $is_admin ? 'Detail / Tindak Lanjut' : 'Detail Surat'; ?>">
                          <i data-lucide="file-text" class="w-4 h-4"></i>
                        </button>
                        
                        <?php if ($is_admin): ?>
                          <form method="POST" onsubmit="return confirm('Apakah Anda yakin ingin menghapus agenda surat ini?')" class="inline">
                            <input type="hidden" name="action" value="hapus_masuk">
                            <input type="hidden" name="active_tab" value="surat-masuk">
                            <input type="hidden" name="id" value="<?php echo $row['id']; ?>">
                            <button type="submit" class="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded" title="Hapus">
                              <i data-lucide="trash-2" class="w-4 h-4"></i>
                            </button>
                          </form>
                        <?php endif; ?>
                      </div>
                    </td>
                  </tr>
                <?php endforeach; endif; ?>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <!-- ==================================================================== -->
      <!-- TAB: SURAT KELUAR PANE (DIBATASI MAKSIMAL 5 SURAT TERBARU) -->
      <!-- ==================================================================== -->
      <div id="pane-surat-keluar" class="tab-content space-y-6 animate-fadeIn hidden">
        
        <!-- Filter & Pencarian -->
        <div class="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-4 rounded-xl border border-slate-200">
          <div class="flex flex-col sm:flex-row flex-1 items-stretch sm:items-center gap-3">
            <div class="relative flex-1">
              <i data-lucide="search" class="absolute left-3 top-2.5 text-slate-400 w-[18px] h-[18px]"></i>
              <input 
                type="text" 
                id="search-input-keluar"
                placeholder="Cari nomor, tujuan, atau hal..."
                onkeyup="applyFilterAndSearch('keluar')"
                class="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            
            <div class="flex items-center space-x-2 bg-slate-50 border border-slate-200 px-3 py-2 rounded-lg">
              <i data-lucide="filter" class="text-slate-400 w-4 h-4"></i>
              <select 
                id="filter-sifat-keluar"
                onchange="applyFilterAndSearch('keluar')"
                class="bg-transparent text-sm focus:outline-none text-slate-600 w-full"
              >
                <option value="Semua">Semua Sifat</option>
                <option value="Biasa">Biasa</option>
                <option value="Penting">Penting</option>
                <option value="Rahasia">Rahasia</option>
              </select>
            </div>
          </div>

          <?php if ($is_admin): ?>
            <button onclick="openAddModal('keluar')" class="bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold px-4 py-2.5 rounded-lg flex items-center justify-center space-x-2 transition">
              <i data-lucide="plus" class="w-4 h-4"></i>
              <span>Registrasi Surat</span>
            </button>
          <?php endif; ?>
        </div>

        <!-- Tabel Surat Keluar -->
        <div class="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div class="px-6 py-3 bg-slate-50 border-b border-slate-100 flex justify-between items-center text-xs text-slate-500 font-medium">
            <span>Menampilkan 5 surat terbaru (Total Terregistrasi: <?php echo $total_keluar; ?>)</span>
          </div>
          <div class="overflow-x-auto">
            <table class="w-full text-left border-collapse min-w-[700px]">
              <thead>
                <tr class="bg-slate-50/50 text-slate-400 font-bold text-xs uppercase tracking-wider border-b border-slate-200">
                  <th class="px-6 py-4">No. Registrasi</th>
                  <th class="px-6 py-4">Sifat & Tanggal</th>
                  <th class="px-6 py-4">Tujuan / Penerima</th>
                  <th class="px-6 py-4">Perihal / No. Resmi</th>
                  <th class="px-6 py-4">Status Alur Kerja</th>
                  <th class="px-6 py-4 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody id="surat-keluar-tbody" class="divide-y divide-slate-100 text-sm">
                <?php if (empty($surat_keluar_list)): ?>
                  <tr id="no-data-keluar">
                    <td colSpan="6" class="px-6 py-12 text-center text-slate-400">Tidak ada data surat keluar ditemukan.</td>
                  </tr>
                <?php else: 
                  // Dibatasi hanya 5 surat terbaru
                  $limited_page_keluar = array_slice($surat_keluar_list, 0, 5);
                  foreach ($limited_page_keluar as $row): 
                    $sifat_style = $row['sifat'] === 'Penting' ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-600';
                    $status_style = $row['status'] === 'Dikirim' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : ($row['status'] === 'Persetujuan' ? 'bg-amber-50 text-amber-700 border border-amber-200' : 'bg-slate-50 text-slate-700 border border-slate-200');
                    $dot_color = $row['status'] === 'Dikirim' ? 'bg-emerald-500' : ($row['status'] === 'Persetujuan' ? 'bg-amber-500' : 'bg-slate-400');
                ?>
                  <tr class="hover:bg-slate-50/50 transition-colors" data-sifat="<?php echo $row['sifat']; ?>">
                    <td class="px-6 py-4 font-bold text-slate-800"><?php echo htmlspecialchars($row['id']); ?></td>
                    <td class="px-6 py-4 space-y-1">
                      <span class="inline-block px-2 py-0.5 rounded-full text-[10px] font-bold <?php echo $sifat_style; ?>">
                        <?php echo htmlspecialchars($row['sifat']); ?>
                      </span>
                      <p class="text-xs text-slate-400"><?php echo htmlspecialchars($row['tanggal_surat']); ?></p>
                    </td>
                    <td class="px-6 py-4">
                      <p class="font-bold text-slate-700 line-clamp-1"><?php echo htmlspecialchars($row['tujuan']); ?></p>
                      <p class="text-xs text-slate-400">Pengonsep: <?php echo htmlspecialchars($row['pembuat']); ?></p>
                    </td>
                    <td class="px-6 py-4 flex items-center h-full">
                      <div class="truncate">
                        <p class="font-semibold text-slate-700 line-clamp-1"><?php echo htmlspecialchars($row['perihal']); ?></p>
                        <p class="text-xs text-indigo-600 font-mono"><?php echo htmlspecialchars($row['no_surat'] ?: 'Belum Diberikan'); ?></p>
                      </div>
                      <?php if (!empty($row['file_surat'])): ?>
                        <span class="inline-flex items-center shrink-0 text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded text-[9px] font-bold ml-2 border border-indigo-100">
                          <i data-lucide="paperclip" class="w-2.5 h-2.5 mr-0.5"></i> Berkas
                        </span>
                      <?php endif; ?>
                    </td>
                    <td class="px-6 py-4">
                      <span class="inline-flex items-center space-x-1.5 text-xs px-2.5 py-1 rounded-full font-semibold <?php echo $status_style; ?>">
                        <span class="w-1.5 h-1.5 rounded-full <?php echo $dot_color; ?>"></span>
                        <span><?php echo htmlspecialchars($row['status']); ?></span>
                      </span>
                    </td>
                    <td class="px-6 py-4">
                      <div class="flex items-center justify-center space-x-2">
                        <?php if ($is_admin && empty($row['file_surat']) && ($row['status'] === 'Draf' || $row['status'] === 'Persetujuan')): ?>
                          <button onclick="loadToGenerator('<?php echo $row['id']; ?>')" class="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded" title="Edit di Generator">
                            <i data-lucide="edit-3" class="w-4 h-4"></i>
                          </button>
                        <?php endif; ?>
                        
                        <button onclick="viewDetail('keluar', '<?php echo $row['id']; ?>')" class="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded" title="<?php echo $is_admin ? 'Detail / Tindak Lanjut' : 'Detail Surat'; ?>">
                          <i data-lucide="file-text" class="w-4 h-4"></i>
                        </button>
                        
                        <?php if ($is_admin): ?>
                          <form method="POST" onsubmit="return confirm('Apakah Anda yakin ingin menghapus surat keluar ini?')" class="inline">
                            <input type="hidden" name="action" value="hapus_keluar">
                            <input type="hidden" name="active_tab" value="surat-keluar">
                            <input type="hidden" name="id" value="<?php echo $row['id']; ?>">
                            <button type="submit" class="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded" title="Hapus">
                              <i data-lucide="trash-2" class="w-4 h-4"></i>
                            </button>
                          </form>
                        <?php endif; ?>
                      </div>
                    </td>
                  </tr>
                <?php endforeach; endif; ?>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <!-- ==================================================================== -->
      <!-- TAB: PEMBUAT SURAT DINAS (A4 PRINT READY) -->
      <!-- ==================================================================== -->
      <div id="pane-buat-surat" class="tab-content space-y-6 animate-fadeIn hidden print:m-0 print:p-0">
        
        <!-- Tips Cetak / PDF banner -->
        <div class="bg-amber-50 border border-amber-200 text-amber-800 p-4 rounded-xl text-xs flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between print:hidden">
          <div class="flex items-center space-x-2">
            <i data-lucide="alert-triangle" class="text-amber-600 shrink-0 w-4 h-4"></i>
            <span><strong>Tips Cetak:</strong> Atur ukuran kertas ke <strong>A4</strong> dan matikan "Header dan Footer" di dialog cetak browser untuk lembar surat yang rapi.</span>
          </div>
          <button onclick="window.print()" class="w-full sm:w-auto bg-indigo-600 hover:bg-indigo-500 text-white font-bold px-4 py-2 rounded-lg flex items-center justify-center space-x-1.5 transition text-xs">
            <i data-lucide="printer" class="w-3.5 h-3.5"></i>
            <span>Cetak / PDF</span>
          </button>
        </div>

        <!-- Layout Konfigurator dan Lembar A4 -->
        <div class="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8 items-start print:grid-cols-1 print:gap-0">
          
          <!-- Konfigurator / Input Fields (KIRI) -->
          <form method="POST" class="lg:col-span-5 bg-white p-5 sm:p-6 rounded-xl border border-slate-200 space-y-4 print:hidden">
            <input type="hidden" name="action" value="simpan_draf_generator">
            
            <h4 class="font-bold text-slate-800 border-b pb-3 text-sm flex items-center space-x-2">
              <i data-lucide="edit-3" class="text-indigo-600 w-4 h-4"></i>
              <span>Konfigurator Lembar Surat</span>
            </h4>

            <?php if (!$is_admin): ?>
              <div class="p-3 bg-slate-100 border border-slate-200 rounded-lg text-[11px] text-slate-600 flex items-start space-x-2">
                <i data-lucide="info" class="w-4 h-4 text-slate-500 shrink-0 mt-0.5"></i>
                <span>Anda dalam mode <strong>Lihat Saja (Viewer)</strong>. Anda dapat menguji konfigurator dan mencetak langsung, namun tidak dapat menyimpan draf ke database log.</span>
              </div>
            <?php endif; ?>

            <div class="space-y-3 text-xs">
              <div>
                <label class="block font-semibold text-slate-600 mb-1">Jenis Naskah Dinas</label>
                <select 
                  id="input_jenisSurat"
                  name="jenisSurat"
                  class="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="Surat Tugas">Surat Tugas</option>
                  <option value="Surat Undangan">Surat Undangan</option>
                  <option value="Surat Keterangan">Surat Keterangan</option>
                </select>
              </div>

              <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label class="block font-semibold text-slate-600 mb-1">Nomor Surat Resmi</label>
                  <input 
                    type="text" 
                    id="input_nomorSurat"
                    name="nomorSurat"
                    value="094/   /DKIS/2026"
                    class="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg"
                  />
                </div>
                <div>
                  <label class="block font-semibold text-slate-600 mb-1">Tanggal Surat</label>
                  <input 
                    type="date" 
                    id="input_tanggalSurat"
                    name="tanggalSurat"
                    value="2026-05-20"
                    class="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg"
                  />
                </div>
              </div>

              <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label class="block font-semibold text-slate-600 mb-1">Lampiran</label>
                  <input 
                    type="text" 
                    id="input_lampiran"
                    name="lampiran"
                    value="-"
                    class="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg"
                  />
                </div>
                <div>
                  <label class="block font-semibold text-slate-600 mb-1">Hal / Perihal</label>
                  <input 
                    type="text" 
                    id="input_hal"
                    name="hal"
                    value="Pelaksanaan Tugas Pendampingan Teknis"
                    class="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg"
                  />
                </div>
              </div>

              <div class="border-t border-slate-100 pt-3">
                <h5 class="font-bold text-indigo-600 mb-2">Penerima / Ditugaskan</h5>
                <div class="space-y-2">
                  <div>
                    <label class="block font-semibold text-slate-600 mb-1">Nama Lengkap & Gelar</label>
                    <input 
                      type="text" 
                      id="input_penerimaNama"
                      name="penerimaNama"
                      value="Rian Apriansyah, M.T"
                      class="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg"
                    />
                  </div>
                  <div class="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <div>
                      <label class="block font-semibold text-slate-600 mb-1">Jabatan</label>
                      <input 
                        type="text" 
                        id="input_penerimaJabatan"
                        name="penerimaJabatan"
                        value="Analis Sistem Informasi"
                        class="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg"
                      />
                    </div>
                    <div>
                      <label class="block font-semibold text-slate-600 mb-1">NIP (Opsional)</label>
                      <input 
                        type="text" 
                        id="input_penerimaNip"
                        name="penerimaNip"
                        value="19890412 201503 1 002"
                        class="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg font-mono"
                        placeholder="Kosongkan jika tidak ada"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div class="border-t border-slate-100 pt-3">
                <h5 class="font-bold text-indigo-600 mb-2">Isi Lembar Utama</h5>
                <div class="space-y-2">
                  <div>
                    <label class="block font-semibold text-slate-600 mb-1">Deskripsi Surat / Konten Inti</label>
                    <textarea 
                      id="input_isiSurat"
                      name="isiSurat"
                      rows="4"
                      class="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg resize-y"
                    >Untuk melaksanakan tugas pendampingan teknis implementasi Sistem Keamanan Informasi dan Audit Aplikasi di Lingkungan Walikota Jakarta Utara, yang akan dilaksanakan pada tanggal 26 - 28 Mei 2026 berlokasi di Kantor Walikota Jakarta Utara.</textarea>
                  </div>
                  <div>
                    <label class="block font-semibold text-slate-600 mb-1">Teks Penutup</label>
                    <input 
                      type="text" 
                      id="input_penutupSurat"
                      name="penutupSurat"
                      value="Demikian surat tugas ini dibuat untuk dilaksanakan dengan penuh tanggung jawab dan melaporkan hasilnya setelah selesai melaksanakan tugas tersebut."
                      class="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg"
                    />
                  </div>
                </div>
              </div>

              <div class="border-t border-slate-100 pt-3">
                <h5 class="font-bold text-indigo-600 mb-2">Penandatangan</h5>
                <div class="space-y-2">
                  <div>
                    <label class="block font-semibold text-slate-600 mb-1">Nama Pejabat TTD</label>
                    <input 
                      type="text" 
                      id="input_ttdNama"
                      name="ttdNama"
                      value="Sriyono, M.Pd., M.Si., M.A"
                      class="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg"
                    />
                  </div>
                  <div class="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <div>
                      <label class="block font-semibold text-slate-600 mb-1">Jabatan TTD</label>
                      <input 
                        type="text" 
                        id="input_ttdJabatan"
                        name="ttdJabatan"
                        value="Jakarta, ......................................."
                        class="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg"
                      />
                    </div>
                    <div>
                      <label class="block font-semibold text-slate-600 mb-1">NIP Pejabat</label>
                      <input 
                        type="text" 
                        id="input_ttdNip"
                        name="ttdNip"
                        value="197102012008011018"
                        class="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg font-mono"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Tombol Simpan Draf ke SQLite (Hanya aktif untuk Admin) -->
            <?php if ($is_admin): ?>
              <button 
                type="submit"
                class="w-full bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-300 py-2.5 rounded-lg text-xs font-semibold flex items-center justify-center space-x-2 transition"
              >
                <i data-lucide="download" class="w-3.5 h-3.5"></i>
                <span>Simpan ke Log Surat Keluar</span>
              </button>
            <?php else: ?>
              <button 
                type="button"
                disabled
                class="w-full bg-slate-100 text-slate-400 border border-slate-200 py-2.5 rounded-lg text-xs font-semibold flex items-center justify-center space-x-2 cursor-not-allowed"
              >
                <i data-lucide="lock" class="w-3.5 h-3.5"></i>
                <span>Simpan Dinonaktifkan (Viewer)</span>
              </button>
            <?php endif; ?>
          </form>

          <!-- Lembar A4 Preview Instan (KANAN) -->
          <div class="lg:col-span-7 w-full overflow-x-auto pb-6 print:overflow-visible">
            <div class="bg-white shadow-2xl border border-slate-200 rounded-2xl p-6 sm:p-10 mx-auto w-full min-w-[650px] lg:min-w-0 max-w-[210mm] min-h-[297mm] flex flex-col justify-between text-black font-serif print:shadow-none print:border-none print:p-0 print:my-0">
              
              <!-- Bagian Kertas Atas -->
              <div>
                <!-- KOP SURAT (Dinamis dari pengaturan profil) -->
                <div class="flex items-center justify-between border-b-4 border-double border-black pb-4 gap-4">
                  <!-- Logo Daerah -->
                  <div class="w-16 h-16 sm:w-20 sm:h-20 border-2 border-black rounded-lg flex items-center justify-center shrink-0">
                    <span class="text-[9px] sm:text-[10px] font-sans font-bold text-center">LOGO DAERAH</span>
                  </div>
                  
                  <!-- Informasi Instansi -->
                  <div class="text-center flex-1">
                    <h2 class="text-sm sm:text-lg font-bold font-sans tracking-wide leading-tight uppercase"><?php echo htmlspecialchars($profil['nama_instansi']); ?></h2>
                    <h1 class="text-base sm:text-xl font-extrabold font-sans tracking-tight leading-tight uppercase"><?php echo htmlspecialchars($profil['nama_dinas']); ?></h1>
                    <p class="text-[10px] sm:text-xs font-sans mt-1 leading-normal">
                      <?php echo htmlspecialchars($profil['alamat']); ?> <br />
                      Telp: <?php echo htmlspecialchars($profil['telepon']); ?> | Email: <?php echo htmlspecialchars($profil['email']); ?> | Kode Pos: <?php echo htmlspecialchars($profil['kode_pos']); ?>
                    </p>
                    <p class="text-[10px] sm:text-xs font-sans text-indigo-700 underline"><?php echo htmlspecialchars($profil['website']); ?></p>
                  </div>
                </div>

                <!-- DETAIL NASKAH DINAS -->
                <div class="mt-6 sm:mt-8 space-y-6">
                  
                  <!-- Judul Format -->
                  <div class="text-center">
                    <h3 id="preview_jenisSurat" class="text-sm sm:text-base font-bold uppercase tracking-wider underline">Surat Tugas</h3>
                    <p class="text-xs sm:text-sm font-sans">Nomor: <span id="preview_nomorSurat">094/   /DKIS/2026</span></p>
                  </div>

                  <!-- Info Lampiran / Tanggal -->
                  <div class="grid grid-cols-2 gap-4 text-xs font-sans">
                    <div class="space-y-1">
                      <p><strong>Lampiran :</strong> <span id="preview_lampiran">-</span></p>
                      <p><strong>Perihal &nbsp;&nbsp;&nbsp;:</strong> <span id="preview_hal">Pelaksanaan Tugas Pendampingan Teknis</span></p>
                    </div>
                    <div class="text-right">
                      <p>Jakarta, <span id="preview_tanggalSurat">20 Mei 2026</span></p>
                    </div>
                  </div>

                  <!-- Penerima / Ditugaskan -->
                  <div class="text-xs sm:text-sm font-sans space-y-1">
                    <p class="font-semibold">Kepada Yth.</p>
                    <p id="preview_penerimaNama" class="font-bold">Rian Apriansyah, M.T</p>
                    <p id="preview_penerimaJabatan" class="italic">Analis Sistem Informasi</p>
                    <p id="preview_penerimaNip_container" class="text-xs text-slate-600 font-mono">NIP. <span id="preview_penerimaNip">19890412 201503 1 002</span></p>
                    <p class="text-xs">di Tempat</p>
                  </div>

                  <!-- Konten Inti Dokumen -->
                  <div class="text-xs sm:text-sm leading-relaxed text-justify indent-8 space-y-4">
                    <p id="preview_isiSurat">Untuk melaksanakan tugas pendampingan teknis implementasi Sistem Keamanan Informasi dan Audit Aplikasi di Lingkungan Walikota Jakarta Utara, yang akan dilaksanakan pada tanggal 26 - 28 Mei 2026 berlokasi di Kantor Walikota Jakarta Utara.</p>
                    <p id="preview_penutupSurat" class="indent-0">Demikian surat tugas ini dibuat untuk dilaksanakan dengan penuh tanggung jawab dan melaporkan hasilnya setelah selesai melaksanakan tugas tersebut.</p>
                  </div>
                </div>
              </div>

              <!-- Tanda Tangan Penjabat (BAWAH KANAN) -->
              <div class="mt-8 sm:mt-12 flex justify-end">
                <div class="w-64 sm:w-72 text-xs sm:text-sm text-center font-sans space-y-12 sm:space-y-16">
                  <div>
                    <p id="preview_ttdJabatan" class="font-semibold">Kepala SMAN 110 Jakarta</p>
                    <p class="text-[10px] sm:text-xs uppercase"><?php echo htmlspecialchars($profil['nama_dinas']); ?></p>
                  </div>
                  
                  <div>
                    <p id="preview_ttdNama" class="font-bold underline">Dr. H. Ahmad Fauzi, M.Si</p>
                    <p class="text-[10px] sm:text-xs text-slate-600">NIP. <span id="preview_ttdNip">19740815 199803 1 001</span></p>
                  </div>
                </div>
              </div>

            </div>
          </div>

        </div>
      </div>

      <!-- ==================================================================== -->
      <!-- TAB: PENGATURAN KOP SURAT PANE -->
      <!-- ==================================================================== -->
      <div id="pane-pengaturan" class="tab-content max-w-2xl bg-white p-5 sm:p-8 rounded-xl border border-slate-200 shadow-sm space-y-6 animate-fadeIn hidden">
        <div class="border-b border-slate-100 pb-4">
          <h3 class="font-bold text-slate-800 text-lg">Konfigurasi Kop Surat Dinas</h3>
          <p class="text-slate-400 text-xs">Atur data instansi pemerintah pusat/daerah untuk penyesuaian kop cetak otomatis.</p>
        </div>

        <?php if (!$is_admin): ?>
          <div class="p-4 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800 flex items-center space-x-2">
            <i data-lucide="lock" class="w-4 h-4 text-amber-600 shrink-0"></i>
            <span><strong>Mode Terbatas:</strong> Anda masuk sebagai Viewer (Lihat Saja). Form pengaturan ini dalam keadaan terkunci. Silakan masuk menggunakan akun <strong>Admin</strong> jika perlu melakukan perubahan kop.</span>
          </div>
        <?php endif; ?>

        <form method="POST" class="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <input type="hidden" name="action" value="simpan_kop">
          <input type="hidden" name="active_tab" value="pengaturan">

          <div>
            <label class="block font-semibold text-slate-600 mb-1">Nama Instansi Tingkat Atas</label>
            <input 
              type="text" 
              name="nama_instansi"
              <?php echo !$is_admin ? 'disabled' : ''; ?>
              value="<?php echo htmlspecialchars($profil['nama_instansi']); ?>"
              class="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 text-sm <?php echo !$is_admin ? 'cursor-not-allowed opacity-80' : ''; ?>"
            />
          </div>
          <div>
            <label class="block font-semibold text-slate-600 mb-1">Nama Dinas / Sektor Kerja</label>
            <input 
              type="text" 
              name="nama_dinas"
              <?php echo !$is_admin ? 'disabled' : ''; ?>
              value="<?php echo htmlspecialchars($profil['nama_dinas']); ?>"
              class="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 text-sm <?php echo !$is_admin ? 'cursor-not-allowed opacity-80' : ''; ?>"
            />
          </div>
          <div class="sm:col-span-2">
            <label class="block font-semibold text-slate-600 mb-1">Alamat Kantor Lengkap</label>
            <input 
              type="text" 
              name="alamat"
              <?php echo !$is_admin ? 'disabled' : ''; ?>
              value="<?php echo htmlspecialchars($profil['alamat']); ?>"
              class="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 text-sm <?php echo !$is_admin ? 'cursor-not-allowed opacity-80' : ''; ?>"
            />
          </div>
          <div>
            <label class="block font-semibold text-slate-600 mb-1">Nomor Telepon Sekolah</label>
            <input 
              type="text" 
              name="telepon"
              <?php echo !$is_admin ? 'disabled' : ''; ?>
              value="<?php echo htmlspecialchars($profil['telepon']); ?>"
              class="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 text-sm <?php echo !$is_admin ? 'cursor-not-allowed opacity-80' : ''; ?>"
            />
          </div>
          <div>
            <label class="block font-semibold text-slate-600 mb-1">Email Resmi</label>
            <input 
              type="email" 
              name="email"
              <?php echo !$is_admin ? 'disabled' : ''; ?>
              value="<?php echo htmlspecialchars($profil['email']); ?>"
              class="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 text-sm <?php echo !$is_admin ? 'cursor-not-allowed opacity-80' : ''; ?>"
            />
          </div>
          <div>
            <label class="block font-semibold text-slate-600 mb-1">Kode Pos</label>
            <input 
              type="text" 
              name="kode_pos"
              <?php echo !$is_admin ? 'disabled' : ''; ?>
              value="<?php echo htmlspecialchars($profil['kode_pos']); ?>"
              class="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 text-sm <?php echo !$is_admin ? 'cursor-not-allowed opacity-80' : ''; ?>"
            />
          </div>
          <div>
            <label class="block font-semibold text-slate-600 mb-1">Website Resmi</label>
            <input 
              type="text" 
              name="website"
              <?php echo !$is_admin ? 'disabled' : ''; ?>
              value="<?php echo htmlspecialchars($profil['website']); ?>"
              class="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 text-sm <?php echo !$is_admin ? 'cursor-not-allowed opacity-80' : ''; ?>"
            />
          </div>

          <?php if ($is_admin): ?>
            <div class="sm:col-span-2 pt-4 border-t border-slate-100 flex justify-end">
              <button 
                type="submit"
                class="bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm px-5 py-2.5 rounded-lg shadow-md transition"
              >
                Simpan Perubahan
              </button>
            </div>
          <?php endif; ?>
        </form>
      </div>

    </div>
  </main>

  <!-- ==================================================================== -->
  <!-- MODAL: REGISTRASI BARU (HANYA UNTUK ADMIN) -->
  <!-- ==================================================================== -->
  <div id="modal-tambah" class="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm hidden items-center justify-center p-4">
    <div class="bg-white rounded-2xl w-full max-w-xl shadow-2xl border border-slate-100 flex flex-col overflow-hidden animate-scaleIn">
      
      <div class="px-6 py-4 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
        <h3 id="modal-title" class="font-bold text-slate-800 text-base">Registrasi Surat</h3>
        <button onclick="closeAddModal()" class="text-slate-400 hover:text-slate-600">
          <i data-lucide="x" class="w-5 h-5"></i>
        </button>
      </div>

      <!-- Form Utama yang dinamis -->
      <form id="modal-form" method="POST" enctype="multipart/form-data" class="p-6 overflow-y-auto max-h-[75vh] space-y-4 text-xs">
        <input type="hidden" name="action" id="form-action" value="">
        <input type="hidden" name="active_tab" class="active-tab-input" value="dashboard">

        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label class="block font-semibold text-slate-600 mb-1">Nomor Surat Resmi</label>
            <input 
              type="text" 
              name="no_surat" 
              required
              placeholder="Contoh: 045.2/100/KPG"
              class="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-sm"
            />
          </div>
          <div>
            <label class="block font-semibold text-slate-600 mb-1">Sifat Surat</label>
            <select name="sifat" class="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-sm">
              <option value="Biasa">Biasa</option>
              <option value="Penting">Penting</option>
              <option value="Rahasia">Rahasia</option>
            </select>
          </div>
        </div>

        <!-- Field yang bergeser antara pengirim (masuk) / tujuan (keluar) -->
        <div id="container-dynamic-target">
          <!-- Dinonaktifkan lewat JS -->
        </div>

        <div>
          <label class="block font-semibold text-slate-600 mb-1">Perihal Surat</label>
          <input 
            type="text" 
            name="perihal" 
            required
            placeholder="Subjek pokok surat"
            class="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-sm"
          />
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label class="block font-semibold text-slate-600 mb-1">Tanggal Surat Terbit</label>
            <input type="date" name="tanggal_surat" required class="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-sm" />
          </div>
          <div id="container-dynamic-date">
            <!-- Tanggal diterima hanya untuk surat masuk -->
          </div>
        </div>

        <div id="container-dynamic-disposisi">
          <!-- Disposisi hanya untuk surat masuk -->
        </div>

        <!-- Field Upload Berkas Fisik Baru -->
        <div>
          <label class="block font-semibold text-slate-600 mb-1">Upload Berkas / Fisik Surat (PDF, JPG, PNG - Maks 5MB)</label>
          <input 
            type="file" 
            name="file_surat" 
            accept=".pdf,.jpg,.jpeg,.png,.gif"
            class="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs file:mr-2 file:py-1 file:px-2 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
          />
        </div>

        <div>
          <label class="block font-semibold text-slate-600 mb-1">Ringkasan Isi Surat</label>
          <textarea 
            name="ringkasan" 
            rows="3" 
            placeholder="Intisari isi surat dinas..."
            class="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-sm resize-none"
          ></textarea>
        </div>

        <div class="pt-4 border-t border-slate-100 flex justify-end space-x-3">
          <button type="button" onclick="closeAddModal()" class="px-4 py-2 bg-slate-100 text-slate-700 hover:bg-slate-200 rounded-lg font-semibold">
            Batal
          </button>
          <button type="submit" class="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-semibold">
            Simpan Agenda
          </button>
        </div>
      </form>
    </div>
  </div>

  <!-- ==================================================================== -->
  <!-- MODAL: VIEWER DETAIL & TINDAK LANJUT (SPLIT-GRID READY) -->
  <!-- ==================================================================== -->
  <div id="modal-detail" class="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm hidden items-center justify-center p-4">
    <div id="modal-detail-card" class="bg-white rounded-2xl w-full max-w-lg shadow-2xl border border-slate-100 flex flex-col overflow-hidden transition-all duration-300">
      
      <div class="px-6 py-4 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
        <div class="flex items-center space-x-2">
          <i data-lucide="file-text" class="text-indigo-600 w-5 h-5"></i>
          <h3 class="font-bold text-slate-800 text-base">Detail Informasi & Tindak Lanjut</h3>
        </div>
        <button onclick="closeDetailModal()" class="text-slate-400 hover:text-slate-600">
          <i data-lucide="x" class="w-5 h-5"></i>
        </button>
      </div>

      <!-- Area Scroll Split Grid -->
      <div class="overflow-y-auto max-h-[80vh]">
        <div id="modal-detail-grid" class="grid grid-cols-1 gap-6 p-6">
          
          <!-- SISI KIRI: METADATA SURAT & FORM EDIT STATUS/DISPOSISI -->
          <div id="detail-info-side" class="space-y-4 text-xs">
            <div class="grid grid-cols-2 gap-4 pb-3 border-b border-slate-100">
              <div>
                <p class="text-[10px] text-slate-400 font-semibold uppercase">ID REGISTRASI</p>
                <p id="detail-id" class="font-extrabold text-sm text-indigo-600 font-mono"></p>
              </div>
              <div>
                <p class="text-[10px] text-slate-400 font-semibold uppercase">SIFAT SURAT</p>
                <span id="detail-sifat" class="inline-block px-2 py-0.5 mt-1 rounded text-[10px] font-bold"></span>
              </div>
            </div>

            <div class="space-y-3 pb-4 border-b border-slate-100">
              <div>
                <p class="text-[10px] text-slate-400 font-semibold uppercase">NOMOR SURAT RESMI</p>
                <p id="detail-no" class="font-bold text-slate-800 text-sm font-mono mt-0.5"></p>
              </div>

              <div>
                <p id="detail-target-label" class="text-[10px] text-slate-400 font-semibold uppercase"></p>
                <p id="detail-target-val" class="font-bold text-slate-700 mt-0.5"></p>
              </div>

              <div>
                <p class="text-[10px] text-slate-400 font-semibold uppercase">PERIHAL JELAS</p>
                <p id="detail-perihal" class="font-bold text-slate-800 mt-0.5 leading-snug"></p>
              </div>

              <div class="grid grid-cols-2 gap-4">
                <div>
                  <p class="text-[10px] text-slate-400 font-semibold uppercase">TANGGAL SURAT</p>
                  <p id="detail-tgl-surat" class="font-semibold text-slate-700 mt-0.5"></p>
                </div>
                <div id="detail-tgl-terima-container">
                  <p class="text-[10px] text-slate-400 font-semibold uppercase">DITERIMA TANGGAL</p>
                  <p id="detail-tgl-terima" class="font-semibold text-slate-700 mt-0.5"></p>
                </div>
              </div>

              <div id="detail-disposisi-container" class="p-3 bg-amber-50 rounded-xl border border-amber-200 hidden">
                <p class="text-[10px] text-amber-800 font-bold uppercase tracking-wider">Disposisi Saat Ini:</p>
                <p id="detail-disposisi" class="text-amber-900 mt-1 italic font-medium"></p>
              </div>

              <div class="p-3 bg-slate-50 rounded-xl border border-slate-200/60">
                <p class="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Isi Ringkas / Summary:</p>
                <p id="detail-ringkasan" class="text-slate-700 mt-1 font-sans"></p>
              </div>
            </div>

            <!-- FORM UPDATE TINDAK LANJUT STATUS & DISPOSISI -->
            <div id="form-tindak-lanjut-container" class="bg-indigo-50/40 p-4 rounded-xl border border-indigo-100">
              <p class="text-[10px] text-indigo-950 font-bold uppercase tracking-wider mb-3 flex items-center">
                <i data-lucide="check-square" class="w-3.5 h-3.5 mr-1 text-indigo-600"></i> Pembaruan Tindak Lanjut:
              </p>
              
              <?php if ($is_admin): ?>
                <form method="POST" class="space-y-3">
                  <input type="hidden" name="action" value="update_tindak_lanjut">
                  <input type="hidden" name="active_tab" class="active-tab-input" value="dashboard">
                  <input type="hidden" name="id" id="tindak-lanjut-id" value="">
                  <input type="hidden" name="type" id="tindak-lanjut-type" value="">
                  
                  <div class="grid grid-cols-1 gap-3">
                    <div>
                      <label class="block font-semibold text-slate-600 mb-1">Status Alur Surat</label>
                      <select name="status" id="tindak-lanjut-status" class="w-full p-2 bg-white border border-slate-200 rounded-lg text-xs font-semibold focus:ring-2 focus:ring-indigo-500">
                        <!-- Diisi via JS -->
                      </select>
                    </div>
                    <div id="tindak-lanjut-disposisi-group">
                      <label class="block font-semibold text-slate-600 mb-1">Catatan Disposisi / Instruksi Atasan</label>
                      <textarea name="disposisi" id="tindak-lanjut-disposisi" rows="3" placeholder="Contoh: Diteruskan ke sekretaris untuk diproses lanjut..." class="w-full p-2 bg-white border border-slate-200 rounded-lg text-xs resize-none"></textarea>
                    </div>
                  </div>
                  
                  <button type="submit" class="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs py-2 rounded-lg transition shadow-sm flex items-center justify-center space-x-1">
                    <i data-lucide="save" class="w-3.5 h-3.5 mr-1"></i>
                    <span>Simpan Status & Disposisi</span>
                  </button>
                </form>
              <?php else: ?>
                <div class="p-2 bg-slate-100 border border-slate-200 rounded-lg text-slate-500 flex items-center space-x-2">
                  <i data-lucide="lock" class="w-4 h-4 shrink-0"></i>
                  <span>Hanya <strong>Admin</strong> yang dapat mengubah status tindak lanjut & disposisi.</span>
                </div>
              <?php endif; ?>
            </div>
          </div>

          <!-- SISI KANAN: PRATINJAU FISIK / UPLOAD SUSULAN -->
          <div id="detail-preview-side" class="space-y-4">
            
            <!-- CONTAINER PRATINJAU BERKAS FISIK -->
            <div id="detail-file-container" class="p-3 bg-slate-50 rounded-xl border border-slate-200/60 flex flex-col h-full min-h-[300px]">
              <p class="text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-2 flex items-center">
                <i data-lucide="paperclip" class="w-3.5 h-3.5 mr-1 text-indigo-500"></i> Fisik / Berkas Digital:
              </p>
              <div id="detail-file-preview" class="flex-1 w-full bg-slate-100 rounded-lg p-2 flex justify-center items-center border border-slate-200 overflow-hidden">
                  <!-- Diisi via JS (Iframe / Gambar) -->
              </div>
            </div>

            <!-- FORM UNTUK UNGGAN SUSULAN (HANYA UNTUK ADMIN JIKA BERKAS KOSONG) -->
            <div id="detail-upload-susulan-container" class="p-4 bg-indigo-50/50 rounded-xl border-2 border-dashed border-indigo-200 hidden">
              <div class="text-center mb-3">
                <i data-lucide="upload-cloud" class="w-8 h-8 mx-auto text-indigo-500 mb-1"></i>
                <p class="font-bold text-indigo-950 text-xs">Unggah Berkas Fisik Digital</p>
                <p id="upload-status-notif" class="text-[10px] text-indigo-600/80 mt-0.5">Surat ini belum memiliki lampiran berkas fisik (PDF / Gambar).</p>
              </div>

              <?php if ($is_admin): ?>
                <form method="POST" enctype="multipart/form-data" class="space-y-3">
                  <input type="hidden" name="action" value="upload_susulan">
                  <input type="hidden" name="active_tab" class="active-tab-input" value="dashboard">
                  <input type="hidden" name="id" id="susulan-id" value="">
                  <input type="hidden" name="type" id="susulan-type" value="">
                  
                  <input 
                    type="file" 
                    name="file_surat" 
                    required
                    accept=".pdf,.jpg,.jpeg,.png,.gif"
                    class="w-full p-2 bg-white border border-slate-200 rounded-lg text-xs file:mr-2 file:py-1 file:px-2 file:rounded file:border-0 file:text-xs file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
                  />
                  
                  <button type="submit" class="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs py-2 rounded-lg transition shadow-sm">
                    Mulai Unggah Berkas
                  </button>
                </form>
              <?php endif; ?>
            </div>

          </div>

        </div>
      </div>

      <div class="pt-4 pb-6 px-6 border-t border-slate-100 flex justify-end">
        <button onclick="closeDetailModal()" class="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-semibold text-xs transition">
          Tutup Detail
        </button>
      </div>

    </div>
  </div>

  <!-- ==================================================================== -->
  <!-- SISTEM LOGIKA JAVASCRIPT (REAKTIF & SINKRONISASI) -->
  <!-- ==================================================================== -->
  <script>
    // Membaca data yang disuplai oleh database SQLite ke dalam variabel JavaScript
    const suratMasukList = <?php echo json_encode($surat_masuk_list); ?>;
    const suratKeluarList = <?php echo json_encode($surat_keluar_list); ?>;
    const isAdmin = <?php echo $is_admin ? 'true' : 'false'; ?>;
    
    // Default tab aktif diambil dari status PHP (membantu navigasi setelah POST)
    let currentTab = '<?php echo $active_tab_query; ?>';

    // 1. Fungsi Routing & Navigasi Tab
    function switchTab(tabId) {
      currentTab = tabId;
      
      // Sembunyikan seluruh kontainer tab
      document.querySelectorAll('.tab-content').forEach(pane => {
        pane.classList.add('hidden');
      });
      
      // Munculkan kontainer aktif
      const activePane = document.getElementById('pane-' + tabId);
      if (activePane) {
        activePane.classList.remove('hidden');
      }

      // Perbarui judul halaman header
      const readableTitles = {
        'dashboard': 'Dashboard Portal',
        'surat-masuk': 'Manajemen Surat Masuk',
        'surat-keluar': 'Registrasi Surat Keluar',
        'buat-surat': 'Pembuat Surat Resmi (A4)',
        'pengaturan': 'Pengaturan Kop Surat'
      };
      document.getElementById('header-title').innerText = readableTitles[tabId] || tabId;

      // Perbarui warna status tombol sidebar
      document.querySelectorAll('.sidebar-btn').forEach(btn => {
        const btnTab = btn.getAttribute('data-tab');
        if (btnTab === tabId) {
          btn.className = "sidebar-btn w-full flex items-center justify-between px-4 py-3 rounded-lg text-sm font-medium transition-all bg-indigo-600 text-white shadow-lg shadow-indigo-600/30";
        } else {
          btn.className = "sidebar-btn w-full flex items-center justify-between px-4 py-3 rounded-lg text-sm font-medium transition-all text-slate-400 hover:bg-slate-800 hover:text-slate-200";
        }
      });

      // Sinkronkan input draf aktif ke modal form jika ada form submit
      document.querySelectorAll('.active-tab-input').forEach(input => {
        input.value = tabId;
      });

      // Tutup drawer sidebar mobile jika terbuka
      toggleSidebar(false);
    }

    // 2. Kontrol Drawer Sidebar Mobile
    function toggleSidebar(open) {
      const sidebar = document.getElementById('mobile-sidebar');
      const overlay = document.getElementById('sidebar-overlay');
      if (open) {
        sidebar.classList.remove('-translate-x-full');
        overlay.classList.remove('hidden');
      } else {
        sidebar.classList.add('-translate-x-full');
        overlay.classList.add('hidden');
      }
    }

    // 3. Kontrol Modal Tambah Agenda (Hanya untuk Admin)
    function openAddModal(type) {
      if (!isAdmin) return;
      
      const modal = document.getElementById('modal-tambah');
      const title = document.getElementById('modal-title');
      const actionInput = document.getElementById('form-action');
      const targetContainer = document.getElementById('container-dynamic-target');
      const dateContainer = document.getElementById('container-dynamic-date');
      const dispContainer = document.getElementById('container-dynamic-disposisi');

      // Bersihkan form bawaan
      document.getElementById('modal-form').reset();

      if (type === 'masuk') {
        title.innerText = 'Registrasi Agenda Surat Masuk';
        actionInput.value = 'tambah_masuk';
        
        targetContainer.innerHTML = `
          <label class="block font-semibold text-slate-600 mb-1">Asal / Pengirim Surat</label>
          <input type="text" name="asal_surat" required placeholder="Instansi / Pengirim" class="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-sm" />
        `;
        dateContainer.innerHTML = `
          <label class="block font-semibold text-slate-600 mb-1">Tanggal Surat Diterima</label>
          <input type="date" name="tanggal_diterima" class="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-sm" />
        `;
        dispContainer.innerHTML = `
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label class="block font-semibold text-slate-600 mb-1">Catatan Disposisi (Opsional)</label>
              <input type="text" name="disposisi" placeholder="Catatan Pimpinan" class="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-sm" />
            </div>
            <div>
              <label class="block font-semibold text-slate-600 mb-1">Status Disposisi</label>
              <select name="status" class="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-sm">
                <option value="Baru">Baru / Belum Diproses</option>
                <option value="Diproses">Sedang Diproses (Disposisi Aktif)</option>
                <option value="Selesai">Arsip / Selesai</option>
              </select>
            </div>
          </div>
        `;
      } else {
        title.innerText = 'Registrasi Agenda Surat Keluar';
        actionInput.value = 'tambah_keluar';

        targetContainer.innerHTML = `
          <label class="block font-semibold text-slate-600 mb-1">Tujuan / Nama Penerima</label>
          <input type="text" name="tujuan" required placeholder="Nama Kantor atau Pejabat" class="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-sm" />
        `;
        dateContainer.innerHTML = ''; // Kosong untuk surat keluar
        dispContainer.innerHTML = `
          <div>
            <label class="block font-semibold text-slate-600 mb-1">Status Alur Kerja Surat Keluar</label>
            <select name="status" class="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-sm">
              <option value="Draf">Draf Konseptor</option>
              <option value="Persetujuan">Sedang Direview Atasan</option>
              <option value="Dikirim">Sudah Dikirim (Resmi)</option>
            </select>
          </div>
        `;
      }

      modal.classList.remove('hidden');
      modal.classList.add('flex');
      lucide.createIcons();
    }

    function closeAddModal() {
      const modal = document.getElementById('modal-tambah');
      modal.classList.add('hidden');
      modal.classList.remove('flex');
    }

    // 4. Kontrol Modal Detail Viewer (Reaktif Menampilkan File Fisik di Split-Grid & Form Update Tindak Lanjut)
    function viewDetail(type, id) {
      const modal = document.getElementById('modal-detail');
      const card = document.getElementById('modal-detail-card');
      const grid = document.getElementById('modal-detail-grid');
      
      const fileContainer = document.getElementById('detail-file-container');
      const filePreview = document.getElementById('detail-file-preview');
      const uploadSusulanContainer = document.getElementById('detail-upload-susulan-container');
      const uploadStatusNotif = document.getElementById('upload-status-notif');
      
      const susulanIdInput = document.getElementById('susulan-id');
      const susulanTypeInput = document.getElementById('susulan-type');
      
      const tlIdInput = document.getElementById('tindak-lanjut-id');
      const tlTypeInput = document.getElementById('tindak-lanjut-type');
      const tlStatusSelect = document.getElementById('tindak-lanjut-status');
      const tlDisposisiGroup = document.getElementById('tindak-lanjut-disposisi-group');
      const tlDisposisiTextarea = document.getElementById('tindak-lanjut-disposisi');

      let item = null;

      if (type === 'masuk') {
        item = suratMasukList.find(x => x.id === id);
        if (item) {
          document.getElementById('detail-id').innerText = item.id;
          document.getElementById('detail-sifat').innerText = item.sifat;
          document.getElementById('detail-sifat').className = `inline-block px-2 py-0.5 mt-1 rounded text-[10px] font-bold ${
            item.sifat === 'Penting' ? 'bg-amber-100 text-amber-700' : (item.sifat === 'Rahasia' ? 'bg-rose-100 text-rose-700' : 'bg-slate-100 text-slate-700')
          }`;
          document.getElementById('detail-no').innerText = item.no_surat;
          document.getElementById('detail-target-label').innerText = 'PENGIRIM / INSTANSI ASAL';
          document.getElementById('detail-target-val').innerText = item.asal_surat;
          document.getElementById('detail-perihal').innerText = item.perihal;
          document.getElementById('detail-tgl-surat').innerText = item.tanggal_surat;
          
          document.getElementById('detail-tgl-terima-container').classList.remove('hidden');
          document.getElementById('detail-tgl-terima').innerText = item.tanggal_diterima;

          if (item.disposisi) {
            document.getElementById('detail-disposisi-container').classList.remove('hidden');
            document.getElementById('detail-disposisi').innerText = item.disposisi;
          } else {
            document.getElementById('detail-disposisi-container').classList.add('hidden');
          }
          document.getElementById('detail-ringkasan').innerText = item.ringkasan || '-';

          // Set isi form tindak lanjut surat masuk jika user adalah Admin
          if (isAdmin && tlStatusSelect) {
            tlStatusSelect.innerHTML = `
              <option value="Baru">Baru / Belum Diproses</option>
              <option value="Diproses">Sedang Diproses (Diproses)</option>
              <option value="Selesai">Arsip / Selesai</option>
            `;
            tlStatusSelect.value = item.status;
            tlDisposisiGroup.classList.remove('hidden');
            tlDisposisiTextarea.value = item.disposisi || '';
          }
        }
      } else {
        item = suratKeluarList.find(x => x.id === id);
        if (item) {
          document.getElementById('detail-id').innerText = item.id;
          document.getElementById('detail-sifat').innerText = item.sifat;
          document.getElementById('detail-sifat').className = `inline-block px-2 py-0.5 mt-1 rounded text-[10px] font-bold ${
            item.sifat === 'Penting' ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-700'
          }`;
          document.getElementById('detail-no').innerText = item.no_surat || 'Belum Diberikan';
          document.getElementById('detail-target-label').innerText = 'TUJUAN / PENERIMA';
          document.getElementById('detail-target-val').innerText = item.tujuan;
          document.getElementById('detail-perihal').innerText = item.perihal;
          document.getElementById('detail-tgl-surat').innerText = item.tanggal_surat;
          
          document.getElementById('detail-tgl-terima-container').classList.add('hidden');
          document.getElementById('detail-disposisi-container').classList.add('hidden');
          document.getElementById('detail-ringkasan').innerText = item.isi_ringkas || '-';

          // Set isi form tindak lanjut surat keluar jika user adalah Admin
          if (isAdmin && tlStatusSelect) {
            tlStatusSelect.innerHTML = `
              <option value="Draf">Draf Konseptor</option>
              <option value="Persetujuan">Sedang Direview Atasan (Diproses)</option>
              <option value="Dikirim">Sudah Dikirim (Selesai)</option>
            `;
            tlStatusSelect.value = item.status;
            tlDisposisiGroup.classList.add('hidden'); // Surat keluar tidak butuh disposisi internal manual
          }
        }
      }

      if (item) {
        // Set info ID & Type ke input form tindak lanjut
        if (isAdmin && tlIdInput) {
          tlIdInput.value = item.id;
          tlTypeInput.value = type;
        }

        const fileName = item.file_surat || '';
        if (isAdmin && susulanIdInput) {
          susulanIdInput.value = item.id;
          susulanTypeInput.value = type;
        }

        if (fileName) {
          const ext = fileName.split('.').pop().toLowerCase();
          
          // Ubah ukuran modal ke Lebar (Layar ganda) jika ada berkas
          card.classList.remove('max-w-lg');
          card.classList.add('max-w-4xl');
          grid.classList.remove('grid-cols-1');
          grid.classList.add('grid-cols-1', 'md:grid-cols-2');

          fileContainer.classList.remove('hidden');
          uploadSusulanContainer.classList.add('hidden');

          if (['jpg', 'jpeg', 'png', 'gif'].includes(ext)) {
            filePreview.innerHTML = `
              <div class="text-center w-full flex flex-col justify-between h-full min-h-[300px]">
                <img src="uploads/${fileName}" class="max-h-80 rounded object-contain border mx-auto shadow-sm mb-3 bg-white" alt="Fisik Surat" />
                <a href="uploads/${fileName}" target="_blank" class="inline-flex items-center justify-center space-x-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-bold text-xs transition w-full">
                  <i data-lucide="external-link" class="w-3.5 h-3.5 mr-1"></i> Buka Gambar Penuh
                </a>
              </div>
            `;
          } else if (ext === 'pdf') {
            filePreview.innerHTML = `
              <div class="w-full flex flex-col h-full min-h-[350px]">
                <iframe src="uploads/${fileName}" class="w-full h-80 border rounded-lg shadow-inner bg-white mb-3"></iframe>
                <a href="uploads/${fileName}" target="_blank" class="inline-flex items-center justify-center space-x-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-bold text-xs transition w-full">
                  <i data-lucide="external-link" class="w-3.5 h-3.5 mr-1"></i> Buka Berkas PDF di Tab Baru
                </a>
              </div>
            `;
          } else {
            filePreview.innerHTML = `
              <div class="text-center py-8 w-full">
                <i data-lucide="file" class="w-12 h-12 text-slate-500 mx-auto mb-3"></i>
                <p class="font-bold text-slate-700 mb-3 truncate max-w-xs mx-auto text-xs">${fileName}</p>
                <a href="uploads/${fileName}" download class="inline-flex items-center justify-center space-x-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-bold text-xs transition w-full">
                  <i data-lucide="download" class="w-3.5 h-3.5 mr-1"></i> Unduh File Lampiran
                </a>
              </div>
            `;
          }
        } else {
          // Set modal kembali ke ukuran kecil jika berkas belum diupload
          card.classList.remove('max-w-4xl');
          card.classList.add('max-w-lg');
          grid.classList.remove('grid-cols-1', 'md:grid-cols-2');
          grid.classList.add('grid-cols-1');

          fileContainer.classList.add('hidden');
          uploadSusulanContainer.classList.remove('hidden');

          if (!isAdmin) {
            // Ubah keterangan jika Viewer yang melihat berkas kosong
            uploadStatusNotif.innerHTML = "Surat ini tidak memiliki lampiran berkas fisik. Hanya <strong>Admin</strong> yang diizinkan mengunggah berkas.";
          }
        }

        modal.classList.remove('hidden');
        modal.classList.add('flex');
        
        // Render ulang icon Lucide baru agar ikon tampil sempurna
        lucide.createIcons();
      }
    }

    function closeDetailModal() {
      const modal = document.getElementById('modal-detail');
      modal.classList.add('hidden');
      modal.classList.remove('flex');

      // Kembalikan lebar kartu ke setelan default
      const card = document.getElementById('modal-detail-card');
      card.classList.remove('max-w-4xl');
      card.classList.add('max-w-lg');

      const grid = document.getElementById('modal-detail-grid');
      grid.classList.remove('grid-cols-1', 'md:grid-cols-2');
      grid.classList.add('grid-cols-1');

      // Kosongkan preview untuk mereset memori pemutar PDF iframe
      document.getElementById('detail-file-preview').innerHTML = '';
    }

    // 5. Muat Draf Surat Keluar ke Generator A4 secara Instan (Hanya Admin)
    function loadToGenerator(id) {
      if (!isAdmin) return;

      const item = suratKeluarList.find(x => x.id === id);
      if (item) {
        document.getElementById('input_nomorSurat').value = item.no_surat || '';
        
        // Hilangkan tipe naskah dinas jika ada di perihal untuk input 'hal'
        const cleanHal = item.perihal.replace(/^(Surat Tugas|Surat Undangan|Surat Keterangan):\s*/, '');
        document.getElementById('input_hal').value = cleanHal;
        document.getElementById('input_penerimaNama').value = item.tujuan;
        document.getElementById('input_isiSurat').value = item.isi_ringkas || '';
        document.getElementById('input_tanggalSurat').value = item.tanggal_surat;

        // Picu pembaruan pratinjau lembar kertas
        syncAllInputs();
        
        // Alihkan ke halaman generator
        switchTab('buat-surat');
      }
    }

    // 6. Sistem Sinkronisasi Reaktif Pembuat Surat (JS Instan)
    const previewFields = [
      'jenisSurat', 'nomorSurat', 'lampiran', 'hal', 'tanggalSurat', 
      'penerimaNama', 'penerimaJabatan', 'penerimaNip', 
      'isiSurat', 'penutupSurat', 'ttdNama', 'ttdJabatan', 'ttdNip'
    ];

    function syncAllInputs() {
      previewFields.forEach(field => {
        const inputEl = document.getElementById('input_' + field);
        const previewEl = document.getElementById('preview_' + field);
        if (inputEl && previewEl) {
          if (field === 'tanggalSurat') {
            const dateVal = new Date(inputEl.value);
            const options = { day: 'numeric', month: 'long', year: 'numeric' };
            previewEl.innerText = isNaN(dateVal) ? inputEl.value : dateVal.toLocaleDateString('id-ID', options);
          } else if (field === 'penerimaNip') {
            const container = document.getElementById('preview_penerimaNip_container');
            if (inputEl.value.trim() === '') {
              container.classList.add('hidden');
            } else {
              container.classList.remove('hidden');
              previewEl.innerText = inputEl.value;
            }
          } else {
            previewEl.innerText = inputEl.value;
          }
        }
      });
    }

    // Pasang Event listener reaktif ke semua input configurator
    previewFields.forEach(field => {
      const inputEl = document.getElementById('input_' + field);
      if (inputEl) {
        inputEl.addEventListener('input', syncAllInputs);
      }
    });

    // 7. Sistem Pencarian & Filter Klien (Cepat & Non-Reload)
    function applyFilterAndSearch(type) {
      const searchVal = document.getElementById('search-input-' + type).value.toLowerCase();
      const filterVal = document.getElementById('filter-sifat-' + type).value;
      const tbody = document.getElementById('surat-' + type + '-tbody');
      const rows = tbody.getElementsByTagName('tr');
      let visibleCount = 0;

      for (let i = 0; i < rows.length; i++) {
        const row = rows[i];
        if (row.id === 'no-data-' + type) continue;

        const text = row.textContent.toLowerCase();
        const sifat = row.getAttribute('data-sifat') || '';

        const matchSearch = text.includes(searchVal);
        const matchFilter = filterVal === 'Semua' || sifat === filterVal;

        if (matchSearch && matchFilter) {
          row.classList.remove('hidden');
          visibleCount++;
        } else {
          row.classList.add('hidden');
        }
      }

      // Tampilkan row kosong jika hasil pencarian nihil
      const noDataRow = document.getElementById('no-data-' + type);
      if (noDataRow) {
        if (visibleCount === 0) {
          noDataRow.classList.remove('hidden');
        } else {
          noDataRow.classList.add('hidden');
        }
      }
    }

    // Inisialisasi awal saat dokumen selesai dimuat
    window.addEventListener('DOMContentLoaded', () => {
      // Aktifkan tab berdasarkan parameter query
      switchTab(currentTab);
      
      // Sinkronisasikan isian generator bawaan
      syncAllInputs();

      // Mulai inisialisasi icon Lucide
      lucide.createIcons();

      // Hilangkan notifikasi toast secara perlahan dalam 3 detik
      const toast = document.getElementById('toast-notif');
      if (toast) {
        setTimeout(() => {
          toast.classList.add('opacity-0', 'scale-95');
          setTimeout(() => toast.remove(), 300);
        }, 3000);
      }
    });
  </script>
</body>
</html>