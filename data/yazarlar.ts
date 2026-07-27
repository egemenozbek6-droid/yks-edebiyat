export const baslik = "YKS Edebiyat - Yazar & Eser Ezberi"
export const amac =
  "Türk edebiyatının dönemlerine göre yazar - eser eşleştirmelerini kart ve test moduyla kalıcı olarak ezberlemek."
export const notu =
  "Kartlar dönem dönem gruplanmıştır. Önce dönemin genel özelliğini, sonra yazarın eserlerini hatırlamaya çalış. Yanlış bildiğin kartı 'Tekrar Et' ile destenin sonuna at."

export type Donem =
  | "Tanzimat I. Dönem"
  | "Tanzimat II. Dönem"
  | "Servet-i Fûnûn"
  | "Fecr-i Âti"
  | "Millî Edebiyat"
  | "Cumhuriyet Şiiri"
  | "Cumhuriyet Romanı"

export type Yazar = {
  ad: string
  donem: Donem
  tur: string
  eserler: string[]
  ipucu: string
}

/** Rozet renkleri: her dönem için ince, şık bir renk paleti */
export const donemStil: Record<Donem, string> = {
  "Tanzimat I. Dönem":
    "bg-amber-100 text-amber-800 ring-amber-300/70 dark:bg-amber-500/15 dark:text-amber-200 dark:ring-amber-400/30",
  "Tanzimat II. Dönem":
    "bg-orange-100 text-orange-800 ring-orange-300/70 dark:bg-orange-500/15 dark:text-orange-200 dark:ring-orange-400/30",
  "Servet-i Fûnûn":
    "bg-teal-100 text-teal-800 ring-teal-300/70 dark:bg-teal-500/15 dark:text-teal-200 dark:ring-teal-400/30",
  "Fecr-i Âti":
    "bg-sky-100 text-sky-800 ring-sky-300/70 dark:bg-sky-500/15 dark:text-sky-200 dark:ring-sky-400/30",
  "Millî Edebiyat":
    "bg-rose-100 text-rose-800 ring-rose-300/70 dark:bg-rose-500/15 dark:text-rose-200 dark:ring-rose-400/30",
  "Cumhuriyet Şiiri":
    "bg-emerald-100 text-emerald-800 ring-emerald-300/70 dark:bg-emerald-500/15 dark:text-emerald-200 dark:ring-emerald-400/30",
  "Cumhuriyet Romanı":
    "bg-stone-200 text-stone-700 ring-stone-300 dark:bg-stone-500/20 dark:text-stone-200 dark:ring-stone-400/30",
}

export const donemler: Donem[] = [
  "Tanzimat I. Dönem",
  "Tanzimat II. Dönem",
  "Servet-i Fûnûn",
  "Fecr-i Âti",
  "Millî Edebiyat",
  "Cumhuriyet Şiiri",
  "Cumhuriyet Romanı",
]

export const yazarlar: Yazar[] = [
  // ——— Tanzimat I. Dönem ———
  {
    ad: "Şinasi",
    donem: "Tanzimat I. Dönem",
    tur: "Şiir / Tiyatro",
    eserler: ["Şair Evlenmesi", "Tercüme-i Manzume", "Müntehabat-ı Eş'ar", "Durub-ı Emsal-i Osmaniye"],
    ipucu: "İlk yerli tiyatro eserinin yazarı; Tercüman-ı Ahval gazetesini çıkardı.",
  },
  {
    ad: "Ziya Paşa",
    donem: "Tanzimat I. Dönem",
    tur: "Şiir / Makale",
    eserler: ["Terkib-i Bend", "Harabat", "Zafername", "Şiir ve İnşa"],
    ipucu: "Divan edebiyatını savunan Harabat ile halk edebiyatını savunan Şiir ve İnşa arasındaki çelişki.",
  },
  {
    ad: "Namık Kemal",
    donem: "Tanzimat I. Dönem",
    tur: "Roman / Tiyatro",
    eserler: ["İntibah", "Cezmi", "Vatan Yahut Silistre", "Celalettin Harzemşah"],
    ipucu: "İlk edebî roman İntibah, ilk tarihî roman Cezmi.",
  },
  {
    ad: "Ahmet Mithat Efendi",
    donem: "Tanzimat I. Dönem",
    tur: "Roman / Öykü",
    eserler: ["Felatun Bey ile Rakım Efendi", "Hasan Mellah", "Letaif-i Rivayat", "Müşahedat"],
    ipucu: "\"Hâce-i Evvel\" (ilk öğretmen); halk için roman yazdı.",
  },
  {
    ad: "Şemsettin Sami",
    donem: "Tanzimat I. Dönem",
    tur: "Roman / Sözlük",
    eserler: ["Taaşşuk-ı Talat ve Fitnat", "Kamus-ı Türkî", "Kamusü'l Alam"],
    ipucu: "İlk Türk romanı sayılan Taaşşuk-ı Talat ve Fitnat.",
  },

  // ——— Tanzimat II. Dönem ———
  {
    ad: "Recaizade Mahmut Ekrem",
    donem: "Tanzimat II. Dönem",
    tur: "Roman / Şiir",
    eserler: ["Araba Sevdası", "Zemzeme", "Talim-i Edebiyat", "Çok Bilen Çok Yanılır"],
    ipucu: "İlk realist roman Araba Sevdası; Muallim Naci ile eski-yeni tartışması.",
  },
  {
    ad: "Abdülhak Hamit Tarhan",
    donem: "Tanzimat II. Dönem",
    tur: "Şiir / Tiyatro",
    eserler: ["Makber", "Ölü", "Sahra", "Tarık Yahut Endülüs Fethi"],
    ipucu: "\"Şair-i Azam\"; eşinin ölümü üzerine Makber.",
  },
  {
    ad: "Samipaşazade Sezai",
    donem: "Tanzimat II. Dönem",
    tur: "Roman / Öykü",
    eserler: ["Sergüzeşt", "Küçük Şeyler", "Şir"],
    ipucu: "Batılı anlamda ilk öykü kitabı Küçük Şeyler.",
  },
  {
    ad: "Nabizade Nazım",
    donem: "Tanzimat II. Dönem",
    tur: "Roman / Öykü",
    eserler: ["Karabibik", "Zehra", "Yadigârlarım"],
    ipucu: "İlk köy romanı Karabibik; ilk psikolojik roman denemesi Zehra.",
  },
  {
    ad: "Muallim Naci",
    donem: "Tanzimat II. Dönem",
    tur: "Şiir / Anı",
    eserler: ["Ateşpare", "Şerare", "Ömer'in Çocukluğu", "Istılahat-ı Edebiye"],
    ipucu: "Eski şiiri savunan kanat; ilk otobiyografik eser sayılan Ömer'in Çocukluğu.",
  },

  // ——— Servet-i Fûnûn ———
  {
    ad: "Tevfik Fikret",
    donem: "Servet-i Fûnûn",
    tur: "Şiir",
    eserler: ["Rübab-ı Şikeste", "Haluk'un Defteri", "Şermin", "Tarih-i Kadim"],
    ipucu: "Toplumcu şiirin öncüsü; Şermin çocuklar için yazıldı.",
  },
  {
    ad: "Cenap Şahabettin",
    donem: "Servet-i Fûnûn",
    tur: "Şiir / Gezi",
    eserler: ["Evrak-ı Eyyam", "Hac Yolunda", "Tiryaki Sözleri", "Elhan-ı Şita"],
    ipucu: "Sembolizmin temsilcisi; \"Elhan-ı Şita\" şiiri.",
  },
  {
    ad: "Halit Ziya Uşaklıgil",
    donem: "Servet-i Fûnûn",
    tur: "Roman / Öykü",
    eserler: ["Aşk-ı Memnu", "Mai ve Siyah", "Kırık Hayatlar", "Sefile"],
    ipucu: "İlk teknik olarak güçlü Türk romancısı; Mai ve Siyah'ın kahramanı Ahmet Cemil.",
  },
  {
    ad: "Mehmet Rauf",
    donem: "Servet-i Fûnûn",
    tur: "Roman",
    eserler: ["Eylül", "Ferda-yı Garam", "Genç Kız Kalbi"],
    ipucu: "İlk psikolojik roman Eylül.",
  },
  {
    ad: "Hüseyin Cahit Yalçın",
    donem: "Servet-i Fûnûn",
    tur: "Roman / Anı",
    eserler: ["Hayal İçinde", "Kavgalarım", "Edebi Hatıralar"],
    ipucu: "Servet-i Fûnûn'un kapanmasına yol açan \"Edebiyat ve Hukuk\" yazısı.",
  },

  // ——— Fecr-i Âti ———
  {
    ad: "Ahmet Haşim",
    donem: "Fecr-i Âti",
    tur: "Şiir / Deneme",
    eserler: ["Piyale", "Göl Saatleri", "Bize Göre", "Gurabahane-i Laklakan"],
    ipucu: "Saf şiir; \"Şiir Hakkında Bazı Mülahazalar\" ön sözü.",
  },
  {
    ad: "Ali Canip Yöntem",
    donem: "Fecr-i Âti",
    tur: "Şiir / İnceleme",
    eserler: ["Geçtiğim Yol", "Epope", "Türk Edebiyatı Antolojisi"],
    ipucu: "Fecr-i Âti'den Millî Edebiyat'a geçen isim; Ömer Seyfettin ile Genç Kalemler.",
  },

  // ——— Millî Edebiyat ———
  {
    ad: "Ömer Seyfettin",
    donem: "Millî Edebiyat",
    tur: "Öykü",
    eserler: ["Kaşağı", "Yalnız Efe", "Yüksek Ökçeler", "Bomba", "Efruz Bey"],
    ipucu: "Modern Türk öykücülüğünün kurucusu; Genç Kalemler dergisi.",
  },
  {
    ad: "Ziya Gökalp",
    donem: "Millî Edebiyat",
    tur: "Şiir / Deneme",
    eserler: ["Kızıl Elma", "Altın Işık", "Türkçülüğün Esasları", "Türk Medeniyeti Tarihi"],
    ipucu: "Türkçülüğün fikir babası; sosyolojiyle şiiri birleştirdi.",
  },
  {
    ad: "Mehmet Emin Yurdakul",
    donem: "Millî Edebiyat",
    tur: "Şiir",
    eserler: ["Türkçe Şiirler", "Türk Sazı", "Ey Türk Uyan", "Ordunun Destanı"],
    ipucu: "\"Ben bir Türk'üm dinim cinsim uludur\" dizesi; millî şair.",
  },
  {
    ad: "Mehmet Akif Ersoy",
    donem: "Millî Edebiyat",
    tur: "Şiir",
    eserler: ["Safahat", "Çanakkale Şehitlerine", "Bülbül", "Asım"],
    ipucu: "Tek şiir kitabı Safahat, yedi bölümden oluşur.",
  },
  {
    ad: "Halide Edip Adıvar",
    donem: "Millî Edebiyat",
    tur: "Roman",
    eserler: ["Sinekli Bakkal", "Ateşten Gömlek", "Vurun Kahpeye", "Handan"],
    ipucu: "Kadın psikolojisi ve Kurtuluş Savaşı romanları.",
  },
  {
    ad: "Yakup Kadri Karaosmanoğlu",
    donem: "Millî Edebiyat",
    tur: "Roman",
    eserler: ["Yaban", "Kiralık Konak", "Nur Baba", "Ankara", "Sodom ve Gomore"],
    ipucu: "Aydın-köylü çatışması Yaban; kuşaklar arası kopuş Kiralık Konak.",
  },
  {
    ad: "Reşat Nuri Güntekin",
    donem: "Millî Edebiyat",
    tur: "Roman",
    eserler: ["Çalıkuşu", "Yeşil Gece", "Yaprak Dökümü", "Acımak"],
    ipucu: "Feride'nin Anadolu'daki öğretmenlik yolculuğu: Çalıkuşu.",
  },
  {
    ad: "Refik Halit Karay",
    donem: "Millî Edebiyat",
    tur: "Öykü / Roman",
    eserler: ["Memleket Hikâyeleri", "Gurbet Hikâyeleri", "Sürgün", "Yezidin Kızı"],
    ipucu: "Anadolu'yu öyküye taşıyan isim; \"Yüzelliliklerden\" biri.",
  },

  // ——— Cumhuriyet Şiiri ———
  {
    ad: "Nazım Hikmet",
    donem: "Cumhuriyet Şiiri",
    tur: "Şiir",
    eserler: ["Memleketimden İnsan Manzaraları", "835 Satır", "Kuvayı Milliye", "Yaşamaya Dair"],
    ipucu: "Serbest ölçünün öncüsü; toplumcu gerçekçi şiir.",
  },
  {
    ad: "Necip Fazıl Kısakürek",
    donem: "Cumhuriyet Şiiri",
    tur: "Şiir / Tiyatro",
    eserler: ["Çile", "Kaldırımlar", "Bir Adam Yaratmak", "Reis Bey"],
    ipucu: "Metafizik ürperti; Büyük Doğu dergisi.",
  },
  {
    ad: "Orhan Veli Kanık",
    donem: "Cumhuriyet Şiiri",
    tur: "Şiir",
    eserler: ["Garip", "Vazgeçemediğim", "Destan Gibi", "Kitabı Sami"],
    ipucu: "Garip (I. Yeni) hareketinin öncüsü; şiirden ölçü-uyağı attı.",
  },
  {
    ad: "Melih Cevdet Anday",
    donem: "Cumhuriyet Şiiri",
    tur: "Şiir",
    eserler: ["Rahatı Kaçan Ağaç", "Kolları Bağlı Odysseus", "Telgrafhane"],
    ipucu: "Garip üçlüsünden; sonradan mitolojik-düşünsel şiire yöneldi.",
  },
  {
    ad: "Oktay Rifat",
    donem: "Cumhuriyet Şiiri",
    tur: "Şiir",
    eserler: ["Yaşayıp Ölmek", "Perçemli Sokak", "Aşk ve Aşktan Doğan"],
    ipucu: "Garip üçlüsünden; Perçemli Sokak ile II. Yeni'ye yakınlaştı.",
  },
  {
    ad: "Cahit Sıtkı Tarancı",
    donem: "Cumhuriyet Şiiri",
    tur: "Şiir",
    eserler: ["Otuz Beş Yaş", "Ömrümde Sükût", "Düşten Güzel", "Ziya'ya Mektuplar"],
    ipucu: "Ölüm ve yaşama sevinci; \"Otuz beş yaş yolun yarısı eder\".",
  },
  {
    ad: "Fazıl Hüsnü Dağlarca",
    donem: "Cumhuriyet Şiiri",
    tur: "Şiir",
    eserler: ["Çakırın Destanı", "Üç Şehitler Destanı", "Toprak Ana", "Havaya Çizilen Dünya"],
    ipucu: "Destan şiirinin ustası; ses ve sözcük türetme.",
  },
  {
    ad: "Attila İlhan",
    donem: "Cumhuriyet Şiiri",
    tur: "Şiir / Roman",
    eserler: ["Ben Sana Mecburum", "Sisler Bulvarı", "Kurtlar Sofrası", "Sırtlan Payı"],
    ipucu: "Maviciler hareketi; toplumcu ama imgeli şiir.",
  },
  {
    ad: "Cemal Süreya",
    donem: "Cumhuriyet Şiiri",
    tur: "Şiir",
    eserler: ["Üvercinka", "Göçebe", "Beni Öp Sonra Doğur Beni", "Sevda Sözleri"],
    ipucu: "II. Yeni'nin en bilinen adı; aşk ve imge.",
  },
  {
    ad: "Turgut Uyar",
    donem: "Cumhuriyet Şiiri",
    tur: "Şiir",
    eserler: ["Dünyanın En Güzel Arabistanı", "Tütünler Islak", "Divan"],
    ipucu: "II. Yeni; kent-birey gerilimi.",
  },
  {
    ad: "Edip Cansever",
    donem: "Cumhuriyet Şiiri",
    tur: "Şiir",
    eserler: ["Yerçekimli Karanfil", "Umutsuzlar Parkı", "Çağrılmayan Yakup"],
    ipucu: "II. Yeni; şiirde dramatik monolog.",
  },

  // ——— Cumhuriyet Romanı ———
  {
    ad: "Sabahattin Ali",
    donem: "Cumhuriyet Romanı",
    tur: "Roman / Öykü",
    eserler: ["Kuyucaklı Yusuf", "Kürk Mantolu Madonna", "İçimizdeki Şeytan", "Değirmen"],
    ipucu: "Toplumcu gerçekçi; Kuyucaklı Yusuf'un kasaba eleştirisi.",
  },
  {
    ad: "Peyami Safa",
    donem: "Cumhuriyet Romanı",
    tur: "Roman",
    eserler: ["Dokuzuncu Hariciye Koğuşu", "Fatih-Harbiye", "Yalnızız", "Matmazel Noraliya'nın Koltuğu"],
    ipucu: "Psikolojik roman; Doğu-Batı çatışması Fatih-Harbiye.",
  },
  {
    ad: "Ahmet Hamdi Tanpınar",
    donem: "Cumhuriyet Romanı",
    tur: "Roman / Deneme",
    eserler: ["Huzur", "Saatleri Ayarlama Enstitüsü", "Beş Şehir", "Sahnenin Dışındakiler"],
    ipucu: "Zaman, estetik ve medeniyet meselesi; Beş Şehir denemeleri.",
  },
  {
    ad: "Kemal Tahir",
    donem: "Cumhuriyet Romanı",
    tur: "Roman",
    eserler: ["Devlet Ana", "Yorgun Savaşçı", "Esir Şehrin İnsanları", "Sağırdere"],
    ipucu: "Tarihî-toplumsal roman; Osmanlı'nın kuruluşu Devlet Ana.",
  },
  {
    ad: "Yaşar Kemal",
    donem: "Cumhuriyet Romanı",
    tur: "Roman",
    eserler: ["İnce Memed", "Orta Direk", "Yer Demir Gök Bakır", "Teneke"],
    ipucu: "Çukurova destanı; epik anlatım.",
  },
  {
    ad: "Orhan Kemal",
    donem: "Cumhuriyet Romanı",
    tur: "Roman / Öykü",
    eserler: ["Bereketli Topraklar Üzerinde", "Murtaza", "Cemile", "Baba Evi"],
    ipucu: "İşçi ve küçük insanın romancısı.",
  },
  {
    ad: "Fakir Baykurt",
    donem: "Cumhuriyet Romanı",
    tur: "Roman",
    eserler: ["Yılanların Öcü", "Irazca'nın Dirliği", "Tırpan", "Kaplumbağalar"],
    ipucu: "Köy gerçekliği ve öğretmen bakışı.",
  },
  {
    ad: "Tarık Buğra",
    donem: "Cumhuriyet Romanı",
    tur: "Roman",
    eserler: ["Küçük Ağa", "Osmancık", "İbiş'in Rüyası", "Dönemeçte"],
    ipucu: "Kurtuluş Savaşı'na farklı bir bakış: Küçük Ağa.",
  },
  {
    ad: "Oğuz Atay",
    donem: "Cumhuriyet Romanı",
    tur: "Roman / Öykü",
    eserler: ["Tutunamayanlar", "Tehlikeli Oyunlar", "Korkuyu Beklerken", "Bir Bilim Adamının Romanı"],
    ipucu: "Postmodern anlatının ilk örnekleri; ironi ve bilinç akışı.",
  },
  {
    ad: "Adalet Ağaoğlu",
    donem: "Cumhuriyet Romanı",
    tur: "Roman",
    eserler: ["Ölmeye Yatmak", "Bir Düğün Gecesi", "Hayır", "Fikrimin İnce Gülü"],
    ipucu: "Cumhuriyet aydınının iç dünyası; bilinç akışı tekniği.",
  },
]
