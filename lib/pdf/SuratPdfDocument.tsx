import { Document, Page, View, Text, StyleSheet } from '@react-pdf/renderer';
import { PAPER_SIZES, PaperSizeKey, SuratTemplateData } from '@/app/components/SuratTemplate';
import { Profil } from '@/types';

const MM_TO_PT = 72 / 25.4;
const mm = (value: string) => parseFloat(value) * MM_TO_PT;

const styles = StyleSheet.create({
  page: {
    paddingTop: 40,
    paddingBottom: 40,
    paddingHorizontal: 48,
    fontFamily: 'Times-Roman',
    fontSize: 11,
    color: '#000000',
  },
  kop: {
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: '#000000',
    paddingBottom: 12,
    marginBottom: 24,
    gap: 16,
  },
  logoBox: {
    width: 56,
    height: 56,
    borderWidth: 1.5,
    borderColor: '#000000',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoText: {
    fontFamily: 'Helvetica-Bold',
    fontSize: 7,
    textAlign: 'center',
  },
  kopTextWrap: {
    flex: 1,
    alignItems: 'center',
  },
  namaInstansi: {
    fontFamily: 'Helvetica-Bold',
    fontSize: 12,
    letterSpacing: 1,
    textTransform: 'uppercase',
    textAlign: 'center',
  },
  namaDinas: {
    fontFamily: 'Helvetica-Bold',
    fontSize: 16,
    textTransform: 'uppercase',
    textAlign: 'center',
    marginTop: 2,
  },
  alamat: {
    fontFamily: 'Helvetica',
    fontSize: 8,
    textAlign: 'center',
    marginTop: 6,
    lineHeight: 1.4,
  },
  website: {
    fontFamily: 'Helvetica-Bold',
    fontSize: 8,
    textAlign: 'center',
    color: '#155e75',
    marginTop: 2,
  },
  jenisSuratWrap: {
    alignItems: 'center',
    marginBottom: 16,
  },
  jenisSurat: {
    fontFamily: 'Helvetica-Bold',
    fontSize: 12,
    textTransform: 'uppercase',
    textDecoration: 'underline',
    letterSpacing: 1,
  },
  nomorSurat: {
    fontFamily: 'Helvetica',
    fontSize: 10,
    marginTop: 4,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  infoLeft: {
    fontFamily: 'Helvetica',
    fontSize: 10,
    lineHeight: 1.6,
  },
  infoRight: {
    fontFamily: 'Helvetica',
    fontSize: 10,
  },
  penerimaBlock: {
    marginBottom: 16,
    fontFamily: 'Helvetica',
    fontSize: 10,
    lineHeight: 1.5,
  },
  penerimaNama: {
    fontFamily: 'Helvetica-Bold',
    fontSize: 11,
  },
  penerimaJabatan: {
    fontFamily: 'Helvetica-Oblique',
  },
  bodyParagraph: {
    fontFamily: 'Times-Roman',
    fontSize: 11,
    lineHeight: 1.7,
    textAlign: 'justify',
    textIndent: 28,
    marginBottom: 12,
  },
  bodyParagraphNoIndent: {
    fontFamily: 'Times-Roman',
    fontSize: 11,
    lineHeight: 1.7,
    textAlign: 'justify',
    marginBottom: 12,
  },
  ttdWrap: {
    marginTop: 48,
    alignItems: 'flex-end',
  },
  ttdBlock: {
    width: 220,
    textAlign: 'center',
    fontFamily: 'Helvetica',
    fontSize: 10,
  },
  ttdJabatan: {
    fontFamily: 'Helvetica-Bold',
  },
  namaDinasKecil: {
    fontFamily: 'Helvetica',
    fontSize: 8,
    textTransform: 'uppercase',
    marginTop: 2,
  },
  ttdNama: {
    fontFamily: 'Helvetica-Bold',
    fontSize: 11,
    textDecoration: 'underline',
    marginTop: 64,
  },
  ttdNip: {
    fontFamily: 'Helvetica',
    fontSize: 8,
    marginTop: 2,
  },
});

interface SuratPdfDocumentProps {
  data: SuratTemplateData;
  profil: Profil | { nama_instansi: string; nama_dinas: string; alamat: string; telepon: string; email: string; kode_pos: string; website: string };
  paperSize: PaperSizeKey;
}

export default function SuratPdfDocument({ data, profil, paperSize }: SuratPdfDocumentProps) {
  const dim = PAPER_SIZES[paperSize];
  const pageSize: [number, number] = [mm(dim.width), mm(dim.height)];

  return (
    <Document>
      <Page size={pageSize} style={styles.page}>
        <View style={styles.kop}>
          <View style={styles.logoBox}>
            <Text style={styles.logoText}>LOGO{'\n'}DAERAH</Text>
          </View>
          <View style={styles.kopTextWrap}>
            <Text style={styles.namaInstansi}>{profil.nama_instansi}</Text>
            <Text style={styles.namaDinas}>{profil.nama_dinas}</Text>
            <Text style={styles.alamat}>
              {profil.alamat}{'\n'}
              Telp: {profil.telepon} | Email: {profil.email} | Kode Pos: {profil.kode_pos}
            </Text>
            <Text style={styles.website}>{profil.website}</Text>
          </View>
        </View>

        <View style={styles.jenisSuratWrap}>
          <Text style={styles.jenisSurat}>{data.jenisSurat}</Text>
          <Text style={styles.nomorSurat}>Nomor: {data.nomorSurat}</Text>
        </View>

        <View style={styles.infoRow}>
          <Text style={styles.infoLeft}>
            Lampiran : {data.lampiran}{'\n'}
            Perihal   : {data.hal}
          </Text>
          <Text style={styles.infoRight}>Jakarta, {data.tanggalFormatted}</Text>
        </View>

        <View style={styles.penerimaBlock}>
          <Text>Kepada Yth.</Text>
          <Text style={styles.penerimaNama}>{data.penerimaNama}</Text>
          {!!data.penerimaJabatan && <Text style={styles.penerimaJabatan}>{data.penerimaJabatan}</Text>}
          {!!data.penerimaNip && <Text>NIP. {data.penerimaNip}</Text>}
          <Text>di Tempat</Text>
        </View>

        <Text style={styles.bodyParagraph}>{data.isiSurat}</Text>
        {!!data.penutupSurat && <Text style={styles.bodyParagraphNoIndent}>{data.penutupSurat}</Text>}

        <View style={styles.ttdWrap}>
          <View style={styles.ttdBlock}>
            <Text style={styles.ttdJabatan}>{data.ttdJabatan}</Text>
            <Text style={styles.namaDinasKecil}>{profil.nama_dinas}</Text>
            <Text style={styles.ttdNama}>{data.ttdNama}</Text>
            <Text style={styles.ttdNip}>NIP. {data.ttdNip}</Text>
          </View>
        </View>
      </Page>
    </Document>
  );
}
