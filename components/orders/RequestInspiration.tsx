import { MapPin, Sparkles } from "lucide-react";
import styles from "./request-inspiration.module.css";

type Props = {
  isArabic: boolean;
  property: string;
  city: string;
  neighborhood: string;
  isRent: boolean;
};

export default function RequestInspiration({ isArabic, property, city, neighborhood, isRent }: Props) {
  const location = [neighborhood.trim(), city.trim()].filter(Boolean).join(isArabic ? "، " : ", ");

  return (
    <div className={styles.panel} dir={isArabic ? "rtl" : "ltr"}>
      <div className={styles.art}>
        <svg viewBox="0 0 400 390" fill="none" aria-hidden="true" focusable="false">
          <defs>
            <linearGradient id="request-sky" x1="200" y1="0" x2="200" y2="390" gradientUnits="userSpaceOnUse">
              <stop stopColor="#243f54" /><stop offset="1" stopColor="#102534" />
            </linearGradient>
            <linearGradient id="request-facade" x1="140" y1="140" x2="290" y2="330" gradientUnits="userSpaceOnUse">
              <stop stopColor="#eee2c8" /><stop offset="1" stopColor="#a8997a" />
            </linearGradient>
          </defs>
          <path fill="url(#request-sky)" d="M0 0h400v390H0z" />
          <circle className={styles.sun} cx="300" cy="82" r="33" fill="#e6bb78" />
          <circle cx="300" cy="82" r="47" stroke="#e6bb78" strokeOpacity=".15" />
          <path d="M-40 300 190 188l250 118-228 118Z" fill="#193c44" />
          <path d="m-20 344 220-108 228 108M74 390l231-112" stroke="#91a79e" strokeOpacity=".2" strokeWidth="12" />
          <g className={styles.building}>
            <path d="m115 177 104-52 91 45-105 53Z" fill="#f4e9d2" />
            <path d="M115 177v115l90 46V223Z" fill="#b5a588" />
            <path d="m205 223 105-53v115l-105 53Z" fill="url(#request-facade)" />
            <path d="m137 165 81-40 69 34-82 42Z" fill="#698377" />
            <path d="m137 165 68 34v-12l-56-28Z" fill="#91a395" />
            {[0, 1, 2].map((row) => (
              <g key={row}>
                <path d={`m222 ${232 + row * 30} 26-13v18l-26 13Z`} fill="#294752" />
                <path d={`m265 ${210 + row * 30} 26-13v18l-26 13Z`} fill={row === 1 ? "#efcd8b" : "#294752"} />
                <path d={`m131 ${203 + row * 30} 22 11v18l-22-11Z`} fill="#354f53" />
                <path d={`m167 ${221 + row * 30} 22 11v18l-22-11Z`} fill={row === 2 ? "#efcd8b" : "#354f53"} />
              </g>
            ))}
          </g>
          <g stroke="#a4b5a0" strokeWidth="3" strokeLinecap="round">
            <path d="M77 290v-48m253 70v-54" />
          </g>
          <g fill="#527d69"><ellipse cx="77" cy="238" rx="18" ry="28" /><ellipse cx="330" cy="252" rx="20" ry="31" /></g>
          <g className={styles.marker}>
            <path d="M205 67c-14 0-25 11-25 25 0 19 25 38 25 38s25-19 25-38c0-14-11-25-25-25Z" fill="#e6bb78" />
            <circle cx="205" cy="92" r="8" fill="#193442" />
          </g>
        </svg>
        <span className={styles.artCaption}>{isArabic ? "تصوّر مكانك القادم" : "Picture your next place"}</span>
      </div>
      <div className={styles.copy}>
        <span className={styles.eyebrow}><Sparkles size={15} aria-hidden="true" />{isArabic ? "مساحة لبداية جديدة" : "Room for a new beginning"}</span>
        <h2>{isArabic ? "كل مكان جميل، يبدأ بفكرة." : "Every great place starts with an idea."}</h2>
        <p>{isArabic ? "صف لنا ما تبحث عنه. من الحي المفضّل إلى التفاصيل الصغيرة التي تجعل المكان مناسبًا لك." : "Tell us what you have in mind, from your favourite neighbourhood to the little details that make a place yours."}</p>
        <div className={styles.intent}>
          <span>{isArabic ? "أبحث عن" : "Looking for"}</span>
          <strong>{property} · {isRent ? (isArabic ? "للإيجار" : "to rent") : (isArabic ? "للشراء" : "to buy")}</strong>
          <span className={styles.location}><MapPin size={15} aria-hidden="true" />{location || (isArabic ? "أين تتخيّل بدايتك؟" : "Where will your next chapter begin?")}</span>
        </div>
        <p className={styles.note}>{isArabic ? "التفاصيل تصنع الفرق. أضف ما يهمّك في طلبك." : "Details make the difference. Include what matters to you."}</p>
      </div>
    </div>
  );
}
