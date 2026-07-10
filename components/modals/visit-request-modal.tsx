"use client";

import React, { useState, useMemo } from 'react';
import {
    Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
    ChevronLeft, ChevronRight, Calendar as CalendarIcon, Clock,
    UserCheck, User, Camera, Video, FileText, Radio, Moon, Sun,
} from 'lucide-react';
import {
    format, addMonths, subMonths, startOfMonth, endOfMonth,
    eachDayOfInterval, isSameDay, startOfToday,
} from 'date-fns';
import { ar, enUS } from 'date-fns/locale';
import { useLanguage } from '@/context/LanguageContext';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SaudiRiyalAmount } from "@/components/ui/saudi-riyal";

// ── Hijri helpers (lightweight, no extra dep) ──────────────────────────────
function toHijri(gDate: Date): { year: number; month: number; day: number } {
    // Meeus algorithm
    const jd =
        Math.floor((14 - (gDate.getMonth() + 1)) / 12);
    const y = gDate.getFullYear() + 4800 - jd;
    const m = (gDate.getMonth() + 1) + 12 * jd - 3;
    let jdn =
        gDate.getDate() +
        Math.floor((153 * m + 2) / 5) +
        365 * y +
        Math.floor(y / 4) -
        Math.floor(y / 100) +
        Math.floor(y / 400) -
        32045;
    let l = jdn - 1948440 + 10632;
    const n = Math.floor((l - 1) / 10631);
    l = l - 10631 * n + 354;
    const j =
        Math.floor((10985 - l) / 5316) * Math.floor((50 * l) / 17719) +
        Math.floor(l / 5670) * Math.floor((43 * l) / 15238);
    l =
        l -
        Math.floor((30 - j) / 15) * Math.floor((17719 * j) / 50) -
        Math.floor(j / 16) * Math.floor((15238 * j) / 43) +
        29;
    const month = Math.floor((24 * l) / 709);
    const day = l - Math.floor((709 * month) / 24);
    const year = 30 * n + j - 30;
    return { year, month, day };
}

const HIJRI_MONTHS_AR = [
    'محرم', 'صفر', 'ربيع الأول', 'ربيع الآخر',
    'جمادى الأولى', 'جمادى الآخرة', 'رجب', 'شعبان',
    'رمضان', 'شوال', 'ذو القعدة', 'ذو الحجة',
];
const HIJRI_MONTHS_EN = [
    'Muharram', 'Safar', 'Rabi I', 'Rabi II',
    'Jumada I', 'Jumada II', 'Rajab', "Sha'ban",
    'Ramadan', 'Shawwal', "Dhul Qi'dah", 'Dhul Hijjah',
];

// ── Types ──────────────────────────────────────────────────────────────────
type VisitMode = 'proxy' | 'self';
type CalendarType = 'hijri' | 'gregorian';
type RecordingType = 'video' | 'live';
type Step = 'type' | 'calendar' | 'recording' | 'confirm';

// ── Visit service prices ─────────────────────────────────────────────────
const VISIT_PRICES = {
    proxy_video: 400,
    proxy_live:  600,
    self:        200,
} as const;

interface VisitRequestModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (data: any) => void;
    loading?: boolean;
}

export default function VisitRequestModal({
    isOpen, onClose, onSubmit, loading,
}: VisitRequestModalProps) {
    const { language } = useLanguage();
    const isAr = language === 'ar';

    // ── State ──────────────────────────────────────────────────────────────
    const [visitMode, setVisitMode] = useState<VisitMode>('proxy');

    // Proxy-mode sub-steps
    const [step, setStep] = useState<Step>('type');
    const [calType, setCalType] = useState<CalendarType>('gregorian');

    // Calendar & time (shared)
    const [currentMonth, setCurrentMonth] = useState(new Date());
    const [selectedDate, setSelectedDate] = useState<Date | null>(null);
    const [selectedTime, setSelectedTime] = useState<string | null>(null);

    // Recording (Proxy only)
    const [recordingType, setRecordingType] = useState<RecordingType | null>(null);

    // Self-visit state (simple calendar)
    const [selfCurrentMonth, setSelfCurrentMonth] = useState(new Date());
    const [selfDate, setSelfDate] = useState<Date | null>(null);
    const [selfTime, setSelfTime] = useState<string | null>(null);

    // ── Derived: visit service price ──────────────────────────────────────
    const visitPriceAmount: number = visitMode === 'self'
        ? VISIT_PRICES.self
        : recordingType === 'live'
            ? VISIT_PRICES.proxy_live
            : VISIT_PRICES.proxy_video;
    const visitPriceLocale = language === 'ar' ? 'ar-SA' : 'en-US';

    // ── Labels ────────────────────────────────────────────────────────────
    const T = {
        proxyTab:      isAr ? 'زيارة بالنيابة' : 'Visit by Proxy',
        selfTab:       isAr ? 'زيارة شخصية'    : 'Personal Visit',
        title:         isAr ? 'طلب زيارة العقار' : 'Request Property Visit',
        hijri:         isAr ? 'التقويم الهجري'  : 'Hijri Calendar',
        gregorian:     isAr ? 'التقويم الميلادي': 'Gregorian Calendar',
        chooseDate:    isAr ? 'اختر تاريخ الزيارة' : 'Choose Visit Date',
        chooseTime:    isAr ? 'اختر وقت الزيارة'   : 'Choose Visit Time',
        recordingType: isAr ? 'نوع التسجيل'   : 'Recording Type',
        videoRec:      isAr ? 'تسجيل فيديو'   : 'Video Recording',
        liveStream:    isAr ? 'بث مباشر'       : 'Live Streaming',
        confirm:       isAr ? 'تأكيد الحجز'   : 'Confirm Booking',
        cancel:        isAr ? 'إلغاء'          : 'Cancel',
        next:          isAr ? 'التالي'         : 'Next',
        back:          isAr ? 'رجوع'           : 'Back',
        send:          isAr ? 'إرسال الطلب'    : 'Send Request',
        sending:       isAr ? 'جاري الإرسال...' : 'Sending...',
        proxyInfo:     isAr
            ? 'سيتم تعيين وكيل لزيارة العقار نيابةً عنك، مع توثيق الزيارة.'
            : 'An agent will visit the property on your behalf and document the visit.',
        selfInfo:      isAr
            ? 'حدد موعد زيارتك الشخصية وسيتم إشعار المالك.'
            : 'Set a date for your personal visit. The owner will be notified.',
        selectCalType: isAr ? 'اختر نوع التقويم'  : 'Select Calendar Type',
        summary:       isAr ? 'ملخص الحجز'        : 'Booking Summary',
        visitDate:     isAr ? 'التاريخ'           : 'Date',
        visitTime:     isAr ? 'الوقت'             : 'Time',
        visitMode:     isAr ? 'نوع الزيارة'       : 'Visit Mode',
        recType:       isAr ? 'التسجيل'           : 'Recording',
    };

    // ── Calendar helpers ───────────────────────────────────────────────────
    const locale = isAr ? ar : enUS;
    const today = startOfToday();

    const daysInMonth = useMemo(() => {
        const s = startOfMonth(currentMonth);
        const e = endOfMonth(currentMonth);
        return eachDayOfInterval({ start: s, end: e });
    }, [currentMonth]);

    const selfDaysInMonth = useMemo(() => {
        const s = startOfMonth(selfCurrentMonth);
        const e = endOfMonth(selfCurrentMonth);
        return eachDayOfInterval({ start: s, end: e });
    }, [selfCurrentMonth]);

    const timeSlots = Array.from({ length: 11 }, (_, i) => `${i + 10}:00`);

    const hijriLabel = (date: Date) => {
        const h = toHijri(date);
        const mName = isAr ? HIJRI_MONTHS_AR[h.month - 1] : HIJRI_MONTHS_EN[h.month - 1];
        return `${h.day} ${mName} ${h.year}هـ`;
    };

    const calHeaderLabel = () => {
        if (calType === 'gregorian') {
            return format(currentMonth, 'MMMM yyyy', { locale });
        }
        const hm = toHijri(new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 15));
        const mName = isAr ? HIJRI_MONTHS_AR[hm.month - 1] : HIJRI_MONTHS_EN[hm.month - 1];
        return `${mName} ${hm.year}هـ`;
    };

    const dayLabel = (date: Date) => {
        if (calType === 'gregorian') return format(date, 'd');
        return String(toHijri(date).day);
    };

    // ── Handlers ──────────────────────────────────────────────────────────
    const resetAll = () => {
        setStep('type');
        setSelectedDate(null); setSelectedTime(null); setRecordingType(null);
        setSelfDate(null); setSelfTime(null);
        setCurrentMonth(new Date()); setSelfCurrentMonth(new Date());
        setCalType('gregorian');
    };

    const handleClose = () => { resetAll(); onClose(); };

    const handleConfirm = () => {
        if (visitMode === 'proxy') {
            if (!selectedDate || !selectedTime || !recordingType) return;
            const [h, m] = selectedTime.split(':').map(Number);
            const finalDate = new Date(selectedDate);
            finalDate.setHours(h, m);
            onSubmit({ visitType: 'agent', visitDate: finalDate, calendarType: calType, recordingType });
        } else {
            if (!selfDate || !selfTime) return;
            const [h, m] = selfTime.split(':').map(Number);
            const finalDate = new Date(selfDate);
            finalDate.setHours(h, m);
            onSubmit({ visitType: 'self', visitDate: finalDate });
        }
    };

    // ── Step navigation ────────────────────────────────────────────────────
    const canGoNext = () => {
        if (step === 'type') return true;
        if (step === 'calendar') return !!selectedDate && !!selectedTime;
        if (step === 'recording') return !!recordingType;
        return false;
    };

    const goNext = () => {
        if (step === 'type') setStep('calendar');
        else if (step === 'calendar') setStep('recording');
        else if (step === 'recording') setStep('confirm');
    };
    const goBack = () => {
        if (step === 'calendar') setStep('type');
        else if (step === 'recording') setStep('calendar');
        else if (step === 'confirm') setStep('recording');
    };

    // ── Step progress bar ──────────────────────────────────────────────────
    const steps: Step[] = ['type', 'calendar', 'recording', 'confirm'];
    const stepIndex = steps.indexOf(step);

    // ── Day header labels ──────────────────────────────────────────────────
    const dayHeaders = isAr
        ? ['أح', 'إث', 'ثل', 'أر', 'خم', 'جم', 'سب']
        : ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

    // ── Re-usable calendar component (internal) ────────────────────────────
    const renderCalendar = (
        days: Date[],
        month: Date,
        prevFn: () => void,
        nextFn: () => void,
        selDate: Date | null,
        onSelect: (d: Date) => void,
        selTime: string | null,
        onTime: (t: string) => void,
        showCalTypeToggle = false,
    ) => (
        <div className="space-y-4">
            {/* Calendar type toggle (proxy only) */}
            {showCalTypeToggle && (
                <div className="flex gap-2 p-1 bg-muted rounded-xl">
                    {(['gregorian', 'hijri'] as CalendarType[]).map(ct => (
                        <button
                            key={ct}
                            onClick={() => setCalType(ct)}
                            className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-bold transition-all ${
                                calType === ct
                                    ? 'bg-slate-900 text-white shadow'
                                    : 'text-slate-500 hover:text-slate-700'
                            }`}
                        >
                            {ct === 'hijri' ? <Moon className="w-3.5 h-3.5" /> : <Sun className="w-3.5 h-3.5" />}
                            {ct === 'hijri' ? T.hijri : T.gregorian}
                        </button>
                    ))}
                </div>
            )}

            {/* Month nav */}
            <div className="flex items-center justify-between">
                <Button variant="ghost" size="sm" onClick={prevFn}>
                    {isAr ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
                </Button>
                <h3 className="font-bold text-sm text-slate-800">{calHeaderLabel()}</h3>
                <Button variant="ghost" size="sm" onClick={nextFn}>
                    {isAr ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                </Button>
            </div>

            {/* Day headers */}
            <div className="grid grid-cols-7 gap-1 text-center text-xs">
                {dayHeaders.map(d => (
                    <div key={d} className="text-slate-400 font-bold py-1">{d}</div>
                ))}
                {Array.from({ length: startOfMonth(month).getDay() }).map((_, i) => (
                    <div key={`e-${i}`} />
                ))}
                {days.map(date => {
                    const isSel = selDate && isSameDay(date, selDate);
                    const isPast = date < today;
                    return (
                        <button
                            key={date.toString()}
                            disabled={isPast}
                            onClick={() => { onSelect(date); onTime(''); }}
                            className={`
                                relative p-1.5 rounded-lg text-xs font-semibold transition-all
                                ${isSel ? 'bg-slate-900 text-white' : isPast ? 'text-slate-300 cursor-not-allowed' : 'hover:bg-muted text-slate-700'}
                            `}
                        >
                            {dayLabel(date)}
                            {calType === 'hijri' && !isPast && (
                                <span className="absolute -bottom-3 left-1/2 -translate-x-1/2 text-[8px] text-slate-400 leading-none whitespace-nowrap">
                                    {format(date, 'd')}
                                </span>
                            )}
                        </button>
                    );
                })}
            </div>

            {/* Hijri sub-labels spacer */}
            {calType === 'hijri' && <div className="h-3" />}

            {/* Selected date display */}
            {selDate && (
                <div className="text-center text-xs text-slate-500 font-medium bg-muted rounded-lg py-1.5">
                    {calType === 'hijri' ? hijriLabel(selDate) : format(selDate, 'dd MMMM yyyy', { locale })}
                </div>
            )}

            {/* Time slots */}
            {selDate && (
                <div>
                    <p className="text-xs font-bold text-slate-600 mb-2 flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" /> {T.chooseTime}
                    </p>
                    <div className="grid grid-cols-4 gap-1.5">
                        {timeSlots.map(t => (
                            <button
                                key={t}
                                onClick={() => onTime(t)}
                                className={`
                                    px-2 py-1.5 text-xs rounded-lg border font-semibold transition-all
                                    ${selTime === t
                                        ? 'bg-slate-900 text-white border-slate-900'
                                        : 'border text-slate-600 hover:bg-muted'}
                                `}
                            >
                                {t}
                            </button>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );

    // ── Render ─────────────────────────────────────────────────────────────
    return (
        <Dialog open={isOpen} onOpenChange={handleClose}>
            <DialogContent
                className="sm:max-w-[480px] bg-card rounded-2xl p-0 overflow-hidden gap-0"
                dir={isAr ? 'rtl' : 'ltr'}
            >
                {/* Header */}
                <DialogHeader className="px-6 pt-6 pb-4 border-b border">
                    <DialogTitle className="text-lg font-black text-slate-900">
                        {T.title}
                    </DialogTitle>

                    {/* Tab: Proxy / Self */}
                    <Tabs
                        value={visitMode}
                        onValueChange={v => { setVisitMode(v as VisitMode); resetAll(); }}
                        className="mt-3"
                    >
                        <TabsList className="grid w-full grid-cols-2 bg-muted rounded-xl p-1">
                            <TabsTrigger value="proxy" className="rounded-lg flex items-center gap-1.5 text-xs font-bold data-[state=active]:bg-slate-900 data-[state=active]:text-white">
                                <UserCheck className="w-3.5 h-3.5" />
                                {T.proxyTab}
                            </TabsTrigger>
                            <TabsTrigger value="self" className="rounded-lg flex items-center gap-1.5 text-xs font-bold data-[state=active]:bg-slate-900 data-[state=active]:text-white">
                                <User className="w-3.5 h-3.5" />
                                {T.selfTab}
                            </TabsTrigger>
                        </TabsList>
                    </Tabs>
                </DialogHeader>

                {/* Body */}
                <div className="px-6 py-5 overflow-y-auto max-h-[60vh]">
                    {/* ── PROXY MODE ── */}
                    {visitMode === 'proxy' && (
                        <div className="space-y-5">
                            {/* Step progress */}
                            <div className="flex gap-1.5">
                                {steps.map((s, i) => (
                                    <div
                                        key={s}
                                        className={`h-1 flex-1 rounded-full transition-all ${i <= stepIndex ? 'bg-slate-900' : 'bg-muted'}`}
                                    />
                                ))}
                            </div>

                            {/* Step: type info */}
                            {step === 'type' && (
                                <div className="space-y-4">
                                    <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-4">
                                        <p className="text-sm text-indigo-800 font-medium leading-relaxed">
                                            {T.proxyInfo}
                                        </p>
                                    </div>
                                    <div className="text-center py-2">
                                        <p className="text-xs text-slate-500 font-medium">
                                            {isAr ? 'اضغط "التالي" لتحديد التاريخ والوقت' : 'Press "Next" to choose date and time'}
                                        </p>
                                    </div>
                                </div>
                            )}

                            {/* Step: calendar */}
                            {step === 'calendar' && (
                                <div className="space-y-1">
                                    <p className="text-xs font-bold text-slate-600 mb-3 flex items-center gap-1">
                                        <CalendarIcon className="w-3.5 h-3.5" /> {T.chooseDate}
                                    </p>
                                    {renderCalendar(
                                        daysInMonth,
                                        currentMonth,
                                        () => setCurrentMonth(subMonths(currentMonth, 1)),
                                        () => setCurrentMonth(addMonths(currentMonth, 1)),
                                        selectedDate,
                                        (d) => setSelectedDate(d),
                                        selectedTime,
                                        (t) => setSelectedTime(t),
                                        true,
                                    )}
                                </div>
                            )}

                            {/* Step: recording type */}
                            {step === 'recording' && (
                                <div className="space-y-3">
                                    <p className="text-xs font-bold text-slate-600 flex items-center gap-1">
                                        <Video className="w-3.5 h-3.5" /> {T.recordingType}
                                    </p>
                                    <p className="text-xs text-slate-500">
                                        {isAr
                                            ? 'اختر طريقة توثيق الزيارة (اختيار واحد فقط)'
                                            : 'Choose how the visit will be documented (select one)'}
                                    </p>
                                    <div className="grid grid-cols-2 gap-3">
                                        {([
                                            { id: 'video', label: T.videoRec, icon: Video, desc: isAr ? 'تسجيل الزيارة وإرسالها لاحقاً' : 'Visit recorded and sent to you' },
                                            { id: 'live',  label: T.liveStream, icon: Radio, desc: isAr ? 'مشاهدة الزيارة مباشرة' : 'Watch the visit in real time' },
                                        ] as const).map(opt => (
                                            <button
                                                key={opt.id}
                                                onClick={() => setRecordingType(opt.id)}
                                                className={`
                                                    flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all text-center
                                                    ${recordingType === opt.id
                                                        ? 'border-slate-900 bg-slate-900 text-white'
                                                        : 'border text-slate-600 hover:border-slate-400'}
                                                `}
                                            >
                                                <opt.icon className="w-6 h-6" />
                                                <span className="text-xs font-bold">{opt.label}</span>
                                                <span className={`text-[10px] leading-tight ${recordingType === opt.id ? 'text-slate-300' : 'text-slate-400'}`}>
                                                    {opt.desc}
                                                </span>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Step: confirm summary */}
                            {step === 'confirm' && (
                                <div className="space-y-4">
                                    <div className="bg-muted border border rounded-xl p-4 space-y-3">
                                        <h3 className="font-bold text-slate-900 text-sm">{T.summary}</h3>
                                        <div className="space-y-2 text-sm">
                                            <div className="flex justify-between">
                                                <span className="text-slate-500">{T.visitMode}</span>
                                                <span className="font-semibold text-slate-800">{T.proxyTab}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-slate-500">{T.visitDate}</span>
                                                <span className="font-semibold text-slate-800">
                                                    {selectedDate && (
                                                        calType === 'hijri'
                                                            ? hijriLabel(selectedDate)
                                                            : format(selectedDate, 'dd MMM yyyy', { locale })
                                                    )}
                                                </span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-slate-500">{T.visitTime}</span>
                                                <span className="font-semibold text-slate-800">{selectedTime}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-slate-500">{T.recType}</span>
                                                <span className="font-semibold text-slate-800">
                                                    {recordingType === 'video' ? T.videoRec : T.liveStream}
                                                </span>
                                            </div>
                                            <div className="border-t border my-1" />
                                            <div className="flex justify-between items-center">
                                                <span className="text-slate-600 font-bold">
                                                    {isAr ? 'تكلفة الخدمة' : 'Service Fee'}
                                                </span>
                                                <span className="text-xl font-black text-slate-900">
                                                    <SaudiRiyalAmount amount={visitPriceAmount} locale={visitPriceLocale} minimumFractionDigits={0} maximumFractionDigits={0} />
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                    <p className="text-xs text-slate-500 leading-relaxed">
                                        {isAr
                                            ? 'بالضغط على "إرسال الطلب" سيتم إنشاء الحجز ومعالجة الدفع تلقائياً.'
                                            : 'By pressing "Send Request" the booking will be created and payment processed.'}
                                    </p>
                                </div>
                            )}
                        </div>
                    )}

                    {/* ── SELF MODE ── */}
                    {visitMode === 'self' && (
                        <div className="space-y-4">
                            <div className="bg-muted border border rounded-xl p-4 text-sm text-gray-600">
                                {T.selfInfo}
                            </div>
                            <p className="text-xs font-bold text-slate-600 flex items-center gap-1">
                                <CalendarIcon className="w-3.5 h-3.5" /> {T.chooseDate}
                            </p>
                            {/* Calendar (no Hijri toggle for self) */}
                            <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <Button variant="ghost" size="sm" onClick={() => setSelfCurrentMonth(subMonths(selfCurrentMonth, 1))}>
                                        {isAr ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
                                    </Button>
                                    <h3 className="font-bold text-sm text-slate-800">
                                        {format(selfCurrentMonth, 'MMMM yyyy', { locale })}
                                    </h3>
                                    <Button variant="ghost" size="sm" onClick={() => setSelfCurrentMonth(addMonths(selfCurrentMonth, 1))}>
                                        {isAr ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                                    </Button>
                                </div>

                                <div className="grid grid-cols-7 gap-1 text-center text-xs">
                                    {dayHeaders.map(d => (
                                        <div key={d} className="text-slate-400 font-bold py-1">{d}</div>
                                    ))}
                                    {Array.from({ length: startOfMonth(selfCurrentMonth).getDay() }).map((_, i) => (
                                        <div key={`e-${i}`} />
                                    ))}
                                    {selfDaysInMonth.map(date => {
                                        const isSel = selfDate && isSameDay(date, selfDate);
                                        const isPast = date < today;
                                        return (
                                            <button
                                                key={date.toString()}
                                                disabled={isPast}
                                                onClick={() => { setSelfDate(date); setSelfTime(null); }}
                                                className={`
                                                    p-1.5 rounded-lg text-xs font-semibold transition-all
                                                    ${isSel ? 'bg-slate-900 text-white' : isPast ? 'text-slate-300 cursor-not-allowed' : 'hover:bg-muted text-slate-700'}
                                                `}
                                            >
                                                {format(date, 'd')}
                                            </button>
                                        );
                                    })}
                                </div>

                                {selfDate && (
                                    <div>
                                        <p className="text-xs font-bold text-slate-600 mb-2 flex items-center gap-1">
                                            <Clock className="w-3.5 h-3.5" /> {T.chooseTime}
                                        </p>
                                        <div className="grid grid-cols-4 gap-1.5">
                                            {timeSlots.map(t => (
                                                <button
                                                    key={t}
                                                    onClick={() => setSelfTime(t)}
                                                    className={`
                                                        px-2 py-1.5 text-xs rounded-lg border font-semibold transition-all
                                                        ${selfTime === t
                                                            ? 'bg-slate-900 text-white border-slate-900'
                                                            : 'border text-slate-600 hover:bg-muted'}
                                                    `}
                                                >
                                                    {t}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <DialogFooter className="px-6 py-4 border-t border bg-muted">
                    {/* Live price badge — always visible */}
                    <div className="flex items-center justify-between w-full mb-3 px-1">
                        <span className="text-xs text-slate-500 font-medium">
                            {isAr ? 'تكلفة الزيارة' : 'Visit Fee'}
                        </span>
                        <span className="text-base font-black text-slate-900 bg-card border border px-3 py-1 rounded-xl shadow-sm">
                            <SaudiRiyalAmount amount={visitPriceAmount} locale={visitPriceLocale} minimumFractionDigits={0} maximumFractionDigits={0} />
                        </span>
                    </div>

                    <div className="flex gap-2 w-full">
                        {/* Back / Cancel */}
                        {visitMode === 'proxy' && step !== 'type' ? (
                            <Button variant="outline" className="flex-1" onClick={goBack} disabled={loading}>
                                {T.back}
                            </Button>
                        ) : (
                            <Button variant="outline" className="flex-1" onClick={handleClose} disabled={loading}>
                                {T.cancel}
                            </Button>
                        )}

                        {/* Next / Submit */}
                        {visitMode === 'proxy' ? (
                            step === 'confirm' ? (
                                <Button
                                    className="flex-1 bg-slate-900 hover:bg-slate-800 text-white"
                                    onClick={handleConfirm}
                                    disabled={loading}
                                >
                                    {loading ? T.sending : T.send}
                                </Button>
                            ) : (
                                <Button
                                    className="flex-1 bg-slate-900 hover:bg-slate-800 text-white"
                                    onClick={goNext}
                                    disabled={!canGoNext()}
                                >
                                    {T.next}
                                </Button>
                            )
                        ) : (
                            <Button
                                className="flex-1 bg-slate-900 hover:bg-slate-800 text-white"
                                onClick={handleConfirm}
                                disabled={loading || !selfDate || !selfTime}
                            >
                                {loading ? T.sending : T.send}
                            </Button>
                        )}
                    </div>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
