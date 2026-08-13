export type SlideAttachment = {
  id: string;
  title: string;
  fileName: string;
  fileUrl: string;
  fileType: string;
};

export type Slide = {
  id: string;
  title: string;
  badge: string;
  subtitle: string;
  body: string;
  topics?: { id: string; title: string }[];
  attachments?: SlideAttachment[];
};

export type VideoItem = {
  id: string;
  title: string;
  duration: string;
  tag: string;
  embedUrl: string;
  description: string;
};

export type DocumentMaterial = {
  id: string;
  title: string;
  description: string;
  fileName: string;
  fileUrl: string;
  fileType: string;
};

export type AssignmentItem = {
  id: string;
  title: string;
  badge: string;
  description: string;
  instructions: string[];
  starterCode: string;
};

export type EvaluationQuestion = {
  id: string;
  question: string;
  options: string[];
  correctAnswer: string;
};

export type Evaluation = {
  id: string;
  title: string;
  questions: EvaluationQuestion[];
  createdAt: string;
};

export const slides: Slide[] = [
  {
    id: "slide-1",
    title: "Modul 1. Pengenalan HTML",
    badge: "HTML Dasar",
    subtitle: "Dasar-dasar HTML dan pembuatan halaman awal",
    topics: [
      { id: "html-introduction", title: "HTML Introduction" },
      { id: "html-editors", title: "HTML Editors" },
      { id: "html-basic", title: "HTML Basic" },
      { id: "html-elements", title: "HTML Elements" },
      { id: "html-attributes", title: "HTML Attributes" },
      { id: "html-headings", title: "HTML Headings" },
      { id: "html-paragraphs", title: "HTML Paragraphs" },
      { id: "html-styles", title: "HTML Styles" },
      { id: "html-formatting", title: "HTML Formatting" },
      { id: "html-comments", title: "HTML Comments" },
    ],
    body: "<p>Modul ini mengenalkan dasar-dasar HTML agar siswa memahami struktur sebuah halaman web dan cara menulis dokumen HTML pertama.</p><h3 id=\"html-introduction\">HTML Introduction</h3><p>HTML adalah bahasa markup untuk membuat struktur halaman web. Siswa belajar bagaimana browser menampilkan tag HTML dan bagaimana HTML membentuk konten di layar.</p><h3 id=\"html-editors\">HTML Editors</h3><p>Pelajari editor teks sederhana yang dapat digunakan untuk menulis HTML, seperti VS Code, Notepad, atau editor online. Pahami cara menyimpan file dengan ekstensi <code>.html</code>.</p><h3 id=\"html-basic\">HTML Basic</h3><p>Kenali struktur dasar dokumen HTML: <code>&lt;!DOCTYPE html&gt;</code>, <code>&lt;html&gt;</code>, <code>&lt;head&gt;</code>, dan <code>&lt;body&gt;</code>.</p><h3 id=\"html-elements\">HTML Elements</h3><p>Setiap elemen HTML terdiri dari tag pembuka dan penutup. Contoh: <code>&lt;p&gt;</code> untuk paragraf, <code>&lt;h1&gt;</code> untuk judul.</p><h3 id=\"html-attributes\">HTML Attributes</h3><p>Atribut memberi informasi tambahan pada elemen, seperti <code>id</code>, <code>class</code>, dan <code>src</code> pada gambar.</p><h3 id=\"html-headings\">HTML Headings</h3><p>Heading digunakan untuk judul dan subjudul. Ada tag <code>&lt;h1&gt;</code> sampai <code>&lt;h6&gt;</code>.</p><h3 id=\"html-paragraphs\">HTML Paragraphs</h3><p>Gunakan tag <code>&lt;p&gt;</code> untuk menulis teks paragraf agar konten terstruktur.</p><h3 id=\"html-styles\">HTML Styles</h3><p>Pelajari penggunaan atribut <code>style</code> untuk memberi warna atau ukuran teks secara langsung di HTML.</p><h3 id=\"html-formatting\">HTML Formatting</h3><p>Gunakan tag seperti <code>&lt;strong&gt;</code>, <code>&lt;em&gt;</code>, dan <code>&lt;u&gt;</code> untuk memformat teks.</p><h3 id=\"html-comments\">HTML Comments</h3><p>Comments ditulis dengan <code>&lt;!-- komentar --&gt;</code> untuk memberi catatan tanpa muncul di halaman.</p><p><strong>Praktik:</strong> Buat halaman HTML sederhana berisi judul, paragraf, dan komentar untuk menampilkan teks <em>Halo Dunia</em>.</p>",
  },
  {
    id: "slide-2",
    title: "Modul 2. Pengelolaan Konten HTML",
    badge: "HTML Dasar",
    subtitle: "Konten dasar dan struktur informasi pada halaman web",
    topics: [
      { id: "html-colors", title: "HTML Colors" },
      { id: "html-links", title: "HTML Links" },
      { id: "html-images", title: "HTML Images" },
      { id: "html-favicon", title: "HTML Favicon" },
      { id: "html-page-title", title: "HTML Page Title" },
      { id: "html-tables", title: "HTML Tables" },
      { id: "html-lists", title: "HTML Lists" },
    ],
    body: "<p>Modul ini menunjukkan cara mengelola konten dan elemen yang umum dipakai dalam halaman web.</p><h3 id=\"html-colors\">HTML Colors</h3><p>Pelajari cara menambahkan warna pada teks dan latar belakang menggunakan atribut <code>style</code> dengan nilai warna seperti nama, heksadesimal, atau RGB.</p><h3 id=\"html-links\">HTML Links</h3><p>Gunakan tag <code>&lt;a&gt;</code> untuk membuat tautan ke halaman lain atau ke bagian tertentu di dalam halaman.</p><h3 id=\"html-images\">HTML Images</h3><p>Tambahkan gambar menggunakan tag <code>&lt;img&gt;</code> dan atribut <code>src</code>, <code>alt</code>, dan <code>width</code>.</p><h3 id=\"html-favicon\">HTML Favicon</h3><p>Pelajari cara menampilkan ikon situs di tab browser dengan tag <code>&lt;link rel=\"icon\" href=\"favicon.ico\" /&gt;</code>.</p><h3 id=\"html-page-title\">HTML Page Title</h3><p>Judul halaman ditentukan di dalam tag <code>&lt;title&gt;</code> pada bagian <code>&lt;head&gt;</code>.</p><h3 id=\"html-tables\">HTML Tables</h3><p>Buat tabel sederhana dengan <code>&lt;table&gt;</code>, <code>&lt;tr&gt;</code>, <code>&lt;th&gt;</code>, dan <code>&lt;td&gt;</code>.</p><h3 id=\"html-lists\">HTML Lists</h3><p>Gunakan daftar terurut <code>&lt;ol&gt;</code> atau tidak terurut <code>&lt;ul&gt;</code> dan elemen <code>&lt;li&gt;</code>.</p><p><strong>Praktik:</strong> Buat halaman Biodata Siswa berisi foto, link, tabel informasi, dan daftar hobi.</p>",
  },
  {
    id: "slide-3",
    title: "Modul 3. Layout HTML",
    badge: "HTML Dasar",
    subtitle: "Menata tampilan dan struktur halaman menggunakan elemen HTML",
    topics: [
      { id: "html-block-inline", title: "HTML Block & Inline" },
      { id: "html-div", title: "HTML Div" },
      { id: "html-classes", title: "HTML Classes" },
      { id: "html-id", title: "HTML Id" },
      { id: "html-buttons", title: "HTML Buttons" },
      { id: "html-iframes", title: "HTML Iframes" },
      { id: "html-layout", title: "HTML Layout" },
      { id: "html-responsive", title: "HTML Responsive" },
    ],
    body: "<p>Modul ini fokus pada layout dan struktur halaman agar konten tersusun rapi.</p><h3 id=\"html-block-inline\">HTML Block & Inline</h3><p>Kenali perbedaan elemen block seperti <code>&lt;div&gt;</code> dan elemen inline seperti <code>&lt;span&gt;</code>.</p><h3 id=\"html-div\">HTML Div</h3><p><code>&lt;div&gt;</code> digunakan sebagai kontainer untuk mengelompokkan bagian halaman.</p><h3 id=\"html-classes\">HTML Classes</h3><p>Atribut <code>class</code> membantu memberi label untuk satu atau lebih elemen agar bisa distil atau dikenali bersama.</p><h3 id=\"html-id\">HTML Id</h3><p><code>id</code> memberi tanda unik pada elemen untuk navigasi atau styling khusus.</p><h3 id=\"html-buttons\">HTML Buttons</h3><p>Gunakan <code>&lt;button&gt;</code> untuk membuat tombol yang bisa men-trigger aksi atau interaksi.</p><h3 id=\"html-iframes\">HTML Iframes</h3><p><code>&lt;iframe&gt;</code> dapat menampilkan konten eksternal seperti video atau dokumen dalam sebuah bingkai.</p><h3 id=\"html-layout\">HTML Layout</h3><p>Buat struktur halaman dengan header, section, aside, dan footer agar tampilan lebih jelas.</p><h3 id=\"html-responsive\">HTML Responsive</h3><p>Pelajari cara menata elemen agar tampil baik di layar kecil maupun besar, misalnya dengan menggunakan properti CSS dasar di atribut style.</p><p><strong>Praktik:</strong> Buat Landing Page sederhana dengan header, hero, fitur, dan footer.</p>",
  },
  {
    id: "slide-4",
    title: "Modul 4. HTML Semantik",
    badge: "HTML Dasar",
    subtitle: "Menggunakan elemen semantik untuk struktur halaman yang jelas",
    topics: [
      { id: "html-head", title: "HTML Head" },
      { id: "html-semantics", title: "HTML Semantics" },
      { id: "html-style-guide", title: "HTML Style Guide" },
      { id: "html-entities", title: "HTML Entities" },
      { id: "html-symbols", title: "HTML Symbols" },
      { id: "html-emojis", title: "HTML Emojis" },
      { id: "html-charset", title: "HTML Charset" },
      { id: "html-url-encode", title: "HTML URL Encode" },
    ],
    body: "<p>Modul ini menjelaskan elemen semantik yang membuat struktur HTML lebih mudah dibaca baik oleh manusia maupun mesin.</p><h3 id=\"html-head\">HTML Head</h3><p>Bagian <code>&lt;head&gt;</code> berisi metadata seperti judul, charset, dan link ke stylesheet.</p><h3 id=\"html-semantics\">HTML Semantics</h3><p>Gunakan elemen semantik seperti <code>&lt;header&gt;</code>, <code>&lt;nav&gt;</code>, <code>&lt;article&gt;</code>, dan <code>&lt;footer&gt;</code> untuk memberi makna pada konten.</p><h3 id=\"html-style-guide\">HTML Style Guide</h3><p>Pahami aturan penamaan, indentasi, dan konsistensi penulisan HTML agar kode jelas dan mudah dipelajari.</p><h3 id=\"html-entities\">HTML Entities</h3><p>Gunakan entitas seperti <code>&amp;nbsp;</code> atau <code>&amp;lt;</code> untuk menampilkan karakter khusus secara benar.</p><h3 id=\"html-symbols\">HTML Symbols</h3><p>Simbol seperti &copy; atau &trade; dapat ditampilkan menggunakan entitas HTML.</p><h3 id=\"html-emojis\">HTML Emojis</h3><p>Emoji juga dapat dimasukkan di teks HTML, baik secara langsung maupun dengan entitas.</p><h3 id=\"html-charset\">HTML Charset</h3><p>Pastikan charset halaman ditetapkan dengan <code>&lt;meta charset=&quot;UTF-8&quot; /&gt;</code> agar teks ditampilkan benar.</p><h3 id=\"html-url-encode\">HTML URL Encode</h3><p>Pahami cara meng-encode karakter di URL agar link bekerja dengan baik.</p><p><strong>Praktik:</strong> Buat artikel berita sederhana menggunakan elemen semantik untuk header, judul, teks, dan gambar.</p>",
  },

  {
    id: "slide-5",
    title: "Modul 5. HTML Forms",
    badge: "HTML Dasar",
    subtitle: "Membuat formulir interaktif untuk pengumpulan data",
    body: "<p>Modul ini memperkenalkan formulir HTML untuk mengumpulkan data dari pengguna.</p><h3>HTML Forms</h3><p>Tag <code>&lt;form&gt;</code> merupakan wadah untuk elemen input dan tombol pengiriman.</p><h3>HTML Form Attributes</h3><p>Atribut seperti <code>action</code> dan <code>method</code> menentukan tujuan dan cara data dikirim.</p><h3>HTML Form Elements</h3><p>Elemen form seperti <code>&lt;input&gt;</code>, <code>&lt;select&gt;</code>, <code>&lt;textarea&gt;</code>, dan <code>&lt;button&gt;</code>.</p><h3>HTML Input Types</h3><p>Jenis input seperti <code>text</code>, <code>email</code>, <code>password</code>, dan <code>date</code> mendukung variasi data.</p><h3>HTML Input Attributes</h3><p>Atribut tambahan seperti <code>placeholder</code>, <code>required</code>, <code>name</code>, dan <code>value</code>.</p><p><strong>Praktik:</strong> Buat Form Pendaftaran Siswa dengan nama, kelas, email, dan tombol submit.</p>",
  },
  {
    id: "slide-6",
    title: "Modul 6. HTML Multimedia",
    badge: "HTML Dasar",
    subtitle: "Menambahkan audio, video, dan elemen multimedia lainnya",
    body: "<p>Modul ini menunjukkan cara menampilkan media dan grafis di halaman HTML.</p><h3>HTML Audio</h3><p>Gunakan tag <code>&lt;audio controls&gt;</code> untuk memutar file audio di browser.</p><h3>HTML Video</h3><p>Tag <code>&lt;video controls&gt;</code> memungkinkan pemutaran video langsung pada halaman.</p><h3>HTML YouTube</h3><p>Sematkan video YouTube menggunakan <code>&lt;iframe&gt;</code>.</p><h3>HTML Canvas</h3><p><code>&lt;canvas&gt;</code> adalah area gambar yang bisa diisi dengan grafik oleh JavaScript.</p><h3>HTML SVG</h3><p>Gunakan <code>&lt;svg&gt;</code> untuk membuat ilustrasi vektor langsung di HTML.</p><p><strong>Praktik:</strong> Buat halaman galeri multimedia dengan audio, video, dan sebuah gambar.</p>",
  },
  {
    id: "slide-7",
    title: "Modul 7. Proyek Akhir HTML",
    badge: "HTML Dasar",
    subtitle: "Menggabungkan seluruh materi HTML dalam satu proyek nyata",
    body: "<p>Untuk proyek akhir, siswa membuat Website Profil Sekolah dengan seluruh elemen HTML yang sudah dipelajari.</p><h3>Header</h3><p>Bagian atas halaman berisi judul sekolah dan logo.</p><h3>Navigasi</h3><p>Tambahkan menu untuk menuju bagian seperti profil, visi misi, dan kontak.</p><h3>Banner</h3><p>Buat tampilan pertama yang menarik dengan judul besar dan deskripsi singkat.</p><h3>Profil Sekolah</h3><p>Jelaskan siapa sekolah ini, letak, dan fokus pembelajaran.</p><h3>Visi dan Misi</h3><p>Gunakan daftar untuk menampilkan visi dan misi secara jelas.</p><h3>Galeri Foto</h3><p>Tambahkan beberapa gambar kegiatan sekolah atau fasilitas.</p><h3>Video Profil</h3><p>Sematkan video singkat menggunakan <code>&lt;iframe&gt;</code> atau placeholder video.</p><h3>Form Kontak</h3><p>Buat formulir sederhana agar pengunjung dapat mengirim pesan.</p><h3>Footer</h3><p>Tutup halaman dengan alamat, sosial media, dan hak cipta.</p><p><strong>Praktik:</strong> Bangun Website Profil Sekolah yang terstruktur dan mudah dinavigasi.</p>",
  },
  {
    id: "slide-8",
    title: "CSS Dasar",
    badge: "CSS",
    subtitle: "Mengatur warna, ukuran, jarak, dan tampilan elemen",
    body: "<p>Pelajari selector, properti warna, font, margin, padding, border, dan box model.</p><p>Tujuan pembelajaran: siswa bisa mempercantik struktur HTML dengan styling yang konsisten.</p>",
  },
  {
    id: "slide-9",
    title: "Layout Responsif",
    badge: "CSS",
    subtitle: "Flexbox, Grid, dan desain yang menyesuaikan layar",
    body: "<p>Gunakan Flexbox dan Grid untuk menyusun layout yang rapi di desktop maupun mobile.</p><p>Latihan: buat halaman profil dan kartu produk yang responsif.</p>",
  },
  {
    id: "slide-10",
    title: "JavaScript Dasar",
    badge: "JS",
    subtitle: "Variabel, fungsi, array, object, dan logika sederhana",
    body: "<p>Mulai dari deklarasi variabel, fungsi, percabangan, perulangan, hingga mengolah data array dan object.</p><p>Tujuan pembelajaran: siswa bisa membuat logika interaktif di halaman web.</p>",
  },
  {
    id: "slide-11",
    title: "DOM & Event",
    badge: "JS",
    subtitle: "Manipulasi elemen dan interaksi pengguna",
    body: "<p>Pelajari cara mengakses elemen HTML, mengubah konten, menangani event klik, input, dan form.</p><p>Latihan: buat tombol yang menambah dan mengurangi angka secara interaktif.</p>",
  },
];

export const videos: VideoItem[] = [
  {
    id: "video-1",
    title: "Membuat UI Modern dengan Tailwind",
    duration: "12:30",
    tag: "Front-End",
    embedUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ",
    description: "Panduan praktis membuat tampilan modern untuk platform pembelajaran.",
  },
  {
    id: "video-2",
    title: "Struktur Aplikasi Next.js",
    duration: "09:15",
    tag: "Next.js",
    embedUrl: "https://www.youtube.com/embed/ScMzIvxBSi4",
    description: "Belajar cara membagi aplikasi menjadi komponen dan modul yang bersih.",
  },
  {
    id: "video-3",
    title: "Menghubungkan Aplikasi ke Supabase",
    duration: "15:42",
    tag: "Database",
    embedUrl: "https://www.youtube.com/embed/2Jg7M-4p5e0",
    description: "Persiapan awal untuk menghubungkan data aplikasi ke penyimpanan cloud.",
  },
];

export const documentMaterials: DocumentMaterial[] = [
  {
    id: "doc-1",
    title: "Modul HTML Dasar",
    description: "Panduan singkat struktur dokumen HTML dan elemen penting.",
    fileName: "modul-html-dasar.pdf",
    fileUrl: "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf",
    fileType: "PDF",
  },
  {
    id: "doc-2",
    title: "Catatan CSS Layout",
    description: "Referensi Flexbox, Grid, dan teknik layout responsif.",
    fileName: "catatan-css-layout.docx",
    fileUrl: "https://view.officeapps.live.com/op/embed.aspx?src=https://raw.githubusercontent.com/microsoft/office-js-docs/master/docs/samples/word-samples.docx",
    fileType: "DOCX",
  },
  {
    id: "doc-3",
    title: "Lembar Praktik JavaScript",
    description: "Latihan interaktif untuk DOM dan event handling.",
    fileName: "lembar-praktik-javascript.pptx",
    fileUrl: "https://view.officeapps.live.com/op/embed.aspx?src=https://www.microsoft.com/en-us/microsoft-365/blog/wp-content/uploads/sites/2/2014/04/PowerPoint-2013.pptx",
    fileType: "PPTX",
  },
];

export const assignments: AssignmentItem[] = [
  {
    id: "assignment-1",
    title: "Membuat Landing Page",
    badge: "Praktik 1",
    description: "Bangun landing page sederhana dengan layout modern.",
    instructions: ["Gunakan komponen reusable", "Tambahkan hero section", "Sertakan CTA utama"],
    starterCode: `<style>
body {
  font-family: Arial, sans-serif;
  margin: 0;
  background: linear-gradient(135deg, #eef2ff, #f8fafc);
  display: grid;
  place-items: center;
  min-height: 100vh;
}
.card {
  width: min(90%, 480px);
  padding: 24px;
  border-radius: 20px;
  background: white;
  box-shadow: 0 15px 35px rgba(15, 23, 42, 0.1);
}
h1 { color: #4338ca; margin-bottom: 8px; }
p { color: #475569; line-height: 1.6; }
button {
  margin-top: 12px;
  border: none;
  padding: 10px 16px;
  border-radius: 999px;
  background: #4f46e5;
  color: white;
  cursor: pointer;
}
</style>
<div class="card">
  <h1>Landing Page Praktik</h1>
  <p>Ubah warna dan isi konten untuk membuat halaman ini lebih menarik.</p>
  <button>Coba Sekarang</button>
</div>`,
  },
  {
    id: "assignment-2",
    title: "Membuat Dashboard Ringkas",
    badge: "Praktik 2",
    description: "Buat dashboard yang menampilkan ringkasan progres belajar.",
    instructions: ["Tampilkan statistik", "Gunakan kartu status", "Tambahkan state role"],
    starterCode: `<style>
body {
  font-family: Arial, sans-serif;
  background: #f8fafc;
  padding: 24px;
}
.dashboard {
  display: grid;
  gap: 16px;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
}
.card {
  background: white;
  padding: 16px;
  border-radius: 16px;
  box-shadow: 0 10px 25px rgba(15, 23, 42, 0.08);
}
strong { font-size: 24px; color: #0f172a; }
</style>
<div class="dashboard">
  <div class="card"><p>Materi</p><strong>8</strong></div>
  <div class="card"><p>Tugas</p><strong>3</strong></div>
  <div class="card"><p>Nilai</p><strong>84</strong></div>
</div>`,
  },
];

export const evaluationQuestions: EvaluationQuestion[] = [
  {
    id: "eval-1",
    question: "Manakah yang paling tepat untuk memecah UI menjadi bagian yang rapi?",
    options: ["Komponen modular", "Satu file besar", "Inline style semua"],
    correctAnswer: "Komponen modular",
  },
  {
    id: "eval-2",
    question: "Apa keuntungan utama menghubungkan ke Supabase?",
    options: ["Data tersimpan terpusat", "Tidak perlu API", "Lebih kecil dari HTML"],
    correctAnswer: "Data tersimpan terpusat",
  },
  {
    id: "eval-3",
    question: "Apa arti dari SSR dalam Next.js?",
    options: ["Server Side Rendering", "Static Style Rules", "Simple Script Runtime"],
    correctAnswer: "Server Side Rendering",
  },
  {
    id: "eval-4",
    question: "Framework frontend yang paling sering dipakai bersama Next.js adalah?",
    options: ["React", "Laravel", "Django"],
    correctAnswer: "React",
  },
  {
    id: "eval-5",
    question: "Apa fungsi utama Tailwind CSS?",
    options: ["Mempermudah styling dengan utility class", "Mengolah database", "Mengganti JavaScript"],
    correctAnswer: "Mempermudah styling dengan utility class",
  },
  {
    id: "eval-6",
    question: "Apa yang dimaksud dengan state pada komponen?",
    options: ["Data yang bisa berubah selama aplikasi berjalan", "File CSS", "URL halaman"],
    correctAnswer: "Data yang bisa berubah selama aplikasi berjalan",
  },
  {
    id: "eval-7",
    question: "Di Next.js, untuk membuat halaman baru biasanya digunakan?",
    options: ["Folder dan file page.tsx", "Folder gambar saja", "File .env saja"],
    correctAnswer: "Folder dan file page.tsx",
  },
  {
    id: "eval-8",
    question: "Kapan useEffect biasanya dipakai?",
    options: ["Saat ingin menjalankan efek samping", "Saat membuat variabel CSS", "Saat mengatur route"],
    correctAnswer: "Saat ingin menjalankan efek samping",
  },
  {
    id: "eval-9",
    question: "Apa fungsi props pada komponen React?",
    options: ["Mengirim data dari parent ke child", "Menghapus komponen", "Menyimpan gambar"],
    correctAnswer: "Mengirim data dari parent ke child",
  },
  {
    id: "eval-10",
    question: "Data pengguna yang sensitif biasanya disimpan di?",
    options: ["Database aman seperti Supabase", "File HTML biasa", "Komentar di kode"],
    correctAnswer: "Database aman seperti Supabase",
  },
  {
    id: "eval-11",
    question: "Apa tujuan dari API route?",
    options: ["Menyediakan endpoint backend dari aplikasi", "Mengatur layout halaman", "Membuat icon"],
    correctAnswer: "Menyediakan endpoint backend dari aplikasi",
  },
  {
    id: "eval-12",
    question: "Mengapa data hardcoded kurang baik untuk aplikasi nyata?",
    options: ["Karena sulit dikelola dan diperbarui", "Karena lebih cepat dari database", "Karena tidak bisa ditampilkan"],
    correctAnswer: "Karena sulit dikelola dan diperbarui",
  },
  {
    id: "eval-13",
    question: "Apa kegunaan localStorage dalam frontend?",
    options: ["Menyimpan data sederhana di browser", "Mengirim email", "Memproses gambar"],
    correctAnswer: "Menyimpan data sederhana di browser",
  },
  {
    id: "eval-14",
    question: "Apa yang dimaksud dengan reactivity dalam UI?",
    options: ["Tampilan berubah saat data berubah", "Hanya memuat halaman pertama", "Menghapus event listener"],
    correctAnswer: "Tampilan berubah saat data berubah",
  },
  {
    id: "eval-15",
    question: "Mana yang termasuk library UI populer?",
    options: ["Tailwind CSS", "Node.js", "MongoDB"],
    correctAnswer: "Tailwind CSS",
  },
  {
    id: "eval-16",
    question: "Apa yang dimaksud dengan responsive design?",
    options: ["Tampilan yang menyesuaikan ukuran layar", "Hanya untuk desktop", "Hanya untuk mobile"],
    correctAnswer: "Tampilan yang menyesuaikan ukuran layar",
  },
  {
    id: "eval-17",
    question: "Apa manfaat utama Server Components di Next.js?",
    options: ["Membuat rendering lebih efisien dan aman", "Menghapus semua CSS", "Mempercepat koneksi internet"],
    correctAnswer: "Membuat rendering lebih efisien dan aman",
  },
  {
    id: "eval-18",
    question: "Apa fungsi utama form handling dalam aplikasi web?",
    options: ["Menerima input pengguna dan mengolahnya", "Mengganti warna tema", "Menutup tab browser"],
    correctAnswer: "Menerima input pengguna dan mengolahnya",
  },
  {
    id: "eval-19",
    question: "Apa arti accessibility dalam pengembangan web?",
    options: ["Membuat aplikasi lebih mudah diakses semua pengguna", "Menghapus semua tombol", "Membatasi fitur"],
    correctAnswer: "Membuat aplikasi lebih mudah diakses semua pengguna",
  },
  {
    id: "eval-20",
    question: "Cara terbaik untuk mengelola data asinkron di frontend adalah?",
    options: ["Menggunakan state dan efek yang terkontrol", "Menghapus semua API", "Mengganti semua teks"],
    correctAnswer: "Menggunakan state dan efek yang terkontrol",
  },
];

export const evaluations: Evaluation[] = [
  {
    id: "evaluation-1",
    title: "Evaluasi Formatif",
    questions: evaluationQuestions.slice(0, 10),
    createdAt: new Date().toISOString(),
  },
  {
    id: "evaluation-2",
    title: "Evaluasi Sumatif",
    questions: evaluationQuestions.slice(10, 20),
    createdAt: new Date().toISOString(),
  },
];
