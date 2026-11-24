"use client";

import Image from "next/image";
import { useLanguage } from "@/context/LanguageContext";

export default function VerificationQr() {
  const { language } = useLanguage();
  const label =
    language === "ar"
      ? "عرض التوثيق الرسمي للوساطة الرقمية"
      : "View official Digital Brokerage verification";
  return (
    <a
      href="https://eauthenticate.saudibusiness.gov.sa/EAuthSealApi/seal?token=YWU3Qm5vS3hTSkNlZGljRFgwY0VFdz09&lang=ar"
      target="_blank"
      rel="noopener noreferrer"
      aria-label={label}
      className="inline-flex w-fit rounded-md bg-white p-2 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white"
    >
      <Image
        src="/sbc-verification-qr.png"
        width={112}
        height={112}
        alt={label}
        unoptimized
      />
    </a>
  );
}
