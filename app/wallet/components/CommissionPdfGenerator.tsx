import React, { useRef, useState } from 'react';
import { Commission } from './types';
import { useLanguage } from '@/context/LanguageContext';
import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';
import { toJpeg } from 'html-to-image';
import jsPDF from 'jspdf';
import { WATERMARK_BASE64, COVER_BASE64 } from './pdfAssets';

interface CommissionPdfGeneratorProps {
    commission: Commission;
}

/* ─── Helpers ─── */
const Lbl = ({ children }: { children: React.ReactNode }) => (
    <span style={{ fontSize: '8px', color: '#475569', display: 'block', marginBottom: '2px', fontWeight: 600 }}>
        {children}
    </span>
);
const Val = ({ children, mono }: { children?: React.ReactNode; mono?: boolean }) => (
    <span style={{ fontSize: '11.5px', fontWeight: 800, color: '#0f172a', fontFamily: mono ? 'monospace' : 'inherit', display: 'block', lineHeight: 1.3 }}>
        {children || '—'}
    </span>
);
const Cell = ({ label, value, mono }: { label: string; value?: string | number; mono?: boolean }) => (
    <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '7px', padding: '7px 9px' }}>
        <Lbl>{label}</Lbl>
        <Val mono={mono}>{value}</Val>
    </div>
);
const SecHead = ({ children }: { children: React.ReactNode }) => (
    <div style={{ display: 'flex', alignItems: 'center', gap: '7px', marginBottom: '8px' }}>
        <div style={{ width: '3px', height: '13px', background: '#0f172a', borderRadius: '3px', flexShrink: 0 }} />
        <span style={{ fontSize: '12px', fontWeight: 900, color: '#0f172a' }}>{children}</span>
        <div style={{ flex: 1, height: '1px', background: '#e2e8f0' }} />
    </div>
);
const Crd = ({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) => (
    <div style={{ background: 'rgba(255,255,255,0.95)', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '11px 13px', ...style }}>
        {children}
    </div>
);

/* ─── Main ─── */
const CommissionPdfGenerator: React.FC<CommissionPdfGeneratorProps> = ({ commission }) => {
    const { t } = useLanguage();
    const pdfRef = useRef<HTMLDivElement>(null);
    const [isGenerating, setIsGenerating] = useState(false);

    const fmt = (v?: number | string) =>
        Number(v || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    const fmtDate = (v?: string) =>
        v ? new Date(v).toLocaleDateString('ar-SA', { year: 'numeric', month: 'long', day: 'numeric' }) : '—';

    const handleDownload = async () => {
        if (!pdfRef.current) return;
        setIsGenerating(true);
        try {
            pdfRef.current.style.display = 'block';
            await new Promise(r => setTimeout(r, 200));
            const pdf = new jsPDF('p', 'mm', 'a4');
            const W = pdf.internal.pageSize.getWidth();
            const H = pdf.internal.pageSize.getHeight();
            const pages = pdfRef.current.querySelectorAll('.pdf-page');
            for (let i = 0; i < pages.length; i++) {
                if (i > 0) pdf.addPage();
                const img = await toJpeg(pages[i] as HTMLElement, {
                    quality: 0.98,
                    pixelRatio: 2,
                    backgroundColor: '#ffffff',
                    skipAutoScale: true,
                    width: (pages[i] as HTMLElement).offsetWidth,
                    height: (pages[i] as HTMLElement).offsetHeight,
                });
                pdf.addImage(img, 'JPEG', 0, 0, W, H);
            }
            pdf.save(`commission_${commission.commissionNumber}.pdf`);
        } catch (e) {
            console.error('PDF error', e);
        } finally {
            if (pdfRef.current) pdfRef.current.style.display = 'none';
            setIsGenerating(false);
        }
    };

    return (
        <>
            <Button
                variant="outline"
                size="sm"
                onClick={handleDownload}
                disabled={isGenerating}
                className="text-slate-800 border-blue-200 hover:bg-blue-50 hover:text-blue-800 transition-all flex items-center gap-1.5 rounded-lg font-bold shrink-0"
            >
                <Download className="w-4 h-4 shrink-0" />
                <span className="hidden sm:inline">
                    {isGenerating ? (t('common.loading') || 'جاري…') : (t('common.download') || 'تنزيل')}
                </span>
            </Button>

            {/* ═══ Hidden PDF canvas ═══ */}
            <div
                ref={pdfRef}
                style={{
                    display: 'none',
                    position: 'absolute',
                    top: '-9999px',
                    left: '-9999px',
                    width: '794px',   /* A4 at 96dpi */
                    direction: 'rtl',
                }}
            >

                {/* ══ PAGE 1 – Content ══ */}
                <div
                    className="pdf-page"
                    style={{
                        width: '794px',
                        height: '1123px',
                        position: 'relative',
                        overflow: 'hidden',
                        backgroundColor: '#f1f5f9',
                    }}
                >
                    {/* 1. Cover background */}
                    <div style={{
                        position: 'absolute', inset: 0, zIndex: 0,
                        backgroundImage: `url(${COVER_BASE64})`,
                        backgroundSize: 'cover',
                        backgroundPosition: 'center',
                    }} />

                    {/* 2. White dimming overlay – reduces cover brightness */}
                    <div style={{
                        position: 'absolute', inset: 0, zIndex: 1,
                        background: 'rgba(241,245,249,0.72)',
                    }} />

                    {/* 3. Watermark (very faint) */}
                    <div style={{
                        position: 'absolute', inset: 0, zIndex: 2,
                        backgroundImage: `url(${WATERMARK_BASE64})`,
                        backgroundSize: '600px',
                        backgroundPosition: 'center',
                        backgroundRepeat: 'repeat',
                        opacity: 0.025,
                    }} />

                    {/* ── BLOCK A: Full-width styled header band ── */}
                    <div style={{
                        position: 'absolute',
                        top: '172px',
                        left: 0,
                        right: 0,
                        zIndex: 3,
                        background: 'linear-gradient(90deg, #0f172a 0%, #1e3a5f 60%, #0f172a 100%)',
                        padding: '16px 50px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                    }}>
                        {/* FIRST in DOM → physical RIGHT in RTL: Ref number */}
                        <div style={{ textAlign: 'right' }}>
                            <div style={{ fontSize: '9px', color: '#94a3b8', fontWeight: 600, marginBottom: '3px' }}>الرقم المرجعي</div>
                            <div style={{ fontSize: '14px', fontWeight: 900, color: '#ffffff', fontFamily: 'monospace', letterSpacing: '0.5px' }}>
                                {commission.commissionNumber}
                            </div>
                            <div style={{ fontSize: '9px', color: '#64748b', marginTop: '3px' }}>{fmtDate(commission.createdAt)}</div>
                        </div>
                        {/* SECOND in DOM → physical LEFT in RTL: Title + verified (aligns with logo above) */}
                        <div>
                            <h1 style={{ fontSize: '22px', fontWeight: 900, color: '#ffffff', margin: '0 0 4px', lineHeight: 1.1, letterSpacing: '-0.3px' }}>
                                وثيقة إثبات سعي
                            </h1>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                                <div style={{ width: '7px', height: '7px', borderRadius: '50%', background: '#10b981' }} />
                                <span style={{ fontSize: '10px', color: '#10b981', fontWeight: 700 }}>موثق إلكترونياً</span>
                                <span style={{ fontSize: '10px', color: '#94a3b8', marginRight: '6px' }}>الوساطة الرقمية العقارية</span>
                            </div>
                        </div>
                    </div>

                    {/* ── BLOCK B: Sections – start below the header band ── */}
                    <div style={{
                        position: 'absolute',
                        top: '280px',
                        left: '50px',
                        right: '50px',
                        bottom: '36px',
                        zIndex: 3,
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '14px',
                    }}>

                        {/* ── Parties ── */}
                        <Crd>
                            <SecHead>بيانات الأطراف المعنية</SecHead>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                                {/* Owner */}
                                <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '9px', padding: '10px 12px' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '7px', marginBottom: '8px' }}>
                                        <span style={{ width: '22px', height: '22px', borderRadius: '6px', background: '#dbeafe', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: 800, color: '#1d4ed8', flexShrink: 0 }}>١</span>
                                        <span style={{ fontSize: '12px', fontWeight: 900, color: '#1e293b' }}>المالك / البائع</span>
                                    </div>
                                    <div style={{ marginBottom: '5px' }}><Lbl>الاسم الكامل</Lbl><Val>{commission.owner?.name}</Val></div>
                                    <div><Lbl>رقم الهوية</Lbl><Val mono>{commission.owner?.idNumber}</Val></div>
                                </div>
                                {/* Buyer */}
                                <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '9px', padding: '10px 12px' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '7px', marginBottom: '8px' }}>
                                        <span style={{ width: '22px', height: '22px', borderRadius: '6px', background: '#e0f2fe', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: 800, color: '#0369a1', flexShrink: 0 }}>٢</span>
                                        <span style={{ fontSize: '12px', fontWeight: 900, color: '#1e293b' }}>المشتري</span>
                                    </div>
                                    <div style={{ marginBottom: '5px' }}><Lbl>الاسم الكامل</Lbl><Val>{commission.buyer?.name}</Val></div>
                                    <div><Lbl>رقم الهوية</Lbl><Val mono>{commission.buyer?.idNumber}</Val></div>
                                </div>
                            </div>
                        </Crd>

                        {/* ── Property ── */}
                        <Crd>
                            <SecHead>تفاصيل العقار المبرم عليه العقد</SecHead>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '7px' }}>
                                <Cell label="نوع العقار" value={commission.propertyType} />
                                <Cell label="المدينة" value={commission.city} />
                                <Cell label="الحي" value={commission.neighborhood} />
                                <Cell label="المساحة" value={commission.area ? `${commission.area} م²` : undefined} />
                                <Cell label="رقم الصك" value={commission.deedNumber} mono />
                                <Cell label="المواصفات" value={commission.specifications} />
                            </div>
                        </Crd>

                        {/* ── Financial ── */}
                        <div style={{
                            background: 'linear-gradient(135deg, #0f172a 0%, #1e3a5f 100%)',
                            borderRadius: '14px',
                            padding: '16px 18px',
                            color: '#fff',
                            boxShadow: '0 6px 20px rgba(15,23,42,0.18)',
                        }}>
                            <SecHead>
                                <span style={{ color: '#f1f5f9' }}>التفاصيل المالية لعملية الوساطة</span>
                            </SecHead>
                            {/* Stats */}
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px', marginBottom: '12px' }}>
                                <div style={{ background: 'rgba(255,255,255,0.07)', borderRadius: '9px', padding: '9px 11px' }}>
                                    <span style={{ fontSize: '8px', color: '#94a3b8', display: 'block', marginBottom: '3px' }}>المبلغ الإجمالي</span>
                                    <span style={{ fontSize: '15px', fontWeight: 800 }}>{fmt(commission.totalAmount)}</span>
                                    <span style={{ fontSize: '9px', color: '#94a3b8', marginRight: '3px' }}> ر.س</span>
                                </div>
                                <div style={{ background: 'rgba(255,255,255,0.07)', borderRadius: '9px', padding: '9px 11px' }}>
                                    <span style={{ fontSize: '8px', color: '#94a3b8', display: 'block', marginBottom: '3px' }}>النسبة المتفق عليها</span>
                                    <span style={{ fontSize: '15px', fontWeight: 800, color: '#38bdf8' }}>{commission.commissionPercentage || 0}%</span>
                                </div>
                                <div style={{ background: 'rgba(255,255,255,0.07)', borderRadius: '9px', padding: '9px 11px' }}>
                                    <span style={{ fontSize: '8px', color: '#94a3b8', display: 'block', marginBottom: '3px' }}>نوع العملية</span>
                                    <span style={{ fontSize: '14px', fontWeight: 800 }}>
                                        {commission.type === 'sale' ? 'بيع' : commission.type === 'rent' ? 'تأجير' : commission.type || '—'}
                                    </span>
                                </div>
                            </div>
                            {/* Big commission box */}
                            <div style={{
                                background: 'rgba(255,255,255,0.1)',
                                border: '1px solid rgba(255,255,255,0.2)',
                                borderRadius: '11px',
                                padding: '13px 16px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                            }}>
                                <div>
                                    <span style={{ fontSize: '11px', fontWeight: 800, color: '#e2e8f0', display: 'block', marginBottom: '3px' }}>قيمة السعي المستحقة</span>
                                    <span style={{ fontSize: '9px', color: '#94a3b8' }}>شاملة ضريبة القيمة المضافة (١٥٪)</span>
                                </div>
                                <div style={{ textAlign: 'left' }}>
                                    <span style={{ fontSize: '28px', fontWeight: 900, color: '#ffffff', letterSpacing: '-0.5px' }}>
                                        {fmt(commission.commissionAmount)}
                                    </span>
                                    <span style={{ fontSize: '12px', color: '#94a3b8', marginRight: '6px' }}>ر.س</span>
                                </div>
                            </div>
                        </div>

                        {/* ── Signatures ── */}
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                            {['إقرار وتوقيع المالك / البائع', 'إقرار وتوقيع المشتري'].map(lbl => (
                                <div key={lbl} style={{
                                    background: 'rgba(255,255,255,0.8)',
                                    border: '1.5px dashed #cbd5e1',
                                    borderRadius: '10px',
                                    padding: '10px 14px',
                                    minHeight: '55px',
                                    position: 'relative',
                                }}>
                                    <span style={{ fontSize: '9px', color: '#64748b', fontWeight: 700 }}>{lbl}</span>
                                    <div style={{ position: 'absolute', bottom: '14px', left: '18px', right: '18px', height: '1px', background: '#cbd5e1' }} />
                                </div>
                            ))}
                        </div>

                        {/* ── Footer ── */}
                        <div style={{
                            marginTop: 'auto',
                            paddingTop: '12px',
                            borderTop: '1px solid rgba(15,23,42,0.1)',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                        }}>
                            <p style={{ fontSize: '8px', color: '#64748b', margin: 0, fontWeight: 600 }}>
                                هذه الوثيقة صادرة من منصة الوساطة الرقمية العقارية وموثقة إلكترونياً.
                            </p>
                            <p style={{ fontSize: '9px', color: '#0f172a', margin: 0, fontWeight: 800, fontFamily: 'monospace' }}>
                                digitalbrokerage.sa
                            </p>
                        </div>
                    </div>
                </div>

                {/* ══ PAGE 2 – Thank You ══ */}
                <div
                    className="pdf-page"
                    style={{ width: '794px', height: '1123px', position: 'relative', overflow: 'hidden', backgroundColor: '#0a0f1d' }}
                >
                    <img src="/ends.jpeg" alt="Thank You" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
                </div>

            </div>
        </>
    );
};

export default CommissionPdfGenerator;
