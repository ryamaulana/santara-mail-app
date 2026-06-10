export interface Profil {
  id: number;
  nama_instansi: string;
  nama_dinas: string;
  alamat: string;
  telepon: string;
  email: string;
  kode_pos: string;
  website: string;
}

export interface SuratMasuk {
  id: string;
  no_surat: string;
  asal_surat: string;
  perihal: string;
  tanggal_surat: string;
  tanggal_diterima: string;
  sifat: string; // 'Biasa' | 'Penting' | 'Rahasia'
  status: string; // 'Baru' | 'Diproses' | 'Selesai'
  disposisi: string;
  ringkasan: string;
  file_surat: string;
}

export interface SuratKeluar {
  id: string;
  no_surat: string;
  tujuan: string;
  perihal: string;
  tanggal_surat: string;
  sifat: string; // 'Biasa' | 'Penting'
  status: string; // 'Draf' | 'Persetujuan' | 'Dikirim'
  pembuat: string;
  isi_ringkas: string;
  file_surat: string;
}
