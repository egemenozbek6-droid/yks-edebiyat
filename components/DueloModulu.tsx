"use client"

import { useEffect, useRef, useState } from "react"
import { Check, Hop as Home, KeyRound, RotateCcw, Search, Swords, Timer, Trophy, X, Zap } from "lucide-react"
import { sorulariUret, type Soru } from "@/lib/soru"
import { gecerliYazarlar } from "@/src/data"

type Adim = "nick" | "lobi" | "aratma" | "oda" | "duelo" | "sonuc"

const NICK_ANAHTAR = "edebikart-nick"
const SORU_SAYISI = 5
const SURE = 10
const ZAMAN_ASIMI = "__zaman_asimi__"

const botAdlari = ["Edebiyatçı42", "RakipOkuyucu", "SınavKusu", "KartUstası", "EzberBozan", "NoktaAtısı"]

function rastgeleBotAdi() {
  return botAdlari[Math.floor(Math.random() * botAdlari.length)]
}

function rastgeleOdaKodu() {
  return Math.random().toString(36).slice(2, 7).toUpperCase()
}

type Props = {
  onCikis: () => void
}

export default function DueloModulu({ onCikis }: Props) {
  const [adim, setAdim] = useState<Adim>("nick")
  const [nick, setNick] = useState("")
  const [nickInput, setNickInput] = useState("")
  const [odaInput, setOdaInput] = useState("")
  const [olusturulanKod, setOlusturulanKod] = useState("")
  const [botAd, setBotAd] = useState("")

  const [sorular, setSorular] = useState<Soru[]>([])
  const [soruIndex, setSoruIndex] = useState(0)
  const [sure, setSure] = useState(SURE)
  const [secim, setSecim] = useState<string | null>(null)
  const [botCevapladi, setBotCevapladi] = useState(false)
  const [oyuncuSkor, setOyuncuSkor] = useState(0)
  const [botSkor, setBotSkor] = useState(0)

  const aramaTimer = useRef<number | null>(null)
  const odaTimer = useRef<number | null>(null)

  useEffect(() => {
    try {
      const kayitli = window.localStorage.getItem(NICK_ANAHTAR)
      if (kayitli && kayitli.trim()) {
        setNick(kayitli)
        setAdim("lobi")
      }
    } catch {}
    return () => {
      if (aramaTimer.current) clearTimeout(aramaTimer.current)
      if (odaTimer.current) clearTimeout(odaTimer.current)
    }
  }, [])

  const nickKaydet = () => {
    const temiz = nickInput.trim()
    if (!temiz) return
    setNick(temiz)
    try {
      window.localStorage.setItem(NICK_ANAHTAR, temiz)
    } catch {}
    setAdim("lobi")
  }

  const dueloBaslat = () => {
    const havuz = gecerliYazarlar()
    setSorular(sorulariUret(havuz).slice(0, SORU_SAYISI))
    setSoruIndex(0)
    setSure(SURE)
    setSecim(null)
    setBotCevapladi(false)
    setOyuncuSkor(0)
    setBotSkor(0)
    setBotAd(rastgeleBotAdi())
    setAdim("duelo")
  }

  const rastgeleRakip = () => {
    setAdim("aratma")
    aramaTimer.current = window.setTimeout(dueloBaslat, 2500)
  }

  const aramaIptal = () => {
    if (aramaTimer.current) {
      clearTimeout(aramaTimer.current)
      aramaTimer.current = null
    }
    setAdim("lobi")
  }

  const odaKur = () => {
    const kod = rastgeleOdaKodu()
    setOlusturulanKod(kod)
    odaTimer.current = window.setTimeout(dueloBaslat, 2500)
  }

  const odaIptal = () => {
    if (odaTimer.current) {
      clearTimeout(odaTimer.current)
      odaTimer.current = null
    }
    setOlusturulanKod("")
  }

  const odayaKatil = () => {
    if (!odaInput.trim()) return
    dueloBaslat()
  }

  const cevapla = (secenek: string) => {
    if (secim !== null) return
    setSecim(secenek)
    const soru = sorular[soruIndex]
    if (secenek === soru.dogru) {
      const bonus = Math.round((sure / SURE) * 50)
      setOyuncuSkor((s) => s + 100 + bonus)
    }
  }

  useEffect(() => {
    if (adim !== "duelo" || secim !== null) return
    if (sure <= 0) {
      setSecim(ZAMAN_ASIMI)
      return
    }
    const t = setTimeout(() => setSure((s) => s - 1), 1000)
    return () => clearTimeout(t)
  }, [sure, secim, adim])

  useEffect(() => {
    if (adim !== "duelo" || botCevapladi) return
    const gecikme = 2000 + Math.random() * 6000
    const t = setTimeout(() => {
      setBotCevapladi(true)
      if (Math.random() < 0.7) {
        const bonus = Math.round(Math.random() * 50)
        setBotSkor((s) => s + 100 + bonus)
      }
    }, gecikme)
    return () => clearTimeout(t)
  }, [soruIndex, adim, botCevapladi])

  useEffect(() => {
    if (adim !== "duelo" || secim === null) return
    const t = setTimeout(() => {
      if (soruIndex + 1 >= SORU_SAYISI) {
        setAdim("sonuc")
      } else {
        setSoruIndex((i) => i + 1)
        setSecim(null)
        setBotCevapladi(false)
        setSure(SURE)
      }
    }, 2500)
    return () => clearTimeout(t)
  }, [secim, adim, soruIndex])

  // === NICK ===
  if (adim === "nick") {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="animate-rise rounded-[1.75rem] bg-card p-7 shadow-[0_12px_40px_-12px_rgba(0,0,0,0.12)] max-w-sm w-full">
          <div className="mx-auto mb-5 grid h-16 w-16 place-items-center rounded-3xl bg-rose-500/15 text-rose-500 animate-pop">
            <Swords className="h-7 w-7" strokeWidth={1.5} />
          </div>
          <h2 className="font-serif text-xl font-bold tracking-tight text-center text-card-foreground">Düello Modu</h2>
          <p className="mt-2 text-sm text-center text-pretty text-muted-foreground">
            Rakibinle yarışmak için bir takma ad seç. Bu ad sonraki girişlerde hatırlanacak.
          </p>
          <input
            type="text"
            value={nickInput}
            onChange={(e) => setNickInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && nickKaydet()}
            placeholder="Takma adın..."
            maxLength={20}
            className="mt-5 w-full rounded-2xl bg-muted px-4 py-3 text-sm font-medium text-foreground placeholder:text-muted-foreground/60 outline-none focus:ring-2 focus:ring-primary/40 transition"
          />
          <button
            onClick={nickKaydet}
            disabled={!nickInput.trim()}
            className="mt-4 w-full rounded-2xl bg-primary py-3.5 text-sm font-semibold text-primary-foreground shadow-md transition hover:brightness-110 active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Devam Et
          </button>
        </div>
      </div>
    )
  }

  // === LOBI ===
  if (adim === "lobi") {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="animate-rise w-full max-w-sm">
          <div className="mb-5 rounded-[1.75rem] bg-card p-6 text-center shadow-[0_4px_24px_-8px_rgba(0,0,0,0.06)]">
            <div className="mx-auto mb-3 grid h-14 w-14 place-items-center rounded-2xl bg-rose-500/15 text-rose-500">
              <Swords className="h-6 w-6" strokeWidth={1.5} />
            </div>
            <h2 className="font-serif text-lg font-bold text-card-foreground">Hoş geldin, {nick}!</h2>
            <p className="mt-1.5 text-sm text-pretty text-muted-foreground">
              Bir rakip bul ve 5 soruda yarışmaya başla.
            </p>
          </div>

          <button
            onClick={rastgeleRakip}
            className="flex w-full items-center gap-4 rounded-2xl bg-card p-5 text-left shadow-sm transition hover:shadow-md active:scale-[0.99] mb-3"
          >
            <div className="grid h-12 w-12 place-items-center rounded-2xl bg-primary/10 text-primary shrink-0">
              <Search className="h-5 w-5" strokeWidth={2} />
            </div>
            <div>
              <p className="text-sm font-bold text-card-foreground">Rastgele Rakip Bul</p>
              <p className="text-xs text-muted-foreground">Sistem sana uygun bir rakip eşleştirir</p>
            </div>
          </button>

          <button
            onClick={() => setAdim("oda")}
            className="flex w-full items-center gap-4 rounded-2xl bg-card p-5 text-left shadow-sm transition hover:shadow-md active:scale-[0.99]"
          >
            <div className="grid h-12 w-12 place-items-center rounded-2xl bg-primary/10 text-primary shrink-0">
              <KeyRound className="h-5 w-5" strokeWidth={2} />
            </div>
            <div>
              <p className="text-sm font-bold text-card-foreground">Özel Oda Kur / Koda Katıl</p>
              <p className="text-xs text-muted-foreground">Arkadaşınla aynı oda kodunu paylaş</p>
            </div>
          </button>
        </div>
      </div>
    )
  }

  // === ARAMA ===
  if (adim === "aratma") {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="animate-rise text-center">
          <div className="mx-auto mb-5 grid h-20 w-20 place-items-center rounded-3xl bg-rose-500/15 text-rose-500">
            <div className="h-9 w-9 animate-spin rounded-full border-[3px] border-rose-500/20 border-t-rose-500" />
          </div>
          <h2 className="font-serif text-lg font-bold text-card-foreground">Rakip aranıyor...</h2>
          <p className="mt-2 text-sm text-muted-foreground">Eşleşme sağlanana kadar lütfen bekle.</p>
          <button
            onClick={aramaIptal}
            className="mt-6 rounded-2xl bg-card px-6 py-3 text-sm font-semibold text-muted-foreground shadow-sm transition hover:text-foreground active:scale-[0.98]"
          >
            İptal Et
          </button>
        </div>
      </div>
    )
  }

  // === ODA ===
  if (adim === "oda") {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="animate-rise rounded-[1.75rem] bg-card p-7 shadow-[0_12px_40px_-12px_rgba(0,0,0,0.12)] max-w-sm w-full">
          <div className="mx-auto mb-5 grid h-14 w-14 place-items-center rounded-2xl bg-primary/10 text-primary">
            <KeyRound className="h-6 w-6" strokeWidth={1.5} />
          </div>
          <h2 className="font-serif text-lg font-bold text-center text-card-foreground">Özel Oda</h2>

          {olusturulanKod ? (
            <div className="mt-5 text-center">
              <p className="text-xs text-muted-foreground mb-2">Oda kodun</p>
              <div className="rounded-2xl bg-muted py-4 text-2xl font-bold tracking-[0.3em] text-foreground">
                {olusturulanKod}
              </div>
              <p className="mt-3 text-sm text-muted-foreground">Rakip bekleniyor...</p>
              <div className="mt-4 flex justify-center">
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-muted border-t-primary" />
              </div>
              <button
                onClick={odaIptal}
                className="mt-5 text-xs font-semibold text-muted-foreground transition hover:text-foreground"
              >
                Geri Dön
              </button>
            </div>
          ) : (
            <>
              <p className="mt-2 text-sm text-center text-pretty text-muted-foreground">
                Bir oda kur ve kodunu arkadaşınla paylaş, ya da elindeki koda katıl.
              </p>
              <input
                type="text"
                value={odaInput}
                onChange={(e) => setOdaInput(e.target.value.toUpperCase())}
                onKeyDown={(e) => e.key === "Enter" && odayaKatil()}
                placeholder="Oda kodu..."
                maxLength={6}
                className="mt-5 w-full rounded-2xl bg-muted px-4 py-3 text-sm font-bold tracking-widest text-center text-foreground placeholder:text-muted-foreground/60 placeholder:tracking-normal placeholder:font-normal outline-none focus:ring-2 focus:ring-primary/40 transition"
              />
              <div className="mt-4 grid grid-cols-2 gap-3">
                <button
                  onClick={odayaKatil}
                  disabled={!odaInput.trim()}
                  className="rounded-2xl bg-primary py-3 text-sm font-semibold text-primary-foreground shadow-md transition hover:brightness-110 active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  Koda Katıl
                </button>
                <button
                  onClick={odaKur}
                  className="rounded-2xl bg-card py-3 text-sm font-semibold text-foreground shadow-sm transition hover:shadow-md active:scale-[0.98]"
                >
                  Oda Kur
                </button>
              </div>
              <button
                onClick={() => setAdim("lobi")}
                className="mt-4 w-full text-xs font-semibold text-muted-foreground transition hover:text-foreground"
              >
                Geri Dön
              </button>
            </>
          )}
        </div>
      </div>
    )
  }

  // === SONUC ===
  if (adim === "sonuc") {
    const kazandi = oyuncuSkor > botSkor
    const berabere = oyuncuSkor === botSkor
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="animate-rise rounded-[1.75rem] bg-card p-8 text-center shadow-[0_12px_40px_-12px_rgba(0,0,0,0.12)] max-w-sm w-full">
          <div
            className={`mx-auto mb-5 grid h-20 w-20 place-items-center rounded-3xl animate-pop ${
              kazandi
                ? "bg-emerald-500/15 text-emerald-500"
                : berabere
                  ? "bg-primary/10 text-primary"
                  : "bg-destructive/15 text-destructive"
            }`}
          >
            {kazandi ? (
              <Trophy className="h-9 w-9" strokeWidth={1.5} />
            ) : berabere ? (
              <Swords className="h-9 w-9" strokeWidth={1.5} />
            ) : (
              <X className="h-9 w-9" strokeWidth={1.5} />
            )}
          </div>
          <h2 className="font-serif text-2xl font-bold tracking-tight text-card-foreground">
            {kazandi ? "Kazandın!" : berabere ? "Berabere!" : "Kaybettin!"}
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">
            {kazandi
              ? "Tebrikler, rakibini alt ettin!"
              : berabere
                ? "İki taraf da eşit skorla bitirdi."
                : "Bu sefer rakibin daha hızlıydı. Tekrar dene!"}
          </p>

          <div className="mt-6 grid grid-cols-2 gap-3">
            <div className="rounded-2xl bg-primary/10 p-4">
              <p className="truncate text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">{nick}</p>
              <p className="mt-1 text-2xl font-bold text-primary">{oyuncuSkor}</p>
            </div>
            <div className="rounded-2xl bg-muted p-4">
              <p className="truncate text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">{botAd}</p>
              <p className="mt-1 text-2xl font-bold text-foreground">{botSkor}</p>
            </div>
          </div>

          <div className="mt-6 grid grid-cols-2 gap-3">
            <button
              onClick={dueloBaslat}
              className="flex items-center justify-center gap-2 rounded-2xl bg-primary py-3.5 text-sm font-semibold text-primary-foreground shadow-md transition hover:brightness-110 active:scale-[0.98]"
            >
              <RotateCcw className="h-4 w-4" /> Rövanş
            </button>
            <button
              onClick={onCikis}
              className="flex items-center justify-center gap-2 rounded-2xl bg-card py-3.5 text-sm font-semibold text-muted-foreground shadow-sm transition hover:text-foreground active:scale-[0.98]"
            >
              <Home className="h-4 w-4" /> Ana Sayfa
            </button>
          </div>
        </div>
      </div>
    )
  }

  // === DUELO ===
  const soru = sorular[soruIndex]
  if (!soru) return null

  const sureYuzde = (sure / SURE) * 100
  const sureRenk = sure > 5 ? "bg-primary" : sure > 3 ? "bg-amber-500" : "bg-destructive"
  const sureMetinRenk = sure > 5 ? "text-primary" : sure > 3 ? "text-amber-500" : "text-destructive"

  return (
    <div className="flex flex-col flex-1 min-h-0 animate-rise">
      {/* Skor barı */}
      <div className="mb-3 rounded-2xl bg-card/70 p-3 shadow-sm backdrop-blur shrink-0">
        <div className="flex items-center justify-between gap-2">
          <div className="flex-1 text-center">
            <p className="truncate text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">{nick}</p>
            <p className="text-lg font-bold text-primary">{oyuncuSkor}</p>
          </div>
          <div className="px-2 text-xs font-bold text-muted-foreground">VS</div>
          <div className="flex-1 text-center">
            <p className="truncate text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">{botAd}</p>
            <p className="text-lg font-bold text-foreground">{botSkor}</p>
            {botCevapladi && <span className="ml-1 inline-block h-2 w-2 rounded-full bg-emerald-500" />}
          </div>
        </div>
      </div>

      {/* Süre + soru sayacı */}
      <div className="mb-3 shrink-0">
        <div className="mb-1.5 flex items-center justify-between">
          <span className="text-[11px] font-semibold text-muted-foreground">
            Soru {soruIndex + 1} / {SORU_SAYISI}
          </span>
          <span className={`inline-flex items-center gap-1 text-[11px] font-bold ${sureMetinRenk}`}>
            <Timer className="h-3 w-3" />
            {sure}s
          </span>
        </div>
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
          <div
            className={`h-full rounded-full transition-all duration-1000 ease-linear ${sureRenk}`}
            style={{ width: `${sureYuzde}%` }}
          />
        </div>
      </div>

      {/* Soru kartı */}
      <div className="flex min-h-0 flex-1 flex-col rounded-[1.75rem] bg-card p-5 shadow-[0_12px_40px_-12px_rgba(0,0,0,0.1)]">
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
          {soru.tip === "eser" ? "Yazarın eseri" : "Eserin yazarı"}
        </p>
        <h2 className="mt-1.5 font-serif text-xl font-bold leading-snug text-balance text-card-foreground">
          {soru.vurgu}
        </h2>
        <p className="mt-1.5 text-sm text-pretty text-muted-foreground">{soru.metin}</p>

        <div className="mt-4 min-h-0 flex-1 space-y-2">
          {soru.secenekler.map((secenek, i) => {
            const secildi = secim === secenek
            const dogruSecenek = secenek === soru.dogru
            const gosterDogru = secim !== null && dogruSecenek
            const gosterYanlis = secildi && !dogruSecenek

            let stil = "bg-card hover:bg-muted/60 text-card-foreground"
            if (gosterDogru) stil = "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300"
            else if (gosterYanlis) stil = "bg-destructive/15 text-destructive"
            else if (secim !== null) stil = "bg-card text-muted-foreground opacity-60"

            return (
              <button
                key={secenek}
                onClick={() => cevapla(secenek)}
                disabled={secim !== null}
                className={`flex w-full items-center gap-3 rounded-2xl px-4 py-3.5 text-left text-sm font-semibold transition-all duration-200 ${stil} ${
                  gosterYanlis ? "animate-shake" : ""
                } ${gosterDogru ? "animate-pop" : ""} ${secim === null ? "active:scale-[0.99]" : ""}`}
              >
                <span
                  className={`grid h-7 w-7 shrink-0 place-items-center rounded-lg text-xs font-bold ${
                    gosterDogru
                      ? "bg-emerald-500 text-white"
                      : gosterYanlis
                        ? "bg-destructive text-white"
                        : "bg-muted text-muted-foreground"
                  }`}
                >
                  {gosterDogru ? (
                    <Check className="h-4 w-4" strokeWidth={3} />
                  ) : gosterYanlis ? (
                    <X className="h-4 w-4" strokeWidth={3} />
                  ) : (
                    String.fromCharCode(65 + i)
                  )}
                </span>
                <span className="text-pretty">{secenek}</span>
              </button>
            )
          })}
        </div>

        {secim !== null && (
          <div className="mt-3 flex shrink-0 items-center justify-center gap-2 text-xs font-semibold">
            {secim === ZAMAN_ASIMI ? (
              <span className="text-destructive">Süre doldu!</span>
            ) : secim === soru.dogru ? (
              <>
                <Zap className="h-3.5 w-3.5 text-emerald-500" />
                <span className="text-emerald-600 dark:text-emerald-400">Doğru! Hız bonusu eklendi.</span>
              </>
            ) : (
              <span className="text-destructive">Yanlış cevap.</span>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
