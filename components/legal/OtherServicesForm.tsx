"use client";

import { useState } from "react";
import { useLanguage } from "@/context/LanguageContext";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Upload, X, Loader2 } from "lucide-react";
import { legalServicesApi } from "@/lib/legal-services";
import toast from "react-hot-toast";

interface OtherServicesFormProps {
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function OtherServicesForm({ onSuccess, onCancel }: OtherServicesFormProps) {
  const { t } = useLanguage();
  
  const [serviceType, setServiceType] = useState<string>("استشارات قانونية");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  
  // Consultation fields
  const [consultationTopic, setConsultationTopic] = useState("");
  const [consultationDetails, setConsultationDetails] = useState("");
  
  // Report fields
  const [role, setRole] = useState("");
  const [propertyType, setPropertyType] = useState("");
  const [propertyLocation, setPropertyLocation] = useState("");
  const [offerNumber, setOfferNumber] = useState("");
  const [reportDetails, setReportDetails] = useState("");
  const [legalStatus, setLegalStatus] = useState("");
  
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const serviceTypes = ["استشارات قانونية", "تقارير قانونية"];
  const roles = ["بائع", "مشتري", "وسيط", "مستثمر"];
  const propertyTypes = [
    "شقة",
    "فيلا",
    "أرض",
    "عمارة",
    "استراحة",
    "محل تجاري",
    "مكتب",
    "مستودع"
  ];

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      const newFiles = Array.from(files);
      setUploadedFiles(prev => [...prev, ...newFiles]);
    }
  };

  const removeFile = (index: number) => {
    setUploadedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Validate required fields
      if (!name || !phone) {
        toast.error(t('legal.error'));
        setIsSubmitting(false);
        return;
      }

      // Upload documents
      let documentIds: string[] = [];
      if (uploadedFiles.length > 0) {
        const uploadResponse = await legalServicesApi.uploadLegalDocuments(uploadedFiles, 'other');
        documentIds = uploadResponse.files.map((file: any) => file.id || file.url);
      }

      // Prepare service data based on type
      const serviceData: any = {
        serviceType,
        name,
        phone,
        email,
        documentIds,
      };

      if (serviceType === "استشارات قانونية") {
        serviceData.consultationTopic = consultationTopic;
        serviceData.consultationDetails = consultationDetails;
      } else {
        serviceData.userRole = role;
        serviceData.propertyType = propertyType;
        serviceData.propertyLocation = propertyLocation;
        serviceData.offerNumber = offerNumber;
        serviceData.reportDetails = reportDetails;
        serviceData.legalStatus = legalStatus;
      }

      await legalServicesApi.createOtherService(serviceData);
      
      toast.success(t('legal.success'));
      if (onSuccess) onSuccess();
      
    } catch (error: any) {
      console.error(error);
      const errorMessage = error.response?.data?.message || error.message || t('legal.error');
      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="rounded-xl border border-amber-100 bg-amber-50 p-5">
        <h2 className="text-xl sm:text-2xl font-bold text-gray-800 mb-2">{t('legal.other.new')}</h2>
        <p className="text-gray-600 text-sm">اختر نوع الخدمة: استشارة قانونية أو تقرير قانوني.</p>
      </div>

      {/* Service Type */}
      <div>
        <Label>{t('legal.other.serviceType')} *</Label>
        <Select value={serviceType} onValueChange={setServiceType}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {serviceTypes.map(type => (
              <SelectItem key={type} value={type}>{type}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Common Fields */}
      <div className="grid grid-cols-1 md:grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label>{t('legal.other.name')} *</Label>
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={t('legal.other.namePlaceholder')}
            required
          />
        </div>

        <div>
          <Label>{t('legal.other.phone')} *</Label>
          <Input
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder={t('legal.other.phonePlaceholder')}
            required
          />
        </div>

        <div className="md:col-span-2">
          <Label>{t('legal.dispute.email')}</Label>
          <Input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder={t('legal.dispute.emailPlaceholder')}
          />
        </div>
      </div>

      {/* Consultation Fields */}
      {serviceType === "استشارات قانونية" && (
        <div className="space-y-4 p-3 sm:p-6 bg-muted rounded-lg">
          <h3 className="text-lg font-semibold text-gray-800">{t('legal.other.consultation')}</h3>
          
          <div>
            <Label>{t('legal.other.consultationTopic')} *</Label>
            <Textarea
              value={consultationTopic}
              onChange={(e) => setConsultationTopic(e.target.value)}
              placeholder={t('legal.other.consultationTopicPlaceholder')}
              rows={4}
              required
            />
          </div>

          <div>
            <Label>{t('legal.other.consultationDetails')}</Label>
            <Textarea
              value={consultationDetails}
              onChange={(e) => setConsultationDetails(e.target.value)}
              placeholder={t('legal.other.consultationDetailsPlaceholder')}
              rows={6}
            />
          </div>
        </div>
      )}

      {/* Legal Report Fields */}
      {serviceType === "تقارير قانونية" && (
        <div className="space-y-4 p-3 sm:p-6 bg-muted rounded-lg">
          <h3 className="text-lg font-semibold text-gray-800">{t('legal.other.report')}</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>{t('legal.other.role')} *</Label>
              <Select value={role} onValueChange={setRole}>
                <SelectTrigger>
                  <SelectValue placeholder={t('legal.other.rolePlaceholder')} />
                </SelectTrigger>
                <SelectContent>
                  {roles.map(r => (
                    <SelectItem key={r} value={r}>{r}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>{t('legal.other.propertyType')} *</Label>
              <Select value={propertyType} onValueChange={setPropertyType}>
                <SelectTrigger>
                  <SelectValue placeholder={t('legal.other.propertyTypePlaceholder')} />
                </SelectTrigger>
                <SelectContent>
                  {propertyTypes.map(type => (
                    <SelectItem key={type} value={type}>{type}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>{t('legal.other.propertyLocation')}</Label>
              <Input
                value={propertyLocation}
                onChange={(e) => setPropertyLocation(e.target.value)}
                placeholder={t('legal.other.propertyLocationPlaceholder')}
              />
            </div>

            <div>
              <Label>{t('legal.other.offerNumber')}</Label>
              <Input
                value={offerNumber}
                onChange={(e) => setOfferNumber(e.target.value)}
                placeholder={t('legal.other.offerNumberPlaceholder')}
              />
            </div>
          </div>

          <div>
            <Label>{t('legal.other.reportDetails')}</Label>
            <Textarea
              value={reportDetails}
              onChange={(e) => setReportDetails(e.target.value)}
              rows={4}
            />
          </div>

          <div className="p-4 bg-muted border border-blue-200 rounded-lg">
            <Label className="text-blue-800">{t('legal.other.legalStatus')}</Label>
            <Textarea
              value={legalStatus}
              onChange={(e) => setLegalStatus(e.target.value)}
              className="mt-2 bg-card"
              placeholder={t('legal.other.legalStatusPlaceholder') || "ضع الوضع القانوني للعقار"}
              rows={4}
            />
          </div>
        </div>
      )}

      {/* File Upload */}
      <div className="space-y-4">
        <Label>{t('legal.other.uploadDocs')}</Label>
        <p className="text-xs text-gray-500">الصيغ المسموحة: كل الصيغ الشائعة (PDF, DOC, DOCX, صور)</p>
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-3 sm:p-6 text-center">
          <input
            type="file"
            multiple
            accept=".pdf,.doc,.docx,image/*"
            onChange={handleFileUpload}
            className="hidden"
            id="file-upload"
          />
          <label htmlFor="file-upload" className="cursor-pointer">
            <Upload className="mx-auto h-12 w-12 text-gray-400" />
            <p className="mt-2 text-sm text-gray-600">{t('legal.uploadFilesDesc')}</p>
          </label>
        </div>

        {uploadedFiles.length > 0 && (
          <div className="space-y-2">
            <p className="text-sm font-medium">{t('legal.filesUploaded')}:</p>
            {uploadedFiles.map((file, index) => (
              <div key={index} className="flex items-center justify-between p-2 bg-muted rounded">
                <span className="text-sm truncate">{file.name}</span>
                <button
                  type="button"
                  onClick={() => removeFile(index)}
                  className="text-red-500 hover:text-red-700"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex gap-4 justify-end">
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel}>
            {t('legal.cancel')}
          </Button>
        )}
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              {t('legal.submitting')}
            </>
          ) : (
            t('legal.submit')
          )}
        </Button>
      </div>
    </form>
  );
}
