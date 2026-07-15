import React, { useRef, useState } from 'react';
import { Commission } from './types';
import { useLanguage } from '@/context/LanguageContext';
import { Button } from '@/components/ui/button';
import { Download, QrCode, BadgeCheck } from 'lucide-react';
import { toJpeg } from 'html-to-image';
import jsPDF from 'jspdf';
import { WATERMARK_BASE64, COVER_BASE64 } from './pdfAssets';

interface CommissionPdfGeneratorProps {
    commission: Commission;
}

/* ─────────── Tiny helper components ─────────── */

const Label = ({ children }: { children: React.ReactNode }) => (
    <span style={{ fontSize: '8.5px', color: '#64748b', display: 'block', marginBottom: '3px', fontWeight: 600, letterSpacing: '0.2px' }}>
        {children}
    </span>
);

const Value = ({ children, mono }: { children?: React.ReactNode; mono?: boolean }) => (
    <span style={{ fontSize: '12px', fontWeight: 800, color: '#0f172a', fontFamily: mono ? 'monospace' : 'inherit', display: 'block', lineHeight: 1.4 }}>
        {children || '—'}
    </span>
);

const Cell = ({ label, value, mono, span }: { label: string; value?: string | number; mono?: boolean; span?: boolean }) => (
    <div style={{
        background: '#ffffff',
        border: '1px solid rgba(226,232,240,0.8)',
        borderRadius: '8px',
        padding: '8px 10px',
        gridColumn: span ? 'span 2' : undefined,
        boxShadow: '0 1px 2px rgba(15,23,42,0.02)',
    }}>
        <Label>{label}</Label>
        <Value mono={mono}>{value}</Value>
    </div>
);

const SectionHeading = ({ children, icon }: { children: React.ReactNode; icon?: React.ReactNode }) => (
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
        <div style={{ width: '4px', height: '16px', background: 'linear-gradient(180deg, #0ea5e9, #2563eb)', borderRadius: '4px', flexShrink: 0 }} />
        {icon && <span style={{ color: '#0ea5e9' }}>{icon}</span>}
        <span style={{ fontSize: '13px', fontWeight: 900, color: '#0f172a', letterSpacing: '0.3px' }}>{children}</span>
        <div style={{ flex: 1, height: '1px', background: 'linear-gradient(to left, rgba(226,232,240,0), rgba(226,232,240,1))' }} />
    </div>
);

const Card = ({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) => (
    <div style={{
        background: 'rgba(255,255,255,0.92)',
        border: '1px solid rgba(203,213,225,0.6)',
        borderRadius: '14px',
        padding: '14px 16px',
        backdropFilter: 'blur(10px)',
        boxShadow: '0 4px 12px rgba(15,23,42,0.03)',
        ...style,
    }}>
        {children}
    </div>
);

/* ─────────── Main component ─────────── */

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
            const pdf = new jsPDF('p', 'mm', 'a4');
            const W = pdf.internal.pageSize.getWidth();
            const H = pdf.internal.pageSize.getHeight();
            const pages = pdfRef.current.querySelectorAll('.pdf-page');
            for (let i = 0; i < pages.length; i++) {
                if (i > 0) pdf.addPage();
                const img = await toJpeg(pages[i] as HTMLElement, { quality: 0.98, pixelRatio: 2, backgroundColor: '#ffffff' });
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
            {/* ── Download button ── */}
            <Button
                variant="outline" size="sm"
                onClick={handleDownload} disabled={isGenerating}
                className="text-slate-800 border-blue-200 hover:bg-blue-50 hover:text-blue-800 transition-all flex items-center gap-2 rounded-lg font-bold"
            >
                <Download className="w-4 h-4" />
                {isGenerating ? (t('common.loading') || 'جاري التنزيل…') : (t('common.download') || 'تنزيل')}
            </Button>

            {/* ══════════════ Hidden PDF canvas ══════════════ */}
            <div ref={pdfRef} style={{ display: 'none', position: 'absolute', top: '-9999px', left: '-9999px', width: '210mm', direction: 'rtl' }}>

                {/* ══ PAGE 1 – Contract details ══ */}
                <div className="pdf-page relative overflow-hidden" style={{ width: '210mm', height: '297mm', backgroundColor: '#f8fafc' }}>

                    {/* Background: cover template */}
                    <div className="absolute inset-0" style={{ backgroundImage: `url(${COVER_BASE64})`, backgroundSize: 'cover', backgroundPosition: 'center', zIndex: 0 }} />

                    {/* Watermark */}
                    <div className="absolute inset-0" style={{ backgroundImage: `url(${WATERMARK_BASE64})`, backgroundSize: '160mm', backgroundPosition: 'center', backgroundRepeat: 'repeat', opacity: 0.02, zIndex: 1 }} />

                    {/* ── Content ── starts below template header */}
                    <div className="relative" style={{ zIndex: 2, padding: '70mm 14mm 12mm 14mm', height: '100%', display: 'flex', flexDirection: 'column', gap: '6mm' }}>

                        {/* ── Header row ── */}
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: '6mm', borderBottom: '2px solid rgba(15,23,42,0.08)' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                {/* Fake QR Code for "Official" look */}
                                <div style={{ width: '46px', height: '46px', background: '#fff', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <QrCode style={{ width: '100%', height: '100%', color: '#0f172a' }} />
                                </div>
                                <div>
                                    <h1 style={{ fontSize: '24px', fontWeight: 900, color: '#0f172a', margin: '0 0 2px', lineHeight: 1.1, letterSpacing: '-0.5px' }}>
                                        وثيقة إثبات سعي
                                    </h1>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                        <BadgeCheck style={{ width: '12px', height: '12px', color: '#10b981' }} />
                                        <p style={{ fontSize: '10px', color: '#10b981', fontWeight: 700, margin: 0, letterSpacing: '0.3px' }}>
                                            موثق إلكترونياً
                                        </p>
                                    </div>
                                </div>
                            </div>
                            
                            {/* Request badge */}
                            <div style={{ background: '#ffffff', border: '1px solid rgba(15,23,42,0.1)', borderRadius: '12px', padding: '8px 14px', textAlign: 'left', minWidth: '120px', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
                                <div style={{ fontSize: '9px', color: '#64748b', fontWeight: 600, marginBottom: '2px', letterSpacing: '0.2px' }}>الرقم المرجعي</div>
                                <div style={{ fontSize: '14px', fontWeight: 900, color: '#0f172a', fontFamily: 'monospace', letterSpacing: '0.5px' }}>
                                    {commission.commissionNumber}
                                </div>
                                <div style={{ marginTop: '2px', fontSize: '9px', color: '#94a3b8', fontWeight: 600 }}>{fmtDate(commission.createdAt)}</div>
                            </div>
                        </div>

                        {/* ── Parties ── */}
                        <Card>
                            <SectionHeading>بيانات الأطراف المعنية</SectionHeading>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                                {/* Owner */}
                                <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '12px' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                                        <span style={{ width: '24px', height: '24px', borderRadius: '6px', background: '#e0f2fe', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: 800, color: '#0369a1', flexShrink: 0 }}>١</span>
                                        <span style={{ fontSize: '13px', fontWeight: 900, color: '#1e293b' }}>المالك / البائع</span>
                                    </div>
                                    <div style={{ marginBottom: '6px' }}>
                                        <Label>الاسم الكامل</Label>
                                        <Value>{commission.owner?.name}</Value>
                                    </div>
                                    <div>
                                        <Label>رقم الهوية</Label>
                                        <Value mono>{commission.owner?.idNumber}</Value>
                                    </div>
                                </div>
                                {/* Buyer */}
                                <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '12px' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                                        <span style={{ width: '24px', height: '24px', borderRadius: '6px', background: '#dbeafe', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: 800, color: '#1d4ed8', flexShrink: 0 }}>٢</span>
                                        <span style={{ fontSize: '13px', fontWeight: 900, color: '#1e293b' }}>المشتري</span>
                                    </div>
                                    <div style={{ marginBottom: '6px' }}>
                                        <Label>الاسم الكامل</Label>
                                        <Value>{commission.buyer?.name}</Value>
                                    </div>
                                    <div>
                                        <Label>رقم الهوية</Label>
                                        <Value mono>{commission.buyer?.idNumber}</Value>
                                    </div>
                                </div>
                            </div>
                        </Card>

                        {/* ── Property ── */}
                        <Card>
                            <SectionHeading>تفاصيل العقار المبرم عليه العقد</SectionHeading>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
                                <Cell label="نوع العقار" value={commission.propertyType} />
                                <Cell label="المدينة" value={commission.city} />
                                <Cell label="الحي" value={commission.neighborhood} />
                                <Cell label="المساحة" value={commission.area ? `${commission.area} م²` : undefined} />
                                <Cell label="رقم الصك" value={commission.deedNumber} mono span />
                            </div>
                        </Card>

                        {/* ── Financial ── */}
                        <div style={{
                            background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
                            borderRadius: '16px',
                            padding: '18px 20px',
                            color: '#fff',
                            boxShadow: '0 8px 25px rgba(15,23,42,0.2)',
                            position: 'relative',
                            overflow: 'hidden'
                        }}>
                            {/* Decorative background element */}
                            <div style={{ position: 'absolute', top: '-20px', left: '-20px', width: '120px', height: '120px', background: 'rgba(255,255,255,0.03)', borderRadius: '50%', zIndex: 0 }} />
                            <div style={{ position: 'absolute', bottom: '-40px', right: '10%', width: '180px', height: '180px', background: 'rgba(255,255,255,0.02)', borderRadius: '50%', zIndex: 0 }} />
                            
                            <div style={{ position: 'relative', zIndex: 1 }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
                                    <div style={{ width: '4px', height: '16px', background: '#38bdf8', borderRadius: '4px' }} />
                                    <span style={{ fontSize: '13px', fontWeight: 900, color: '#f8fafc', letterSpacing: '0.3px' }}>التفاصيل المالية لعملية الوساطة</span>
                                </div>

                                {/* Stats Row */}
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px', marginBottom: '16px' }}>
                                    <div style={{ background: 'rgba(255,255,255,0.06)', borderRadius: '10px', padding: '10px' }}>
                                        <span style={{ fontSize: '9px', color: '#94a3b8', display: 'block', marginBottom: '4px', textTransform: 'uppercase' }}>المبلغ الإجمالي</span>
                                        <span style={{ fontSize: '16px', fontWeight: 800, color: '#fff', lineHeight: 1 }}>{fmt(commission.totalAmount)} <span style={{ fontSize: '10px', fontWeight: 600, color: '#94a3b8' }}>ر.س</span></span>
                                    </div>
                                    <div style={{ background: 'rgba(255,255,255,0.06)', borderRadius: '10px', padding: '10px' }}>
                                        <span style={{ fontSize: '9px', color: '#94a3b8', display: 'block', marginBottom: '4px', textTransform: 'uppercase' }}>النسبة المتفق عليها</span>
                                        <span style={{ fontSize: '16px', fontWeight: 800, color: '#38bdf8', lineHeight: 1 }}>{commission.commissionPercentage || 0}%</span>
                                    </div>
                                    <div style={{ background: 'rgba(255,255,255,0.06)', borderRadius: '10px', padding: '10px' }}>
                                        <span style={{ fontSize: '9px', color: '#94a3b8', display: 'block', marginBottom: '4px', textTransform: 'uppercase' }}>نوع العملية</span>
                                        <span style={{ fontSize: '14px', fontWeight: 800, color: '#fff', lineHeight: 1 }}>{commission.type === 'sale' ? 'بيع' : commission.type === 'rent' ? 'تأجير' : commission.type || '—'}</span>
                                    </div>
                                </div>

                                {/* Commission highlight */}
                                <div style={{
                                    background: 'rgba(255,255,255,0.1)',
                                    border: '1px solid rgba(255,255,255,0.2)',
                                    borderRadius: '12px',
                                    padding: '14px 18px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'space-between',
                                    backdropFilter: 'blur(5px)'
                                }}>
                                    <div>
                                        <span style={{ fontSize: '11px', color: '#e2e8f0', display: 'block', marginBottom: '2px', fontWeight: 800 }}>قيمة السعي المستحقة</span>
                                        <span style={{ fontSize: '9px', color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                            <div style={{ width: '4px', height: '4px', borderRadius: '50%', background: '#10b981' }}/>
                                            شاملة ضريبة القيمة المضافة (١٥٪)
                                        </span>
                                    </div>
                                    <div style={{ textAlign: 'left' }}>
                                        <span style={{ fontSize: '26px', fontWeight: 900, color: '#ffffff', letterSpacing: '-0.5px' }}>
                                            {fmt(commission.commissionAmount)}
                                        </span>
                                        <span style={{ fontSize: '12px', color: '#94a3b8', marginRight: '6px', fontWeight: 700 }}>ر.س</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* ── Signatures ── */}
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginTop: 'auto' }}>
                            {['إقرار وتوقيع المالك / البائع', 'إقرار وتوقيع المشتري'].map(lbl => (
                                <div key={lbl} style={{
                                    background: 'rgba(248,250,252,0.6)',
                                    border: '1.5px dashed rgba(203,213,225,0.8)',
                                    borderRadius: '12px',
                                    padding: '12px',
                                    minHeight: '60px',
                                    position: 'relative'
                                }}>
                                    <span style={{ fontSize: '10px', color: '#64748b', fontWeight: 700, position: 'absolute', top: '12px', right: '12px' }}>{lbl}</span>
                                    {/* Fake signature line */}
                                    <div style={{ position: 'absolute', bottom: '16px', left: '20px', right: '20px', height: '1px', background: 'rgba(203,213,225,0.6)' }} />
                                </div>
                            ))}
                        </div>

                        {/* ── Footer ── */}
                        <div style={{ paddingTop: '5mm', borderTop: '1px solid rgba(15,23,42,0.1)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <div style={{ width: '24px', height: '24px', borderRadius: '4px', background: '#0f172a', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <span style={{ color: '#fff', fontSize: '12px', fontWeight: 900 }}>D</span>
                                </div>
                                <div>
                                    <p style={{ fontSize: '9px', color: '#475569', margin: '0 0 2px', fontWeight: 700 }}>الوساطة الرقمية العقارية</p>
                                    <p style={{ fontSize: '7.5px', color: '#94a3b8', margin: 0 }}>مُعتمد وموثق برقم ترخيص ١٢٠٠٠٠</p>
                                </div>
                            </div>
                            <div style={{ textAlign: 'left' }}>
                                <p style={{ fontSize: '9px', color: '#0f172a', margin: '0 0 2px', fontWeight: 800, fontFamily: 'monospace' }}>digitalbrokerage.sa</p>
                                <p style={{ fontSize: '7.5px', color: '#94a3b8', margin: 0 }}>المملكة العربية السعودية</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* ══ PAGE 2 – Thank You ══ */}
                <div className="pdf-page relative overflow-hidden" style={{ width: '210mm', height: '297mm', backgroundColor: '#0a0f1d' }}>
                    <img src="/ends.jpeg" alt="Thank You" className="absolute inset-0 w-full h-full object-cover" />
                </div>

            </div>
        </>
    );
};

export default CommissionPdfGenerator;
